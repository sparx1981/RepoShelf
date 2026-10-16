import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import {createAccounts,fail} from './accounts.mjs';
import {applyListingControls,createListingControls,validListing} from './listing-policy.mjs';
const Q=createRequire(import.meta.url)('../dist/quality.js');
// A generated projection, never a fallback to parsing the upstream catalogue. The saved index leaves out the demo url a health
// record repeats (see runtimeEntry in scripts/build-runtime-data.mjs); it is put back here so demoState() sees the usual shape.
function restore(data){for(const entry of Object.values(data.entries))if(entry.demoHealth&&entry.demoHealth.url===undefined)entry.demoHealth.url=entry.demo;return data}
export function createProjectStore({root=new URL('../',import.meta.url),identity=false,controls=createListingControls({root,accounts:createAccounts()})}={}){
 let pending;
 async function dataset(){if(!pending)pending=(identity?readFile(new URL('data/runtime/identities.json',root),'utf8').then(JSON.parse):readFile(new URL('data/runtime/projects.json.gz',root)).then(bytes=>restore(JSON.parse(gunzipSync(bytes))))).catch(e=>{pending=null;if(e.code==='ENOENT')fail(503,'runtime_index_missing','Project metadata must be generated during the build.');throw e});return pending}
 return {async project({id}){if(!validListing(id))fail(400,'invalid_id','Use owner/repository or hf:owner/space.');const d=await dataset(),entry=d.entries[id.toLowerCase()],r=entry&&applyListingControls([entry],await controls())[0];if(!r||r.availability==='unavailable')fail(404,'not_found','Project is not available in the saved catalogue.');return {catalogVersion:d.version,project:{id:r.full,name:r.name,description:typeof r.description==='string'?r.description.slice(0,1000):null,category:r.category,language:r.language||null,demo:r.demo?{url:r.demo,usable:Q.hasLiveDemo(r)}:null,demoHealth:Q.demoState(r),repositoryAvailability:{status:r.availability||'available',checkedAt:r.lastCheckedAt||null}}}},dataset};
}
