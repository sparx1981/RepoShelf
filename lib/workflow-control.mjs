import {fail} from './accounts.mjs';
const root='https://api.github.com/repos/sparx1981/RepoShelf/actions/workflows/';
const names=new Set(['catalog.yml','publication.yml','submissions.yml']);
export function catalogueSchedule(now=Date.now()){
 const time=Number(now),sync=new Date(time),publication=new Date(time);
 sync.setUTCMinutes(17,0,0);if(sync.getUTCHours()%2)sync.setUTCHours(sync.getUTCHours()+1);if(sync.getTime()<=time)sync.setUTCHours(sync.getUTCHours()+2);
 publication.setUTCHours(6,35,0,0);if(publication.getTime()<=time)publication.setUTCDate(publication.getUTCDate()+1);
 return {checkedAt:new Date(time).toISOString(),nextSyncAt:sync.toISOString(),nextPublicationAt:publication.toISOString()};
}
export function createWorkflowControl({fetcher=fetch,token=process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN}={}){
 const configured=Boolean(token);
 async function request(name,suffix,options={}){
  if(!names.has(name))throw Error('Unsupported workflow');
  const response=await fetcher(root+name+suffix,{...options,headers:{Accept:'application/vnd.github+json','User-Agent':'RepoShelf-maintenance','X-GitHub-Api-Version':'2022-11-28',...token?{Authorization:'Bearer '+token}:{},...options.headers},redirect:'error',signal:AbortSignal.timeout(4000)});
  if(!response.ok)fail(503,'workflow_unavailable','GitHub workflow access failed (HTTP '+response.status+'). Check the repository Actions token and retry.');
  return response;
 }
 async function history(name){const data=await (await request(name,'/runs?branch=main&per_page=30')).json();if(!Array.isArray(data.workflow_runs))fail(503,'invalid_history','Workflow history is unavailable; no action was requested.');return data.workflow_runs}
 async function active(){const groups=await Promise.all(['catalog.yml','publication.yml','submissions.yml'].map(history));return groups.flat().filter(r=>r.status!=='completed')}
 async function publish({scheduled=false}={}){
  if(!configured)fail(503,'actions_token_required','Configure REPOSHELF_ACTIONS_TOKEN to publish from RepoShelf. You can also run Publish saved catalogue directly in GitHub Actions.');
  const busy=await active();if(busy.length)return {requested:false,reason:'A sync, submission scan or publication is active. Retry after it finishes.',activeRunId:busy[0].id};
  // Recheck publication immediately before dispatch; the shared workflow group prevents overlapping writes.
  if((await history('publication.yml')).some(r=>r.status!=='completed'))return {requested:false,reason:'A publication is already active.'};
  try{await request('publication.yml','/dispatches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{scheduled}})})}catch(error){if(!error.status)fail(503,'dispatch_unconfirmed','GitHub did not confirm the request. Refresh workflow history before retrying; it may already have been accepted.');throw error}
  return {requested:true,reason:'Publication requested. Check Sync log for the publication and deployment status.'};
 }
 async function sync(){
  if(!configured)fail(503,'actions_token_required','Configure REPOSHELF_ACTIONS_TOKEN to sync from RepoShelf. You can also run Refresh demo catalog directly in GitHub Actions.');
  const busy=await active();if(busy.length)return {requested:false,reason:'A sync, submission scan or publication is active. Retry after it finishes.',activeRunId:busy[0].id};
  if((await history('catalog.yml')).some(r=>r.status!=='completed'))return {requested:false,reason:'A sync is already active.'};
  try{await request('catalog.yml','/dispatches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{refresh_previews:false,watchdog_recovery:false}})})}catch(error){if(!error.status)fail(503,'dispatch_unconfirmed','GitHub did not confirm the request. Refresh workflow history before retrying; it may already have been accepted.');throw error}
  return {requested:true,reason:'Sync requested. Results will be saved for daily publication; use Publish now after the sync finishes to make them live sooner.'};
 }
 return {configured,history,active,publish,sync};
}
