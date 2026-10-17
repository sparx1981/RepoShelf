import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {xImportDue,collectorWindowStart,CATCH_UP_AFTER_MINUTES} from '../lib/x-import-policy.mjs';
import {GROUP_WORKFLOWS,createWorkflowControl} from '../lib/workflow-control.mjs';
import {createMaintenanceHandler} from '../lib/maintenance-handler.mjs';
// The daily X import shares a concurrency group in which GitHub keeps one waiting run. When another workflow takes that slot the
// import is cancelled and nothing starts it again, so the maintenance timer starts it once, later in the day.
const at=(h,m=0,day=17)=>Date.UTC(2026,9,day,h,m);
const run=(h,m,over={})=>({id:h*100+m,created_at:new Date(at(h,m)).toISOString(),status:'completed',conclusion:'success',event:'schedule',...over});
assert.equal(collectorWindowStart(at(9)),at(6),'after 06:00 the window started today');assert.equal(collectorWindowStart(at(5,30)),at(6,0,16),'before 06:00 it started yesterday');
assert.equal(CATCH_UP_AFTER_MINUTES,510);
assert.deepEqual(xImportDue([],at(7)),{due:false,reason:'too_early'},'the scheduled run gets two hours to take its turn');
assert.equal(xImportDue([],at(8,29)).due,false);
const missing=xImportDue([],at(8,30));assert.equal(missing.due,true);assert.equal(missing.reason,'scheduled_run_missing');assert.equal(missing.notBefore,new Date(at(6)).toISOString());
assert.equal(xImportDue([run(6,20,{conclusion:'cancelled'})],at(9)).reason,'scheduled_run_was_replaced','a cancelled scheduled run is the case to fix');
assert.equal(xImportDue([run(6,20,{conclusion:'skipped'})],at(9)).due,true);
assert.equal(xImportDue([run(6,20)],at(9)).reason,'already_ran','a successful import is not repeated');
assert.equal(xImportDue([run(6,20,{conclusion:'failure'})],at(9)).reason,'already_ran','a real failure (for example the collector failed) is not retried all day');
assert.equal(xImportDue([run(6,20,{status:'in_progress',conclusion:null})],at(9)).reason,'running_or_queued');
assert.equal(xImportDue([run(8,35,{conclusion:'cancelled',event:'workflow_dispatch'}),run(6,20,{conclusion:'cancelled'})],at(10)).reason,'catch_up_already_requested','one catch-up a day');
assert.equal(xImportDue([run(6,20,{conclusion:'success',created_at:new Date(at(6,20,16)).toISOString()})],at(9)).due,true,'yesterday\'s success does not count');
assert.equal(xImportDue(null,at(9)).reason,'history_unavailable');
// every workflow in the shared group is something dispatchers must treat as busy
const dir=new URL('../.github/workflows/',import.meta.url),inGroup=[];
for(const name of (await readdir(dir)).filter(n=>n.endsWith('.yml')))if((await readFile(new URL(name,dir),'utf8')).includes('group: reposhelf-catalog'))inGroup.push(name);
assert.deepEqual([...GROUP_WORKFLOWS].sort(),inGroup.sort(),'GROUP_WORKFLOWS lists exactly the workflows that share the concurrency group');
assert.match(await readFile(new URL('../scripts/launch-cadence.mjs',import.meta.url),'utf8'),/\['catalog\.yml','publication\.yml','submissions\.yml','recovery\.yml','x-intake\.yml'\]/,'the launch dispatcher also waits for the X import');
// the maintenance endpoint
const KEY='k'.repeat(40),calls=[];let historyFor={};
const fetcher=async(url,options={})=>{const u=new URL(url),name=u.pathname.split('/actions/workflows/')[1]?.split('/')[0];calls.push((options.method||'GET')+' '+u.pathname.split('/actions/workflows/')[1]);
 if(u.pathname.endsWith('/dispatches'))return new Response(null,{status:204});
 return Response.json({workflow_runs:historyFor[name]||[]})};
const checkpoint={json:async()=>({lastPublishedAt:new Date(at(6,50)).toISOString(),lastScheduledDay:'2026-10-17'})};
async function maintain(time){const control=createWorkflowControl({fetcher,token:'t'});const handler=createMaintenanceHandler({fetcher,key:KEY,token:'t',checkpoint,control,now:()=>time});const res={headers:{},setHeader(k,v){this.headers[k]=v},writeHead(s,h){this.status=s},end(b){this.body=b?JSON.parse(b):null}};await handler({method:'POST',headers:{authorization:'Bearer '+KEY},socket:{}},res);return res}
historyFor={'x-intake.yml':[run(6,20,{conclusion:'cancelled'})]};calls.length=0;
let r=await maintain(at(9));assert.equal(r.status,202);assert.equal(r.body.xImport.requested,true);assert.equal(r.body.xImport.why,'scheduled_run_was_replaced');
const dispatch=calls.find(c=>c.startsWith('POST x-intake.yml/dispatches'));assert(dispatch,'x-intake.yml was dispatched');
// with the import already done, the timer does not dispatch it
historyFor={'x-intake.yml':[run(6,20)]};calls.length=0;await maintain(at(9));assert(!calls.some(c=>c.includes('x-intake.yml/dispatches')));
// while a workflow in the group is running, nothing is dispatched
historyFor={'x-intake.yml':[run(6,20,{conclusion:'cancelled'})],'catalog.yml':[run(8,17,{status:'in_progress',conclusion:null})]};calls.length=0;r=await maintain(at(9));assert.equal(r.body.action,'wait');assert(!calls.some(c=>c.includes('/dispatches')));
// the X import itself counts as busy for the other dispatchers
historyFor={'x-intake.yml':[run(8,40,{status:'in_progress',conclusion:null})]};const control=createWorkflowControl({fetcher,token:'t'});assert.equal((await control.active()).length,1);assert.equal((await control.sync()).requested,false);
console.log('PASS: a dropped daily X import is requested once after 08:30 UTC, never repeated after a real outcome, and the X import counts as busy for every other dispatcher.');
