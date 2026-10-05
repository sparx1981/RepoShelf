import {createAccounts,respond,accountFailure,only,readBody,fail} from '../lib/accounts.mjs';
import {createCheckpointStore} from '../lib/checkpoint-store.mjs';
import {publicationSummary} from '../lib/publication-policy.mjs';
import {createWorkflowControl} from '../lib/workflow-control.mjs';
export function createPublicationHandler({accounts=createAccounts(),checkpoint=createCheckpointStore(),control=createWorkflowControl()}={}){return async(req,res)=>{try{
 only(req,['GET','POST']);if(req.method==='POST')accounts.origin(req);await accounts.admin(req,res);
 if(req.method==='POST'){const body=await readBody(req,{limit:1024});if(body?.action!=='publish')fail(400,'invalid_action','Choose publish.');const result=await control.publish();if(!result.requested)fail(409,'workflow_busy',result.reason);return respond(res,202,result)}
 const [state,runs]=await Promise.all([checkpoint.json('data/publication.json'),control.history('publication.yml').catch(()=>null)]);
 return respond(res,200,{...publicationSummary(state),controlConfigured:control.configured,runs:runs?.slice(0,5).map(r=>({id:r.id,status:r.conclusion||r.status,startedAt:r.run_started_at||r.created_at,url:'https://github.com/sparx1981/RepoShelf/actions/runs/'+r.id}))||[],historyAvailable:runs!==null});
 }catch(e){accountFailure(res,e)}}}
export default createPublicationHandler();
