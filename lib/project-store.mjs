import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createAccounts,fail} from './accounts.mjs';
import {applyListingControls,createListingControls,validListing} from './listing-policy.mjs';
const Q=createRequire(import.meta.url)('../dist/quality.js');
// A generated projection, never a fallback to parsing the upstream catalogue.
export function createProjectStore({root=new URL('../',import.meta.url),identity=false,controls=createListingControls({root,accounts:createAccounts()})}={}){
 let pending;
 async function dataset(){if(!pending)pending=readFile(new URL(identity?'data/runtime/identities.json':'data/runtime/projects.json',root),'utf8').then(JSON.parse).catch(e=>{pending=null;if(e.code==='ENOENT')fail(503,'runtime_index_missing','Project metadata must be generated during the build.');throw e});return pending}
 return {async project({id}){if(!validListing(id))fail(400,'invalid_id','Use owner/repository or hf:owner/space.');const d=await dataset(),entry=d.entries[id.toLowerCase()],r=entry&&applyListingControls([entry],await controls())[0];if(!r||r.availability==='unavailable')fail(404,'not_found','Project is not available in the saved catalogue.');return {catalogVersion:d.version,project:{id:r.full,name:r.name,description:typeof r.description==='string'?r.description.slice(0,1000):null,category:r.category,language:r.language||null,demo:r.demo?{url:r.demo,usable:Q.hasLiveDemo(r)}:null,demoHealth:Q.demoState(r),repositoryAvailability:{status:r.availability||'available',checkedAt:r.lastCheckedAt||null}}}},dataset};
}
