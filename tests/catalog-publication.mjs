import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {publicFileChanged,publishCatalog,restoreCheckpoint,CHECKPOINT_BRANCH} from '../scripts/catalog-publication.mjs';
import {createCheckpointStore} from '../lib/checkpoint-store.mjs';
import {diagnoseSync} from '../lib/sync-diagnostics.mjs';
const json=value=>JSON.stringify(value),before={updatedAt:'2026-10-04',repositories:[{full:'team/demo',stars:10,lastCheckedAt:'2026-10-03',enrichmentAttemptAt:'old'}]};
assert.equal(publicFileChanged('data/sync-runs/1.json','a','b'),false);assert.equal(publicFileChanged('data/browser-cycle.json','a','b'),false);assert.equal(publicFileChanged('data/browse/index.json','a','b'),false);
assert.equal(publicFileChanged('dist/catalog.json',json(before),json({...before,updatedAt:'2026-10-05',revalidation:{checked:0},repositories:[{...before.repositories[0],enrichmentAttemptAt:'new'}]})),false);
for(const field of ['stars','demo','lastCheckedAt','checkError','screenshots'])assert.equal(publicFileChanged('dist/catalog.json',json(before),json({...before,repositories:[{...before.repositories[0],[field]:'new'}]})),true,field+' is public data');
assert.equal(publicFileChanged('data/readmes/example.json.gz','a','b'),true);assert.equal(publicFileChanged('dist/previews/example.jpg','a','b'),true);assert.equal(publicFileChanged('dist/catalog.json','bad','also bad'),true);
assert.equal(JSON.parse(await readFile(new URL('../vercel.json',import.meta.url))).git.deploymentEnabled[CHECKPOINT_BRANCH],false);
const checkpointReport={id:'123',attempt:1,recordedAt:new Date().toISOString(),publication:'unchanged',stages:[],counts:{added:0,updated:0}};let requests=[];
const store=createCheckpointStore({fetcher:async(url,options)=>{requests.push({url,options});return Response.json(url.endsWith('.sync-checkpoint.json')?{schema:1,reportIds:['123','https://evil.test','../private']}:checkpointReport)}});
assert.equal((await store.reports(null)).length,1);assert(requests.every(r=>r.options.headers.Authorization===undefined));assert(requests.every(r=>r.url.startsWith('https://raw.githubusercontent.com/sparx1981/RepoShelf/reposhelf-checkpoints/')));const count=requests.length;await store.reports(['123']);assert.equal(requests.length,count,'Short cache avoids repeated raw GitHub requests');
const noChange=diagnoseSync({status:'completed',conclusion:'success'},[{steps:[{name:'Publish refreshed catalog',conclusion:'success'}]}],checkpointReport);assert.equal(noChange.publication,'unchanged');assert(noChange.message.includes('without requesting a deployment'));
const checkpoint=diagnoseSync({status:'in_progress'},[{steps:[{name:'Save discovery recovery checkpoint',conclusion:'success'}]}],{...checkpointReport,publication:'checkpoint_saved'});assert.equal(checkpoint.published,null,'Recovery branch is not publication');
let subprocesses=true;try{execFileSync(process.execPath,['-e','process.stdout.write("ready")'])}catch(e){if(e.code==='EPERM'&&!process.env.CI){subprocesses=false;console.log('Local sandbox blocks Git subprocess fixtures; integration runs in Actions.')}else throw e}
if(subprocesses){const root=await mkdtemp(join(tmpdir(),'reposhelf-publication-')),remote=join(root,'remote.git'),work=join(root,'work'),other=join(root,'other'),recover=join(root,'recover');const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:'pipe'});
try{
 await mkdir(work);git(root,'init','--bare',remote);git(work,'init','-b','main');git(work,'config','user.name','Test');git(work,'config','user.email','test@example.org');await mkdir(join(work,'dist'));await writeFile(join(work,'dist/catalog.json'),json(before));await writeFile(join(work,'app.txt'),'old');git(work,'add','.');git(work,'commit','-m','Initial');git(work,'remote','add','origin',remote);git(work,'push','-u','origin','main');const original=git(work,'rev-parse','HEAD').trim();
 await mkdir(join(work,'data/sync-runs'),{recursive:true});await writeFile(join(work,'data/sync-runs/123.json'),json(checkpointReport));await writeFile(join(work,'dist/catalog.json'),json({...before,updatedAt:'new'}));await publishCatalog(work,{checkpoint:true});assert.equal(git(work,'ls-remote','origin','main').split('\t')[0],original);assert.equal(git(work,'rev-parse','HEAD').trim(),original,'Checkpoints do not advance the working main');
 const unchanged=await publishCatalog(work);assert.equal(unchanged.published,false);assert.equal(git(work,'ls-remote','origin','main').split('\t')[0],original,'Log/timestamp-only work never pushes main');
 git(root,'clone','--branch','main',remote,other);git(other,'config','user.name','Test');git(other,'config','user.email','test@example.org');await writeFile(join(other,'app.txt'),'new source');git(other,'add','.');git(other,'commit','-m','Concurrent source');git(other,'push');
 await writeFile(join(work,'dist/catalog.json'),json({...before,repositories:[{...before.repositories[0],stars:20}]}));const published=await publishCatalog(work);assert.equal(published.published,true);assert.equal(await readFile(join(work,'app.txt'),'utf8'),'new source');assert.equal(Number(git(work,'rev-list','--count','origin/main')),3,'One source update plus one final catalogue commit');assert(!git(work,'log','--format=%s','origin/main').includes('recovery checkpoint'));
 // A later interrupted run retains both JSON and binary assets, without advancing main.
 const publishedMain=git(work,'rev-parse','HEAD').trim();await writeFile(join(work,'dist/catalog.json'),json({...before,repositories:[{...before.repositories[0],stars:30}],largePayload:'x'.repeat(2*1024*1024)}));await mkdir(join(work,'dist/previews'));const binary=Buffer.from([0,255,128,13,10]);await writeFile(join(work,'dist/previews/test.jpg'),binary);await publishCatalog(work,{checkpoint:true});assert.equal(git(work,'ls-remote','origin','main').split('\t')[0],publishedMain);
 git(root,'clone','--branch','main',remote,recover);const restored=await restoreCheckpoint(recover);assert(restored.restored>=2);assert.equal(JSON.parse(await readFile(join(recover,'dist/catalog.json'))).repositories[0].stars,30);assert.equal(JSON.parse(await readFile(join(recover,'dist/catalog.json'))).largePayload.length,2*1024*1024,'Large checkpoint JSON is not truncated');assert.deepEqual(await readFile(join(recover,'dist/previews/test.jpg')),binary);
 // Accumulation survives fresh runners; scheduled publication is once per UTC day.
 await mkdir(join(recover,'data/sync-runs'),{recursive:true});await writeFile(join(recover,'data/sync-runs/456.json'),json({...checkpointReport,id:'456',publication:'awaiting_publication'}));
 const oldMain=git(recover,'rev-parse','HEAD').trim();
 await publishCatalog(recover,{checkpoint:true,completed:true});assert.equal(git(recover,'ls-remote','origin','main').split('\t')[0],oldMain);
 const daily=await publishCatalog(recover,{scheduled:true,now:Date.parse('2026-10-06T06:35:00Z')});assert(daily.published);assert.deepEqual(await readFile(join(recover,'dist/previews/test.jpg')),binary);
 const reportAfter=JSON.parse(await readFile(join(recover,'data/sync-runs/456.json')));assert.equal(reportAfter.publication,'main_saved');assert.equal(reportAfter.publishedCommit,daily.commit);
 await writeFile(join(recover,'dist/catalog.json'),json({...before,repositories:[{...before.repositories[0],stars:40}]}));await publishCatalog(recover,{checkpoint:true,completed:true});
 assert.equal((await publishCatalog(recover,{scheduled:true,now:Date.parse('2026-10-06T08:00:00Z')})).alreadyHandled,true);
 assert.equal((await publishCatalog(recover,{now:Date.parse('2026-10-06T08:00:00Z')})).published,true,'Manual publishing is allowed after daily publishing');
 await writeFile(join(recover,'dist/catalog.json'),json({...before,repositories:[{...before.repositories[0],stars:50}]}));await publishCatalog(recover,{checkpoint:true,completed:true});
 // Newer generated main updates must survive recovery and reject conflicting publication.
 git(other,'pull','--rebase');await writeFile(join(other,'dist/catalog.json'),json({...before,repositories:[{...before.repositories[0],stars:99}]}));git(other,'add','.');git(other,'commit','-m','Concurrent catalogue');git(other,'push');git(recover,'reset','--hard','HEAD');git(recover,'pull','--rebase');const guarded=await restoreCheckpoint(recover);assert(guarded.conflicts>=1);assert.equal(JSON.parse(await readFile(join(recover,'dist/catalog.json'))).repositories[0].stars,99);
 await assert.rejects(()=>publishCatalog(work),/conflicts/);assert.equal(JSON.parse(git(other,'show','origin/main:dist/catalog.json')).repositories[0].stars,99);
}finally{await rm(root,{recursive:true,force:true})}
}
console.log('PASS: non-deploying checkpoints, final-only public publication, safe no-op detection, live diagnostics, concurrency protection and binary recovery.');
