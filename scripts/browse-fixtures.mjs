// Browser suites exercise the real compact selection code using their existing
// catalogue fixtures. Production never requests these monolithic fixture URLs.
import {createRequire} from 'node:module';
import {createBrowseIndex} from '../lib/browse-index.mjs';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),C=require('../dist/community.js');
export function withBrowseFixtures(legacy){return async route=>{
 const url=new URL(route.request().url());
 if(url.pathname!=='/api/editorial'||!['browse','detail'].includes(url.searchParams.get('action')))return legacy(route);
 async function fixture(path){let data;const u=new URL(path,url.origin);await legacy({request:()=>({url:()=>u.href,method:()=> 'GET'}),fulfill:async value=>{data=value.json},continue:async()=>{},abort:async()=>{}});return data||{}}
 const [catalog,spaces,community,editorial]=await Promise.all([fixture('/catalog.json'),fixture('/spaces.json'),fixture('/community.json'),fixture('/api/editorial')]);
 for(const r of [...catalog.repositories||[],...spaces.repositories||[]]){if(r.demo&&!r.demoHealth)r.demoHealth={url:r.demo,status:'working',checkedAt:new Date().toISOString()};if(r.demo&&!r.screenshots?.length)r.screenshots=[{src:'https://fixture.example/preview.jpg',kind:'demo',url:r.demo,capturedAt:new Date().toISOString()}]}
 const generated=createBrowseIndex(catalog,spaces,community);
 // Generic storefront fixtures represent validated listings, including fallback picks.
 // Dedicated launch tests separately exercise missing/expired evidence.
 for(const r of [...generated.projects,...generated.index.repositories])if(r.demo){r.availability??='available';r.lastCheckedAt??=new Date().toISOString();r.demoHealth??={url:r.demo,status:'working',checkedAt:new Date().toISOString()};if(!r.screenshots?.length)r.screenshots=[{src:'https://fixture.example/preview.jpg',kind:'demo',url:r.demo,capturedAt:new Date().toISOString()}]}
 if(url.searchParams.get('action')==='detail'){const r=generated.projects.find(r=>r.full.toLowerCase()===String(url.searchParams.get('id')).toLowerCase());return route.fulfill(r?{json:{repo:C.attach([r],community.mentions)[0],catalogVersion:generated.index.version}}:{status:404,json:{error:{message:'Project unavailable'}}})}
 const input=route.request().postDataJSON();if(input.cursor)input.offset=Number(input.cursor);
 const result=B.select(generated.index.repositories,input,editorial,community.mentions);
 return route.fulfill({json:{...result,nextCursor:result.nextOffset===null?null:String(result.nextOffset),catalogVersion:generated.index.version,editorial:{...editorial,builtinSetupRequired:editorial.builtinSetupRequired??true}}});
}}
export async function settleBrowse(page){await page.waitForFunction(()=>typeof browsePending==='undefined'||state.view==='collection'||state.remote||!browsePending&&browseSignature===browseKey());}
