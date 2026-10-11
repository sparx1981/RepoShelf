import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {saveCheckpoint,CHECKPOINT_BRANCH} from '../scripts/catalog-publication.mjs';
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'t',GIT_AUTHOR_EMAIL:'t@t',GIT_COMMITTER_NAME:'t',GIT_COMMITTER_EMAIL:'t@t'}}).trim();
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
  console.log('PASS: checkpoints replace each other (the branch stays two commits long: the base and the newest checkpoint), keep the main commit as base for recovery, and the newest is the tip.');
}finally{await rm(dir,{recursive:true,force:true})}
