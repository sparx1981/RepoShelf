import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {saveCheckpoint,restoreCheckpoint,CHECKPOINT_BRANCH} from '../scripts/catalog-publication.mjs';
Object.assign(process.env,{GIT_AUTHOR_NAME:'test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'test',GIT_COMMITTER_EMAIL:'test@example.invalid',GIT_CONFIG_GLOBAL:'/dev/null'});
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const dir=await mkdtemp(join(tmpdir(),'reposhelf-ckpt-'));
try{
  const remote=join(dir,'remote.git'),work=join(dir,'work');
  git(dir,'init','--bare','-b','main',remote);git(dir,'clone','-q',remote,work);
  // GitHub refuses a push from an Actions token when a workflow file differs between the branch's old tip and the new one (the message is
  // copied from a real run). main is exempt here: the test pushes workflow files there directly.
  const hook=join(remote,'hooks','pre-receive');
  await writeFile(hook,[
   '#!/bin/sh',
   'zero=0000000000000000000000000000000000000000',
   'while read old new ref; do',
   '  case "$ref" in refs/heads/main) continue;; esac',
   '  [ "$new" = "$zero" ] && continue',
   '  if [ "$old" != "$zero" ]; then',
   '    changed=$(git diff --name-only "$old" "$new" -- .github/workflows)',
   '    if [ -n "$changed" ]; then echo "refusing to allow a GitHub App to create or update workflow $(echo $changed | cut -d" " -f1) without workflows permission" >&2; exit 1; fi',
   '  fi',
   'done',
   ''].join('\n'));await chmod(hook,0o755);
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
  assert.throws(()=>git(remote,'rev-parse','--verify','-q',`refs/heads/${CHECKPOINT_BRANCH}-next`),'the spare branch is gone again');
  assert.equal(git(remote,'rev-parse',`refs/heads/${CHECKPOINT_BRANCH}^`),older,'it is still one commit on its base');
  // The old tip had different workflow files, so the plain update was refused and the checkpoint replaced it through the spare branch.
  // A later checkpoint on the same base then updates normally.
  await writeFile(join(work,'data','state.json'),JSON.stringify({run:6}));const again=await saveCheckpoint(work,{base:older});
  assert.equal(git(remote,'rev-parse',`refs/heads/${CHECKPOINT_BRANCH}`),again);assert.equal(git(remote,'show',`refs/heads/${CHECKPOINT_BRANCH}:data/state.json`),JSON.stringify({run:6}));
  // An interrupted replacement (old branch deleted, new name not yet created) leaves the data on the spare branch, and a restore finds it.
  git(work,'push','-q','origin',`${again}:refs/heads/${CHECKPOINT_BRANCH}-next`);git(work,'push','-q','origin',`:refs/heads/${CHECKPOINT_BRANCH}`);
  const logs=console.log,lines=[];console.log=(...a)=>lines.push(a.join(' '));
  try{await restoreCheckpoint(work)}finally{console.log=logs}
  assert(!lines.some(l=>/No recovery checkpoint branch/.test(l)),'a restore falls back to the spare branch: '+lines.join('|'));
  console.log('PASS: checkpoints replace each other (the branch stays two commits long: the base and the newest checkpoint), keep the main commit as base for recovery, and the newest is the tip.');
}finally{await rm(dir,{recursive:true,force:true})}
