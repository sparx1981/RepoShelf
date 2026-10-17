import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {saveCheckpoint,CHECKPOINT_BRANCH} from '../scripts/catalog-publication.mjs';
Object.assign(process.env,{GIT_AUTHOR_NAME:'test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'test',GIT_COMMITTER_EMAIL:'test@example.invalid',GIT_CONFIG_GLOBAL:'/dev/null'});
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const dir=await mkdtemp(join(tmpdir(),'reposhelf-ckpt-'));
try{
  const remote=join(dir,'remote.git'),work=join(dir,'work');
  git(dir,'init','--bare','-b','main',remote);git(dir,'clone','-q',remote,work);
  await mkdir(join(work,'data'),{recursive:true});await writeFile(join(work,'README.md'),'x\n');git(work,'add','.');git(work,'commit','-qm','base');git(work,'push','-q','origin','HEAD:main');
  const base=git(work,'rev-parse','HEAD');
  const tips=[];
  for(let i=1;i<=4;i++){await writeFile(join(work,'data','state.json'),JSON.stringify({run:i}));tips.push(await saveCheckpoint(work,{base}))}
  assert.equal(git(remote,'rev-list','--count',`refs/heads/${CHECKPOINT_BRANCH}`),String(2),'the checkpoint branch is the base commit plus one checkpoint, however many are saved');
  assert.equal(git(remote,'rev-parse',`refs/heads/${CHECKPOINT_BRANCH}`),tips.at(-1),'the newest checkpoint is the tip');
  assert.equal(git(remote,'rev-parse',`refs/heads/${CHECKPOINT_BRANCH}^`),base,'a checkpoint hangs off the main commit it was taken from');
  assert.equal(git(remote,'show',`refs/heads/${CHECKPOINT_BRANCH}:data/state.json`),JSON.stringify({run:4}));
  // Main can move on between a sync's first job and its last (a workflow file edited, a page changed). The checkpoint is taken on
  // the older main commit, so it may differ from that commit only in the generated data: GitHub refuses to let an Actions
  // token push a change to a workflow file, and that refusal failed real syncs.
  await mkdir(join(work,'.github','workflows'),{recursive:true});await writeFile(join(work,'.github','workflows','checks.yml'),'name: old\n');await writeFile(join(work,'api.mjs'),'old\n');git(work,'add','.');git(work,'commit','-qm','workflow v1');git(work,'push','-q','origin','HEAD:main');
  const older=git(work,'rev-parse','HEAD');
  await writeFile(join(work,'.github','workflows','checks.yml'),'name: new, added later\n');await writeFile(join(work,'.github','workflows','extra.yml'),'name: extra\n');await writeFile(join(work,'api.mjs'),'new\n');git(work,'add','.');git(work,'commit','-qm','workflow v2');
  await writeFile(join(work,'data','state.json'),JSON.stringify({run:5}));
  const moved=await saveCheckpoint(work,{base:older});
  assert.equal(git(remote,'rev-parse',`refs/heads/${CHECKPOINT_BRANCH}`),moved);
  assert.equal(git(remote,'show',`refs/heads/${CHECKPOINT_BRANCH}:.github/workflows/checks.yml`),'name: old','workflow files in the checkpoint are exactly the base commit\'s');
  assert.equal(git(remote,'ls-tree','-r','--name-only',`refs/heads/${CHECKPOINT_BRANCH}`,'--','.github').split('\n').join(','),'.github/workflows/checks.yml','a workflow file that exists only on the newer main is not carried in');
  assert.equal(git(remote,'diff','--name-only',older,`refs/heads/${CHECKPOINT_BRANCH}`,'--','.github').trim(),'','the checkpoint changes no workflow file relative to its base');
  assert.equal(git(remote,'show',`refs/heads/${CHECKPOINT_BRANCH}:data/state.json`),JSON.stringify({run:5}),'the generated data is still saved');
  console.log('PASS: checkpoints replace each other (the branch stays two commits long: the base and the newest checkpoint), keep the main commit as base for recovery, and the newest is the tip.');
}finally{await rm(dir,{recursive:true,force:true})}
