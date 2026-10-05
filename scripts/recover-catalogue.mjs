import {runQueues} from './run-browser-queues.mjs';
import {recoveryQueues} from './recovery-queues.mjs';
import {readStageMetrics,recordStageMetrics} from './sync-metrics.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {qualityPlan} from './catalog-priority.mjs';
const root=new URL('../',import.meta.url),passes=[];
for(let pass=1;pass<=2;pass++){
 const readEntries=async()=> (await Promise.all(['catalog','spaces'].map(async name=>JSON.parse(await readFile(new URL('dist/'+name+'.json',root),'utf8'))))).flatMap(s=>s.repositories);
 const before=qualityPlan(await readEntries());
 console.log(`Recovery pass ${pass}: retry incomplete listings; complete listings stay untouched.`);
 await runQueues(root,process.env,{candidateSelector:recoveryQueues});
 const after=qualityPlan(await readEntries()),metrics={};
 for(const name of ['previews','health'])metrics[name]=await readStageMetrics(name,root);
 passes.push({pass,before,after,metrics});
 await mkdir(new URL('data/',root),{recursive:true});
 await writeFile(new URL('data/recovery-results.json',root),JSON.stringify({runId:process.env.GITHUB_RUN_ID,passes},null,2));
 console.log(`Recovery pass ${pass}: net screenshots ${after.screenshots-before.screenshots}; net validation ${after.demoChecks-before.demoChecks}.`);
}
for(const name of ['previews','health']){
 const sums={attempted:0,captured:0,working:0,unavailable:0,temporaryFailures:0,selected:0,due:0,remainingDue:0,durationMs:0,reasons:{}};
 for(const pass of passes){const m=pass.metrics[name];for(const key of Object.keys(sums))if(key!=='reasons')sums[key]+=m[key]||0;for(const [reason,n] of Object.entries(m.reasons||{}))sums.reasons[reason]=(sums.reasons[reason]||0)+n;}
 await recordStageMetrics(name,{...sums,complete:true,mode:'targeted_recovery',recoveryPasses:passes.map(p=>({pass:p.pass,netScreenshots:p.after.screenshots-p.before.screenshots,netDemoChecks:p.after.demoChecks-p.before.demoChecks,...p.metrics[name]}))},root);
}
