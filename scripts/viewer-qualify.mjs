// Qualifies demos for the in-page viewer. For each demo it loads the real viewer component and CSS, with the production
// response headers, on the canonical RepoShelf origin in a headless browser, runs an admin-reviewed scenario inside the
// frame, and records dated evidence per browser profile. Uncertainty is never a pass: a timeout, a challenge page or a
// harness error is "inconclusive", and both inconclusive and failed results suspend the demo so visitors get the
// external demo. Every browser request must go to a public address, and RepoShelf itself is never an acceptable demo.
//
//   node scripts/viewer-qualify.mjs --url=https://demo.example/ --scenario=scenario.json [--popups] [--downloads]
//        [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]      try one demo locally
//   node scripts/viewer-qualify.mjs --queue [--browser=...] [--mobile] [--if-required]
//        qualify the approved list for one browser profile and report (needs REPOSHELF_SUBMISSION_SYNC_KEY, the same
//        worker key the other jobs use). With --if-required the run is skipped unless the profile is in the required list.
import {readFile,mkdir,stat,appendFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {dirname} from 'node:path';
import {validateScenario,scenarioHash} from '../lib/viewer-scenario.mjs';import {publicUrlGuard} from './demo-health.mjs';
const require=createRequire(import.meta.url),C=require('../dist/viewer-config.js');
export const HARNESS_PATH='/__viewer-qualify';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const CHALLENGE=/just a moment|checking your browser|verify you are human|captcha|attention required|access denied/i;
const hostOf=u=>{try{return new URL(u).host}catch{return ''}};
const dist=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const inline=json=>JSON.stringify(json).replace(/</g,'\\u003c').replace(/[\u2028\u2029]/g,'');

// The page and headers visitors would get: the real stylesheet, viewer CSS, configuration and component, served with
// the production security headers from vercel.json (including the Permissions-Policy that denies camera, microphone
// and location to every frame).
export async function harnessResponse({demoUrl,flags,title='Demo qualification'}){
 const [style,viewerCss,config,component,vercel]=await Promise.all([dist('style.css'),dist('viewer.css'),dist('viewer-config.js'),dist('viewer.js'),readFile(new URL('../vercel.json',import.meta.url),'utf8')]);
 const block=JSON.parse(vercel).headers?.find(h=>h.source==='/(.*)'),headers=Object.fromEntries((block?.headers||[]).map(h=>[h.key,h.value]));
 const body=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Viewer qualification</title><style>${style}</style><style>${viewerCss}</style></head><body><main style="padding:12px"><p>Qualifying a third-party demo.</p></main><script>${config}</script><script>${component}</script><script>(()=>{const q=${inline({demoUrl,flags,title})};const viewer=RepoViewer.create({fetchEligibility:async()=>({eligible:true,url:q.demoUrl,sandbox:RepoViewerConfig.sandbox(q.flags),configId:RepoViewerConfig.configId(q.flags)}),pollMs:3600000});viewer.open({id:'qualification/run',url:q.demoUrl,flags:q.flags,title:q.title}).then(r=>{window.__viewerOpened=r})})()</script></body></html>`;
 return {status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',...headers},body};
}

// Runs one demo. `launch(browserName)`, `setup(context)` and `guard(url)` are injectable so tests can run without the network.
export async function qualifyDemo({project='local',demoUrl,scenario,flags={},browserName='chromium',mobile=false,screenshot,launch,setup,guard=publicUrlGuard(),loadTimeoutMs=20000,stepTimeoutMs=8000,settleMs=400}={}){
 const configId=C.configId(flags),checked=validateScenario(scenario);
 const base={project,browser:browserName+(mobile?'-mobile':''),configId,demoUrl,scenarioHash:checked.ok?scenarioHash(checked.scenario):null};
 const evidence=(result,reason,resolvedUrl,details={})=>({...base,result,reason,resolvedUrl:resolvedUrl||null,details});
 if(!C.originOf(demoUrl))return evidence('failed','not_https');
 if(C.isOwnOrigin(demoUrl))return evidence('failed','own_origin');
 if(!checked.ok)return evidence('failed','invalid_scenario',null,{problems:checked.problems});
 const details={steps:[],popups:[],blockedPopups:0,downloads:[],blockedDownloads:0,topNavigationAttempted:false,consoleErrors:0,navigationStatus:null,blockedRequests:[],ownOriginRequests:[],frameUrls:[]};
 let browser;
 try{
  const playwright=require('playwright');browser=await (launch?launch(browserName):playwright[browserName].launch());
  const contextOptions={acceptDownloads:true,...(mobile?playwright.devices['iPhone 13']:{viewport:{width:1280,height:800}}),ignoreHTTPSErrors:false};
  if(mobile&&browserName==='firefox')delete contextOptions.isMobile;
  const context=await browser.newContext(contextOptions),page=await context.newPage();
  if(setup)await setup(context);
  const harness=C.VIEWER_ORIGIN+HARNESS_PATH,answer=await harnessResponse({demoUrl,flags,title:project});
  await context.route(harness,route=>route.fulfill(answer));
  // Registered last, so it runs first: every request the demo makes, and every redirect it follows, must be public.
  const verdicts=new Map();
  await context.route('**/*',async route=>{const url=route.request().url();let origin;try{origin=new URL(url).origin}catch{return route.abort()}
   // Only the qualification page itself may be served from RepoShelf. Anything else aimed at RepoShelf, including a
   // navigation the demo causes during the scenario, is refused before it loads.
   if(url===harness)return route.fallback();
   if(C.isOwnOrigin(url)){details.ownOriginRequests.push(new URL(url).host.slice(0,120));return route.abort('blockedbyclient')}
   if(!/^https?:/.test(url))return route.fallback();
   const host=new URL(url).hostname;if(!verdicts.has(host))verdicts.set(host,Promise.resolve(guard(url)).catch(()=>false));
   if(await verdicts.get(host))return route.fallback();
   details.blockedRequests.push(host.slice(0,120));return route.abort('blockedbyclient')});
  let popupsSeen=0,sinceStep={downloads:0,popups:0};const pendingDownloads=[];
  page.on('console',m=>{const t=m.text();if(m.type()==='error')details.consoleErrors++;if(/allow-top-navigation|top-level window is sandboxed|Unsafe attempt to initiate navigation/i.test(t))details.topNavigationAttempted=true;if(/Blocked opening .* in a sandboxed frame|allow-popups/i.test(t))details.blockedPopups++;if(/Download is disallowed|allow-downloads/i.test(t))details.blockedDownloads++});
  page.on('framenavigated',f=>{if(f===page.mainFrame()){if(f.url()!==harness&&f.url()!=='about:blank')details.topNavigationAttempted=true}else if(details.frameUrls.length<20)details.frameUrls.push(f.url().slice(0,300))});
  // A download only counts when the whole file is saved: wait for it to finish, then check it exists and is not empty.
  page.on('download',d=>{sinceStep.downloads++;const entry={file:d.suggestedFilename().slice(0,120),url:d.url().slice(0,300),bytes:0,saved:false};details.downloads.push(entry);pendingDownloads.push((async()=>{try{const path=await d.path();if(!path)throw Error('no file');entry.bytes=(await stat(path)).size;entry.saved=entry.bytes>0;const failure=await d.failure();if(failure){entry.saved=false;entry.error=String(failure).slice(0,120)}}catch(e){entry.saved=false;entry.error=String(e.message).split('\n')[0].slice(0,120)}})())});
  context.on('page',async popup=>{if(popup===page)return;popupsSeen++;sinceStep.popups++;let url='';try{await popup.waitForLoadState('domcontentloaded',{timeout:4000})}catch{}try{url=popup.url()}catch{}details.popups.push({url:url.slice(0,300)});popup.close().catch(()=>{})});
  page.on('response',r=>{const req=r.request();if(details.navigationStatus===null&&req.isNavigationRequest()&&req.frame()!==page.mainFrame())details.navigationStatus=r.status()});
  try{await page.goto(harness,{timeout:loadTimeoutMs,waitUntil:'domcontentloaded'})}catch(e){return evidence('inconclusive','harness_load_failed',null,{...details,error:String(e.message).slice(0,200)})}
  // The iframe is created by the shared viewer component, exactly as it is for visitors.
  const frameElement=await page.waitForSelector('.viewer-frame',{timeout:5000}),frame=await frameElement.contentFrame();
  const actual=await frameElement.getAttribute('sandbox');if(actual!==C.sandbox(flags))return evidence('failed','sandbox_mismatch',null,{...details,sandbox:actual});
  // A new frame starts as about:blank, so wait for it to leave that state (to the demo or to a browser error page) first.
  const until=Date.now()+loadTimeoutMs;while(frame.url()==='about:blank'&&Date.now()<until)await wait(100);
  if(details.ownOriginRequests.length)return evidence('failed','own_origin',null,details);
  if(details.blockedRequests.length)return evidence('failed','unsafe_destination',null,details);
  if(frame.url()==='about:blank')return evidence('inconclusive','load_timeout',null,details);
  try{await frame.waitForLoadState('load',{timeout:Math.max(500,until-Date.now())})}catch{return evidence('inconclusive','load_timeout',frame.url(),details)}
  await wait(settleMs);
  const resolvedUrl=frame.url();
  if(details.ownOriginRequests.length)return evidence('failed','own_origin',resolvedUrl,details);
  if(details.blockedRequests.length)return evidence('failed','unsafe_destination',resolvedUrl,details);
  if(/^chrome-error:|^about:neterror/.test(resolvedUrl))return evidence('failed','frame_refused',null,details);
  if(C.isOwnOrigin(resolvedUrl))return evidence('failed','own_origin',resolvedUrl,details);
  details.initialUrl=resolvedUrl;
  if(details.navigationStatus&&details.navigationStatus>=400)return evidence('failed','http_'+details.navigationStatus,resolvedUrl,details);
  let bodyText='';try{bodyText=(await frame.locator('body').innerText({timeout:3000})).slice(0,2000)}catch{}
  if(CHALLENGE.test(bodyText.slice(0,600)))return evidence('inconclusive','challenge_page',resolvedUrl,details);
  if(!C.originOf(resolvedUrl))return evidence('failed','left_https',resolvedUrl,details);
  const fl=page.frameLocator('.viewer-frame');
  for(const [i,step] of checked.scenario.steps.entries()){
   const n=i+1,timeout=step.timeoutMs||stepTimeoutMs,record=ok=>details.steps.push({n,action:step.action,ok});
   try{
    // Popups and downloads are attributed to the interaction that caused them, so reset only before an interaction.
    if(['click','fill','press'].includes(step.action))sinceStep={downloads:0,popups:0};
    if(step.action==='click')await fl.locator(step.selector).first().click({timeout});
    else if(step.action==='fill')await fl.locator(step.selector).first().fill(step.value,{timeout});
    else if(step.action==='press'){if(step.selector)await fl.locator(step.selector).first().press(step.key,{timeout});else await page.keyboard.press(step.key)}
    else if(step.action==='waitFor'||step.action==='expectVisible')await fl.locator(step.selector).first().waitFor({state:'visible',timeout});
    else if(step.action==='expectText')await fl.locator(step.selector||'body').filter({hasText:step.text}).first().waitFor({state:'visible',timeout});
    else if(step.action==='expectPopup'){const until=Date.now()+Math.min(timeout,6000);while(!sinceStep.popups&&Date.now()<until)await wait(100);if(!sinceStep.popups)throw Error('no popup opened');const last=details.popups.at(-1)?.url||'';if(!C.originOf(last))throw Error('the popup did not open an https address');if(step.host&&hostOf(last)!==step.host)throw Error('the popup opened an unexpected host')}
    else if(step.action==='expectDownload'){const until=Date.now()+Math.min(timeout,8000);while(!sinceStep.downloads&&Date.now()<until)await wait(100);if(!sinceStep.downloads)throw Error('no download started');await Promise.race([Promise.all(pendingDownloads),wait(Math.max(500,until-Date.now()))]);const d=details.downloads.at(-1);if(!d?.saved)throw Error('the download did not finish saving'+(d?.error?': '+d.error:''));if(d.bytes<(step.minBytes||1))throw Error('the downloaded file is smaller than expected');if(step.filename&&d.file.toLowerCase()!==step.filename.toLowerCase())throw Error('the downloaded file has an unexpected name')}
    record(true);
    if(details.topNavigationAttempted)break;
   }catch(e){
    record(false);
    // A safety violation is the more important finding: report it rather than the step that was disturbed by it.
    const current=frame.url()||resolvedUrl,safety=details.ownOriginRequests.length?'own_origin':details.blockedRequests.length?'unsafe_destination':details.topNavigationAttempted?'top_navigation_attempt':null;
    if(safety)return evidence('failed',safety,current,details);
    // A step that cannot find its element in a page that loaded is a definite failure of the scenario.
    return evidence('failed',`step_${n}_${step.action}`,frame.url()||resolvedUrl,{...details,error:String(e.message).split('\n')[0].slice(0,200)});
   }
  }
  if(screenshot){try{await mkdir(dirname(screenshot),{recursive:true});await page.screenshot({path:screenshot,fullPage:false})}catch{}}
  await Promise.allSettled(pendingDownloads);
  // An interaction can navigate the frame, so validate and record the address the frame ended on, not the one it started on.
  await wait(settleMs);
  const finalUrl=frame.url();details.finalUrl=finalUrl;
  const visited=[...details.frameUrls,finalUrl];
  if(details.ownOriginRequests.length||visited.some(u=>C.isOwnOrigin(u)))return evidence('failed','own_origin',finalUrl,details);
  if(details.blockedRequests.length)return evidence('failed','unsafe_destination',finalUrl,details);
  if(/^chrome-error:|^about:neterror/.test(finalUrl))return evidence('failed','frame_refused_after_scenario',null,details);
  if(visited.some(u=>u!=='about:blank'&&!C.originOf(u)))return evidence('failed','left_https',finalUrl,details);
  if(details.topNavigationAttempted)return evidence('failed','top_navigation_attempt',finalUrl,details);
  if(!flags.popups&&popupsSeen)return evidence('failed','unexpected_popup',finalUrl,details);
  if(!flags.downloads&&details.downloads.length)return evidence('failed','unexpected_download',finalUrl,details);
  if(details.downloads.some(d=>!d.saved))return evidence('failed','download_incomplete',finalUrl,details);
  for(const popup of details.popups)if(!C.originOf(popup.url)||C.isOwnOrigin(popup.url))return evidence('failed','popup_destination_rejected',finalUrl,details);
  return evidence('ok',null,finalUrl,details);
 }catch(e){return evidence('inconclusive','harness_error',null,{...details,error:String(e.message).split('\n')[0].slice(0,200)})}
 finally{try{await browser?.close()}catch{}}
}

async function worker(path,body,{origin,key}){const r=await fetch(origin+'/api/viewer?action='+path,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(25000)});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data?.error?.message||('HTTP '+r.status));return data}

export async function qualifyQueue({origin,key,browserName,mobile,ifRequired=false,max=60,deadlineMs=20*60000,qualify=qualifyDemo,report=worker}={}){
 const profile=browserName+(mobile?'-mobile':''),{items,requiredProfiles=['chromium']}=await report('queue',{},{origin,key});
 const summary={profile,checked:0,ok:0,failed:0,inconclusive:0,discarded:0,skipped:0,notRequired:false,results:[]};
 if(ifRequired&&!requiredProfiles.includes(profile)){summary.notRequired=true;return summary}
 const started=Date.now();
 for(const item of items.slice(0,max)){
  if(Date.now()-started>deadlineMs){summary.skipped++;continue}
  const flags={popups:item.allow_popups===true,downloads:item.allow_downloads===true};
  const e=await qualify({project:item.project_id,demoUrl:item.demo_url,scenario:item.scenario,flags,browserName,mobile});
  const saved=await report('record',{project:e.project,result:e.result,reason:e.reason,browser:e.browser,configId:e.configId,demoUrl:e.demoUrl,resolvedUrl:e.resolvedUrl,scenarioHash:e.scenarioHash||'none',details:e.details},{origin,key});
  // A run for a scenario or address that was edited while it ran is rejected by the server and does not count either way.
  if(saved?.ok===false){summary.discarded++;summary.results.push({project:item.project_id,result:'discarded',reason:saved.reason});continue}
  summary.checked++;summary[e.result]++;summary.results.push({project:item.project_id,result:e.result,reason:e.reason});
 }
 summary.skipped+=Math.max(0,items.length-max);return summary;
}
// A run needs attention when anything failed, was inconclusive, or was not checked at all (time budget or queue limit).
export const needsAlert=s=>!s.notRequired&&(s.failed>0||s.inconclusive>0||s.skipped>0);
export const summaryMarkdown=s=>[`## Demo viewer qualification (${s.profile})`,'',s.notRequired?'This profile is not in the required list, so nothing was run.':`${s.checked} checked: **${s.ok} ok**, ${s.failed} failed, ${s.inconclusive} inconclusive, ${s.discarded} discarded (edited while running), ${s.skipped} not checked.${s.skipped?' **Incomplete: the time budget or queue limit left approved demos unqualified, so their evidence will expire.**':''}`,'',...(s.results.filter(r=>r.result!=='ok').length?['| Demo | Result | Reason |','|---|---|---|',...s.results.filter(r=>r.result!=='ok').map(r=>`| ${r.project} | ${r.result} | ${r.reason||''} |`)]:[]),''].join('\n');

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3),flag=name=>process.argv.includes('--'+name);
 const browserName=arg('browser')||'chromium',mobile=flag('mobile');
 if(flag('queue')){
  const key=process.env.REPOSHELF_SUBMISSION_SYNC_KEY||'',origin=process.env.REPOSHELF_API_ORIGIN||C.VIEWER_ORIGIN;
  if(key.length<32){console.log('Demo viewer qualification skipped: the worker key is not configured.');process.exit(0)}
  const s=await qualifyQueue({origin,key,browserName,mobile,ifRequired:flag('if-required')}),md=summaryMarkdown(s);console.log(md);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,md+'\n');
  // A failing job is the alert: any demo that failed, could not be checked or was left unchecked fails the run.
  if(needsAlert(s))process.exitCode=1;
 }else{
  const url=arg('url'),file=arg('scenario');if(!url||!file){console.error('Usage: node scripts/viewer-qualify.mjs --url=https://... --scenario=file.json [--popups] [--downloads] [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]\n       node scripts/viewer-qualify.mjs --queue [--if-required]');process.exit(2)}
  const e=await qualifyDemo({demoUrl:url,scenario:JSON.parse(await readFile(file,'utf8')),flags:{popups:flag('popups'),downloads:flag('downloads')},browserName,mobile,screenshot:arg('screenshot')});console.log(JSON.stringify(e,null,2));process.exitCode=e.result==='ok'?0:1;
 }
}
