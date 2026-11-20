import {dangerouslyDeleteByTag} from '@vercel/functions';
import {invalidateListingControls} from './listing-policy.mjs';
import {createRequire} from 'node:module';
const Q=createRequire(import.meta.url)('../dist/quality.js');
export const STOREFRONT_TAG='reposhelf-public-shelves';
export async function invalidateStorefront({purge=dangerouslyDeleteByTag,enabled=Boolean(process.env.VERCEL),warn=console.warn}={}){invalidateListingControls();if(enabled)try{await purge(STOREFRONT_TAG,{revalidationDeadlineSeconds:0});}catch{warn('Storefront cache purge failed after a saved edit; the public cache may serve the old shelves for up to an hour.');}}
// A public storefront response is shared at the edge for STOREFRONT_MAX_AGE seconds. After that it may be served stale for up to STOREFRONT_REVALIDATE
// more seconds while a fresh copy is built, so an idle site answers from the edge instead of waiting for a cold function. Neither window ever outlasts the
// evidence behind the shelves (the catalogue snapshot's grace period, or each listing's last check), and every saved edit purges the cache by tag.
// The catalogue only changes at the weekly publication (a new deployment starts with an empty CDN cache) or through a saved edit (which purges
// the tag), so shelves can be shared for up to a day. The window also ends at the next UTC midnight, so the daily spotlight rotation and the
// seeded daily shuffle still change on time. Every cache hit is a request that never starts a function (Fluid Active CPU on the free plan).
export const STOREFRONT_MAX_AGE=86400,STOREFRONT_REVALIDATE=3600;
function storefrontWindow(data,now){
 let evidence=Infinity;const snapshot=Date.parse(data.snapshots?.catalog),grace=Q.EVIDENCE_GRACE;
 if(Number.isFinite(snapshot)&&snapshot<=now&&now-snapshot<=grace)evidence=snapshot+grace-now;
 else for(const r of data.shelfItems||[]){evidence=Math.min(evidence,Date.parse(r.lastCheckedAt)+Q.FEATURED_REPOSITORY_DAYS*86400000-now,Date.parse(r.demoHealth?.checkedAt)+Q.FEATURED_DEMO_DAYS*86400000-now)}
 if(evidence===Infinity)return {ttl:5,revalidate:0};// nothing dates this response (an empty or degraded dataset), so it is only briefly shared
 const midnight=new Date(now);midnight.setUTCHours(24,0,0,0);
 const fresh=Math.min(STOREFRONT_MAX_AGE*1000,evidence,midnight.getTime()-now);if(!Number.isFinite(fresh))return {ttl:0,revalidate:0};
 const ttl=Math.max(0,Math.floor(fresh/1000));
 return {ttl,revalidate:ttl?Math.max(0,Math.floor(Math.min(STOREFRONT_REVALIDATE*1000,evidence-ttl*1000)/1000)):0};
}
export function storefrontTTL(data,now=Date.now()){return storefrontWindow(data,now).ttl}
export function storefrontRevalidate(data,now=Date.now()){return storefrontWindow(data,now).revalidate}
export function storefrontResponse(res,data){const {ttl,revalidate}=storefrontWindow(data,Date.now());res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':ttl?'public, max-age=0, s-maxage='+ttl+(revalidate?', stale-while-revalidate='+revalidate:''):'private, no-store','Vercel-Cache-Tag':STOREFRONT_TAG,'X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
// A project's detail record is public and the same for everyone, so it is shared at the edge briefly instead of waking the function for
// every deep link. It carries the storefront tag, so a saved moderation or editorial edit purges it with the shelves.
// A project's details change only at a publication (new deployment, empty cache) or through a moderation edit (purges the tag).
export const DETAIL_MAX_AGE=86400,DETAIL_REVALIDATE=86400;
export function detailResponse(res,data){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=0, s-maxage=${DETAIL_MAX_AGE}, stale-while-revalidate=${DETAIL_REVALIDATE}`,'Vercel-Cache-Tag':STOREFRONT_TAG,'X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
