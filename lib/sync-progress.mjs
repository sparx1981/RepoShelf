export const progressBranch='reposhelf-progress';
export function cleanSyncProgress(value){
 if(value?.schema!==1||!/^\d+$/.test(String(value.runId||''))||!Number.isSafeInteger(value.attempt)||value.attempt<1||!['running','complete','interrupted'].includes(value.status)||!Number.isFinite(Date.parse(value.updatedAt)))return null;
 const count=n=>Number.isSafeInteger(n)&&n>=0?n:0,metrics=m=>Object.fromEntries(['attempted','working','captured','temporaryFailures','unavailable','remainingDue'].map(k=>[k,count(m?.[k])]));
 return {schema:1,runId:String(value.runId),attempt:value.attempt,status:value.status,updatedAt:value.updatedAt,startedAt:Number.isFinite(Date.parse(value.startedAt))?value.startedAt:null,
  stage:'Demo validation and screenshots',previews:metrics(value.previews),health:metrics(value.health),activeWorkers:Math.min(4,count(value.activeWorkers)),concurrency:Math.min(4,count(value.concurrency)),budgetMs:count(value.budgetMs),elapsedMs:count(value.elapsedMs),workerRestarts:count(value.workerRestarts)};
}
export async function fetchSyncProgress({fetcher=fetch,now=Date.now}={}){
 try{const response=await fetcher(`https://raw.githubusercontent.com/sparx1981/RepoShelf/${progressBranch}/data/sync-progress.json?t=${Math.floor(now()/30000)}`,{headers:{Accept:'application/json','User-Agent':'RepoShelf'},redirect:'error',signal:AbortSignal.timeout(2000)});if(!response.ok)return null;const value=cleanSyncProgress(await response.json());if(!value)return null;const age=now()-Date.parse(value.updatedAt);return {...value,stale:age>120000||age< -30000,ageSeconds:Math.max(0,Math.round(age/1000))}}catch{return null}
}
