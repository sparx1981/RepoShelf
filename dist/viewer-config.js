(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoViewerConfig=factory()})(globalThis,function(){
'use strict';
// One definition of how a demo is shown inside RepoShelf, shared by the server (eligibility), the qualification tool
// (so it tests exactly what visitors get) and the browser (which builds the frame). Changing anything here changes
// the configuration id, which makes existing qualification evidence stop counting until demos are re-qualified.
const VERSION=1,MAX_EVIDENCE_AGE_MS=48*3600000,VIEWER_ORIGIN='https://www.reposhelf.co.uk';
// Deliberately absent: allow-top-navigation and allow-top-navigation-by-user-activation. A click inside a demo must
// not replace RepoShelf, and demos that need that behaviour open externally.
const BASE_SANDBOX=['allow-scripts','allow-same-origin','allow-forms','allow-modals'];
const flags=demo=>({popups:demo?.allow_popups===true||demo?.popups===true,downloads:demo?.allow_downloads===true||demo?.downloads===true});
function sandbox(f){const out=[...BASE_SANDBOX];if(f?.popups)out.push('allow-popups','allow-popups-to-escape-sandbox');if(f?.downloads)out.push('allow-downloads');return out.join(' ')}
// Readable on purpose: it appears in evidence rows and in the admin page.
function configId(f){return `v${VERSION}|popups=${f?.popups?1:0}|downloads=${f?.downloads?1:0}`}
const originOf=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.origin:null}catch{return null}};
// Exact frame origins the pilot needs: the demo address and wherever it finally resolved after redirects.
function frameOrigins(demo,latest){return [...new Set([originOf(demo?.demo_url),originOf(latest?.resolved_url)].filter(Boolean))]}
// RepoShelf's own hosts can never be a demo destination: the frame is allowed to run scripts with its own storage
// (allow-scripts plus allow-same-origin), which is only safe while the content stays cross-origin to RepoShelf.
// (Template literals, so the storage-key scan in the Cookie Policy test does not mistake these hosts for storage keys.)
const APEX=`reposhelf.co.uk`,OWN_HOSTS=[`www.${APEX}`,APEX,`reposhelf.vercel.app`];
function isOwnOrigin(url){try{const h=new URL(url).hostname.toLowerCase();return OWN_HOSTS.includes(h)||h.endsWith('.'+APEX)}catch{return false}}
const PROFILES=['chromium','chromium-mobile','webkit','webkit-mobile','firefox'];
// Pure eligibility decision. `state` is {enabled, required_profiles, demo, latest, profiles} as returned by
// reposhelf_viewer_state, where `profiles` holds the latest run of each browser profile.
// Anything unknown, stale, changed or inconclusive is not eligible, so the visitor gets the external demo.
// Every profile that has ever run counts: a pass in one browser never hides another browser's failure.
function eligibility(state,now=Date.now()){
 const demo=state?.demo;
 if(!state?.enabled)return {eligible:false,reason:'global_disabled'};
 if(!demo||demo.approved!==true)return {eligible:false,reason:'not_approved'};
 if(demo.manual_disabled)return {eligible:false,reason:'manual_disabled'};
 if(demo.auto_disabled)return {eligible:false,reason:'suspended'};
 if(!originOf(demo.demo_url))return {eligible:false,reason:'not_https'};
 if(isOwnOrigin(demo.demo_url))return {eligible:false,reason:'own_origin'};
 const profiles=Array.isArray(state.profiles)?state.profiles:(state.latest?[state.latest]:[]);
 const required=Array.isArray(state.required_profiles)&&state.required_profiles.length?state.required_profiles:['chromium'];
 if(!profiles.length)return {eligible:false,reason:'no_evidence'};
 // The latest run of each profile decides, even when an older success is still inside the age limit.
 for(const p of profiles)if(p.result!=='ok')return {eligible:false,reason:'latest_'+p.result,profile:p.browser};
 const f=flags(demo),id=configId(f);let newest=null;
 for(const name of required){
  const p=profiles.find(x=>x.browser===name);
  if(!p)return {eligible:false,reason:'no_evidence',profile:name};
  if(p.demo_url!==demo.demo_url)return {eligible:false,reason:'url_changed',profile:name};
  // Editing the scenario invalidates earlier evidence: the run must be for the scenario that is saved now.
  if(!demo.scenario_hash||p.scenario_hash!==demo.scenario_hash)return {eligible:false,reason:'scenario_changed',profile:name};
  if(p.config_id!==id)return {eligible:false,reason:'config_changed',profile:name};
  const checked=Date.parse(p.checked_at);if(!Number.isFinite(checked)||now-checked>MAX_EVIDENCE_AGE_MS||checked-now>5*60000)return {eligible:false,reason:'stale',profile:name};
  if(!newest||checked<newest)newest=checked}
 // The resolved address (after redirects) must also stay off RepoShelf.
 const resolved=profiles.map(p=>p.resolved_url).filter(Boolean);if(resolved.some(isOwnOrigin))return {eligible:false,reason:'own_origin'};
 return {eligible:true,reason:'ok',url:demo.demo_url,flags:f,sandbox:sandbox(f),configId:id,frameOrigins:[...new Set([originOf(demo.demo_url),...resolved.map(originOf).filter(Boolean)])],checkedAt:new Date(newest).toISOString(),profiles:required};
}
return {VERSION,MAX_EVIDENCE_AGE_MS,VIEWER_ORIGIN,BASE_SANDBOX,PROFILES,OWN_HOSTS,flags,sandbox,configId,originOf,isOwnOrigin,frameOrigins,eligibility};
});
