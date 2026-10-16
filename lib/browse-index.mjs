import {createAdminSummary} from './admin-summary.mjs';
import {reclassifyCatalog} from '../scripts/reclassify-catalog.mjs';
import {applyListingControls,savedListingControls,createListingControls} from './listing-policy.mjs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),E=require('../dist/editorial.js'),P=require('../dist/providers.js'),S=require('../dist/storefront.js'),C=require('../dist/community.js'),Q=require('../dist/quality.js'),picks=require('../dist/picks.js');
import {projectKey} from './project-key.mjs';
import {PUBLISHED_INDEX,REST_INDEX,PUBLISHED_SEARCH,REST_SEARCH,splitPublished,mergePublished} from './browse-parts.mjs';
import {gzipSync} from 'node:zlib';
import {buildStorefrontSnapshot} from './storefront-snapshot.mjs';
import {buildSearchCandidates} from './search-candidates.mjs';
import {createAccounts} from './accounts.mjs';
import {loadTerms} from './readme-terms.mjs';
import {sourceRibbonRows} from './editorial-source-ribbon.mjs';
export {projectKey} from './project-key.mjs';
export {PUBLISHED_INDEX,REST_INDEX,PUBLISHED_SEARCH,REST_SEARCH,splitPublished,mergePublished} from './browse-parts.mjs';
// Search metadata lives on the server. No README, evidence quotes or histories
// are included in a card response; only the selected preview and trend summary.
export {compactProject} from './browse-card.mjs';
import {compactProject} from './browse-card.mjs';
export function createBrowseIndex(catalog,spaces,community={},now=Date.now(),controls=[],trendshift={},terms=null){
 const all=new Map(picks.map(r=>[r.full.toLowerCase(),r]));
 for(const r of catalog.repositories||[])if(P.validId(r.full)&&typeof r.name==='string')all.set(r.full.toLowerCase(),r);
 const rawSpaces=(spaces.repositories||[]).filter(r=>P.isSpace(r)&&P.validId(r.spaceId)&&r.full===`hf:${r.spaceId}`&&typeof r.name==='string');
 const listed=trendshift.entries||{},projects=applyListingControls(P.mergeCatalog([...all.values()],rawSpaces),controls).map(r=>{const entry=!P.isSpace(r)&&listed[r.full.toLowerCase()];return entry?{...r,trendshift:{seenAt:entry.seenAt,signal:entry.signal}}:r});
 const snapshots={catalog:catalog.updatedAt||null,spaces:spaces.updatedAt||null,community:community.updatedAt||null,trendshift:trendshift.updatedAt||null};
 const repositories=projects.map(r=>compactProject(r,now,terms));
 // Hash content, not timestamps/counts: same-size edits must invalidate cursors.
 const version=createHash('sha256').update(JSON.stringify([snapshots,repositories])).digest('hex').slice(0,20);
 return {index:{schema:1,version,snapshots,repositories},projects,community};
}
// Search text (README terms, overview paragraphs, concatenated haystack) is about
// three quarters of the index and only text queries read it, so it ships as a
// separate file the server loads on first query. Cold starts and every browse
// without a query then parse a much smaller index.
// Schema 2 holds only [overview, README], both already normalised the way the matcher normalises a query, so a text search never cleans or splits
// them per request. Schema 1 (also the combined text field) is still read: the server normalises it once after loading.
export const SEARCH_FILE='search.json.gz';
export function splitSearchIndex(index){
 const entries={},repositories=index.repositories.map(r=>{const {searchOverview,searchReadme,searchText,...card}=r;entries[r.full]=[B.normalize(searchOverview),B.normalize(searchReadme)];return card});
 return {index:{...index,search:SEARCH_FILE,repositories},search:{schema:2,normalized:true,version:index.version,entries}};
}
export async function generateBrowseIndex(root=new URL('../',import.meta.url)){
 await reclassifyCatalog(root);
 const read=async(path,fallback)=>{try{return JSON.parse(await readFile(new URL(path,root),'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}};
 const [catalog,spaces,community,trendshift]=await Promise.all([read('dist/catalog.json',{repositories:[]}),read('dist/spaces.json',{repositories:[]}),read('dist/community.json',{mentions:[]}),read('dist/trendshift.json',{entries:{},sources:{}})]);
 const accounts=createAccounts();let settings=await savedListingControls(root);
 if(accounts.ready)try{settings=await createListingControls({accounts,root})({fresh:true})}catch{console.warn('Current moderation unavailable during build; runtime will verify controls before snapshot reuse.')}
 const full=createBrowseIndex(catalog,spaces,community,Date.now(),settings,trendshift,loadTerms(new URL('data/',root)));const variants=await read('data/preview-variants.json',{});for(const r of [...full.index.repositories,...full.projects])for(const s of r.screenshots||[])if(variants[s.src])s.variants=variants[s.src];full.index.version=createHash('sha256').update(full.index.version+JSON.stringify(variants)).digest('hex').slice(0,20);const split=splitSearchIndex(full.index),result={...full,index:split.index,search:split.search},base=new URL('data/browse/',root);
 await writeFile(new URL('data/admin-summary.json',root),JSON.stringify(createAdminSummary(full.projects,{version:full.index.version,snapshots:full.index.snapshots,sources:{...community.sources,...Object.fromEntries(Object.entries(trendshift.sources||{}).map(([list,status])=>['trendshift-'+list,status]))}}))+'\n');
 await mkdir(new URL('projects/',base),{recursive:true});
 for(const r of result.projects)await writeFile(new URL(`projects/${projectKey(r.full)}.json`,base),JSON.stringify(r));
 // Remove files for retired IDs so a renamed/deleted project cannot leak stale details.
 const {readdir}=await import('node:fs/promises'),keep=new Set(result.projects.map(r=>projectKey(r.full)+'.json'));
 for(const file of await readdir(new URL('projects/',base)))if(!keep.has(file))await rm(new URL('projects/'+file,base));
 await writeFile(new URL('community.json',base),JSON.stringify(community));
 const eligible=full.index.repositories.filter(r=>Q.publishedEligible(r,Q.evidenceTime(full.index.snapshots.catalog))),categories=['',...new Set(eligible.flatMap(r=>E.categoryNames(r)))],orders={};
 for(const category of categories)orders[category]=B.order(eligible.filter(r=>!category||E.matchesCategory(r,category)),'popular').map(r=>r.full);
 await writeFile(new URL('rankings.json',base),JSON.stringify({version:full.index.version,orders}));
 await writeFile(new URL(SEARCH_FILE,base),gzipSync(JSON.stringify(result.search),{level:9}));
 await rm(new URL('search.json',base),{force:true});
 const indexJson=JSON.stringify(result.index);await writeFile(new URL('index.json',base),indexJson);
 const parts=splitPublished(result.index,result.search);for(const [name,part,searchName] of [[PUBLISHED_INDEX,parts.published,PUBLISHED_SEARCH],[REST_INDEX,parts.rest,REST_SEARCH]]){const json=JSON.stringify(part.index);await writeFile(new URL(name,base),json);await writeFile(new URL(name+'.gz',base),gzipSync(json));await writeFile(new URL(searchName,base),gzipSync(JSON.stringify(part.search),{level:9}))}
 const candidates=buildSearchCandidates(parts.published.index,parts.published.search,settings);
 await writeFile(new URL('search-candidates.json.gz',base),gzipSync(JSON.stringify(candidates)));
 for(let start=0;start<candidates.ids.length;start+=candidates.shardSize){const entries=Object.fromEntries(candidates.ids.slice(start,start+candidates.shardSize).map(id=>[id,parts.published.search.entries[id]]));await writeFile(new URL('search-shard-'+Math.floor(start/candidates.shardSize)+'.json.gz',base),gzipSync(JSON.stringify({version:full.index.version,entries})))}
 let editorial={rows:[],customRows:false};
 if(accounts.ready)try{const [config,rows]=await Promise.all([accounts.request('/rest/v1/editorial_settings?select=custom_rows&id=eq.true'),accounts.request('/rest/v1/editorial_ribbons?select=*&order=position.asc,id.asc')]);editorial={rows:await sourceRibbonRows(accounts,rows),customRows:config[0]?.custom_rows||false,builtinSetupRequired:!rows.some(r=>r.builtin_key)}}catch{console.warn('Storefront snapshot uses defaults; runtime checks current shelf settings before reuse.')}
 await writeFile(new URL('storefront.json',base),JSON.stringify(buildStorefrontSnapshot(parts.published.index,editorial,community.mentions||[],settings)));
 console.log(`Browsing index: ${result.projects.length} projects (${parts.published.index.repositories.length} published), ${Buffer.byteLength(indexJson)} bytes of card metadata plus ${Buffer.byteLength(JSON.stringify(result.search))} bytes of search text loaded on first query; project details stored separately.`);
 return result;
}

