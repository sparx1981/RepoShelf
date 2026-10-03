// Availability is based on GitHub's repository API, never on a missing README or demo URL.
export const CHECK_INTERVAL_MS=24*60*60*1000;
export function dueEntries(entries,now=Date.now(),limit=250){return entries.filter(r=>!r.nextCheckAt||Date.parse(r.nextCheckAt)<=now).filter(r=>!r.lastCheckedAt||now-Date.parse(r.lastCheckedAt)>=CHECK_INTERVAL_MS||r.checkError).sort((a,b)=>(Date.parse(a.lastAttemptAt||a.lastCheckedAt)||0)-(Date.parse(b.lastAttemptAt||b.lastCheckedAt)||0)).slice(0,limit)}
export async function checkRepository(entry,{fetcher=fetch,headers={},now=Date.now()}={}){
const at=new Date(now).toISOString();
const retry=(kind,delay=6*60*60*1000)=>({entry:{...entry,lastAttemptAt:at,checkError:{kind,at},nextCheckAt:new Date(now+Math.max(delay,6*60*60*1000)).toISOString()},stop:kind==='rate_limit'||kind==='authentication'});
try{const res=await fetcher(`https://api.github.com/repos/${entry.full}`,{headers,signal:AbortSignal.timeout(12000)});
if(res.status===404||res.status===410){const {checkError,nextCheckAt,...kept}=entry;return {entry:{...kept,availability:'unavailable',unavailableReason:'not_found',unavailableSince:entry.unavailableSince||at,lastCheckedAt:at,lastAttemptAt:at},stop:false}}
let limited=res.status===429;if(res.status===403){let message='';try{message=(await res.json()).message||''}catch{}limited=res.headers.get('x-ratelimit-remaining')==='0'||Boolean(res.headers.get('retry-after'))||/rate limit|abuse/i.test(message)}
if(limited){const delay=Math.max(Number(res.headers.get('retry-after')||0)*1000,Number(res.headers.get('x-ratelimit-reset')||0)*1000-now,0);return retry('rate_limit',delay)}
if(res.status===401)return retry('authentication');
if(!res.ok)return retry(res.status===403?'access_denied':'temporary');
const data=await res.json();if(typeof data.full_name!=='string'||typeof data.private!=='boolean')return retry('invalid_response');
const {checkError,nextCheckAt,unavailableSince,unavailableReason,...kept}=entry;
if(data.private||data.visibility&&data.visibility!=='public')return {entry:{...kept,availability:'unavailable',unavailableReason:'not_public',unavailableSince:entry.unavailableSince||at,lastCheckedAt:at,lastAttemptAt:at},data,stop:false};
return {entry:{...kept,availability:'available',lastCheckedAt:at,lastAttemptAt:at,lastAvailableAt:at},data,stop:false};
}catch{return retry('temporary')}
}
