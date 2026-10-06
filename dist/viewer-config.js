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
// Pure eligibility decision. `state` is {enabled, demo, latest} as returned by reposhelf_viewer_state.
// Anything unknown, stale, changed or inconclusive is not eligible, so the visitor gets the external demo.
function eligibility(state,now=Date.now()){
 const demo=state?.demo,latest=state?.latest;
 if(!state?.enabled)return {eligible:false,reason:'global_disabled'};
 if(!demo||demo.approved!==true)return {eligible:false,reason:'not_approved'};
 if(demo.manual_disabled)return {eligible:false,reason:'manual_disabled'};
 if(demo.auto_disabled)return {eligible:false,reason:'suspended'};
 if(!originOf(demo.demo_url))return {eligible:false,reason:'not_https'};
 if(!latest)return {eligible:false,reason:'no_evidence'};
 // The latest run decides, even when an older success is still inside the age limit.
 if(latest.result!=='ok')return {eligible:false,reason:'latest_'+latest.result};
 if(latest.demo_url!==demo.demo_url)return {eligible:false,reason:'url_changed'};
 const f=flags(demo);if(latest.config_id!==configId(f))return {eligible:false,reason:'config_changed'};
 const checked=Date.parse(latest.checked_at);if(!Number.isFinite(checked)||now-checked>MAX_EVIDENCE_AGE_MS||checked-now>5*60000)return {eligible:false,reason:'stale'};
 return {eligible:true,reason:'ok',url:demo.demo_url,flags:f,sandbox:sandbox(f),configId:configId(f),frameOrigins:frameOrigins(demo,latest),checkedAt:latest.checked_at};
}
return {VERSION,MAX_EVIDENCE_AGE_MS,VIEWER_ORIGIN,BASE_SANDBOX,flags,sandbox,configId,originOf,frameOrigins,eligibility};
});
