import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createAccounts} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';
import {createCollectionHandler} from '../api/collection.mjs';
import {showcase,showcaseIds,showcaseDetail,showcaseRow,SHOWCASE_LICENCE} from '../lib/ui-showcase/index.mjs';
import {BASE_CSS} from '../lib/ui-showcase/base.mjs';

const index=JSON.parse(await readFile(new URL('../dist/ui/index.json',import.meta.url),'utf8'));
const thumbs=new Set(await readdir(new URL('../dist/ui/thumbs/',import.meta.url)));
const pages=new Set(await readdir(new URL('../dist/ui/s/',import.meta.url)));

assert.ok(showcase.length>=24,'A substantial showcase ships');
assert.equal(showcaseIds.size,showcase.length,'Unique showcase ids');
const families=new Set(showcase.map(i=>i.family));assert.ok(families.has('Expressive components')&&families.has('Micro-interactions')&&families.has('Hover & cursor effects'));

// Catalogue: rows exist, are mixed into the front of the list, and nothing existing was dropped.
const positions=showcase.map(i=>index.findIndex(r=>r.id===i.id));
assert.ok(positions.every(p=>p>=0),'Every showcase item is in the catalogue');
assert.ok(Math.max(...positions)<showcase.length*2,'Showcase items sit in the first rows');
assert.deepEqual(positions.slice(0,6),[0,2,4,6,8,10],'Showcase items alternate with existing components at the top');
assert.ok(index.slice(0,showcase.length*2).filter(r=>!r.s).length>=showcase.length-1,'Existing components remain mixed in near the top');
assert.equal(index.filter(r=>r.s).length,showcase.length);assert.equal(index.filter(r=>!r.s).length,1241,'All existing components are kept');
assert.deepEqual(index[0],showcaseRow(showcase[0],0));

for(const item of showcase){
 assert.match(item.id,/^s-[a-z0-9-]{1,60}$/,'Safe id '+item.id);
 for(const field of ['title','component','key','family','description','prompt','css','html','js'])assert.ok(typeof item[field]==='string'&&item[field].length>3,item.id+' has '+field);
 assert.ok(item.prompt.length>150,'A real prompt for '+item.id);
 assert.ok(thumbs.has(item.id+'.webp'),'Thumbnail '+item.id);assert.ok(pages.has(item.id+'.html'),'Preview page '+item.id);
 // Code quality and safety: self-contained, no network, no eval, no unbounded markup injection.
 const detail=showcaseDetail(item.id);assert.equal(detail.original,true);assert.equal(detail.filename,'component.html');
 const code=detail.code;assert.ok(code.startsWith('<!-- '+SHOWCASE_LICENCE),'Licence notice leads the code: '+item.id);
 assert.ok(code.includes(BASE_CSS.slice(0,60)),'Standalone: includes the design tokens '+item.id);
 assert.doesNotMatch(item.js+item.html+item.css,/\beval\(|new Function|document\.write|fetch\(|XMLHttpRequest|WebSocket|localStorage|https?:\/\/(?!www\.w3\.org)/i,'No network, storage or dynamic code in '+item.id);
 assert.doesNotMatch(item.js,/innerHTML\s*=|outerHTML\s*=/,'No HTML injection in '+item.id);
 assert.doesNotMatch(code,/reui|react-?bits|keenthemes/i,'No third-party names in '+item.id);
 for(const script of [...code.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]))assert.doesNotThrow(()=>new Function(script),'Script parses: '+item.id);
 assert.equal((code.match(/<style>/g)||[]).length,1);assert.equal((code.match(/<\/style>/g)||[]).length,1);
 const page=await readFile(new URL('../dist/ui/s/'+item.id+'.html',import.meta.url),'utf8');
 assert.match(page,/<!doctype html>/);assert.match(page,/name="viewport"/);assert.match(page,/prefers-reduced-motion/,'Reduced motion honoured: '+item.id);assert.doesNotMatch(page,/<script[^>]+src=/,'Preview loads no external script');
 assert.match(page,/URLSearchParams\(location\.search\)\.get\('theme'\)/,'Preview follows the theme toggle');
 // Interactive elements must be labelled and keyboard reachable: every button in the markup has text or a label.
 for(const m of item.html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g))assert.ok(/aria-label=/.test(m[1])||m[2].replace(/<[^>]+>/g,'').trim().length>0,'Named button in '+item.id);
}

// Accessible by design: respects reduced motion in the shared styles.
assert.match(BASE_CSS,/prefers-reduced-motion:reduce/);assert.match(BASE_CSS,/:focus-visible/);assert.match(BASE_CSS,/prefers-color-scheme:dark/);

// Member gate: the prompt and the code only go to signed-in members; unknown ids still use the database path.
const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const calls=[];
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
 const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
 calls.push({path:u.pathname,search:u.search,body:opts.body?JSON.parse(opts.body):null});
 if(u.pathname==='/auth/v1/user')return token==='member'?json({id:'00000000-0000-0000-0000-000000000002',identities:[{provider:'github',identity_data:{sub:'102',user_name:'member'}}],user_metadata:{}}):json({},401);
 if(u.pathname.startsWith('/rest/v1/rpc/'))return new Response(null,{status:204});
 return json([]);
}});
const handler=createPromptsHandler({accounts}),collection=createCollectionHandler({accounts,catalog:{project:async()=>{throw Object.assign(Error('x'),{status:404})}}});
async function call(fn,method,url,token,body){const req={method,url,body,headers:{origin:'https://reposhelf.test',...token?{cookie:'__Host-reposhelf-access='+token}:{}}};const out={status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s){this.status=s},end(b){this.body=Buffer.from(b||'')}};await fn(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}return {status:out.status,data,text:out.body.toString()}}
const id=showcase[0].id;
let r=await call(handler,'GET','/api/prompts?area=ui-detail&id='+id);assert.equal(r.status,401);assert.ok(!r.text.includes(showcase[0].prompt.slice(0,40)),'Guests never receive the prompt or code');
r=await call(handler,'GET','/api/prompts?area=ui-detail&id='+id,'member');assert.equal(r.status,200);assert.equal(r.data.id,id);assert.equal(r.data.prompt,showcase[0].prompt);assert.match(r.data.code,/<style>/);assert.deepEqual(r.data.files,[]);assert.match(r.data.licence,/RepoShelf showcase components licence/);
assert.ok(!calls.some(c=>c.path==='/rest/v1/ui_items'),'Original components never touch the database');
r=await call(handler,'GET','/api/prompts?area=ui-detail&id=s-does-not-exist','member');assert.equal(r.status,404);

// Saving to My collection works for showcase ids and uses a server-built snapshot.
r=await call(collection,'PUT','/api/collection','member',{id:'ss:ui/'+id,repo:{name:'forged'}});assert.equal(r.status,200);
const saved=calls.find(c=>c.path.endsWith('reposhelf_save_bookmark')).body;assert.equal(saved.project,'ss:ui/'+id);assert.equal(saved.snapshot.name,showcase[0].title);assert.equal(saved.snapshot.category,showcase[0].component);assert.ok(!JSON.stringify(saved).includes('forged'));
assert.equal((await call(collection,'PUT','/api/collection','member',{id:'ss:ui/s-does-not-exist'})).status,404);

// The licence page and docs explain the originals.
const licences=await readFile(new URL('../dist/licences.html',import.meta.url),'utf8');
assert.match(licences,/RepoShelf showcase components/);assert.match(licences,/Commons Clause|inspiration/i);
console.log(`PASS: ${showcase.length} original showcase components are mixed in at the top of the UI list, with previews, thumbnails, safe self-contained code, member-only access, saves and licence notices.`);
