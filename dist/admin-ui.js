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
return {esc,pill,toneOf,errorHtml,patch,show,clear,loaded,toast,flag,clock,ago};
})();
