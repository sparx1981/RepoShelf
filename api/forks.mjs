import {randomUUID} from 'node:crypto';
import {createAccounts,respond,accountFailure,only,fail,readBody} from '../lib/accounts.mjs';
const full=s=>typeof s==='string'&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s);
export function createForksHandler({accounts=createAccounts(),fetcher=fetch,now=()=>Date.now()}={}){return async(req,res)=>{let lease,person;try{
only(req,['GET','POST']);if(req.method==='POST')accounts.origin(req);
person=await accounts.user(req,res);
const params=new URL(req.url,accounts.config.origin).searchParams;
if(req.method==='GET'){
const cursor=params.get('cursor');if(cursor&&!/^[0-9]+$/.test(cursor))fail(400,'invalid_cursor','Invalid fork cursor.');
const q=new URLSearchParams({select:'*',user_id:'eq.'+person.id,order:'github_fork_id.asc',limit:'500'});if(cursor)q.set('github_fork_id','gt.'+cursor);
const [rows,states]=await Promise.all([accounts.request('/rest/v1/user_forks?'+q,{token:person.token}),accounts.request('/rest/v1/fork_sync_state?user_id=eq.'+person.id,{token:person.token})]);
const state=states?.[0];return respond(res,200,{items:rows.map(r=>({id:r.project_id,repo:{...r.parent_data,full:r.project_id},verified:true,available:r.available,url:'https://github.com/'+r.fork_full,checkedAt:r.verified_at,lastAttemptAt:r.last_attempt_at})),nextCursor:rows.length===500?String(rows.at(-1).github_fork_id):null,sync:{completedAt:state?.completed_at||null,lastAttemptAt:state?.last_attempt_at||null,error:state?.last_error||null,inProgress:Boolean(state&&state.page_offset||state&&state.page>1)}});
}
await readBody(req);if(!person.githubId)fail(403,'github_identity_required','Sign in using your GitHub account to verify public forks.');
if(!accounts.config.serviceKey)fail(503,'fork_storage_not_configured','Fork verification needs the server-side Supabase secret key.');
lease=randomUUID();const state=await accounts.request('/rest/v1/rpc/reposhelf_begin_fork_sync',{service:true,method:'POST',body:{owner_id:person.id,github_id:person.githubId,lease}});
if(!state)fail(409,'sync_in_progress','Your forks are already being checked. Try again shortly.');
const deadline=now()+18000;const github=async(path,authenticated=true)=>{if(now()>deadline)fail(503,'github_temporary','GitHub verification took too long. Saved forks are preserved.');let response;try{response=await fetcher('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'RepoShelf','X-GitHub-Api-Version':'2022-11-28',...authenticated&&person.githubToken?{Authorization:'Bearer '+person.githubToken}:{}},redirect:'error',signal:AbortSignal.timeout(3000)})}catch{fail(503,'github_temporary','GitHub is temporarily unavailable. Saved forks are preserved.')}if(response.status===401&&authenticated&&person.githubToken)return github(path,false);if(response.status===404)return null;if(!response.ok)fail(response.status===403||response.status===429?429:503,'github_temporary','GitHub verification is temporarily unavailable or rate limited. Saved forks are preserved; retry later.');return response.json()};
let page=state.page,offset=state.page_offset,recheckId=state.recheck_id,completed=false,count=0;
try{
const identity=await github('/user/'+person.githubId);if(!identity||String(identity.id)!==person.githubId||!full(identity.login+'/placeholder'))fail(503,'github_identity_unavailable','Your GitHub identity could not be verified. Saved forks are preserved.');
const save=async d=>{if(!d||d.private||!d.fork||String(d.owner?.id)!==person.githubId||!d.parent||d.parent.private||!full(d.full_name)||!full(d.parent.full_name))return false;
const p=d.parent,at=new Date(now()).toISOString();
return {user_id:person.id,github_fork_id:d.id,github_owner_id:person.githubId,project_id:p.full_name,fork_full:d.full_name,parent_data:{full:p.full_name,name:p.name,description:p.description||'A public project in your fork collection.',category:'Other',language:p.language,stars:p.stargazers_count,forks:p.forks_count,created:p.created_at,updated:p.pushed_at,demo:null,color:'#25392f',ink:'#d1e5c5'},available:true,verified_at:at,last_attempt_at:at};};
const write=async row=>{if(!row)return;await accounts.request('/rest/v1/rpc/reposhelf_save_verified_fork',{service:true,method:'POST',body:{entry:row}});count++};
// Check a saved fork each batch, preserving it on temporary failures.
const saved=await accounts.request('/rest/v1/user_forks?user_id=eq.'+person.id+'&github_fork_id=gt.'+recheckId+'&order=github_fork_id.asc&limit=1',{service:true});
if(saved?.length){const prior=saved[0],d=await github('/repositories/'+prior.github_fork_id),row=await save(d);if(row)await write(row);else await accounts.request('/rest/v1/user_forks?user_id=eq.'+person.id+'&github_fork_id=eq.'+prior.github_fork_id,{service:true,method:'PATCH',body:{available:false,last_attempt_at:new Date(now()).toISOString()}});recheckId=prior.github_fork_id}else recheckId=0;
const list=await github('/users/'+encodeURIComponent(identity.login)+'/repos?type=owner&sort=full_name&direction=asc&per_page=100&page='+page);if(!Array.isArray(list))fail(503,'github_temporary','GitHub repositories could not be checked.');
let checks=0;while(offset<list.length){const f=list[offset];if(f.fork&&String(f.owner?.id)===person.githubId){if(checks>=3)break;checks++;await write(await save(await github('/repositories/'+f.id)))}offset++}
if(offset>=list.length){if(list.length<100){page=1;offset=0;completed=true}else{page++;offset=0}}
await accounts.request('/rest/v1/fork_sync_state?user_id=eq.'+person.id+'&lease_token=eq.'+lease,{service:true,method:'PATCH',body:{page,page_offset:offset,recheck_id:recheckId,last_error:null,lease_token:null,lease_until:null,...completed?{completed_at:new Date(now()).toISOString()}: {}}});lease=null;
return respond(res,200,{verified:count,complete:completed,message:completed?'Public fork verification completed.':'Public forks saved. Continue checking to scan the remaining repositories.'});
}catch(e){await accounts.request('/rest/v1/fork_sync_state?user_id=eq.'+person.id+'&lease_token=eq.'+lease,{service:true,method:'PATCH',body:{page,page_offset:offset,recheck_id:recheckId,last_error:e.message,lease_token:null,lease_until:null}}).catch(()=>{});lease=null;throw e}
}catch(e){accountFailure(res,e)}}}
export default createForksHandler();
