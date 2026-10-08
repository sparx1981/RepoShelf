// Server-memory cache only. Callers must authenticate before using it.
// A rejected request is never cached; expired values are never served on error.
export function createAdminResponseCache({ttl=120000,max=32,now=Date.now}={}){
 const entries=new Map();
 return {async get(key,load,{refresh=false}={}){
  const hit=entries.get(key);if(hit?.pending)return hit.pending;if(!refresh&&hit&&hit.expires>now())return hit.value;
  const pending=Promise.resolve().then(load),entry={pending};entries.delete(key);entries.set(key,entry);
  while(entries.size>max)entries.delete(entries.keys().next().value);
  try{const value=await pending;if(entries.get(key)===entry)entries.set(key,{value,expires:now()+ttl});return value}
  catch(error){if(entries.get(key)===entry)entries.delete(key);throw error}
 }};
}
