import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Q=require('../dist/quality.js');
// One demo address can sit behind hundreds of listings (a shared template or a platform home page). Only the best few are shown publicly;
// the rest stay in the catalogue, unpublished, and come back automatically if a listing ahead of them drops out.
export const MAX_LISTINGS_PER_DEMO=3;
export function demoKey(url){
 try{const u=new URL(url);u.hash='';const host=u.hostname.toLowerCase().replace(/^www\./,'');return host+u.pathname.replace(/\/+$/,'').toLowerCase()+u.search}catch{return null}
}
const rank=(a,b)=>(Number(b.stars)||0)-(Number(a.stars)||0)||String(a.full).localeCompare(String(b.full));
export function markDuplicateDemos(projects,now=Date.now(),max=MAX_LISTINGS_PER_DEMO){
 const groups=new Map();
 for(const r of projects){const key=r.demo&&demoKey(r.demo);if(key&&Q.publishedEligible(r,now))(groups.get(key)||groups.set(key,[]).get(key)).push(r)}
 const hidden=new Set();
 for(const group of groups.values())if(group.length>max)for(const r of group.sort(rank).slice(max))hidden.add(r);
 return projects.map(r=>hidden.has(r)?{...r,demoDuplicate:true}:r);
}
