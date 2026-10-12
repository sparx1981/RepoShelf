import {readFile,writeFile,mkdir} from 'node:fs/promises';
const validId=value=>typeof value==='string'&&value.length<=300&&/^(?:hf:)?[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)&&!value.replace(/^hf:/,'').split('/').some(p=>p==='.'||p==='..');
export const repositoryId=value=>Number.isSafeInteger(value)&&value>0?value:null;
export const identity=r=>r.source!=='huggingface'&&repositoryId(r.repositoryId)?'github:'+r.repositoryId:String(r.full).toLowerCase();
export const publicPath=r=>validId(r.full)?`/projects/${r.source==='huggingface'?'huggingface':'github'}/${r.full.replace(/^hf:/,'').toLowerCase()}.html`:null;
export async function readSEORegistry(root){try{const registry=JSON.parse(await readFile(new URL('data/seo-registry.json',root),'utf8'));if(registry.schema!==1||!Array.isArray(registry.entries))throw Error('Invalid SEO registry');return registry}catch(error){if(error.code==='ENOENT')return {schema:1,entries:[]};throw error}}
export function previousSelection(registry){return (registry.entries||[]).filter(row=>row.selected&&validId(row.full)).map(row=>({full:row.full,repositoryId:repositoryId(row.repositoryId),source:row.source}));}
export function createSEORegistry(previous,selected,all,{now=Date.now()}={}){
 const old=new Map((previous.entries||[]).filter(row=>validId(row.full)).map(row=>[identity(row),row])),current=new Map(all.filter(r=>validId(r.full)).map(r=>[identity(r),r]));
 const selectedKeys=new Set(selected.map(identity));
 for(const r of selected){const key=identity(r),prior=old.get(key)||old.get(r.full.toLowerCase()),aliases=new Set(prior?.aliases||[]);
  if(prior&&repositoryId(prior.repositoryId)&&prior.repositoryId===r.repositoryId&&prior.full.toLowerCase()!==r.full.toLowerCase())aliases.add(prior.full);
  // Alias evidence is supplied only by the repository availability checker, after an identity match or provider redirect.
  for(const alias of Array.isArray(r.repositoryAliases)?r.repositoryAliases:[])if(alias&&alias.repositoryId===r.repositoryId&&validId(alias.full))aliases.add(alias.full);
  old.delete(r.full.toLowerCase());old.set(key,{full:r.full,source:r.source==='huggingface'?'huggingface':'github',repositoryId:repositoryId(r.repositoryId),firstPublishedAt:prior?.firstPublishedAt||new Date(now).toISOString(),selected:true,aliases:[...aliases].filter(validId).filter(full=>full.toLowerCase()!==r.full.toLowerCase()).slice(-20)});
 }
 // Keep identity/rename history while a project remains in the saved catalogue; selection itself is always publication-filtered.
 const entries=[...old.entries()].filter(([key])=>current.has(key)).map(([key,row])=>({...row,selected:selectedKeys.has(key)})).sort((a,b)=>a.full.localeCompare(b.full));
 return {schema:1,entries};
}
export async function writeSEORegistry(root,registry){await mkdir(new URL('data/',root),{recursive:true});await writeFile(new URL('data/seo-registry.json',root),JSON.stringify(registry)+'\n')}
export function renameRedirects(registry,selected){
 const current=new Map(selected.map(r=>[identity(r),r])),occupied=new Set(selected.map(publicPath)),redirects={};
 for(const row of registry.entries||[]){const project=current.get(identity(row));if(!project||!repositoryId(project.repositoryId)||row.repositoryId!==project.repositoryId)continue;const target=publicPath(project);
  for(const full of row.aliases||[]){const from=publicPath({full,source:row.source});if(from&&from!==target&&!occupied.has(from))redirects[from]=target}
 }
 return {schema:1,redirects};
}
