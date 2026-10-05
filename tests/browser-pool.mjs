import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createDemoSession} from '../scripts/demo-session.mjs';
import {createDemoPool} from '../scripts/demo-pool.mjs';
import {publicUrlGuard} from '../scripts/demo-health.mjs';
import {adaptiveBrowsers} from '../scripts/adaptive-browser.mjs';
import {runBrowserQueues} from '../scripts/browser-queues.mjs';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
import {runQueues} from '../scripts/run-browser-queues.mjs';

let launches=0,closed=0,contextCloses=0,aborted=0,screenshotFails=false,publicSockets=0,privateSockets=0;const contexts=[];
const session=createDemoSession({recycleAfter:2,guardFactory:()=>publicUrlGuard({resolver:async()=>[{address:'8.8.8.8'}]}),launch:async()=>{launches++;return {
 async close(){closed++},async newContext(options){const context={storage:{},options,async route(pattern,handler){await handler({request:()=>({url:()=> 'http://127.0.0.1/private'}),abort:async()=>{aborted++},continue:async()=>{throw Error('Private request escaped')}})},async routeWebSocket(pattern,handler){await handler({url:()=> 'wss://demo.example/socket',connectToServer(){publicSockets++},async close(){throw Error('Public socket should connect')}});await handler({url:()=> 'ws://127.0.0.1/socket',connectToServer(){throw Error('Private socket escaped')},async close(){privateSockets++}})},async newPage(){return {context,screenshot:async()=>{if(screenshotFails)throw Error('Disk error')}}},async close(){contextCloses++;this.storage={}}};contexts.push(context);return context}
}},inspect:async page=>{assert.equal(page.context.storage.secret,undefined);page.context.storage.secret='private cookie';return {kind:'working'}}});
assert.equal((await session.probe({target:'https://example.com'})).kind,'working');
assert.equal((await session.probe({target:'https://other.example'})).kind,'working');assert.equal(launches,1,'Browser process is reused');assert.equal(contexts.length,2,'Context is fresh per listing');assert.equal(contextCloses,2);assert.equal(publicSockets,2);assert.equal(privateSockets,2);
screenshotFails=true;const image=await session.probe({target:'https://third.example',screenshot:'/unused'});assert.equal(image.kind,'working');assert.equal(image.reason,'screenshot_error');assert.equal(launches,2,'Browser recycles after a bounded number of visits');assert.equal(aborted,3);assert(contexts.every(c=>c.options.serviceWorkers==='block'&&c.options.acceptDownloads===false));
assert.equal((await session.probe({target:'http://127.0.0.1'})).reason,'unsafe_target');assert.equal(contexts.length,3,'Unsafe targets never launch a context');await session.close();assert.equal(closed,2);

let starts=0,kills=0;
const pool=createDemoPool({spawnWorker:(command,args,options)=>{assert.equal(options.env.GITHUB_TOKEN,undefined);assert.equal(options.env.SUPABASE_SERVICE_ROLE_KEY,undefined);starts++;const child=new EventEmitter();child.stdout=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=line=>{const request=JSON.parse(line);if(request.input.hang)return;queueMicrotask(()=>child.stdout.emit('data',JSON.stringify({id:request.id,result:{kind:'working'},stats:{browserLaunches:1,contexts:request.id}})+'\n'))};return child},killWorker:()=>{kills++}});
await pool.probe({});await pool.probe({});assert.equal(starts,1);
assert.equal((await pool.probe({hang:true},{timeout:10})).reason,'probe_timeout');assert.equal(kills,1);
assert.equal((await pool.probe({})).kind,'working');assert.equal(starts,2);assert.equal(pool.stats().workerRestarts,1);pool.close();assert.equal(pool.stats().workers,0);

const adaptive=adaptiveBrowsers(),healthy={availableMB:4096,memoryRatio:.4,cpuRatio:.4};
for(let i=0;i<20;i++)adaptive.observe({kind:'working'},healthy);assert.equal(adaptive.limit,4);
adaptive.observe({kind:'working'},{...healthy,memoryRatio:.95});assert.equal(adaptive.limit,1,'Memory pressure reduces active browsers');
const timeoutAdaptive=adaptiveBrowsers({initial:4});for(let i=0;i<10;i++)timeoutAdaptive.observe({reason:'probe_timeout'},healthy);assert(timeoutAdaptive.limit<4);
const accessAdaptive=adaptiveBrowsers();for(let i=0;i<20;i++)accessAdaptive.observe({kind:'temporary',reason:'access_restricted'},healthy);assert.equal(accessAdaptive.limit,4,'Remote access restrictions are not memory pressure');

let clock=0;const visited=[];
const result=await runBrowserQueues({previews:Array.from({length:30},(_,i)=>({full:'p/'+i})),health:[]},async r=>{clock++;visited.push(r.full)},{deadline:25,now:()=>clock,concurrency:()=>1});
assert.equal(result.attempted,25,'Screenshot queue borrows the empty health queue budget');assert.equal(new Set(visited).size,25);
const all=[];await runBrowserQueues({previews:[{full:'p/one'},{full:'p/two'}],health:[{full:'p/one'},{full:'p/three'}]},async r=>all.push(r.full),{deadline:Date.now()+1000,concurrency:()=>4});assert.equal(new Set(all).size,3);assert.equal(all.length,3);
let settled=false;await assert.rejects(runBrowserQueues({previews:[{full:'p/fail'},{full:'p/finish'}],health:[]},async r=>{if(r.full==='p/fail')throw Error('disk failure');await new Promise(r=>setTimeout(r,5));settled=true},{deadline:Date.now()+1000,concurrency:()=>2}),/disk failure/);assert(settled,'Workers settle before catalogue cleanup');
let tickSettled=false;await assert.rejects(runBrowserQueues({previews:[{full:'p/fast'},{full:'p/slow'}],health:[]},async r=>{if(r.full==='p/slow'){await new Promise(r=>setTimeout(r,20));tickSettled=true}},{deadline:Date.now()+1000,concurrency:()=>2,onTick:()=>{throw Error('metrics failure')}}),/metrics failure/);assert(tickSettled,'Reporting failures must also settle active workers before cleanup');
const folder=await mkdtemp(tmpdir()+'/reposhelf-shared-'),root=pathToFileURL(folder+'/'),today=Date.now(),yesterday=new Date(today-86400000).toISOString();
try{await mkdir(new URL('dist/',root));const entries=[{full:'test/missing',demo:'https://missing.example'},{full:'test/checked',demo:'https://checked.example',demoHealth:{url:'https://checked.example',status:'working',attemptedAt:new Date(today-8*86400000).toISOString(),checkedAt:new Date(today-8*86400000).toISOString(),nextCheckAt:yesterday},previewAttemptAt:yesterday,screenshots:[{kind:'demo',src:'previews/old.jpg',capturedAt:yesterday,url:'https://checked.example'}]}];await writeFile(new URL('dist/catalog.json',root),JSON.stringify({repositories:entries}));await writeFile(new URL('dist/spaces.json',root),'{"repositories":[]}');const calls=[],progress=[];let poolClosed=false;
const result=await runQueues(root,{GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',PREVIEW_BUDGET_MS:'1000',DEMO_CHECK_BUDGET_MS:'1000'},{resourceSampler:async()=>healthy,publisherFactory:()=>({publish:async value=>progress.push(value),warnings:0}),poolFactory:()=>({probe:async input=>{calls.push(input);if(input.screenshot)await writeFile(input.screenshot,Buffer.from([255,216,255]));return {kind:'working',screenshot:Boolean(input.screenshot)}},trim(){},close(){poolClosed=true},stats:()=>({workerStarts:1,workerRestarts:0})})});
assert(poolClosed);assert.equal(calls.length,2);assert.equal(calls.filter(c=>c.screenshot).length,1,'Missing preview is validated and captured together');assert.equal(result.previews.captured,1);assert.equal(result.health.attempted,1);assert.equal(progress.at(-1).status,'complete');const saved=JSON.parse(await readFile(new URL('dist/catalog.json',root),'utf8')).repositories;assert.equal(saved[0].demoHealth.status,'working');assert.equal(saved[0].screenshots[0].kind,'demo');assert.equal(saved[1].screenshots[0].src,'previews/old.jpg','Demo-only checks retain old screenshots');
}finally{await rm(folder,{recursive:true,force:true})}
console.log('PASS: reusable browsers, fresh contexts, intercepted private requests, worker recycling/deadlines, credential isolation, adaptive pressure control, shared budgets and queue deduplication.');

// A replacement URL is committed only after the browser captures that demo.
const repairDir=await mkdtemp(tmpdir()+'/reposhelf-repair-'),repairRoot=pathToFileURL(repairDir+'/');
try{
 await mkdir(new URL('dist/',repairRoot));const originals=[{full:'test/repair',demo:'https://old.demo.org/'},{full:'test/retain',demo:'https://retained.demo.org/'}];await writeFile(new URL('dist/catalog.json',repairRoot),JSON.stringify({repositories:originals}));await writeFile(new URL('dist/spaces.json',repairRoot),'{"repositories":[]}');
 await runQueues(repairRoot,{GITHUB_RUN_ID:'123',PREVIEW_BUDGET_MS:'30000',DEMO_CHECK_BUDGET_MS:'30000'},{resourceSampler:async()=>healthy,publisherFactory:()=>({publish:async()=>{},warnings:0}),repairFactory:()=>async r=>[r.full==='test/repair'?'https://replacement.demo.org/':'https://failed.demo.org/'],poolFactory:()=>({probe:async input=>{if(input.target==='https://replacement.demo.org/'){await writeFile(input.screenshot,Buffer.from([255,216,255]));return {kind:'working',screenshot:true}}return {kind:'temporary',reason:'dns_unresolved'}},trim(){},close(){},stats:()=>({})})});
 const saved=JSON.parse(await readFile(new URL('dist/catalog.json',repairRoot),'utf8')).repositories;
 assert.equal(saved[0].demo,'https://replacement.demo.org/');assert.equal(saved[0].screenshots[0].url,saved[0].demo);assert.equal(saved[0].demoLinkRepair.previous,originals[0].demo);assert.equal(saved[1].demo,originals[1].demo,'An unverified replacement must not overwrite the saved URL');
}finally{await rm(repairDir,{recursive:true,force:true})}
console.log('PASS: repaired demo URLs need successful capture; failed alternatives preserve the saved listing.');

// Retry a failed render capture without replacing its healthy navigation result.
let captureCalls=0,patient=false;
const captureSession=createDemoSession({guardFactory:()=>({assess:async()=>({allowed:true})}),launch:async()=>({close:async()=>{},newContext:async()=>({route:async()=>{},close:async()=>{},newPage:async()=>({screenshot:async opts=>{captureCalls++;assert.equal(opts.animations,'disabled');if(captureCalls===1)throw Error('Transient render race');assert.equal(opts.scale,'css')}})})}),inspect:async(page,target,opts)=>{patient=opts.patient;return {kind:'working',target}}});
const retried=await captureSession.probe({target:'https://demo.org',screenshot:'/unused',patient:true});assert.equal(retried.screenshot,true);assert.equal(retried.captureRetry,true);assert.equal(captureCalls,2);assert.equal(patient,true);await captureSession.close();
console.log('PASS: patient rendering flag and one bounded capture retry preserve working demo evidence.');
