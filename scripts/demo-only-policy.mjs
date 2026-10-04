import {savedListingControls} from '../lib/listing-policy.mjs';
import {readFile,writeFile,readdir,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),D=require('../dist/discovery.js'),P=require('../dist/providers.js');
// Eligibility depends on the author's demo URL, not a transient reachability result.
export const hasDemoLink=repo=>Boolean(D.demoUrl(repo.demo));
const key=id=>createHash('sha256').update(id.toLowerCase()).digest('hex');
export async function enforceDemoOnly(root=new URL('../',import.meta.url)){
 const excluded=new Set((await savedListingControls(root)).filter(c=>c.visibility==='excluded').map(c=>c.project_id.toLowerCase()));const all=[];let removed=0,filesRemoved=0,bytesRemoved=0;
 // A runnable Space can be the demo for its explicitly linked GitHub source.
 let linked=new Map();try{const gh=JSON.parse(await readFile(new URL('dist/catalog.json',root),'utf8')),hf=JSON.parse(await readFile(new URL('dist/spaces.json',root),'utf8'));linked=new Map(P.mergeCatalog(gh.repositories,hf.repositories).filter(r=>!P.isSpace(r)&&hasDemoLink(r)).map(r=>[r.full.toLowerCase(),r]))}catch(e){if(e.code!=='ENOENT')throw e}
 for(const name of ['catalog.json','spaces.json']){const file=new URL('dist/'+name,root);let data;try{data=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code==='ENOENT')continue;throw e}const normalized=data.repositories.map(r=>{const merged=linked.get(r.full.toLowerCase());if(!hasDemoLink(r)&&merged)return {...r,demo:merged.demo,demoSource:merged.demoSource,demoHealth:merged.demoHealth};if(P.isSpace(r)&&!r.demo){const previous=r.demoHealth?.url||(r.screenshots||[]).find(s=>s.kind==='demo')?.url;if(previous===`https://huggingface.co/spaces/${r.spaceId}`)return {...r,demo:previous,availability:'unavailable',unavailableReason:r.unavailableReason||'runtime_not_runnable'}}return r});const kept=normalized.filter(r=>hasDemoLink(r)&&!excluded.has(r.full.toLowerCase()));removed+=data.repositories.length-kept.length;all.push(...kept);if(JSON.stringify(kept)!==JSON.stringify(data.repositories)||data.policy!=='demo-only')await writeFile(file,JSON.stringify({...data,policy:'demo-only',updatedAt:new Date().toISOString(),repositories:kept},null,2)+'\n')}
 const ids=new Set(all.map(r=>key(r.full)));const previews=new Set(all.flatMap(r=>(r.screenshots||[]).map(s=>String(s.src||'').replace(/^\//,''))).filter(p=>/^previews\/[a-f0-9]{24}\.jpg$/.test(p)));
 async function sweep(path,pattern,keep){const dir=new URL(path,root);let files;try{files=await readdir(dir)}catch(e){if(e.code==='ENOENT')return;throw e}for(const file of files){if(!pattern.test(file)||keep(file))continue;const target=new URL(file,dir);bytesRemoved+=(await readFile(target)).length;await rm(target);filesRemoved++}}
 await sweep('data/readmes/',/^[a-f0-9]{64}\.json\.gz$/,file=>ids.has(file.slice(0,64)));
 await sweep('data/context/',/^[a-f0-9]{64}\.json\.gz$/,file=>ids.has(file.slice(0,64)));
 await sweep('dist/previews/',/^[a-f0-9]{24}\.jpg$/,file=>previews.has('previews/'+file));
 await mkdir(new URL('data/',root),{recursive:true});
 // A small audit record survives publication; account likes/forks and sync history are untouched.
 if(removed||filesRemoved)await writeFile(new URL('data/demo-only-cleanup.json',root),JSON.stringify({policy:'demo-only',at:new Date().toISOString(),removed,filesRemoved,bytesRemoved})+'\n');
 console.log(`Demo-only cleanup: ${removed} no-demo records removed, ${filesRemoved} orphan files removed, ${bytesRemoved} bytes freed. Temporary demo failures retained.`);
 return {removed,filesRemoved,bytesRemoved};
}
