import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {classifyOutcome,notesFor,summarize,OUTCOMES,diagnoseDemo} from '../scripts/viewer-diagnose.mjs';
const base={text:'Hello demo, this page has plenty of readable content.',visualElements:0,status:200,headerVerdict:{embeddable:true},refused:false,timedOut:false,topNavigationAttempted:false};
const out=f=>classifyOutcome({...base,...f}).outcome;
assert.equal(out({}),'works');
assert.equal(out({refused:true,headerVerdict:{embeddable:false,reason:'x_frame_options_deny'}}),'blocked_by_site');
assert.equal(out({refused:true,headerVerdict:null,failure:'net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin'}),'blocked_by_site','the browser itself says the response blocked framing');
assert.equal(out({refused:true,headerVerdict:null,failure:'net::ERR_NAME_NOT_RESOLVED'}),'connection_error');
assert.equal(out({refused:true,headerVerdict:null}),'connection_error','a refusal with no restrictive header is a connection problem, not a policy');
assert.equal(out({timedOut:true}),'timeout');assert.equal(out({status:503}),'http_error');assert.equal(out({status:404}),'http_error');
assert.equal(out({topNavigationAttempted:true}),'frame_buster');
assert.equal(out({text:'Just a moment... Checking your browser'}),'challenge_page');
assert.equal(out({text:'This app has gone to sleep due to inactivity. Yes, get this app back up!'}),'app_sleeping');
assert.equal(out({text:'',visualElements:0}),'blank_page');assert.equal(out({text:'',visualElements:3}),'works','a canvas-only demo is not blank');
assert.equal(out({text:'Application error: a client-side exception has occurred'}),'app_error');
assert.equal(out({text:'A long article that mentions an application error in passing. '.repeat(30)}),'works','long pages that merely mention errors still work');
assert.equal(out({harnessError:'x'}),'harness_error');
assert.deepEqual(notesFor({blockedPopups:1,blockedDownloads:0,storageErrors:2,consoleErrors:20}),['wants_popups','storage_errors','many_console_errors']);
for(const k of ['works','blocked_by_site','connection_error','http_error','challenge_page','frame_buster','app_sleeping','app_error','building','blank_page','timeout','harness_error'])assert(OUTCOMES[k]?.label&&OUTCOMES[k]?.fix,k+' needs a label and a fix');
const s=summarize([{outcome:'works',group:'a.io',notes:[]},{outcome:'blocked_by_site',group:'a.io',notes:['wants_popups']},{outcome:'harness_error',group:'b.io',notes:[]}]);
assert.equal(s.measured,2);assert.equal(s.worksPercent,50);assert.equal(s.notes.wants_popups,1);

// Real browser, fixture pages served through route interception (no network): each behaviour is detected as itself.
// Playwright is not installed where only the logic suites run (the sync's prepare job, the "Validate application" step), so the
// real-browser half skips itself there and runs in the "Verify catalog search..." step, which installs the browser first.
const playwright=(()=>{try{return createRequire(import.meta.url)('playwright')}catch(e){if(e.code==='MODULE_NOT_FOUND')return null;throw e}})();
if(!playwright)console.log('PASS (logic only): viewer outcomes classify correctly; the real-browser fixtures were skipped because playwright is not installed here.');
else{
const browser=await playwright.chromium.launch();
try{
 const page=(body,extra={})=>({status:200,contentType:'text/html',body:'<!doctype html><meta charset=utf-8>'+body,...extra});
 const fixtures={
  'https://ok.example/':page('<h1>Todo app</h1><p>Add your first task to get started with this demo.</p>'),
  'https://deny.example/':page('<h1>Hi</h1>',{headers:{'x-frame-options':'DENY'}}),
  'https://ancestors.example/':page('<h1>Hi</h1>',{headers:{'content-security-policy':"frame-ancestors 'none'"}}),
  'https://down.example/':page('<h1>Bad gateway</h1>',{status:502}),
  'https://buster.example/':page('<script>try{top.location="https://evil.example/"}catch(e){}</script><p>x</p>'),
  'https://sleep.example/':page('<h2>This app has gone to sleep due to inactivity</h2><button>Yes, get this app back up!</button>'),
  'https://blank.example/':page(''),
  'https://canvas.example/':page('<canvas width=200 height=100></canvas>'),
  'https://challenge.example/':page('<h1>Just a moment...</h1>')
 };
 const setup=async context=>context.route(/^https:\/\/[a-z]+\.example\//,route=>{const f=fixtures[route.request().url()];return f?route.fulfill(f):route.abort()});
 const run=async(name)=>diagnoseDemo(browser,{id:name,target:'https://'+name+'.example/',source:'test'},{guard:async()=>true,loadTimeoutMs:8000,settleMs:300,setup});
 const expected={ok:'works',deny:'blocked_by_site',ancestors:'blocked_by_site',down:'http_error',buster:'frame_buster',sleep:'app_sleeping',blank:'blank_page',canvas:'works',challenge:'challenge_page'};
 for(const [name,outcome] of Object.entries(expected)){const r=await run(name);assert.equal(r.outcome,outcome,name+' was classified as '+r.outcome+' ('+(r.detail||'')+')')}
 assert.equal((await diagnoseDemo(browser,{id:'x',target:'http://plain.example/',source:'t'},{guard:async()=>true})).outcome,'connection_error','http addresses never open in the viewer');
 assert.equal((await diagnoseDemo(browser,{id:'x',target:'https://www.reposhelf.co.uk/x',source:'t'},{guard:async()=>true})).outcome,'connection_error','RepoShelf is never a demo');
}finally{await browser.close()}
console.log('PASS: viewer diagnosis classifies blocked, down, challenge, sleeping, blank, frame-busting and working demos in the real viewer.');
}
