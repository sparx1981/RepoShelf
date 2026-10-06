// Real-browser check of the viewer qualification tool against local fixture demos. Fixture pages are served through
// Playwright routes on fake https hosts, so the tool is exercised exactly as in production (canonical-origin
// harness page, exact sandbox string) without any network access.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {existsSync,statSync,rmSync} from 'node:fs';
import {qualifyDemo,qualifyQueue,harnessResponse,summaryMarkdown,HARNESS_PATH} from './viewer-qualify.mjs';
const require=createRequire(import.meta.url),C=require('../dist/viewer-config.js'),{chromium}=require('playwright');
const html=(body,script='')=>`<!doctype html><meta charset="utf-8"><title>fixture</title><body>${body}<script>${script}</script></body>`;
const page=(status,body,headers={})=>({status,headers:{'content-type':'text/html; charset=utf-8',...headers},body});
const hosts={
 'ok.demo.test':()=>page(200,html('<input id="t"><button id="add">Add</button><ul id="list"></ul>',`document.getElementById('add').onclick=()=>{const li=document.createElement('li');li.textContent=document.getElementById('t').value;document.getElementById('list').append(li)}`)),
 'refuse.demo.test':()=>page(200,html('<p>hello</p>'),{'x-frame-options':'DENY'}),
 'csp.demo.test':()=>page(200,html('<p>hello</p>'),{'content-security-policy':'frame-ancestors https://reposhelf.vercel.app'}),
 'top.demo.test':()=>page(200,html('<button id="go">Go</button><p id="r"></p>',`document.getElementById('go').onclick=()=>{try{top.location.href='https://evil.demo.test/'}catch(e){}document.getElementById('r').textContent='done'}`)),
 'popup.demo.test':()=>page(200,html('<button id="login">Log in</button><p id="r"></p>',`document.getElementById('login').onclick=()=>{const w=window.open('https://auth.demo.test/login','_blank');document.getElementById('r').textContent=w?'Opened':'Blocked'}`)),
 'download.demo.test':()=>page(200,html('<a id="get" href="https://files.demo.test/report.csv" download="report.csv">Download</a><p id="r"></p>',`document.getElementById('get').addEventListener('click',()=>{document.getElementById('r').textContent='Clicked'})`)),
 'files.demo.test':()=>({status:200,headers:{'content-type':'text/csv','content-disposition':'attachment; filename="report.csv"'},body:'a,b\n1,2\n'}),
 'auth.demo.test':()=>page(200,html('<p>Log in here</p>')),
 'error.demo.test':()=>page(500,html('<h1>Server error</h1>')),
 'challenge.demo.test':()=>page(200,html('<h1>Just a moment...</h1><p>Checking your browser before accessing the site.</p>')),
 'redirect.demo.test':()=>page(200,html('<p>Moving…</p>',`location.replace('https://ok.demo.test/')`)),
 'slow.demo.test':()=>null,
 'beacon.demo.test':()=>page(200,html('<button id="go">Go</button><p id="r"></p>',`document.getElementById('go').onclick=()=>{fetch('https://internal.demo.test/secret').catch(()=>{});document.getElementById('r').textContent='sent'}`)),
 'bounce.demo.test':()=>page(200,html('<p>Moving…</p>',`location.replace('https://reposhelf.vercel.app/')`)),
 'empty.demo.test':()=>page(200,html('<a id="get" href="https://nothing.demo.test/r.csv" download="r.csv">Download</a>')),
 'nothing.demo.test':()=>({status:200,headers:{'content-type':'text/csv','content-disposition':'attachment; filename="r.csv"'},body:''}),
};
const setup=async context=>{await context.route(/^https:\/\/[a-z]+\.demo\.test\//,async route=>{const host=new URL(route.request().url()).hostname,make=hosts[host];if(!make)return route.abort();const r=make();if(r===null){await new Promise(resolve=>setTimeout(resolve,6000));return route.abort().catch(()=>{})}return route.fulfill(r)});await context.route(/^https:\/\/evil\.demo\.test\//,route=>route.fulfill(page(200,html('<p>Taken over</p>'))));await context.route(/^https:\/\/reposhelf\.vercel\.app\//,route=>route.fulfill(page(200,html('<p>RepoShelf</p>'))))};
const guard=async url=>!/internal\.demo\.test/.test(url);
const launch=()=>chromium.launch();
const run=(host,scenario,flags={},options={})=>qualifyDemo({project:'team/'+host.split('.')[0],demoUrl:`https://${host}/`,scenario,flags,launch,setup,guard,loadTimeoutMs:2500,stepTimeoutMs:2000,...options});
const add={summary:'Adding a task shows it in the list',steps:[{action:'fill',selector:'#t',value:'Buy milk'},{action:'click',selector:'#add'},{action:'expectText',selector:'#list',text:'Buy milk'}]};
let r;
// a demo that really works qualifies, and the evidence names exactly what was tested
r=await run('ok.demo.test',add,{},{screenshot:'/tmp/viewer-qualify-ok.png'});assert.equal(r.result,'ok',JSON.stringify(r));assert.equal(r.configId,C.configId({}));assert.equal(r.browser,'chromium');assert.equal(r.resolvedUrl,'https://ok.demo.test/');assert.match(r.scenarioHash,/^[a-f0-9]{16}$/);assert.equal(r.details.steps.length,3);assert(r.details.steps.every(s=>s.ok));assert(existsSync('/tmp/viewer-qualify-ok.png')&&statSync('/tmp/viewer-qualify-ok.png').size>500,'a screenshot is saved');rmSync('/tmp/viewer-qualify-ok.png');
// redirects are followed and the final address is recorded
r=await run('redirect.demo.test',add);assert.equal(r.result,'ok',JSON.stringify(r));assert.equal(r.resolvedUrl,'https://ok.demo.test/','the resolved address after redirects is recorded');
// a scenario whose result never appears fails: loading the page is not enough
r=await run('ok.demo.test',{summary:'x',steps:[{action:'click',selector:'#add'},{action:'expectText',selector:'#list',text:'Never shown'}]});assert.equal(r.result,'failed');assert.equal(r.reason,'step_2_expectText');
// scenarios without an interaction or a result are rejected before any browser starts
r=await run('ok.demo.test',{summary:'x',steps:[{action:'expectText',text:'Add'}]});assert.equal(r.result,'failed');assert.equal(r.reason,'invalid_scenario');
// framing refused by headers, on the canonical origin: X-Frame-Options and a CSP that names only another origin
for(const host of ['refuse.demo.test','csp.demo.test']){r=await run(host,add);assert.equal(r.result,'failed',host+JSON.stringify(r));assert.equal(r.reason,'frame_refused',host)}
// a demo that tries to take over the page fails even though its own steps pass
r=await run('top.demo.test',{summary:'Go button',steps:[{action:'click',selector:'#go'},{action:'expectText',selector:'#r',text:'done'}]});assert.equal(r.result,'failed',JSON.stringify(r));assert.equal(r.reason,'top_navigation_attempt');
// error and challenge pages
r=await run('error.demo.test',{summary:'x',steps:[{action:'click',selector:'h1'},{action:'expectVisible',selector:'h1'}]});assert.equal(r.result,'failed');assert.equal(r.reason,'http_500');
r=await run('challenge.demo.test',{summary:'x',steps:[{action:'click',selector:'h1'},{action:'expectVisible',selector:'h1'}]});assert.equal(r.result,'inconclusive');assert.equal(r.reason,'challenge_page','uncertainty is never a pass');
// a demo that never finishes loading is inconclusive, not a pass
r=await run('slow.demo.test',add,{},{loadTimeoutMs:1500});assert(['inconclusive','failed'].includes(r.result)&&r.result!=='ok',JSON.stringify(r));
// popups: blocked by default, allowed per demo, and the destination is inspected
const popup={summary:'Log in opens a window',steps:[{action:'click',selector:'#login'},{action:'expectText',selector:'#r',text:'Opened'},{action:'expectPopup',host:'auth.demo.test'}]};
r=await run('popup.demo.test',popup);assert.equal(r.result,'failed');assert.equal(r.reason,'step_2_expectText','without the popup flag the sandbox blocks the window');
r=await run('popup.demo.test',popup,{popups:true});assert.equal(r.result,'ok',JSON.stringify(r));assert.equal(r.configId,C.configId({popups:true}));assert.equal(new URL(r.details.popups[0].url).host,'auth.demo.test','the popup destination is recorded');
r=await run('popup.demo.test',{...popup,steps:[...popup.steps.slice(0,2),{action:'expectPopup',host:'elsewhere.test'}]},{popups:true});assert.equal(r.result,'failed');assert.equal(r.reason,'step_3_expectPopup','an unexpected popup destination fails');
// downloads: blocked by default, allowed per demo, and explicitly tested
const download={summary:'The report downloads',steps:[{action:'click',selector:'#get'},{action:'expectDownload'}]};
r=await run('download.demo.test',download);assert.equal(r.result,'failed');assert.equal(r.reason,'step_2_expectDownload');
r=await run('download.demo.test',download,{downloads:true});assert.equal(r.result,'ok',JSON.stringify(r));assert.equal(r.details.downloads[0].file,'report.csv');
// the harness is the production page: real component, production headers (including the denied device permissions)
const h=await harnessResponse({demoUrl:'https://ok.demo.test/',flags:{}});assert.match(h.body,/RepoViewer\.create/);assert.match(h.body,/viewer-bar/);assert.match(h.headers['Permissions-Policy']||'',/camera=\(\)/);assert.equal(h.headers['X-Content-Type-Options'],'nosniff');assert.equal(h.headers['Referrer-Policy'],'strict-origin-when-cross-origin');
// every browser request must go to a public address; RepoShelf is never an acceptable demo
r=await run('beacon.demo.test',{summary:'x',steps:[{action:'click',selector:'#go'},{action:'expectText',selector:'#r',text:'sent'}]});assert.equal(r.result,'failed',JSON.stringify(r));assert.equal(r.reason,'unsafe_destination');assert(r.details.blockedRequests.includes('internal.demo.test'));
r=await qualifyDemo({demoUrl:'https://www.reposhelf.co.uk/',scenario:add,launch,setup,guard});assert.equal(r.reason,'own_origin');r=await qualifyDemo({demoUrl:'https://reposhelf.vercel.app/x',scenario:add,launch,setup,guard});assert.equal(r.reason,'own_origin');
r=await run('bounce.demo.test',add);assert.equal(r.result,'failed',JSON.stringify(r));assert.equal(r.reason,'own_origin','a redirect to RepoShelf is refused');
// a download that arrives empty is not a successful download
r=await run('empty.demo.test',{summary:'x',steps:[{action:'click',selector:'#get'},{action:'expectDownload'}]},{downloads:true});assert.equal(r.result,'failed');assert.equal(r.reason,'step_2_expectDownload');
r=await run('download.demo.test',{summary:'x',steps:[{action:'click',selector:'#get'},{action:'expectDownload',filename:'other.csv'}]},{downloads:true});assert.equal(r.reason,'step_2_expectDownload','an unexpected file name fails');
r=await run('download.demo.test',{summary:'x',steps:[{action:'click',selector:'#get'},{action:'expectDownload',filename:'report.csv',minBytes:8}]},{downloads:true});assert.equal(r.result,'ok',JSON.stringify(r));assert.equal(r.details.downloads[0].bytes,8,'the saved size is recorded');
// non-https demos never qualify
r=await qualifyDemo({demoUrl:'http://ok.demo.test/',scenario:add,launch,setup});assert.equal(r.reason,'not_https');
// the queue runner: one browser profile at a time, every result reported, edited-while-running results discarded
const posted=[];const items=[{project_id:'team/ok',demo_url:'https://ok.demo.test/',scenario:add,allow_popups:false,allow_downloads:false},{project_id:'team/refuse',demo_url:'https://refuse.demo.test/',scenario:add},{project_id:'team/edited',demo_url:'https://ok.demo.test/',scenario:add}];
const queueReport=required=>async(path,body)=>{if(path==='queue')return {items,requiredProfiles:required};posted.push(body);return body.project==='team/edited'?{ok:false,reason:'scenario_changed'}:{ok:true}};
const summary=await qualifyQueue({origin:'https://x.test',key:'k'.repeat(40),browserName:'chromium',report:queueReport(['chromium']),qualify:o=>run(new URL(o.demoUrl).host,o.scenario,o.flags,{project:o.project})});
assert.deepEqual([summary.profile,summary.checked,summary.ok,summary.failed,summary.inconclusive,summary.discarded],['chromium',2,1,1,0,1]);assert.deepEqual(posted.map(p=>[p.project,p.result,p.browser]),[['team/ok','ok','chromium'],['team/refuse','failed','chromium'],['team/edited','ok','chromium']]);assert(posted.every(p=>/^v\d+\|/.test(p.configId)&&/^[a-f0-9]{16}$/.test(p.scenarioHash)&&p.demoUrl));
assert.match(summaryMarkdown(summary),/1 discarded/);assert.match(summaryMarkdown(summary),/team\/refuse \| failed \| frame_refused/);
const before=posted.length,skipped=await qualifyQueue({origin:'https://x.test',key:'k'.repeat(40),browserName:'webkit',ifRequired:true,report:queueReport(['chromium']),qualify:()=>{throw Error('must not run')}});assert.equal(skipped.notRequired,true);assert.equal(posted.length,before,'a profile that is not required is not run');
const mobile=await qualifyQueue({origin:'https://x.test',key:'k'.repeat(40),browserName:'chromium',mobile:true,ifRequired:true,report:queueReport(['chromium-mobile']),qualify:async o=>({project:o.project,result:'ok',reason:null,browser:'chromium-mobile',configId:'v1|popups=0|downloads=0',demoUrl:o.demoUrl,resolvedUrl:o.demoUrl,scenarioHash:'0123456789abcdef',details:{}})});assert.equal(mobile.profile,'chromium-mobile');assert.equal(mobile.ok,2);
assert.equal(HARNESS_PATH,'/__viewer-qualify');
console.log('PASS: viewer qualification runs real interactions in the exact sandbox on the canonical origin, fails refused frames, top-navigation, errors, missing results and unexpected popups or downloads, never passes uncertainty, and reports every result.');
