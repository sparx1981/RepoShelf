import assert from 'node:assert/strict';
import {createAccounts} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';
import {createSceneAiSync,planSync,mergeUpdate} from '../lib/sceneai-sync.mjs';

const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const people={admin:{id:'a',identities:[],user_metadata:{}},member:{id:'m',identities:[],user_metadata:{}}};
const writes=[],taken=new Set(['my-new-film']);
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
  const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
  if(u.pathname==='/auth/v1/user')return people[token]?json(people[token]):json({},401);
  if(u.pathname==='/rest/v1/rpc/reposhelf_is_admin')return json(token==='admin');
  if(opts.method==='PATCH'||opts.method==='DELETE'||opts.method==='POST'){writes.push({method:opts.method,path:u.pathname,search:u.search,body:opts.body?JSON.parse(opts.body):null,apikey:opts.headers.apikey});return new Response(null,{status:204})}
  if(u.pathname==='/rest/v1/ss_prompts'&&u.searchParams.get('select')==='id')return json(taken.has(u.searchParams.get('source_id').replace('eq.',''))?[{id:'row'}]:[]);
  if(u.pathname==='/rest/v1/ss_prompts')return json([{source:'siteshelf',source_id:'x',title:'X',prompt:'P',published:false}]);
  if(u.pathname==='/rest/v1/ss_sync_runs')return json([]);
  return json({},404);
}});
const handler=createPromptsHandler({accounts});
async function run(url,{token,method='GET',body,origin='https://reposhelf.test'}={}){
  const req={url,method,body,headers:{...origin?{origin}:{},...token?{cookie:'__Host-reposhelf-access='+token}:{}}};
  const out={headers:{},status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s,h){this.status=s;this.headers=h},end(b){this.body=Buffer.from(b||'')}};
  await handler(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}return {status:out.status,data};
}
const save={source:'siteshelf',id:'x',title:'New title',published:true};

// Only administrators, from this site, can read the admin views or change anything.
for(const t of [undefined,'member']){
  assert([401,403].includes((await run('/api/prompts?area=admin-list',{token:t})).status),'admin list is closed');
  assert([401,403].includes((await run('/api/prompts?area=admin-save',{token:t,method:'POST',body:save})).status),'saving is closed');
}
assert.equal((await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:save,origin:'https://evil.test'})).status,403,'other origins cannot write');
assert.equal(writes.length,0,'nothing was written by the refused attempts');

// Administrators can read, edit, unpublish and delete.
assert.equal((await run('/api/prompts?area=admin-list',{token:'admin'})).status,200);
let r=await run('/api/prompts?area=admin-get&source=siteshelf&id=x',{token:'admin'});assert.equal(r.status,200);assert.equal(r.data.prompt,'P');
r=await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:save});assert.equal(r.status,200);
const patch=writes.at(-1);assert.equal(patch.method,'PATCH');assert.equal(patch.apikey,'server-test-secret');assert.deepEqual(Object.keys(patch.body).sort(),['is_new','published','title','updated_at']);
assert.match(patch.search,/source=eq\.siteshelf&source_id=eq\.x/);
for(const bad of [{...save,id:'../x'},{...save,source:'evil'},{source:'siteshelf',id:'x'},{...save,title:'  '},{...save,published:'yes'},{...save,prompt:'x'.repeat(60001)}]){
  assert.equal((await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:bad})).status,400,JSON.stringify(bad).slice(0,60));
}
const before=writes.length;
assert.equal((await run('/api/prompts?area=admin-delete',{token:'admin',method:'POST',body:{source:'siteshelf',id:'x'}})).status,400,'delete needs the id typed back');
assert.equal(writes.length,before);
assert.equal((await run('/api/prompts?area=admin-delete',{token:'admin',method:'POST',body:{source:'siteshelf',id:'x',confirm:'x'}})).status,200);
assert.equal(writes.at(-1).method,'DELETE');

// New prompts: text prompts only, the id comes from the title and never collides, and bad input writes nothing.
const make={title:'My New Film!',prompt:'A prompt with <brief>',category:'  ',description:'About it'};
for(const t of [undefined,'member'])assert([401,403].includes((await run('/api/prompts?area=admin-create',{token:t,method:'POST',body:make})).status),'creating is closed');
assert.equal((await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:make,origin:'https://evil.test'})).status,403);
let w=writes.length;
for(const bad of [{...make,title:'   '},{...make,title:5},{...make,prompt:'  '},{...make,prompt:'x'.repeat(60001)},{...make,published:'yes'},{...make,description:'d'.repeat(1001)},{...make,category:'c'.repeat(81)}])
  assert.equal((await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:bad})).status,400,JSON.stringify(bad).slice(0,60));
assert.equal(writes.length,w,'invalid prompts write nothing');
r=await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:make});assert.equal(r.status,200);assert.deepEqual(r.data,{ok:true,source:'siteshelf',id:'my-new-film-2'},'a taken id gets a numbered suffix');
let made=writes.at(-1);assert.equal(made.method,'POST');assert.equal(made.path,'/rest/v1/ss_prompts');assert.equal(made.apikey,'server-test-secret');
assert.deepEqual(made.body,{source:'siteshelf',source_id:'my-new-film-2',title:'My New Film!',category:null,description:'About it',type:'free',kind:'text',prompt:'A prompt with <brief>',original_prompt:'A prompt with <brief>',published:false,is_new:false},'created unpublished unless asked, as a text prompt');
taken.clear();r=await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:{title:'  Ünïcode — Tëst  ',prompt:'p',published:true}});assert.equal(r.data.id,'unicode-test');assert.equal(writes.at(-1).body.published,true);
r=await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:{title:'日本語',prompt:'p'}});assert.equal(r.data.id,'prompt','a title with no latin letters still gets a valid id');
r=await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:{title:'a'.repeat(200),prompt:'p'}});assert(/^[a-z0-9-]{1,80}$/.test(r.data.id)&&r.data.id.length<=60,'long titles give a bounded id');
taken.add('prompt');for(let n=2;n<=20;n++)taken.add('prompt-'+n);w=writes.length;
assert.equal((await run('/api/prompts?area=admin-create',{token:'admin',method:'POST',body:{title:'日本語',prompt:'p'}})).status,409,'a title that cannot get a free id is refused');assert.equal(writes.length,w);

// The importer: free prompts only, edits kept, new prompts arrive unpublished.
const list=[{_id:'a'.repeat(24),type:'free',title:'New',category:'Hero',description:'d',thumbnail:'https://cdn.sceneai.art/t.jpg',updatedAt:'2026-10-01'},
 {_id:'b'.repeat(24),type:'free',title:'Changed',updatedAt:'2026-10-09'},{_id:'c'.repeat(24),type:'premium',title:'Paid'},{_id:'d'.repeat(24),type:'free',title:'Same',updatedAt:'2026-01-01'},{_id:'../bad',type:'free'}];
const existing=new Map([['b'.repeat(24),{source_updated_at:'2026-09-01'}],['d'.repeat(24),{source_updated_at:'2026-01-01'}]]);
const plan=planSync(list,existing);assert.deepEqual(plan.fetchIds,['a'.repeat(24),'b'.repeat(24)]);assert.equal(plan.premium,2);
assert.deepEqual(mergeUpdate({prompt:'mine',original_prompt:'old'},'new'),{original_prompt:'new',keptEdits:true},'your edits are not overwritten');
assert.equal(mergeUpdate({prompt:'old',original_prompt:'old'},'new').prompt,'new');
const dbCalls=[],fetched=[];
const fetcher=async url=>{fetched.push(String(url));const u=String(url);
  if(u.includes('?limit=100'))return new Response(JSON.stringify({success:true,data:list,pagination:{totalPages:1}}));
  const id=u.split('/').pop();return new Response(JSON.stringify({data:{prompt:id.startsWith('b')?'changed text':'fresh text'}}))};
const db=async(path,o={})=>{dbCalls.push({path,...o});return path.startsWith('ss_prompts?source=eq.sceneai')?[{id:'row-b',source_id:'b'.repeat(24),source_updated_at:'2026-09-01',prompt:'old',original_prompt:'old'},{id:'row-d',source_id:'d'.repeat(24),source_updated_at:'2026-01-01',prompt:'s',original_prompt:'s'}]:null};
const result=await createSceneAiSync({db,fetcher}).run('weekly');
assert.deepEqual(result,{found:3,added:1,updated:1,skipped_locked:2});
const insert=dbCalls.find(c=>c.method==='POST'&&c.path==='ss_prompts');assert.equal(insert.body.published,false,'new prompts wait for review');assert.equal(insert.body.thumbnail,'https://cdn.sceneai.art/t.jpg');
assert(!fetched.some(u=>u.includes('c'.repeat(24))||u.includes('bad')),'premium and malformed ids are never requested');
assert(dbCalls.some(c=>c.path==='ss_sync_runs'&&c.body.trigger==='weekly'&&!c.body.error));
console.log('PASS: library management is administrator-only and same-origin, input validated, delete needs confirmation, the importer takes free prompts only, keeps edits and queues new ones unpublished.');
