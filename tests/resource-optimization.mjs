import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createProjectStore} from '../lib/project-store.mjs';
import {createCatalogService} from '../lib/catalog-service.mjs';
import {createBrowseService} from '../lib/browse-service.mjs';
import {generateBrowseIndex} from '../lib/browse-index.mjs';
import {generateRuntimeData} from '../scripts/build-runtime-data.mjs';
import {storefrontTTL,storefrontResponse} from '../lib/storefront-cache.mjs';
import {createListingControls} from '../lib/listing-policy.mjs';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),E=require('../dist/editorial.js'),Q=require('../dist/quality.js');
const now=Date.now(),date=new Date(now).toISOString(),projects=Array.from({length:160},(_,i)=>({full:'team/app-'+i,name:'Application '+i,description:'A useful interactive application',category:i%2?'Design':'Productivity',language:'JavaScript',stars:1000-i,forks:i,topics:['react'],availability:'available',lastCheckedAt:date,demo:'https://example.org/app/'+i,demoHealth:{url:'https://example.org/app/'+i,status:'working',checkedAt:date},screenshots:[{src:'https://example.org/screen.jpg',kind:'demo',url:'https://example.org/app/'+i}]}));
assert.equal(storefrontTTL({snapshots:{catalog:date}},now),5);
assert.equal(storefrontTTL({snapshots:{catalog:new Date(now-72*3600000+2100).toISOString()}},now),2);
assert.equal(storefrontTTL({shelfItems:[{lastCheckedAt:new Date(now-2*86400000+900).toISOString(),demoHealth:{checkedAt:date}}]},now),0);
let headers;storefrontResponse({writeHead:(status,value)=>{assert.equal(status,200);headers=value},end:()=>{}},{snapshots:{catalog:date}});assert(headers['Cache-Control'].includes('s-maxage='));assert(!headers['Cache-Control'].includes('stale-while-revalidate'));
const rows=E.defaults().map((r,i)=>({...r,shuffle:i%2?'load':'daily'}));rows.unshift({id:'random-row',title:'Random',items:[],mode:'random',enabled:true});const editorial={rows,customRows:true};
const options={q:'',category:'All projects',technology:'All technologies',source:'all',sort:'popular',demos:true,storefront:true,seed:'visitor-session',ranks:{},exclude:[],limit:48,evidenceAt:now};
const full=B.select(projects,options,editorial),staged=B.select(projects,{...options,staged:true,shelfLimit:3},editorial),shared=B.select(projects,{...options,seed:'',staged:true,shelfLimit:3,publicPools:true},editorial);
for(const [id,ids] of Object.entries(staged.shelves))assert.deepEqual(ids,full.shelves[id],'Staging preserves exact row ordering');
for(const [id,ids] of Object.entries(shared.shelves)){const row=E.resolve(rows).find(r=>r.id===id);const items=ids.map(full=>projects.find(r=>r.full===full)),n=shared.publicShuffleCounts?.[id]??items.length;const restored=[...E.arrange(items.slice(0,n),row,{seed:options.seed,manual:row.mode==='manual'}),...items.slice(n)].slice(0,row.builtin_key==='hero'?5:row.mode==='manual'?120:12).map(r=>r.full);assert.deepEqual(restored,full.shelves[id],'Shared pools preserve each session shuffle');}
assert(staged.shelfItems.length<full.shelfItems.length);assert.equal(staged.items.length,0);assert(shared.privateShelves.includes('random-row'));assert(!Object.hasOwn(shared.shelves,'random-row'));assert.deepEqual(B.select(projects,{...options,staged:true,shelfIds:['random-row'],shelfLimit:3},editorial).shelves['random-row'],full.shelves['random-row']);
const dir=await mkdtemp(tmpdir()+'/reposhelf-resource-'),root=pathToFileURL(dir+'/');try{
 await mkdir(new URL('dist/',root));await mkdir(new URL('data/sync-runs/',root),{recursive:true});for(const [name,data] of Object.entries({'catalog.json':{updatedAt:date,repositories:projects},'spaces.json':{repositories:[{...projects[0],full:'hf:team/linked',spaceId:'team/linked',source:'huggingface',githubFull:projects[0].full}]},'community.json':{mentions:[]}}))await writeFile(new URL('dist/'+name,root),JSON.stringify(data));
 await generateBrowseIndex(root);await generateRuntimeData(root);const controls=async()=>[],store=createProjectStore({root,controls}),identities=createProjectStore({root,controls,identity:true});assert.equal((await store.project({id:'TEAM/APP-1'})).project.id,'team/app-1');assert.equal((await identities.project({id:'hf:team/linked'})).project.id,'hf:team/linked');
 const complete=createCatalogService({root,controls});for(const id of ['team/app-0','team/app-1','team/app-159','hf:team/linked']){const original=(await complete.project({id})).project,projected=(await store.project({id})).project;for(const key of ['id','name','description','category','language'])assert.deepEqual(projected[key],original[key],'Metadata retains original '+key);assert.equal(projected.demo?.url,original.demo?.url);assert.equal(projected.demo?.usable,original.demo?.usable);assert.equal(projected.demoHealth?.status,original.demoHealth?.status)}
 // The projection must work after the original catalogues have been removed from a packaged function.
 await rm(new URL('dist/catalog.json',root));await rm(new URL('dist/spaces.json',root));assert.equal((await store.project({id:'team/app-2'})).project.demo.url,projects[2].demo);
 const hidden=createProjectStore({root,controls:async()=>[{project_id:'team/app-1',visibility:'hidden'}]});await assert.rejects(hidden.project({id:'TEAM/APP-1'}),e=>e.status===404);await assert.rejects(store.project({id:'bad'}),e=>e.status===400);await assert.rejects(store.project({id:'team/missing'}),e=>e.status===404);
 const browse=createBrowseService({root,controls}),detail=await browse.detail('TEAM/APP-1');assert.equal(detail.repo.full,'team/app-1');assert.equal(detail.repo.demo,projects[1].demo);assert(Q.publishedEligible(detail.repo,now));
 const response=await browse.search({...options,seed:'',staged:true,publicPools:true},editorial);assert(response.shelfRows.length>3);assert(response.shelfItems.length<160);await assert.rejects(browse.search({...options,staged:true,shelfIds:Array(7).fill('x')},editorial),e=>e.status===400);
}finally{await rm(dir,{recursive:true,force:true})}
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));assert.equal(Object.keys(config.functions).length,11);assert(config.functions['api/analytics.mjs'].includeFiles.includes('identities'));assert(!config.functions['api/auth.mjs'].includeFiles.includes('browse'));assert(config.rewrites.some(r=>r.source==='/api/mcp'&&r.destination==='/api/agent?protocol=mcp'));
let controlsRows=[],controlsFailure=false;const freshControls=createListingControls({accounts:{ready:true,request:async()=>{if(controlsFailure)throw Error('Database unavailable');return controlsRows}}});await freshControls();controlsRows=[{project_id:'team/app-1',visibility:'hidden'}];assert.deepEqual(await freshControls({fresh:true}),controlsRows,'A public CDN miss checks current moderation even in another warm instance');controlsFailure=true;await assert.rejects(freshControls({fresh:true}),/Database unavailable/,'A shared cache never extends an outdated moderation fallback');
console.log('PASS: exact staged and session-shuffled rows, private random selection, isolated metadata, raw Space identities, moderation, rich details, bounded shelf requests and selective packaging.');
