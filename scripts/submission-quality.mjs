import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {runDemoProbe} from './demo-probe-runner.mjs';
import {recordDemoResult} from './demo-health.mjs';
import {applyListingControls,savedListingControls} from '../lib/listing-policy.mjs';
const Q=createRequire(import.meta.url)('../dist/quality.js');
export function createSubmissionQualifier({root=new URL('../',import.meta.url),probe=runDemoProbe,now=Date.now,controls=()=>savedListingControls(root)}={}){return async entry=>{
 const allowed=applyListingControls([entry],await controls());if(!allowed.length)return {entry,details:{status:'rejected',reason:'catalogue_moderation'}};entry=allowed[0];
 const name=createHash('sha256').update(entry.full).digest('hex').slice(0,24)+'.jpg',scratch=await mkdtemp(join(tmpdir(),'reposhelf-submission-')),file=join(scratch,name);
 try{
  const result=await probe({target:entry.demo,screenshot:file},{timeout:45000}),at=new Date(now()).toISOString();
  entry={...entry,...recordDemoResult(entry,result,now())};
  if(result.kind==='working'&&result.screenshot){
   await mkdir(new URL('dist/previews/',root),{recursive:true});await writeFile(new URL('dist/previews/'+name,root),await readFile(file));
   entry={...entry,screenshots:[{src:'previews/'+name,kind:'demo',url:entry.demo,capturedAt:at},...(entry.screenshots||[]).filter(s=>s.kind!=='demo')].slice(0,6),previewAttemptAt:at,previewCheck:{url:entry.demo,status:'captured',reason:null,attemptedAt:at,consecutiveFailures:0,nextCheckAt:new Date(now()+7*86400000).toISOString()}};
   if(Q.publishedEligible(entry,now()))return {entry,details:{status:'accepted',demoCheckedAt:entry.demoHealth.checkedAt,screenshotCapturedAt:at}};
  }
  const failures=(entry.previewCheck?.consecutiveFailures||0)+1;entry={...entry,previewAttemptAt:at,previewCheck:{url:entry.demo,status:'retry',reason:result.reason||'screenshot_error',attemptedAt:at,consecutiveFailures:failures,nextCheckAt:entry.demoHealth.nextCheckAt}};
  return {entry,details:{status:entry.demoHealth.status==='unavailable'?'rejected':'retry',reason:result.reason||(result.kind==='working'?'screenshot_error':'demo_validation'),nextAttemptAt:entry.demoHealth.nextCheckAt}};
 }finally{await rm(scratch,{recursive:true,force:true})}
}}
