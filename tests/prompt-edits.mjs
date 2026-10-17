import assert from 'node:assert/strict';
import {createAccounts} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';
import {createSceneAiSync,upstreamFields} from '../lib/sceneai-sync.mjs';
import {createMotionSitesImport} from '../lib/motionsites-import.mjs';
// QA-19: the weekly SceneAI import keeps an administrator's edits to the title, category and description, not only the prompt.
// QA-38: a prompt deleted in the admin area is remembered, and neither import brings it back.
// QA-37: a page prompt with no generated page still gives members its prompt.
const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'};
const writes=[];let row={source:'sceneai',source_id:'a'.repeat(24),title:'Upstream title',category:'Hero',description:'Upstream words',prompt:'line one\nline two',edited_fields:[],id:'r1',kind:'page',published:true},missingColumn=false,hasPreview=false,duplicate=false;
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
 const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
 if(u.pathname==='/auth/v1/user')return token==='admin'||token==='member'?json({id:token,identities:[],user_metadata:{}}):json({},401);
 if(u.pathname==='/rest/v1/rpc/reposhelf_is_admin')return json(token==='admin');
 if(opts.method==='POST'&&u.pathname==='/rest/v1/ss_prompt_tombstones'){writes.push({method:'POST',path:u.pathname,body:JSON.parse(opts.body)});return duplicate?json({code:'23505'},409):new Response(null,{status:201})}
 if(opts.method==='PATCH'||opts.method==='DELETE'||opts.method==='POST'){writes.push({method:opts.method,path:u.pathname,body:opts.body?JSON.parse(opts.body):null});return new Response(null,{status:204})}
 if(u.pathname==='/rest/v1/ss_prompts'){
  if(missingColumn&&(u.searchParams.get('select')||'').includes('edited_fields'))return json({code:'42703'},400);
  const cols=(u.searchParams.get('select')||'*').split(',');return json([Object.fromEntries(cols.filter(c=>c in row).map(c=>[c,row[c]]))]);
 }
 if(u.pathname==='/rest/v1/ss_previews')return json(hasPreview?[{html:'<p>page</p>'}]:[]);
 return json({},404);
}});
const handler=createPromptsHandler({accounts});
async function run(url,{token,method='GET',body}={}){
 const req={url,method,body,headers:{origin:'https://reposhelf.test',cookie:'__Host-reposhelf-access='+token}};
 const out={status:0,body:Buffer.alloc(0),getHeader(){},setHeader(){},writeHead(s){this.status=s},end(b){this.body=Buffer.from(b||'')}};
 await handler(req,out);let data=null;try{data=JSON.parse(out.body.toString())}catch{}return {status:out.status,data};
}
const save={source:'sceneai',id:'a'.repeat(24)};
// Only fields that changed are written and remembered; the dialog sends everything, with Windows line endings in the prompt.
let r=await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:{...save,title:'My title',category:'Hero',description:'Upstream words',prompt:'line one\r\nline two',published:true}});
assert.equal(r.status,200);
let patch=writes.at(-1);assert.equal(patch.method,'PATCH');
assert.deepEqual(Object.keys(patch.body).sort(),['edited_fields','is_new','published','title','updated_at'],'only the title changed');
assert.deepEqual(patch.body.edited_fields,['title'],'the title is remembered as edited');assert(!('prompt' in patch.body),'a prompt that only differs in line endings is not an edit');
// Nothing changed and nothing to publish: nothing is written.
const before=writes.length;r=await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:{...save,title:'Upstream title',prompt:'line one\nline two'}});
assert.equal(r.status,200);assert.equal(writes.length,before,'an unchanged save writes nothing');
// Edited fields add up.
row.edited_fields=['title'];await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:{...save,description:'Mine',prompt:'changed'}});
patch=writes.at(-1);assert.deepEqual(patch.body.edited_fields.sort(),['description','title']);assert.equal(patch.body.prompt,'changed');
// Before migration 0038 the save still works, without remembering.
row.edited_fields=undefined;missingColumn=true;await run('/api/prompts?area=admin-save',{token:'admin',method:'POST',body:{...save,category:'Other'}});
assert.equal(writes.at(-1).body.category,'Other');assert(!('edited_fields' in writes.at(-1).body));missingColumn=false;row.edited_fields=[];

// The import writes SceneAI's values only to fields nobody edited.
assert.deepEqual(upstreamFields({edited_fields:['title','description']},{title:'T',category:'C',description:'D',thumbnail:'x'}),{category:'C',thumbnail:'x'});
assert.deepEqual(upstreamFields({},{title:'T',category:'C',description:'D'}),{title:'T',category:'C',description:'D'});
const list=[{_id:'a'.repeat(24),type:'free',title:'Upstream title 2',category:'Hero 2',description:'D2',updatedAt:'2026-10-09'},{_id:'b'.repeat(24),type:'free',title:'Deleted one',updatedAt:'2026-10-09'}];
const dbCalls=[];
const db=async(path,o={})=>{dbCalls.push({path,...o});
 if(path.startsWith('ss_prompts?source=eq.sceneai'))return [{id:'row-a',source_id:'a'.repeat(24),source_updated_at:'2026-09-01',prompt:'p',original_prompt:'p',edited_fields:['title']}];
 if(path.startsWith('ss_prompt_tombstones'))return [{source_id:'b'.repeat(24)}];return null};
const fetcher=async url=>{const u=String(url);if(u.includes('?limit=100'))return new Response(JSON.stringify({success:true,data:list,pagination:{totalPages:1}}));if(u.endsWith('b'.repeat(24)))throw new Error('a deleted prompt was fetched');return new Response(JSON.stringify({data:{prompt:'p2'}}))};
const result=await createSceneAiSync({db,fetcher}).run('weekly');
assert.equal(result.updated,1);assert.equal(result.added,0,'the deleted prompt is not added again');
const upd=dbCalls.find(c=>c.method==='PATCH');assert(!('title' in upd.body),'an edited title is kept');assert.equal(upd.body.category,'Hero 2');assert.equal(upd.body.description,'D2');assert.equal(upd.body.prompt,'p2','an untouched prompt still follows SceneAI');
// MotionSites: a deleted prompt stays deleted.
const md=`# Apex\n\n> **Category:** SaaS  \n> **License:** free\n\n\`\`\`text\nBuild it.\n\`\`\`\n`;
const calls2=[];const imp=await createMotionSitesImport({db:async(path,o={})=>{calls2.push({path,...o});return path.startsWith('ss_prompt_tombstones')?[{source_id:'apex'}]:[]}})([['Apex.md',md],['Other.md',md.replace('Apex','Other')]]);
assert.equal(imp.added,1);assert.equal(calls2.find(c=>c.method==='POST').body.source_id,'other','only the prompt that was not deleted is added');

// Deleting an imported prompt records a tombstone first; a repeat delete is fine; before the migration it still deletes.
writes.length=0;r=await run('/api/prompts?area=admin-delete',{token:'admin',method:'POST',body:{source:'sceneai',id:'a'.repeat(24),confirm:'a'.repeat(24)}});
assert.equal(r.status,200);assert.deepEqual(writes.map(w=>w.method+' '+w.path.split('/').pop()),['POST ss_prompt_tombstones','DELETE ss_prompts']);assert.deepEqual(writes[0].body,{source:'sceneai',source_id:'a'.repeat(24)});
writes.length=0;duplicate=true;r=await run('/api/prompts?area=admin-delete',{token:'admin',method:'POST',body:{source:'sceneai',id:'a'.repeat(24),confirm:'a'.repeat(24)}});assert.equal(r.status,200,'an id already remembered does not stop the delete');duplicate=false;

// QA-37: no generated page yet.
r=await run('/api/prompts?area=bundle&source=sceneai&id='+'a'.repeat(24),{token:'member'});
assert.equal(r.status,200);assert.equal(r.data.html,null);assert.equal(r.data.prompt,'line one\nline two');
hasPreview=true;r=await run('/api/prompts?area=bundle&source=sceneai&id='+'a'.repeat(24),{token:'member'});assert.equal(r.data.html,'<p>page</p>');
console.log('PASS: admin edits to the title, category, description or prompt are remembered and kept by the SceneAI import, unchanged saves write nothing, deleted prompts stay deleted in both imports, and a page prompt without a page still returns its prompt.');
