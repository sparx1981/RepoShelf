import {readFile,readdir,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {recordStageMetrics} from './sync-metrics.mjs';
import {demoCandidates,refreshDemoReports} from './demo-health.mjs';
import {previewCandidates} from './preview-schedule.mjs';
import {checkpointWriter} from './browser-checkpoint.mjs';
export function browserDecision(last,now=Date.now(),force=false,entries=[]){const at=Date.parse(last),demoDue=demoCandidates(entries,now,entries.length).length,previewDue=previewCandidates(entries,now,entries.length).length;return {due:force||demoDue>0||previewDue>0,eligibilityBased:true,demoDue,previewDue,lastCompletedAt:Number.isFinite(at)?new Date(at).toISOString():null,nextDueAt:null}}
export async function lastBrowserCycle(root){let state;try{state=JSON.parse(await readFile(new URL('data/browser-cycle.json',root),'utf8'))}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e}if(state?.completedAt)return state.completedAt;
let names;try{names=await readdir(new URL('data/sync-runs/',root))}catch(e){if(e.code==='ENOENT')return null;throw e}const dates=[];for(const name of names.filter(n=>/^\d+\.json$/.test(n))){const report=JSON.parse(await readFile(new URL('data/sync-runs/'+name,root),'utf8'));if(['health','previews'].every(id=>report.stages?.some(s=>s.id===id&&s.status==='success'))&&Number.isFinite(Date.parse(report.recordedAt)))dates.push(report.recordedAt)}return dates.sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null}
export async function runBrowserCycle(mode,root=new URL('../',import.meta.url),env=process.env,now=Date.now(),fetcher=fetch){
 if(mode==='decide'){
  const snapshots=await Promise.all(['catalog','spaces'].map(async name=>JSON.parse(await readFile(new URL('dist/'+name+'.json',root),'utf8'))));
  const entries=snapshots.flatMap(s=>s.repositories);
  if(env.GITHUB_TOKEN){const before=JSON.stringify(entries.map(r=>r.demoReport));await refreshDemoReports(entries,{token:env.GITHUB_TOKEN,fetcher});if(before!==JSON.stringify(entries.map(r=>r.demoReport)))await checkpointWriter(['catalog','spaces'].map(name=>new URL('dist/'+name+'.json',root)),snapshots)(true)}
  const decision=browserDecision(await lastBrowserCycle(root),now,env.FORCE_BROWSER_REFRESH==='true',entries);
  await recordStageMetrics('browser_cycle',{...decision,forced:env.FORCE_BROWSER_REFRESH==='true',reason:decision.due?`${decision.previewDue} screenshots and ${decision.demoDue} demo checks eligible; untouched backlog can run after a recent batch.`:'No listings are currently eligible. Individual cooldowns and retry dates are respected.'},root);
  if(env.GITHUB_OUTPUT)await appendFile(env.GITHUB_OUTPUT,'due='+decision.due+'\n');
  console.log(decision.due?'Eligible browser work found; demo health and previews will run.':'No eligible browser work; saved results and retry dates retained.');return decision;
 }
 if(mode!=='complete')throw Error('Use decide or complete');await mkdir(new URL('data/',root),{recursive:true});const state={schema:2,completedAt:new Date(now).toISOString(),runId:env.GITHUB_RUN_ID||null};await writeFile(new URL('data/browser-cycle.json',root),JSON.stringify(state,null,2)+'\n');console.log('Browser batch completed; future syncs will check per-listing eligibility again.');return state;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await runBrowserCycle(process.argv[2]);
