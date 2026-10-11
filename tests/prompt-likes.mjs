import assert from 'node:assert/strict';
import {createAccounts} from '../lib/accounts.mjs';
import {createCollectionHandler} from '../api/collection.mjs';

const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const calls=[];
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
  const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
  calls.push({path:u.pathname,search:u.search,method:opts.method,token,apikey:opts.headers.apikey,body:opts.body?JSON.parse(opts.body):null});
  if(u.pathname==='/auth/v1/user')return token==='member'?json({id:'00000000-0000-0000-0000-000000000002',identities:[],user_metadata:{}}):json({},401);
  if(u.pathname==='/rest/v1/ss_prompts')return u.searchParams.get('source_id')==='eq.budget-planner'?json([{title:'Budget planner',category:'Tools',description:'Plan a month.'}]):json([]);
  if(u.pathname==='/rest/v1/user_likes')return json([{project_id:'ss:siteshelf/budget-planner',created_at:'2026-10-11T00:00:00Z',project_snapshot:{name:'Budget planner'}}]);
  if(u.pathname.startsWith('/rest/v1/rpc/'))return new Response(null,{status:204});
  return json({},404);
}});
const handler=createCollectionHandler({accounts,catalog:{async project(){throw Object.assign(new Error('x'),{status:404})}}});
async function run(method,url,{token='member',body}={}){
  const req={method,url,body,headers:{origin:'https://reposhelf.test',cookie:'__Host-reposhelf-access='+token}};
  const out={status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s){this.status=s},end(b){this.body=Buffer.from(b||'')}};
  await handler(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}return {status:out.status,data};
}

// Saving a prompt stores a snapshot built on the server from the published prompt, not from the browser.
let r=await run('PUT','/api/collection',{body:{id:'ss:siteshelf/budget-planner',repo:{name:'<script>',description:'forged'}}});
assert.equal(r.status,200);assert.equal(r.data.liked,true);
const save=calls.find(c=>c.path.endsWith('reposhelf_save_bookmark'));
assert.equal(save.token,'member','saved with the member session, so row-level security applies');
assert.equal(save.body.project,'ss:siteshelf/budget-planner');assert.equal(save.body.snapshot.name,'Budget planner');assert.equal(save.body.snapshot.kind,'prompt');
assert(!JSON.stringify(save.body).includes('forged'),'browser-supplied details are ignored');
assert(!calls.some(c=>c.path==='/rest/v1/rpc/reposhelf_set_like'&&c.body.liked===true),'no unvalidated like is written');

// Unknown, unpublished and malformed prompts cannot be saved.
assert.equal((await run('PUT','/api/collection',{body:{id:'ss:siteshelf/missing'}})).status,404);
for(const bad of ['ss:other/x','ss:siteshelf/../x','ss:siteshelf/UPPER','ss:siteshelf/'+'a'.repeat(81),'ss:','siteshelf/budget-planner?x'])
  assert([400,404].includes((await run('PUT','/api/collection',{body:{id:bad}})).status),bad);
assert.equal((await run('PUT','/api/collection',{token:'forged',body:{id:'ss:siteshelf/budget-planner'}})).status,401,'sign-in required');

// Removing one.
calls.length=0;r=await run('DELETE','/api/collection',{body:{id:'ss:siteshelf/budget-planner'}});
assert.equal(r.status,200);assert.equal(r.data.liked,false);assert.deepEqual(calls.find(c=>c.path.endsWith('reposhelf_set_like')).body,{project:'ss:siteshelf/budget-planner',liked:false});

// My collection keeps listing projects only; saved prompts are a separate request.
calls.length=0;await run('GET','/api/collection');
assert.match(decodeURIComponent(calls.find(c=>c.path==='/rest/v1/user_likes').search),/and=\(project_id\.not\.like\.ss:\*\)/,'projects list excludes prompts');
calls.length=0;r=await run('GET','/api/collection?kind=prompts');
assert.match(decodeURIComponent(calls.find(c=>c.path==='/rest/v1/user_likes').search),/project_id=like\.ss:\*/);
assert.equal(r.data.items[0].id,'ss:siteshelf/budget-planner');
console.log('PASS: prompts can be saved to My collection with a server-built snapshot, only when published, only by signed-in members; projects and prompts are listed separately.');
