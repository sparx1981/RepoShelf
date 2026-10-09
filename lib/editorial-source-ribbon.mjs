import {createRequire} from 'node:module';
const E=createRequire(import.meta.url)('../dist/editorial.js');
export const xRibbon=E.defaults().find(row=>row.builtin_key===E.xRibbonKey);
// Anonymous ribbon reads omit drafts under RLS. Distinguish a missing default
// from a deliberately unpublished source ribbon without returning private fields.
export async function sourceRibbonRows(accounts,rows){
 if(rows.some(row=>row.builtin_key===E.xRibbonKey))return rows;
 let saved;try{saved=await accounts.request('/rest/v1/editorial_ribbons?select=id,enabled,position&builtin_key=eq.'+E.xRibbonKey+'&limit=1',{service:true})}catch{return [...rows,{...xRibbon,enabled:false}]}
 if(!saved[0])return rows;
 return [...rows,{...xRibbon,id:saved[0].id,enabled:saved[0].enabled,position:saved[0].position}];
}
// Only called after administrator authentication, during an explicit editor write.
// Public reads may display the default; writes need a real row for the ordering RPC.
export async function ensureXRibbon(accounts,token){
 const rows=await accounts.request('/rest/v1/editorial_ribbons?select=*',{token});
 const existing=rows.find(row=>row.builtin_key===E.xRibbonKey);if(existing)return {row:existing,created:false};
 const row=E.resolve(rows,false).find(row=>row.builtin_key===E.xRibbonKey)||xRibbon;
 const {revision,...input}=row;
 try{await accounts.request('/rest/v1/editorial_ribbons',{token,method:'POST',body:{...input,revision:1}})}catch(error){
  const current=await accounts.request('/rest/v1/editorial_ribbons?select=*&builtin_key=eq.'+E.xRibbonKey,{token});
  if(current[0])return {row:current[0],created:false};throw error;
 }
 return {row:{...input,revision:1},created:true};
}
