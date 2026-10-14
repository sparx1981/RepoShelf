// A bounded optimisation within a warm function, never a source of truth.
// Callers include catalogue, moderation, query, personal filters and evidence in keys.
export function createBrowseCache({maxEntries=32,maxItems=100000,ttl=30000,now=Date.now}={}){
 const entries=new Map();let items=0;
 function remove(key){const entry=entries.get(key);if(entry){items-=entry.size;entries.delete(key)}}
 return {
  get(key){const entry=entries.get(key);if(!entry)return;if(now()>=entry.expires){remove(key);return}entries.delete(key);entries.set(key,entry);return entry.value},
  set(key,value,size){remove(key);if(size>maxItems)return;while(entries.size>=maxEntries||items+size>maxItems)remove(entries.keys().next().value);entries.set(key,{value,size,expires:now()+ttl});items+=size},
  clear(){entries.clear();items=0}
 };
}
