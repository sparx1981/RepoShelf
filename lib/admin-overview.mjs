import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {catalogueSchedule} from './workflow-control.mjs';
import {publicationSummary} from './publication-policy.mjs';
export function catalogueGrowth(history,current,now=Date.now()){
 const rows=history.filter(r=>Number.isFinite(Number(r.published))&&Number.isFinite(Date.parse(r.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const at=time=>rows.filter(r=>Date.parse(r.at)<=time).at(-1);
 return [1,7,30,180,365].map(days=>{const a=at(now-days*86400000),b=at(now-days*2*86400000);return {days,current:a&&current!==null?current-Number(a.published):null,previous:a&&b?Number(a.published)-Number(b.published):null,baselineAt:a?.at||null}});
}
export function publicCatalogueCount(summary,controls=[]){
 if(!Array.isArray(summary?.publicProjects))return null;
 const map=new Map(controls.map(c=>[c.project_id.toLowerCase(),c]));
 return summary.publicProjects.filter(r=>{const c=map.get(r.id.toLowerCase());if(!c)return true;if(['hidden','excluded'].includes(c.visibility))return false;const rejected=createHash('sha256').update(c.rejected_preview||'').digest('hex').slice(0,24);return !c.preview_rejected||r.previews.some(s=>(s.hash?s.hash!==rejected:s.src!==c.rejected_preview)||(typeof s.at==='number'?s.at:Date.parse(s.at))>Date.parse(c.rejected_at))}).length;
}
async function saved(path){try{return JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
export async function overviewOperations(checkpoint,now=Date.now()){
 const [savedOverview,publication,cadence]=await Promise.all([saved('data/runtime/overview.json'),checkpoint.json('data/publication.json').then(r=>r||saved('data/publication.json')),checkpoint.json('data/launch-cadence.json').then(r=>r||saved('data/launch-cadence.json'))]);
 const meta=await checkpoint.json('.sync-checkpoint.json');
 let latest=null;
 if(meta?.reportIds?.length){const id=[...meta.reportIds].sort((a,b)=>Number(b)-Number(a))[0];const report=await checkpoint.json('data/sync-runs/'+id+'.json');if(report?.status==='success'&&(!savedOverview?.lastSyncAt||Date.parse(report.recordedAt)>Date.parse(savedOverview.lastSyncAt)))latest=report}
 const before=latest?.work?.coverageBefore?.publication?.published,after=latest?.work?.coverageAfter?.publication?.published;
 return {...catalogueSchedule(now,cadence),publication:publicationSummary(publication),lastSyncAt:latest?.recordedAt||savedOverview?.lastSyncAt||null,lastSyncGrowth:latest?(Number.isFinite(before)&&Number.isFinite(after)?after-before:null):savedOverview?.lastSyncGrowth??null,syncWorkflowUrl:'https://github.com/sparx1981/RepoShelf/actions/workflows/catalog.yml'};
}
