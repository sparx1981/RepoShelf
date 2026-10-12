// Usage: node scripts/import-motionsites.mjs <path to the repository's prompts/ folder>
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Reads only the .md prompt files in that folder.
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createMotionSitesImport} from '../lib/motionsites-import.mjs';
const dir=process.argv[2],url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!dir||!url||!key){console.error('Usage: node scripts/import-motionsites.mjs <prompts folder>  (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required)');process.exit(1)}
async function db(p,{method='GET',body}={}){
  const headers={apikey:key,'Content-Type':'application/json'};
  if(/^eyJ/.test(key))headers.Authorization=`Bearer ${key}`;
  const r=await fetch(new URL('/rest/v1/'+p,url),{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw new Error(`Database request failed (${r.status})`);
  return data;
}
const names=(await readdir(dir)).filter(n=>n.endsWith('.md')).sort();
const files=await Promise.all(names.map(async n=>[n,await readFile(path.join(dir,n),'utf8')]));
console.log('MotionSites import finished:',JSON.stringify(await createMotionSitesImport({db})(files)));
