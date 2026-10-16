import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {createAccounts} from '../lib/accounts.mjs';
import {createBoards} from '../lib/boards.mjs';
import {createCollectionHandler} from '../api/collection.mjs';
import {createMcpEndpoint} from '../lib/mcp-endpoint.mjs';
import {createCatalogService} from '../lib/catalog-service.mjs';
import {fixture} from './api-fixture.mjs';

// An in-memory stand-in for the Supabase board functions, with the same rules as supabase/migrations/202610160035_boards.sql.
const ME='00000000-0000-0000-0000-000000000002',OTHER='00000000-0000-0000-0000-000000000003',UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const likes={[ME]:new Map(),[OTHER]:new Map()},boards=[],rpcCalls=[];let seq=0;
const snapshot=name=>({name,description:`${name} description`,category:'Design',language:'TypeScript'});
const view=b=>({id:b.id,name:b.name,description:b.description,createdAt:b.createdAt,updatedAt:b.updatedAt});
const rpcs={
 reposhelf_boards_list:({p_user})=>boards.filter(b=>b.user===p_user).map(b=>({...view(b),items:[...b.items.keys()]})),
 reposhelf_board_get:({p_user,p_ref})=>{const own=boards.filter(b=>b.user===p_user),b=(UUID.test(p_ref)&&own.find(x=>x.id===p_ref))||own.find(x=>x.name.toLowerCase()===p_ref.trim().toLowerCase());return b?{...view(b),items:[...b.items].map(([id,addedAt])=>({id,addedAt,snapshot:likes[p_user].get(id)}))}:null},
 reposhelf_board_save:({p_user,p_id,p_name,p_description})=>{const name=p_name.replace(/\s+/g,' ').trim().slice(0,80);if(!name)return {ok:false,reason:'invalid_name'};if(boards.some(b=>b.user===p_user&&b.name.toLowerCase()===name.toLowerCase()&&b.id!==p_id))return {ok:false,reason:'duplicate_name'};
  if(!p_id){if(boards.filter(b=>b.user===p_user).length>=50)return {ok:false,reason:'limit'};const b={id:`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`,user:p_user,name,description:(p_description??'').trim(),createdAt:'2026-10-16T00:00:00Z',updatedAt:'2026-10-16T00:00:00Z',items:new Map()};boards.push(b);return {ok:true,id:b.id}}
  const b=boards.find(x=>x.id===p_id&&x.user===p_user);if(!b)return {ok:false,reason:'not_found'};b.name=name;if(p_description!==null)b.description=p_description.trim();return {ok:true,id:b.id}},
 reposhelf_board_delete:({p_user,p_id})=>{const i=boards.findIndex(b=>b.id===p_id&&b.user===p_user);if(i<0)return false;boards.splice(i,1);return true},
 reposhelf_board_item:({p_user,p_board,p_project,p_present})=>{const b=boards.find(x=>x.id===p_board&&x.user===p_user);if(!b)return {ok:false,reason:'not_found'};if(!p_present){b.items.delete(p_project);return {ok:true}}
  if(!likes[p_user].has(p_project))return {ok:false,reason:'not_in_collection'};if(b.items.size>=100&&!b.items.has(p_project))return {ok:false,reason:'limit'};b.items.set(p_project,'2026-10-16T00:00:00Z');return {ok:true}}};
const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
 const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
 if(u.pathname==='/auth/v1/user')return token==='member'?json({id:ME,identities:[],user_metadata:{}}):token==='other'?json({id:OTHER,identities:[],user_metadata:{}}):json({},401);
 const name=u.pathname.replace('/rest/v1/rpc/','');
 if(u.pathname.startsWith('/rest/v1/rpc/')&&rpcs[name]){rpcCalls.push({name,token,apikey:opts.headers.apikey,body:JSON.parse(opts.body)});return json(rpcs[name](JSON.parse(opts.body)))}
 return json({},404)}});
const handler=createCollectionHandler({accounts,catalog:{async project(){throw Object.assign(new Error('x'),{status:404})}}});
async function run(method,url,{token='member',body,origin='https://reposhelf.test'}={}){
 const req={method,url,body,headers:{origin,cookie:'__Host-reposhelf-access='+token}};
 const out={status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s){this.status=s},end(b){this.body=Buffer.from(b||'')}};
 await handler(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}return {status:out.status,data}}
likes[ME].set('team/canvas',snapshot('Canvas'));likes[ME].set('team/other',snapshot('Other'));likes[ME].set('team/gone',snapshot('Gone repo'));likes[ME].set('ss:siteshelf/budget',{name:'Budget planner',category:'Tools',description:'Plan a month.',kind:'prompt'});likes[OTHER].set('team/canvas',snapshot('Canvas'));

// website API: sign-in, origin and input checks come first
assert.equal((await run('GET','/api/collection?action=boards',{token:'nobody'})).status,401,'sign-in is required');
assert.equal((await run('PUT','/api/collection?action=boards',{body:{name:'x'},origin:'https://evil.example'})).status,403,'writes need the site origin');
assert.equal((await run('PUT','/api/collection?action=boards',{body:{name:'   '}})).data.error.code,'invalid_name');
assert.equal((await run('PUT','/api/collection?action=boards',{body:{name:'x'.repeat(81)}})).data.error.code,'invalid_name');
assert.equal((await run('PUT','/api/collection?action=boards',{body:{name:'ok',description:'d'.repeat(1001)}})).data.error.code,'invalid_description');
assert.equal((await run('PUT','/api/collection?action=boards',{body:{name:'ok',id:'not-a-uuid'}})).data.error.code,'invalid_board');
assert.equal(rpcCalls.length,0,'invalid requests never reach storage');
// create, list, duplicates, rename
let r=await run('PUT','/api/collection?action=boards',{body:{name:'  Landing   page ',description:'Marketing site starter'}});assert.equal(r.status,200);const landing=r.data.id;assert.match(landing,UUID);
r=await run('PUT','/api/collection?action=boards',{body:{name:'landing PAGE'}});assert.equal(r.status,409);assert.equal(r.data.error.code,'duplicate_name');
r=await run('PUT','/api/collection?action=boards',{body:{name:'Dashboard'}});const dash=r.data.id;
r=await run('PUT','/api/collection?action=boards',{body:{id:dash,name:'Admin dashboard'}});assert.equal(r.status,200);
assert.equal(rpcCalls.at(-1).body.p_description,null,'renaming without a description keeps the old one');
r=await run('GET','/api/collection?action=boards');assert.deepEqual(r.data.boards.map(b=>b.name),['Landing page','Admin dashboard']);assert.equal(r.data.boards[0].description,'Marketing site starter');
// membership: only collection items, many boards per item
const put=(board,id,present=true,token='member')=>run('PUT','/api/collection?action=board-items',{token,body:{board,id,present}});
assert.equal((await put(landing,'team/canvas')).status,200);assert.equal((await put(dash,'team/canvas')).status,200,'one item on several boards');assert.equal((await put(landing,'team/gone')).status,200);assert.equal((await put(landing,'ss:siteshelf/budget')).status,200,'prompts can sit on boards too');
assert.equal((await put(landing,'team/never-saved')).data.error.code,'not_in_collection');
assert.equal((await put('nope','team/canvas')).data.error.code,'invalid_board');
assert.equal((await run('PUT','/api/collection?action=board-items',{body:{board:landing,id:'team/canvas',present:'yes'}})).status,400);
r=await run('GET','/api/collection?action=boards');assert.deepEqual(r.data.boards[0].items.sort(),['ss:siteshelf/budget','team/canvas','team/gone']);
// boards are private
assert.deepEqual((await run('GET','/api/collection?action=boards',{token:'other'})).data.boards,[]);
assert.equal((await run('GET',`/api/collection?action=boards&board=${landing}`,{token:'other'})).status,404,'another member cannot read a board');
assert.equal((await put(landing,'team/canvas',true,'other')).status,404,'another member cannot add to a board');
assert.equal((await run('PUT','/api/collection?action=boards',{token:'other',body:{id:landing,name:'Mine now'}})).status,404,'another member cannot rename a board');
assert.equal((await run('DELETE','/api/collection?action=boards',{token:'other',body:{id:landing}})).status,404,'another member cannot delete a board');
for(const call of rpcCalls){assert.equal(call.apikey,'server-test-secret','board storage is only reached with the server credential');assert.equal(call.token,undefined,'never with a member token')}
// reading one board by name or id
r=await run('GET','/api/collection?action=boards&board=landing%20page');assert.equal(r.status,200);assert.equal(r.data.board.items.length,3);assert.equal(r.data.board.items.find(i=>i.id==='team/canvas').snapshot.name,'Canvas');
assert.equal((await run('GET','/api/collection?action=boards&board=missing')).status,404);
// removing, deleting
assert.equal((await put(landing,'team/gone',false)).status,200);assert.equal((await run('GET',`/api/collection?action=boards&board=${landing}`)).data.board.items.length,2);
assert.equal((await run('DELETE','/api/collection?action=boards',{body:{id:dash}})).data.deleted,true);assert.equal((await run('DELETE','/api/collection?action=boards',{body:{id:dash}})).status,404);
// the board limit is explained
for(let i=0;i<49;i++)await run('PUT','/api/collection?action=boards',{body:{name:'extra '+i}});
r=await run('PUT','/api/collection?action=boards',{body:{name:'one too many'}});assert.equal(r.status,409);assert.equal(r.data.error.code,'limit');
// a missing database update is reported, not a crash
const unready=createBoards({config:{serviceKey:'x'},async request(){throw Object.assign(Error('missing'),{code:'PGRST202'})}});await assert.rejects(()=>unready.list(ME),e=>e.status===503&&e.code==='migration_required');
await assert.rejects(()=>createBoards({config:{},request(){}}).list(ME),e=>e.status===503&&e.code==='boards_unavailable');

// connector: board tools read the key owner's boards through the same store
const data=await fixture(),service=createCatalogService({root:data.root}),operatorKey=randomBytes(32).toString('hex'),memberKey='rsk_'+randomBytes(32).toString('base64url'),otherKey='rsk_'+randomBytes(32).toString('base64url');
const keys={async verify(k){return k===memberKey?ME:k===otherKey?OTHER:null}};
const endpoint=createMcpEndpoint({service,auth:{key:operatorKey,local:true},keys,boards:createBoards(accounts)});
const http=createServer((req,res)=>endpoint(req,res));await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const connect=async key=>{const client=new Client({name:'boards-test',version:'1.0.0'});await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${http.address().port}/api/mcp`),{requestInit:{headers:{Authorization:`Bearer ${key}`}}}));return client};
try{
 const me=await connect(memberKey),other=await connect(otherKey),operator=await connect(operatorKey);
 const tools=(await me.listTools()).tools.map(t=>t.name);assert(tools.includes('list_boards')&&tools.includes('get_board'));
 for(const tool of (await me.listTools()).tools.filter(t=>['list_boards','get_board'].includes(t.name)))assert.equal(tool.annotations.readOnlyHint,true,'board tools are read-only');
 assert(!tools.some(name=>/add|remove|delete|save|create/.test(name)&&name.includes('board')),'the connector cannot change boards');
 let list=await me.callTool({name:'list_boards',arguments:{}});assert(!list.isError);const names=list.structuredContent.boards.map(b=>b.name);assert(names.includes('Landing page'));const summary=list.structuredContent.boards.find(b=>b.name==='Landing page');assert.equal(summary.itemCount,2);assert.equal(summary.description,'Marketing site starter');assert.equal(summary.items,undefined,'the list is compact');
 // a board: catalogue items get the full summary, prompts and missing repositories fall back to the saved snapshot
 await run('PUT','/api/collection?action=board-items',{body:{board:landing,id:'team/other',present:true}});await run('PUT','/api/collection?action=board-items',{body:{board:landing,id:'team/gone',present:true}});
 let board=await me.callTool({name:'get_board',arguments:{board:'landing page'}});assert(!board.isError,JSON.stringify(board.content));const out=board.structuredContent;
 assert.equal(out.board.name,'Landing page');assert.equal(out.total,4);assert.equal(out.items.length,4);assert.equal(out.nextOffset,null);
 const canvas=out.items.find(i=>i.id==='team/canvas');assert.equal(canvas.inCatalog,true);assert.equal(canvas.license.id,'MIT');assert.equal(canvas.setup.found,true);assert(canvas.demo);
 const gone=out.items.find(i=>i.id==='team/gone');assert.equal(gone.inCatalog,false);assert.equal(gone.name,'Gone repo');assert.match(gone.note,/no longer in the saved catalogue/i);
 const prompt=out.items.find(i=>i.id==='ss:siteshelf/budget');assert.equal(prompt.kind,'prompt');assert.equal(prompt.name,'Budget planner');
 assert(out.notes.length>=2);assert.match(out.contentPolicy,/untrusted|data/i);
 // by id, with paging
 const page=await me.callTool({name:'get_board',arguments:{board:landing,limit:1}});assert.equal(page.structuredContent.items.length,1);assert.equal(page.structuredContent.nextOffset,1);assert.equal((await me.callTool({name:'get_board',arguments:{board:landing,limit:1,offset:3}})).structuredContent.nextOffset,null);
 assert((await me.callTool({name:'get_board',arguments:{board:landing,limit:26}})).isError,'at most 25 items per page');
 // boards are private to their owner, and the operator key has none
 assert.equal((await other.callTool({name:'list_boards',arguments:{}})).structuredContent.boards.length,0);
 const hidden=await other.callTool({name:'get_board',arguments:{board:landing}});assert(hidden.isError);assert.match(hidden.content[0].text,/No board with that name or id/);assert(!hidden.content[0].text.includes('Marketing site starter'));
 const refused=await operator.callTool({name:'list_boards',arguments:{}});assert(refused.isError);assert.match(refused.content[0].text,/personal connector key/);
 // the build prompt
 const prompts=(await me.listPrompts()).prompts.map(p=>p.name);assert(prompts.includes('build_from_board'));
 const built=await me.getPrompt({name:'build_from_board',arguments:{board:'Landing page',goal:'a pricing page'}});const text=built.messages[0].content.text;assert.match(text,/Landing page/);assert.match(text,/a pricing page/);assert.match(text,/get_board/);assert.match(text,/licence/i);assert.match(text,/wait for my go-ahead/i);assert.match(text,/do not run any commands/i);
 await Promise.all([me.close(),other.close(),operator.close()]);
}finally{http.close()}
console.log('PASS: boards are private, limited and tied to the collection; the website API validates input and maps errors; the connector reads boards read-only per key owner with summaries, paging, fallbacks and a build prompt.');
