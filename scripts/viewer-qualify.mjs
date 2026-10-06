// Qualifies demos for the in-page viewer. For each demo it loads the real viewer configuration (the exact sandbox
// string) in a headless browser on the canonical RepoShelf origin, runs an admin-reviewed scenario inside the frame,
// and records dated evidence. Uncertainty is never a pass: a timeout, a challenge page or a harness error is
// "inconclusive", and both inconclusive and failed results suspend the demo so visitors get the external demo.
//
//   node scripts/viewer-qualify.mjs --url=https://demo.example/ --scenario=scenario.json [--popups] [--downloads]
//        [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]      try one demo locally
//   node scripts/viewer-qualify.mjs --queue [--browser=...] [--mobile]                qualify the approved list and report
//        (needs REPOSHELF_SUBMISSION_SYNC_KEY, the same worker key the other jobs use)
import {readFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {dirname} from 'node:path';
import {validateScenario,scenarioHash} from '../lib/viewer-scenario.mjs';
const require=createRequire(import.meta.url),C=require('../dist/viewer-config.js');
export const HARNESS_PATH='/__viewer-qualify';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const CHALLENGE=/just a moment|checking your browser|verify you are human|captcha|attention required|access denied/i;
const hostOf=u=>{try{return new URL(u).host}catch{return ''}};

// Runs one demo. `launch(browserName)` and `setup(context)` are injectable so tests can run without the network.
export async function qualifyDemo({project='local',demoUrl,scenario,flags={},browserName='chromium',mobile=false,screenshot,launch,setup,loadTimeoutMs=20000,stepTimeoutMs=8000,settleMs=400}={}){
 const sandbox=C.sandbox(flags),configId=C.configId(flags),checked=validateScenario(scenario);
 const base={project,browser:browserName+(mobile?'-mobile':''),configId,demoUrl,scenarioHash:checked.ok?scenarioHash(checked.scenario):null};
 const evidence=(result,reason,resolvedUrl,details={})=>({...base,result,reason,resolvedUrl:resolvedUrl||null,details});
 if(!C.originOf(demoUrl))return evidence('failed','not_https');
 if(!checked.ok)return evidence('failed','invalid_scenario',null,{problems:checked.problems});
 const details={steps:[],popups:[],blockedPopups:0,downloads:[],blockedDownloads:0,topNavigationAttempted:false,consoleErrors:0,navigationStatus:null};
 let browser;
 try{
  const playwright=require('playwright');browser=await (launch?launch(browserName):playwright[browserName].launch());
  const contextOptions={acceptDownloads:true,...(mobile?playwright.devices['iPhone 13']:{viewport:{width:1280,height:800}}),ignoreHTTPSErrors:false};
  if(mobile&&browserName==='firefox'){delete contextOptions.isMobile}
  const context=await browser.newContext(contextOptions),page=await context.newPage();
  if(setup)await setup(context);
  const harness=C.VIEWER_ORIGIN+HARNESS_PATH;
  // The harness page is served on the canonical origin so frame-ancestors rules are judged exactly as for visitors.
  await context.route(harness,route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><title>Viewer qualification</title><body style="margin:0"><iframe id="demo" title="Third-party demo" src="${demoUrl.replace(/"/g,'&quot;')}" sandbox="${sandbox}" referrerpolicy="no-referrer" style="border:0;width:100vw;height:100vh"></iframe>`}));
  let downloadsSeen=0,popupsSeen=0,sinceStep={downloads:0,popups:0};
  page.on('console',m=>{const t=m.text();if(m.type()==='error')details.consoleErrors++;if(/allow-top-navigation|top-level window is sandboxed|Unsafe attempt to initiate navigation/i.test(t))details.topNavigationAttempted=true;if(/Blocked opening .* in a sandboxed frame|allow-popups/i.test(t))details.blockedPopups++;if(/Download is disallowed|allow-downloads/i.test(t))details.blockedDownloads++});
  page.on('framenavigated',f=>{if(f===page.mainFrame()&&f.url()!==harness&&f.url()!=='about:blank')details.topNavigationAttempted=true});
  page.on('download',d=>{downloadsSeen++;sinceStep.downloads++;details.downloads.push({file:d.suggestedFilename().slice(0,120),url:d.url().slice(0,300)});d.cancel().catch(()=>{})});
  context.on('page',async popup=>{if(popup===page)return;popupsSeen++;sinceStep.popups++;let url='';try{await popup.waitForLoadState('domcontentloaded',{timeout:4000})}catch{}try{url=popup.url()}catch{}details.popups.push({url:url.slice(0,300)});popup.close().catch(()=>{})});
  page.on('response',r=>{const req=r.request();if(details.navigationStatus===null&&req.isNavigationRequest()&&req.frame()!==page.mainFrame())details.navigationStatus=r.status()});
  try{await page.goto(harness,{timeout:loadTimeoutMs,waitUntil:'domcontentloaded'})}catch(e){return evidence('inconclusive','harness_load_failed',null,{...details,error:String(e.message).slice(0,200)})}
  const frameElement=await page.waitForSelector('#demo',{timeout:5000}),frame=await frameElement.contentFrame();
  // A new frame starts as about:blank, so wait for it to leave that state (to the demo or to a browser error page) first.
  const until=Date.now()+loadTimeoutMs;while(frame.url()==='about:blank'&&Date.now()<until)await wait(100);
  if(frame.url()==='about:blank')return evidence('inconclusive','load_timeout',null,details);
  try{await frame.waitForLoadState('load',{timeout:Math.max(500,until-Date.now())})}catch{return evidence('inconclusive','load_timeout',frame.url(),details)}
  await wait(settleMs);
  const resolvedUrl=frame.url();
  // A refused frame becomes a browser error page; report it as a definite failure.
  if(/^chrome-error:|^about:neterror/.test(resolvedUrl)){return evidence('failed','frame_refused',null,details)}
  if(details.navigationStatus&&details.navigationStatus>=400)return evidence('failed','http_'+details.navigationStatus,resolvedUrl,details);
  let bodyText='';try{bodyText=(await frame.locator('body').innerText({timeout:3000})).slice(0,2000)}catch{}
  if(CHALLENGE.test(bodyText.slice(0,600)))return evidence('inconclusive','challenge_page',resolvedUrl,details);
  if(!C.originOf(resolvedUrl))return evidence('failed','left_https',resolvedUrl,details);
  const fl=page.frameLocator('#demo');
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
    else if(step.action==='expectDownload'){const until=Date.now()+Math.min(timeout,6000);while(!sinceStep.downloads&&Date.now()<until)await wait(100);if(!sinceStep.downloads)throw Error('no download started')}
    record(true);
    if(details.topNavigationAttempted)break;
   }catch(e){
    record(false);
    // A step that cannot find its element in a page that loaded is a definite failure of the scenario.
    return evidence('failed',`step_${n}_${step.action}`,resolvedUrl,{...details,error:String(e.message).split('\n')[0].slice(0,200)});
   }
  }
  if(screenshot){try{await mkdir(dirname(screenshot),{recursive:true});await page.screenshot({path:screenshot,fullPage:false})}catch{}}
  if(details.topNavigationAttempted)return evidence('failed','top_navigation_attempt',resolvedUrl,details);
  if(!flags.popups&&popupsSeen)return evidence('failed','unexpected_popup',resolvedUrl,details);
  if(!flags.downloads&&downloadsSeen)return evidence('failed','unexpected_download',resolvedUrl,details);
  for(const popup of details.popups)if(!C.originOf(popup.url))return evidence('failed','popup_not_https',resolvedUrl,details);
  return evidence('ok',null,resolvedUrl,details);
 }catch(e){return evidence('inconclusive','harness_error',null,{...details,error:String(e.message).split('\n')[0].slice(0,200)})}
 finally{try{await browser?.close()}catch{}}
}

async function worker(path,body,{origin,key}){const r=await fetch(origin+'/api/viewer?action='+path,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(25000)});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data?.error?.message||('HTTP '+r.status));return data}

export async function qualifyQueue({origin,key,browserName,mobile,max=60,deadlineMs=20*60000,qualify=qualifyDemo,report=worker}={}){
 const {items}=await report('queue',{},{origin,key}),started=Date.now(),summary={checked:0,ok:0,failed:0,inconclusive:0,skipped:0,results:[]};
 for(const item of items.slice(0,max)){
  if(Date.now()-started>deadlineMs){summary.skipped++;continue}
  const flags={popups:item.allow_popups===true,downloads:item.allow_downloads===true};
  const e=await qualify({project:item.project_id,demoUrl:item.demo_url,scenario:item.scenario,flags,browserName,mobile});
  summary.checked++;summary[e.result]++;summary.results.push({project:item.project_id,result:e.result,reason:e.reason});
  await report('record',{project:e.project,result:e.result,reason:e.reason,browser:e.browser,configId:e.configId,demoUrl:e.demoUrl,resolvedUrl:e.resolvedUrl,scenarioHash:e.scenarioHash,details:e.details},{origin,key});
 }
 summary.skipped+=Math.max(0,items.length-max);return summary;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3),flag=name=>process.argv.includes('--'+name);
 const browserName=arg('browser')||'chromium',mobile=flag('mobile');
 if(flag('queue')){
  const key=process.env.REPOSHELF_SUBMISSION_SYNC_KEY||'',origin=process.env.REPOSHELF_API_ORIGIN||C.VIEWER_ORIGIN;
  if(key.length<32){console.log('Demo viewer qualification skipped: the worker key is not configured.');process.exit(0)}
  const s=await qualifyQueue({origin,key,browserName,mobile});console.log(`Demo viewer qualification (${browserName}${mobile?' mobile':''}): ${s.checked} checked, ${s.ok} ok, ${s.failed} failed, ${s.inconclusive} inconclusive, ${s.skipped} skipped.`);for(const r of s.results)if(r.result!=='ok')console.log(`- ${r.project}: ${r.result} (${r.reason})`);
 }else{
  const url=arg('url'),file=arg('scenario');if(!url||!file){console.error('Usage: node scripts/viewer-qualify.mjs --url=https://... --scenario=file.json [--popups] [--downloads] [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]\n       node scripts/viewer-qualify.mjs --queue');process.exit(2)}
  const e=await qualifyDemo({demoUrl:url,scenario:JSON.parse(await readFile(file,'utf8')),flags:{popups:flag('popups'),downloads:flag('downloads')},browserName,mobile,screenshot:arg('screenshot')});console.log(JSON.stringify(e,null,2));process.exitCode=e.result==='ok'?0:1;
 }
}
