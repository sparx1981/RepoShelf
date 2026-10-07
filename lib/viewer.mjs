import {createRequire} from 'node:module';
import {respond,readBody,only,fail} from './accounts.mjs';
import {workerAccess} from './submissions.mjs';
import {validListing as listingId} from './listing-policy.mjs';
const validListing=id=>listingId(id)&&!/(^|[:/])\.+(\/|$)/.test(id);
import {validateScenario,scenarioHash} from './viewer-scenario.mjs';
import {probeDemo} from '../scripts/frame-probe.mjs';
const C=createRequire(import.meta.url)('../dist/viewer-config.js');
const rpc=name=>'/rest/v1/rpc/'+name;
const httpsUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=2048?u.href:null}catch{return null}};
const PROFILE=/^((chromium|webkit)(-mobile)?|firefox)$/;
const keys=['enabled','eligible','reason','url','flags','sandbox','configId','frameOrigins','checkedAt'];
// Demo viewer controls. One endpoint, three audiences:
//   visitors   action=eligibility  uncached; answers whether this demo may open inside RepoShelf right now
//   admins     action=list|settings|save|disable  (existing administrator authorization)
//   the job    action=queue|record  (the existing worker key), used by the qualification tool
// Where a Hugging Face Space really runs. The huggingface.co/spaces/... page can never be framed, but the Space's own
// address (owner-space.hf.space, or .static.hf.space for static Spaces) usually can. The address comes from Hugging
// Face's public API, never from the visitor, and must be an https *.hf.space host with no credentials or port.
export async function spaceAppUrl(id,fetcher=fetch){
 const space=String(id||'').replace(/^hf:/,'');if(!/^[\w.-]+\/[\w.-]+$/.test(space))return null;
 try{const response=await fetcher('https://huggingface.co/api/spaces/'+space,{headers:{Accept:'application/json','User-Agent':'RepoShelf-viewer'},redirect:'error',signal:AbortSignal.timeout(5000)});if(!response.ok)return null;const host=new URL(String((await response.json())?.host||''));return host.protocol==='https:'&&host.hostname.endsWith('.hf.space')&&!host.username&&!host.password&&!host.port?host.href:null}catch{return null}
}
// Streamlit Community Cloud apps loop through sign-in redirects when framed normally (measured: 0 of 10 loaded), but load
// when Streamlit's documented embed mode is on (10 of 15 showed content; the rest were asleep).
export function embedFriendly(url){try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname.endsWith('.streamlit.app')&&!u.searchParams.has('embed')){u.searchParams.set('embed','true');return u.href}}catch{}return url}
export function createViewerHandler({accounts,key=process.env.REPOSHELF_SUBMISSION_SYNC_KEY,now=()=>Date.now(),frameProbe=probeDemo,fetcher=fetch}){
 const frameCache=new Map();
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const action=new URL(req.url,accounts.config.origin).searchParams.get('action')||'eligibility';
  if(action==='eligibility'){
   only(req,['GET']);const id=new URL(req.url,accounts.config.origin).searchParams.get('id');
   if(!validListing(id))fail(400,'invalid_id','Use owner/repository or hf:owner/space.');
   // Any trouble means "not eligible", so the visitor simply gets the external demo.
   try{const state=await accounts.request(rpc('reposhelf_viewer_state'),{service:true,method:'POST',body:{p_project:id}});const result=C.eligibility(state,now());return respond(res,200,Object.fromEntries(Object.entries({...result,enabled:state?.enabled===true}).filter(([k])=>keys.includes(k))))}
   catch{return respond(res,200,{eligible:false,reason:'unavailable'})}
  }
  if(['queue','record'].includes(action)){
   only(req,['POST']);workerAccess(req,key);
   if(action==='queue'){const q=await accounts.request(rpc('reposhelf_viewer_queue'),{service:true,method:'POST',body:{}});return respond(res,200,{items:q.items||[],requiredProfiles:q.required_profiles||['chromium'],configVersion:C.VERSION})}
   const b=await readBody(req,{limit:65536});
   if(!validListing(b?.project)||!['ok','failed','inconclusive'].includes(b?.result)||!/^v\d+\|popups=[01]\|downloads=[01]$/.test(b?.configId||'')||!PROFILE.test(b?.browser||'')||!httpsUrl(b?.demoUrl)||typeof b?.scenarioHash!=='string'||b.scenarioHash.length>80)fail(400,'invalid_evidence','Invalid qualification result.');
   const resolved=b.resolvedUrl?httpsUrl(b.resolvedUrl):null;
   return respond(res,200,await accounts.request(rpc('reposhelf_viewer_record'),{service:true,method:'POST',body:{p_project:b.project,p_result:b.result,p_reason:typeof b.reason==='string'?b.reason.slice(0,300):null,p_browser:b.browser,p_config_id:b.configId,p_demo_url:httpsUrl(b.demoUrl),p_resolved_url:resolved,p_scenario_hash:typeof b.scenarioHash==='string'?b.scenarioHash.slice(0,80):null,p_details:b.details&&typeof b.details==='object'&&!Array.isArray(b.details)?b.details:{}}}));
  }
  // administrators
  if(req.method!=='GET')accounts.origin(req);
  const admin=await accounts.admin(req,res);
  if(action==='list'){only(req,['GET']);const data=await accounts.request(rpc('reposhelf_viewer_list'),{service:true,method:'POST',body:{}});return respond(res,200,{...data,config:{version:C.VERSION,maxEvidenceAgeHours:C.MAX_EVIDENCE_AGE_MS/3600000,viewerOrigin:C.VIEWER_ORIGIN,profiles:C.PROFILES},demos:(data.demos||[]).map(d=>({...d,eligibility:C.eligibility({enabled:data.enabled,required_profiles:data.required_profiles,demo:d,latest:d.latest,profiles:d.profiles},now())}))})}
  // Can this demo be shown inside RepoShelf at all? Answered from the demo's real response headers, before the viewer
  // opens, because a refused frame cannot be detected reliably from inside the page. Administrators only for now.
  if(action==='frame-check'){
   only(req,['GET']);const params=new URL(req.url,accounts.config.origin).searchParams,id=params.get('id'),asked=(()=>{try{const u=new URL(params.get('url'));return ['http:','https:'].includes(u.protocol)?u:null}catch{return null}})();
   // An http:// demo address is tried at https:// (many sites, GitHub Pages among them, serve both). The viewer itself only ever frames https.
   const upgraded=asked?.protocol==='http:',url=asked?httpsUrl(upgraded?'https://'+asked.href.slice(7):asked.href):null;
   if(!validListing(id)||!url)fail(400,'invalid_demo','Use a listing id and an http or https demo address.');
   if(C.isOwnOrigin(url))return respond(res,200,{embeddable:false,reason:'own_origin',url});
   const cached=frameCache.get(id+'|'+url);if(cached&&cached.expires>now())return respond(res,200,cached.value);
   let target=embedFriendly(url);
   if(id.startsWith('hf:')&&/^https:\/\/huggingface\.co\/spaces\//.test(url)){const app=await spaceAppUrl(id,fetcher);if(!app){const value={embeddable:false,reason:'no_app_address',url};return respond(res,200,value)}target=app}
   let value;try{const r=await frameProbe(target,{timeout:6000,hops:4});value=r.finalUrl&&C.isOwnOrigin(r.finalUrl)?{embeddable:false,reason:'own_origin',url:target}:{embeddable:r.embeddable===true,reason:r.reason,url:target}}catch{value={embeddable:false,reason:'check_failed',url:target}}
   frameCache.set(id+'|'+url,{value,expires:now()+10*60000});if(frameCache.size>200)frameCache.delete(frameCache.keys().next().value);
   return respond(res,200,value);
  }
  // This administrator's own preview preference. Any trouble reading it means "off", so the demo opens in a new tab.
  if(action==='my-preview'){
   if(req.method==='GET'){let preview=false,available=true;try{preview=(await accounts.request(rpc('reposhelf_viewer_pref_get'),{service:true,method:'POST',body:{p_user:admin.id}}))===true}catch{available=false}return respond(res,200,{preview,available})}
   only(req,['POST']);const b=await readBody(req,{limit:1024});if(typeof b?.preview!=='boolean')fail(400,'invalid_preference','Choose on or off.');
   return respond(res,200,{preview:(await accounts.request(rpc('reposhelf_viewer_pref_set'),{service:true,method:'POST',body:{p_user:admin.id,p_preview:b.preview}}))===true,available:true})
  }
  only(req,['POST']);const b=await readBody(req,{limit:65536});
  if(action==='settings'){const profiles=b?.requiredProfiles;if(b?.enabled!==undefined&&typeof b.enabled!=='boolean'||profiles!==undefined&&(!Array.isArray(profiles)||!profiles.length||profiles.length>6||profiles.some(x=>!C.PROFILES.includes(x)))||b?.enabled===undefined&&profiles===undefined)fail(400,'invalid_settings','Choose on or off, and browser profiles from the list.');return respond(res,200,await accounts.request(rpc('reposhelf_viewer_settings'),{service:true,method:'POST',body:{p_actor:admin.id,p_enabled:b.enabled??null,p_required:profiles?[...new Set(profiles)]:null}}))}
  if(action==='clear-profile'){if(!validListing(b?.project)||!PROFILE.test(b?.browser||''))fail(400,'invalid_request','Choose a demo and a browser profile.');return respond(res,200,await accounts.request(rpc('reposhelf_viewer_clear_profile'),{service:true,method:'POST',body:{p_actor:admin.id,p_project:b.project,p_browser:b.browser}}))}
  if(action==='disable'){if(!validListing(b?.project)||typeof b?.disabled!=='boolean')fail(400,'invalid_request','Choose a demo and a state.');return respond(res,200,await accounts.request(rpc('reposhelf_viewer_disable'),{service:true,method:'POST',body:{p_actor:admin.id,p_project:b.project,p_disabled:b.disabled,p_reason:typeof b.reason==='string'?b.reason.slice(0,300):null}}))}
  if(action==='save'){
   const url=httpsUrl(b?.demoUrl);if(!validListing(b?.project)||!url)fail(400,'invalid_demo','Use a listing id and an https demo address.');
   if(C.isOwnOrigin(url))fail(400,'own_origin','RepoShelf itself cannot be a demo. The frame must stay cross-origin.');
   const checked=validateScenario(b.scenario);if(!checked.ok)fail(400,'invalid_scenario',checked.problems.join(' '));
   return respond(res,200,await accounts.request(rpc('reposhelf_viewer_save'),{service:true,method:'POST',body:{p_actor:admin.id,p_project:b.project,p_demo_url:url,p_scenario:checked.scenario,p_scenario_hash:scenarioHash(checked.scenario),p_popups:b.allowPopups===true,p_downloads:b.allowDownloads===true,p_approved:b.approved===true,p_notes:typeof b.notes==='string'?b.notes.slice(0,1000):null}}))}
  fail(404,'not_found','Unknown viewer action.');
 }}
