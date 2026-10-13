import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const root=new URL('../../',import.meta.url),work=process.env.REPOSHELF_IMAGE_WORKDIR?pathToFileURL(process.env.REPOSHELF_IMAGE_WORKDIR.replace(/\/$/,'')+'/'):new URL('work/images/',root);
export const idValid=id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id);
export async function json(file,fallback){try{return JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e}}
export async function atomic(file,value){await mkdir(new URL('./',file),{recursive:true});const temp=new URL(file.href+'.tmp');await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,file)}
export const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
export async function prompts(){const rows=await json(new URL('scripts/images/prompts.json',root));const ids=new Set();for(const row of rows){if(!idValid(row.id)||ids.has(row.id)||!row.category||!row.prompt)throw Error('Invalid or duplicate image prompt.');ids.add(row.id)}return rows}
export function flag(name,fallback){const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1]}
