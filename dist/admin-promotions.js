'use strict';
// The Promotions tab of Administration: review requests, approve or reject them, refund test payments and check availability.
// Owners request and pay for promotions on the standalone /promotions.html page; this is the administrator's view of those requests.
(()=>{
const A=RepoAccount,$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let items=[],cursor=null,busy=false,started=false;
const say=(text,error)=>{const m=$('#promotion-message');if(!m)return;m.textContent=text;if(error)m.dataset.tone='error';else delete m.dataset.tone};
const api=(action,body)=>A.request('/api/promotions?action='+action,{signal:AbortSignal.timeout(55000),...(body?{method:'POST',body:JSON.stringify(body)}:{})});
const labels={pending:'Awaiting approval',approved:'Approved — ready for test checkout',rejected:'Not approved',checkout:'Checkout reserved',paid_waiting:'Paid — waiting for activation',active:'Active test promotion',paused:'Paused — remaining time saved',expired:'Completed',refunded:'Refunded'};
function render(){
 $('#promotion-list').innerHTML=items.length?items.map(p=>{const left=Math.max(0,Number(p.remaining_seconds)-(p.status==='active'&&p.active_since?(Date.now()-Date.parse(p.active_since))/1000:0)),days=left/86400;return `<article class="promotion-record"><span class="promotion-status">${esc(labels[p.status]||p.status)}</span><h3>${esc(p.snapshot.name||p.repo_name)}</h3><p><a href="https://github.com/${esc(p.repo_name)}" target="_blank" rel="noopener">${esc(p.repo_name)} ↗</a></p><p>${esc(p.snapshot.description)}</p><p>£15 · ${p.paid_at?days.toFixed(1)+' active days remaining':'30 active days after payment'} · No renewal</p>${p.review_note?`<p>Administrator: ${esc(p.review_note)}</p>`:''}${p.pause_reason?`<p>${esc(p.pause_reason)}. The unused time is preserved.</p>`:''}${p.health_checked_at?`<p class="small">Availability checked ${esc(new Date(p.health_checked_at).toLocaleString())}</p>`:''}${['pending','approved'].includes(p.status)?`<label>Review note<textarea data-note="${p.id}" maxlength="500" placeholder="Explain your decision"></textarea></label><div class="account-actions"><button class="button lime" data-action="approved" data-id="${p.id}">Approve request</button><button class="button outline" data-action="rejected" data-id="${p.id}">Reject request</button></div>`:''}${p.payment_intent&&p.status!=='refunded'?`<button class="button outline" data-action="refund" data-id="${p.id}">Refund full test payment</button>`:''}</article>`}).join(''):'<p class="loading-note">No promotion requests yet.</p>';
 $('#promotion-more').hidden=!cursor;$('#promotion-list').querySelectorAll('button').forEach(b=>b.disabled=busy);
}
async function load(append=false){
 const data=await api('manage'+(append&&cursor?'&cursor='+encodeURIComponent(cursor):''));
 items=append?[...items,...data.items]:data.items;cursor=data.nextCursor;
 $('#promotion-setup').hidden=data.checkoutReady;if(!data.checkoutReady)$('#promotion-setup').textContent='Test checkout needs administrator setup: apply migration 6, configure Stripe test credentials and the signed webhook. Requests can still be reviewed; real payments are disabled.';
 render();
}
async function task(fn){if(busy)return;busy=true;render();say('');try{await fn()}catch(e){say(e.message,true)}finally{busy=false;render()}}
function bind(){
 $('#promotion-list').onclick=e=>{const button=e.target.closest('[data-action]');if(!button)return;void task(async()=>{const id=button.dataset.id,action=button.dataset.action;if(['approved','rejected'].includes(action)){const note=$(`[data-note="${id}"]`).value;await api('review',{id,decision:action,note});await load();say(action==='approved'?'Approved. The owner can use test checkout.':'Request rejected.')}else if(action==='refund'){if(!confirm('Refund the full test payment and end this promotion?'))return;await api(action,{id});await load();say('Test payment refunded.')}})};
 $('#refresh-promotions').onclick=()=>void task(()=>load());
 $('#promotion-more').onclick=()=>void task(()=>load(true));
 $('#sync-promotions').onclick=()=>void task(async()=>{const result=await api('admin-sync',{});await load();say(`Checked ${result.checked} promotions${result.failed?' · '+result.failed+' checks need retry':''}.`)});
}
// Started when the Promotions tab is first opened, and again on every later visit to refresh.
window.RepoAdminPromotions={start(){if(!A.user?.admin)return;if(!started){started=true;bind()}void task(()=>load())}};
})();
