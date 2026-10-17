'use strict';
// "Boards" in My collection: group saved items into named boards to use in a specific project. An item can sit on
// several boards. Boards are private; an AI assistant connected with a personal key can read them (get_board).
// This script only adds the Boards tab, the "＋ Board" button on collection cards and two dialogs; saving, liking and
// forking stay with their existing controllers.
(()=>{
const A=window.RepoAccount,$=s=>document.querySelector(s);
if(!A)return;
const tabs=$('#collection-tabs'),grid=$('#grid'),prompts=$('#saved-prompts');
if(!tabs||!grid||!prompts)return;
const API='/api/collection?action=boards',ITEMS='/api/collection?action=board-items';
let boards=[],loadedFor=null,loading=false,ready=true,openId=null,notice='',noticeError=false,pickerFor=null,editing=undefined;
const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else if(v===true)n.setAttribute(k,'');else if(v!==false&&v!=null)n.setAttribute(k,v)}n.append(...kids);return n};
const send=(path,method,body)=>A.request(path,{method,body:JSON.stringify(body)});
const plural=(n,word)=>`${n} ${word}${n===1?'':'s'}`;
const activeMode=()=>tabs.querySelector('.active')?.dataset.collectionMode;
const inCollection=()=>!tabs.hidden;
const onBoardsTab=()=>inCollection()&&activeMode()==='boards';
const idOf=item=>String(item.id);
const boardsFor=id=>boards.filter(b=>b.items.includes(id));
const itemLink=id=>{const src=id.slice(3);return (src.startsWith('bg/')||src.startsWith('img/')||src.startsWith('ui/')?'/studio.html#':'/prompts.html#')+src};

// ---- panel (the Boards tab) -------------------------------------------------------------------------------------
const panel=el('section',{id:'boards-panel',class:'boards-panel','aria-label':'Boards',hidden:true});
prompts.before(panel);
const status=el('p',{class:'boards-status',role:'status'});
function setNotice(text,isError=false){notice=text;noticeError=isError;status.textContent=text;status.className='boards-status'+(isError?' error':'')}
function assistantPrompt(board){return `Build [describe what you want] using my RepoShelf board "${board.name}". Use the RepoShelf connector: call get_board for that board, check the licences, and propose a plan before writing any code.`}
function renderList(){
 panel.append(el('div',{class:'boards-head'},el('h3',{text:`Boards${boards.length?` (${boards.length})`:''}`}),el('button',{type:'button',class:'button outline','data-board-new':true,text:'New board'})));
 panel.append(el('p',{class:'boards-intro',text:'Group the items you have saved into boards for a specific project. The same item can be on several boards. Boards are private to you.'}));
 if(!boards.length){panel.append(el('div',{class:'boards-empty'},el('h4',{text:'Make your first board'}),el('p',{text:'For example “SaaS landing page” or “Internal dashboard”. Create a board, then use the ＋ Board button on any saved project to add it.'}),el('button',{type:'button',class:'button lime','data-board-new':true,text:'Create a board'})));return}
 const ul=el('ul',{class:'board-list'});
 for(const b of boards){
  ul.append(el('li',{},el('button',{type:'button',class:'board-card','data-board-open':b.id},el('strong',{text:b.name}),el('span',{class:'board-count',text:plural(b.items.length,'item')}),b.description?el('span',{class:'board-desc',text:b.description}):'')))}
 panel.append(ul,el('p',{class:'boards-note'},'Connect your AI assistant to build from a board. ',el('a',{href:'/connect.html',text:'See how to connect'})))}
function renderBoard(board){
 panel.append(el('div',{class:'boards-head'},el('button',{type:'button',class:'button outline','data-board-back':true,text:'← All boards'}),el('div',{class:'boards-actions'},el('button',{type:'button',class:'button outline','data-board-edit':board.id,text:'Edit'}),el('button',{type:'button',class:'button outline danger','data-board-delete':board.id,text:'Delete'}))));
 panel.append(el('h3',{class:'board-title',text:board.name}),board.description?el('p',{class:'board-description',text:board.description}):'');
 panel.append(el('div',{class:'board-assist'},el('p',{text:'Use this board with your AI assistant:'}),el('code',{text:assistantPrompt(board)}),el('button',{type:'button',class:'button outline','data-board-copy':board.id,text:'Copy'})));
 if(!board.items.length){panel.append(el('div',{class:'boards-empty'},el('p',{text:'Nothing on this board yet. Open All saved or Liked and use ＋ Board on a project.'})));return}
 const ul=el('ul',{class:'board-items'});
 for(const id of board.items){
  const snap=snapshotOf(id),name=snap.name||id.split('/').pop(),isPrompt=id.startsWith('ss:');
  const open=isPrompt?el('a',{href:itemLink(id),text:name}):el('button',{type:'button','data-details':id,text:name});
  ul.append(el('li',{},el('div',{class:'board-item-main'},open,el('span',{text:snap.category||(isPrompt?'Prompt':'Project')})),el('button',{type:'button',class:'button outline','data-board-remove':id,'aria-label':`Remove ${name} from this board`,text:'Remove'})))}
 panel.append(ul)}
const snapshots=new Map();
function snapshotOf(id){return snapshots.get(id)||{}}
let lastSignature='';
function render(){
 const visible=onBoardsTab();
 document.body.classList.toggle('boards-mode',visible);
 panel.hidden=!visible;
 if(!visible){lastSignature='';return}
 // The storefront re-renders the tabs often; only rebuild the panel when what it shows has changed.
 const signature=JSON.stringify([A.user?.id||null,ready,loading,openId,notice,noticeError,boards.map(b=>[b.id,b.name,b.description,b.items])]);
 if(signature===lastSignature&&panel.childNodes.length)return;
 lastSignature=signature;
 panel.replaceChildren();
 if(!A.user){panel.append(el('div',{class:'boards-empty'},el('h4',{text:'Sign in to use boards'}),el('p',{text:'Boards group the projects you have saved, so you can use them in a specific project or hand them to your AI assistant.'}),el('button',{type:'button',class:'button lime','data-board-signin':true,text:'Sign in'})));return}
 if(!ready){panel.append(el('p',{class:'boards-intro',text:'Boards are being set up. Please check back soon.'}));return}
 if(loading&&!loadedFor){panel.append(el('p',{class:'boards-intro',text:'Loading your boards…'}));return}
 const board=boards.find(b=>b.id===openId);
 if(board)renderBoard(board);else{openId=null;renderList()}
 panel.append(status)}

// ---- data -------------------------------------------------------------------------------------------------------
let inflight=null;
// A load that arrives while another is running waits for it; a forced one then runs again, so a board that was just created is in the
// list before anything is added to it (it used to be missed, and the first item silently not added).
async function load(force=false){
 const id=A.user?.id||null;
 if(!id){boards=[];loadedFor=null;render();return}
 while(inflight)await inflight;
 if(A.user?.id!==id)return;
 if(!force&&id===loadedFor)return;
 loading=true;render();
 const run=inflight=(async()=>{
  try{const data=await A.request(API);if(A.user?.id!==id)return;boards=data.boards||[];loadedFor=id;ready=true}
  catch(e){if(e?.status===503||e?.code==='migration_required'||e?.code==='boards_unavailable'){ready=false}else setNotice(e.message||'Boards could not be loaded.',true)}
  finally{loading=false}})();
 try{await run}finally{if(inflight===run)inflight=null}
 render();decorate()}
// Names and categories of the items on a board come from the board's detail, loaded when the board is opened.
async function openBoard(id){
 openId=id;render();
 try{const data=await A.request(API+'&board='+encodeURIComponent(id));for(const item of data.board.items||[])snapshots.set(item.id,item.snapshot||{});const b=boards.find(x=>x.id===id);if(b)b.items=(data.board.items||[]).map(idOf)}catch(e){setNotice(e.message||'That board could not be opened.',true)}
 render()}
async function saveBoard(values){
 const body={name:values.name,description:values.description};if(values.id)body.id=values.id;
 const result=await send(API,'PUT',body);await load(true);return result.id}
async function setMembership(board,project,present){
 const had=board.items.includes(project);
 if(present===had)return;
 board.items=present?[project,...board.items]:board.items.filter(x=>x!==project);decorate();
 try{await send(ITEMS,'PUT',{board:board.id,id:project,present})}
 catch(e){board.items=had?[project,...board.items.filter(x=>x!==project)]:board.items.filter(x=>x!==project);decorate();throw e}}

// ---- dialogs -----------------------------------------------------------------------------------------------------
const formDialog=el('dialog',{id:'board-dialog','aria-labelledby':'board-dialog-title'});
const formTitle=el('h2',{id:'board-dialog-title'}),nameInput=el('input',{id:'board-name',type:'text',maxlength:'80',required:true,autocomplete:'off'}),descInput=el('textarea',{id:'board-description',maxlength:'1000',rows:'4'}),formError=el('p',{class:'boards-status error',role:'alert'}),save=el('button',{type:'submit',class:'button lime',text:'Save'}),cancel=el('button',{type:'button',class:'button outline',text:'Cancel'});
const form=el('form',{method:'dialog',class:'board-form'},formTitle,el('label',{for:'board-name',text:'Name'}),nameInput,el('label',{for:'board-description',text:'What is this board for? (optional)'}),descInput,el('p',{class:'boards-note',text:'Your AI assistant sees this description, so say what you plan to build.'}),formError,el('div',{class:'boards-actions'},cancel,save));
formDialog.append(form);
const pickDialog=el('dialog',{id:'board-picker','aria-labelledby':'board-picker-title'});
const pickTitle=el('h2',{id:'board-picker-title'}),pickList=el('ul',{class:'board-pick-list'}),pickError=el('p',{class:'boards-status error',role:'alert'}),quickName=el('input',{type:'text',maxlength:'80',placeholder:'New board name','aria-label':'New board name',autocomplete:'off'}),quickAdd=el('button',{type:'button',class:'button outline',text:'Create and add'}),closePick=el('button',{type:'button',class:'button lime',text:'Done'});
pickDialog.append(pickTitle,pickList,el('div',{class:'board-quick'},quickName,quickAdd),pickError,el('div',{class:'boards-actions'},closePick));
document.body.append(formDialog,pickDialog);
function openForm(board){
 editing=board||null;formTitle.textContent=board?'Edit board':'New board';nameInput.value=board?.name||'';descInput.value=board?.description||'';formError.textContent='';
 if(!formDialog.open)formDialog.showModal();nameInput.focus()}
cancel.addEventListener('click',()=>formDialog.close());
form.addEventListener('submit',async event=>{
 event.preventDefault();const name=nameInput.value.trim();if(!name){formError.textContent='Give the board a name.';nameInput.focus();return}
 save.disabled=true;formError.textContent='';
 try{const id=await saveBoard({id:editing?.id,name,description:descInput.value});formDialog.close();if(!editing){openId=id;await openBoard(id)}else render();setNotice(editing?'Board saved.':'Board created.')}
 catch(e){formError.textContent=e.message||'The board could not be saved.'}
 finally{save.disabled=false}});
function renderPicker(){
 const id=pickerFor;pickList.replaceChildren();
 if(!boards.length)pickList.append(el('li',{class:'boards-note',text:'You have no boards yet. Create one below.'}));
 for(const b of boards){
  const box=el('input',{type:'checkbox','data-pick-board':b.id,id:'pick-'+b.id});box.checked=b.items.includes(id);
  pickList.append(el('li',{},el('label',{for:'pick-'+b.id},box,el('span',{text:b.name}),el('small',{text:plural(b.items.length,'item')}))))}}
function openPicker(id,name){
 pickerFor=id;pickTitle.textContent=`Add “${name}” to boards`;pickError.textContent='';quickName.value='';renderPicker();if(!pickDialog.open)pickDialog.showModal()}
pickList.addEventListener('change',async event=>{
 const box=event.target.closest('[data-pick-board]');if(!box)return;const board=boards.find(b=>b.id===box.dataset.pickBoard);if(!board)return;
 box.disabled=true;pickError.textContent='';
 try{await setMembership(board,pickerFor,box.checked)}catch(e){box.checked=!box.checked;pickError.textContent=e.message||'The board could not be changed.'}
 finally{box.disabled=false;renderPicker()}});
quickAdd.addEventListener('click',async()=>{
 const name=quickName.value.trim();if(!name){pickError.textContent='Give the new board a name.';quickName.focus();return}
 quickAdd.disabled=true;pickError.textContent='';
 try{const id=await saveBoard({name,description:''});const board=boards.find(b=>b.id===id);if(board)await setMembership(board,pickerFor,true);quickName.value='';renderPicker()}
 catch(e){pickError.textContent=e.message||'The board could not be created.'}
 finally{quickAdd.disabled=false}});
quickName.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();quickAdd.click()}});
closePick.addEventListener('click',()=>pickDialog.close());
pickDialog.addEventListener('close',()=>{pickerFor=null;render()});

// ---- "＋ Board" on collection cards ------------------------------------------------------------------------------
function decorate(){
 const cards=grid.querySelectorAll('.card');
 const active=inCollection()&&['all','likes'].includes(activeMode())&&Boolean(A.user)&&ready; // only saved projects can go on a board: not Forks or Recently viewed
 for(const card of cards){
  let button=card.querySelector('[data-board-add]');
  const id=card.querySelector('[data-details]')?.dataset.details;
  if(!active||!id){button?.remove();continue}
  const count=boardsFor(id).length,label=count?`On ${plural(count,'board')}`:'＋ Board';
  if(!button){button=el('button',{type:'button',class:'board-add','data-board-add':id});(card.querySelector('.card-actions')||card).append(button)}
  button.dataset.boardAdd=id;button.textContent=label;button.classList.toggle('on',count>0);button.setAttribute('aria-label',count?`${card.querySelector('h3')?.textContent||id} is on ${plural(count,'board')}. Change boards`:`Add ${card.querySelector('h3')?.textContent||id} to a board`)}}

// ---- events -----------------------------------------------------------------------------------------------------
document.addEventListener('click',async event=>{
 const t=event.target;if(!(t instanceof Element))return;
 const add=t.closest('[data-board-add]');
 if(add){const id=add.dataset.boardAdd;if(!boards.length&&loadedFor!==A.user?.id)await load(true);openPicker(id,add.closest('.card')?.querySelector('h3')?.textContent||id);return}
 if(!panel.contains(t))return;
 if(t.closest('[data-board-signin]')){window.RepoProfileMenu?.open?.();return}
 if(t.closest('[data-board-new]')){openForm(null);return}
 const open=t.closest('[data-board-open]');if(open){setNotice('');await openBoard(open.dataset.boardOpen);return}
 if(t.closest('[data-board-back]')){openId=null;setNotice('');render();return}
 const edit=t.closest('[data-board-edit]');if(edit){openForm(boards.find(b=>b.id===edit.dataset.boardEdit));return}
 const del=t.closest('[data-board-delete]');
 if(del){const board=boards.find(b=>b.id===del.dataset.boardDelete);if(!board||!confirm(`Delete the board “${board.name}”? The projects stay in your collection.`))return;
  try{await send(API,'DELETE',{id:board.id});openId=null;await load(true);setNotice('Board deleted.')}catch(e){setNotice(e.message||'The board could not be deleted.',true);render()}return}
 const remove=t.closest('[data-board-remove]');
 if(remove){const board=boards.find(b=>b.id===openId);if(!board)return;try{await setMembership(board,remove.dataset.boardRemove,false);setNotice('Removed from the board.')}catch(e){setNotice(e.message||'The board could not be changed.',true)}render();return}
 const copy=t.closest('[data-board-copy]');
 if(copy){const board=boards.find(b=>b.id===copy.dataset.boardCopy);try{await navigator.clipboard.writeText(assistantPrompt(board));setNotice('Copied. Paste it into your assistant and describe what to build.')}catch{setNotice('Copy was unavailable. Select the text and copy it manually.',true)}render()}});

new MutationObserver(()=>{if(!tabs.hidden&&A.user&&loadedFor!==A.user.id)void load();render();decorate()}).observe(tabs,{attributes:true,attributeFilter:['hidden','class'],childList:true,subtree:true});
// Refetch each time My collection is opened, so changes made elsewhere are current.
new MutationObserver(()=>{if(tabs.hidden)return;loadedFor=null;if(A.user)void load()}).observe(tabs,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(decorate).observe(grid,{childList:true});
window.addEventListener('reposhelf-account',()=>{if(A.user?.id!==loadedFor){boards=[];loadedFor=null;openId=null;snapshots.clear();lastSignature=''}if(!tabs.hidden)void load();render();decorate()});
render();
})();
