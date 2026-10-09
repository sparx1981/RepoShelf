import {createCheckpointStore} from './checkpoint-store.mjs';
const source='sparx1981/reposhelf-x-collector';
export function createXPipelineStatus({fetcher=fetch,now=Date.now,checkpoint=createCheckpointStore({fetcher}),token=process.env.REPOSHELF_X_ACTIONS_TOKEN||process.env.REPOSHELF_ACTIONS_TOKEN,intakeToken=process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN||token}={}){
 let cached,pending;
 async function json(url,{auth=false,credential=token}={}){const r=await fetcher(url,{headers:{Accept:'application/vnd.github+json','User-Agent':'RepoShelf-X-status',...(auth&&credential?{Authorization:'Bearer '+credential}:{})},redirect:'error',signal:AbortSignal.timeout(5000)});if(!r.ok)return null;const text=await r.text();if(text.length>100000)throw Error('X status response too large');return JSON.parse(text)}
 const run=r=>r?{id:r.id,status:r.status,conclusion:r.conclusion,url:r.html_url,createdAt:r.created_at,updatedAt:r.updated_at}:null;
 return async()=>{if(cached&&cached.until>now())return cached.value;if(pending)return pending;pending=(async()=>{
 const [collector,importRuns,summary,intake,published,publication]=await Promise.all([
 json(`https://api.github.com/repos/${source}/actions/workflows/collect.yml/runs?branch=main&per_page=1`,{auth:true}),
 json('https://api.github.com/repos/sparx1981/RepoShelf/actions/workflows/x-intake.yml/runs?branch=main&per_page=1',{auth:true,credential:intakeToken}),
 json(`https://raw.githubusercontent.com/${source}/collector-state/summary.json`),
 checkpoint.json('data/x-intake.json',3000),
 json('https://raw.githubusercontent.com/sparx1981/RepoShelf/main/data/x-intake.json'),
 checkpoint.json('data/publication.json',3000)
 ]);
 const latest=run(collector?.workflow_runs?.[0]),importRun=run(importRuns?.workflow_runs?.[0]),saved=intake||published;
 const currentSummary=summary&&(!latest||String(summary.runId)===String(latest.id));
 const currentIntake=Boolean(saved&&(!latest||(saved.collectorRunId?String(saved.collectorRunId)===String(latest.id):!latest.createdAt||Date.parse(saved.checkedAt)>=Date.parse(latest.createdAt))));
 const isPublished=Boolean(currentIntake&&published&&saved.revision===published.revision&&saved.checkedAt===published.checkedAt);
 const value={checkedAt:new Date(now()).toISOString(),collection:latest,historyAvailable:{collection:Boolean(collector),import:Boolean(importRuns)},counts:summary||null,countsCurrent:Boolean(currentSummary),import:importRun,intake:saved?{checkedAt:saved.checkedAt,revision:saved.revision,accepted:saved.accepted??saved.results?.filter(r=>r.status==='imported').length??0,held:saved.held??saved.results?.filter(r=>r.status!=='imported').length??0,qualityReady:saved.qualityReady??null}:null,publication:{status:isPublished?'published':currentIntake&&(saved.accepted??saved.results?.filter(r=>r.status==='imported').length)===0?'not_needed':currentIntake?'awaiting_publication':'awaiting_import',lastPublishedAt:publication?.lastPublishedAt||null,commit:publication?.commit||null}};
 cached={until:now()+30000,value};return value;
 })().finally(()=>{pending=null});return pending};
}
