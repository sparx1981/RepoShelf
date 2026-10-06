(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./viewer-config.js'));else root.RepoViewer=factory(root.RepoViewerConfig)})(globalThis,function(Config){
'use strict';
// The in-page demo viewer. The administrator harness, the qualification tool and, later, the public storefront all
// use this component, so what is previewed and tested is what a visitor would get.
//  - The new-tab control is visible from the first moment. The viewer never claims a demo worked or failed from a
//    timer or a load event, because neither is reliable for a cross-origin frame.
//  - A normal ("live") open checks eligibility through an uncached endpoint immediately before the frame is created,
//    and again every poll interval and whenever the tab regains focus. The request has a short timeout. If the check
//    fails, times out or reports a different address or configuration, the viewer closes and the caller opens the demo
//    externally. Background tabs throttle timers, so "about a minute" is a foreground target, not a guarantee.
//  - A preview open skips those checks. It exists so an administrator can look at an unqualified demo, and it is
//    labelled so nobody mistakes it for what visitors get.
const DEFAULT_TIMEOUT=4000;
function withTimeout(promise,ms){let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),ms)})]).finally(()=>clearTimeout(timer))}
// The uncached eligibility request used by live opens.
const liveEligibility=(base='')=>id=>fetch(base+'/api/viewer?id='+encodeURIComponent(id),{cache:'no-store',credentials:'omit',signal:globalThis.AbortSignal?.timeout?AbortSignal.timeout(DEFAULT_TIMEOUT):undefined}).then(r=>r.json());
function create({document:doc=globalThis.document,window:win=globalThis.window,fetchEligibility,pollMs=45000,timeoutMs=DEFAULT_TIMEOUT,setInterval:every=globalThis.setInterval?.bind(globalThis),clearInterval:stop=globalThis.clearInterval?.bind(globalThis),onClose}={}){
 let current=null,detach=()=>{};
 const check=async id=>{try{return await withTimeout(fetchEligibility(id),timeoutMs)}catch{return {eligible:false,reason:'unavailable'}}};
 function close(reason){if(!current)return;const c=current;current=null;if(c.timer)stop(c.timer);detach();detach=()=>{};c.dialog.remove();doc.body.classList?.remove('viewer-open');if(c.opener?.focus)c.opener.focus();onClose?.(reason||'closed')}
 async function recheck(){const c=current;if(!c||c.preview)return;const e=await check(c.id);if(current!==c)return;if(!e?.eligible||e.url!==c.url||e.configId!==c.configId)close('disabled')}
 async function open({id,url,flags={},title='Demo',preview=false,opener=doc.activeElement}={}){
  if(current)close('replaced');
  const safe=Config.originOf(url);if(!safe)return {opened:false,reason:'not_https'};
  if(Config.isOwnOrigin(url))return {opened:false,reason:'own_origin'};
  let sandbox=Config.sandbox(flags),configId=Config.configId(flags),href=url;
  if(!preview){
   const e=await check(id);
   if(!e?.eligible||e.url!==url)return {opened:false,reason:e?.reason||'ineligible'};
   sandbox=e.sandbox;configId=e.configId;href=e.url;
  }
  const dialog=doc.createElement('div');dialog.className='viewer-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',title+' (third-party demo)');
  const bar=doc.createElement('div');bar.className='viewer-bar';
  const label=doc.createElement('span');label.className='viewer-label';label.textContent='Third-party demo';
  const name=doc.createElement('strong');name.className='viewer-title';name.textContent=title;
  const external=doc.createElement('a');external.className='button outline viewer-external';external.href=href;external.target='_blank';external.rel='noopener noreferrer';external.textContent='Open in new tab';
  const closeButton=doc.createElement('button');closeButton.type='button';closeButton.className='button outline viewer-close';closeButton.textContent='Close';closeButton.addEventListener('click',()=>close('closed'));
  bar.append(label);if(preview){const banner=doc.createElement('span');banner.className='viewer-banner';banner.textContent='Unqualified preview: eligibility checks are off. Visitors would not see this demo in the viewer unless it passes.';bar.append(banner)}
  bar.append(name,external,closeButton);
  const frame=doc.createElement('iframe');frame.className='viewer-frame';frame.setAttribute('sandbox',sandbox);frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('title',title+' (third-party demo)');frame.setAttribute('loading','lazy');frame.src=href;
  dialog.append(bar,frame);dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.stopPropagation();close('closed')}else if(ev.key==='Tab'){const items=[external,closeButton,frame],at=items.indexOf(doc.activeElement);if(ev.shiftKey&&at<=0){ev.preventDefault();items.at(-1).focus()}else if(!ev.shiftKey&&at===items.length-1){ev.preventDefault();items[0].focus()}}});
  doc.body.append(dialog);doc.body.classList?.add('viewer-open');
  current={dialog,opener,id,url:href,configId,preview,timer:null};closeButton.focus();
  if(!preview){
   if(every)current.timer=every(recheck,pollMs);
   // A tab that was in the background may have missed its timer: check again as soon as it is seen.
   const onVisible=()=>{if(doc.visibilityState!=='hidden')void recheck()};doc.addEventListener?.('visibilitychange',onVisible);win?.addEventListener?.('focus',onVisible);
   detach=()=>{doc.removeEventListener?.('visibilitychange',onVisible);win?.removeEventListener?.('focus',onVisible)};
  }
  return {opened:true,sandbox,configId};
 }
 return {open,close,recheck,isOpen:()=>Boolean(current),mode:()=>current?(current.preview?'preview':'live'):null};
}
return {create,liveEligibility,withTimeout};
});
