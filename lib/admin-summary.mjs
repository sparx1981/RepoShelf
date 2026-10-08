import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {popularityGrowth,growthSorts} from './popularity-growth.mjs';
const require=createRequire(import.meta.url),Q=require('../dist/quality.js'),T=require('../dist/taxonomy.js'),S=require('../dist/storefront.js');
export function createAdminSummary(projects,{version,snapshots,now=Date.now(),sources={}}={}){
 const at=Q.evidenceTime(snapshots?.catalog,now),available=projects.filter(r=>Q.publishedEligible(r,at));
 const coverage={name:'RepoShelf',version:'1',catalogVersion:version,snapshots,processingProjects:projects.filter(r=>r.availability!=='unavailable').length,availableProjects:available.length,withDemo:available.filter(Q.hasLiveDemo).length,readmesSaved:available.filter(r=>r.readmeSnapshot?.status==='saved').length,supportingContextsSaved:available.filter(r=>r.agentContext).length,sourceStatus:sources,categories:[...new Set(available.flatMap(T.names))].sort(),subjects:[...new Set(available.flatMap(r=>r.subjects||[]))].sort(),platforms:[...new Set(available.flatMap(r=>r.platforms||[]))].sort(),technologies:S.channels,defaultDemosOnly:true};
 return {schema:1,generatedAt:new Date(now).toISOString(),catalogVersion:version,snapshots,coverage,rankings:Object.fromEntries(growthSorts.map(sort=>[sort,{...popularityGrowth(projects,{now,sort,limit:50}),catalogVersion:version,catalogUpdatedAt:snapshots?.catalog}]))};
}
export function createAdminSummaryStore({root=new URL('../',import.meta.url),checkpoint,now=Date.now}={}){
 let saved,pending,expires=0;
 return {async read(){if(pending)return pending;if(expires>now())return saved;
  pending=(async()=>{let local;try{local=JSON.parse(await readFile(new URL('data/admin-summary.json',root),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
   const remote=await checkpoint?.json('data/admin-summary.json',2000);
   const candidates=[local,remote].filter(r=>r?.schema===1&&r.coverage&&growthSorts.every(sort=>Array.isArray(r.rankings?.[sort]?.items))&&Number.isFinite(Date.parse(r.generatedAt))).sort((a,b)=>Date.parse(b.generatedAt)-Date.parse(a.generatedAt));saved=candidates[0]||null;expires=now()+120000;return saved;
  })();try{return await pending}finally{pending=null}
 }};
}
export function summaryRanking(summary,{sort='trending',limit=20}={}){
 const ranking=summary?.rankings?.[sort];return ranking?{...ranking,limit,items:ranking.items.slice(0,limit)}:null;
}
