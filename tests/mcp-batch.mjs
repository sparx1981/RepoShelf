import assert from 'node:assert/strict';
import {createMcpEndpoint} from '../lib/mcp-endpoint.mjs';
// One request must count as one request. A JSON-RPC batch used to run up to 100 tool calls for a single rate-limit hit.
let gateCalls=0,serviceCalls=0;
const service=new Proxy({},{get:(_,name)=>async()=>{serviceCalls++;return {items:[],name}}});
const KEY='rsk_'+'a'.repeat(43);
const endpoint=createMcpEndpoint({service,auth:{key:'o'.repeat(40)},keys:{async verify(key){return key===KEY?'11111111-1111-1111-1111-111111111111':null}},gate:{async check(){gateCalls++;return {allowed:true}}},boards:{async list(){return []},async get(){return null}}});
async function post(body){const raw=JSON.stringify(body);const req={method:'POST',url:'/api/mcp',headers:{authorization:'Bearer '+KEY,'content-type':'application/json','content-length':String(Buffer.byteLength(raw)),accept:'application/json, text/event-stream','mcp-protocol-version':'2025-06-18',origin:'https://www.reposhelf.co.uk'},socket:{remoteAddress:'203.0.113.9'},body};
 const res={statusCode:200,headers:{},headersSent:false,writableEnded:false,setHeader(k,v){this.headers[k]=v},getHeader(k){return this.headers[k]},writeHead(s,h={}){this.statusCode=s;Object.assign(this.headers,h);this.headersSent=true},write(){return true},end(b){this.body=b;this.writableEnded=true},on(){return this},once(){return this},emit(){return false}};
 await endpoint(req,res);return res}
const call=i=>({jsonrpc:'2.0',id:i,method:'tools/call',params:{name:'search_projects',arguments:{q:'x'}}});
// a batch is refused before the limiter or any tool runs
const batch=await post(Array.from({length:100},(_,i)=>call(i)));
assert.equal(batch.statusCode,400);assert.equal(JSON.parse(batch.body).error.code,-32600);assert.match(JSON.parse(batch.body).error.message,/one message per request/);
assert.equal(gateCalls,0,'a refused batch never reaches the limiter');assert.equal(serviceCalls,0,'a refused batch runs no tools');
// a single message still counts once and runs
const single=await post(call(1));assert.equal(single.statusCode,200);assert.equal(gateCalls,1);assert(serviceCalls<=1);
// an empty batch is refused too
const empty=await post([]);assert.equal(empty.statusCode,400);assert.equal(gateCalls,1);
console.log('PASS: JSON-RPC batches are refused before the rate limit and before any tool runs, and a single message still counts once.');
