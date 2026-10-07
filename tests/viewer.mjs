import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createViewerHandler} from '../lib/viewer.mjs';import {validateScenario,scenarioHash} from '../lib/viewer-scenario.mjs';import {AccountError} from '../lib/accounts.mjs';
const C=createRequire(import.meta.url)('../dist/viewer-config.js');
const now=Date.parse('2026-10-06T12:00:00Z'),hoursAgo=h=>new Date(now-h*3600000).toISOString();
// ---- sandbox: scripts and forms only by default; popups and downloads are per-demo; never top navigation
assert.equal(C.sandbox({}),'allow-scripts allow-same-origin allow-forms allow-modals');
for(const f of [{},{popups:true},{downloads:true},{popups:true,downloads:true}])assert(!/top-navigation/.test(C.sandbox(f)),'top navigation is never allowed');
assert.match(C.sandbox({popups:true}),/allow-popups allow-popups-to-escape-sandbox/);assert.doesNotMatch(C.sandbox({popups:true}),/allow-downloads/);assert.match(C.sandbox({downloads:true}),/allow-downloads/);assert.doesNotMatch(C.sandbox({downloads:true}),/allow-popups/);
assert.notEqual(C.configId({popups:true}),C.configId({}),'flags change the configuration id');assert.match(C.configId({}),/^v\d+\|popups=0\|downloads=0$/);
// ---- RepoShelf itself can never be a demo destination
for(const u of ['https://www.reposhelf.co.uk/','https://reposhelf.co.uk/x','https://reposhelf.vercel.app/','https://anything.reposhelf.co.uk/'])assert.equal(C.isOwnOrigin(u),true,u);for(const u of ['https://reposhelf.co.uk.evil.example/','https://notreposhelf.co.uk/','https://demo.example/'])assert.equal(C.isOwnOrigin(u),false,u);
// ---- eligibility: positive, recent, specific, per-profile evidence; anything else opens externally
const demo={approved:true,demo_url:'https://d.example/x',scenario_hash:'h1',allow_popups:false,allow_downloads:false};
const run=(browser,over={})=>({browser,result:'ok',demo_url:demo.demo_url,scenario_hash:'h1',config_id:C.configId(C.flags(demo)),checked_at:hoursAgo(1),resolved_url:'https://cdn.example/app',...over});
const state=(over={},profiles=[run('chromium')],extra={})=>({enabled:true,required_profiles:['chromium'],demo:{...demo,...over},profiles,latest:profiles[0]||null,...extra});
const why=(s,t=now)=>C.eligibility(s,t).reason;
const good=C.eligibility(state(),now);assert.equal(good.eligible,true);assert.equal(good.sandbox,C.sandbox({}));assert.deepEqual(good.frameOrigins,['https://d.example','https://cdn.example'],'redirect destinations are part of the exact frame origins');
assert.equal(why({...state(),enabled:false}),'global_disabled');assert.equal(why({enabled:true,demo:null,profiles:[]}),'not_approved');assert.equal(why(state({approved:false})),'not_approved');
assert.equal(why(state({manual_disabled:true})),'manual_disabled');assert.equal(why(state({auto_disabled:true})),'suspended');assert.equal(why(state({demo_url:'http://d.example/x'})),'not_https');assert.equal(why(state({demo_url:'https://www.reposhelf.co.uk/'})),'own_origin');
assert.equal(why(state({},[])),'no_evidence');assert.equal(why(state({},[run('chromium',{result:'failed'})])),'latest_failed','the latest run decides, even if an older success is still fresh');assert.equal(why(state({},[run('chromium',{result:'inconclusive'})])),'latest_inconclusive','inconclusive means external');
assert.equal(why(state({demo_url:'https://d.example/other'})),'url_changed','evidence belongs to one exact address');
assert.equal(why(state({scenario_hash:'h2'})),'scenario_changed','editing the scenario invalidates earlier evidence');assert.equal(why(state({scenario_hash:null})),'scenario_changed','a demo without a scenario hash is never eligible');
assert.equal(why(state({allow_popups:true})),'config_changed','a flag change needs a new qualification');
assert.equal(why(state({},[run('chromium',{checked_at:hoursAgo(47)})])),'ok');assert.equal(why(state({},[run('chromium',{checked_at:hoursAgo(49)})])),'stale','evidence is good for 48 hours');assert.equal(why(state({},[run('chromium',{checked_at:new Date(now+3600000).toISOString()})])),'stale','a timestamp from the future is not trusted');assert.equal(why(state({},[run('chromium',{checked_at:'nonsense'})])),'stale');
assert.equal(why(state({},[run('chromium',{resolved_url:'https://www.reposhelf.co.uk/'})])),'own_origin','a redirect back to RepoShelf is refused');
// per-profile: a Chromium pass never hides another browser's failure, and every required profile must pass
const two=['chromium','firefox'];
assert.equal(why(state({},[run('chromium'),run('firefox',{result:'failed'})],{required_profiles:two})),'latest_failed','a firefox failure blocks even with a chromium pass');
assert.equal(why(state({},[run('chromium'),run('webkit',{result:'failed'})])),'latest_failed','a failing profile blocks even when it is not required, until it passes again or an administrator clears it');
assert.equal(why(state({},[run('chromium')],{required_profiles:two})),'no_evidence','every required profile needs evidence');
assert.equal(why(state({},[run('chromium'),run('firefox',{checked_at:hoursAgo(60)})],{required_profiles:two})),'stale','every required profile must be fresh');
assert.equal(why(state({},[run('chromium'),run('firefox',{scenario_hash:'old'})],{required_profiles:two})),'scenario_changed');
const both=C.eligibility(state({},[run('chromium',{checked_at:hoursAgo(2)}),run('firefox',{checked_at:hoursAgo(10)})],{required_profiles:two}),now);assert.equal(both.eligible,true);assert.equal(both.checkedAt,hoursAgo(10),'the oldest required run sets the evidence age');
// ---- scenarios must interact, and assert a result after the last interaction
assert.equal(validateScenario(null).ok,false);
const scenario={summary:'Adds a task and shows it in the list',steps:[{action:'fill',selector:'#new-task',value:'Buy milk'},{action:'press',key:'Enter'},{action:'expectText',text:'Buy milk',selector:'#list'}]};
const valid=validateScenario(scenario);assert.equal(valid.ok,true);assert.equal(scenarioHash(valid.scenario),scenarioHash(structuredClone(valid.scenario)),'the hash is stable');assert.notEqual(scenarioHash(valid.scenario),scenarioHash({...valid.scenario,summary:'changed'}),'any change changes the hash');
const bad=s=>validateScenario({summary:'x',...s});
assert.equal(bad({steps:[{action:'expectText',text:'Hello'}]}).ok,false,'an assertion alone is only a page load');
assert.equal(bad({steps:[{action:'click',selector:'button'}]}).ok,false,'an interaction without a result proves nothing');
assert.equal(bad({steps:[{action:'expectVisible',selector:'#a'},{action:'click',selector:'#b'}]}).ok,false,'an assertion before the action does not prove the action');
assert.equal(bad({steps:[{action:'click',selector:'body'},{action:'expectVisible',selector:'body'}]}).ok,false,'"the page is visible" is not a result');
assert.equal(bad({steps:[{action:'expectText',text:'a'},{action:'click',selector:'a'},{action:'expectText',text:'b'}]}).ok,true,'checking before acting is fine when a result follows');
assert.equal(bad({steps:[{action:'eval',selector:'alert(1)'}]}).ok,false,'unknown actions are refused');
assert.equal(validateScenario({summary:'',steps:scenario.steps}).ok,false);assert.equal(bad({steps:Array.from({length:15},()=>scenario.steps[0])}).ok,false);assert.equal(bad({steps:[{action:'click',selector:'a'},{action:'expectVisible',selector:'b',timeoutMs:10}]}).ok,false);
assert.deepEqual(bad({steps:[{action:'click',selector:'a',extra:'ignored'},{action:'expectVisible',selector:'b'}]}).scenario.steps[0],{action:'click',selector:'a'},'unknown fields are dropped');
// credentials never belong in scenarios; login popups cannot be qualified; downloads can require a name and size
assert.equal(bad({steps:[{action:'fill',selector:'#password',value:'hunter2'},{action:'expectVisible',selector:'#ok'}]}).ok,false,'password fields are refused');
assert.equal(bad({steps:[{action:'fill',selector:'#key',value:'ghp_abcdefghijklmnopqrstuvwxyz0123456789'},{action:'expectVisible',selector:'#ok'}]}).ok,false,'token-shaped values are refused');
assert.equal(bad({steps:[{action:'click',selector:'a'},{action:'expectPopup',host:'accounts.google.com'}]}).ok,false);assert.equal(bad({steps:[{action:'click',selector:'a'},{action:'expectPopup',host:'github.com'}]}).ok,false);assert.equal(bad({steps:[{action:'click',selector:'a'},{action:'expectPopup',host:'docs.example.org'}]}).ok,true,'an ordinary popup is fine');
assert.deepEqual(bad({steps:[{action:'click',selector:'a'},{action:'expectDownload',filename:'report.csv',minBytes:4}]}).scenario.steps[1],{action:'expectDownload',filename:'report.csv',minBytes:4});assert.equal(bad({steps:[{action:'click',selector:'a'},{action:'expectDownload',minBytes:0}]}).ok,false);
// ---- the endpoint
const calls=[];let db,failing=false,prefs=false;const reset=()=>{db=state()};reset();
const person={id:'00000000-0000-0000-0000-000000000001'};
const accounts={config:{origin:'https://www.reposhelf.co.uk'},origin(req){if(req.headers.origin!=='https://www.reposhelf.co.uk')throw new AccountError(403,'origin_not_allowed','no')},async admin(req){if(!req.admin)throw new AccountError(403,'forbidden','Administrator access is required.');return person},
 async request(path,{body}={}){calls.push({path,body});if(failing)throw new AccountError(503,'database_unavailable','down');const name=path.split('/').pop();
  if(name==='reposhelf_viewer_state')return db;if(name==='reposhelf_viewer_list')return {enabled:true,required_profiles:['chromium'],demos:[{...demo,project_id:'team/a',latest:run('chromium'),profiles:[run('chromium')]}]};if(name==='reposhelf_viewer_queue')return {required_profiles:['chromium','firefox'],items:[{project_id:'team/a'}]};if(name==='reposhelf_viewer_pref_get')return prefs;if(name==='reposhelf_viewer_pref_set'){prefs=body.p_preview;return prefs}return {ok:true,called:name,body}}};
const key='k'.repeat(40),handler=createViewerHandler({accounts,key,now:()=>now});
const call=async(method,url,{body,admin=false,origin='https://www.reposhelf.co.uk',auth}={})=>{const res={status:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v},writeHead(s,h){this.status=s;Object.assign(this.headers,Object.fromEntries(Object.entries(h||{}).map(([k,v])=>[k.toLowerCase(),v])))},end(b){this.body=b}};try{await handler({method,url,headers:{origin,...(auth?{authorization:auth}:{})},admin,body:body===undefined?undefined:JSON.stringify(body)},res)}catch(e){return {status:e.status,code:e.code,message:e.message}}return {status:res.status,headers:res.headers,data:res.body?JSON.parse(res.body):null}};
// visitors
let r=await call('GET','/api/viewer?id=team/a');assert.equal(r.status,200);assert.equal(r.data.eligible,true);assert.match(r.headers['cache-control'],/no-store/,'eligibility is never cached');assert(!JSON.stringify(r.data).includes('admin'),'nothing private is returned');
assert.equal((await call('GET','/api/viewer?id=../etc')).code,'invalid_id');
db={...state(),enabled:false};assert.equal((await call('GET','/api/viewer?id=team/a')).data.reason,'global_disabled');reset();
db=state({scenario_hash:'edited'});assert.equal((await call('GET','/api/viewer?id=team/a')).data.eligible,false,'an edited scenario is not eligible until it is qualified again');reset();
failing=true;r=await call('GET','/api/viewer?id=team/a');assert.equal(r.status,200);assert.deepEqual(r.data,{eligible:false,reason:'unavailable'},'any backend trouble means the external demo');failing=false;
// administrators
assert.equal((await call('GET','/api/viewer?action=list')).code,'forbidden');assert.equal((await call('POST','/api/viewer?action=settings',{body:{enabled:true},admin:true,origin:'https://evil.example'})).code,'origin_not_allowed');
r=await call('GET','/api/viewer?action=list',{admin:true});assert.equal(r.status,200);assert.equal(r.data.demos[0].eligibility.eligible,true);assert.equal(r.data.config.maxEvidenceAgeHours,48);assert(r.data.config.profiles.includes('webkit'));
for(const bad of [{enabled:'yes'},{},{requiredProfiles:[]},{requiredProfiles:['netscape']},{requiredProfiles:['firefox-mobile']},{requiredProfiles:'chromium'}])assert.equal((await call('POST','/api/viewer?action=settings',{body:bad,admin:true})).code,'invalid_settings',JSON.stringify(bad));
assert.equal((await call('POST','/api/viewer?action=settings',{body:{enabled:false},admin:true})).data.called,'reposhelf_viewer_settings');r=await call('POST','/api/viewer?action=settings',{body:{requiredProfiles:['chromium','webkit','webkit']},admin:true});assert.deepEqual(calls.at(-1).body.p_required,['chromium','webkit']);assert.equal(calls.at(-1).body.p_enabled,null,'changing profiles does not touch the switch');
assert.equal((await call('POST','/api/viewer?action=save',{body:{project:'team/a',demoUrl:'http://d.example/',scenario,approved:true},admin:true})).code,'invalid_demo','an http demo cannot be approved');
assert.equal((await call('POST','/api/viewer?action=save',{body:{project:'team/a',demoUrl:'https://www.reposhelf.co.uk/x',scenario,approved:true},admin:true})).code,'own_origin','RepoShelf cannot be a demo');assert.equal((await call('POST','/api/viewer?action=save',{body:{project:'team/a',demoUrl:'https://reposhelf.vercel.app/',scenario,approved:true},admin:true})).code,'own_origin');
assert.equal((await call('POST','/api/viewer?action=save',{body:{project:'team/a',demoUrl:'https://d.example/',scenario:{summary:'x',steps:[{action:'expectText',text:'Hi'}]},approved:true},admin:true})).code,'invalid_scenario');
r=await call('POST','/api/viewer?action=save',{body:{project:'team/a',demoUrl:'https://d.example/',scenario,approved:true,allowPopups:true,notes:'pilot'},admin:true});assert.equal(r.status,200);const saved=calls.at(-1).body;assert.equal(saved.p_actor,person.id);assert.equal(saved.p_popups,true);assert.equal(saved.p_downloads,false);assert.equal(saved.p_scenario_hash,scenarioHash(valid.scenario),'the server computes the scenario hash from the validated scenario');
r=await call('POST','/api/viewer?action=disable',{body:{project:'team/a',disabled:true,reason:'broken in Safari'},admin:true});assert.equal(calls.at(-1).body.p_disabled,true);assert.equal((await call('POST','/api/viewer?action=disable',{body:{project:'team/a'},admin:true})).code,'invalid_request');
r=await call('POST','/api/viewer?action=clear-profile',{body:{project:'team/a',browser:'webkit'},admin:true});assert.equal(calls.at(-1).body.p_browser,'webkit');assert.equal((await call('POST','/api/viewer?action=clear-profile',{body:{project:'team/a',browser:'netscape'},admin:true})).code,'invalid_request');assert.equal((await call('POST','/api/viewer?action=clear-profile',{body:{project:'team/a',browser:'webkit'}})).code,'forbidden');
// the qualification job
assert.equal((await call('POST','/api/viewer?action=queue')).code,'worker_unauthorized');assert.equal((await call('POST','/api/viewer?action=queue',{auth:'Bearer wrong'+key})).code,'worker_unauthorized');
r=await call('POST','/api/viewer?action=queue',{auth:'Bearer '+key});assert.equal(r.status,200);assert.equal(r.data.items.length,1);assert.deepEqual(r.data.requiredProfiles,['chromium','firefox']);
const evidence={project:'team/a',result:'ok',configId:C.configId({}),browser:'chromium',demoUrl:'https://d.example/x',resolvedUrl:'https://d.example/x',scenarioHash:'abc',details:{steps:3}};
assert.equal((await call('POST','/api/viewer?action=record',{auth:'Bearer '+key,body:evidence})).status,200);assert.equal(calls.at(-1).body.p_result,'ok');assert.equal(calls.at(-1).body.p_scenario_hash,'abc');
for(const bad of [{result:'maybe'},{configId:'v1'},{demoUrl:'http://d.example/'},{project:'nope'},{browser:'netscape'},{browser:'firefox-mobile'},{browser:'x'.repeat(61)},{scenarioHash:undefined},{scenarioHash:'x'.repeat(81)}])assert.equal((await call('POST','/api/viewer?action=record',{auth:'Bearer '+key,body:{...evidence,...bad}})).code,'invalid_evidence',JSON.stringify(bad));
// an administrator's own preview preference: private to the account, off by default, and any trouble means off
assert.equal((await call('GET','/api/viewer?action=my-preview')).code,'forbidden','only administrators have the preference');
r=await call('GET','/api/viewer?action=my-preview',{admin:true});assert.deepEqual(r.data,{preview:false,available:true},'the preference starts off');assert.equal(calls.at(-1).body.p_user,person.id,'it is read for the signed-in administrator only');
assert.equal((await call('POST','/api/viewer?action=my-preview',{body:{preview:true},admin:true,origin:'https://evil.example'})).code,'origin_not_allowed');
for(const bad of [{},{preview:'yes'},{preview:1}])assert.equal((await call('POST','/api/viewer?action=my-preview',{body:bad,admin:true})).code,'invalid_preference',JSON.stringify(bad));
r=await call('POST','/api/viewer?action=my-preview',{body:{preview:true},admin:true});assert.deepEqual(r.data,{preview:true,available:true});assert.equal(calls.at(-1).body.p_user,person.id);
assert.equal((await call('GET','/api/viewer?action=my-preview',{admin:true})).data.preview,true,'the saved choice is read back');
assert.equal((await call('GET','/api/viewer?id=team/a')).data.preview,undefined,'visitors are never told about administrator previews');
failing=true;r=await call('GET','/api/viewer?action=my-preview',{admin:true});assert.deepEqual(r.data,{preview:false,available:false},'an unavailable store means off, so the demo opens in a new tab');failing=false;
r=await call('POST','/api/viewer?action=my-preview',{body:{preview:false},admin:true});assert.equal(r.data.preview,false);
// frame-check: can this demo be framed at all? Judged from real response headers; Hugging Face Spaces use their app address.
{const probes=[],hfCalls=[];let probeResult={embeddable:true,reason:'no_restrictions',finalUrl:'https://demo.example/app'},hfBody={host:'https://o-s.hf.space/'},hfOk=true;
 const frameProbe=async(url,options)=>{probes.push({url,options});if(probeResult instanceof Error)throw probeResult;return {url,...probeResult}};
 const fetcher=async url=>{hfCalls.push(url);return hfOk?Response.json(hfBody):new Response('',{status:404})};
 const h=createViewerHandler({accounts,key,now:()=>now,frameProbe,fetcher});
 const ask=async(id,url,admin=true)=>{const res={status:0,headers:{},body:'',setHeader(){},writeHead(st){this.status=st},end(b){this.body=b}};try{await h({method:'GET',url:'/api/viewer?action=frame-check&id='+encodeURIComponent(id)+'&url='+encodeURIComponent(url),headers:{origin:'https://www.reposhelf.co.uk'},admin},res)}catch(e){return {status:e.status,code:e.code}}return {status:res.status,data:JSON.parse(res.body)}};
 assert.equal((await ask('team/a','https://demo.example/app',false)).code,'forbidden','administrators only');
 assert.equal((await ask('nope','https://demo.example/app')).code,'invalid_demo');assert.equal((await ask('team/a','ftp://demo.example/app')).code,'invalid_demo','only http and https addresses are looked at');assert.equal((await ask('team/a','not a url')).code,'invalid_demo');
 assert.deepEqual((await ask('team/own','https://www.reposhelf.co.uk/x')).data,{embeddable:false,reason:'own_origin',url:'https://www.reposhelf.co.uk/x'});assert.equal(probes.length,0,'RepoShelf is never even probed');
 probes.length=0;let r=await ask('team/up','http://demo.example/plain');assert.equal(probes.at(-1).url,'https://demo.example/plain','an http address is probed at https');assert.equal(r.data.url,'https://demo.example/plain');assert.equal(r.data.embeddable,true);probes.length=0;
 r=await ask('team/a','https://demo.example/app');assert.deepEqual(r.data,{embeddable:true,reason:'no_restrictions',url:'https://demo.example/app'});assert.equal(probes.length,1);
 await ask('team/a','https://demo.example/app');assert.equal(probes.length,1,'a recent answer is reused');
 probeResult={embeddable:false,reason:'x_frame_options_deny'};r=await ask('team/b','https://deny.example/');assert.deepEqual(r.data,{embeddable:false,reason:'x_frame_options_deny',url:'https://deny.example/'});
 probeResult={embeddable:null,reason:'timeout'};r=await ask('team/c','https://slow.example/');assert.equal(r.data.embeddable,false,'unreachable or unknown never opens a frame');
 probeResult=Error('boom');r=await ask('team/d','https://boom.example/');assert.deepEqual(r.data,{embeddable:false,reason:'check_failed',url:'https://boom.example/'});
 probeResult={embeddable:true,reason:'no_restrictions',finalUrl:'https://www.reposhelf.co.uk/landing'};r=await ask('team/e','https://redirects.example/');assert.equal(r.data.embeddable,false);assert.equal(r.data.reason,'own_origin','a redirect to RepoShelf is refused');
 probeResult={embeddable:true,reason:'no_restrictions'};probes.length=0;
 r=await ask('hf:o/s','https://huggingface.co/spaces/o/s');assert.equal(hfCalls.at(-1),'https://huggingface.co/api/spaces/o/s');assert.equal(probes.at(-1).url,'https://o-s.hf.space/','the Space app address is probed, not the Space page');assert.equal(r.data.url,'https://o-s.hf.space/');assert.equal(r.data.embeddable,true);
 for(const bad of [{host:'https://evil.example/'},{host:'http://o-s.hf.space/'},{host:'https://user:pw@o-s.hf.space/'},{host:'https://o-s.hf.space:8443/'},{}]){hfBody=bad;probes.length=0;r=await ask('hf:o/s'+probes.length+Math.random().toString(36).slice(2,5),'https://huggingface.co/spaces/o/s');assert.equal(r.data.reason,'no_app_address',JSON.stringify(bad));assert.equal(probes.length,0)}
 hfOk=false;r=await ask('hf:o/other','https://huggingface.co/spaces/o/other');assert.deepEqual(r.data,{embeddable:false,reason:'no_app_address',url:'https://huggingface.co/spaces/o/other'},'a lookup failure means a new tab');
}
console.log('PASS: demo viewer eligibility is per browser profile and needs fresh evidence for the saved scenario and address, RepoShelf is never a demo, scenarios must show a result after their last action and keep credentials out, and the endpoint is uncached, admin-only or worker-only with safe failure.');
