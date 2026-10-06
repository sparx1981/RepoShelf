(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./viewer-config.js'));else root.RepoViewer=factory(root.RepoViewerConfig)})(globalThis,function(Config){
'use strict';
// The in-page demo viewer. The admin harness and, later, the public storefront share this component, so what an
// administrator previews is exactly what a visitor would get.
//  - The new-tab control is visible from the first moment. The viewer never claims a demo worked or failed from a
//    timer or a load event, because neither is reliable for a cross-origin frame.
//  - Unless this is an administrator preview, eligibility is checked through an uncached endpoint immediately
//    before the frame is created, and again while the viewer stays open. If the check fails the viewer closes and
//    the caller opens the demo externally.
function create({document:doc=globalThis.document,fetchEligibility,pollMs=45000,setInterval:every=globalThis.setInterval?.bind(globalThis),clearInterval:stop=globalThis.clearInterval?.bind(globalThis),onClose}={}){
 let current=null;
 function close(reason){if(!current)return;const c=current;current=null;if(c.timer)stop(c.timer);c.dialog.remove();doc.body.classList?.remove('viewer-open');if(c.opener?.focus)c.opener.focus();onClose?.(reason||'closed')}
 async function open({id,url,flags={},title='Demo',preview=false,opener=doc.activeElement}={}){
  if(current)close('replaced');
  const safe=Config.originOf(url);if(!safe)return {opened:false,reason:'not_https'};
  let sandbox=Config.sandbox(flags),configId=Config.configId(flags),href=url;
  if(!preview){
   let e;try{e=await fetchEligibility(id)}catch{e={eligible:false,reason:'unavailable'}}
   if(!e?.eligible||e.url!==url)return {opened:false,reason:e?.reason||'ineligible'};
   sandbox=e.sandbox;configId=e.configId;href=e.url;
  }
  const dialog=doc.createElement('div');dialog.className='viewer-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',title+' (third-party demo)');
  const bar=doc.createElement('div');bar.className='viewer-bar';
  const label=doc.createElement('span');label.className='viewer-label';label.textContent='Third-party demo';
  const name=doc.createElement('strong');name.className='viewer-title';name.textContent=title;
  const external=doc.createElement('a');external.className='button outline viewer-external';external.href=href;external.target='_blank';external.rel='noopener noreferrer';external.textContent='Open in new tab';
  const closeButton=doc.createElement('button');closeButton.type='button';closeButton.className='button outline viewer-close';closeButton.textContent='Close';closeButton.addEventListener('click',()=>close('closed'));
  bar.append(label,name,external,closeButton);
  const frame=doc.createElement('iframe');frame.className='viewer-frame';frame.setAttribute('sandbox',sandbox);frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('title',title+' (third-party demo)');frame.setAttribute('loading','lazy');frame.src=href;
  dialog.append(bar,frame);dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.stopPropagation();close('closed')}else if(ev.key==='Tab'){const items=[external,closeButton,frame],at=items.indexOf(doc.activeElement);if(ev.shiftKey&&at<=0){ev.preventDefault();items.at(-1).focus()}else if(!ev.shiftKey&&at===items.length-1){ev.preventDefault();items[0].focus()}}});
  doc.body.append(dialog);doc.body.classList?.add('viewer-open');
  current={dialog,opener,id,configId,preview,timer:null};closeButton.focus();
  if(!preview&&every)current.timer=every(async()=>{if(!current||current.id!==id)return;let e;try{e=await fetchEligibility(id)}catch{e={eligible:false,reason:'unavailable'}}if(!e?.eligible||e.configId!==current.configId)close('disabled')},pollMs);
  return {opened:true,sandbox,configId};
 }
 return {open,close,isOpen:()=>Boolean(current)};
}
return {create};
});
