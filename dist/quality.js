(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoQuality=factory()})(globalThis,function(){
'use strict';
// Public pages judge freshness as of the saved catalogue's snapshot time, not the visitor's clock. Evidence is
// verified when the catalogue is generated and nothing in a browser can refresh it, so judging it against the
// current time made listings vanish between daily publications. If the snapshot is older than the grace
// period (or in the future), freshness falls back to the real clock so stale catalogues are never shown as fresh.
const EVIDENCE_GRACE=72*3600000;let evidenceAt=null;
function evidenceTime(updatedAt,now=Date.now(),grace=EVIDENCE_GRACE){const t=Date.parse(updatedAt);return Number.isFinite(t)&&t<=now&&now-t<=grace?t:now}
function setEvidenceTime(updatedAt){evidenceAt=updatedAt||null}
const clock=()=>evidenceAt?evidenceTime(evidenceAt):Date.now();
function demoState(r){return r.demoHealth?.url===r.demo?r.demoHealth:null}
function hasLiveDemo(r){return Boolean(r.demo)&&demoState(r)?.status!=='unavailable'}
// Why a listing cannot be featured (the spotlight and Editor's picks), as plain reason codes; empty means it can be.
// Strict (automatic fill-ins): the repository was checked within 2 days and the demo within 7, with a clean latest check.
// Lenient (listings an administrator chose by hand): a missed or failed check, for example during a sync outage, never
// removes a pick on its own. Only a real problem does (hidden, unavailable, demo not working, no screenshot), or
// evidence older than 60 days, so an abandoned listing cannot stay forever.
const LENIENT_DAYS=60;
function featuredIssues(r,now=clock(),{lenient=false}={}){
 if(!r)return ['not_in_catalogue'];
 const issues=[],h=demoState(r),day=86400000,age=t=>Number.isFinite(Date.parse(t))?(now-Date.parse(t))/day:Infinity;
 if(r.listingControl&&r.listingControl!=='visible')issues.push('hidden');
 if(r.availability!=='available')issues.push('unavailable');
 if(!r.demo)issues.push('no_demo');else if(!h)issues.push('demo_unchecked');else if(h.status!=='working')issues.push('demo_not_working');else if(!lenient&&h.error)issues.push('demo_check_failed');
 if(!(r.screenshots||[]).some(s=>s.kind==='demo'&&typeof s.src==='string'&&/^(?:\/?previews\/[a-f0-9]{24}(?:-provider)?\.jpg|https?:\/\/)/.test(s.src)&&(!s.url||s.url===r.demo)))issues.push('no_screenshot');
 const repoMax=lenient?LENIENT_DAYS:2,demoMax=lenient?LENIENT_DAYS:7;
 if(!r.lastCheckedAt||age(r.lastCheckedAt)>repoMax)issues.push('repository_check_old');
 if(h?.status==='working'&&(!h.checkedAt||age(h.checkedAt)>demoMax))issues.push('demo_check_old');
 return issues;
}
function featuredEligible(r,now=clock(),options){return featuredIssues(r,now,options).length===0}
const issueText={not_in_catalogue:'Not in the catalogue',hidden:'Hidden by an administrator',unavailable:'Repository unavailable',no_demo:'No demo link',demo_unchecked:'Demo not checked yet',demo_not_working:'Demo is not working',demo_check_failed:'Latest demo check failed',no_screenshot:'No demo screenshot',repository_check_old:'Repository not checked recently',demo_check_old:'Demo not checked recently'};
function capturedDemo(r){return (r.screenshots||[]).some(s=>s.kind==='demo'&&typeof s.src==='string'&&/^(?:\/?previews\/[a-f0-9]{24}(?:-provider)?\.jpg|https?:\/\/)/.test(s.src)&&(!s.url||s.url===r.demo))}
function publishedEligible(r,now=clock()){const h=demoState(r);return (!r.listingControl||r.listingControl==='visible')&&r.availability==='available'&&Boolean(r.lastCheckedAt)&&now-Date.parse(r.lastCheckedAt)<=2*86400000&&h?.status==='working'&&Boolean(h.checkedAt)&&now-Date.parse(h.checkedAt)<=7*86400000&&capturedDemo(r)}
function catalogueState(r,now=clock()){if(r.availability==='unavailable'||demoState(r)?.status==='unavailable')return 'unavailable';if(publishedEligible(r,now))return 'published';const h=demoState(r),p=r.previewCheck?.url===r.demo?r.previewCheck:null;return (h?.consecutiveTemporaryFailures||0)>=3||(p?.consecutiveFailures||0)>=3?'quarantined':'pending'}
function demoLabel(r){const health=demoState(r);return !r.demo?'No demo link':health?.status==='unavailable'?'Demo unavailable':health?.status==='working'?'Demo checked':health?.status==='review'?'Demo needs review':health?.error?'Check inconclusive':'Demo not checked yet'}
function licenseInfo(r){const raw=typeof r.license==='string'?r.license.trim():'';const canonical={'mit':'MIT','isc':'ISC','apache-2.0':'Apache-2.0','bsd-2-clause':'BSD-2-Clause','bsd-3-clause':'BSD-3-Clause','bsd-4-clause':'BSD-4-Clause','zlib':'Zlib','unlicense':'Unlicense','mpl-2.0':'MPL-2.0','cc0-1.0':'CC0-1.0'};const id=canonical[raw.toLowerCase()]||raw.replace(/^(a?gpl|lgpl|cc-by)/i,s=>s.toUpperCase());if(!id||id==='NOASSERTION')return {id:null,title:'No licence detected',text:'No recognised licence was detected in the saved metadata. A public repository does not automatically grant permission to reuse its code. Review the repository terms before reusing its code.'};const official=/^(?:MIT|ISC|Apache-2\.0|BSD-[234]-Clause|Zlib|Unlicense|MPL-2\.0|(?:A?GPL|LGPL)-[23](?:\.[01])?(?:-only|-or-later)?|CC(?:0|-[A-Z-]+)-[134]\.0)$/.test(id)?`https://spdx.org/licenses/${encodeURIComponent(id)}.html`:null;
if(/^(MIT|ISC|Apache-2\.0|BSD-[234]-Clause|Zlib|Unlicense|CC0-1\.0)$/.test(id))return {id,url:official,title:'Permissive licence',text:'Generally permits modification and commercial use, subject to the licence’s notices and conditions.'};
if(/^AGPL-/.test(id))return {id,url:official,title:'Network copyleft licence',text:'Source-sharing conditions can apply when modified software is used over a network. Review the exact licence terms.'};
if(/^GPL-/.test(id))return {id,url:official,title:'Copyleft licence',text:'Distributing the software or derivatives can require sharing source under the same licence.'};
if(/^LGPL-/.test(id))return {id,url:official,title:'Library copyleft licence',text:'Changes and distribution carry source-sharing and notice conditions; linking rules depend on the licence version.'};
if(id==='MPL-2.0')return {id,url:official,title:'File-level copyleft licence',text:'Distributed changes to covered files must stay under this licence. Other files can use different licences.'};
if(/(?:^|-)NC(?:-|$)|non.?commercial/i.test(id))return {id,url:official,title:'Non-commercial terms',text:'Commercial use is restricted. Check the full licence and which parts of the project it covers.'};
return {id,url:official,title:'Review licence terms',text:'Review the declared licence and what it covers before modifying, hosting, or distributing this project.'}}
return {demoState,hasLiveDemo,demoLabel,licenseInfo,featuredEligible,featuredIssues,issueText,LENIENT_DAYS,capturedDemo,publishedEligible,catalogueState,evidenceTime,setEvidenceTime};
});
