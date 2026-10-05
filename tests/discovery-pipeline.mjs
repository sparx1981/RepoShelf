import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const root=await mkdtemp(path.join(tmpdir(),'reposhelf-discovery-')),fetcher=globalThis.fetch,original=Object.fromEntries(['CATALOG_BATCH_SIZE','CATALOG_SEARCH_QUERIES'].map(k=>[k,process.env[k]]));
try{
 for(const dir of ['dist','scripts','lib'])await mkdir(path.join(root,dir));
 for(const file of ['lib/listing-policy.mjs','scripts/index-catalog.mjs','scripts/discovery-search.mjs','scripts/sync-metrics.mjs','scripts/catalog-health.mjs','scripts/readme-overviews.mjs','scripts/agent-snapshots.mjs','scripts/project-insights.mjs','dist/discovery.js','dist/storefront.js'])await copyFile(new URL('../'+file,import.meta.url),path.join(root,file));
 const at=new Date(Date.now()-3600000).toISOString(),prior={full:'owner/cached',name:'cached',demo:'https://demo.org/',availability:'available',stars:10,updated:at,lastCheckedAt:at,lastAvailableAt:at};
 await writeFile(path.join(root,'dist/catalog.json'),JSON.stringify({repositories:[prior]}));await writeFile(path.join(root,'.catalog-cache.json'),JSON.stringify({'owner/cached':{parserVersion:2,updated:at,checked:Date.now(),demo:prior.demo}}));
 process.env.CATALOG_BATCH_SIZE='5';process.env.CATALOG_SEARCH_QUERIES='1';let blocked=false,searches=0;
 globalThis.fetch=async (url,options)=>{
  if(url.endsWith('/repos/owner/cached')){assert.equal(options.headers['If-None-Match'],'cached-etag');return new Response(null,{status:304})}
  if(url.endsWith('/rate_limit'))return Response.json({resources:{core:{remaining:1000}}});
  if(url.includes('/search/repositories')){searches++;return blocked?new Response('{}',{status:403,headers:{'x-ratelimit-remaining':'10','retry-after':'120'}}):Response.json({total_count:1,items:[{full_name:prior.full,name:prior.name,private:false,default_branch:'main',pushed_at:at,stargazers_count:10}]});}
  throw Error('Unexpected network request: '+url);
 };
 const url=pathToFileURL(path.join(root,'scripts/index-catalog.mjs'));
 await import(url+'?pass=1');let result=JSON.parse(await readFile(path.join(root,'dist/catalog.json'),'utf8'));assert.deepEqual(result.repositories,[prior],'Unchanged fresh cache hits do not manufacture record updates');
 blocked=true;await import(url+'?pass=2');const state=JSON.parse(await readFile(path.join(root,'data/discovery-search.json'),'utf8'));assert.equal(state.cooldown.reason,'secondary_rate_limit');assert(Date.parse(state.nextAllowedAt)>Date.now());
 await import(url+'?pass=3');assert.equal(searches,2,'Later workflows honour the durable search cooldown');result=JSON.parse(await readFile(path.join(root,'dist/catalog.json'),'utf8'));assert.deepEqual(result.repositories,[prior]);
 const conditioned={...prior,forks:3,lastCheckedAt:new Date(Date.now()-49*3600000).toISOString(),repositoryEtag:'cached-etag',repositoryEtagFor:prior.full};await writeFile(path.join(root,'dist/catalog.json'),JSON.stringify({repositories:[conditioned]}));await import(url+'?pass=4');result=JSON.parse(await readFile(path.join(root,'dist/catalog.json'),'utf8'));assert(result.repositories[0].metrics.some(p=>p.stars===10&&p.forks===3),'304 revalidation still records a current unchanged popularity observation');
 console.log('PASS: real discovery pipeline preserves cached records and persists/honours throttling across runs.');
}finally{globalThis.fetch=fetcher;for(const [k,v] of Object.entries(original))if(v===undefined)delete process.env[k];else process.env[k]=v;await rm(root,{recursive:true,force:true})}
