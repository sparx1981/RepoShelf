import {dangerouslyDeleteByTag} from '@vercel/functions';
import {invalidateListingControls} from './listing-policy.mjs';
export const STOREFRONT_TAG='reposhelf-public-shelves';
export async function invalidateStorefront({purge=dangerouslyDeleteByTag,enabled=Boolean(process.env.VERCEL),warn=console.warn}={}){invalidateListingControls();if(enabled)try{await purge(STOREFRONT_TAG,{revalidationDeadlineSeconds:0});}catch{warn('Storefront cache purge failed after a saved edit; public cache expires within five seconds.');}}
export function storefrontTTL(data,now=Date.now()){
 let remaining=5000;const snapshot=Date.parse(data.snapshots?.catalog),grace=72*3600000;
 if(Number.isFinite(snapshot)&&snapshot<=now&&now-snapshot<=grace)remaining=Math.min(remaining,snapshot+grace-now);
 else for(const r of data.shelfItems||[]){remaining=Math.min(remaining,Date.parse(r.lastCheckedAt)+2*86400000-now,Date.parse(r.demoHealth?.checkedAt)+7*86400000-now)}
 return Number.isFinite(remaining)?Math.max(0,Math.floor(remaining/1000)):0;
}
export function storefrontResponse(res,data){const ttl=storefrontTTL(data);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':ttl?'public, max-age=0, s-maxage='+ttl:'private, no-store','Vercel-Cache-Tag':STOREFRONT_TAG,'X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
