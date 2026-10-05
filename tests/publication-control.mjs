import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scheduledPublicationDue,publicationSummary} from '../lib/publication-policy.mjs';
import {createWorkflowControl} from '../lib/workflow-control.mjs';
import {createPublicationHandler} from '../lib/publication-handler.mjs';
import {createMaintenanceHandler} from '../lib/maintenance-handler.mjs';
import {storefrontAlerts,publicationAlerts} from '../scripts/monitor-health.mjs';
import {diagnoseSync} from '../lib/sync-diagnostics.mjs';
const now=Date.parse('2026-10-06T08:00:00Z');
assert(!scheduledPublicationDue({lastScheduledDay:'2026-10-06'},now));assert(scheduledPublicationDue({lastScheduledDay:'2026-10-05'},now));
assert.equal(publicationSummary(null).lastPublishedAt,null);
assert.equal(diagnoseSync({status:'completed',conclusion:'success'},null,{phase:'complete',publication:'awaiting_publication',counts:{added:3,updated:5}}).publication,'awaiting_publication');
let busy=false,dispatches=0,reads=0;
const control=createWorkflowControl({token:'fixture',fetcher:async(url,options)=>{
 assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer fixture');
 if(options.method==='POST'){dispatches++;assert(url.endsWith('publication.yml/dispatches'));assert.deepEqual(JSON.parse(options.body),{ref:'main',inputs:{scheduled:false}});return new Response(null,{status:204})}
 reads++;return Response.json({workflow_runs:busy?[{id:1,status:'in_progress'}]:[]});
}});
assert((await control.publish()).requested);assert.equal(dispatches,1);busy=true;assert(!(await control.publish()).requested);assert.equal(dispatches,1);
await assert.rejects(createWorkflowControl({token:'',fetcher:async()=>{throw Error('must not fetch')}}).publish(),e=>e.code==='actions_token_required');
await assert.rejects(createWorkflowControl({token:'fixture',fetcher:async()=>new Response(null,{status:403})}).publish(),e=>e.code==='workflow_unavailable');
let admin=true,published=0;
const accounts={config:{origin:'https://reposhelf.test'},origin(req){if(req.headers.origin!==this.config.origin)throw Object.assign(Error('Forbidden'),{status:403})},async admin(){if(!admin)throw Object.assign(Error('Forbidden'),{status:403})}};
async function call(handler,{method='POST',authorization,origin='https://reposhelf.test',body={action:'publish'}}={}){const req={method,headers:{origin,...authorization?{authorization}:{}},url:'/api/publication',body};const res={writeHead(status){this.status=status},end(value){this.data=JSON.parse(value)}};await handler(req,res);return res}
const handler=createPublicationHandler({accounts,checkpoint:{json:async()=>({lastPublishedAt:'2026-10-05T06:35:00Z'})},control:{configured:true,history:async()=>[],publish:async()=>{published++;return {requested:true}}}});
admin=false;assert.equal((await call(handler)).status,403);assert.equal(published,0);admin=true;assert.equal((await call(handler,{origin:'https://evil.test'})).status,403);assert.equal(published,0);
assert.equal((await call(handler,{body:{action:'arbitrary_workflow'}})).status,400);assert.equal((await call(handler)).status,202);assert.equal(published,1);
assert.equal((await call(handler,{method:'GET'})).data.lastPublishedAt,'2026-10-05T06:35:00Z');
const key='s'.repeat(48);let schedulerPosts=0;
const maintenance=createMaintenanceHandler({key,token:'fixture',now:()=>now,checkpoint:{json:async()=>({lastScheduledDay:'2026-10-05'})},control:{publish:async({scheduled})=>{assert(scheduled);schedulerPosts++;return {requested:true}},active:async()=>[]}});
assert.equal((await call(maintenance)).status,401);assert.equal(schedulerPosts,0);assert.equal((await call(maintenance,{authorization:'Bearer '+key})).status,202);assert.equal(schedulerPosts,1);
assert.equal((await call(maintenance,{method:'GET',authorization:'Bearer '+key})).status,405);
const missing=createMaintenanceHandler({key:'',token:'fixture'});assert.equal((await call(missing)).status,503);
const unknown=createMaintenanceHandler({key,token:'fixture',now:()=>now,checkpoint:{json:async()=>null},control:{active:async()=>[{id:1}],publish:async()=>{throw Error('Do not publish unknown state')}}});assert.equal((await call(unknown,{authorization:'Bearer '+key})).data.action,'wait');
let recoveryPosts=0;
const recovery=createMaintenanceHandler({key,token:'fixture',now:()=>now,checkpoint:{json:async()=>({lastScheduledDay:'2026-10-06'})},control:{active:async()=>[]},fetcher:async(url,options)=>{if(options.method==='POST'){recoveryPosts++;return new Response(null,{status:204})}return Response.json({workflow_runs:[{status:'completed',conclusion:'success',updated_at:'2026-10-06T02:00:00Z'}]})}});
assert.equal((await call(recovery,{authorization:'Bearer '+key})).status,202);assert.equal(recoveryPosts,1);
const catalog=await readFile(new URL('../.github/workflows/catalog.yml',import.meta.url),'utf8'),submission=await readFile(new URL('../.github/workflows/submissions.yml',import.meta.url),'utf8'),daily=await readFile(new URL('../.github/workflows/publication.yml',import.meta.url),'utf8');
assert(catalog.includes('SYNC_PUBLICATION_PHASE: deferred'));assert(catalog.includes("DEMO_CHECK_BATCH: 'auto'"));assert(catalog.includes("CATALOG_PREVIEW_BATCH: 'auto'"));assert(catalog.includes("PREVIEW_BUDGET_MS: '900000'"));assert(catalog.includes("DEMO_CHECK_BUDGET_MS: '600000'"));
assert(submission.includes('SYNC_PUBLICATION_PHASE: deferred'));assert(!submission.includes('git push origin HEAD:main'));assert(daily.includes("cron: '35 6 * * *'"));assert(daily.includes('group: reposhelf-catalog'));
console.log('PASS: daily idempotence, deferred diagnostics, admin/origin authorization, guarded dispatch, scheduler authentication, independent catch-up and deployment-free maintenance configuration.');

const session={enabled:true,launchAnalyticsEnabled:true,user:null},browse={catalogVersion:'v',indexed:1,items:[],snapshots:{catalog:new Date(now-24*3600000).toISOString()}};
assert(!storefrontAlerts(session,browse,now).some(a=>a.id==='catalogue-stale'));
assert(storefrontAlerts(session,{...browse,snapshots:{catalog:new Date(now-31*3600000).toISOString()}},now).some(a=>a.id==='catalogue-stale'));
assert.equal(publicationAlerts([{status:'completed',conclusion:'failure',updated_at:new Date(now).toISOString()}],now)[0].id,'publication-failed');
assert.equal(publicationAlerts([{status:'completed',conclusion:'success',updated_at:new Date(now-31*3600000).toISOString()}],now)[0].id,'publication-overdue');
