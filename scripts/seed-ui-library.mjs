// One-time (and safe to repeat) load of the UI library tables.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-ui-library.mjs <folder with ui_index.json, ui_db.json, ui_files.json>
// The service key is read from the environment only. Rows are upserted by id/path, so a re-run updates in place.
import {readFile} from 'node:fs/promises';
const dir=process.argv[2];
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!dir||!url||!key){console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-ui-library.mjs <folder>');process.exit(1)}
const read=async n=>JSON.parse(await readFile(new URL(n,new URL('file://'+dir.replace(/\/?$/,'/'))),'utf8'));
async function upsert(table,conflict,rows){
  for(let i=0;i<rows.length;i+=10){
    const batch=rows.slice(i,i+10);
    const res=await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(batch)});
    if(!res.ok)throw new Error(`${table}: ${res.status} ${(await res.text()).slice(0,300)}`);
  }
}
const index=await read('ui_index.json'),db=await read('ui_db.json'),files=await read('ui_files.json');
const meta=Object.fromEntries(index.map(i=>[i.id,i]));
const items=db.map(d=>({id:d.id,title:meta[d.id].t,category:meta[d.id].c,family:meta[d.id].f,description:meta[d.id].d||'',position:meta[d.id].o||0,prompt:d.prompt,code:d.code,files:d.files,shadcn:d.shadcn,npm:d.npm,published:true,updated_at:new Date().toISOString()}));
await upsert('ui_files','path',files.map(f=>({path:f.path,content:f.content,updated_at:new Date().toISOString()})));
console.log(`ui_files: ${files.length} upserted`);
await upsert('ui_items','id',items);
console.log(`ui_items: ${items.length} upserted`);
