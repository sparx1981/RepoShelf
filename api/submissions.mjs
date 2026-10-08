import {createAccounts,respond,accountFailure,readBody,only,fail} from '../lib/accounts.mjs';
import {requireLegal} from '../lib/legal.mjs';
import {repositoryName,publicRepository,workerAccess} from '../lib/submissions.mjs';
import {createCheckpointStore} from '../lib/checkpoint-store.mjs';
import {nextPublicationAt,publicationSummary} from '../lib/publication-policy.mjs';
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const safeItem=row=>{if(!row)return row;const {lease,lease_until,...item}=row;return item};
async function capabilities(accounts,options){try{return await accounts.request('/rest/v1/rpc/reposhelf_submission_capabilities',{...options,method:'POST',body:{}})}catch(e){if(e.code==='migration_required'||e.status===404)return {version:1,cancel:false};throw e}}
export function createSubmissionsHandler({accounts=createAccounts(),fetcher=fetch,key=process.env.REPOSHELF_SUBMISSION_SYNC_KEY,workflowToken=process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN,checkpoint=createCheckpointStore({fetcher}),now=Date.now}={}){return async(req,res)=>{try{
 only(req,['GET','POST']);const params=new URL(req.url,accounts.config.origin).searchParams,action=params.get('action')||'mine';
 if(['claim','complete','pending'].includes(action)){
  only(req,['POST']);workerAccess(req,key);const body=await readBody(req);
  if(body?.id!=null&&!uuid(body.id))fail(400,'invalid_submission','Choose a valid submission.');
  let version=1;if(body?.requireVersion===2){const supported=await capabilities(accounts,{service:true});if(supported.version!==2)fail(503,'migration_required','Apply migration 26 to enable targeted submission quality checks.');version=2}
  if(action==='pending'){const at=new Date(now()).toISOString(),found=await accounts.request('/rest/v1/repository_submissions?select=id&limit=1'+(body?.id?'&id=eq.'+body.id:'')+'&or='+encodeURIComponent(`(and(status.in.(queued,retry),next_attempt_at.lte.${at}),and(status.eq.processing,lease_until.lt.${at}))`),{service:true});return respond(res,200,{pending:Array.isArray(found)&&found.length>0,...version===2?{version}:{} })}
  if(action==='claim'){if(version===2||body?.id)return respond(res,200,{items:await accounts.request('/rest/v1/rpc/reposhelf_claim_submissions_v2',{service:true,method:'POST',body:{submission:body.id||null}})});return respond(res,200,{items:await accounts.request('/rest/v1/rpc/reposhelf_claim_submissions',{service:true,method:'POST',body:{}})})}
  if(!body?.id||!body.lease||!['imported','retry','unavailable'].includes(body.status)||body.canonical&&repositoryName(body.canonical)!==body.canonical)fail(400,'invalid_result','Invalid scan result.');
  const args={submission:body.id,claim:body.lease,result:body.status,canonical:body.canonical||null,has_demo:body.withDemo===true,published_commit:body.commit||null};
  if(body.details){if(typeof body.details!=='object'||Array.isArray(body.details))fail(400,'invalid_result','Invalid scan details.');args.details=Object.fromEntries(['status','reason','demoCheckedAt','screenshotCapturedAt','nextAttemptAt'].filter(k=>typeof body.details[k]==='string').map(k=>[k,body.details[k]]))}
  const result=await accounts.request('/rest/v1/rpc/'+(args.details?'reposhelf_finish_submission_v2':'reposhelf_finish_submission'),{service:true,method:'POST',body:args});return respond(res,200,{updated:result});
 }
 if(!['mine','cancel'].includes(action))fail(400,'invalid_action','Unknown submission action.');if(req.method==='POST')accounts.origin(req);const person=await accounts.user(req,res);if(!person.githubId)fail(403,'github_required','Connect your GitHub account to submit a repository.');
 if(action==='cancel'){only(req,['POST']);const input=await readBody(req);if(!uuid(input?.id))fail(400,'invalid_submission','Choose a valid submission.');const item=await accounts.request('/rest/v1/rpc/reposhelf_cancel_submission',{token:person.token,method:'POST',body:{submission:input.id}});return respond(res,200,{item:safeItem(item)})}
 if(req.method==='GET'){
  const cursor=Number(params.get('cursor')||0);if(!Number.isSafeInteger(cursor)||cursor<0||cursor>10000000)fail(400,'invalid_cursor','Invalid submission page.');
  const [items,supported,state]=await Promise.all([accounts.request('/rest/v1/repository_submissions?select=*&user_id=eq.'+encodeURIComponent(person.id)+'&order=created_at.desc,id.desc&limit=50&offset='+cursor,{token:person.token}),capabilities(accounts,{token:person.token}),checkpoint.json('data/publication.json',2000)]);
  return respond(res,200,{items:items.map(safeItem),nextCursor:items.length===50?cursor+50:null,workerConfigured:Boolean(key&&key.length>=32),canCancel:supported.cancel===true,qualityChecksReady:supported.version===2,publication:{...publicationSummary(state),nextScheduledAt:nextPublicationAt(now())}});
 }
 await requireLegal(accounts,person);workerAccess({headers:{authorization:'Bearer '+key}},key);const input=await readBody(req),repo=await publicRepository(repositoryName(input?.repository),{fetcher,token:person.githubToken}),saved=await accounts.request('/rest/v1/rpc/reposhelf_submit_repository',{service:true,method:'POST',body:{submitter:person.id,repository:repo.name,github_id:repo.id}});let scanRequested=false;
 if(saved.queued&&workflowToken){try{const dispatched=await fetcher('https://api.github.com/repos/sparx1981/RepoShelf/actions/workflows/submissions.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+workflowToken,Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'RepoShelf-submissions'},body:JSON.stringify({ref:'main',...uuid(saved.item?.id)?{inputs:{submission_id:saved.item.id}}:{}}),redirect:'error',signal:AbortSignal.timeout(4000)});scanRequested=dispatched.ok}catch{}}
 respond(res,202,{item:safeItem(saved.item),queued:saved.queued,scanRequested,publication:{nextScheduledAt:nextPublicationAt(now())}});
 }catch(e){accountFailure(res,e)}}}
export default createSubmissionsHandler();
