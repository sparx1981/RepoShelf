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
//  - A preview open skips those checks. It exists so an administrator can look at an unqualified demo; the bar looks the
//    same, and dialog.dataset.mode ('preview' or 'live') says which it is.
const DEFAULT_TIMEOUT=4000,SVG_NS='http://www.w3.org/2000/svg';
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
  // The bar is the RepoShelf logo with two icon buttons. The demo's name, the third-party label and the preview banner are
  // deliberately not shown; the dialog and frame keep their accessible names, and data-mode records live versus preview.
  const logo=doc.createElement('span');logo.className='viewer-logo';logo.setAttribute('aria-hidden','true');logo.textContent='r.';
  const icon=(...paths)=>{const svg=doc.createElementNS(SVG_NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','20');svg.setAttribute('height','20');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');for(const d of paths){const path=doc.createElementNS(SVG_NS,'path');path.setAttribute('d',d);svg.append(path)}return svg};
  const external=doc.createElement('a');external.className='button outline viewer-icon-button viewer-external';external.href=href;external.target='_blank';external.rel='noopener noreferrer';external.setAttribute('aria-label','Open in new tab');external.title='Open in new tab';external.append(icon('M14 4h6v6','M20 4l-9 9','M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'));
  const closeButton=doc.createElement('button');closeButton.type='button';closeButton.className='button outline viewer-icon-button viewer-close';closeButton.setAttribute('aria-label','Close');closeButton.title='Close';closeButton.append(icon('M6 6l12 12','M18 6L6 18'));closeButton.addEventListener('click',()=>close('closed'));
  bar.append(logo,external,closeButton);dialog.dataset.mode=preview?'preview':'live';
  const frame=doc.createElement('iframe');frame.className='viewer-frame';frame.setAttribute('sandbox',sandbox);frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('title',title+' (third-party demo)');frame.setAttribute('loading','lazy');frame.src=href;
  dialog.append(bar,frame);dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close('closed')}else if(ev.key==='Tab'){const items=[external,closeButton,frame],at=items.indexOf(doc.activeElement);if(ev.shiftKey&&at<=0){ev.preventDefault();items.at(-1).focus()}else if(!ev.shiftKey&&at===items.length-1){ev.preventDefault();items[0].focus()}}});
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
