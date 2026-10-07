import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {probeMetrics,recordStageMetrics,readStageMetrics} from '../scripts/sync-metrics.mjs';
import {qualityPlan} from '../scripts/catalog-priority.mjs';
import {run} from '../scripts/sync-history.mjs';
import {shouldBuild} from '../scripts/deployment-policy.mjs';
import {diagnoseSync,deploymentStatus,describeRun,runKind,runProgress,friendlyStep} from '../lib/sync-diagnostics.mjs';

assert.equal(shouldBuild('Save catalogue recovery checkpoint',['data/sync-runs/1.json','dist/catalog.json']),false);
assert.equal(shouldBuild('Sync progress [skip ci]',['data/sync-progress.json'],'reposhelf-progress'),false);
assert.equal(shouldBuild('Refresh public demo catalog',['dist/catalog.json']),true);
assert.equal(shouldBuild('Save catalogue recovery checkpoint',['data/browse/index.json','dist/admin.js']),true);
assert.equal(shouldBuild('Save catalogue recovery checkpoint',[]),true);
assert.equal(shouldBuild('Add feature',['dist/app.js'],'claude/some-feature','preview'),false,'preview deployments are skipped');
assert.equal(shouldBuild('Add feature',['dist/app.js'],'claude/some-feature'),false,'non-main branches are skipped even without VERCEL_ENV');
assert.equal(shouldBuild('Add feature',['dist/app.js'],'main','preview'),false,'a preview environment never builds');
assert.equal(shouldBuild('Add feature',['dist/app.js'],'main','production'),true,'production builds from main');
assert.equal(shouldBuild('Add feature',['dist/app.js'],null,null),true,'unknown metadata still builds rather than dropping an update');
const blocked=deploymentStatus({statuses:[{context:'Vercel',state:'failure',description:'Deployment rate limited — retry in 24 hours.',target_url:'https://vercel.com/sparx1981?upgradeToPro=build-rate-limit'}]});
assert.equal(blocked.state,'blocked');assert(blocked.description.includes('rate limited'));
assert.equal(deploymentStatus({statuses:[{context:'Vercel',state:'success',target_url:'javascript:alert(1)'}]}).url,'https://vercel.com/sparx1981/reposhelf');
assert.equal(deploymentStatus({statuses:[]}).state,'unknown');
{const live='a'.repeat(40),newer='b'.repeat(40),now=Date.parse('2026-10-07T12:00:00Z'),at=minutes=>new Date(now-minutes*60000).toISOString();
 assert.equal(deploymentStatus(null,now,{liveSha:live,head:{sha:live,at:at(5)}}).state,'ready','the site is running the newest commit');
 assert.equal(deploymentStatus(null,now,{liveSha:live,head:{sha:newer,at:at(5)}}).state,'pending','a very recent commit is still being published');
 const late=deploymentStatus(null,now,{liveSha:live,head:{sha:newer,at:at(45)}});assert.equal(late.state,'delayed');assert(late.description.includes('45 minutes'));
 assert.equal(deploymentStatus(null,now,{liveSha:live,head:{sha:newer,at:'not a date'}}).state,'delayed','an unreadable time never reads as up to date');
 assert.equal(deploymentStatus(null,now,{liveSha:null,head:{sha:newer,at:at(5)}}).state,'unknown','without the running commit nothing is claimed');
 assert.equal(deploymentStatus(null,now,{liveSha:'main',head:{sha:'zz',at:at(5)}}).state,'unknown','malformed commit ids are ignored');
 assert.equal(deploymentStatus({statuses:[{context:'Vercel',state:'failure',description:'x'}]},now,{liveSha:live,head:{sha:live,at:at(5)}}).state,'blocked','Vercel\'s own failure still wins when it can be read');
}
{// plain-language run labels
 const run=(over={})=>({id:1,name:'Refresh demo catalog',display_title:'Refresh demo catalog',path:'.github/workflows/catalog.yml',event:'schedule',status:'completed',actor:{login:'owner'},triggering_actor:{login:'owner'},...over});
 assert.deepEqual([describeRun(run()).label,describeRun(run()).startedBy,describeRun(run()).hasCounts],['Catalogue sync','on its schedule',true]);
 assert.equal(describeRun(run({event:'workflow_dispatch'})).startedBy,'by an administrator');
 assert.equal(describeRun(run({event:'workflow_dispatch',triggering_actor:{login:'github-actions[bot]'},display_title:'Automatic catch-up sync',name:'Automatic catch-up sync'})).label,'Catch-up sync');
 assert.equal(describeRun(run({event:'workflow_dispatch',triggering_actor:{login:'github-actions[bot]'},display_title:'Automatic catch-up sync'})).startedBy,'automatically');
 assert.equal(describeRun(run({event:'push'})).startedBy,'after a change to the website code');
 for(const [file,kind,label,counts] of [['publication.yml','publish','Website publication',false],['submissions.yml','submissions','Submitted repositories check',false],['launch-acceleration.yml','launch','Launch pacing check',false],['recovery.yml','recovery','Listing repair',true]]){const d=describeRun(run({path:'.github/workflows/'+file}));assert.deepEqual([d.kind,d.label,d.hasCounts],[kind,label,counts],file);assert(d.what.length>20,'every kind explains itself')}
 assert.equal(runKind({name:'Publish saved catalogue'}),'publish','kind falls back to the workflow name');assert.equal(runKind({name:'Scan submitted repositories'}),'submissions');assert.equal(runKind({}),'catalogue');
 assert.equal(friendlyStep('Restore unpublished generated checkpoint data'),'Restoring saved catalogue data (takes about 12 minutes)');assert.equal(friendlyStep('Some new step'),'Some new step');
 const steps=names=>names.map((n,i)=>({name:n,status:i<3?'completed':i===3?'in_progress':'pending'}));
 const prepare={name:'prepare',status:'in_progress',steps:steps(['Set up job','Run actions/checkout@v4','Unpack saved catalogue data','Restore unpublished generated checkpoint data','Validate catalog logic','Post Run actions/checkout@v4','Complete job'])};
 const p=runProgress([prepare]);assert.deepEqual([p.phase,p.phases,p.title],[1,3,'Finding and saving listings']);assert.match(p.detail,/^Step 3 of 4: Restoring saved catalogue data/,'set-up and clean-up steps are not counted');
 const browsers=[0,1,2,3].map(i=>({name:'browser ('+i+')',status:i<2?'completed':'in_progress',steps:[]}));const q=runProgress([{name:'prepare',status:'completed',steps:[]},...browsers]);assert.deepEqual([q.phase,q.detail],[2,'2 of 4 browser runners finished']);
 assert.equal(runProgress([]),null);assert.equal(runProgress([{name:'mystery',status:'in_progress',steps:[]}]),null,'unknown jobs claim no progress');
 assert.equal(describeRun(run({status:'in_progress'}),[prepare]).progress.phase,1);assert.equal(describeRun(run({status:'completed'}),[prepare]).progress,null,'finished runs show no progress');assert.equal(describeRun(run({path:'.github/workflows/publication.yml',status:'in_progress'}),[prepare]).progress,null);
 // a job that reaches its time limit is shown as cancelled by GitHub; say so
 const limited=diagnoseSync({status:'completed',conclusion:'cancelled',name:'Publish saved catalogue'},[{conclusion:'cancelled',started_at:'2026-10-07T10:00:00Z',completed_at:'2026-10-07T10:15:05Z',steps:[]}],null);assert.match(limited.message,/time limit for its job \(about 15 minutes\)/);
 const person=diagnoseSync({status:'completed',conclusion:'cancelled',name:'Refresh demo catalog'},[{conclusion:'cancelled',started_at:'2026-10-07T10:00:00Z',completed_at:'2026-10-07T10:07:00Z',steps:[]}],null);assert.doesNotMatch(person.message,/time limit/);
}
const telemetry=probeMetrics({due:10,selected:4,limit:4});
telemetry.record('team/one',{kind:'working'},true);
telemetry.record('team/two',{kind:'temporary',reason:'probe_timeout'},false);
telemetry.record('team/three',{kind:'unavailable',reason:'http_404'},false);
telemetry.record('team/four',{kind:'working'},false);
const summary=telemetry.summary(1000,13000);
assert.equal(summary.attempted,4);assert.equal(summary.captured,1);
assert.equal(summary.temporaryFailures,1);assert.equal(summary.unavailable,1);
assert.equal(summary.remainingDue,6);assert.equal(summary.durationMs,12000);
assert.deepEqual(summary.reasons,{probe_timeout:1,http_404:1,no_screenshot:1});
const health=probeMetrics();health.record('team/good',{kind:'working'});assert.deepEqual(health.metrics.reasons,{});
for(let i=0;i<20;i++)health.record('team/'+i,{kind:'temporary',reason:'https://unsafe.example/?secret=x'});
assert.equal(health.metrics.examples.length,12);assert(!JSON.stringify(health.metrics).includes('secret'));
const project={full:'team/app',demo:'https://demo.org',availability:'available'};
const plan=qualityPlan([project]);assert.equal(plan.ready,true);assert.equal(plan.pending.screenshots,1);assert.equal(plan.targets.demoChecks,1);assert(plan.reasons.includes('Demo validation is below 95%.'));
const dir=await mkdtemp(tmpdir()+'/reposhelf-debug-'),root=pathToFileURL(dir+'/');
try{
 await mkdir(new URL('dist/',root));await writeFile(new URL('dist/catalog.json',root),JSON.stringify({repositories:[project]}));await writeFile(new URL('dist/spaces.json',root),'{"repositories":[]}');
 await run('start',root);await recordStageMetrics('priority',plan,root);await recordStageMetrics('browser_cycle',{due:false,reason:'Window already completed',nextDueAt:'2026-10-05T00:00:00Z'},root);
 await recordStageMetrics('previews',{...summary,complete:false},root);
 assert.equal((await readStageMetrics('previews',root)).captured,1);
 await run('finish',root,{GITHUB_RUN_ID:'456',SYNC_STEP_RESULTS:JSON.stringify({priority:{outcome:'success'},previews:{outcome:'failure'}})});
 const report=JSON.parse(await readFile(new URL('data/sync-runs/456.json',root),'utf8'));
 assert.equal(report.schema,4);assert.equal(report.work.discovery.ready,true);assert.equal(report.work.coverageAfter.pending.screenshots,1);
 const preview=report.stages.find(s=>s.id==='previews');assert.equal(preview.checked,4);assert.equal(preview.details.captured,1);assert.equal(preview.temporaryFailures,1);assert.equal(preview.details.complete,false);
 const success={status:'completed',conclusion:'success'};
 let diagnosis=diagnoseSync(success,undefined,{...report,stages:[]});
 assert.equal(diagnosis.kind,'no_changes');assert(!diagnosis.message.includes('New discovery was paused'));assert(diagnosis.message.includes('browser window already completed'));
 diagnosis=diagnoseSync(success,undefined,{...report,phase:'cleanup',stages:[]});assert.equal(diagnosis.kind,'checkpoint');
 diagnosis=diagnoseSync({status:'in_progress'},undefined,{...report,phase:'cleanup'});assert(diagnosis.message.includes('not the finished run'));
 assert.equal(await readStageMetrics('health',root),null);
}finally{await rm(dir,{recursive:true,force:true})}
console.log('PASS: durable sync work metrics, coverage gates, partial screenshot outcomes, bounded failure samples and honest zero-change/checkpoint explanations.');
