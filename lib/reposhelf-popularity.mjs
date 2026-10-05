// Aggregate counts only. Browsers cannot supply ranking weights or read visitor data.
export function createRepoShelfPopularity(accounts,{now=Date.now}={}){
 let cached=null,pending=null;
 return async()=>{if(cached&&cached.expires>now())return cached.value;if(pending)return pending;
 pending=(async()=>{try{if(!accounts.config.serviceKey)return {};const rows=await accounts.request('/rest/v1/rpc/reposhelf_listing_popularity',{service:true,method:'POST',body:{}});const value={};for(const r of rows||[])if(typeof r.project_id==='string'&&Number.isSafeInteger(Number(r.clicks))&&Number(r.clicks)>0)value[r.project_id.toLowerCase()]=Number(r.clicks);cached={value,expires:now()+60000};return value}catch{cached={value:{},expires:now()+30000};return cached.value}})().finally(()=>{pending=null});return pending;};
}
