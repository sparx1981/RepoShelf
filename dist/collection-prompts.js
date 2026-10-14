'use strict';
// "Saved prompts" in My collection. Prompts are saved from the Prompts page and live in the same store as
// liked projects, but are listed here separately because they open in the prompt library.
(()=>{
const A=window.RepoAccount,$=s=>document.querySelector(s);
if(!A)return;
const box=$('#saved-prompts'),tabs=$('#collection-tabs');
if(!box||!tabs)return;
let loadedFor=null,items=[],loading=false;
const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v)}n.append(...kids);return n};
function wanted(){if(tabs.hidden||!A.user)return false;const mode=tabs.querySelector('.active')?.dataset.collectionMode;return mode==='all'||mode==='likes'}
function render(){box.replaceChildren();
 if(!items.length){box.hidden=true;return}
 box.hidden=false;
 box.append(el('h3',{text:`Saved resources (${items.length})`}));
 const ul=el('ul',{class:'saved-prompt-list'});
 for(const it of items){const s=it.repo||{},src=String(it.id).slice(3),a=el('a',{href:(src.startsWith('bg/')||src.startsWith('img/')?'/studio.html#':src.startsWith('ui/')?'/studio.html#':'/prompts.html#')+src},el('strong',{text:s.name||src.split('/').pop()}),el('span',{text:s.category||(src.startsWith('bg/')?'Background':src.startsWith('img/')?'Image':src.startsWith('ui/')?'UI component':'Prompt')}));ul.append(el('li',{},a))}
 box.append(ul,el('p',{class:'saved-prompts-note'},el('a',{href:'/prompts.html',text:'Browse the prompt library'})))}
async function load(){const id=A.user?.id||null;if(loading||id===loadedFor)return;loading=true;try{const d=id?await A.request('/api/collection?kind=prompts'):{items:[]};loadedFor=id;items=d.items||[]}catch{items=[]}finally{loading=false}refresh()}
function refresh(){if(!wanted()){box.hidden=true;return}if(A.user?.id!==loadedFor){void load();return}render()}
new MutationObserver(refresh).observe(tabs,{attributes:true,attributeFilter:['hidden','class'],childList:true,subtree:true});
window.addEventListener('reposhelf-account',()=>{if(A.user?.id!==loadedFor)items=[];refresh()});
// Refetch each time My collection is opened, so a prompt saved a moment ago appears.
new MutationObserver(()=>{if(!tabs.hidden)loadedFor=null}).observe(tabs,{attributes:true,attributeFilter:['hidden']});
refresh();
})();
