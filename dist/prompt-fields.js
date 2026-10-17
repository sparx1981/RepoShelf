(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoPromptFields=factory()})(globalThis,function(){
'use strict';
// Fill-in boxes for one prompt: Motion film director. Its brief block holds 14 lines such as
//   mode:        [showreel | product | launch-story | explainer]
// Each line becomes a labelled box (a dropdown where the choices are fixed) and the bracketed text becomes its hint.
// The boxes read the real prompt text, so editing the prompt in Administration keeps working. A line left blank stays
// as "key:" with nothing after it, which is how the prompt itself tells the AI to decide that line.
const SPECS={
 'siteshelf/motion-film-director':{block:'brief',fields:[
  {key:'mode',label:'Mode',type:'select'},
  {key:'subject',label:'Subject',type:'text'},
  {key:'viewer',label:'Viewer',type:'area'},
  {key:'end state',label:'End state',type:'area'},
  {key:'length',label:'Length and formats',type:'text'},
  {key:'frame rate',label:'Frame rate',type:'text'},
  {key:'brand',label:'Brand',type:'area'},
  {key:'facts',label:'Facts',type:'area'},
  {key:'assets',label:'Assets',type:'area'},
  {key:'style',label:'Style',type:'area'},
  {key:'sound',label:'Sound',type:'select'},
  {key:'autonomy',label:'Autonomy',type:'select'},
  {key:'toolchain',label:'Toolchain',type:'text'},
  {key:'sign-off',label:'Sign-off',type:'text'}]}};
const STORE='reposhelf.promptfields.v1',LINE=/^([a-z][a-z -]*):(\s+)\[(.*)\]\s*$/;
const oneLine=v=>String(v??'').replace(/\s*[\r\n]+\s*/g,' ').trim();
// Finds the field lines inside the block, in order. Lines that no longer look like "key: [hint]" are left alone.
function parse(text,id){
 const spec=SPECS[id];if(!spec||typeof text!=='string')return null;
 const lines=text.split('\n'),open=lines.indexOf('<'+spec.block+'>'),close=lines.indexOf('</'+spec.block+'>');
 if(open<0||close<open)return null;
 const found=[];
 for(let i=open+1;i<close;i++){
  const m=LINE.exec(lines[i]);if(!m)continue;
  const def=spec.fields.find(f=>f.key===m[1]);if(!def)continue;
  const hint=m[3].trim();
  found.push({...def,line:i,gap:m[2],hint,options:def.type==='select'?hint.split(/\s+\|\s+/).map(o=>o.trim()).filter(Boolean):null});
 }
 return found.length?{lines,fields:found}:null;
}
function fill(parsed,values={}){
 const lines=parsed.lines.slice();
 for(const f of parsed.fields){const v=oneLine(values[f.key]);lines[f.line]=v?`${f.key}:${f.gap}${v}`:`${f.key}:`}
 return lines.join('\n');
}
function load(id){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');return all&&typeof all==='object'&&all[id]&&typeof all[id]==='object'?all[id]:{}}catch{return {}}}
function save(id,values){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}')||{};all[id]=values;localStorage.setItem(STORE,JSON.stringify(all))}catch{}}
const supported=id=>Object.hasOwn(SPECS,id);
// Builds the boxes for one prompt. Returns null when the prompt has no boxes (so the caller shows it as plain text).
// {node, text(), reset()}: text() is the finished prompt; onChange is called after every edit.
function mount(id,promptText,{onChange=()=>{},document:doc=globalThis.document}={}){
 const parsed=parse(promptText,id);if(!parsed)return null;
 const values={...load(id)},el=(tag,props={},...kids)=>{const n=doc.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else if(v===true)n.setAttribute(k,'');else if(v!==false&&v!=null)n.setAttribute(k,v)}n.append(...kids);return n};
 const controls=new Map(),text=()=>fill(parsed,values);
 const pre=el('pre',{class:'prompt-text','aria-label':'The finished prompt'}),details=el('details',{class:'prompt-preview'},el('summary',{text:'Preview the finished prompt'}),pre);
 const grid=el('div',{class:'prompt-field-grid'});
 for(const f of parsed.fields){
  const wide=f.type==='area',idAttr='pf-'+f.key.replace(/[^a-z]+/g,'-');
  let control;
  if(f.type==='select'){
   control=el('select',{id:idAttr},el('option',{value:'',text:'Let the AI decide'}),...f.options.map(o=>el('option',{value:o,text:o})));
  }else if(f.type==='area'){control=el('textarea',{id:idAttr,rows:'2',maxlength:'600',placeholder:f.hint,autocomplete:'off'})}
  else control=el('input',{id:idAttr,type:'text',maxlength:'300',placeholder:f.hint,autocomplete:'off'});
  control.value=values[f.key]&&(f.type!=='select'||f.options.includes(values[f.key]))?values[f.key]:'';
  if(!control.value)delete values[f.key];
  control.addEventListener('input',()=>{const v=control.value;if(v.trim())values[f.key]=v;else delete values[f.key];save(id,values);paint();onChange()});
  controls.set(f.key,control);
  grid.append(el('div',{class:'prompt-field'+(wide?' wide':'')},el('label',{for:idAttr,text:f.label}),control));
 }
 const reset=el('button',{class:'button outline',type:'button',text:'Clear all boxes'});
 const note=el('p',{class:'prompt-note',text:'Every box is optional. A box left empty tells the AI to decide that line itself and note its choice.'});
 function paint(){pre.textContent=text();reset.disabled=!Object.keys(values).length}
 function clear(){for(const k of Object.keys(values))delete values[k];for(const c of controls.values())c.value='';save(id,values);paint();onChange()}
 reset.addEventListener('click',clear);
 const node=el('div',{class:'prompt-fields'},el('h3',{text:'Fill in your brief'}),note,grid,el('div',{class:'prompt-field-actions'},reset),details);
 paint();
 return {node,text,reset:clear,fieldCount:parsed.fields.length};
}
return {SPECS,supported,parse,fill,mount};
});
