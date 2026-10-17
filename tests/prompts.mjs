import assert from 'node:assert/strict';
import {createAccounts,authReturn} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';

const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const SECRET='SECRET-PROMPT-TEXT-do-not-leak',PAGE='<!doctype html><title>Demo</title>';
const rows={
  mine:{id:'11111111-1111-1111-1111-111111111111',source:'siteshelf',source_id:'budget-planner',title:'Budget planner',category:'Tools',description:'Plan a month.',type:'free',thumbnail:'/api/thumb?id=x',animated_thumbnail:null,source_url:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-02T00:00:00Z',prompt:SECRET,published:true},
  theirs:{id:'22222222-2222-2222-2222-222222222222',source:'sceneai',source_id:'6a61a4ae0cd891fdf74d708a',title:'Paradiso',category:'Hero',description:'',type:'free',thumbnail:'https://cdn.sceneai.art/t.png',animated_thumbnail:'https://cdn.sceneai.art/t.mp4',source_url:null,created_at:'2026-10-03T00:00:00Z',updated_at:null,prompt:SECRET+'-2',published:true},
  film:{id:'44444444-4444-4444-4444-444444444444',source:'siteshelf',source_id:'motion-film-director',title:'Motion film director',category:'Video & motion',description:'A brief-to-MP4 prompt.',type:'free',kind:'text',thumbnail:null,animated_thumbnail:null,source_url:null,created_at:'2026-10-06T00:00:00Z',updated_at:null,prompt:SECRET+'-4',published:true},
  hidden:{id:'33333333-3333-3333-3333-333333333333',source:'siteshelf',source_id:'hidden-one',title:'Hidden',category:'Tools',description:'',type:'free',thumbnail:null,animated_thumbnail:null,source_url:null,created_at:'2026-10-04T00:00:00Z',updated_at:null,prompt:SECRET+'-3',published:false}
};
const users={member:{id:'00000000-0000-0000-0000-000000000002',identities:[{provider:'github',identity_data:{sub:'102',user_name:'member'}}],user_metadata:{}}};
const calls=[];let missingKind=false;
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
  const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  calls.push({path:u.pathname,search:u.search,token,apikey:opts.headers.apikey});
  if(u.pathname==='/auth/v1/user')return users[token]?json(users[token]):json({},401);
  const wantsPublished=u.searchParams.get('published')==='eq.true',pick=(r)=>(wantsPublished?r.published:true);
  if(u.pathname==='/rest/v1/ss_prompts'&&missingKind&&(u.searchParams.get('select')||'').split(',').includes('kind'))return json({code:'42703',message:'column ss_prompts.kind does not exist'},400);
  if(u.pathname==='/rest/v1/ss_prompts'){
    let list=Object.values(rows).filter(pick);
    const src=u.searchParams.get('source'),sid=u.searchParams.get('source_id');
    if(src)list=list.filter(r=>r.source==='eq.'+r.source||src==='eq.'+r.source);
    if(sid)list=list.filter(r=>sid==='eq.'+r.source_id);
    const cols=(u.searchParams.get('select')||'*').split(',');
    return json(list.map(r=>cols[0]==='*'?r:Object.fromEntries(cols.filter(c=>c in r).map(c=>[c,r[c]]))));
  }
  if(u.pathname==='/rest/v1/ss_thumbs')return json(u.searchParams.get('prompt_id')==='eq.'+rows.mine.id?[{mime:'image/jpeg',data_b64:Buffer.from('JPEGBYTES').toString('base64')}]:[]);
  if(u.pathname==='/rest/v1/ss_previews')return json(u.searchParams.get('prompt_id')==='eq.'+rows.hidden.id?[]:[{html:PAGE,created_at:'2026-10-05T00:00:00Z'}]);
  return json({},404);
}});
const handler=createPromptsHandler({accounts});
async function run(url,{token,method='GET'}={}){
  const req={url,method,headers:{...token?{cookie:'__Host-reposhelf-access='+token}:{}}};
  const out={headers:{},status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s,h){this.status=s;this.headers=Object.fromEntries(Object.entries(h).map(([k,v])=>[k.toLowerCase(),v]))},end(b){this.body=Buffer.from(b||'')}};
  await handler(req,out);
  let data=null;try{data=JSON.parse(out.body.toString())}catch{}
  return {...out,data};
}

// 1. The public list names every published prompt and never contains prompt text.
let r=await run('/api/prompts');
assert.equal(r.status,200);assert.equal(r.data.items.length,3,'unpublished prompts stay out');
assert(!r.body.toString().includes('SECRET-PROMPT'),'the list never carries prompt text');
assert(!('prompt' in r.data.items[0]));
assert.match(r.headers['cache-control'],/public/);
const mine=r.data.items.find(i=>i.id==='budget-planner'),theirs=r.data.items.find(i=>i.source==='sceneai');
assert.equal(mine.thumbnail,'/api/prompts?area=thumb&source=siteshelf&id=budget-planner');assert.equal(mine.credit,null);
assert.deepEqual(theirs.credit,{name:'SceneAI',url:'https://sceneai.art'},'SceneAI prompts are credited and linked back');
// Text prompts have no generated page: no thumbnail request, and page prompts keep their default kind.
const film=r.data.items.find(i=>i.id==='motion-film-director');assert.equal(film.kind,'text');assert.equal(film.thumbnail,null,'a text prompt has no stored thumbnail to request');assert.equal(mine.kind,'page');assert.equal(theirs.kind,'page');

// 2. Guests can see the live page and the thumbnail, but not the prompt or the code.
r=await run('/api/prompts?area=preview&source=siteshelf&id=budget-planner');assert.equal(r.status,200);assert.equal(r.data.html,PAGE);
r=await run('/api/prompts?area=thumb&source=siteshelf&id=budget-planner');assert.equal(r.status,200);assert.equal(r.headers['content-type'],'image/jpeg');assert.equal(r.body.toString(),'JPEGBYTES');
for(const area of ['detail','bundle']){
  r=await run(`/api/prompts?area=${area}&source=siteshelf&id=budget-planner`);
  assert.equal(r.status,401,`${area} needs sign-in`);assert.equal(r.data.error.code,'sign_in_required');assert(!r.body.toString().includes('SECRET-PROMPT'));
  r=await run(`/api/prompts?area=${area}&source=siteshelf&id=budget-planner`,{token:'forged'});
  assert.equal(r.status,401,`${area} rejects an unknown session`);assert(!r.body.toString().includes('SECRET-PROMPT'));
}

// 3. A signed-in member gets the prompt and the code, privately.
r=await run('/api/prompts?area=detail&source=siteshelf&id=budget-planner',{token:'member'});
assert.equal(r.status,200);assert.equal(r.data.prompt,SECRET);assert.equal(r.headers['cache-control'],'private, no-store');
r=await run('/api/prompts?area=bundle&source=sceneai&id=6a61a4ae0cd891fdf74d708a',{token:'member'});
assert.equal(r.status,200);assert.equal(r.data.html,PAGE);assert.equal(r.data.prompt,SECRET+'-2');assert.equal(r.data.title,'Paradiso');

// A text prompt's bundle is the prompt alone: no generated page is looked up, and guests still cannot read it.
r=await run('/api/prompts?area=bundle&source=siteshelf&id=motion-film-director');assert.equal(r.status,401);assert(!r.body.toString().includes('SECRET-PROMPT'));
const previewCalls=calls.length;r=await run('/api/prompts?area=bundle&source=siteshelf&id=motion-film-director',{token:'member'});
assert.equal(r.status,200);assert.equal(r.data.kind,'text');assert.equal(r.data.html,null);assert.equal(r.data.prompt,SECRET+'-4');assert.equal(r.data.title,'Motion film director');
assert(!calls.slice(previewCalls).some(c=>c.path==='/rest/v1/ss_previews'),'no page lookup for a text prompt');

// Before the database update that adds `kind` is applied, the library still works and every prompt is a page prompt.
missingKind=true;
r=await run('/api/prompts');assert.equal(r.status,200);assert.equal(r.data.items.length,3);assert(r.data.items.every(i=>i.kind==='page'),'without the column every prompt is a page prompt');assert(!r.body.toString().includes('SECRET-PROMPT'));
r=await run('/api/prompts?area=bundle&source=sceneai&id=6a61a4ae0cd891fdf74d708a',{token:'member'});assert.equal(r.status,200);assert.equal(r.data.html,PAGE);assert.equal(r.data.prompt,SECRET+'-2');
missingKind=false;

// 4. Unpublished, unknown and malformed requests fail cleanly, and the browser key never reads the tables.
assert.equal((await run('/api/prompts?area=detail&source=siteshelf&id=hidden-one',{token:'member'})).status,404);
assert.equal((await run('/api/prompts?area=preview&source=siteshelf&id=hidden-one')).status,404);
assert.equal((await run('/api/prompts?area=detail&source=other&id=x',{token:'member'})).status,400);
assert.equal((await run('/api/prompts?area=detail&source=siteshelf&id=../etc',{token:'member'})).status,400);
assert.equal((await run('/api/prompts?area=detail&source=siteshelf&id=a%26select%3D*',{token:'member'})).status,400);
assert.equal((await run('/api/prompts?area=nope')).status,400);
assert.equal((await run('/api/prompts',{method:'POST'})).status,403,'writes need a trusted origin and an administrator');assert.equal((await run('/api/prompts',{method:'PUT'})).status,405);
const tableCalls=calls.filter(c=>c.path.startsWith('/rest/v1/ss_'));
assert(tableCalls.length>0&&tableCalls.every(c=>c.apikey==='server-test-secret'&&!c.token),'the tables are only read with the server key');

// 5. Sign-in can return to the library.
assert.equal(authReturn('/prompts.html'),'/prompts.html');assert.equal(authReturn('https://evil.test/prompts.html'),'/');
console.log('PASS: public list/thumbnail/live page, prompt and code only for signed-in members, unpublished hidden, input validated, tables read only with the server key, SceneAI credited.');
