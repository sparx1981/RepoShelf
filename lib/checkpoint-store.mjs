// Public generated diagnostics only. Never forward a user's GitHub token to raw hosts.
export const checkpointRoot='https://raw.githubusercontent.com/sparx1981/RepoShelf/reposhelf-checkpoints/';
const id=value=>/^\d+$/.test(String(value||''));
export function createCheckpointStore({fetcher=fetch,now=Date.now}={}){
 const cache=new Map();
 async function json(path,timeout=2000){
  if(path!=='.sync-checkpoint.json'&&path!=='data/catalogue-quality.json'&&path!=='data/capture-providers.json'&&path!=='dist/growth.json'&&path!=='data/publication.json'&&!/^data\/sync-runs\/\d+\.json$/.test(path))throw Error('Invalid checkpoint path');
  const hit=cache.get(path);if(hit&&hit.expires>now())return hit.value;
  try{const response=await fetcher(checkpointRoot+path+(path==='data/catalogue-quality.json'?'?v='+Math.floor(now()/20000):''),{headers:{Accept:'application/json','User-Agent':'RepoShelf'},redirect:'error',signal:AbortSignal.timeout(timeout)});if(!response.ok)return null;const value=await response.json();cache.set(path,{value,expires:now()+20000});if(cache.size>100)cache.delete(cache.keys().next().value);return value}catch{return null}
 }
 async function reports(ids){const deadline=Date.now()+4000;if(ids===null){const meta=await json('.sync-checkpoint.json',1500);ids=meta?.schema===1&&Array.isArray(meta.reportIds)?meta.reportIds:[]}
  const wanted=[...new Set(ids.filter(id).map(String))].slice(0,20),out=[];let cursor=0;
  await Promise.all(Array.from({length:Math.min(4,wanted.length)},async()=>{while(cursor<wanted.length&&Date.now()<deadline){const run=wanted[cursor++],row=await json('data/sync-runs/'+run+'.json',Math.min(1500,Math.max(1,deadline-Date.now())));if(row&&String(row.id)===run&&Number.isInteger(row.attempt)&&Array.isArray(row.stages))out.push(row)}}));return out;
 }
 return {json,reports};
}
