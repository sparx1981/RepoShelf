(()=>{'use strict';
// Administrator-only: when an administrator has switched on "open demos in the viewer" (Administration > Demo viewer),
// the storefront's Try demo links open the demo inside the viewer as an unqualified preview. Visitors and
// administrators with the setting off never load the viewer and keep the normal new-tab link.
const A=globalThis.RepoAccount;if(!A)return;
let on=false,asked=false,viewer=null,loading=null;
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('load failed'));document.head.append(s)});
function ensureViewer(){return loading||(loading=(async()=>{const css=document.createElement('link');css.rel='stylesheet';css.href='/viewer.css';document.head.append(css);await load('/viewer-config.js');await load('/viewer.js');viewer=globalThis.RepoViewer.create({fetchEligibility:async()=>({eligible:false})})})().catch(()=>{loading=null}))}
async function refresh(){
 if(!A.ready)return;
 if(!A.user?.admin){on=false;asked=false;return}
 if(asked)return;asked=true;
 try{const result=await A.request('/api/viewer?action=my-preview');on=result?.preview===true}catch{on=false}
 if(on)void ensureViewer();
}
window.addEventListener('reposhelf-account',()=>void refresh());void refresh();
document.addEventListener('click',event=>{
 if(!on||!viewer||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest?.('a[data-analytics="demo_click"][href]');if(!link)return;
 const url=link.href,id=link.dataset.project||url;
 event.preventDefault();event.stopImmediatePropagation();
 // The viewer refuses addresses it cannot safely frame (not https, RepoShelf itself); those open in a new tab as before.
 viewer.open({id,url,title:id,preview:true,opener:link}).then(result=>{if(!result.opened)window.open(url,'_blank','noopener,noreferrer')},()=>window.open(url,'_blank','noopener,noreferrer'));
},true);
})();
