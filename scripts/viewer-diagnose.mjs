// Diagnoses why demos do or do not work inside the in-page viewer. For a random sample of working catalogue demos it
// loads each one in the REAL viewer (same component, stylesheet, sandbox string and production headers as visitors get,
// via the qualification harness), then records what happened and classifies the outcome with a suggested fix.
// Read-only: it writes a result file and a summary. No scenario is run; this measures "does the demo load and show
// something inside the frame", which is the first thing that has to be true.
//
//   node scripts/viewer-diagnose.mjs [--sample=200] [--concurrency=6] [--seed=1] [--minutes=25] [--out=viewer-diagnosis.json]
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {dirname} from 'node:path';
import {publicUrlGuard} from './demo-health.mjs';
import {harnessResponse,HARNESS_PATH} from './viewer-qualify.mjs';
import {classifyFraming,hostGroup} from './frame-probe.mjs';
const require=createRequire(import.meta.url),C=require('../dist/viewer-config.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const CHALLENGE=/just a moment|checking your browser|verify you are human|captcha|attention required|access denied|enable javascript and cookies/i;
const SLEEPING=/gone to sleep|get this app back up|app is (?:sleeping|asleep|hibernating)|space is sleeping|has been paused|is paused|waking up|wake up/i;
const BROKEN=/application error|runtime error|something went wrong|service unavailable|bad gateway|gateway time-?out|there was a problem|exited with|error code[: ]+[45]\d\d|this site can.t be reached|deployment (?:not found|has been disabled)|no such app|not found/i;
const BUILDING=/\bbuilding\b|starting\b.*space|your space is (?:starting|building)/i;

// What to do about each outcome. `fixable` says whether RepoShelf can change anything; the rest need the demo's owner.
export const OUTCOMES={
 works:{label:'Works',fix:'Nothing to fix.',fixable:'n/a'},
 blocked_by_site:{label:'Site forbids being framed (X-Frame-Options or CSP frame-ancestors)',fix:'Cannot be fixed by RepoShelf. Keep these on "open in new tab" automatically: the headers can be read in advance, so the viewer should not even try.',fixable:'detect'},
 connection_error:{label:'Frame could not connect or was refused for another reason',fix:'Usually a dead site, certificate problem or blocked frame. Detect and fall back to a new tab.',fixable:'detect'},
 http_error:{label:'Demo returned an HTTP error',fix:'The demo itself is down. Detect and fall back to a new tab; the catalogue health check should demote it.',fixable:'detect'},
 challenge_page:{label:'Bot or captcha challenge shown',fix:'Cannot be bypassed (and should not be). Fall back to a new tab.',fixable:'detect'},
 frame_buster:{label:'Demo tried to take over the whole page (frame-busting script)',fix:'The sandbox correctly refuses; the demo cannot be shown inside RepoShelf. Fall back to a new tab.',fixable:'detect'},
 app_sleeping:{label:'App is asleep or paused (Streamlit, Hugging Face and similar)',fix:'The visitor must press a wake-up button inside the frame, which can look broken. Detectable; consider a new tab or showing a "waking the app" note.',fixable:'partly'},
 app_error:{label:'App shows an error page',fix:'The demo is broken. Detect and fall back to a new tab; feed back into catalogue health.',fixable:'detect'},
 building:{label:'App is still starting or building',fix:'Usually clears within a minute. Retry before judging.',fixable:'partly'},
 blank_page:{label:'Frame loaded but shows nothing',fix:'Often a script that needs something the sandbox withholds (popups, top navigation, storage) or a slow app. Detect and fall back to a new tab.',fixable:'detect'},
 timeout:{label:'Did not finish loading in time',fix:'Slow or hung demo. Fall back to a new tab after a short wait.',fixable:'detect'},
 harness_error:{label:'Diagnostic tool error',fix:'Not a demo problem.',fixable:'n/a'}
};

// Pure: turn what was observed into one outcome. Order matters: the most specific, most certain cause wins.
export function classifyOutcome(f){
 if(f.harnessError)return {outcome:'harness_error',detail:f.harnessError};
 if(f.refused){const header=f.headerVerdict&&f.headerVerdict.embeddable===false?f.headerVerdict.reason:null;return header?{outcome:'blocked_by_site',detail:header}:{outcome:'connection_error',detail:f.refusedDetail||'refused'}}
 if(f.timedOut)return {outcome:'timeout'};
 if(f.status>=400)return {outcome:'http_error',detail:'HTTP '+f.status};
 if(f.topNavigationAttempted)return {outcome:'frame_buster'};
 if(CHALLENGE.test(f.text.slice(0,800)))return {outcome:'challenge_page'};
 if(SLEEPING.test(f.text.slice(0,1500)))return {outcome:'app_sleeping'};
 if(BUILDING.test(f.text.slice(0,400))&&f.text.length<400)return {outcome:'building'};
 if(f.text.trim().length<=3&&!f.visualElements)return {outcome:'blank_page'};
 if(BROKEN.test(f.text.slice(0,600))&&f.text.length<600)return {outcome:'app_error',detail:f.text.trim().slice(0,100)};
 return {outcome:'works'};
}

// Flags that do not decide the outcome but explain a likely real-world difference.
export function notesFor(f){const notes=[];if(f.blockedPopups)notes.push('wants_popups');if(f.blockedDownloads)notes.push('wants_downloads');if(f.storageErrors)notes.push('storage_errors');if(f.consoleErrors>10)notes.push('many_console_errors');return notes}

export async function diagnoseDemo(browser,{id,target,source},{guard=publicUrlGuard(),loadTimeoutMs=25000,settleMs=2500,setup}={}){
 const facts={id,target,source,text:'',visualElements:0,status:null,headerVerdict:null,refused:false,timedOut:false,topNavigationAttempted:false,blockedPopups:0,blockedDownloads:0,storageErrors:0,consoleErrors:0,consoleSamples:[]};
 const base={id,target,source,group:hostGroup(target)};
 if(!C.originOf(target))return {...base,outcome:'connection_error',detail:'not https',notes:[]};
 if(C.isOwnOrigin(target))return {...base,outcome:'connection_error',detail:'own origin',notes:[]};
 let context;
 try{
  context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:false});const page=await context.newPage();
  if(setup)await setup(context);
  const harness=C.VIEWER_ORIGIN+HARNESS_PATH,answer=await harnessResponse({demoUrl:target,flags:{},title:id});
  await context.route(harness,route=>route.fulfill(answer));
  const verdicts=new Map();
  await context.route('**/*',async route=>{const url=route.request().url();if(url===harness)return route.fallback();if(C.isOwnOrigin(url))return route.abort('blockedbyclient');if(!/^https?:/.test(url))return route.fallback();const host=new URL(url).hostname;if(!verdicts.has(host))verdicts.set(host,Promise.resolve(guard(url)).catch(()=>false));return await verdicts.get(host)?route.fallback():route.abort('blockedbyclient')});
  page.on('console',m=>{const t=m.text();if(m.type()==='error'){facts.consoleErrors++;if(facts.consoleSamples.length<3)facts.consoleSamples.push(t.slice(0,160))}if(/allow-top-navigation|top-level window is sandboxed|Unsafe attempt to initiate navigation/i.test(t))facts.topNavigationAttempted=true;if(/Blocked opening .* in a sandboxed frame|allow-popups/i.test(t))facts.blockedPopups++;if(/Download is disallowed|allow-downloads/i.test(t))facts.blockedDownloads++;if(/storage|cookie|indexeddb|localstorage|sessionstorage/i.test(t)&&/denied|not allowed|blocked|insecure|SecurityError/i.test(t))facts.storageErrors++});
  page.on('framenavigated',f=>{if(f===page.mainFrame()&&f.url()!==harness&&f.url()!=='about:blank')facts.topNavigationAttempted=true});
  page.on('response',r=>{const req=r.request();if(req.isNavigationRequest()&&req.frame()!==page.mainFrame()&&facts.status===null){facts.status=r.status();facts.headerVerdict=classifyFraming(r.headers())}});
  try{await page.goto(harness,{timeout:loadTimeoutMs,waitUntil:'domcontentloaded'})}catch(e){facts.harnessError='harness load failed';return {...base,...classifyOutcome(facts),notes:[]}}
  const element=await page.waitForSelector('.viewer-frame',{timeout:5000}),frame=await element.contentFrame();
  const until=Date.now()+loadTimeoutMs;while(frame.url()==='about:blank'&&Date.now()<until)await wait(100);
  if(frame.url()==='about:blank')facts.timedOut=true;
  else if(/^chrome-error:|^about:neterror/.test(frame.url())){facts.refused=true;facts.refusedDetail='chrome-error'}
  else{
   try{await frame.waitForLoadState('load',{timeout:Math.max(500,until-Date.now())})}catch{facts.timedOut=true}
   await wait(settleMs);
   if(/^chrome-error:|^about:neterror/.test(frame.url())){facts.refused=true;facts.refusedDetail='chrome-error'}
   else try{const seen=await frame.evaluate(()=>({text:(document.body?.innerText||'').slice(0,2000),visual:document.querySelectorAll('canvas,img,video,svg,iframe,picture').length}));facts.text=seen.text;facts.visualElements=seen.visual}catch{}
  }
  const result=classifyOutcome(facts);
  return {...base,...result,finalUrl:(()=>{try{return frame.url().slice(0,200)}catch{return null}})(),status:facts.status,notes:notesFor(facts),...(result.outcome!=='works'?{consoleSamples:facts.consoleSamples}:{})};
 }catch(e){return {...base,outcome:'harness_error',detail:String(e.message).split('\n')[0].slice(0,160),notes:[]}}
 finally{try{await context?.close()}catch{}}
}

export function summarize(results){
 const outcomes={},groups={},notes={};
 for(const r of results){outcomes[r.outcome]=(outcomes[r.outcome]||0)+1;groups[r.group]??={total:0,works:0,outcomes:{}};groups[r.group].total++;groups[r.group].outcomes[r.outcome]=(groups[r.group].outcomes[r.outcome]||0)+1;if(r.outcome==='works')groups[r.group].works++;for(const n of r.notes||[])notes[n]=(notes[n]||0)+1}
 const measured=results.filter(r=>r.outcome!=='harness_error');
 return {checked:results.length,measured:measured.length,works:outcomes.works||0,worksPercent:measured.length?Math.round((outcomes.works||0)/measured.length*1000)/10:null,outcomes,notes,
  groups:Object.entries(groups).sort((a,b)=>b[1].total-a[1].total).slice(0,18).map(([group,v])=>({group,total:v.total,works:v.works,percent:Math.round(v.works/v.total*1000)/10,outcomes:v.outcomes}))};
}
export function markdown(summary,results){
 const rows=Object.entries(summary.outcomes).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${OUTCOMES[k]?.label||k} | ${v} | ${Math.round(v/summary.checked*1000)/10}% | ${OUTCOMES[k]?.fix||''} |`).join('\n');
 const hosts=summary.groups.map(g=>`| ${g.group} | ${g.total} | ${g.percent}% | ${Object.entries(g.outcomes).filter(([k])=>k!=='works').sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', ')||'-'} |`).join('\n');
 const examples=Object.keys(summary.outcomes).filter(k=>k!=='works').map(k=>`- **${k}**: ${results.filter(r=>r.outcome===k).slice(0,4).map(r=>`${r.id} (${r.detail||''})`.replace(/\s\(\)$/,'')).join('; ')}`).join('\n');
 return `## Demo viewer diagnosis\n\n**${summary.worksPercent??'n/a'}% of ${summary.measured} sampled demos load and show content inside the viewer** (${summary.checked} checked).\n\n| Outcome | Demos | Share | What to do |\n|---|---|---|---|\n${rows}\n\n| Host | Checked | Works | Other outcomes |\n|---|---|---|---|\n${hosts}\n\nNotes (do not decide the outcome): ${Object.entries(summary.notes).map(([k,v])=>k+' '+v).join(', ')||'none'}.\n\nExamples:\n${examples}\n`;
}

async function main(){
 const args=new Map(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
 const sample=Number(args.get('sample')||200),concurrency=Math.min(8,Number(args.get('concurrency')||6)),minutes=Number(args.get('minutes')||25),out=args.get('out')||'viewer-diagnosis.json';
 const read=async p=>{try{return JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'))}catch{return {repositories:[]}}};
 const [catalog,spaces]=await Promise.all([read('dist/catalog.json'),read('dist/spaces.json')]);
 // The address the viewer would be given: the storefront links Spaces to their huggingface.co page, which can never be
 // framed, so measure both what the storefront links to today and (for Spaces) the Space's own app address.
 const all=[...catalog.repositories,...(spaces.repositories||[])].filter(r=>r.demo&&r.demoHealth?.status==='working'&&r.availability!=='unavailable');
 let seed=Number(args.get('seed')||1);const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 const chosen=all.map(r=>[random(),r]).sort((a,b)=>a[0]-b[0]).slice(0,sample).map(x=>x[1]);
 const jobs=[];for(const r of chosen){jobs.push({id:r.full,target:r.demo,source:r.source||'github'});if(r.source==='huggingface'&&r.appUrl&&r.appUrl!==r.demo)jobs.push({id:r.full+' (app address)',target:r.appUrl,source:'huggingface-app'})}
 const playwright=require('playwright'),browser=await playwright.chromium.launch(),results=[],guard=publicUrlGuard(),deadline=Date.now()+minutes*60000;let next=0;
 try{await Promise.all(Array.from({length:concurrency},async()=>{while(next<jobs.length&&Date.now()<deadline){const job=jobs[next++];results.push(await diagnoseDemo(browser,job,{guard}));if(results.length%20===0)console.log(`${results.length}/${jobs.length} checked`)}}))}finally{await browser.close()}
 const summary=summarize(results),text=markdown(summary,results);
 await mkdir(dirname(new URL('../'+out,import.meta.url).pathname),{recursive:true});await writeFile(new URL('../'+out,import.meta.url),JSON.stringify({at:new Date().toISOString(),sampled:chosen.length,skippedForTime:Math.max(0,jobs.length-results.length),summary,results},null,1));
 console.log(text);if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,text,{flag:'a'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
