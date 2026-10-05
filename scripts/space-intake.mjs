import {createRequire} from 'node:module';const P=createRequire(import.meta.url)('../dist/providers.js');
export function spaceCandidate(item,{minLikes=2}={}){const sdk=item.sdk||item.cardData?.sdk||item.carddata?.sdk;return P.validId(item.id)&&!item.private&&!item.gated&&(Number(item.likes)||0)>=minLikes&&(!sdk||['gradio','streamlit','static','docker'].includes(sdk));}
export function safeSpacePage(value){try{const u=new URL(value);return u.origin==='https://huggingface.co'&&u.pathname==='/api/spaces'&&!u.username&&!u.password?u.href:null}catch{return null}}
export async function intakeSpaces({cache,budget=350,minLikes=2,fetcher=fetch,visit,now=Date.now,maxPages=15,timeBudget=300000}){
 const metrics={inspected:0,added:0,found:0,skipped:0,pages:0,errors:0,stopped:null};const start=now();
 while(metrics.inspected<budget&&metrics.pages<maxPages&&now()-start<timeBudget){
  const url=safeSpacePage(cache.spacesNext)||'https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=100&full=true';
  const response=await fetcher(url,{signal:AbortSignal.timeout(15000)});if(!response.ok){metrics.stopped='http_'+response.status;metrics.errors++;break}const rows=await response.json();if(!Array.isArray(rows))throw Error('Unexpected Spaces listing');metrics.pages++;
  let offset=Math.min(Math.max(0,Number(cache.spacesOffset)||0),rows.length);
  // Limit each wave to four public API checks, and preserve the exact cursor.
  while(offset<rows.length&&metrics.inspected<budget&&now()-start<timeBudget){
   const candidates=rows.slice(offset,offset+Math.min(4,budget-metrics.inspected));const outcomes=await Promise.all(candidates.map(async item=>{if(!spaceCandidate(item,{minLikes}))return {skipped:true};try{return await visit(item)}catch{return {checked:true,error:true}}}));
   const failed=outcomes.findIndex(r=>r.stop);for(const r of outcomes){if(r.checked)metrics.inspected++;else metrics.skipped++;if(r.found)metrics.found++;if(r.added)metrics.added++;if(r.error)metrics.errors++;}offset+=failed>=0?failed:candidates.length;cache.spacesOffset=offset;
   if(failed>=0){metrics.stopped='rate_limit';break}
  }
  if(offset>=rows.length){cache.spacesOffset=0;cache.spacesNext=safeSpacePage(response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]);if(!cache.spacesNext)break;}
  if(metrics.stopped)break;
 }
 if(!metrics.stopped&&now()-start>=timeBudget)metrics.stopped='time_budget';if(!metrics.stopped&&metrics.pages>=maxPages)metrics.stopped='page_budget';return metrics;
}
