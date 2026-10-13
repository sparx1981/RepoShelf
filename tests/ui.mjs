import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createAccounts} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';

// 1. The static catalogue is complete: every entry has a thumbnail, and nothing in the public files names the source set.
const index=JSON.parse(await readFile(new URL('../dist/ui/index.json',import.meta.url),'utf8'));
const thumbs=new Set((await readdir(new URL('../dist/ui/thumbs/',import.meta.url))).map(f=>f.replace(/\.webp$/,'')));
assert.ok(index.length>=1000,'the UI catalogue is loaded');
const ids=new Set();
for(const i of index){
  assert.match(i.id,/^[a-z0-9-]{1,80}$/);assert.ok(!ids.has(i.id),'unique id '+i.id);ids.add(i.id);
  assert.ok(i.t&&i.c&&i.f&&i.k,'entry has title, component, group and key: '+i.id);
  assert.ok(thumbs.has(i.id),'thumbnail for '+i.id);
}
assert.equal(thumbs.size,index.length,'no stray thumbnails');
assert.ok(!/reui/i.test(JSON.stringify(index)),'the public list never names the source set');
for(const page of ['ui.html','ui.js','licences.html']){
  const text=await readFile(new URL('../dist/'+page,import.meta.url),'utf8');
  assert.ok(!/reui/i.test(text),page+' does not name the source set');
}

// 2. The prompt and the code are served to signed-in members only.
const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const item={id:'c-badge-4',title:'Success badge',category:'Badge',family:'Feedback & status',description:'Success badge',prompt:'SECRET-UI-PROMPT',code:'export default function Pattern(){return null}',files:['components/extras/badge.tsx'],shadcn:[],npm:['cn'],published:true};
const users={member:{id:'00000000-0000-0000-0000-000000000002',identities:[{provider:'github',identity_data:{sub:'102',user_name:'member'}}],user_metadata:{}}};
const seen=[];
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
  const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
  seen.push(u.pathname+u.search);
  if(u.pathname==='/auth/v1/user')return users[token]?json(users[token]):json({},401);
  if(u.pathname==='/rest/v1/ui_items')return json(u.searchParams.get('id')==='eq.c-badge-4'?[item]:[]);
  if(u.pathname==='/rest/v1/ui_files')return json([{path:'components/extras/badge.tsx',content:'// badge'}]);
  return json({},404);
}});
const handler=createPromptsHandler({accounts});
async function run(url,token){
  const req={url,method:'GET',headers:{...token?{cookie:'__Host-reposhelf-access='+token}:{}}};
  const out={headers:{},status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s,h){this.status=s;this.headers=Object.fromEntries(Object.entries(h).map(([k,v])=>[k.toLowerCase(),v]))},end(b){this.body=Buffer.from(b||'')}};
  await handler(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}
  return {...out,data,text:out.body.toString()};
}
let r=await run('/api/prompts?area=ui-detail&id=c-badge-4');
assert.equal(r.status,401,'guests are refused');assert.ok(!r.text.includes('SECRET-UI-PROMPT'),'guests never receive the prompt');
r=await run('/api/prompts?area=ui-detail&id=c-badge-4','member');
assert.equal(r.status,200);assert.equal(r.data.prompt,'SECRET-UI-PROMPT');assert.equal(r.data.files[0].path,'components/extras/badge.tsx');assert.equal(r.data.files[0].content,'// badge');
r=await run('/api/prompts?area=ui-detail&id=missing-one','member');assert.equal(r.status,404);
r=await run('/api/prompts?area=ui-detail&id=BAD%20ID','member');assert.equal(r.status,400);
console.log('PASS: UI catalogue complete and neutral, prompt and code only for signed-in members, input validated.');
