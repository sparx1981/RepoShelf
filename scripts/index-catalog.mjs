import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const D=require('../dist/discovery.js');
const output=new URL('../dist/catalog.json',import.meta.url),cacheFile=new URL('../.catalog-cache.json',import.meta.url);
let old={repositories:[]},cache={};try{old=JSON.parse(await readFile(output,'utf8'))}catch{}try{cache=JSON.parse(await readFile(cacheFile,'utf8'))}catch{}
const indexed=new Map((old.repositories||[]).map(r=>[r.full.toLowerCase(),r]));
const token=process.env.GITHUB_TOKEN;const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-catalog'};if(token)headers.Authorization=`Bearer ${token}`;
const maxCandidates=Number(process.env.CATALOG_BATCH_SIZE||1500),maxPages=Number(process.env.CATALOG_PAGES||4);let checked=0,found=0,failed=0;
const seeds=['demo in:readme','playground in:readme','"live preview" in:readme','"live site" in:readme','topic:live-demo','"try online" in:readme'];
// Partition by star range to get past GitHub's 1,000-results-per-query ceiling.
const ranges=['stars:>=1000','stars:100..999','stars:10..99','stars:1..9'];
const tasks=seeds.flatMap(seed=>ranges.map(range=>({q:`${seed} ${range} is:public archived:false fork:false`,page:1})));
// Rotate query order each day so small daily batches cover the whole catalog over time.
const offset=Math.floor(Date.now()/86400000)%tasks.length;tasks.push(...tasks.splice(0,offset));
let searchTime=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(url,opts={}){const res=await fetch(url,{...opts,signal:AbortSignal.timeout(12000)});if(!res.ok){const error=new Error(`HTTP ${res.status} for ${new URL(url).hostname}`);error.status=res.status;throw error}return res}
async function readme(repo){for(const path of ['README.md','readme.md','README.MD','README.rst']){try{return await (await request(`https://raw.githubusercontent.com/${repo.full}/${encodeURIComponent(repo.branch)}/${path}`)).text()}catch(e){if(e.status!==404)throw e}}return ''}
async function pool(items,fn){let i=0;await Promise.all(Array.from({length:6},async()=>{while(i<items.length){const item=items[i++];await fn(item)}}))}
const seen=new Set();
try{while(tasks.length&&checked<maxCandidates){const task=tasks.shift();await sleep(Math.max(0,2200-(Date.now()-searchTime)));searchTime=Date.now();let data;try{data=await (await request(`https://api.github.com/search/repositories?q=${encodeURIComponent(task.q)}&sort=stars&order=desc&per_page=100&page=${task.page}`,{headers})).json()}catch(e){console.warn(`Search paused: ${e.message}`);if([403,429].includes(e.status))break;failed++;continue}
const fresh=(data.items||[]).filter(r=>!seen.has(r.full_name.toLowerCase()));fresh.forEach(r=>seen.add(r.full_name.toLowerCase()));const remaining=maxCandidates-checked;await pool(fresh.slice(0,remaining),async d=>{const r=D.mapRepo(d),key=r.full.toLowerCase();const hit=cache[key];if(hit&&hit.updated===r.updated&&Date.now()-hit.checked<7*86400000){if(hit.demo)indexed.set(key,{...r,demo:hit.demo});return}checked++;try{r.demo=D.extractDemo(await readme(r),r.homepage);cache[key]={updated:r.updated,checked:Date.now(),demo:r.demo};if(r.demo){indexed.set(key,r);found++}else indexed.delete(key)}catch(e){failed++;console.warn(`Skipped ${r.full}: ${e.message}`)}});
if(task.page<maxPages&&(data.items||[]).length===100&&task.page*100<Math.min(data.total_count||0,1000))tasks.push({...task,page:task.page+1});}
}finally{const repositories=[...indexed.values()].sort((a,b)=>(b.stars||0)-(a.stars||0));await writeFile(output,JSON.stringify({schema:1,updatedAt:new Date().toISOString(),repositories},null,2)+'\n');await writeFile(cacheFile,JSON.stringify(cache));console.log(`Catalog: ${repositories.length} demo projects; ${checked} checked, ${found} found/refreshed, ${failed} temporary failures.`)}
if(!indexed.size&&failed)process.exitCode=1;
