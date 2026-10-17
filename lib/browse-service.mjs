import {applyListingControls,createListingControls} from './listing-policy.mjs';
import {gunzip} from 'node:zlib';
import {promisify} from 'node:util';
import {createBrowseCache} from './browse-cache.mjs';
import {candidateIds} from './search-candidates.mjs';
import {compactProject} from './browse-card.mjs';
import {visibleVersion,matchesStorefrontSnapshot,snapshotPage,storefrontPage,clickShelves} from './storefront-snapshot.mjs';
const unzip=promisify(gunzip);
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {projectKey} from './project-key.mjs';
import {PUBLISHED_INDEX,REST_INDEX,mergePublished} from './browse-parts.mjs';
import {fail,createAccounts} from './accounts.mjs';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),P=require('../dist/providers.js'),Q=require('../dist/quality.js'),E=require('../dist/editorial.js');
export function createBrowseService({root=new URL('../',import.meta.url),controls=createListingControls({root,accounts:createAccounts()}),popularity=async()=>({})}={}){
 let pending,publicPending,communityPending,identityPending,publicPool,rankingsPending,weightedView,snapshotPending;
 const selections=createBrowseCache();
 const textShards=new Map();let candidatesPending;
 const candidates=()=>candidatesPending??=(read('data/browse/search-candidates.json.gz',null).catch(e=>{candidatesPending=null;throw e}));
 const read=async(path,fallback)=>{try{return JSON.parse(path.endsWith('.gz')?(await unzip(await readFile(new URL(path,root)))).toString():await readFile(new URL(path,root),'utf8'))}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e}};
 const readPart=async name=>{try{return await read('data/browse/'+name)}catch(e){if(e.code!=='ENOENT')throw e;return read('data/browse/'+name+'.gz')}};
 async function readProject(id){try{return JSON.parse((await unzip(await readFile(new URL('data/runtime/browse-projects/'+projectKey(id)+'.json.gz',root)))).toString())}catch(e){if(e.code!=='ENOENT')throw e;if(process.env.VERCEL)fail(503,'runtime_index_missing','Project details must be generated during deployment.');return read('data/browse/projects/'+projectKey(id)+'.json')}}
 // The complete list: the single index file where one exists (local builds, tests), else the published and unpublished parts merged back into their original order.
 async function dataset(){if(!pending)pending=(async()=>{try{return {index:await read('data/browse/index.json')}}catch(e){if(e.code!=='ENOENT')throw e}
  try{const [published,rest]=await Promise.all([readPart(PUBLISHED_INDEX),readPart(REST_INDEX)]);if(published.version!==rest.version)fail(503,'runtime_index_mismatch','The browsing index parts do not belong together; redeploy.');return {index:mergePublished(published,rest)}}catch(e){if(e.code!=='ENOENT')throw e}
  const [catalog,spaces,community]=await Promise.all([read('dist/catalog.json',{repositories:[]}),read('dist/spaces.json',{repositories:[]}),read('dist/community.json',{mentions:[]})]);if(process.env.VERCEL)fail(503,'runtime_index_missing','The browsing index must be generated during deployment.');return (await import('./browse-index.mjs')).createBrowseIndex(catalog,spaces,community)})().catch(e=>{pending=null;throw e});return pending}
 // Public requests show only published repositories (see browse-parts.mjs), so they load only that part; without it they use the complete list as before.
 async function publicDataset(){if(!publicPending)publicPending=(async()=>{try{return {index:await read('data/browse/'+PUBLISHED_INDEX)}}catch(e){if(e.code!=='ENOENT')throw e;return dataset()}})().catch(e=>{publicPending=null;throw e});return publicPending}
 // Id maps are rebuilt only if the list length changed, so tests and callers that edit the arrays stay correct.
 function lookup(list,d,slot){if(d[slot]?.size!==list.length)d[slot]=new Map(list.map(r=>[r.full.toLowerCase(),r]));return d[slot]}
 // Search text lives in its own file and is attached to the cached records the first time a text query arrives.

 async function hydrate(d){
  if(!d.index.search||d.textLoaded)return;
  if(!d.hydrating)d.hydrating=(async()=>{
   const byId=lookup(d.index.repositories,d,'byId'),attach=file=>{const ready=file.normalized===true;for(const [id,e] of Object.entries(file.entries||{})){const r=byId.get(id.toLowerCase());if(r){r.searchOverview=ready?e[0]:B.normalize(e[0]);r.searchReadme=ready?e[1]:B.normalize(e[1]);r.searchPrepared=true}}};
   for(const name of [].concat(d.index.search)){
    const file=await read('data/browse/'+name,null);if(file){attach(file);continue}
    // Published text is packaged once as shards. Legacy/local files remain readable.
    if(name==='search-pub.json.gz'){
     const index=await candidates();if(!index||index.version!==d.index.version)fail(503,'runtime_index_missing','Search text must be generated during deployment.');
     const count=Math.ceil(index.ids.length/index.shardSize);
     for(let start=0;start<count;start+=8)await Promise.all(Array.from({length:Math.min(8,count-start)},async(_,i)=>{const shard=await read('data/browse/search-shard-'+(start+i)+'.json.gz');if(shard.version!==d.index.version)fail(503,'runtime_index_mismatch','Search text belongs to another catalogue.');attach({...shard,normalized:true})}));
    }
   }
   d.textLoaded=true;
  })().catch(e=>{d.hydrating=null;throw e});return d.hydrating;
 }
 async function hydrateCandidates(base,settings,q){
  if(base.textLoaded)return null;
  const index=await candidates();if(!index||index.version!==base.index.version||index.controls!==JSON.stringify(settings))return null;
  const positions=candidateIds(index,q);if(!positions?.length)return null; // Empty searches retain the existing wider-query suggestions.
  const shards=[...new Set(positions.map(i=>Math.floor(i/index.shardSize)))],byId=lookup(base.index.repositories,base,'byId');
  await Promise.all(shards.map(async shard=>{if(!textShards.has(shard))textShards.set(shard,(async()=>{const file=await read('data/browse/search-shard-'+shard+'.json.gz');if(file.version!==base.index.version)fail(503,'runtime_index_mismatch','Search shards do not belong to this catalogue; redeploy.');for(const [id,e] of Object.entries(file.entries)){const r=byId.get(id.toLowerCase());if(r){r.searchOverview=e[0];r.searchReadme=e[1];r.searchPrepared=true}}base.textRevision=(base.textRevision||0)+1})().catch(e=>{textShards.delete(shard);throw e}));await textShards.get(shard)}));
  return new Set(positions.map(i=>index.ids[i]));
 }
 // The visible list and its version hash depend only on the saved index, the listing controls and the evidence time; reuse them between requests.
 function view(base,settings,manage,at){const key=JSON.stringify([settings,manage,at,base.index.repositories.length,Boolean(base.textLoaded),base.textRevision||0]);if(base.view?.key===key)return base.view;const repositories=applyListingControls(base.index.repositories,settings).filter(r=>manage||Q.publishedEligible(r,at)),version=visibleVersion(base.index,settings,repositories);return base.view={key,repositories,version}}
 async function detail(id){if(typeof id!=='string'||!(P.validId(id)||id.startsWith('hf:')&&P.validId(id.slice(3))))fail(400,'invalid_id','Use owner/repository or hf:owner/space.');const key=id.toLowerCase();let identity;try{identity=await (identityPending||=(read('data/browse/identities.json').catch(e=>{identityPending=null;throw e})))}catch(e){if(e.code!=='ENOENT'||process.env.VERCEL)throw e}const d=identity?{index:identity}:await dataset(),r=identity?.entries[key]?await readProject(identity.entries[key]):identity?null:lookup(d.index.repositories,d,'byId').get(key);if(!r||!applyListingControls([r],await controls()).length||r.availability==='unavailable')fail(404,'not_found','Project is not available in the saved catalogue.');const repo=identity?r:d.projects?lookup(d.projects,d,'projectById').get(key):await readProject(r.full);const C=require('../dist/community.js'),shown=C.attach(applyListingControls([repo],await controls()),(await community()).mentions)[0];
  // A deep link can open a listing that has not passed the publication checks (never checked, or quarantined after repeated failures).
  // Its public record is shown, but without the demo link and evidence a published listing earns, and it says so.
  const verified=Q.publishedEligible(r,Q.evidenceTime(d.index.snapshots?.catalog));
  return {catalogVersion:d.index.version,repo:verified?shown:{...shown,demo:null,demoHealth:null,screenshots:[],unverified:true}}}
 async function community(){if(!communityPending)communityPending=(async()=>{return await read('data/browse/community.json',{mentions:[]})})().catch(e=>{communityPending=null;throw e});return communityPending}
 function options(input){if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'invalid_query','Invalid browsing request.');const o={q:input.q||'',category:input.category||'',technology:input.technology||'',source:input.source||'all',sort:input.sort||(input.q?'relevance':'popular'),demos:input.demos!==false,storefront:input.storefront===true,seed:input.seed||'',ranks:input.ranks||{},exclude:input.exclude||[],limit:input.limit??48,...input.staged===true?{staged:true,shelfLimit:input.shelfLimit??3,shelfIds:input.shelfIds??null,publicPools:input.publicPools===true}:{}};if(o.staged&&(!Number.isSafeInteger(o.shelfLimit)||o.shelfLimit<1||o.shelfLimit>6||o.shelfIds!==null&&(!Array.isArray(o.shelfIds)||o.shelfIds.length>6||o.shelfIds.some(id=>typeof id!=='string'||! /^[a-zA-Z0-9:_.-]{1,80}$/.test(id)))))fail(400,'invalid_shelves','Choose up to six valid shelves.');if(!['all','github','huggingface'].includes(o.source)||!['relevance','popular','reposhelf','featured','trending','trendshift','releases','stars','forks','newest','updated','name'].includes(o.sort)||!Number.isSafeInteger(o.limit)||o.limit<1||o.limit>48||!Array.isArray(o.exclude)||o.exclude.length>5000||o.exclude.some(id=>typeof id!=='string'||id.length>220)||typeof o.ranks!=='object'||Array.isArray(o.ranks)||Object.values(o.ranks).some(rank=>!['popular','trending'].includes(rank)))fail(400,'invalid_query','Invalid browsing filters.');for(const key of ['q','category','technology','seed'])if(typeof o[key]!=='string'||o[key].length>(key==='q'?500:100))fail(400,'invalid_query','Invalid browsing filters.');if(input.demos!==undefined&&typeof input.demos!=='boolean')fail(400,'invalid_query','Choose whether to show live demos only.');return o}
 async function initialStorefront(o,editorial,settingsPending){
  const [settings,snapshot]=await Promise.all([settingsPending,snapshotPending??=(read('data/browse/storefront.json',null).catch(e=>{snapshotPending=null;throw e}))]);
  if(!matchesStorefrontSnapshot(snapshot,o,editorial,settings))return null;
  const result=snapshotPage(snapshot,o,editorial);let version=snapshot.catalogVersion;
  if(editorial.rows?.some(r=>r.enabled&&r.mode==='reposhelf')){
   const counts=await popularity();version=createHash('sha256').update(version+JSON.stringify(counts)).digest('hex').slice(0,20);
   const shelves=clickShelves(snapshot,o,editorial,counts),ids=[...new Set(Object.values(shelves).flat())];
   const cards=applyListingControls(await Promise.all(ids.map(async id=>compactProject(await readProject(id),Date.parse(snapshot.computedAt)||snapshot.evidenceAt))),settings).map(B.card);
   result.shelves={...result.shelves,...shelves};
   const needed=new Set(Object.values(result.shelves).flat()),all=new Map([...result.shelfItems,...cards].map(r=>[r.full,r]));
   result.shelfItems=[...all.values()].filter(r=>needed.has(r.full)).map(r=>({...r,repoShelfClicks:counts[r.full.toLowerCase()]||0}));
  }
  delete result.nextOffset;
  return {...result,nextCursor:null,catalogVersion:version,snapshots:snapshot.snapshots};
 }
 async function search(input,editorial={rows:[]},{manage=false,settings:prefetched}={}){const o=options(input),settingsPending=prefetched||controls({fresh:o.publicPools===true});
  // The compact build snapshot avoids reading/scanning the catalogue on an initial CDN miss.
  // Current moderation and editorial settings must match before anything can be shared.
  if(o.publicPools&&!manage&&!input.cursor){const initial=await initialStorefront(o,editorial,settingsPending);if(initial)return initial}
  const [base,settings]=await Promise.all([manage?dataset():publicDataset(),settingsPending]),at=Q.evidenceTime(base.index.snapshots?.catalog);o.evidenceAt=at;let matchingIds;if(String(o.q).trim()){if(!manage)matchingIds=await hydrateCandidates(base,settings,o.q);if(!matchingIds)await hydrate(base)}const shown=view(base,settings,manage,at),d={...base,index:{...base.index,repositories:shown.repositories,version:shown.version}};if(o.sort==='reposhelf'||o.storefront&&editorial.rows?.some(r=>r.enabled&&r.mode==='reposhelf')){const counts=await popularity();const signature=JSON.stringify(counts),key=d.index.version+signature+Boolean(base.textLoaded)+(base.textRevision||0);if(weightedView?.key!==key)weightedView={key,repositories:d.index.repositories.map(r=>({...r,repoShelfClicks:counts[r.full.toLowerCase()]||0})),version:createHash('sha256').update(d.index.version+signature).digest('hex').slice(0,20)};d.index.repositories=weightedView.repositories;d.index.version=weightedView.version}const query=createHash('sha256').update(JSON.stringify([o,manage])).digest('hex').slice(0,20);o.offset=0;if(matchingIds)o.candidateIds=matchingIds;if(input.cursor){try{if(typeof input.cursor!=='string'||input.cursor.length>500)throw Error();const c=JSON.parse(Buffer.from(input.cursor,'base64url').toString());if(c.version!==d.index.version)fail(409,'catalog_changed','The catalogue has changed. Search again for current results.');if(c.query!==query||!Number.isSafeInteger(c.offset)||c.offset<0||c.offset>d.index.repositories.length)throw Error();o.offset=c.offset}catch(e){if(e.status===409)throw e;fail(400,'invalid_cursor','This page belongs to a different search.')}}const mentions=o.storefront?(await community()).mentions:[];let result;if(o.publicPools&&o.staged){const poolKey=JSON.stringify([d.index.version,editorial,o.evidenceAt,new Date().toISOString().slice(0,10)]);if(publicPool?.key!==poolKey){const rankings=await(rankingsPending??=read('data/browse/rankings.json',{orders:{}}));const rows=B.select(d.index.repositories,{...o,precomputed:rankings.version===base.index.version?rankings.orders:{},staged:false,shelfIds:null,publicPools:true},editorial,mentions);publicPool={key:poolKey,rows}}result=storefrontPage(publicPool.rows,o,editorial)}else if(!o.storefront){const cacheKey=JSON.stringify([d.index.version,query,Boolean(base.textLoaded)]);const saved=selections.get(cacheKey);if(saved)result=B.page(saved,o.offset,o.limit);else{result=B.select(d.index.repositories,{...o,captureSelection:value=>selections.set(cacheKey,value,value.ranked.length)},editorial,mentions);if(!result.total&&matchingIds){await hydrate(base);delete o.candidateIds;const refreshed=view(base,settings,manage,at);result=B.select(refreshed.repositories,{...o,captureSelection:value=>selections.set(cacheKey,value,value.ranked.length)},editorial,mentions)}}}else result=B.select(d.index.repositories,o,editorial,mentions);const nextCursor=result.nextOffset===null?null:Buffer.from(JSON.stringify({version:d.index.version,query,offset:result.nextOffset})).toString('base64url');delete result.nextOffset;return {...result,nextCursor,catalogVersion:d.index.version,snapshots:d.index.snapshots}}
 // Prepare the candidate dictionary on focus; leave full README text on disk until its shards are needed.
 async function warm(){const [base,index]=await Promise.all([publicDataset(),candidates()]);if(index?.version===base.index.version)base.searchReady=true;else await hydrate(base)}
 return {search,detail,community,dataset,publicDataset,warm,controls};
}
