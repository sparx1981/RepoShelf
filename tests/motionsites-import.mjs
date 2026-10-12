import assert from 'node:assert/strict';
import {parsePrompt,planImport,slugOf,createMotionSitesImport,CREDIT_NAME} from '../lib/motionsites-import.mjs';

const md=(licence='free')=>`# Apex SaaS

> **Category:** SaaS  
> **Type:** hero  
> **License:** ${licence}

---

## 🎬 Video Preview

![Video Preview 0](../assets/videos/Apex_SaaS_0.mp4)
## 📋 Prompt

\`\`\`text
Build a dark SaaS landing page. Use React.

Nested example:
\`\`\`css
a{b:c}
\`\`\`
Done.
\`\`\`
`;
assert.equal(slugOf('AI_Designer_Agency.md'),'ai-designer-agency');
assert.equal(slugOf('E-commerce_Website.md'),'e-commerce-website');

const row=parsePrompt('Apex_SaaS.md',md());
assert.equal(row.source,'siteshelf');assert.equal(row.source_id,'apex-saas');assert.equal(row.title,'Apex SaaS');assert.equal(row.category,'SaaS');
assert.equal(row.description,'Build a dark SaaS landing page.');
assert(row.prompt.startsWith('Build a dark SaaS')&&row.prompt.endsWith('Done.'),'whole prompt kept, nested fences included');
assert(!/Video Preview|\.mp4/.test(row.prompt),'preview media never enters the prompt');
assert.equal(row.thumbnail,undefined);assert.equal(row.animated_thumbnail,undefined);
assert.equal(row.published,true);assert.equal(row.prompt,row.original_prompt);
assert.match(row.source_url,/^https:\/\/github\.com\/TheSatyam-Singh\/motionsites\.ai\/blob\/main\/prompts\/Apex_SaaS\.md$/);

// Only free prompts, and only well-formed files.
assert.equal(parsePrompt('Pro.md',md('pro')),null);
assert.equal(parsePrompt('Bad.md','# Title\nno prompt here'),null);

// Existing prompts and duplicates are left alone.
const plan=planImport([['Apex_SaaS.md',md()],['Apex_SaaS.md',md()],['Old.md',md().replace('Apex SaaS','Old')],['Bad.md','x']],new Set(['old']));
assert.deepEqual(plan.rows.map(r=>r.source_id),['apex-saas']);assert.equal(plan.skipped.length,3);

const posts=[];
const out=await createMotionSitesImport({db:async(p,o={})=>{if(o.method==='POST'){posts.push(o.body);return null}return [{source_id:'old'}]}})([['Apex_SaaS.md',md()],['Old.md',md()]]);
assert.deepEqual(out,{found:2,added:1,skipped:1});assert.equal(posts.length,1);

assert.match(CREDIT_NAME,/MotionSites/);
console.log('motionsites-import tests passed');

// The admin button's endpoint: administrators only, downloads text from the repository and adds new prompts.
import {createAccounts} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';
const config={url:'https://fixture.supabase.co',key:'k',serviceKey:'server-secret',origin:'https://reposhelf.test'};
const writes=[];
const accounts=createAccounts({legal:{active:false},config,fetcher:async(url,opts)=>{
  const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});
  if(u.pathname==='/auth/v1/user')return token?json({id:token,identities:[],user_metadata:{}}):json({},401);
  if(u.pathname==='/rest/v1/rpc/reposhelf_is_admin')return json(token==='admin');
  if(opts.method==='POST'){writes.push(JSON.parse(opts.body));return json([])}
  if(u.pathname==='/rest/v1/ss_prompts')return json([]);
  return json({},404);
}});
const github=async url=>String(url).includes('api.github.com')
  ?new Response(JSON.stringify([{name:'Apex_SaaS.md',type:'file'},{name:'../evil.md',type:'file'},{name:'img.png',type:'file'}]))
  :new Response(md());
const handler=createPromptsHandler({accounts,github});
async function call(token,origin='https://reposhelf.test'){
  const req={url:'/api/prompts?area=admin-import-motionsites',method:'POST',body:{},headers:{...origin?{origin}:{},...token?{cookie:'__Host-reposhelf-access='+token}:{}}};
  const res={status:0,body:'',getHeader(){},setHeader(){},writeHead(s){this.status=s},end(b){this.body=String(b||'')}};
  await handler(req,res);return res;
}
for(const t of [undefined,'member'])assert([401,403].includes((await call(t)).status),'import is closed to non-admins');
assert.equal((await call('admin','https://evil.test')).status,403);
assert.equal(writes.length,0);
const ok=await call('admin');
assert.equal(ok.status,200);assert.deepEqual(JSON.parse(ok.body),{found:1,added:1,skipped:0});
assert.equal(writes.length,1);assert.equal(writes[0].source_id,'apex-saas');
console.log('motionsites admin endpoint tests passed');
