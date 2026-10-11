import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createAnalyticsHandler} from '../api/analytics.mjs';

const calls=[];let admin=false;
const accounts={ready:true,config:{serviceKey:'server-test-secret',origin:'https://reposhelf.test'},
  origin(){},
  async user(){return admin?{id:'a',token:'t'}:null},
  async isAdmin(){return admin},
  async admin(){if(!admin){const e=new Error('no');e.status=403;e.code='forbidden';throw e}return {id:'a',token:'t'}},
  async request(path,opts={}){calls.push({path,opts});if(path.includes('reposhelf_admin_prompts'))return {days:30,totals:{prompt_view:2},visitors:1,daily:[],top:[]};if(path.includes('reposhelf_ingest_prompt_events'))return opts.body.events.length;return 1}};
const handler=createAnalyticsHandler({accounts,catalog:{async project(){const e=new Error('missing');e.status=404;throw e},info(){return {}}},summaries:{read:async()=>null}});
const run=(method,url,body,headers={})=>new Promise(resolve=>{const req={method,url,headers:{origin:'https://reposhelf.test',...headers},body},res={status:0,headers:{},getHeader(){},setHeader(){},writeHead(s){this.status=s},end(t){resolve({status:this.status,body:t?JSON.parse(t):null})}};handler(req,res)});
const base=()=>({consent:true,consentVersion:2,session:randomUUID(),visitor:randomUUID()});
const ev=(kind,project)=>({id:randomUUID(),kind,project});

let r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','siteshelf/budget-planner'),ev('prompt_reveal','sceneai/6a61a4ae0cd891fdf74d708a'),ev('zip_download','siteshelf/budget-planner')]});
assert.equal(r.status,202);
const ingest=calls.filter(c=>c.path.includes('reposhelf_ingest_prompt_events'));
assert.equal(ingest.length,1,'prompt actions go through their own ingest');
assert.equal(ingest[0].opts.body.events.length,3);
for(const e of ingest[0].opts.body.events){assert.match(e.visitor_hash,/^[a-f0-9]{64}$/);assert.match(e.session_hash,/^[a-f0-9]{64}$/);assert(!('visitor' in e)&&!('session' in e),'raw identifiers are never stored')}
assert(!calls.some(c=>c.path.includes('reposhelf_ingest_analytics_v2')||c.path.includes('reposhelf_ingest_events')),'catalogue ingest untouched by prompt-only batches');

calls.length=0;
r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','../etc/passwd'),ev('prompt_view','other/thing'),ev('prompt_view',undefined)]});
assert.equal(r.status,202);assert.equal(calls.filter(c=>c.path.includes('prompt_events')).length,0,'malformed prompt keys are dropped');

r=await run('POST','/api/analytics',{...base(),events:[ev('not_a_kind','siteshelf/x')]});assert.equal(r.status,400);

calls.length=0;
r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','siteshelf/x')]},{dnt:'1'});assert.equal(r.body.accepted,false);
r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','siteshelf/x')]},{'sec-gpc':'1'});assert.equal(r.body.accepted,false);
r=await run('POST','/api/analytics',{...base(),consent:false,events:[ev('prompt_view','siteshelf/x')]});assert.equal(r.body.accepted,false);
r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','siteshelf/x')]},{'user-agent':'HeadlessChrome'});assert.equal(r.body.accepted,false);
admin=true;r=await run('POST','/api/analytics',{...base(),events:[ev('prompt_view','siteshelf/x')]});assert.equal(r.body.accepted,false);
assert.equal(calls.filter(c=>c.path.includes('prompt_events')).length,0,'privacy signals, no consent, bots and admins record nothing');

admin=false;r=await run('GET','/api/analytics?action=prompts&days=30');assert.equal(r.status,403,'summary is administrators only');
admin=true;r=await run('GET','/api/analytics?action=prompts&days=30');assert.equal(r.status,200);assert.equal(r.body.totals.prompt_view,2);
console.log('PASS: prompt actions are stored as hashed events, malformed ones dropped, consent/privacy signals/admins excluded, summary admin-only.');
