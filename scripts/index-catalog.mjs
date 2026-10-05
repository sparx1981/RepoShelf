import {recordStageMetrics} from './sync-metrics.mjs';
import {savedListingControls} from '../lib/listing-policy.mjs';
import {saveReadmeSnapshot} from './agent-snapshots.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {checkRepository,dueEntries,repositoryCheckPlan} from './catalog-health.mjs';
import {withOverview} from './readme-overviews.mjs';
import {withProjectInsights} from './project-insights.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const D=require('../dist/discovery.js');const S=require('../dist/storefront.js');
const output=new URL('../dist/catalog.json',import.meta.url),cacheFile=new URL('../.catalog-cache.json',import.meta.url);
let old={repositories:[]},cache={};try{old=JSON.parse(await readFile(output,'utf8'))}catch{}try{cache=JSON.parse(await readFile(cacheFile,'utf8'))}catch{}
const excluded=new Set((await savedListingControls()).filter(c=>c.visibility==='excluded').map(c=>c.project_id.toLowerCase()));
const indexed=new Map((old.repositories||[]).filter(r=>D.demoUrl(r.demo)&&!excluded.has(r.full.toLowerCase())).map(r=>[r.full.toLowerCase(),r]));
const token=process.env.GITHUB_TOKEN;const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-catalog'};if(token)headers.Authorization=`Bearer ${token}`;
const maxCandidates=Number(process.env.CATALOG_BATCH_SIZE||1500),maxPages=Number(process.env.CATALOG_PAGES||4);let checked=0,found=0,failed=0,cacheHits=0,searchQueries=0,repositoryPaused=false;const started=Date.now();
const seeds=['demo in:readme','playground in:readme','"live preview" in:readme','"live site" in:readme','topic:live-demo','"try online" in:readme'];
// Partition by star range to get past GitHub's 1,000-results-per-query ceiling.
const ranges=['stars:>=1000','stars:100..999','stars:10..99','stars:1..9','stars:0'];
const tasks=seeds.flatMap(seed=>ranges.map(range=>({q:`${seed} ${range} is:public archived:false fork:false`,page:1})));
// Rotate query order each day so small daily batches cover the whole catalog over time.
const offset=Math.floor(Date.now()/86400000)%tasks.length;tasks.push(...tasks.splice(0,offset));
const discoverySort=Math.floor(Date.now()/(6*3600000))%2?'updated':'stars';let searchPaused=null;
let searchTime=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(url,opts={}){const res=await fetch(url,{...opts,signal:AbortSignal.timeout(12000)});if(!res.ok){const error=new Error(`HTTP ${res.status} for ${new URL(url).hostname}`);error.status=res.status;error.rateRemaining=res.headers.get('x-ratelimit-remaining');error.rateReset=res.headers.get('x-ratelimit-reset');throw error}return res}
async function readme(repo){for(const path of ['README.md','readme.md','README.MD','README.rst']){try{return {markdown:await (await request(`https://raw.githubusercontent.com/${repo.full}/${encodeURIComponent(repo.branch)}/${path}`)).text(),sourceUrl:`https://github.com/${repo.full}/blob/${encodeURIComponent(repo.branch)}/${path}`}}catch(e){if(e.status!==404)throw e}}return {markdown:'',sourceUrl:`https://github.com/${repo.full}`} }
async function pool(items,fn){let i=0;await Promise.all(Array.from({length:6},async()=>{while(i<items.length){const item=items[i++];await fn(item)}}))}
const seen=new Set();
const healthStats={checked:0,unavailable:0,temporaryFailures:0};let repositoryPlan=null,repositoryDue=0,repositoryStopReason=null;
async function revalidate(){const entries=[...indexed.values()];let remaining=null;
try{const response=await fetch('https://api.github.com/rate_limit',{headers,signal:AbortSignal.timeout(10000)});if(response.ok){const data=await response.json();const value=data.resources?.core?.remaining;if(Number.isFinite(value))remaining=value}}catch{}
repositoryPlan=repositoryCheckPlan(entries,{remaining,authenticated:Boolean(token),batch:process.env.CATALOG_REVALIDATE_BATCH||'auto'});
const dueAll=dueEntries(entries,Date.now(),entries.length);repositoryDue=dueAll.length;const due=dueAll.slice(0,repositoryPlan.limit),deadline=Date.now()+360000;
if(dueAll.length&&!due.length){repositoryStopReason='api_budget';console.warn('Revalidation deferred to preserve GitHub API headroom.');return true}

// Sequential checks allow us to stop promptly if GitHub rejects authentication or throttles us.
for(const prior of due){if(Date.now()>=deadline){repositoryStopReason='time_budget';break}const result=await checkRepository(prior,{headers});healthStats.checked++;if(result.entry.availability==='unavailable')healthStats.unavailable++;if(result.entry.checkError)healthStats.temporaryFailures++;
let entry=result.entry;if(result.data&&entry.availability==='available')entry={...entry,...D.mapRepo(result.data),demo:prior.demo,lastDemoCheckedAt:prior.lastDemoCheckedAt};if(result.data&&entry.availability==='available')entry=S.recordMetrics(entry);indexed.set(prior.full.toLowerCase(),entry);
if(entry.full.toLowerCase()!==prior.full.toLowerCase()){indexed.delete(prior.full.toLowerCase());indexed.set(entry.full.toLowerCase(),entry)}
if(result.stop){repositoryStopReason=result.entry.checkError?.kind||'temporary';console.warn('Revalidation paused; saved records preserved for retry.');return true}}
console.log(`Revalidation: ${healthStats.checked} checked, ${healthStats.unavailable} unavailable, ${healthStats.temporaryFailures} temporary failures.`);return false}

try{const paused=await revalidate();repositoryPaused=paused;while(!paused&&tasks.length&&checked<maxCandidates){const task=tasks.shift();await sleep(Math.max(0,2200-(Date.now()-searchTime)));searchTime=Date.now();let data;try{searchQueries++;data=await (await request(`https://api.github.com/search/repositories?q=${encodeURIComponent(task.q)}&sort=${discoverySort}&order=desc&per_page=100&page=${task.page}`,{headers})).json()}catch(e){failed++;searchPaused={status:e.status||null,rateRemaining:e.rateRemaining??null,rateReset:e.rateReset??null};console.warn(`Search paused: ${e.message}; remaining=${e.rateRemaining??'unknown'}, reset=${e.rateReset??'unknown'}. Saved entries retained.`);if([403,429].includes(e.status))break;continue}
const fresh=(data.items||[]).filter(r=>!seen.has(r.full_name.toLowerCase())&&!excluded.has(r.full_name.toLowerCase()));fresh.forEach(r=>seen.add(r.full_name.toLowerCase()));const remaining=maxCandidates-checked;await pool(fresh.slice(0,remaining),async d=>{const r=D.mapRepo(d),key=r.full.toLowerCase(),prior=indexed.get(key)||{},at=new Date().toISOString();let entry=S.recordMetrics({...prior,...r,demo:prior.demo,availability:'available',lastCheckedAt:at,lastAttemptAt:at,lastAvailableAt:at});entry.technologies=S.technologies(entry);delete entry.unavailableSince;delete entry.unavailableReason;delete entry.checkError;delete entry.nextCheckAt;const hit=cache[key];if(hit&&hit.parserVersion===2&&(!hit.demo||D.demoUrl(hit.demo))&&hit.updated===r.updated&&Date.now()-hit.checked<7*86400000){cacheHits++;if(hit.demo)indexed.set(key,{...entry,demo:hit.demo,lastDemoCheckedAt:new Date(hit.checked).toISOString()});else indexed.delete(key);return}checked++;try{const {markdown,sourceUrl}=await readme(r);r.demo=D.extractDemo(markdown,r.homepage);if(r.demo)entry={...withProjectInsights(withOverview(entry,markdown,sourceUrl),markdown,sourceUrl),overviewRepoUpdated:r.updated,readmeSnapshot:await saveReadmeSnapshot(r,markdown,sourceUrl)};cache[key]={parserVersion:2,updated:r.updated,checked:Date.now(),demo:r.demo};if(r.demo){indexed.set(key,{...entry,demo:r.demo,lastDemoCheckedAt:at});found++}else indexed.delete(key)}catch(e){failed++;if(indexed.has(key))indexed.set(key,entry);console.warn(`Skipped ${r.full}: ${e.message}`)}});
if(task.page<maxPages&&(data.items||[]).length===100&&task.page*100<Math.min(data.total_count||0,1000))tasks.push({...task,page:task.page+1});}
}finally{const repositories=[...indexed.values()].sort((a,b)=>(b.stars||0)-(a.stars||0));await writeFile(output,JSON.stringify({...old,schema:2,updatedAt:new Date().toISOString(),revalidation:healthStats,discovery:{checked,found,temporaryFailures:failed,sort:discoverySort,searchPaused},repositories},null,2)+'\n');await writeFile(cacheFile,JSON.stringify(cache));await recordStageMetrics('catalog',{repositoryChecks:healthStats.checked,repositoryPaused,repositoryPlan,repositoryDue,repositorySelected:Math.min(repositoryDue,repositoryPlan?.limit||0),repositoryRemainingDue:dueEntries(repositories,Date.now(),repositories.length).length,repositoryStopReason,repositoryObserved48h:repositories.filter(r=>r.availability!=='unavailable'&&r.lastCheckedAt&&Date.now()-Date.parse(r.lastCheckedAt)<=2*86400000).length,repositoryObserved24h:repositories.filter(r=>r.availability!=='unavailable'&&r.lastCheckedAt&&Date.now()-Date.parse(r.lastCheckedAt)<=86400000).length,candidateLimit:maxCandidates,candidatesChecked:checked,demosFound:found,cacheHits,searchQueries,searchPaused,temporaryFailures:failed+healthStats.temporaryFailures,durationMs:Date.now()-started});console.log(`Catalog: ${repositories.length} saved records (${repositories.filter(D.isAvailable).length} available); ${checked} checked, ${found} found/refreshed, ${failed} temporary failures.`);}
if(!indexed.size&&failed)process.exitCode=1;
