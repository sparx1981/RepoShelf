// Availability is based on GitHub's repository API, never on a missing README or demo URL.
// Routine availability rechecks every 48 hours; temporary failures retry sooner.
export const CHECK_INTERVAL_MS=48*60*60*1000;
// One run takes about 75 minutes and runs follow each other, so about 14 a day. The cap was 750 a run (about 10,500 a day) while every listing
// is due every 48 hours (about 37,000 a day for 74,000 listings), so the queue of due checks only ever grew. GitHub's allowance (about 5,000 an
// hour) is not the limit: the plan below still keeps it in reserve.
export const RUNS_PER_DAY=14;
export const REPOSITORY_CHECK_CAP=Number.isInteger(Number(process.env.CATALOG_REVALIDATE_CAP))&&Number(process.env.CATALOG_REVALIDATE_CAP)>0?Number(process.env.CATALOG_REVALIDATE_CAP):2500;
export const REPOSITORY_CHECK_CONCURRENCY=3;
export function dueEntries(entries,now=Date.now(),limit=250){return entries.filter(r=>!r.nextCheckAt||Date.parse(r.nextCheckAt)<=now).filter(r=>!r.lastCheckedAt||now-Date.parse(r.lastCheckedAt)>=CHECK_INTERVAL_MS||r.checkError).sort((a,b)=>(Date.parse(a.lastAttemptAt||a.lastCheckedAt)||0)-(Date.parse(b.lastAttemptAt||b.lastCheckedAt)||0)).slice(0,limit)}
export function repositoryCheckPlan(entries,{remaining=null,authenticated=false,batch='auto'}={}){
 const desired=Math.max(500,Math.ceil(entries.length/10));
 const requested=batch==='auto'?desired:Number(batch);
 if(!Number.isInteger(requested)||requested<0)throw Error('Invalid repository check batch');
 const reserve=authenticated?200:10;
 const allowance=Number.isFinite(remaining)?Math.max(0,Math.floor(remaining)-reserve):authenticated?500:0;
 const limit=Math.min(requested,REPOSITORY_CHECK_CAP,allowance);
 return {limit,desired,allowance,reserve,remaining,checksPerDay:limit*RUNS_PER_DAY,dailyCapacitySufficient:limit*RUNS_PER_DAY>=entries.length/(CHECK_INTERVAL_MS/86400000),intervalHours:48};
}
export async function checkRepository(entry,{fetcher=fetch,headers={},now=Date.now()}={}){
const at=new Date(now).toISOString();
const retry=(kind,delay=6*60*60*1000)=>({entry:{...entry,lastAttemptAt:at,checkError:{kind,at},nextCheckAt:new Date(now+Math.max(delay,6*60*60*1000)).toISOString()},stop:kind==='rate_limit'||kind==='authentication'});
try{const conditional=entry.availability==='available'&&entry.lastAvailableAt&&entry.repositoryEtag&&entry.repositoryEtagFor===entry.full;
const res=await fetcher(`https://api.github.com/repos/${entry.full}`,{headers:{...headers,...conditional?{'If-None-Match':entry.repositoryEtag}:{}},signal:AbortSignal.timeout(12000)});
if(res.status===304){if(!conditional)return retry('invalid_response');const {checkError,nextCheckAt,...kept}=entry;return {entry:{...kept,lastCheckedAt:at,lastAttemptAt:at,lastAvailableAt:at},notModified:true,stop:false}}
if(res.status===404||res.status===410){const {checkError,nextCheckAt,...kept}=entry;return {entry:{...kept,availability:'unavailable',unavailableReason:'not_found',unavailableSince:entry.unavailableSince||at,lastCheckedAt:at,lastAttemptAt:at},stop:false}}
let limited=res.status===429;if(res.status===403){let message='';try{message=(await res.json()).message||''}catch{}limited=res.headers.get('x-ratelimit-remaining')==='0'||Boolean(res.headers.get('retry-after'))||/rate limit|abuse/i.test(message)}
if(limited){const delay=Math.max(Number(res.headers.get('retry-after')||0)*1000,Number(res.headers.get('x-ratelimit-reset')||0)*1000-now,0);return retry('rate_limit',delay)}
if(res.status===401)return retry('authentication');
if(!res.ok)return retry(res.status===403?'access_denied':'temporary');
const data=await res.json();if(typeof data.full_name!=='string'||typeof data.private!=='boolean')return retry('invalid_response');
const {checkError,nextCheckAt,unavailableSince,unavailableReason,...kept}=entry;
if(data.private||data.visibility&&data.visibility!=='public')return {entry:{...kept,availability:'unavailable',unavailableReason:'not_public',unavailableSince:entry.unavailableSince||at,lastCheckedAt:at,lastAttemptAt:at},data,stop:false};
const repositoryId=Number.isSafeInteger(data.id)&&data.id>0?data.id:null,renamed=data.full_name.toLowerCase()!==entry.full.toLowerCase();
let providerRedirect=false;try{const url=new URL(res.url);providerRedirect=res.redirected===true&&url.origin==='https://api.github.com'&&url.pathname.toLowerCase()==='/repos/'+data.full_name.toLowerCase()}catch{}
const proof=renamed&&repositoryId&&(entry.repositoryId===repositoryId||(!entry.repositoryId&&providerRedirect));
const aliases=(Array.isArray(entry.repositoryAliases)?entry.repositoryAliases:[]).filter(alias=>alias&&alias.repositoryId===repositoryId);
if(proof&&!aliases.some(alias=>alias.full.toLowerCase()===entry.full.toLowerCase()))aliases.push({full:entry.full,repositoryId,checkedAt:at});
return {entry:{...kept,...repositoryId?{repositoryId,repositoryAliases:aliases.slice(-20)}:{},availability:'available',lastCheckedAt:at,lastAttemptAt:at,lastAvailableAt:at,...res.headers.get('etag')?{repositoryEtag:res.headers.get('etag'),repositoryEtagFor:entry.full}:{}},data,stop:false};
}catch{return retry('temporary')}
}

