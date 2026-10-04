import {readFile,appendFile} from 'node:fs/promises';
import {recordStageMetrics} from './sync-metrics.mjs';
import {pathToFileURL} from 'node:url';
export function qualityPlan(entries){
 const available=entries.filter(r=>r.demo&&r.availability!=='unavailable');
 const visible=available.filter(r=>!(r.demoHealth?.url===r.demo&&r.demoHealth.status==='unavailable'));
 const checked=available.filter(r=>r.lastCheckedAt&&!r.checkError).length;
 const validated=available.filter(r=>r.demoHealth?.url===r.demo&&r.demoHealth.checkedAt&&['working','review','unavailable'].includes(r.demoHealth.status)).length;
 const screenshots=visible.filter(r=>(r.screenshots||[]).some(i=>i.kind==='demo'&&(!i.url||i.url===r.demo))).length;
 const ready=available.length===0||(checked/available.length>=.95&&validated/available.length>=.95&&(visible.length===0||screenshots/visible.length>=.9));
 const targets={repositoryChecks:Math.ceil(available.length*.95),demoChecks:Math.ceil(available.length*.95),screenshots:Math.ceil(visible.length*.9)};
 const reasons=[];if(checked<targets.repositoryChecks)reasons.push('Repository validation is below 95%.');if(validated<targets.demoChecks)reasons.push('Demo validation is below 95%.');if(screenshots<targets.screenshots)reasons.push('Screenshot coverage is below 90%.');
 return {targets,reasons,pending:{repositoryChecks:available.length-checked,demoChecks:available.length-validated,screenshots:visible.length-screenshots},available:available.length,visible:visible.length,repositoryChecks:checked,demoChecks:validated,screenshots,ready,githubBatch:ready?150:0,spacesBatch:ready?10:0,curatedBatch:ready?10:0,communityBatch:ready?10:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const entries=[];for(const file of ['catalog','spaces'])entries.push(...JSON.parse(await readFile(new URL('../dist/'+file+'.json',import.meta.url),'utf8')).repositories);
 const plan=qualityPlan(entries);await recordStageMetrics('priority',plan);console.log('Catalogue quality priority: '+JSON.stringify(plan));
 if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,Object.entries(plan).map(([key,value])=>`${key}=${value}`).join('\n')+'\n');
}
