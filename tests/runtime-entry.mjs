import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import {gzipSync} from 'node:zlib';
import {runtimeEntry} from '../scripts/build-runtime-data.mjs';
import {createProjectStore} from '../lib/project-store.mjs';
// The runtime project index is small on purpose (it is bundled into the collection and promotion functions, which have a
// 30 MB budget) but a project must read back exactly as it did from the full index.
const at='2026-10-10T00:00:00.000Z',demo='https://demo.pages.dev/app';
const repos=[
 {full:'team/app',name:'App',description:'x'.repeat(5000),authorDescription:'long author text',subjects:['A','B'],platforms:['Web'],classification:{version:4,subjects:['A']},category:'Design',language:'Rust',demo,availability:'available',lastCheckedAt:at,demoHealth:{url:demo,status:'working',checkedAt:at,consecutiveTemporaryFailures:0,history:['a','b']},source:'github',githubFull:'team/app',screenshots:[{kind:'demo',src:'previews/aaaaaaaaaaaaaaaaaaaaaaaa.jpg'}]},
 {full:'team/moved',name:'Moved',description:'Moved demo',category:'Tools',demo:'https://new.pages.dev/',availability:'available',lastCheckedAt:at,demoHealth:{url:'https://old.pages.dev/',status:'unavailable',checkedAt:at}},
 {full:'team/gone',name:'Gone',description:'Gone',category:'Tools',demo,availability:'unavailable',lastCheckedAt:at,demoHealth:{url:demo,status:'unavailable',checkedAt:at}},
 {full:'hf:team/space',name:'Space',description:null,category:'Design',demo:'https://team-space.hf.space/',lastCheckedAt:at}];
const slim=repos.map(runtimeEntry);
assert.equal(slim[0].description.length,1000,'descriptions are cut where project() cuts them');assert.deepEqual(Object.keys(slim[0]).sort(),['category','classification','demo','demoHealth','description','full','language','lastCheckedAt','name']);
assert.deepEqual(slim[0].demoHealth,{status:'working',checkedAt:at},'the repeated url and the history are not stored');assert.deepEqual(slim[0].classification,{version:4});
assert.equal(slim[1].demoHealth,undefined,'health about another demo is never used, so it is not stored');assert.equal(slim[0].availability,undefined,'the default availability is not stored');assert.equal(slim[2].availability,'unavailable');
assert(JSON.stringify(slim).length<JSON.stringify(repos).length/3,'much smaller');
// project() reads the same from the slim index as from the full one
async function store(entries){const root=await mkdtemp(join(tmpdir(),'reposhelf-runtime-'));await mkdir(join(root,'data/runtime'),{recursive:true});await writeFile(join(root,'data/runtime/projects.json.gz'),gzipSync(JSON.stringify({schema:2,version:'v1',snapshots:{},entries:Object.fromEntries(entries.map(e=>[e.full.toLowerCase(),e]))})));return {root,store:createProjectStore({root:pathToFileURL(root+'/'),controls:async()=>[]})}}
// The previous index: these keys, with demoHealth cut to url, status and checkedAt.
const oldKeys=['full','name','description','authorDescription','editorialDescription','category','subjects','platforms','classification','language','demo','availability','lastCheckedAt','source','spaceId','githubFull','demoHealth'],oldEntry=r=>Object.fromEntries(oldKeys.filter(k=>r[k]!==undefined).map(k=>[k,k==='classification'?{version:r.classification.version}:k==='demoHealth'?{url:r.demoHealth.url,status:r.demoHealth.status,checkedAt:r.demoHealth.checkedAt}:r[k]]));
const full=await store(repos.map(oldEntry)),small=await store(slim);
try{for(const r of repos.filter(r=>r.availability!=='unavailable')){const a=await full.store.project({id:r.full}),b=await small.store.project({id:r.full});assert.deepEqual(b,a,r.full+' reads the same from the slim index')}
 await assert.rejects(()=>small.store.project({id:'team/gone'}),/not available/,'an unavailable project is still refused');
 assert.equal((await small.store.project({id:'team/app'})).project.demoHealth.status,'working');assert.equal((await small.store.project({id:'team/moved'})).project.demoHealth,null,'a health record for a different demo is still ignored')}
finally{await rm(full.root,{recursive:true,force:true});await rm(small.root,{recursive:true,force:true})}
console.log('PASS: the runtime project index is a fraction of the full size and every project reads back identically.');
