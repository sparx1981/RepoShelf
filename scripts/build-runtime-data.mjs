import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {projectKey} from '../lib/project-key.mjs';
const require=createRequire(import.meta.url),P=require('../dist/providers.js');
export async function generateRuntimeData(root=new URL('../',import.meta.url),generated){
 const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
 const [catalog,spaces,index]=await Promise.all([read('dist/catalog.json'),read('dist/spaces.json'),read('data/browse/index.json')]);
 const raw=[...(catalog.repositories||[]),...(spaces.repositories||[])],merged=P.mergeCatalog(catalog.repositories||[],spaces.repositories||[]),entries={};
 for(const r of [...raw,...merged]){const keys=['full','name','description','authorDescription','editorialDescription','category','subjects','platforms','classification','language','demo','availability','lastCheckedAt','source','spaceId','githubFull','demoHealth'];entries[r.full.toLowerCase()]=Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,k==='classification'?{version:r.classification.version}:k==='demoHealth'?{url:r.demoHealth.url,status:r.demoHealth.status,checkedAt:r.demoHealth.checkedAt}:r[k]]));}
 await mkdir(new URL('data/runtime/',root),{recursive:true});
 await writeFile(new URL('data/runtime/catalog.json.gz',root),gzipSync(JSON.stringify(catalog)));
 await writeFile(new URL('data/runtime/spaces.json.gz',root),gzipSync(JSON.stringify(spaces)));
 await mkdir(new URL('data/runtime/browse-projects/',root),{recursive:true});
 const projects=generated?.projects||await Promise.all((await readdir(new URL('data/browse/projects/',root))).filter(n=>n.endsWith('.json')).map(n=>read('data/browse/projects/'+n)));
 let position=0;await Promise.all(Array.from({length:8},async()=>{while(position<projects.length){const r=projects[position++];await writeFile(new URL('data/runtime/browse-projects/'+projectKey(r.full)+'.json.gz',root),gzipSync(JSON.stringify(r),{level:6}))}}));

 await writeFile(new URL('data/runtime/projects.json',root),JSON.stringify({schema:1,version:index.version,snapshots:index.snapshots,entries}));
 await writeFile(new URL('data/runtime/identities.json',root),JSON.stringify({schema:1,version:index.version,entries:Object.fromEntries(Object.values(entries).map(r=>[r.full.toLowerCase(),{full:r.full,availability:r.availability}]))}));
 await writeFile(new URL('data/browse/identities.json',root),JSON.stringify({schema:1,version:index.version,snapshots:index.snapshots,entries:Object.fromEntries(index.repositories.map(r=>[r.full.toLowerCase(),r.full]))}));
 const names=(await readdir(new URL('data/sync-runs/',root))).filter(n=>/^\d+\.json$/.test(n)),reports=[];
 for(const name of names)reports.push(await read('data/sync-runs/'+name));
 // Preserve every field and every report in one compact parse. No per-request file fan-out.
 await writeFile(new URL('data/runtime/sync-runs.json',root),JSON.stringify(reports.sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt))));
 const latest=reports.filter(r=>r.status==='success').sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt))[0],before=latest?.work?.coverageBefore?.publication?.published,after=latest?.work?.coverageAfter?.publication?.published;
 await writeFile(new URL('data/runtime/overview.json',root),JSON.stringify({lastSyncAt:latest?.recordedAt||null,lastSyncGrowth:Number.isFinite(before)&&Number.isFinite(after)?after-before:null}));
 console.log(`Runtime project metadata: ${Object.keys(entries).length} identities; ${reports.length} sync reports indexed.`);
}
