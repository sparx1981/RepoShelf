import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {applyListingControls} from './listing-policy.mjs';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),E=require('../dist/editorial.js'),Q=require('../dist/quality.js');
const dynamicModes=new Set(['trending','trendshift','releases','community']);
const visibleRows=editorial=>E.resolve(editorial.rows,editorial.builtinSetupRequired!==false).filter(r=>E.visible(r,editorial.customRows));
function wantedRows(o,editorial){const rows=visibleRows(editorial),ids=new Set(o.shelfIds||[...rows.filter(r=>r.builtin_key==='hero'),...rows.filter(r=>r.builtin_key!=='hero').slice(0,o.shelfLimit)].map(r=>r.id));return rows.filter(r=>ids.has(r.id))}
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,20);
export const editorialSignature=editorial=>JSON.stringify({rows:editorial.rows||[],customRows:editorial.customRows===true,builtinSetupRequired:editorial.builtinSetupRequired!==false});
export function visibleVersion(index,settings,repositories){return hash(hash(index.version+JSON.stringify(settings))+JSON.stringify(repositories.map(r=>r.full)))}
export function buildStorefrontSnapshot(index,editorial,mentions,settings){
 const at=Q.evidenceTime(index.snapshots?.catalog),repositories=applyListingControls(index.repositories,settings).filter(r=>Q.publishedEligible(r,at));
 const rows=B.select(repositories,{q:'',category:'All projects',technology:'All technologies',source:'all',sort:'popular',demos:true,storefront:true,seed:'',ranks:{},exclude:[],limit:48,publicPools:true,evidenceAt:at},editorial,mentions);
 const discussed=new Set(mentions.map(p=>p.full.toLowerCase())),dynamicRepositories=repositories.filter(r=>r.trendSummary?.score>0||r.trendshift?.signal>0||r.latestRelease?.publishedAt||discussed.has(r.full.toLowerCase()));
 const clickMembership=Object.fromEntries(repositories.map(r=>[r.full,E.categoryNames(r).map(c=>c.toLowerCase())]));
 return {schema:1,editorial:editorialSignature(editorial),controls:JSON.stringify(settings),evidenceAt:at,computedAt:index.repositories[0]?.trendComputedAt,catalogVersion:visibleVersion(index,settings,repositories),snapshots:index.snapshots,rows:{...rows,items:[],nextOffset:null},dynamicRepositories,mentions,clickMembership};
}
export function matchesStorefrontSnapshot(snapshot,o,editorial,settings,now=Date.now()){
 return snapshot?.schema===1&&o.publicPools===true&&o.staged===true&&o.storefront&&!String(o.q).trim()&&o.category==='All projects'&&o.technology==='All technologies'&&o.source==='all'&&o.sort==='popular'&&o.demos&&!o.exclude.length&&!Object.keys(o.ranks).length&&snapshot.editorial===editorialSignature(editorial)&&snapshot.controls===JSON.stringify(settings)&&snapshot.evidenceAt===Q.evidenceTime(snapshot.snapshots?.catalog,now)&&!wantedRows(o,editorial).some(r=>['daily','random'].includes(r.mode));
}
export function clickShelves(snapshot,o,editorial,counts){
 const ranked=Object.keys(snapshot.clickMembership).filter(id=>counts[id.toLowerCase()]>0).sort((a,b)=>counts[b.toLowerCase()]-counts[a.toLowerCase()]||a.localeCompare(b));
 return Object.fromEntries(wantedRows(o,editorial).filter(r=>r.mode==='reposhelf').map(row=>[row.id,ranked.filter(id=>!row.category||['all','all projects'].includes(row.category.toLowerCase())||snapshot.clickMembership[id].includes(row.category.toLowerCase())).slice(0,12)]));
}
export function snapshotPage(snapshot,o,editorial){
 const result=storefrontPage(snapshot.rows,o,editorial),dynamic=wantedRows(o,editorial).filter(r=>dynamicModes.has(r.mode));
 if(dynamic.length){const current=B.select(snapshot.dynamicRepositories,{...o,evidenceAt:snapshot.evidenceAt,shelfIds:dynamic.map(r=>r.id)},{rows:dynamic,customRows:editorial.customRows,builtinSetupRequired:false},snapshot.mentions);result.shelves={...result.shelves,...current.shelves};const needed=new Set(Object.values(result.shelves).flat()),cards=new Map([...result.shelfItems,...current.shelfItems].map(r=>[r.full,r]));result.shelfItems=[...cards.values()].filter(r=>needed.has(r.full));}
 return result;
}
// Both the build snapshot and the runtime fallback use this slicing operation.
export function storefrontPage(all,o,editorial){
 const shelfRows=E.resolve(editorial.rows,editorial.builtinSetupRequired!==false).filter(r=>E.visible(r,editorial.customRows));
 const wanted=new Set(o.shelfIds||[...shelfRows.filter(r=>r.builtin_key==='hero'),...shelfRows.filter(r=>r.builtin_key!=='hero').slice(0,o.shelfLimit)].map(r=>r.id));
 const shelves=Object.fromEntries(Object.entries(all.shelves).filter(([id])=>wanted.has(id))),ids=new Set(Object.values(shelves).flat());
 return {...all,items:[],nextOffset:null,shelves,shelfItems:all.shelfItems.filter(r=>ids.has(r.full)),shelfRows,publicPools:true,privateShelves:shelfRows.filter(r=>r.mode==='random').map(r=>r.id)};
}
