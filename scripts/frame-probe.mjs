// Measures how many catalogue demos can be shown inside a RepoShelf page (an iframe), and why the rest cannot.
// A demo can be framed unless it sends X-Frame-Options (DENY/SAMEORIGIN) or a Content-Security-Policy
// frame-ancestors list that excludes RepoShelf. When frame-ancestors is present it takes precedence over
// X-Frame-Options, as in current browsers. Optional --browser mode loads a real iframe to confirm the verdicts.
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
import {publicUrlGuard} from './demo-health.mjs';
// The viewer would only run on the canonical site. Other hosts that serve RepoShelf would not show it.
const VIEWER_ORIGIN='https://www.reposhelf.co.uk';
const header=(headers,name)=>typeof headers?.get==='function'?headers.get(name):headers?.[name]??headers?.[name.toLowerCase()]??null;
// A frame-ancestors source matches only if it names the origin the viewer actually runs on. Scheme-only sources
// other than https: (for example http:) are not accepted as evidence, even though CSP3 lets http: match https pages.
const sourceMatches=(token,origin)=>{const t=token.toLowerCase();if(t==='*'||t==='https:')return true;if(t==='http:'||t.endsWith(':')&&!t.includes('/'))return false;const url=new URL(origin);if(t==='https://'+url.host||t===url.host)return true;const wildcard=t.replace(/^https:\/\//,'');return wildcard.startsWith('*.')&&url.hostname.endsWith(wildcard.slice(1))&&url.hostname!==wildcard.slice(2)};
export function classifyFraming(headers,{origin=VIEWER_ORIGIN}={}){
 const csp=String(header(headers,'content-security-policy')||''),directives=csp.split(',').flatMap(policy=>policy.split(';')).map(x=>x.trim()).filter(x=>/^frame-ancestors\s/i.test(x));
 // Every policy is enforced, so one restrictive frame-ancestors list is enough to block framing.
 if(directives.length){let allowed=true,blocked=null;for(const directive of directives){const tokens=directive.split(/\s+/).slice(1);if(tokens.includes("'none'"))blocked??='frame_ancestors_none';else if(!tokens.some(t=>sourceMatches(t,origin)))blocked??=tokens.includes("'self'")&&tokens.length===1?'frame_ancestors_self':'frame_ancestors_other'}return blocked?{embeddable:false,reason:blocked}:{embeddable:true,reason:'frame_ancestors_allows'}}
 const xfo=String(header(headers,'x-frame-options')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
 if(xfo.some(v=>v==='deny'))return {embeddable:false,reason:'x_frame_options_deny'};if(xfo.some(v=>v==='sameorigin'))return {embeddable:false,reason:'x_frame_options_sameorigin'};if(xfo.some(v=>v.startsWith('allow-from')))return {embeddable:false,reason:'x_frame_options_allow_from'};
 return {embeddable:true,reason:'no_restrictions'};
}
export async function probeDemo(url,{fetcher=fetch,guard=publicUrlGuard(),timeout=15000,hops=5}={}){
 let current=url;
 for(let i=0;i<=hops;i++){
  if(!await guard(current))return {url,embeddable:null,reason:'unsafe_target'};
  let response;try{response=await fetcher(current,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(timeout),headers:{'User-Agent':'RepoShelf-frame-probe/1.0 (+https://www.reposhelf.co.uk)',Accept:'text/html,*/*;q=0.5'}})}catch(e){return {url,embeddable:null,reason:e?.name==='TimeoutError'?'timeout':'network_error'}}
  try{await response.body?.cancel()}catch{}
  if([301,302,303,307,308].includes(response.status)){const location=header(response.headers,'location');if(!location)return {url,embeddable:null,reason:'bad_redirect'};try{current=new URL(location,current).href}catch{return {url,embeddable:null,reason:'bad_redirect'}}continue}
  if(response.status>=400)return {url,finalUrl:current,status:response.status,embeddable:null,reason:'http_'+response.status};
  return {url,finalUrl:current,status:response.status,...classifyFraming(response.headers)};
 }
 return {url,embeddable:null,reason:'too_many_redirects'};
}
export function hostGroup(url){try{const host=new URL(url).hostname.toLowerCase(),parts=host.split('.');return parts.length>2&&parts.at(-2).length<=3&&parts.at(-1).length===2?parts.slice(-3).join('.'):parts.slice(-2).join('.')}catch{return 'invalid'}}
export function summarize(results){
 const measured=results.filter(r=>r.embeddable!==null),embeddable=measured.filter(r=>r.embeddable),reasons={},hosts={};
 for(const r of results)reasons[r.reason]=(reasons[r.reason]||0)+1;
 for(const r of measured){const g=hostGroup(r.url);hosts[g]??={total:0,embeddable:0};hosts[g].total++;if(r.embeddable)hosts[g].embeddable++}
 return {checked:results.length,measured:measured.length,embeddable:embeddable.length,blocked:measured.length-embeddable.length,unreachable:results.length-measured.length,embeddablePercent:measured.length?Math.round(embeddable.length/measured.length*1000)/10:null,reasons,topHosts:Object.entries(hosts).sort((a,b)=>b[1].total-a[1].total).slice(0,15).map(([host,v])=>({host,...v,percent:Math.round(v.embeddable/v.total*1000)/10}))};
}
export function markdown(summary,{browser=null}={}){
 const rows=summary.topHosts.map(h=>`| ${h.host} | ${h.total} | ${h.embeddable} | ${h.percent}% |`).join('\n'),reasons=Object.entries(summary.reasons).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v} |`).join('\n');
 return `## Demo framing probe\n\n**${summary.embeddablePercent??'n/a'}% of ${summary.measured} reachable demos can be shown inside a RepoShelf page** (${summary.blocked} blocked, ${summary.unreachable} unreachable of ${summary.checked} checked).\n\n| Reason | Demos |\n|---|---|\n${reasons}\n\n| Host | Checked | Embeddable | Share |\n|---|---|---|---|\n${rows}\n${browser?`\n### Real iframe check\n\n${browser.agreed} of ${browser.checked} browser results agreed with the header verdict; ${browser.disagreed} disagreed.\n${browser.differences.slice(0,10).map(d=>`- ${d.url}: headers said ${d.header?'embeddable':'blocked'}, browser ${d.browser?'embedded it':'refused'}`).join('\n')}\n`:''}`;
}
async function browserCheck(results,{limit=40}={}){
 const require=createRequire(import.meta.url),{chromium}=require('playwright'),browser=await chromium.launch(),origin=VIEWER_ORIGIN,differences=[];let checked=0,agreed=0;
 try{for(const r of results.filter(x=>x.embeddable!==null).slice(0,limit)){const context=await browser.newContext(),page=await context.newPage();let refused=false;page.on('console',m=>{if(/Refused to (display|frame)/i.test(m.text()))refused=true});
  await page.route(origin+'/__frame_test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><iframe src="${r.url.replace(/"/g,'&quot;')}" style="width:900px;height:600px" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerpolicy="no-referrer"></iframe>`}));
  try{await page.goto(origin+'/__frame_test',{waitUntil:'load',timeout:30000});await page.waitForTimeout(4000);const frame=page.frames().find(f=>f!==page.mainFrame()),embedded=Boolean(frame)&&!frame.url().startsWith('chrome-error:')&&!refused;checked++;if(embedded===r.embeddable)agreed++;else differences.push({url:r.url,header:r.embeddable,browser:embedded})}catch{}finally{await context.close()}}}finally{await browser.close()}
 return {checked,agreed,disagreed:checked-agreed,differences};
}
async function main(){
 const args=new Map(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));const sample=Number(args.get('sample')||300),concurrency=Number(args.get('concurrency')||10),out=args.get('out')||'data/frame-probe.json';
 const read=async p=>{try{return JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'))}catch{return {repositories:[]}}};
 const [catalog,spaces]=await Promise.all([read('dist/catalog.json'),read('dist/spaces.json')]);
 const demos=[...new Set([...catalog.repositories,...(spaces.repositories||[])].filter(r=>r.demo&&r.availability!=='unavailable').map(r=>r.demo))];
 let seed=Number(args.get('seed')||1);const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 const chosen=demos.map(d=>[random(),d]).sort((a,b)=>a[0]-b[0]).slice(0,sample).map(x=>x[1]),results=[],guard=publicUrlGuard();let next=0;
 await Promise.all(Array.from({length:concurrency},async()=>{while(next<chosen.length){const url=chosen[next++];results.push(await probeDemo(url,{guard}))}}));
 const summary=summarize(results),browser=args.has('browser')?await browserCheck(results,{limit:Number(args.get('browser'))||40}):null;
 await mkdir(new URL('../'+out.replace(/[^/]+$/,''),import.meta.url),{recursive:true});await writeFile(new URL('../'+out,import.meta.url),JSON.stringify({at:new Date().toISOString(),summary,browser,results:results.map(r=>({url:r.url,embeddable:r.embeddable,reason:r.reason}))},null,1));
 const text=markdown(summary,{browser});console.log(text);if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,text,{flag:'a'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
