import {readFile,writeFile} from 'node:fs/promises';
import {collectTrendshift,mergeTrendshift} from './trendshift-sources.mjs';
import {importListCandidate} from './source-imports.mjs';
const root=new URL('../',import.meta.url);
async function read(path,fallback){try{return JSON.parse(await readFile(new URL(path,root),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;return fallback}}
async function save(path,data){await writeFile(new URL(path,root),JSON.stringify(data,null,/^dist\/(catalog|spaces)\.json$/.test(path)?0:2)+'\n')}
const now=Date.now(),snapshot=await read('dist/trendshift.json',{entries:{},sources:{}});
// Trendshift's lists change about once a day, so when every list was read successfully in the last 20 hours nothing is
// fetched (TRENDSHIFT_FORCE=1 overrides). A list that failed is retried on the next run.
const lists=['daily','weekly','monthly','githubDaily'],fresh=lists.every(name=>{const s=snapshot.sources?.[name];return s?.status==='ok'&&now-Date.parse(s.checkedAt)<20*3600000});
if(process.env.TRENDSHIFT_FORCE!=='1'&&fresh){console.log('Trendshift: every list was read within the last 20 hours; next read after 20 hours.');process.exit(0)}
const result=await collectTrendshift({now});
const catalog=await read('dist/catalog.json',{repositories:[]}),cache=await read('.trendshift-cache.json',{}),repos=new Map(catalog.repositories.map(r=>[r.full.toLowerCase(),r]));
const entries=mergeTrendshift(snapshot.entries,result.lists,now);
// Renamed repositories: follow the identity the importer learned earlier so one repository keeps one entry.
for(const [key,entry]of Object.entries(entries)){const canonical=cache[key]?.canonicalFull;if(canonical&&/^[\w.-]+\/[\w.-]+$/.test(canonical)&&canonical.toLowerCase()!==key){delete entries[key];entries[canonical.toLowerCase()]={...entry,full:canonical}}}
const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-catalog'};if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
const batch=Math.max(0,Math.min(100,Number(process.env.TRENDSHIFT_IMPORT_BATCH||40)));let checked=0,imported=0,failed=0;
// Only repositories the catalogue does not hold yet are imported, strongest signal first. They go through the same checks as every
// other import: public, not archived, a demo link found in the README or homepage, moderation exclusions respected.
const order=Object.values(entries).sort((a,b)=>b.signal-a.signal||a.full.localeCompare(b.full));
for(const candidate of order){if(checked>=batch)break;const key=candidate.full.toLowerCase();if(repos.has(key))continue;const last=cache[key];if(last?.nextAttemptAt&&Date.parse(last.nextAttemptAt)>now)continue;checked++;
 try{const entry=await importListCandidate(candidate.full,{kind:'trendshift',name:'Trendshift',url:'https://trendshift.io/'},undefined,{headers,requireDemo:true,skipArchived:true,now});
  cache[key]={nextAttemptAt:new Date(now+86400000).toISOString(),...(entry?{canonicalFull:entry.full}:{})};
  if(entry){entry.discoveredVia=(entry.discoveredVia||[]).filter(p=>p.kind!=='trendshift');repos.set(entry.full.toLowerCase(),entry);if(entry.full.toLowerCase()!==key){delete entries[key];entries[entry.full.toLowerCase()]={...candidate,full:entry.full}}imported++}
 }catch(e){failed++;cache[key]={nextAttemptAt:new Date(now+([404,410].includes(e.status)?86400000:6*3600000)).toISOString()};if([401,403,429].includes(e.status))break}}
const sources={...snapshot.sources};for(const [list,status]of Object.entries(result.sources))sources[list]={...sources[list],...status,...(status.status==='ok'?{lastSuccessAt:status.checkedAt,reason:undefined}:{})};
await save('dist/trendshift.json',{schema:1,updatedAt:new Date(now).toISOString(),sources,import:{checked,imported,failed},entries});
if(imported)await save('dist/catalog.json',{...catalog,repositories:[...repos.values()]});
await save('.trendshift-cache.json',Object.fromEntries(Object.entries(cache).filter(([,v])=>Date.parse(v.nextAttemptAt)>now-30*86400000)));
const known=Object.keys(entries).filter(key=>repos.has(key)).length;
console.log(`Trendshift: ${Object.keys(entries).length} repositories on current lists (${known} in the catalogue); ${checked} new candidates checked, ${imported} imported, ${failed} postponed. ${Object.entries(result.sources).map(([s,v])=>`${s}: ${v.status}${v.url?' ('+v.url+')':''} (${v.mentionsFound} repositories${v.reason?', '+v.reason:''})`).join('; ')}.`);
