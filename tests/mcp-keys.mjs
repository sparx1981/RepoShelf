import assert from 'node:assert/strict';import {createMcpKeys,hashKey,newKey,KEY_PATTERN} from '../lib/mcp-keys.mjs';import {AccountError} from '../lib/accounts.mjs';
const calls=[];let active=[],limit=false,clock=1000;
const accounts={config:{serviceKey:'service'},origin(req){if(req.headers.origin!=='https://www.reposhelf.co.uk')throw new AccountError(403,'origin_not_allowed','no')},async user(req){if(!req.signedIn)throw new AccountError(401,'sign_in_required','Sign in');return {id:'11111111-1111-1111-1111-111111111111'}},
 async request(path,{body}={}){calls.push({path,body});const name=path.split('/').pop();
  if(name==='reposhelf_mcp_key_create'){if(limit)return {ok:false,reason:'limit'};active.push({hash:body.p_hash,prefix:body.p_prefix,label:body.p_label});return {ok:true,id:'22222222-2222-2222-2222-222222222222'}}
  if(name==='reposhelf_mcp_key_list')return active.map((k,i)=>({id:'22222222-2222-2222-2222-22222222222'+i,label:k.label,key_prefix:k.prefix}));
  if(name==='reposhelf_mcp_key_revoke'){const before=active.length;active=active.filter(()=>false);return before>0}
  if(name==='reposhelf_mcp_key_verify')return active.find(k=>k.hash===body.p_hash)?'11111111-1111-1111-1111-111111111111':null;throw Error(name)}};
const keys=createMcpKeys(accounts,{now:()=>clock});
const capture=()=>{const res={status:0,headers:{},body:'',writeHead(s,h){this.status=s;this.headers=h},end(b){this.body=b}};return res};
const call=async(method,body,{signedIn=true,origin='https://www.reposhelf.co.uk'}={})=>{const res=capture();try{await keys.handle({method,headers:{origin,'content-type':'application/json'},signedIn,body:body===undefined?undefined:JSON.stringify(body)},res)}catch(e){return {status:e.status,code:e.code}}return {status:res.status,data:JSON.parse(res.body||'null')}};
// format and hashing
const k=newKey();assert.match(k,KEY_PATTERN);assert.notEqual(k,newKey(),'keys are random');assert.match(hashKey(k),/^[a-f0-9]{64}$/);assert(!KEY_PATTERN.test('rsk_short'));assert(!KEY_PATTERN.test(k+'x'));
// sign-in is required; mutations need the site origin
assert.equal((await call('GET',undefined,{signedIn:false})).status,401);assert.equal((await call('POST',{label:'x'},{origin:'https://evil.example'})).status,403);assert.equal((await call('PUT',{})).code,'method_not_allowed');
// creating returns the key once; storage only ever receives the hash
const made=await call('POST',{label:'  Claude\n desktop  '});assert.equal(made.status,201);assert.match(made.data.key,KEY_PATTERN);assert.equal(made.data.label,'Claude desktop');assert.equal(made.data.prefix,made.data.key.slice(0,8));
const sent=calls.find(c=>c.path.endsWith('reposhelf_mcp_key_create')).body;assert.equal(sent.p_hash,hashKey(made.data.key));assert(!JSON.stringify(calls).includes(made.data.key),'the plain key is never sent to storage');
assert.equal((await call('POST',{label:'   '})).code,'invalid_label');
const list=await call('GET');assert.equal(list.status,200);assert.equal(list.data.keys.length,1);assert(!JSON.stringify(list.data).includes(made.data.key),'listing never reveals a key');
// verification resolves the owner, caches, and refuses unknown or malformed keys
assert.equal(await keys.verify(made.data.key),'11111111-1111-1111-1111-111111111111');const before=calls.length;await keys.verify(made.data.key);assert.equal(calls.length,before,'positive results are cached');
assert.equal(await keys.verify('nope'),null);const other=newKey();assert.equal(await keys.verify(other),null);const n=calls.length;await keys.verify(other);assert.equal(calls.length,n,'negative results are cached briefly');clock+=11000;await keys.verify(other);assert.equal(calls.length,n+1,'negative results expire quickly');
// the five-key limit is explained, and revoking takes effect immediately
limit=true;assert.equal((await call('POST',{label:'six'})).code,'key_limit');limit=false;
assert.equal((await call('DELETE',{id:'not-an-id'})).code,'invalid_key');assert.equal((await call('DELETE',{id:'22222222-2222-2222-2222-222222222222'})).status,200);assert.equal(await keys.verify(made.data.key),null,'a revoked key stops working at once on this instance');assert.equal((await call('DELETE',{id:'22222222-2222-2222-2222-222222222222'})).code,'key_not_found');
console.log('PASS: connector keys are random, hashed at rest, shown once, limited, verified with a short cache and revocable.');
