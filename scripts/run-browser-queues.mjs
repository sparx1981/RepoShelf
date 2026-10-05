import {balancedBrowserWork,retryDelay} from './browser-work-policy.mjs';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
import {checkpointWriter} from './browser-checkpoint.mjs';
import {recordStageMetrics,readStageMetrics,probeMetrics} from './sync-metrics.mjs';
import {demoCandidates,recordDemoResult} from './demo-health.mjs';
import {previewCandidates} from './preview-schedule.mjs';
import {createDemoPool} from './demo-pool.mjs';
import {runBrowserQueues} from './browser-queues.mjs';
import {adaptiveBrowsers,browserResources} from './adaptive-browser.mjs';
import {createDemoLinkRepair} from './repair-demo-links.mjs';
import {liveSyncPublisher} from './live-sync-progress.mjs';

export async function runQueues(root=new URL('../',import.meta.url),env=process.env,{poolFactory=createDemoPool,publisherFactory=liveSyncPublisher,resourceSampler=browserResources,candidateSelector,repairFactory=createDemoLinkRepair}={}){
 const files=['catalog','spaces'].map(name=>new URL('dist/'+name+'.json',root)),snapshots=await Promise.all(files.map(async file=>JSON.parse(await readFile(file,'utf8')))),entries=snapshots.flatMap(s=>s.repositories),started=Date.now();
 const previewBudget=Number(env.PREVIEW_BUDGET_MS||900000),healthBudget=Number(env.DEMO_CHECK_BUDGET_MS||600000),budget=previewBudget+healthBudget;
 if(!Number.isFinite(budget)||previewBudget<=0||healthBudget<=0)throw Error('Invalid browser time budget');
 const recovery=candidateSelector?.(entries,started),previewQueue=recovery?.previews||previewCandidates(entries,started,entries.length),previewIds=new Set(previewQueue.map(r=>r.full.toLowerCase())),healthQueue=(recovery?.health||demoCandidates(entries,started,entries.length)).filter(r=>!previewIds.has(r.full.toLowerCase()));
 const queues={previews:previewQueue,health:healthQueue},telemetry=Object.fromEntries(Object.entries(queues).map(([name,items])=>[name,probeMetrics({selected:items.length,due:items.length,limit:entries.length})]));
 const requested=Number(env.CATALOG_PREVIEW_CONCURRENCY||4);if(!Number.isInteger(requested)||requested<1)throw Error('Invalid browser concurrency');const max=Math.min(4,requested),adaptive=adaptiveBrowsers({max}),pool=poolFactory({max}),publisher=publisherFactory({token:env.GITHUB_TOKEN}),persist=checkpointWriter(files,snapshots);
 const repair=repairFactory({token:env.GITHUB_TOKEN});let repaired=0;const balanced=balancedBrowserWork(previewQueue,healthQueue),laneSpent={admission:0,maintenance:0,repair:0};
 const scratch=await mkdtemp(join(tmpdir(),'reposhelf-browser-'));await mkdir(new URL('dist/previews/',root),{recursive:true});let complete=false,active=0,lastSave=0,resources={},lastResource=0,spent={previews:0,health:0};
 function progress(){return {schema:1,runId:env.GITHUB_RUN_ID,attempt:Number(env.GITHUB_RUN_ATTEMPT||1),startedAt:new Date(started).toISOString(),updatedAt:new Date().toISOString(),status:complete?'complete':'running',previews:telemetry.previews.summary(started),health:telemetry.health.summary(started),activeWorkers:active,concurrency:adaptive.limit,budgetMs:budget,elapsedMs:Date.now()-started,workerRestarts:pool.stats().workerRestarts}}
 async function save(force=false){if(!force&&Date.now()-lastSave<5000)return;lastSave=Date.now();for(const name of ['previews','health'])await recordStageMetrics(name,{...telemetry[name].summary(started),complete,mode:'shared_time_budget',budgetMs:budget,allocatedWeight:name==='previews'?previewBudget:healthBudget,workerTimeMs:spent[name],adaptive:adaptive.summary(),resources,pool:pool.stats(),progressWarnings:publisher.warnings,linksRepaired:repaired,workLanes:{selected:Object.fromEntries(Object.entries(balanced.queues).map(([k,v])=>[k,v.length])),workerTimeMs:laneSpent}},root)}
 async function sample(){if(Date.now()-lastResource>=5000){resources=await resourceSampler();lastResource=Date.now()}}
 try{
  await sample();await save(true);await publisher.publish(progress());
  await runBrowserQueues(candidateSelector?queues:balanced.queues,async(r,lane,deadline)=>{
   const name=candidateSelector?lane:balanced.original.get(r.full.toLowerCase()),workStarted=Date.now();
   active++;const filename=createHash('sha256').update(r.full).digest('hex').slice(0,24)+'.jpg',capture=name==='previews',patient=r.source==='huggingface'||r.previewCheck?.reason==='empty_page'||r.demoHealth?.error?.reason==='empty_page';
   try{
    let result=await pool.probe({target:r.source==='huggingface'?(r.appUrl||r.demo):r.demo,space:r.source==='huggingface',patient,...capture?{screenshot:join(scratch,filename)}:{}},{timeout:Math.min(capture?(patient?60000:45000):(patient?45000:35000),Math.max(1,deadline-Date.now()))});
    if(!candidateSelector&&result.kind!=='working'&&Date.now()+30000<deadline){
     for(const target of await repair(r,result)){
      if(Date.now()+15000>=deadline)break;
      const alternative=await pool.probe({target,screenshot:join(scratch,filename)},{timeout:Math.min(45000,deadline-Date.now())});
      if(alternative.kind==='working'&&alternative.screenshot){const previous=r.demo;r.demo=target;r.demoLinkRepair={previous,url:target,checkedAt:new Date().toISOString(),source:'Repository README'};result=alternative;repaired++;break;}
     }
    }
    Object.assign(r,recordDemoResult(r,result));const success=result.kind==='working'&&Boolean(result.screenshot);
    if(capture||result.screenshot){const prior=r.previewCheck?.url===r.demo?r.previewCheck:null,failures=success?0:(prior?.consecutiveFailures||0)+1;r.previewAttemptAt=new Date().toISOString();r.previewCheck={url:r.demo,attemptedAt:r.previewAttemptAt,consecutiveFailures:failures,status:success?'captured':'retry',reason:success?null:result.reason||'no_screenshot',nextCheckAt:new Date(Date.now()+(success?7*86400000:retryDelay(result.reason,failures))).toISOString()};
     if(success){await writeFile(new URL('dist/previews/'+filename,root),await readFile(join(scratch,filename)));r.screenshots=[{src:'previews/'+filename,kind:'demo',capturedAt:r.previewAttemptAt,url:r.demo},...(r.screenshots||[]).filter(i=>i.kind!=='demo')].slice(0,6)}
    }
    telemetry[name].record(r.full,result,capture?success:null);await sample();adaptive.observe(result,resources);pool.trim(adaptive.limit);await persist();await save();
    console.log(`${name}: ${telemetry[name].metrics.attempted} attempted, ${telemetry[name].metrics.captured} captured, ${telemetry[name].metrics.working} loaded; concurrency ${adaptive.limit}.`);
   }finally{spent[name]+=Date.now()-workStarted;active--}
  },{deadline:started+budget,concurrency:()=>adaptive.limit,weights:candidateSelector?{previews:previewBudget,health:healthBudget}:balanced.weights,onTick:async state=>{Object.assign(laneSpent,state.spent);await save();void publisher.publish(progress())}});
  complete=true;
 }finally{
  pool.close();await persist(true);await save(true);const final=progress();if(!complete)final.status='interrupted';await publisher.publish(final,{force:true});await rm(scratch,{recursive:true,force:true});
 }
 for(const name of ['previews','health']){const m=telemetry[name].metrics;console.log(`${name} finished: ${m.attempted} attempted; ${m.captured} screenshots; ${m.temporaryFailures} awaiting retry.`)}
 return progress();
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 if(process.argv[2]==='summary'){const m=await readStageMetrics('health',new URL('../',import.meta.url));if(!m)throw Error('Browser metrics missing');console.log(`Demo checks: ${m.attempted} checked, ${m.working} pages loaded, ${m.unavailable} unavailable responses, ${m.temporaryFailures} inconclusive. ${m.deferred} deferred.`);if(!m.complete)process.exitCode=1}
 else await runQueues();
}
