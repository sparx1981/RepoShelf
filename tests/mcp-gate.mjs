import assert from 'node:assert/strict';import {createGate} from '../lib/mcp-gate.mjs';import {MCP_TOOLS} from '../lib/mcp-server.mjs';
const req=ip=>({headers:{'x-forwarded-for':ip+', 10.0.0.1'}});let calls=[],reply=true;
const accounts={ready:true,config:{serviceKey:'server-key'},async request(path,options){calls.push({path,options});if(reply instanceof Error)throw reply;if(reply==='slow')return new Promise(()=>{});return reply}};
const local=[];const fallback=r=>{local.push(r);return false};
// shared mode: sends only a salted hash, the limit and the tool name, and honours the verdict
let gate=createGate({accounts,fallback,limit:120,timeout:50});
let v=await gate.check(req('203.0.113.7'),'search_projects');assert.deepEqual(v,{allowed:true,mode:'shared'});
const sent=calls[0];assert.equal(sent.path,'/rest/v1/rpc/reposhelf_mcp_gate');assert.equal(sent.options.service,true);assert.equal(sent.options.body.p_tool,'search_projects');assert.equal(sent.options.body.p_limit,120);
assert.match(sent.options.body.p_bucket,/^[a-f0-9]{32}$/);assert(!JSON.stringify(sent).includes('203.0.113.7'),'the caller address is never sent to storage');
const again=await (async()=>{calls=[];await gate.check(req('203.0.113.7'));return calls[0].options.body.p_bucket})();assert.equal(again,sent.options.body.p_bucket,'the same caller maps to the same bucket');
calls=[];await gate.check(req('203.0.113.8'));assert.notEqual(calls[0].options.body.p_bucket,sent.options.body.p_bucket,'different callers map to different buckets');assert.equal(calls[0].options.body.p_tool,null);
reply=false;assert.deepEqual(await gate.check(req('203.0.113.7'),'search_projects'),{allowed:false,mode:'shared'},'the shared verdict can refuse');
// failures fall back to the per-instance limiter instead of taking the connector down
for(const failure of [Error('database unavailable'),'slow','not a boolean']){reply=failure;local.length=0;v=await gate.check(req('203.0.113.9'));assert.deepEqual(v,{allowed:true,mode:'local'},String(failure));assert.equal(local.length,1)}
const refusing=createGate({accounts:{ready:false,config:{}},fallback:()=>true});assert.deepEqual(await refusing.check(req('203.0.113.9')),{allowed:false,mode:'local'},'without Supabase the local limiter decides');
assert.deepEqual(await createGate({fallback:()=>false}).check(req('203.0.113.9')),{allowed:true,mode:'local'});
assert(MCP_TOOLS.every(name=>/^[a-z_]{1,48}$/.test(name)),'tool names fit the database check constraint');
console.log('PASS: shared MCP gate sends only hashed callers and tool names, honours verdicts and falls back safely.');
