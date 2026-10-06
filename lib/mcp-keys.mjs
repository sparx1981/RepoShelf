import {createHash,randomBytes} from 'node:crypto';
import {respond,readBody,only,fail} from './accounts.mjs';
// Personal connector keys: members create up to five, paste one into their assistant, and revoke it any time.
// Only a SHA-256 hash is stored, so a key can be shown once and never recovered.
export const KEY_PATTERN=/^rsk_[A-Za-z0-9_-]{43}$/;
export const hashKey=key=>createHash('sha256').update(String(key)).digest('hex');
export const newKey=()=>'rsk_'+randomBytes(32).toString('base64url');
const rpc=name=>'/rest/v1/rpc/'+name;
export function createMcpKeys(accounts,{ttl=60000,missTtl=10000,now=Date.now}={}){
 const cache=new Map();
 const remember=(hash,owner)=>{if(cache.size>2000)for(const [k,v] of cache)if(v.until<=now())cache.delete(k);cache.set(hash,{owner,until:now()+(owner?ttl:missTtl)})};
 // Resolves a key to its owner's account id, or null when it is unknown or revoked.
 async function verify(key){
  if(typeof key!=='string'||!KEY_PATTERN.test(key))return null;
  const hash=hashKey(key),hit=cache.get(hash);if(hit&&hit.until>now())return hit.owner;
  const owner=await accounts.request(rpc('reposhelf_mcp_key_verify'),{service:true,method:'POST',body:{p_hash:hash}});
  const id=typeof owner==='string'&&owner?owner:null;remember(hash,id);return id}
 async function handle(req,res){
  only(req,['GET','POST','DELETE']);if(req.method!=='GET')accounts.origin(req);
  const person=await accounts.user(req,res);
  if(!accounts.config.serviceKey)fail(503,'keys_unavailable','Connector keys are being set up. Please try again later.');
  try{
   if(req.method==='GET')return respond(res,200,{keys:(await accounts.request(rpc('reposhelf_mcp_key_list'),{service:true,method:'POST',body:{p_user:person.id}}))||[]});
   const body=await readBody(req);
   if(req.method==='POST'){
    const label=String(body?.label??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
    if(!label)fail(400,'invalid_label','Give the key a short name, such as the assistant it is for.');
    const key=newKey(),result=await accounts.request(rpc('reposhelf_mcp_key_create'),{service:true,method:'POST',body:{p_user:person.id,p_label:label,p_hash:hashKey(key),p_prefix:key.slice(0,8)}});
    if(result?.reason==='limit')fail(409,'key_limit','You can have up to five active keys. Revoke one you no longer use first.');
    if(!result?.ok)fail(409,'key_unavailable','The key could not be created.');
    return respond(res,201,{id:result.id,key,label,prefix:key.slice(0,8)})}
   const id=String(body?.id??'');if(!/^[0-9a-f-]{36}$/i.test(id))fail(400,'invalid_key','Choose a key to revoke.');
   const done=await accounts.request(rpc('reposhelf_mcp_key_revoke'),{service:true,method:'POST',body:{p_user:person.id,p_id:id}});cache.clear();
   if(done!==true)fail(404,'key_not_found','That key is already revoked or no longer exists.');
   return respond(res,200,{revoked:true})
  }catch(e){if(['PGRST202','PGRST205','42P01'].includes(e?.code)||e.code==='migration_required')fail(503,'migration_required','A database update is required before connector keys can be used.');throw e}
 }
 return {verify,handle,forget:()=>cache.clear()}}
