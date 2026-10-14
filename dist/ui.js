'use strict';
// UI components: a static, searchable catalogue with a live preview. The prompt and the code are fetched from the
// server (/api/prompts?area=ui-detail) only for signed-in members.
(()=>{
const A=window.RepoAccount,$=s=>document.querySelector(s),API='/api/prompts',PAGE=48,KEEP='reposhelf.ui.open',RETURN='%2Fstudio.html';
const LICENCE='MIT licence. Copyright (c) 2025 Keenthemes Inc. Full text: https://www.reposhelf.co.uk/licences.html';
let saved=new Set(),savedFor=null,items=[],shown=PAGE,current=null,full=null,fullFor=null,tab='live',dark=false;
const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v)}n.append(...kids);return n};
const key=i=>'ui/'+i.id,pid=i=>'ss:'+key(i);
const signedIn=()=>Boolean(A?.user),track=(kind,item)=>{try{A?.track?.(kind,key(item||current))}catch{}};
async function getJson(url){const r=await fetch(url,{credentials:'same-origin'}),d=await r.json().catch(()=>null);if(!r.ok||!d){const e=new Error(d?.error?.message||'Something went wrong. Please try again.');e.status=r.status;e.code=d?.error?.code;throw e}return d}
const header=text=>`/*\n * ${LICENCE}\n */\n${text}`;

/* ---------- browse ---------- */
function filtered(){const q=$('#prompt-search').value.trim().toLowerCase(),f=$('#ui-family').value,c=$('#prompt-category').value;return items.filter(i=>(!f||i.f===f)&&(!c||i.k===c)&&(!q||(i.t+' '+i.d+' '+i.c+' '+i.f).toLowerCase().includes(q)))}
function render(){const list=filtered(),grid=$('#prompt-grid');grid.replaceChildren();for(const i of list.slice(0,shown)){const card=el('button',{class:'prompt-card',type:'button','aria-label':'Open '+i.t});
 card.append(Object.assign(el('img',{alt:'',loading:'lazy',decoding:'async',width:'520',height:'325'}),{src:`/ui/thumbs/${i.id}.webp`}),el('div',{class:'body'},el('span',{class:'tag',text:i.c}),el('h3',{text:i.t}),el('p',{text:i.f})));
 card.onclick=()=>open(i);grid.append(el('li',{class:'prompt-item'},card,heart(i,'prompt-like')))}
 $('#prompt-count').textContent=list.length?`${list.length} ${list.length===1?'component':'components'}`:'Nothing matches that search.';$('#prompt-more').hidden=list.length<=shown}
function fillComponents(){const f=$('#ui-family').value,sel=$('#prompt-category'),was=sel.value,cats=new Map();for(const i of items)if(!f||i.f===f)cats.set(i.k,i.c);sel.replaceChildren(el('option',{value:'',text:'All components'}));for(const[k,c]of [...cats].sort((a,b)=>a[1].localeCompare(b[1])))sel.append(el('option',{value:k,text:c}));sel.value=cats.has(was)?was:''}
$('#prompt-filters').addEventListener('submit',e=>e.preventDefault());
$('#prompt-search').addEventListener('input',()=>{shown=PAGE;render()});
$('#ui-family').addEventListener('change',()=>{fillComponents();shown=PAGE;render()});
$('#prompt-category').addEventListener('change',()=>{shown=PAGE;render()});
$('#prompt-more').onclick=()=>{shown+=PAGE;render()};

/* ---------- saved components (shown in My collection) ---------- */
function heart(item,cls){const on=saved.has(pid(item)),b=el('button',{class:cls,type:'button','aria-pressed':String(on),'aria-label':(on?'Remove from my collection: ':'Save to my collection: ')+item.t,title:on?'Saved to My collection':'Save to My collection'});b.textContent=on?'♥':'♡';b.dataset.heart=pid(item);
 b.onclick=async e=>{e.stopPropagation();if(!signedIn()){try{sessionStorage.setItem(KEEP,JSON.stringify({key:key(item),tab:'live',at:Date.now()}))}catch{}location.href='/api/auth?action=start&return='+RETURN;return}
  if(b.disabled)return;b.disabled=true;const was=saved.has(pid(item));try{await A.request('/api/collection',{method:was?'DELETE':'PUT',body:JSON.stringify({id:pid(item)})});was?saved.delete(pid(item)):saved.add(pid(item));paintHearts();$('#prompt-count').textContent=was?'Removed from My collection.':'Saved to My collection.'}catch(err){$('#prompt-count').textContent=err.message}finally{b.disabled=false}};
 return b}
function paintHearts(){document.querySelectorAll('[data-heart]').forEach(b=>{const on=saved.has(b.dataset.heart);b.textContent=on?'♥':'♡';b.setAttribute('aria-pressed',String(on));b.title=on?'Saved to My collection':'Save to My collection';b.setAttribute('aria-label',b.getAttribute('aria-label').replace(/^(Remove from my collection|Save to my collection)/,on?'Remove from my collection':'Save to my collection'))})}
async function loadSaved(){const id=A?.user?.id||null;if(id===savedFor)return;savedFor=id;saved=new Set();if(id){try{const d=await A.request('/api/collection?kind=prompts');if(savedFor===id)saved=new Set((d.items||[]).map(x=>x.id))}catch{}}paintHearts()}

/* ---------- detail ---------- */
const dialog=$('#prompt-dialog'),tabs=['live','prompt','code'];
function setTab(name,focus){tab=name;for(const t of tabs){const on=t===name;$('#tab-'+t).setAttribute('aria-selected',on);$('#tab-'+t).tabIndex=on?0:-1;$('#panel-'+t).hidden=!on}if(focus)$('#tab-'+name).focus();if(name!=='live')void showGated(name)}
for(const t of tabs){$('#tab-'+t).onclick=()=>setTab(t);$('#tab-'+t).onkeydown=e=>{const i=tabs.indexOf(t),n=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:-1;if(n>=0){e.preventDefault();setTab(tabs[n],true)}}}
function loadLive(){const frame=$('#live-frame');frame.src=`/ui/p/index.html?id=${encodeURIComponent(current.id)}${dark?'&theme=dark':''}`;$('#live-status').textContent='Live preview. Try the controls.'}
function rememberUI(){try{sessionStorage.setItem(KEEP,JSON.stringify({key:key(current),tab,at:Date.now()}))}catch{}}
function open(item){window.dispatchEvent(new Event('reposhelf-ui-open'));current=item;full=null;fullFor=null;$('#prompt-title').textContent=item.t;$('#prompt-like-slot').replaceChildren(heart(item,'prompt-like inline'));
 try{history.replaceState(null,'','#'+key(item))}catch{}
 if(!dialog.open)dialog.showModal();setTab('live');track('prompt_view',item);loadLive()}
$('#ui-theme').onclick=()=>{dark=!dark;$('#ui-theme').setAttribute('aria-pressed',String(dark));$('#ui-theme').textContent=dark?'Light preview':'Dark preview';$('#live-frame').style.background=dark?'#0a0a0a':'#fff';if(current)loadLive()};
dialog.addEventListener('close',()=>{$('#live-frame').src='about:blank';try{if(/^#ui\//.test(location.hash))history.replaceState(null,'',location.pathname+'#ui')}catch{}});
$('#prompt-close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});

function lock(panel,what){panel.replaceChildren(el('div',{class:'prompt-lock'},el('h3',{text:'Sign in to see '+what}),el('p',{text:'Browsing and previews are open to everyone. Signing in with GitHub unlocks the prompt, the code and the download.'}),el('a',{class:'button lime',href:'/api/auth?action=start&return='+RETURN,text:'Sign in with GitHub'})));panel.querySelector('a').onclick=rememberUI;track('lock_signin')}
async function ensureFull(){if(full&&fullFor===key(current))return full;const item=current;const d=await getJson(`${API}?area=ui-detail&id=${encodeURIComponent(item.id)}`);if(current!==item)return null;full=d;fullFor=key(item);return d}
function download(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000)}
async function copy(text,status,msg){try{await navigator.clipboard.writeText(text);status.textContent=msg}catch{status.textContent='Copy was unavailable. Select the text and copy it manually.'}}
function aiLinks(prompt){const wrap=document.createDocumentFragment(),enc=encodeURIComponent(prompt),long=enc.length>6000;for(const[name,base]of[['Claude','https://claude.ai/new?q='],['ChatGPT','https://chatgpt.com/?q=']]){const a=el('a',{class:'button outline',href:long?base.split('?')[0]:base+enc,text:'Open in '+name,rel:'noopener noreferrer',target:'_blank'});a.onclick=()=>track('ai_open');wrap.append(a)}return wrap}
const installNote=d=>{const s=[];if(d.shadcn?.length)s.push('npx shadcn@latest add '+d.shadcn.join(' '));if(d.npm?.length)s.push('npm install '+d.npm.filter(n=>!['react','react-dom'].includes(n)).join(' '));return s.join('\n')};
const everything=d=>[header(d.code),...(d.files||[]).map(f=>`// ===== ${f.path} =====\n`+f.content)].join('\n\n');
async function showGated(name){const panel=$('#panel-'+name);if(!signedIn()){lock(panel,name==='prompt'?'the prompt':'the code');return}
 panel.replaceChildren(el('p',{class:'prompt-note',text:'Loading…',role:'status'}));const item=current;
 try{const d=await ensureFull();if(!d||current!==item||tab!==name)return;track(name==='prompt'?'prompt_reveal':'code_reveal',item);const status=el('p',{class:'prompt-note',role:'status'});
  if(name==='prompt'){panel.replaceChildren(el('pre',{class:'prompt-text',text:d.prompt}),el('div',{class:'prompt-actions'},Object.assign(el('button',{class:'button lime',type:'button',text:'Copy prompt'}),{onclick:()=>{track('prompt_copy',item);copy(d.prompt,status,'Prompt copied.')}}),aiLinks(d.prompt)),status)}
  else{const extra=(d.files||[]).map(f=>el('details',{class:'ui-file'},el('summary',{text:f.path}),el('pre',{class:'prompt-code'},el('code',{text:f.content}))));const inst=installNote(d);
   panel.replaceChildren(...(inst?[el('p',{class:'prompt-note',text:'Install what it needs:'}),el('pre',{class:'prompt-text ui-install',text:inst})]:[]),el('p',{class:'prompt-note',text:'example.tsx'}),el('pre',{class:'prompt-code'},el('code',{text:d.code})),...(extra.length?[el('p',{class:'prompt-note',text:`Also needed (${extra.length} file${extra.length===1?'':'s'}, kept at the same paths under your @/ folder):`}),...extra]:[]),el('div',{class:'prompt-actions'},Object.assign(el('button',{class:'button lime',type:'button',text:'Copy code'}),{onclick:()=>{track('code_copy',item);copy(header(d.code),status,'Code copied, with its MIT licence notice.')}}),...(extra.length?[Object.assign(el('button',{class:'button outline',type:'button',text:'Copy all files'}),{onclick:()=>{track('code_copy',item);copy(everything(d),status,'All files copied, with the MIT licence notice.')}})]:[]),Object.assign(el('button',{class:'button outline',type:'button',text:'Download .zip'}),{onclick:()=>{track('zip_download',item);download(item.id+'.zip',zip(d,item))}})),status)}
 }catch(e){if(e.status===401){panel.replaceChildren();lock(panel,name==='prompt'?'the prompt':'the code')}else if(e.status===428||e.code==='legal_required'){rememberUI();location.href='/legal.html?return=studio'}else panel.replaceChildren(el('p',{class:'legal-feedback','data-tone':'error',role:'alert',text:e.message}))}}

/* ---------- zip (stored, no compression) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const MIT=`MIT License\n\nCopyright (c) 2025 Keenthemes Inc\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n`;
function zip(d,item){const enc=new TextEncoder(),inst=installNote(d);
 const readme=`${d.title}\n\nexample.tsx is the component. Files under src/ keep the same paths as their "@/" imports, so copy that folder into your project's @/ directory (usually src/).\nprompt.txt is a prompt that recreates it with an AI assistant.\n${inst?`\nInstall what it needs:\n${inst}\n`:''}\nFrom RepoShelf: https://www.reposhelf.co.uk/studio.html#ui\nThe code is MIT licensed. See LICENSE.txt.\n`;
 const files=[['example.tsx',enc.encode(header(d.code)+'\n')],...(d.files||[]).map(f=>['src/'+f.path,enc.encode(header(f.content)+'\n')]),['prompt.txt',enc.encode(d.prompt+'\n')],['README.txt',enc.encode(readme)],['LICENSE.txt',enc.encode(MIT)]];
 const parts=[],central=[];let offset=0;const now=new Date(),dt=((now.getFullYear()-1980)<<9|(now.getMonth()+1)<<5|now.getDate())&0xFFFF,tm=(now.getHours()<<11|now.getMinutes()<<5|now.getSeconds()>>1)&0xFFFF;
 for(const[name,data]of files){const n=enc.encode(name),c=crc32(data),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);h.setUint16(28,0,true);
  parts.push(new Uint8Array(h.buffer),n,data);const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);ch.setUint32(16,c,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,n.length,true);ch.setUint32(42,offset,true);central.push(new Uint8Array(ch.buffer),n);offset+=30+n.length+data.length}
 const size=central.reduce((s,p)=>s+p.length,0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,size,true);end.setUint32(16,offset,true);
 return new Blob([...parts,...central,new Uint8Array(end.buffer)],{type:'application/zip'})}

/* ---------- start ---------- */
function fromHash(){const m=/^#ui\/([a-z0-9-]{1,80})$/.exec(location.hash);return m?items.find(i=>i.id===m[1]):null}
function resume(){let s=null;try{s=JSON.parse(sessionStorage.getItem(KEEP)||'null');sessionStorage.removeItem(KEEP)}catch{}if(!s||Date.now()-s.at>1800000||!signedIn())return false;const item=items.find(i=>key(i)===s.key);if(!item)return false;open(item);if(tabs.includes(s.tab)&&s.tab!=='live')setTab(s.tab);return true}
let resumed=false;
window.addEventListener('reposhelf-account',()=>{if(A.ready)void loadSaved();if(!A.ready||!items.length)return;if(!resumed){resumed=true;if(resume())return}if(dialog.open&&tab!=='live'){full=null;void showGated(tab)}});
let loading=false;
async function init(){if(loading)return;loading=true;try{const d=await getJson('/ui/index.json');items=d;const fams=[...new Set(items.map(i=>i.f))];for(const f of fams)$('#ui-family').append(el('option',{value:f,text:f}));fillComponents();render();const hit=fromHash();if(hit)open(hit);if(A?.ready&&!resumed){resumed=true;if(!hit)resume()}}catch(e){loading=false;$('#prompt-count').textContent=e.message+' Switch tabs to try again.'}}
window.addEventListener('reposhelf-ui-activate',()=>void init());
try{if(/^#ui(?:\/|$)/.test(location.hash)||sessionStorage.getItem(KEEP))void init()}catch{}
window.addEventListener('hashchange',()=>{const hit=fromHash();if(hit&&(!dialog.open||current!==hit))open(hit);else if(!/^#ui(?:\/|$)/.test(location.hash)&&dialog.open)dialog.close()});
})();
