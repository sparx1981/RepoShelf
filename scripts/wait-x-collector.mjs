import {writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function waitForCollector({fetcher=fetch,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),notBefore,timeoutMs=20*60000}={}){
 const scheduled=new Date(now());scheduled.setUTCHours(6,0,0,0);if(scheduled.getTime()>now())scheduled.setUTCDate(scheduled.getUTCDate()-1);
 const after=notBefore?Date.parse(notBefore):scheduled.getTime();if(!Number.isFinite(after))throw Error('Invalid collector start time');
 const deadline=now()+timeoutMs;let latest=null;
 while(now()<deadline){
  // Signed in with the workflow's token: the anonymous allowance (60 calls an hour per address) is shared with every other job on the runner's
  // address and ran out, which failed an import after it had already waited an hour for its turn (HTTP 403).
  const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-X-chain',...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})};
  const response=await fetcher('https://api.github.com/repos/sparx1981/reposhelf-x-collector/actions/workflows/collect.yml/runs?branch=main&per_page=20',{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
  // A rate limit or a server hiccup is waited out like any other pending state; anything else is a real failure.
  if([403,429,500,502,503,504].includes(response.status)){await sleep(30000);continue}
  if(!response.ok)throw Error('Cannot read collector history: HTTP '+response.status);
  const data=await response.json();if(!Array.isArray(data.workflow_runs))throw Error('Invalid collector history');
  const run=data.workflow_runs.find(r=>Date.parse(r.created_at)>=after-5000);
  if(run?.status==='completed'){
   if(run.conclusion!=='success')throw Error('Collector did not succeed; existing candidates were not imported by this chain.');
   return run;
  }
  latest=data.workflow_runs.find(r=>r.status==='completed'&&r.conclusion==='success'&&now()-Date.parse(r.created_at)<=36*3600000)||latest;
  await sleep(30000);
 }
 // A manual start whose collector run never came (or came before the requested time) still imports what the last good run validated, rather than failing after twenty minutes. Imports skip listings already saved.
 if(latest){console.warn('No collector run started after the requested time; using the latest successful run: '+latest.html_url);return latest}
 throw Error('Collector completion timed out; retry the import workflow after checking collection history.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const run=await waitForCollector({notBefore:process.env.X_NOT_BEFORE});
 await writeFile('data/x-collection-run.json',JSON.stringify({id:run.id,url:run.html_url,completedAt:run.updated_at})+'\n');
 if(process.env.GITHUB_ENV)await appendFile(process.env.GITHUB_ENV,'X_COLLECTOR_RUN_ID='+run.id+'\n');
 console.log('Collector completed: '+run.html_url);
}
