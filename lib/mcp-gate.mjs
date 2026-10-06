import {createHash} from 'node:crypto';
// Shared per-member rate limit (per caller address when no member is known) and anonymous per-tool usage counts, backed by Supabase when configured.
// Falls back to the supplied per-instance limiter whenever the shared store is missing, slow or failing, so the
// connector never goes down because analytics storage did.
export function createGate({accounts,fallback,limit=120,timeout=1500,salt=process.env.REPOSHELF_MCP_SALT||'reposhelf-mcp-v1'}={}){
 const callerOf=req=>String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim()||'unknown';
 const bucketOf=(req,identity)=>createHash('sha256').update(salt+'|'+(identity?'member:'+identity:callerOf(req))).digest('hex').slice(0,32);
 return {async check(req,tool=null,identity=null){
  if(accounts?.ready&&accounts.config?.serviceKey){
   let timer;try{const result=await Promise.race([accounts.request('/rest/v1/rpc/reposhelf_mcp_gate',{service:true,method:'POST',body:{p_bucket:bucketOf(req,identity),p_limit:limit,p_tool:tool}}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),timeout)})]);if(typeof result==='boolean')return {allowed:result,mode:'shared'}}catch{}finally{clearTimeout(timer)}
  }
  return {allowed:!fallback(req,identity),mode:'local'}}}}
