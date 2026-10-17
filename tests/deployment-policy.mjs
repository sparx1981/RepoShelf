import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {shouldBuild,changesSince} from '../scripts/deployment-policy.mjs';
// Vercel builds only the newest commit of a push. The deploy filter must still build when an earlier commit since the last
// successful deployment changed the application, and must never drop a real publication that sits among checkpoints.
const CP='Save catalogue recovery checkpoint';
assert.equal(shouldBuild(CP,['data/a.json'],'main','production',[CP,CP]),false,'only checkpoints, only generated files');
assert.equal(shouldBuild(CP,['data/a.json'],'main','production',[CP,'Refresh public demo catalog']),true,'a publication among the checkpoints builds');
assert.equal(shouldBuild('Fix tests',['tests/a.mjs','.github/workflows/checks.yml'],'main','production',['Fix tests','Add endpoint']),false,'paths decide verification-only; callers pass the whole range');
assert.equal(shouldBuild('Fix tests',['tests/a.mjs','api/agent.mjs'],'main','production',['Fix tests','Add endpoint']),true,'a server change anywhere in the range builds');
assert.equal(changesSince(undefined),null);assert.equal(changesSince('not a sha'),null);assert.equal(changesSince('abc1234; rm -rf /'),null);
assert.deepEqual(changesSince('abc1234',(...a)=>a[0]==='diff'?'api/a.mjs\ntests/b.mjs\n':'two\none\n'),{paths:['api/a.mjs','tests/b.mjs'],subjects:['two','one']});
assert.equal(changesSince('abc1234',()=>{throw Error('bad revision')}),null,'an unknown previous deployment means "build"');
// the real command in a real repository
const repo=mkdtempSync(join(tmpdir(),'deploy-policy-')),git=(...a)=>execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
git('init','-q','-b','main');git('config','user.email','t@example.org');git('config','user.name','t');
const write=(path,text)=>{mkdirSync(join(repo,path,'..'),{recursive:true});writeFileSync(join(repo,path),text)};
const commit=(message,path)=>{write(path,message+Math.random());git('add','-A');git('commit','-q','-m',message);return git('rev-parse','HEAD')};
const base=commit('Base','README.md');const server=commit('Add endpoint','api/agent.mjs');const test=commit('Cover endpoint','tests/agent.mjs');
const script=fileURLToPath(new URL('../scripts/deployment-policy.mjs',import.meta.url));
const run=(previous,extra={})=>spawnSync(process.execPath,[script],{cwd:repo,encoding:'utf8',env:{PATH:process.env.PATH,VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'main',...(previous?{VERCEL_GIT_PREVIOUS_SHA:previous}:{}),...extra}}).status;
assert.equal(run(base),1,'the server change is built even though the newest commit only touches tests');
assert.equal(run(server),0,'once the server change is deployed, a tests-only commit is skipped');
assert.equal(run(test),1,'a redeploy of an unchanged commit builds');
assert.equal(run('0123456789abcdef0123456789abcdef01234567'),1,'a previous deployment missing from the clone builds');
assert.equal(run(undefined),0,'without a previous deployment the newest commit decides (tests only: skip)');
assert.equal(run(base,{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature'}),0,'previews never build');
assert.equal(run('0123456789abcdef0123456789abcdef01234567',{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature'}),0,'previews never build, even when the range is unknown');
const published=commit('Refresh public demo catalog','data/runtime/catalog.json.gz');const checkpoint=commit(CP,'data/sync-runs/1.json');
assert.equal(run(server),1,'a publication followed by a checkpoint still builds');
const second=commit(CP,'data/sync-runs/2.json');assert.equal(run(published),0,'only checkpoints since the last deployment: skip');
console.log('PASS: the deploy filter looks at everything since the last successful deployment, builds when it cannot tell, and skips only verification-only and checkpoint-only ranges.');
