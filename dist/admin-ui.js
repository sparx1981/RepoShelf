'use strict';
window.RepoAdminUI=(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rendered=new Map();let toastTimer;
const icons={
 ok:'<path d="M2.5 6.5l2.5 2.5 4.5-5.5"/>',
 bad:'<path d="M3 3l6 6M9 3l-6 6"/>',
 warn:'<path d="M6 2.5v4M6 9v.01"/>',
 live:'<path class="spin" d="M10 6a4 4 0 1 1-1.2-2.8"/>',
 neutral:'<path d="M3 6h6"/>'
};
const tones={success:'ok',completed:'ok',published:'ok',ready:'ok',healthy:'ok',met:'ok',failure:'bad',failed:'bad',timed_out:'bad',startup_failure:'bad',error:'bad',blocked:'bad',in_progress:'live',queued:'live',waiting:'live',pending:'live',requested:'live',running:'live',partial:'warn',warning:'warn',attention:'warn',unknown:'neutral'};
const labels={success:'Succeeded',failure:'Failed',in_progress:'Running',timed_out:'Timed out',startup_failure:'Failed to start'};
const toneOf=status=>tones[String(status||'').toLowerCase()]||'neutral';
function pill(status,label,tone=toneOf(status)){const raw=label??labels[String(status).toLowerCase()]??String(status||'unknown').replaceAll('_',' '),text=raw.charAt(0).toUpperCase()+raw.slice(1);return `<span class="status-pill tone-${tone}"><svg class="pill-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[tone]}</svg>${esc(text)}</span>`}
function errorHtml(message,retry){return `<div class="panel-error" role="alert"><p>${esc(message)}</p>${retry?`<button type="button" class="button outline" data-retry="${esc(retry)}">Try again</button>`:''}</div>`}
const detailStates=slot=>{const seen=new Map(),states=new Map();for(const d of slot.querySelectorAll('details')){const text=d.querySelector(':scope>summary')?.textContent||'',n=seen.get(text)||0;seen.set(text,n+1);states.set(text+'#'+n,d)}return states};
function focusSelector(el,slot){if(!slot.contains(el)||el===slot)return null;if(el.id)return '#'+CSS.escape(el.id);for(const a of el.attributes)if(a.name.startsWith('data-'))return `[${a.name}="${CSS.escape(a.value)}"]`;return null}
function patch(slot,html){
 if(rendered.get(slot.id)===html&&slot.childElementCount)return false;
 const before=new Map([...detailStates(slot)].map(([k,d])=>[k,d.open])),selector=focusSelector(document.activeElement,slot);
 slot.innerHTML=html;rendered.set(slot.id,html);
 for(const [k,d] of detailStates(slot))if(before.has(k))d.open=before.get(k);
 if(selector)slot.querySelector(selector)?.focus({preventScroll:true});
 return true}
function show(slot,html){rendered.delete(slot.id);slot.innerHTML=html}
function clear(slot){rendered.delete(slot.id);slot.innerHTML=''}
function loaded(slot){return rendered.has(slot.id)}
function toast(message,tone){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;if(tone)el.dataset.tone=tone;else delete el.dataset.tone;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000)}
function flag(name,level,text){const el=document.querySelector(`[data-flag="${name}"]`);if(!el)return;el.hidden=!level;el.dataset.level=level||'';el.innerHTML=level?`<span class="sr-only"> — ${esc(text)}</span>`:''}
const clock=value=>new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
function ago(value,now=Date.now()){const ms=now-Date.parse(value);if(!Number.isFinite(ms))return 'at an unknown time';const m=Math.max(0,Math.round(ms/60000));if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' days ago'}

/* ---------- info tips: what a check is, why it exists, how often it runs ---------- */
let tipSeq=0,openTip=null,pinnedTip=null,quiet=false;
const infoIcon='<svg class="info-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5.75"/><path d="M7 6.2v3.6"/><circle cx="7" cy="4.15" r=".4" fill="currentColor"/></svg>';
function info(label,{what,why,often,note}){const id='info-tip-'+(++tipSeq),row=(lead,text)=>text?`<p><strong>${lead}</strong> ${text}</p>`:'';return `<span class="info-tip"><button type="button" class="info-tip-btn" data-info="${id}" aria-label="About ${esc(label)}" aria-expanded="false" aria-controls="${id}">${infoIcon}</button><span class="info-tip-body" role="note" id="${id}" hidden>${row('What is checked.',what)}${row('Why.',why)}${row('How often.',often)}${note?`<p class="info-tip-note">${note}</p>`:''}</span></span>`}
function placeTip(tip){const btn=tip.querySelector('.info-tip-btn'),body=tip.querySelector('.info-tip-body'),r=btn.getBoundingClientRect(),margin=12;body.style.left='0px';body.style.top='0px';const w=body.offsetWidth,h=body.offsetHeight;let left=Math.min(Math.max(margin,r.left+r.width/2-w/2),innerWidth-w-margin),top=r.bottom+8;if(top+h>innerHeight-margin&&r.top-h-8>margin)top=r.top-h-8;body.style.left=Math.max(margin,left)+'px';body.style.top=Math.max(margin,top)+'px'}
function showTip(tip){if(openTip&&openTip!==tip)hideTip(openTip,true);const body=tip.querySelector('.info-tip-body');body.hidden=false;tip.querySelector('.info-tip-btn').setAttribute('aria-expanded','true');placeTip(tip);openTip=tip}
function hideTip(tip,force){if(!tip||(pinnedTip===tip&&!force))return;tip.querySelector('.info-tip-body').hidden=true;tip.querySelector('.info-tip-btn').setAttribute('aria-expanded','false');if(pinnedTip===tip)pinnedTip=null;if(openTip===tip)openTip=null}
const tipOf=e=>e.target instanceof Element?e.target.closest('.info-tip'):null;
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const tip=tipOf(e);if(tip)showTip(tip)});
document.addEventListener('pointerout',e=>{if(e.pointerType==='touch')return;const tip=tipOf(e);if(tip&&!tip.contains(e.relatedTarget)&&document.activeElement!==tip.querySelector('.info-tip-btn'))hideTip(tip)});
document.addEventListener('focusin',e=>{const tip=tipOf(e);if(tip&&!quiet)showTip(tip)});
document.addEventListener('focusout',e=>{const tip=tipOf(e);if(tip&&!tip.contains(e.relatedTarget))hideTip(tip)});
document.addEventListener('click',e=>{const btn=e.target instanceof Element?e.target.closest('.info-tip-btn'):null,tip=btn?.closest('.info-tip');if(tip){e.preventDefault();if(pinnedTip===tip)hideTip(tip,true);else{showTip(tip);pinnedTip=tip}return}if(openTip&&!e.target.closest?.('.info-tip-body'))hideTip(openTip,true)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openTip){const tip=openTip,btn=tip.querySelector('.info-tip-btn'),hadFocus=tip.contains(document.activeElement);hideTip(tip,true);if(hadFocus){quiet=true;btn.focus({preventScroll:true});quiet=false}}});
addEventListener('scroll',()=>{if(openTip)placeTip(openTip)},{capture:true,passive:true});
addEventListener('resize',()=>{if(openTip)placeTip(openTip)});

/* ---------- tables: give every data table column scopes and an accessible name ---------- */
function nameFor(table){let node=table.closest('.help-table-wrap')||table;while(node){let prev=node.previousElementSibling;while(prev){const heading=prev.matches('h2,h3,h4,summary')?prev:prev.querySelector?.('h2,h3,h4');if(heading)return heading.textContent.trim();prev=prev.previousElementSibling}node=node.parentElement;if(node?.matches('details')){const sum=node.querySelector(':scope>summary');if(sum)return sum.textContent.trim()}if(node?.matches('main,body'))break}return ''}
function enhanceTables(root=document){for(const table of root.querySelectorAll('table:not([data-enhanced])')){table.dataset.enhanced='1';for(const th of table.querySelectorAll('thead th:not([scope])'))th.setAttribute('scope','col');for(const th of table.querySelectorAll('tbody th:not([scope])'))th.setAttribute('scope','row');if(!table.hasAttribute('aria-label')&&!table.querySelector('caption')){const name=nameFor(table);if(name)table.setAttribute('aria-label',name)}}}
let enhanceQueued=false;new MutationObserver(()=>{if(enhanceQueued)return;enhanceQueued=true;queueMicrotask(()=>{enhanceQueued=false;enhanceTables()})}).observe(document.documentElement,{childList:true,subtree:true});
/* elapsed time as "45 s", "14 min 32 s" or "1 h 05 min"; null when the span is not a valid positive duration */
function duration(from,to){const at=v=>v==null?NaN:new Date(v).getTime(),ms=at(to)-at(from);if(!Number.isFinite(ms)||ms<0)return null;const total=Math.round(ms/1000);if(total<60)return total+' s';const m=Math.floor(total/60),sec=total%60;if(m<60)return m+' min '+String(sec).padStart(2,'0')+' s';const h=Math.floor(m/60);return h+' h '+String(m%60).padStart(2,'0')+' min'}
return {esc,pill,toneOf,errorHtml,patch,show,clear,loaded,toast,flag,clock,ago,duration,info,enhanceTables};
})();
