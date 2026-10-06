import {reclassifyCatalog} from '../scripts/reclassify-catalog.mjs';
import {applyListingControls,savedListingControls} from './listing-policy.mjs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const require=createRequire(import.meta.url),P=require('../dist/providers.js'),S=require('../dist/storefront.js'),C=require('../dist/community.js'),Q=require('../dist/quality.js'),picks=require('../dist/picks.js');
export const projectKey=id=>createHash('sha256').update(id.toLowerCase()).digest('hex');
// Search metadata lives on the server. No README, evidence quotes or histories
// are included in a card response; only the selected preview and trend summary.
export function compactProject(r,now=Date.now()){
 const keys=['full','name','description','authorDescription','editorialDescription','source','spaceId','githubFull','category','subjects','platforms','classification','language','demo','demoSource','availability','stars','forks','likes','created','updated','license','runtime','color','ink','symbol','lastCheckedAt','releaseCheckedAt','spaces'];
 const out=Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
 out.catalogueState=Q.catalogueState(r,now);
 out.description=String(out.description||'').slice(0,1000);
 out.technologies=S.technologies(r);out.topics=(r.topics||[]).slice(0,40);
 out.screenshots=S.images(r).slice(0,1).map(({src,kind,url,capturedAt})=>({src,kind,url,capturedAt}));
 if(r.demoHealth)out.demoHealth={url:r.demoHealth.url,status:r.demoHealth.status,checkedAt:r.demoHealth.checkedAt,attemptedAt:r.demoHealth.attemptedAt,nextCheckAt:r.demoHealth.nextCheckAt,consecutiveTemporaryFailures:r.demoHealth.consecutiveTemporaryFailures,...(r.demoHealth.error?{error:{reason:r.demoHealth.error.reason}}:{})};
 if(r.previewCheck)out.previewCheck={url:r.previewCheck.url,attemptedAt:r.previewCheck.attemptedAt,nextCheckAt:r.previewCheck.nextCheckAt,consecutiveFailures:r.previewCheck.consecutiveFailures,status:r.previewCheck.status,reason:r.previewCheck.reason};
 if(r.previewAttemptAt)out.previewAttemptAt=r.previewAttemptAt;
 if(r.latestRelease)out.latestRelease={tag:r.latestRelease.tag,name:r.latestRelease.name,publishedAt:r.latestRelease.publishedAt,url:r.latestRelease.url};
 out.trendSummary=S.trend(r,now);out.trendComputedAt=new Date(now).toISOString();
 out.searchOverview=(r.overview?.paragraphs||[]).join(' ').slice(0,6000);
 out.searchReadme=(r.readmeSnapshot?.searchTerms||[]).join(' ').slice(0,12000);
 out.searchText=[r.full,r.name,r.description,r.category,...(r.subjects||[]),r.language,...out.technologies,...out.topics,...(r.overview?.paragraphs||[]),(r.readmeSnapshot?.searchTerms||[]).join(' ')].join(' ').toLowerCase().slice(0,12000);
 return out;
}
export function createBrowseIndex(catalog,spaces,community={},now=Date.now(),controls=[]){
 const all=new Map(picks.map(r=>[r.full.toLowerCase(),r]));
 for(const r of catalog.repositories||[])if(P.validId(r.full)&&typeof r.name==='string')all.set(r.full.toLowerCase(),r);
 const rawSpaces=(spaces.repositories||[]).filter(r=>P.isSpace(r)&&P.validId(r.spaceId)&&r.full===`hf:${r.spaceId}`&&typeof r.name==='string');
 const projects=applyListingControls(P.mergeCatalog([...all.values()],rawSpaces),controls);
 const snapshots={catalog:catalog.updatedAt||null,spaces:spaces.updatedAt||null,community:community.updatedAt||null};
 const repositories=projects.map(r=>compactProject(r,now));
 // Hash content, not timestamps/counts: same-size edits must invalidate cursors.
 const version=createHash('sha256').update(JSON.stringify([snapshots,repositories])).digest('hex').slice(0,20);
 return {index:{schema:1,version,snapshots,repositories},projects,community};
}
export async function generateBrowseIndex(root=new URL('../',import.meta.url)){
 await reclassifyCatalog(root);
 const read=async(path,fallback)=>{try{return JSON.parse(await readFile(new URL(path,root),'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}};
 const [catalog,spaces,community]=await Promise.all([read('dist/catalog.json',{repositories:[]}),read('dist/spaces.json',{repositories:[]}),read('dist/community.json',{mentions:[]})]);
 const result=createBrowseIndex(catalog,spaces,community,Date.now(),await savedListingControls(root)),base=new URL('data/browse/',root);
 await mkdir(new URL('projects/',base),{recursive:true});
 for(const r of result.projects)await writeFile(new URL(`projects/${projectKey(r.full)}.json`,base),JSON.stringify(r));
 // Remove files for retired IDs so a renamed/deleted project cannot leak stale details.
 const {readdir}=await import('node:fs/promises'),keep=new Set(result.projects.map(r=>projectKey(r.full)+'.json'));
 for(const file of await readdir(new URL('projects/',base)))if(!keep.has(file))await rm(new URL('projects/'+file,base));
 await writeFile(new URL('community.json',base),JSON.stringify(community));
 await writeFile(new URL('index.json',base),JSON.stringify(result.index));
 console.log(`Browsing index: ${result.projects.length} projects, ${Buffer.byteLength(JSON.stringify(result.index))} bytes of server search metadata; project details stored separately.`);
 return result;
}
