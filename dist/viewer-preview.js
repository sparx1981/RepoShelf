(()=>{'use strict';
// Opens the storefront's Try demo links inside the viewer as an unqualified preview (after the server confirms from the
// demo's response headers that it can be framed; otherwise it opens in a new tab). It applies to an administrator who has
// switched it on for their own account, and to every visitor while an administrator has switched on the all-users setting
// (Administration > Demo viewer). Otherwise the viewer code is never downloaded and the normal new-tab link is kept.
const A=globalThis.RepoAccount;if(!A)return;
let on=false,askedFor=null,viewer=null,loading=null;
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('load failed'));document.head.append(s)});
function ensureViewer(){return loading||(loading=(async()=>{const css=document.createElement('link');css.rel='stylesheet';css.href='/viewer.css';document.head.append(css);await load('/viewer-config.js');await load('/viewer.js');viewer=globalThis.RepoViewer.create({fetchEligibility:async()=>({eligible:false}),onClose:restoreListing})})().catch(()=>{loading=null}))}
// The all-users setting is the same for everyone, so the server lets the CDN reuse the answer for a short while.
// Nothing is stored in the visitor's browser.
async function allUsers(){try{return (await A.request('/api/viewer?action=public-preview'))?.allUsers===true}catch{return false}}
async function refresh(){
 if(!A.ready)return;
 const who=A.user?.id||'visitor';if(askedFor===who)return;askedFor=who;
 let mine=false;
 if(A.user?.admin){try{mine=(await A.request('/api/viewer?action=my-preview'))?.preview===true}catch{}}
 const everyone=mine?false:await allUsers();
 if(askedFor!==who)return;
 on=mine||everyone;
 if(on)void ensureViewer();
}
window.addEventListener('reposhelf-account',()=>void refresh());void refresh();
// Small status line while the check runs, and the way out if the browser blocks the automatic new tab.
let note=null,noteTimer=null;
function say(text,link){if(!note){note=document.createElement('div');note.setAttribute('role','status');note.className='viewer-preview-note';note.style.cssText='position:fixed;left:50%;top:auto;right:auto;bottom:20px;margin:0;width:max-content;transform:translateX(-50%);z-index:2147483000;max-width:min(92vw,560px);padding:12px 16px;border-radius:12px;background:#1b1b1f;color:#fff;border:1px solid #3a3a42;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45)';document.body.append(note);
  // A modal listing is in the browser's top layer and would cover this note; a popover joins the top layer above it.
  if(note.showPopover){try{note.setAttribute('popover','manual');note.showPopover()}catch{}}}
 note.replaceChildren(document.createTextNode(text));if(link){const a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' Open in new tab';a.style.cssText='color:#d9ff6a;margin-left:6px';a.addEventListener('click',()=>hide());note.append(a)}
 clearTimeout(noteTimer);noteTimer=setTimeout(hide,link?20000:8000)}
function hide(){clearTimeout(noteTimer);note?.remove();note=null}
const REASONS={x_frame_options_deny:'the site forbids being shown inside another page',x_frame_options_sameorigin:'the site forbids being shown inside another page',frame_ancestors_none:'the site forbids being shown inside another page',frame_ancestors_self:'the site forbids being shown inside another page',frame_ancestors_other:'the site only allows certain pages to show it',own_origin:'it is hosted on RepoShelf',no_app_address:'its app address could not be found'};
// The listing is a modal <dialog>; left open it sits above the viewer and the person has to close it by hand.
let hidden=null;
function closeListing(opener){const dialogs=[...document.querySelectorAll('dialog[open]')];for(const d of dialogs){try{d.close()}catch{}}hidden=dialogs.length?{dialogs,opener}:null;document.querySelector('.viewer-close')?.focus()}
// Closing the demo brings the listing back where it was, with focus on the Try demo link that opened the demo.
// Deferred a moment: the Escape key that closed the demo would otherwise also be taken as "close" by the dialog just reopened.
function restoreListing(reason){const h=hidden;hidden=null;if(!h||reason!=='closed')return;setTimeout(()=>{for(const d of h.dialogs){try{if(d.isConnected&&!d.open)d.showModal()}catch{}}try{h.opener?.focus()}catch{}},0)}
const checks=new Map();
// Asks the server, from the demo's real response headers, whether it can be framed at all, and where a Hugging Face Space
// really runs. Anything uncertain (timeout, error, unreachable) means a new tab, never a blank frame.
function frameCheck(id,url){const key=id+'|'+url;if(!checks.has(key))checks.set(key,A.request('/api/viewer?action=frame-check&id='+encodeURIComponent(id)+'&url='+encodeURIComponent(url)).catch(()=>({embeddable:false,reason:'check_failed',url})));return checks.get(key)}
// No 'noopener' feature: it makes window.open return null even when the tab opens, hiding whether the browser blocked it.
function newTab(url,reason){const w=window.open(url,'_blank');if(w){try{w.opener=null}catch{}hide();return}say('This demo opens in a new tab'+(reason?' ('+reason+')':'')+'. Your browser blocked it automatically.',url)}
document.addEventListener('click',event=>{
 if(!on||!viewer||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest?.('a[data-analytics="demo_click"][href]');if(!link)return;
 const url=link.href,id=link.dataset.project||url;
 event.preventDefault();event.stopImmediatePropagation();
 say('Warming up the demo\u2026');
 frameCheck(id,url).then(result=>{
  if(!result?.embeddable||!result.url)return newTab(url,REASONS[result?.reason]||'it cannot be shown inside RepoShelf');
  hide();
  // The viewer still refuses addresses it cannot safely frame (not https, RepoShelf itself); those open in a new tab as before.
  return viewer.open({id,url:result.url,title:id,preview:true,opener:link}).then(opened=>{if(!opened.opened)return newTab(url);closeListing(link)});
 }).catch(()=>newTab(url));
},true);
})();
