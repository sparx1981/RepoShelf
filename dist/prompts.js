'use strict';
(()=>{
const A=window.RepoAccount,$=s=>document.querySelector(s),API='/api/prompts',PAGE=48,KEEP='reposhelf.prompts.open';
let saved=new Set(),savedFor=null,items=[],shown=PAGE,current=null,full=null,fullFor=null,tab='live',liveFor=null,customiser=null,liveBase=null,liveDirty=false,customiserFor=null,onCustom=()=>{liveDirty=true};
const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v)}n.append(...kids);return n};
const key=i=>i.source+'/'+i.id;
const signedIn=()=>Boolean(A?.user),track=(kind,item)=>{try{A?.track?.(kind,key(item||current))}catch{}};
async function getJson(url){const r=await fetch(url,{credentials:'same-origin'}),d=await r.json().catch(()=>null);if(!r.ok||!d){const e=new Error(d?.error?.message||'Something went wrong. Please try again.');e.status=r.status;e.code=d?.error?.code;throw e}return d}

/* ---------- browse ---------- */
function filtered(){const q=$('#prompt-search').value.trim().toLowerCase(),c=$('#prompt-category').value;return items.filter(i=>(!c||i.category===c)&&(!q||(i.title+' '+i.description+' '+i.category).toLowerCase().includes(q)))}
function render(){const list=filtered(),grid=$('#prompt-grid');grid.replaceChildren();for(const i of list.slice(0,shown)){const card=el('button',{class:'prompt-card',type:'button','aria-label':'Open '+i.title});
 card.append(i.thumbnail?Object.assign(el('img',{alt:'',loading:'lazy',decoding:'async',referrerpolicy:'no-referrer'}),{src:i.thumbnail}):el('div',{class:'no-thumb'+(i.kind==='text'?' text':'')},...(i.kind==='text'?[el('span',{text:window.RepoPromptFields?.supported(key(i))?'Fill-in prompt':'Prompt'})]:[])),el('div',{class:'body'},el('span',{class:'tag',text:i.category}),el('h3',{text:i.title}),el('p',{text:i.description})));
 card.onclick=()=>open(i);grid.append(el('li',{class:'prompt-item'},card,heart(i,'prompt-like')))}
 $('#prompt-count').textContent=list.length?`${list.length} ${list.length===1?'prompt':'prompts'}`:'Nothing matches that search.';$('#prompt-more').hidden=list.length<=shown}
$('#prompt-filters').addEventListener('submit',e=>e.preventDefault());
$('#prompt-search').addEventListener('input',()=>{shown=PAGE;render()});$('#prompt-category').addEventListener('change',()=>{shown=PAGE;render()});
$('#prompt-more').onclick=()=>{shown+=PAGE;render()};

/* ---------- saved prompts (shown in My collection) ---------- */
const pid=i=>'ss:'+key(i);
function heart(item,cls){const on=saved.has(pid(item)),b=el('button',{class:cls,type:'button','aria-pressed':String(on),'aria-label':(on?'Remove from my collection: ':'Save to my collection: ')+item.title,title:on?'Saved to My collection':'Save to My collection'});b.textContent=on?'♥':'♡';b.dataset.heart=pid(item);
 b.onclick=async e=>{e.stopPropagation();if(!signedIn()){try{sessionStorage.setItem(KEEP,JSON.stringify({key:key(item),tab:'live',at:Date.now()}))}catch{}location.href='/api/auth?action=start&return=%2Fprompts.html';return}
  if(b.disabled)return;b.disabled=true;const was=saved.has(pid(item));try{await A.request('/api/collection',{method:was?'DELETE':'PUT',body:JSON.stringify({id:pid(item)})});was?saved.delete(pid(item)):saved.add(pid(item));paintHearts();$('#prompt-count').textContent=was?'Removed from My collection.':'Saved to My collection.'}catch(err){if(err.status===428)location.href='/legal.html';else $('#prompt-count').textContent=err.message}finally{b.disabled=false}};
 return b}
function paintHearts(){document.querySelectorAll('[data-heart]').forEach(b=>{const on=saved.has(b.dataset.heart);b.textContent=on?'♥':'♡';b.setAttribute('aria-pressed',String(on));b.title=on?'Saved to My collection':'Save to My collection';b.setAttribute('aria-label',b.getAttribute('aria-label').replace(/^(Remove from my collection|Save to my collection): /,(on?'Remove from my collection':'Save to my collection')+': '))})}
async function loadSaved(){const id=A?.user?.id||null;if(id===savedFor)return;savedFor=id;saved=new Set();if(id){try{const d=await A.request('/api/collection?kind=prompts');if(savedFor===id)saved=new Set((d.items||[]).map(x=>x.id))}catch{}}paintHearts()}

/* ---------- detail ---------- */
const dialog=$('#prompt-dialog'),tabs=['live','prompt','code'];
function setTab(name,focus){tab=name;for(const t of tabs){const on=t===name;$('#tab-'+t).setAttribute('aria-selected',on);$('#tab-'+t).tabIndex=on?0:-1;$('#panel-'+t).hidden=!on}if(focus)$('#tab-'+name).focus();if(name!=='live')void showGated(name);else if(liveDirty)applyLive()}
const shownTabs=()=>tabs.filter(t=>!$('#tab-'+t).hidden);
for(const t of tabs){$('#tab-'+t).onclick=()=>setTab(t);$('#tab-'+t).onkeydown=e=>{const list=shownTabs(),i=list.indexOf(t),n=e.key==='ArrowRight'?(i+1)%list.length:e.key==='ArrowLeft'?(i+list.length-1)%list.length:-1;if(n>=0){e.preventDefault();setTab(list[n],true)}}}
function open(item){current=item;full=null;fullFor=null;liveFor=null;customiser=null;customiserFor=null;onCustom=()=>{liveDirty=true};liveBase=null;liveDirty=false;$('#prompt-title').textContent=item.title;$('#prompt-like-slot').replaceChildren(heart(item,'prompt-like inline'));const credit=$('#prompt-credit');credit.hidden=!item.credit;credit.replaceChildren();if(item.credit){credit.append('Originally made by ',el('a',{href:item.credit.url,rel:'noopener noreferrer',target:'_blank',text:item.credit.name}),'. Shown here with a link back.')}
 try{history.replaceState(null,'','#'+key(item))}catch{}
 const textOnly=item.kind==='text';$('#tab-live').hidden=textOnly;$('#tab-code').hidden=textOnly;
 if(!dialog.open)dialog.showModal();setTab(textOnly?'prompt':'live');track('prompt_view',item);if(!textOnly){void loadLive(item);void prepare(item)}}
dialog.addEventListener('close',()=>{$('#live-frame').srcdoc='';liveFor=null;try{history.replaceState(null,'',location.pathname)}catch{}});
$('#prompt-close').onclick=()=>dialog.close();
// Only a click on the backdrop closes the dialog. The dialog's own padding is part of the dialog element, so a tap there has the dialog as
// its target too: compare where the click landed with the dialog's box. A click with no position (the keyboard) never closes it.
dialog.addEventListener('click',e=>{if(e.target!==dialog||(!e.clientX&&!e.clientY))return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
const LIVE_NOTE='This is a live page. It runs in a sealed frame.';
// The Live page follows the Customise boxes (colours, fonts, words and links) using only what the browser already has.
function applyLive(){if(!customiser||liveBase==null)return;$('#live-frame').srcdoc=customiser.html(liveBase);liveDirty=false;$('#live-status').textContent=customiser.changed()?'Showing your colours, fonts, words and links where this page uses the same ones. It runs in a sealed frame.':LIVE_NOTE}
async function loadLive(item){const status=$('#live-status'),frame=$('#live-frame');frame.srcdoc='';status.textContent='Loading the page…';liveFor=key(item);try{const d=await getJson(`${API}?area=preview&source=${item.source}&id=${encodeURIComponent(item.id)}`);if(liveFor!==key(item))return;liveBase=d.html;if(customiser&&customiser.changed()){applyLive()}else{frame.srcdoc=d.html;status.textContent=LIVE_NOTE}}catch(e){if(liveFor!==key(item))return;if(e.status===404){noPage(item);return}status.textContent=e.message}}
// A page prompt without a generated page yet (a new import) is a prompt-only listing: hide the Live and Code views and show the prompt.
function noPage(item){if(current!==item)return;$('#live-status').textContent='This page has no live version yet.';$('#tab-live').hidden=true;$('#tab-code').hidden=true;if(tab==='live'||tab==='code')setTab('prompt')}

function lock(panel,what){panel.replaceChildren(el('div',{class:'prompt-lock'},el('h3',{text:what==='the code'?'Sign in to copy the code':'Sign in to see '+what}),el('p',{text:what==='the code'?'The live page is open to everyone, so a browser can already show its source. Signing in with GitHub gives you the code with a copy button and the download.':'Browsing is open to everyone. Signing in with GitHub unlocks the prompt, the code and the download.'}),el('a',{class:'button lime',href:'/api/auth?action=start&return=%2Fprompts.html',text:'Sign in with GitHub'})));const a=panel.querySelector('a');a.onclick=()=>{track('lock_signin');try{sessionStorage.setItem(KEEP,JSON.stringify({key:key(current),tab,at:Date.now()}))}catch{}}}
// The member's own boards (My collection), for the Reference board dropdown on prompts that have one.
const boardSource={list:()=>getJson('/api/collection?action=boards'),get:id=>getJson('/api/collection?action=boards&board='+encodeURIComponent(id))};
async function ensureFull(){if(full&&fullFor===key(current))return full;const item=current;const d=await getJson(`${API}?area=bundle&source=${item.source}&id=${encodeURIComponent(item.id)}`);if(current!==item)return null;full=d;fullFor=key(item);return d}
// The Customise boxes are read from the prompt as soon as a member opens a page prompt, so the Live page already shows their saved colours,
// fonts and words, and the Code tab and the download carry them too, without opening the Prompt tab first.
function customiserOf(item,d){
 if(item.kind==='text'||d.html==null||window.RepoPromptFields?.supported(key(item)))return null;
 if(customiser&&customiserFor===key(item))return customiser;
 customiser=window.RepoPromptCustomise?.mount(key(item),d.prompt,{html:d.html,onChange:()=>onCustom()})||null;customiserFor=customiser?key(item):null;return customiser}
async function prepare(item){
 if(!signedIn())return;
 try{const d=await ensureFull();if(!d||current!==item)return;if(d.html==null){noPage(item);return}
  const c=customiserOf(item,d);if(c){liveBase??=d.html;if(c.changed()){liveDirty=true;if(tab==='live'&&liveFor===key(item))applyLive()}}}catch{}}
const pageHtml=d=>customiser&&customiserFor===key(current)&&customiser.changed()?customiser.html(d.html):d.html;
function download(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000)}
async function copy(text,status,msg){try{await navigator.clipboard.writeText(text);status.textContent=msg}catch{status.textContent='Copy was unavailable. Select the text and copy it manually.'}}
function aiLinks(prompt){const wrap=document.createDocumentFragment(),enc=encodeURIComponent(prompt);const long=enc.length>6000;for(const[name,base]of[['Claude','https://claude.ai/new?q='],['ChatGPT','https://chatgpt.com/?q=']]){const a=el('a',{class:'button outline',href:long?base.split('?')[0]:base+enc,text:'Open in '+name,rel:'noopener noreferrer',target:'_blank'});a.addEventListener('click',()=>track('ai_open'));if(long)a.title='This prompt is long. Copy it first, then paste it in.';wrap.append(a)}return wrap}
async function showGated(name){const panel=$('#panel-'+name);if(!signedIn()){lock(panel,name==='prompt'?'the prompt':'the code');return}
 panel.replaceChildren(el('p',{class:'prompt-note',text:'Loading…',role:'status'}));const item=current;
 try{const d=await ensureFull();if(!d||current!==item||tab!==name)return;track(name==='prompt'?'prompt_reveal':'code_reveal',item);const status=el('p',{class:'prompt-note',role:'status'});
  if(name==='prompt'){
   // Motion film director has its own brief boxes; other page prompts get boxes built from their own text.
   const fields=window.RepoPromptFields?.mount(key(item),d.prompt,{onChange:refresh,boards:boardSource}),custom=fields?null:customiserOf(item,d),form=fields||custom;
   const now=()=>form?form.text():d.prompt,pre=fields?null:el('pre',{class:'prompt-text',text:now()}),links=el('span',{class:'prompt-actions-links'},aiLinks(now()));
   const copyLabel=()=>fields?'Copy finished prompt':custom&&custom.changed()?'Copy customised prompt':'Copy prompt',copyButton=Object.assign(el('button',{class:'button lime',type:'button',text:copyLabel()}),{onclick:()=>{track('prompt_copy',item);copy(now(),status,fields?'Finished prompt copied.':custom&&custom.changed()?'Customised prompt copied.':'Prompt copied.')}});
   function refresh(){if(pre)pre.textContent=now();links.replaceChildren(aiLinks(now()));copyButton.textContent=copyLabel();status.textContent='';if(custom){liveBase??=d.html;liveDirty=true}}
   if(custom){onCustom=refresh;liveBase??=d.html;liveDirty=custom.changed()>0}
   panel.replaceChildren(...(fields?[fields.node]:custom?[custom.node,pre]:[pre]),el('div',{class:'prompt-actions'},copyButton,links),status)}
  else{customiserOf(item,d);const code=pageHtml(d),mine=code!==d.html;if(mine)status.textContent='Includes your Customise changes.';
   panel.replaceChildren(el('pre',{class:'prompt-code'},el('code',{text:code})),el('div',{class:'prompt-actions'},Object.assign(el('button',{class:'button lime',type:'button',text:'Copy code'}),{onclick:()=>{track('code_copy',item);copy(pageHtml(d),status,mine?'Code copied, with your Customise changes.':'Code copied.')}}),Object.assign(el('button',{class:'button outline',type:'button',text:'Download zip'}),{onclick:()=>{track('zip_download',item);download((item.id||'page')+'.zip',zip({...d,html:pageHtml(d),prompt:customiser&&customiserFor===key(item)?customiser.text():d.prompt},item));status.textContent='Download started.'}})),status)}
 }catch(e){if(e.status===401){panel.replaceChildren();lock(panel,name==='prompt'?'the prompt':'the code')}else if(e.status===428||e.code==='legal_required'){location.href='/legal.html'}else panel.replaceChildren(el('p',{class:'legal-feedback','data-tone':'error',role:'alert',text:e.message}))}}

/* ---------- zip (stored, no compression) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zip(d,item){const enc=new TextEncoder(),credit=item.credit?`\n\nOriginally made by ${item.credit.name} (${item.credit.url}).`:'';
 const files=[['index.html',enc.encode(d.html)],['prompt.txt',enc.encode(d.prompt+'\n')],['README.txt',enc.encode(`${d.title}\n\nindex.html is a complete page: open it in a browser.\nprompt.txt is the prompt it was made from.\n\nFrom RepoShelf: https://www.reposhelf.co.uk/prompts.html${credit}\n`)]];
 const parts=[],central=[];let offset=0;const now=new Date(),dt=((now.getFullYear()-1980)<<9|(now.getMonth()+1)<<5|now.getDate())&0xFFFF,tm=(now.getHours()<<11|now.getMinutes()<<5|now.getSeconds()>>1)&0xFFFF;
 for(const[name,data]of files){const n=enc.encode(name),c=crc32(data),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);h.setUint16(28,0,true);
  parts.push(new Uint8Array(h.buffer),n,data);const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);ch.setUint32(16,c,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,n.length,true);ch.setUint32(42,offset,true);central.push(new Uint8Array(ch.buffer),n);offset+=30+n.length+data.length}
 const size=central.reduce((s,p)=>s+p.length,0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,size,true);end.setUint32(16,offset,true);
 return new Blob([...parts,...central,new Uint8Array(end.buffer)],{type:'application/zip'})}

/* ---------- start ---------- */
function fromHash(){const m=/^#(siteshelf|sceneai)\/([a-z0-9-]{1,80})$/.exec(location.hash);return m?items.find(i=>i.source===m[1]&&i.id===m[2]):null}
function resume(){let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEEP)||'null');sessionStorage.removeItem(KEEP)}catch{}if(!saved||Date.now()-saved.at>1800000||!signedIn())return false;const item=items.find(i=>key(i)===saved.key);if(!item)return false;open(item);if(tabs.includes(saved.tab)&&saved.tab!=='live'&&!$('#tab-'+saved.tab).hidden)setTab(saved.tab);return true}
let resumed=false;
window.addEventListener('reposhelf-account',()=>{if(A.ready)void loadSaved();if(!A.ready||!items.length)return;if(!resumed){resumed=true;if(resume())return}if(dialog.open&&tab!=='live'){full=null;void showGated(tab)}});
(async()=>{try{const d=await getJson(API);items=d.items||[];const cats=[...new Set(items.map(i=>i.category))].sort();for(const c of cats)$('#prompt-category').append(el('option',{value:c,text:c}));render();const hit=fromHash();if(hit)open(hit);if(A?.ready&&!resumed){resumed=true;if(!hit)resume()}}catch(e){$('#prompt-count').textContent=e.message}})();
})();
window.RepoProfileMenu?.install({collectionHref:'/#collection'});
