'use strict';
// The Prompts tab of Administration: usage, review, edit, publish, delete and import for the prompt library.
(()=>{
const A=RepoAccount,$=s=>document.querySelector(s),API='/api/prompts',PAGE=50;
let items=[],runs=[],started=false,busy=false,shown=PAGE,editing=null;
const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v)}n.append(...kids);return n};
const say=(text,error)=>{const m=$('#prompts-message');m.textContent=text||'';if(error)m.dataset.tone='error';else delete m.dataset.tone};
const call=(area,body)=>A.request(`${API}?area=${area}`,{signal:AbortSignal.timeout(55000),...(body?{method:'POST',body:JSON.stringify(body)}:{})});
const get=(path)=>A.request(path,{signal:AbortSignal.timeout(30000)});
const when=v=>v?new Date(v).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
async function task(fn){if(busy)return;busy=true;try{await fn()}catch(e){say(e.message,true)}finally{busy=false}}

function visible(){const f=$('#prompts-filter').value,q=$('#prompts-search').value.trim().toLowerCase();
 return items.filter(i=>(f==='all'||(f==='review'&&!i.published&&i.is_new)||(f==='hidden'&&!i.published)||i.source===f)&&(!q||(i.title+' '+(i.category||'')).toLowerCase().includes(q)))}
function render(){const list=visible(),body=$('#prompts-rows');body.replaceChildren();
 for(const i of list.slice(0,shown)){const tr=el('tr'),status=i.published?'Published':i.is_new?'Waiting for review':'Unpublished';
  const toggle=el('button',{class:'button outline',type:'button',text:i.published?'Unpublish':'Publish','aria-label':`${i.published?'Unpublish':'Publish'} ${i.title}`});
  toggle.onclick=()=>task(async()=>{await call('admin-save',{source:i.source,id:i.source_id,published:!i.published});i.published=!i.published;i.is_new=false;say(`${i.title} is now ${i.published?'published':'unpublished'}.`);render()});
  const edit=el('button',{class:'button outline',type:'button',text:'Edit','aria-label':'Edit '+i.title});edit.onclick=()=>openEdit(i);
  const del=el('button',{class:'button outline',type:'button',text:'Delete','aria-label':'Delete '+i.title});
  del.onclick=()=>{const typed=prompt(`This permanently deletes "${i.title}", its page and thumbnail. Type ${i.source_id} to confirm.`);if(typed===null)return;task(async()=>{await call('admin-delete',{source:i.source,id:i.source_id,confirm:typed.trim()});items=items.filter(x=>x!==i);say('Deleted.');render()})};
  tr.append(el('th',{scope:'row',text:i.title}),el('td',{text:i.source==='sceneai'?'SceneAI':'Original'}),el('td',{text:i.category||''}),el('td',{text:status}),el('td',{class:'row-tile-actions'},toggle,edit,del));body.append(tr)}
 if(!list.length)body.append(el('tr',{},el('td',{colspan:'5',text:'No prompts match.'})));
 $('#prompts-more').hidden=list.length<=shown;
 const r=runs[0];$('#prompts-runs').textContent=r?`Last import: ${when(r.started_at)} (${r.trigger}) — ${r.error?'failed: '+r.error:`${r.found} free found, ${r.added} added, ${r.updated} updated`}.`:'No imports yet.'}

function usage(d){const box=$('#prompts-usage');box.replaceChildren();
 if(!d||d.configured===false){box.textContent='Usage figures need the latest database update (migration 31).';return}
 const t=d.totals||{},n=k=>Number(t[k]||0);
 box.append(`Last ${d.days} days: ${n('prompt_view')} opened · ${n('prompt_reveal')} prompts shown · ${n('code_reveal')} code shown · ${n('prompt_copy')+n('code_copy')} copies · ${n('zip_download')} downloads · ${n('ai_open')} opened in an AI · ${n('lock_signin')} sign-in clicks from the lock · ${d.visitors||0} visitors.`);
 if(d.top?.length){const ul=el('ul');for(const k of d.top.slice(0,5))ul.append(el('li',{text:`${k.prompt} — ${k.views} opened, ${k.reveals} revealed, ${k.actions} actions`}));box.append(ul)}}

async function load(){say('Loading…');const [list,stats]=await Promise.all([call('admin-list'),get('/api/analytics?action=prompts&days=30').catch(()=>null)]);items=list.items||[];runs=list.runs||[];usage(stats);say('');render()}

function openCreate(){editing={create:true};$('#prompt-edit-title').textContent='New prompt';for(const id of ['title','category','description','prompt'])$('#pe-'+id).value='';$('#pe-published').checked=true;$('#pe-status').textContent='A text prompt shows only the prompt in the library (no generated page). Members see it after signing in.';$('#pe-save').disabled=false;$('#prompt-edit').showModal();$('#pe-title').focus()}
function openEdit(i){editing=i;$('#prompt-edit-title').textContent='Edit prompt';$('#pe-status').textContent='Loading…';$('#prompt-edit').showModal();$('#pe-save').disabled=true;
 get(`${API}?area=admin-get&source=${i.source}&id=${encodeURIComponent(i.source_id)}`).then(d=>{if(editing!==i)return;$('#pe-title').value=d.title||'';$('#pe-category').value=d.category||'';$('#pe-description').value=d.description||'';$('#pe-prompt').value=d.prompt||'';$('#pe-published').checked=Boolean(d.published);$('#pe-status').textContent=i.source==='sceneai'?'This prompt came from SceneAI. Your edits are kept when it is next imported.':'';$('#pe-save').disabled=false}).catch(e=>{$('#pe-status').textContent=e.message})}
function bind(){
 $('#prompts-refresh').onclick=()=>task(load);$('#prompts-new').onclick=openCreate;
 $('#prompts-filter').onchange=()=>{shown=PAGE;render()};$('#prompts-search').oninput=()=>{shown=PAGE;render()};$('#prompts-more').onclick=()=>{shown+=PAGE;render()};
 $('#prompts-import').onclick=()=>task(async()=>{say('Importing free prompts from SceneAI…');const r=await call('admin-sync',{});await load();say(`Import finished: ${r.found} free found, ${r.added} added, ${r.updated} updated. New prompts wait for your review.`)});
 $('#prompts-import-ms').onclick=()=>task(async()=>{say('Importing free prompts from MotionSites…');const r=await call('admin-import-motionsites',{});await load();say(`Import finished: ${r.found} found, ${r.added} added, ${r.skipped} already here or skipped. New prompts are live.`)});
 $('#pe-cancel').onclick=()=>{editing=null;$('#prompt-edit').close()};
 $('#prompt-edit-form').onsubmit=e=>{e.preventDefault();const i=editing;if(!i)return;
  if(i.create)return void task(async()=>{const body={title:$('#pe-title').value,category:$('#pe-category').value,description:$('#pe-description').value,prompt:$('#pe-prompt').value,published:$('#pe-published').checked};let made;try{made=await call('admin-create',body)}catch(err){$('#pe-status').textContent=err.message;return}items.unshift({source:made.source,source_id:made.id,title:body.title.trim(),category:body.category.trim()||null,type:'free',kind:'text',published:body.published,is_new:false,created_at:new Date().toISOString()});editing=null;$('#prompt-edit').close();say(`Created "${body.title.trim()}"${body.published?' and published it':' (unpublished)'}.`);render()});
  task(async()=>{const body={source:i.source,id:i.source_id,title:$('#pe-title').value,category:$('#pe-category').value,description:$('#pe-description').value,prompt:$('#pe-prompt').value,published:$('#pe-published').checked};try{await call('admin-save',body)}catch(err){$('#pe-status').textContent=err.message;return}Object.assign(i,{title:body.title.trim(),category:body.category.trim()||null,published:body.published,is_new:false});editing=null;$('#prompt-edit').close();say('Saved.');render()})};
}
window.RepoAdminPrompts={start(){if(!A.user?.admin)return;if(!started){started=true;bind()}void task(load)}};
})();
