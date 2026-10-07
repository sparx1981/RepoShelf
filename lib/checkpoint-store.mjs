// Generated diagnostics only. Never forward a token to raw hosts: a public repository is read anonymously there,
// and a private one is read through the GitHub API, where the call's token or the server's Actions token applies.
export const checkpointRoot='https://raw.githubusercontent.com/sparx1981/RepoShelf/reposhelf-checkpoints/',checkpointApi='https://api.github.com/repos/sparx1981/RepoShelf/contents/';
const serverToken=()=>process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN||null;
const id=value=>/^\d+$/.test(String(value||''));
export function createCheckpointStore({fetcher=fetch,now=Date.now}={}){
 const cache=new Map();
 async function json(path,timeout=2000,token=null){
  if(path!=='.sync-checkpoint.json'&&path!=='data/catalogue-quality.json'&&path!=='data/capture-providers.json'&&path!=='dist/growth.json'&&path!=='data/publication.json'&&path!=='data/launch-cadence.json'&&!/^data\/sync-runs\/\d+\.json$/.test(path))throw Error('Invalid checkpoint path');
  const hit=cache.get(path);if(hit&&hit.expires>now())return hit.value;
  const keep=value=>{cache.set(path,{value,expires:now()+20000});if(cache.size>100)cache.delete(cache.keys().next().value);return value},deadline=now()+timeout;
  // A private repository answers anonymous raw reads with 404, so try the API with a token first and fall back to raw.
  for(const candidate of [...new Set([token,serverToken()].filter(Boolean))]){try{const response=await fetcher(checkpointApi+path+'?ref=reposhelf-checkpoints',{headers:{Accept:'application/vnd.github.raw+json','User-Agent':'RepoShelf',Authorization:'Bearer '+candidate},signal:AbortSignal.timeout(Math.max(1,Math.min(timeout,deadline-now())))});if(response.ok)return keep(await response.json());if(response.status===404)break}catch{}}
  try{const response=await fetcher(checkpointRoot+path+(path==='data/catalogue-quality.json'?'?v='+Math.floor(now()/20000):''),{headers:{Accept:'application/json','User-Agent':'RepoShelf'},redirect:'error',signal:AbortSignal.timeout(Math.max(1,deadline-now()))});if(!response.ok)return null;return keep(await response.json())}catch{return null}
 }
 async function reports(ids,token=null){const deadline=Date.now()+4000;if(ids===null){const meta=await json('.sync-checkpoint.json',1500,token);ids=meta?.schema===1&&Array.isArray(meta.reportIds)?meta.reportIds:[]}
  const wanted=[...new Set(ids.filter(id).map(String))].slice(0,20),out=[];let cursor=0;
  await Promise.all(Array.from({length:Math.min(4,wanted.length)},async()=>{while(cursor<wanted.length&&Date.now()<deadline){const run=wanted[cursor++],row=await json('data/sync-runs/'+run+'.json',Math.min(1500,Math.max(1,deadline-Date.now())),token);if(row&&String(row.id)===run&&Number.isInteger(row.attempt)&&Array.isArray(row.stages))out.push(row)}}));return out;
 }
 return {json,reports};
}
