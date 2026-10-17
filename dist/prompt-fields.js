(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoPromptFields=factory()})(globalThis,function(){
'use strict';
// Fill-in boxes for the hand-defined text prompts (Motion film director and the six from migration 0037). Each brief block holds lines such as
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
  {key:'sign-off',label:'Sign-off',type:'text'}]},
 'siteshelf/landing-page-builder':{block:'brief',fields:[
  {key:'product',label:'Product',type:'text'},
  {key:'audience',label:'Audience',type:'area'},
  {key:'goal',label:'Goal',type:'select'},
  {key:'call to action',label:'Call to action',type:'text'},
  {key:'tone',label:'Tone',type:'text'},
  {key:'brand',label:'Brand',type:'area'},
  {key:'proof',label:'Proof',type:'area'},
  {key:'sections',label:'Sections',type:'area'},
  {key:'style',label:'Style',type:'area'},
  {key:'stack',label:'Stack',type:'select'},
  {key:'motion',label:'Motion',type:'select'},
  {key:'language',label:'Language',type:'text'},
  {key:'autonomy',label:'Autonomy',type:'select'}]},
 'siteshelf/app-from-spec':{block:'brief',fields:[
  {key:'app',label:'App',type:'text'},
  {key:'users',label:'Users',type:'area'},
  {key:'core flows',label:'Core flows',type:'area'},
  {key:'data',label:'Data',type:'area'},
  {key:'platform',label:'Platform',type:'select'},
  {key:'stack',label:'Stack',type:'text'},
  {key:'auth',label:'Sign-in',type:'select'},
  {key:'design',label:'Design',type:'area'},
  {key:'scope',label:'Scope',type:'select'},
  {key:'integrations',label:'Integrations',type:'text'},
  {key:'constraints',label:'Constraints',type:'area'},
  {key:'testing',label:'Testing',type:'select'},
  {key:'autonomy',label:'Autonomy',type:'select'}]},
 'siteshelf/brand-identity-kit':{block:'brief',fields:[
  {key:'business',label:'Business',type:'text'},
  {key:'audience',label:'Audience',type:'area'},
  {key:'positioning',label:'Positioning',type:'area'},
  {key:'personality',label:'Personality',type:'text'},
  {key:'values',label:'Values',type:'area'},
  {key:'competitors',label:'Competitors',type:'area'},
  {key:'name',label:'Name',type:'select'},
  {key:'logo',label:'Logo',type:'select'},
  {key:'palette',label:'Palette',type:'text'},
  {key:'typography',label:'Typography',type:'text'},
  {key:'voice',label:'Voice',type:'area'},
  {key:'applications',label:'Applications',type:'text'},
  {key:'deliverable',label:'Deliverable',type:'select'}]},
 'siteshelf/social-content-engine':{block:'brief',fields:[
  {key:'brand',label:'Brand',type:'area'},
  {key:'goal',label:'Goal',type:'select'},
  {key:'channels',label:'Channels',type:'text'},
  {key:'period',label:'Period',type:'text'},
  {key:'frequency',label:'Frequency',type:'text'},
  {key:'pillars',label:'Pillars',type:'area'},
  {key:'voice',label:'Voice',type:'area'},
  {key:'assets',label:'Assets',type:'area'},
  {key:'offers',label:'Offers',type:'area'},
  {key:'questions',label:'Audience questions',type:'area'},
  {key:'formats',label:'Formats',type:'text'},
  {key:'avoid',label:'Avoid',type:'area'},
  {key:'measure',label:'Measures',type:'text'}]},
 'siteshelf/explainer-video-script':{block:'brief',fields:[
  {key:'topic',label:'Topic',type:'text'},
  {key:'viewer',label:'Viewer',type:'area'},
  {key:'outcome',label:'Outcome',type:'area'},
  {key:'length',label:'Length',type:'text'},
  {key:'format',label:'Format',type:'select'},
  {key:'style',label:'Style',type:'select'},
  {key:'voice',label:'Voice',type:'select'},
  {key:'tone',label:'Tone',type:'text'},
  {key:'facts',label:'Facts',type:'area'},
  {key:'brand',label:'Brand',type:'area'},
  {key:'music',label:'Music',type:'select'},
  {key:'end card',label:'End card',type:'text'}]},
 'siteshelf/market-research-brief':{block:'brief',fields:[
  {key:'topic',label:'Topic',type:'text'},
  {key:'decision',label:'Decision',type:'area'},
  {key:'audience',label:'Readers',type:'text'},
  {key:'region',label:'Region',type:'text'},
  {key:'segments',label:'Segments',type:'area'},
  {key:'competitors',label:'Competitors',type:'area'},
  {key:'horizon',label:'Time horizon',type:'text'},
  {key:'sources',label:'Sources',type:'area'},
  {key:'depth',label:'Depth',type:'select'},
  {key:'format',label:'Format',type:'select'},
  {key:'must answer',label:'Must answer',type:'area'},
  {key:'constraints',label:'Constraints',type:'area'}]}};
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
