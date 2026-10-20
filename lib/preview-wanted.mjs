import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),Q=require('../dist/quality.js');
// Which saved screenshots the storefront shows, so the build can make their small responsive copies. The build used to read this from the
// browsing index saved in Git (18 MB compressed, rewritten daily). That index is rebuilt by the same build anyway, so only this short list
// is saved now, alongside the SEO registry, by each publication.
export const PREVIEW_WANTED='data/preview-wanted.json';
export function wantedPreviews(index){
 const evidenceAt=Q.evidenceTime(index.snapshots?.catalog),selection=B.select((index.repositories||[]).filter(r=>Q.publishedEligible(r,evidenceAt)),{storefront:true,limit:48,evidenceAt},{rows:[]});
 return [...new Set([...selection.items,...selection.shelfItems].flatMap(r=>(r.screenshots||[]).map(s=>String(s.src||'').replace('previews/',''))))].filter(n=>/^[a-f0-9]{24}(?:-provider)?\.jpg$/.test(n)).sort();
}
export async function writePreviewWanted(root,index){const names=wantedPreviews(index);await writeFile(new URL(PREVIEW_WANTED,root),JSON.stringify({schema:1,snapshot:index.snapshots?.catalog||null,names})+'\n');return names}
// The saved list, else the browsing index when one is on disk (a local build), else null.
export async function readPreviewWanted(root){
 try{const saved=JSON.parse(await readFile(new URL(PREVIEW_WANTED,root),'utf8'));if(Array.isArray(saved.names))return saved.names}catch(e){if(e.code!=='ENOENT')throw e}
 try{return wantedPreviews(JSON.parse(await readFile(new URL('data/browse/index.json',root),'utf8')))}catch(e){if(e.code!=='ENOENT')throw e}
 return null;
}
