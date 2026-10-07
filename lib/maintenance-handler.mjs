import {createHash,timingSafeEqual} from 'node:crypto';
import {respond,accountFailure,only,fail} from '../lib/accounts.mjs';
import {recoverSync} from '../scripts/sync-watchdog.mjs';
import {createCheckpointStore} from '../lib/checkpoint-store.mjs';
import {scheduledPublicationDue} from '../lib/publication-policy.mjs';
import {createWorkflowControl} from '../lib/workflow-control.mjs';
const digest=value=>createHash('sha256').update(value).digest();
// A timer check must not fail because one GitHub request was slow or briefly unavailable. Only reads are retried:
// a POST that timed out may already have been accepted.
export function retryReads(fetcher){return async(url,options={})=>{const read=!options.method||options.method==='GET';let last;for(let attempt=0;attempt<(read?2:1);attempt++){try{const response=await fetcher(url,attempt&&options.signal?{...options,signal:AbortSignal.timeout(4000)}:options);if(!read||response.status<500)return response;last=response}catch(error){if(!read||attempt===1)throw error;last=null}}return last}}
export function createMaintenanceHandler({fetcher=retryReads(fetch),key=process.env.REPOSHELF_SCHEDULER_KEY,token=process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN,checkpoint=createCheckpointStore({fetcher}),control=createWorkflowControl({fetcher,token}),now=Date.now}={}){return async(req,res)=>{try{
 only(req,['POST']);
 if(!key||key.length<32)fail(503,'scheduler_not_configured','The independent scheduler is not configured.');
 const supplied=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!timingSafeEqual(digest(supplied),digest(key)))fail(401,'unauthorized','Scheduler authentication required.');
 if(!token)fail(503,'actions_token_required','The repository Actions token is not configured.');
 const time=now(),date=new Date(time),inWindow=date.getUTCHours()*60+date.getUTCMinutes()>=395,state=await checkpoint.json('data/publication.json',4000)??await checkpoint.json('data/publication.json',4000);
 // Publication has priority once its daily window opens. Unknown state fails closed.
 if(state&&inWindow&&scheduledPublicationDue(state,time)){
  const publication=await control.publish({scheduled:true});return respond(res,publication.requested?202:200,{publication});
 }
 if((await control.active()).length)return respond(res,200,{action:'wait',reason:'A catalogue, submission or publication workflow is active.'});
 // Saved publication state only matters once the daily window is open; before then, catch-up must not wait for it.
 if(state===null&&inWindow)fail(503,'publication_state_unavailable','Saved publication state is unavailable. No new request was made; retry on the next timer check.');
 const sync=await recoverSync({fetcher:(url,options)=>fetcher(url,{...options,signal:AbortSignal.timeout(4000)}),token,now:time});
 return respond(res,sync.action==='requested'?202:200,{sync,publicationStateAvailable:state!==null});
 }catch(e){console.warn('Maintenance check failed: '+(e.code||'unexpected')+' - '+(e.message||e));accountFailure(res,e)}}}
export default createMaintenanceHandler();
