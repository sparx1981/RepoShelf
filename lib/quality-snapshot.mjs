// Public catalogue evidence only; no administrative notes or visitor identifiers.
export function qualitySnapshot(entries,{at=new Date().toISOString(),runId=null}={}){
 const keys=['full','name','description','category','subjects','platforms','classification','license','source','demo','availability','lastCheckedAt','checkError','demoHealth','previewCheck','previewAttemptAt','previewCandidate','listingControl'];
 return {schema:1,at,runId,entries:entries.map(r=>({...Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])),screenshots:(r.screenshots||[]).map(({src,kind,url,capturedAt})=>({src,kind,url,capturedAt}))}))};
}
