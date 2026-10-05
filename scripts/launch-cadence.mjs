import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {launchDecision,launchMilestone} from '../lib/launch-cadence.mjs';
const root=new URL('../',import.meta.url);
export async function checkpointJson(path,{fetcher=fetch}={}){
 try{const res=await fetcher('https://raw.githubusercontent.com/sparx1981/RepoShelf/reposhelf-checkpoints/'+path,{signal:AbortSignal.timeout(10000),redirect:'error'});return res.ok?await res.json():null;}catch{return null;}
}
export async function requestLaunch({fetcher=fetch,token=process.env.GITHUB_TOKEN,now=Date.now()}={}){
 const [growth,state]=await Promise.all([checkpointJson('dist/growth.json',{fetcher}),checkpointJson('data/launch-cadence.json',{fetcher})]);
 const snapshot=growth?.snapshots?.at(-1),fresh=now-Date.parse(snapshot?.at)<6*3600000;
 const decision=launchDecision({now,published:fresh&&Number.isFinite(snapshot?.published)?snapshot.published:null,state:state||{}});
 if(!decision.extra)return {requested:false,reason:decision.reason};
 if(!token)throw Error('Launch scheduler token missing');
 const base='https://api.github.com/repos/sparx1981/RepoShelf/actions/workflows/';
 const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'};
 const groups=await Promise.all(['catalog.yml','publication.yml','submissions.yml','recovery.yml'].map(async name=>{
  const res=await fetcher(base+name+'/runs?branch=main&per_page=10',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw Error('Launch history unavailable: '+res.status);const data=await res.json();
  if(!Array.isArray(data.workflow_runs))throw Error('Launch history malformed');return data.workflow_runs;
 }));
 if(groups.flat().some(r=>r.status!=='completed'))return {requested:false,reason:'workflow_active'};
 const response=await fetcher(base+'catalog.yml/dispatches',{method:'POST',headers,redirect:'error',body:JSON.stringify({ref:'main',inputs:{launch_extra:true,refresh_previews:false}}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Launch sync dispatch failed: '+response.status);return {requested:true,reason:'launch_acceleration'};
}
async function read(path,fallback){try{return JSON.parse(await readFile(new URL(path,root),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;return fallback}}
async function output(values){if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n');console.log(JSON.stringify(values));}
export async function main(command){
 if(command==='dispatch'){console.log(JSON.stringify(await requestLaunch()));return;}
 if(command==='gate'){
  const [growth,state]=await Promise.all([checkpointJson('dist/growth.json'),checkpointJson('data/launch-cadence.json')]);const snapshot=growth?.snapshots?.at(-1),fresh=Date.now()-Date.parse(snapshot?.at)<6*3600000;
  await output(launchDecision({event:process.env.GITHUB_EVENT_NAME,published:fresh&&Number.isFinite(snapshot?.published)?snapshot.published:null,state:state||{}}));return;
 }
 const state=await read('data/launch-cadence.json',{schema:1,extraRuns:[]}),now=Date.now();state.extraRuns=(state.extraRuns||[]).filter(r=>now-Date.parse(r.at)<86400000);
 if(command==='start'){
  if(process.env.LAUNCH_EXTRA==='true'&&!state.extraRuns.some(r=>r.id===process.env.GITHUB_RUN_ID))state.extraRuns.push({id:process.env.GITHUB_RUN_ID,at:new Date(now).toISOString()});
 }else if(command==='finish'){
  const report=await read('data/sync-runs/'+process.env.GITHUB_RUN_ID+'.json',{}),growth=await read('dist/growth.json',{});
  const published=growth.snapshots?.at(-1)?.published??report.work?.coverageAfter?.publication?.published??state.published??null;
  const gains=Number.isFinite(state.published)&&Number.isFinite(published)?published-state.published:report.work?.qualityGains?.published||0;
  state.published=published;state.stalledRuns=gains>0?0:(state.stalledRuns||0)+1;state.retryAt=state.stalledRuns>=3?new Date(now+6*3600000).toISOString():null;state.lastRunAt=new Date(now).toISOString();
  await output({milestonePublication:Number.isFinite(published)&&published>=launchMilestone&&!state.milestonePublishedAt&&report.status==='success'});
 }else if(command==='published'){state.milestonePublishedAt=new Date(now).toISOString();}
 else throw Error('Use dispatch, gate, start, finish or published');
 await mkdir(new URL('data/',root),{recursive:true});await writeFile(new URL('data/launch-cadence.json',root),JSON.stringify(state,null,2)+'\n');
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await main(process.argv[2]);
