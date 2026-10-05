import {retryDelay} from './browser-work-policy.mjs';
import {isIP} from 'node:net';import {lookup} from 'node:dns/promises';
export const DEMO_PROBE_VERSION=3;
export function renderRetryNeeded(r){const h=r.demoHealth?.url===r.demo?r.demoHealth:null;return h?.error?.reason==='empty_page'&&h.probeVersion!==DEMO_PROBE_VERSION}
export const DEMO_CHECK_INTERVAL=7*86400000,DEMO_RETRY_INTERVAL=2*3600000,DEMO_CONFIRM_INTERVAL=6*3600000;
export function publicIP(input){let ip=input.replace(/^\[|\]$/g,'').toLowerCase();if(ip.startsWith('::ffff:')){const tail=ip.slice(7);if(tail.includes('.'))return publicIP(tail);const parts=tail.split(':');if(parts.length===2){const n=parseInt(parts[0],16)*65536+parseInt(parts[1],16);return publicIP([n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.'))}return false}if(isIP(ip)===6)return /^(?:2[0-9a-f]{3}|3[0-9a-f]{3}):/.test(ip)&&!/^2001:(?:db8|0:|10:|20:)/.test(ip);if(isIP(ip)!==4)return false;const [a,b,c]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113)}
export function publicUrlGuard({resolver=lookup,timeout=3000}={}){
 const cache=new Map(),unsafe={allowed:false,reason:'unsafe_target'};
 const assess=async value=>{try{
  const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.hostname==='localhost'||u.hostname.endsWith('.local'))return unsafe;
  const host=u.hostname.replace(/^\[|\]$/g,'');if(isIP(host))return publicIP(host)?{allowed:true}:unsafe;
  if(!cache.has(host))cache.set(host,(async()=>{let timer;try{
   const addresses=await Promise.race([resolver(host,{all:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('DNS timeout')),timeout)})]);
   if(!addresses.length)return {allowed:false,reason:'dns_unresolved'};
   return addresses.every(a=>publicIP(a.address))?{allowed:true}:unsafe;
  }catch(e){return {allowed:false,reason:e.message==='DNS timeout'?'dns_timeout':'dns_unresolved'}}finally{clearTimeout(timer)}})());
  return await cache.get(host);
 }catch{return unsafe}};
 const guard=async value=>(await assess(value)).allowed;guard.assess=assess;return guard;
}
export function demoCandidates(entries,now=Date.now(),limit=100){
 const health=r=>r.demoHealth?.url===r.demo?r.demoHealth:null;
 const reported=r=>Boolean(r.demoReport?.id&&r.demoReport.id!==health(r)?.reportId);
 const requested=r=>Boolean(r.adminRefreshAppliedAt&&!health(r)?.attemptedAt);
 return entries.filter(r=>r.demo&&r.availability!=='unavailable').filter(r=>{
  const h=health(r);return renderRetryNeeded(r)||(!h?.attemptedAt||now-Date.parse(h.attemptedAt)>=DEMO_RETRY_INTERVAL)&&(!h?.nextCheckAt||Date.parse(h.nextCheckAt)<=now||reported(r));
 }).sort((a,b)=>Number(reported(b))-Number(reported(a))||Number(requested(b))-Number(requested(a))||Number(!health(b)?.checkedAt)-Number(!health(a)?.checkedAt)||Number(!health(b)?.attemptedAt)-Number(!health(a)?.attemptedAt)||Number(Boolean(b.qualityPriority))-Number(Boolean(a.qualityPriority))||(Date.parse(health(a)?.attemptedAt)||0)-(Date.parse(health(b)?.attemptedAt)||0)||(b.stars||b.likes||0)-(a.stars||a.likes||0)).slice(0,limit);
}
export function applyDemoReports(entries,issues){for(const issue of issues){if(issue.pull_request||!/^\[Broken demo\]/i.test(issue.title||'')||!Number.isSafeInteger(issue.number))continue;const full=String(issue.body||'').match(/^Project:\s*`([^`]+)`\s*$/m)?.[1],url=String(issue.body||'').match(/^Demo:\s*(https?:\/\/\S+)\s*$/m)?.[1];const repo=entries.find(r=>r.full===full&&r.demo===url);if(repo&&(!repo.demoReport||Date.parse(issue.created_at)>Date.parse(repo.demoReport.reportedAt)))repo.demoReport={id:issue.number,url:`https://github.com/sparx1981/RepoShelf/issues/${issue.number}`,reportedAt:issue.created_at}}
return entries}
export async function refreshDemoReports(entries,{token,fetcher=fetch}={}){
 try{const headers={Accept:'application/vnd.github+json'};if(token)headers.Authorization=`Bearer ${token}`;const response=await fetcher('https://api.github.com/repos/sparx1981/RepoShelf/issues?state=open&per_page=100&sort=created&direction=desc',{headers,signal:AbortSignal.timeout(12000)});if(response.ok){applyDemoReports(entries,await response.json());return true}}
 catch{}console.warn('Demo reports could not be refreshed; saved reports retained.');return false;
}
export function recordDemoResult(repo,result,now=Date.now()){const at=new Date(now).toISOString(),prior=repo.demoHealth?.url===repo.demo?repo.demoHealth:{};let health={...prior,url:repo.demo,attemptedAt:at,probeVersion:DEMO_PROBE_VERSION,...(repo.demoReport?.id?{reportId:repo.demoReport.id}:{})};if(result.kind==='working'){health={...health,status:'working',checkedAt:at,lastWorkingAt:at,target:result.target||repo.demo,failureCount:0,consecutiveTemporaryFailures:0,nextCheckAt:new Date(now+DEMO_CHECK_INTERVAL).toISOString()};delete health.error;delete health.reason}else if(result.kind==='unavailable'){const consecutive=!prior.failureCount?1:now-Date.parse(prior.checkedAt)>=DEMO_CONFIRM_INTERVAL?prior.failureCount+1:prior.failureCount;health={...health,status:consecutive>=2?'unavailable':'review',checkedAt:at,consecutiveTemporaryFailures:0,failureCount:consecutive,reason:result.reason,nextCheckAt:new Date(now+(consecutive>=2?86400000:DEMO_CONFIRM_INTERVAL)).toISOString()};delete health.error}else{health={...health,status:prior.status||'unknown',consecutiveTemporaryFailures:(prior.consecutiveTemporaryFailures||0)+1,error:{reason:result.reason||'temporary',at},nextCheckAt:new Date(now+retryDelay(result.reason,(prior.consecutiveTemporaryFailures||0)+1)).toISOString()}}
return {...repo,demoHealth:health}}
export async function inspectDemo(page,url,{delay=1800,space=false,patient=false}={}){try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});if(!response)return {kind:'temporary',reason:'no_response'};const status=response.status();if([404,410].includes(status))return {kind:'unavailable',reason:`http_${status}`};if(status===429||status===403)return {kind:'temporary',reason:status===429?'rate_limit':'access_restricted'};if(status>=400)return {kind:'temporary',reason:`http_${status}`};await page.waitForTimeout(delay);const title=await page.title();if(/just a moment|access denied|verify.*human|security check|captcha/i.test(title))return {kind:'temporary',reason:'access_restricted'};if(/^(?:404|410|page not found|site not found)|domain.*(?:sale|expired)|website.*(?:expired|suspended)/i.test(title))return {kind:'unavailable',reason:'page_unavailable'};if(space&&!new URL(page.url()).hostname.endsWith('.hf.space'))return {kind:'temporary',reason:'space_app_not_loaded'};const body=await page.locator('body').innerText({timeout:4000});if(body.trim().length<40&&await page.locator('canvas').count()===0){if(!page.waitForFunction)return {kind:'temporary',reason:'empty_page'};try{await page.waitForFunction(renderedDemoContent,{},{timeout:patient||space?16000:8000,polling:250})}catch{return {kind:'temporary',reason:'empty_page'}}const finalTitle=await page.title();if(/just a moment|access denied|verify.*human|security check|captcha/i.test(finalTitle))return {kind:'temporary',reason:'access_restricted'}};return {kind:'working',target:page.url()}}catch{return {kind:'temporary',reason:'network_or_timeout'}}}

// Executed inside Chromium; inspect visible content in open Shadow DOM roots too.
export function renderedDemoContent(){
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'};
 const roots=[document];let text='';
 for(let i=0;i<roots.length&&i<200;i++){
  const root=roots[i];if(root===document)text+=document.body?.innerText||'';else for(const el of root.children)if(visible(el)&&!['STYLE','SCRIPT'].includes(el.tagName))text+=el.innerText||el.textContent||'';
  for(const el of root.querySelectorAll('*')){if(el.shadowRoot&&visible(el))roots.push(el.shadowRoot);if(!visible(el))continue;const box=el.getBoundingClientRect();if(el.tagName==='CANVAS'&&box.width>=100&&box.height>=50||el.tagName==='IMG'&&el.complete&&el.naturalWidth>=120&&box.width>=120&&box.height>=80||el.tagName.toLowerCase()==='svg'&&box.width>=200&&box.height>=120)return true}
  if(text.trim().length>=40)return true;
 }
 return false;
}
