(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoPromptCustomise=factory()})(globalThis,function(){
'use strict';
// "Customise this prompt": boxes built automatically from a library prompt's own text. Library prompts share one
// format (labelled paragraphs such as "Canvas & base:", "Typography:", "Rules:"), so the colours, fonts, invented
// brand name, quoted on-screen copy, links, optional sections and output rules can be found in the browser and swapped
// in place. Nothing is sent anywhere. Every edit is a span of the original text replaced exactly once, so changing
// one colour into another colour that is also used never cascades.
const STORE='reposhelf.promptfields.v1',MAX_SAVED=60;
const FONTS=['Inter','DM Sans','Manrope','Poppins','Roboto','Open Sans','Lato','Montserrat','Work Sans','Outfit','Plus Jakarta Sans','Space Grotesk','Sora','Figtree','Lexend','Rubik','Urbanist','Epilogue','Hanken Grotesk','Albert Sans','Bricolage Grotesque','Syne','Unbounded','Archivo','Barlow','Public Sans','Nunito','Mulish','Raleway','Quicksand','Playfair Display','Fraunces','Cormorant Garamond','Instrument Serif','DM Serif Display','Lora','Merriweather','EB Garamond','Newsreader','Spectral','Libre Baskerville','Bodoni Moda','Abril Fatface','Oswald','Bebas Neue','Anton','Big Shoulders Display','Orbitron','Rajdhani','Audiowide','Press Start 2P','DM Mono','JetBrains Mono','IBM Plex Mono','Space Mono','Fira Code','Roboto Mono','Source Code Pro','Caveat','Pacifico'];
// More Google Fonts that are recognised in a prompt (the dropdown offers the shorter list above).
const KNOWN=[...FONTS,'Cormorant','Karla','Libre Franklin','Mukta','Oxygen','PT Sans','PT Serif','Noto Sans','Noto Serif','Source Sans 3','Source Serif 4','Crimson Text','Crimson Pro','Cinzel','Marcellus','Tenor Sans','Josefin Sans','Jost','Questrial','Varela Round','Comfortaa','Fredoka','Baloo 2','Bungee','Righteous','Staatliches','Teko','Saira','Chakra Petch','Exo 2','Michroma','Zen Dots','Gloock','Young Serif','Caprasimo','Italiana','Gilda Display','Prata','Yeseva One','Alegreya','Vollkorn','Cardo','Domine','Bitter','Zilla Slab','Roboto Slab','Roboto Condensed','Barlow Condensed','Fjalla One','Archivo Black','Archivo Narrow','League Spartan','Schibsted Grotesk','Familjen Grotesk','Red Hat Display','Red Hat Text','Onest','Geist','Geist Mono','Instrument Sans','Inter Tight','Kumbh Sans','Lexend Deca','Be Vietnam Pro','Heebo','Assistant','Noto Sans Mono','Ubuntu','Ubuntu Mono','Courier Prime','Inconsolata','VT323','Share Tech Mono','Special Elite','Permanent Marker','Dancing Script','Great Vibes','Sacramento','Satisfy','Amatic SC','Lobster','Rubik','Poppins','Roboto'].filter((f,i,a)=>a.indexOf(f)===i).sort((a,b)=>b.length-a.length);
const FORMATS=[
 ['','As written (single HTML file)'],
 ['react','React component with Tailwind CSS'],
 ['next','Next.js App Router page with Tailwind CSS'],
 ['vue','Vue 3 single-file component'],
 ['svelte','Svelte component']];
const FORMAT_TEXT={
 react:'Deliver a React 18 function component styled with Tailwind CSS, with fonts loaded from Google Fonts; no other libraries or external images.',
 next:'Deliver a Next.js App Router page in TypeScript styled with Tailwind CSS, with fonts loaded through next/font; no other libraries or external images.',
 vue:'Deliver a Vue 3 single-file component using script setup and scoped CSS, with fonts loaded from Google Fonts; no other libraries or external images.',
 svelte:'Deliver a Svelte component with scoped styles, with fonts loaded from Google Fonts; no other libraries or external images.'};
const LANGUAGES=['','Spanish','French','German','Portuguese','Italian','Dutch','Polish','Turkish','Japanese','Korean','Chinese (Simplified)','Hindi','Arabic'];
const SECTION_LABELS={'Interaction':'Interaction and animation','Responsive':'Responsive behaviour','Imagery & art direction':'Imagery and art direction','Technique notes':'Technique notes'};
const STOP=new Set(['a','an','the','and','or','with','on','of','for','is','are','at','from','to','by','in','as','but','then','plus','both','its','their','page','text','used','use']);
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const oneLine=s=>String(s??'').replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim();
const title=s=>s.replace(/(^|[\s-])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
const wordRe=name=>new RegExp('(?<![A-Za-z0-9])'+esc(name)+'(?![A-Za-z0-9])','g');

// ---- reading the prompt -------------------------------------------------------------------------------------------
function paragraphs(text){
 const out=[],re=/\n[ \t]*\n/g;let start=0,m;
 const push=(s,e,sepEnd)=>{const body=text.slice(s,e),label=/^([A-Z][A-Za-z &\/,'-]{1,40}):/.exec(body);out.push({start:s,end:e,sepEnd,label:label?label[1]:null})};
 while((m=re.exec(text))){push(start,m.index,m.index+m[0].length);start=m.index+m[0].length}
 push(start,text.length,text.length);return out;
}
const inside=(paras,pos,label)=>paras.some(p=>p.label===label&&pos>=p.start&&pos<p.end);
const COLOUR_RULES=[[/gradient/,'Gradient'],[/accents?|highlight|primary|\bcta\b|brand colou?r|\bbuttons?\b|\bactions?\b/,'Accent'],[/background|canvas|\bpage\b|\bbase\b|backdrop|\bbg\b|\bwall\b/,'Background'],[/surface|\bcards?\b|panel|window|tile/,'Surface'],[/border|stroke|outline|divider|\blines?\b|\bgrid\b/,'Border'],[/muted|secondary|caption/,'Secondary text'],[/\btext\b|\bink\b|foreground|font colou?r|headings?/,'Text'],[/shadow|glow/,'Glow'],[/focus/,'Focus ring'],[/error|danger/,'Error'],[/success/,'Success'],[/warning/,'Warning']];
const COLOUR_WORD=/(?:black|white|gr[ae]y|red|orange|yellow|green|teal|cyan|blue|indigo|violet|purple|pink|magenta|coral|cream|beige|gold|silver|brown|navy|lime|mint|peach|amber|crimson|charcoal|slate|ivory|sand|rose|lilac)/;
// A colour is named by the words around it. Prompts write either "accent #fe0" or "#fe0 accent", so the words before the
// colour (back to the last comma, bracket or earlier colour) are tried first and then the words after it.
function colourLabel(text,at,len){
 const cut=/[,;()]|\.\s|\n|#(?:[0-9a-fA-F]{3}){1,2}(?![0-9A-Za-z_-])/g,window=text.slice(Math.max(0,at-60),at).replace(/\(\s*$/,' '),stops=[...window.matchAll(cut)],last=stops[stops.length-1];
 // Words straight after an earlier colour belong to that colour ("#fe0 ink #aaa borders"), not to this one.
 const gap=window.slice(last?last.index+last[0].length:0).toLowerCase(),lead=/^\s*(?:with|and|on|plus)\s+/,before=last&&last[0][0]==='#'?(lead.test(gap)?gap.replace(lead,' '):''):gap;
 const after=text.slice(at+len,at+len+44).split(/[,;()]|\.\s|\n|#(?:[0-9a-fA-F]{3}){1,2}(?![0-9A-Za-z_-])|\s(?:with|and|on|for|plus)\s/)[0].toLowerCase();
 for(const [seg,nearest] of [[before,'last'],[after,'first']]){
  if(!seg.trim())continue;
  let best=null,bestAt=nearest==='last'?-1:1e9;
  for(const [re,name] of COLOUR_RULES){const hits=[...seg.matchAll(new RegExp(re.source,'g'))];if(!hits.length)continue;const found=nearest==='last'?hits[hits.length-1].index:hits[0].index;if(nearest==='last'?found>bestAt:found<bestAt){bestAt=found;best=name}}
  if(best)return best;
  const word=seg.split(/[^a-z-]+/).find(t=>COLOUR_WORD.test(t));if(word)return title(word);
 }
 const noun=w=>/^[a-z]{3,12}$/.test(w)&&!STOP.has(w);
 const prev=before.split(/[^a-z]+/).filter(noun).pop(),next=after.split(/[^a-z]+/).filter(noun)[0];
 return prev?title(prev):next?title(next):null;
}
const HEX=/#(?:[0-9a-fA-F]{3}){1,2}(?![0-9A-Za-z_-])/g,fullHex=h=>h.length===4?'#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]:h;
function detectColours(text){
 const seen=new Map(),re=HEX;let m,n=0;re.lastIndex=0;
 while((m=re.exec(text))){
  const key=m[0].toLowerCase();let c=seen.get(key);
  if(!c){c={id:'c:'+key,type:'colour',group:'colours',orig:key,label:colourLabel(text,m.index,m[0].length)||'Colour',spans:[],order:n++};seen.set(key,c)}
  c.spans.push([m.index,m.index+m[0].length]);
 }
 const used=new Map();
 for(const c of seen.values()){const k=c.label,count=(used.get(k)||0)+1;used.set(k,count);if(count>1)c.label=k+' '+count}
 return [...seen.values()].slice(0,30);
}
const FONT_SHAPE=/^[A-Z][A-Za-z0-9]*(?: [A-Z0-9][A-Za-z0-9]*){0,3}$/;
function detectFonts(text,paras){
 const names=new Map(),add=(name,at)=>{if(!names.has(name))names.set(name,at)};
 const typo=paras.filter(p=>p.label==='Typography'||p.label==='Font'||p.label==='Fonts');
 for(const p of typo){
  const body=text.slice(p.start,p.end);let m;
  const quoted=/["“]([^"”\n]{2,40})["”]/g;
  while((m=quoted.exec(body))){const name=m[1],after=body.slice(m.index+m[0].length,m.index+m[0].length+14);if(FONTS.includes(name)||(FONT_SHAPE.test(name)&&/^\s*(?:\(?\d{3}\b|for\b|,)/.test(after)))add(name,p.start+m.index+1)}
  const loose=/(?<![A-Za-z0-9"“])([A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*){0,3})(?= \(?\d{3}\b)/g;
  while((m=loose.exec(body)))add(m[1],p.start+m.index);
  for(const f of KNOWN){const i=body.search(wordRe(f));if(i>=0)add(f,p.start+i)}
 }
 // Older prompts say "Font Family: Rubik (sans-serif)" or "Font: Inter" on a line of their own, or "a font (like Inter)".
 for(const m of text.matchAll(/(?:^|\n)[ \t]*(?:\d+\.\s*)?(?:Font(?: Family)?s?|Typeface):[ \t]*([^\n]{2,120})/g)){
  const at=m.index+m[0].length-m[1].length;
  for(const part of m[1].split(/,|\band\b|\+|\/|\(/)){const name=part.replace(/^["“'\s]+|["”'\s.;]+$/g,'');if(name&&(KNOWN.includes(name)||FONT_SHAPE.test(name)&&!/^(?:Sans|Serif|Mono|Bold|Italic|Regular|Light|Medium)/.test(name)&&name.length<=32))add(name,at+m[1].indexOf(part))}
 }
 for(const m of text.matchAll(/\b(?:fonts?|typefaces?)\b[^.\n]{0,40}/gi))for(const f of KNOWN){const i=m[0].search(wordRe(f));if(i>=0)add(f,m.index+i)}
 const out=[];
 for(const [name,first] of names){
  const spans=[...text.matchAll(wordRe(name))].map(m=>[m.index,m.index+name.length]);if(!spans.length)continue;
  const ctx=text.slice(first+name.length,first+name.length+80).toLowerCase();
  const near=ctx.slice(0,42);
  let label=/mono|code/i.test(name)?'Label font':/\b(headings?|headlines?|display|titles?|numerals?|prices?|logo|wordmark)\b/.test(near)?'Heading font':/\b(body|paragraph|ui|text|copy|hints?)\b/.test(near)?'Body font':/\b(labels?|captions?|stats?)\b/.test(near)?'Label font':'Font';
  out.push({id:'f:'+name,type:'font',group:'fonts',orig:name,label,spans,order:first});
 }
 out.sort((a,b)=>a.order-b.order);const used=new Map();
 for(const f of out){const count=(used.get(f.label)||0)+1;used.set(f.label,count);if(count>1)f.label+=' '+count}
 return out;
}
function detectBrand(text){
 let m=/\bInvented ([a-z][a-z -]{1,30}?) (?:["“]([^"”\n]{2,40})["”]|([A-Z][A-Za-z0-9]+(?: [A-Z][A-Za-z0-9]+){0,2}))(?![a-z])/.exec(text),name=m&&(m[2]||m[3]),what=m&&m[1];
 if(!name){m=/\bLogo:[^\n"“]{0,30}["“]([^"”\n]{2,30})["”]/.exec(text);name=m&&m[1];what=null}
 if(!name)return null;
 const spans=[...text.matchAll(new RegExp('(?<![A-Za-z0-9])'+esc(name)+'(?![A-Za-z0-9])','gi'))].map(x=>[x.index,x.index+name.length]);
 return spans.length?{id:'b',type:'brand',group:'text',orig:name,label:'Brand name',hint:what?'The invented '+what:'',spans,order:-1}:null;
}
const ROLES=[[/sub-?head(?:line|ing)|subtitle|tagline|supporting|\bsub\b/,'Subheading',2],[/head(?:line|ing)|\btitle\b|\bh1\b/,'Headline',1],[/\bbuttons?\b|\bcta\b/,'Button',3],[/\blabel\b|\bchip\b|\bbadge\b|\beyebrow\b|\btag\b/,'Label',4],[/helper|caption|\bhint\b|footnote/,'Helper text',5],[/\blinks?\b|\bnav|\bmenu\b/,'Link',6],[/placeholder/,'Placeholder',7],[/error|message|toast|alert/,'Message',8]];
function detectText(text,paras,skip){
 const found=new Map(),re=/"([^"\n]{2,90})"|“([^”\n]{2,90})”/g;let m,n=0;
 while((m=re.exec(text))){
  const s=m[1]??m[2],at=m.index+1;
  if(inside(paras,at,'Rules')||inside(paras,at,'Technique notes'))continue;
  if(!/^[A-Z0-9]/.test(s)||!/[A-Za-z]/.test(s)||/[{};=<>_\\|]|\/\/|^#|^https?:/i.test(s)||/^\d+(\.\d+)?(px|s|ms|%|rem|vh|vw)?$/.test(s))continue;
  if(skip.has(s.toLowerCase()))continue;
  let c=found.get(s);
  if(!c){const clause=text.slice(Math.max(0,at-44),at).toLowerCase().split(/[.;]\s|\n/).pop().replace(/[^a-z0-9- ]/g,' ').slice(-34);let role='Text',rank=9,nearest=-1;for(const [r,name,k] of ROLES){const hits=[...clause.matchAll(new RegExp(r.source,'g'))];if(hits.length&&hits[hits.length-1].index>nearest){nearest=hits[hits.length-1].index;role=name;rank=k}}
   c={id:'t:'+s,type:'text',group:'text',orig:s,label:role,rank,spans:[],order:n++};found.set(s,c)}
  c.spans.push([at,at+s.length]);
 }
 const list=[...found.values()].slice(0,40);
 list.sort((a,b)=>a.rank-b.rank||a.order-b.order);
 const used=new Map();for(const c of list){const count=(used.get(c.label)||0)+1;used.set(c.label,count);if(count>1)c.label+=' '+count}
 return list;
}
function detectUrls(text){
 const found=new Map(),re=/https?:\/\/[^\s"'<>)\]]+/g;let m,n=0;
 while((m=re.exec(text))){
  const url=m[0].replace(/[.,;:]+$/,'');let c=found.get(url);
  if(!c){const ctx=/([A-Za-z][A-Za-z ]{2,24})[:=\s]*$/.exec(text.slice(Math.max(0,m.index-30),m.index));c={id:'u:'+url,type:'url',group:'links',orig:url,label:ctx?title(ctx[1].trim().toLowerCase()).replace(/\bUrl\b/g,'URL'):'Link',spans:[],order:n++};found.set(url,c)}
  c.spans.push([m.index,m.index+url.length]);
 }
 const list=[...found.values()].slice(0,6),used=new Map();
 for(const c of list){const count=(used.get(c.label)||0)+1;used.set(c.label,count);if(count>1)c.label+=' '+count}
 return list;
}
function detectToggles(text,paras){
 const out=[];
 for(const p of paras)if(p.label&&SECTION_LABELS[p.label])out.push({id:'s:'+p.label,type:'toggle',group:'sections',orig:true,label:SECTION_LABELS[p.label],span:[p.start,p.sepEnd],order:p.start});
 const rules=paras.find(p=>p.label==='Rules');
 if(rules){
  const body=text.slice(rules.start,rules.end);let m;
  if((m=/ ?Respect prefers-reduced-motion(?: \([^)]*\))?\./.exec(body)))out.push({id:'r:motion',type:'toggle',group:'sections',orig:true,label:'Respect the reduced-motion setting',span:[rules.start+m.index,rules.start+m.index+m[0].length],order:1e9});
  if((m=/ ?Invented names(?: only)?\./.exec(body)))out.push({id:'r:names',type:'toggle',group:'sections',orig:true,label:'Use only invented names',span:[rules.start+m.index,rules.start+m.index+m[0].length],order:1e9+1});
 }
 return out;
}
function detectFormat(text,paras){
 const rules=paras.find(p=>p.label==='Rules');let span=null;
 if(rules){const body=text.slice(rules.start,rules.end),m=/^Rules:\s*((?:Deliver )?(?:a )?[Ss]ingle HTML file[^.]*\.)/.exec(body);if(m){const s=rules.start+m[0].length-m[1].length;span=[s,s+m[1].length]}}
 return {id:'o:format',type:'format',group:'output',orig:'',label:'Output format',span};
}
function analyse(text){
 if(typeof text!=='string'||!text.trim())return null;
 const paras=paragraphs(text),brand=detectBrand(text),fonts=detectFonts(text,paras),skip=new Set([...fonts.map(f=>f.orig.toLowerCase()),brand?brand.orig.toLowerCase():'']);
 const controls=[...(brand?[brand]:[]),...detectText(text,paras,skip),...detectColours(text),...fonts,...detectUrls(text),...detectToggles(text,paras),detectFormat(text,paras),{id:'o:lang',type:'language',group:'output',orig:'',label:'Language of the on-screen copy'}];
 return {text,controls,byId:new Map(controls.map(c=>[c.id,c]))};
}

// ---- values and rendering ----------------------------------------------------------------------------------------------
function clean(c,v){
 switch(c.type){
  case 'colour':return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;
  case 'font':{const f=oneLine(v).replace(/[^A-Za-z0-9 +&'-]/g,'').trim().slice(0,40);return f||null}
  case 'brand':case 'text':{const t=oneLine(v).replace(/"/g,'”').slice(0,c.type==='brand'?60:200);return t||null}
  case 'url':return /^https?:\/\/[^\s"'<>]{1,300}$/.test(String(v).trim())?String(v).trim():null;
  case 'toggle':return v===false?false:null;
  case 'format':return Object.hasOwn(FORMAT_TEXT,v)?v:null;
  case 'language':return LANGUAGES.includes(v)&&v?v:null;
 }
 return null;
}
// The values that actually change something: cleaned, and different from what the prompt already says.
function active(analysis,values){
 const out=new Map();
 for(const c of analysis.controls){
  if(!Object.hasOwn(values,c.id))continue;
  const v=clean(c,values[c.id]);
  if(v===null||(c.type!=='toggle'&&(c.type==='colour'?fullHex(v)===fullHex(c.orig):v===c.orig)))continue;
  out.set(c.id,v);
 }
 return out;
}
const brandCase=(c,found,v)=>found===c.orig?v:found===c.orig.toUpperCase()?v.toUpperCase():found===c.orig.toLowerCase()?v.toLowerCase():v;
function prompt(analysis,values={}){
 const {text,controls}=analysis,act=active(analysis,values),edits=[];
 for(const c of controls){
  if(!act.has(c.id))continue;const v=act.get(c.id);
  if(c.spans)for(const [s,e] of c.spans)edits.push({s,e,v:c.type==='brand'?brandCase(c,text.slice(s,e),v):v});
  else if(c.type==='toggle')edits.push({s:c.span[0],e:c.span[1],v:''});
  else if(c.type==='format'&&c.span)edits.push({s:c.span[0],e:c.span[1],v:FORMAT_TEXT[v]});
 }
 // Larger edits win: a removed section drops any edit inside it, and no two edits overlap.
 edits.sort((a,b)=>a.s-b.s||(b.e-b.s)-(a.e-a.s));
 let out='',at=0;
 for(const ed of edits){if(ed.s<at)continue;out+=text.slice(at,ed.s)+ed.v;at=ed.e}
 out=(out+text.slice(at)).replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').replace(/\s+$/,'');
 const extra=[],format=act.get('o:format');
 if(format&&!analysis.byId.get('o:format').span)extra.push('Output format: '+FORMAT_TEXT[format]+' This replaces any earlier instruction about the output.');
 const lang=act.get('o:lang');if(lang)extra.push('Language: write all visible copy in '+lang+'. Keep the brand name, numbers and code unchanged.');
 return extra.length?out+'\n\n'+extra.join('\n'):out;
}
const htmlEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
// The same colour, font, brand, text and link swaps applied to the page's own code, so the Live view can follow.
function html(analysis,source,values={}){
 if(typeof source!=='string')return source;
 const act=active(analysis,values),pairs=[];
 for(const c of analysis.controls){
  if(!act.has(c.id))continue;const v=act.get(c.id);
  if(c.type==='colour')pairs.push({re:new RegExp(esc(c.orig)+'(?![0-9A-Za-z_-])','gi'),to:v});
  else if(c.type==='font'){pairs.push({re:wordRe(c.orig),to:v},{re:new RegExp(esc(c.orig.replace(/ /g,'+'))+'(?![A-Za-z0-9])','g'),to:v.replace(/ /g,'+')},{re:new RegExp(esc(c.orig.replace(/ /g,'%20'))+'(?![A-Za-z0-9])','g'),to:v.replace(/ /g,'%20')})}
  else if(c.type==='brand'){for(const from of new Set([c.orig,htmlEsc(c.orig)]))pairs.push({re:new RegExp('(?<![A-Za-z0-9])'+esc(from)+'(?![A-Za-z0-9])','gi'),fn:m=>brandCase(c,m===htmlEsc(c.orig).toUpperCase()?c.orig.toUpperCase():m===htmlEsc(c.orig).toLowerCase()?c.orig.toLowerCase():c.orig,htmlEsc(v))})}
  else if(c.type==='text'){for(const from of new Set([c.orig,htmlEsc(c.orig)]))pairs.push({re:new RegExp(esc(from),'g'),to:htmlEsc(v)})}
  else if(c.type==='url')pairs.push({re:new RegExp(esc(c.orig),'g'),to:v});
 }
 // Park every match behind a placeholder first, so one swap can never be swapped again by the next.
 const done=[];let out=source;
 pairs.forEach(p=>{out=out.replace(p.re,m=>{done.push(p.fn?p.fn(m):p.to);return '\u0000'+(done.length-1)+'\u0000'})});
 return out.replace(/\u0000(\d+)\u0000/g,(m,i)=>done[Number(i)]);
}

// ---- remembering ---------------------------------------------------------------------------------------------------------
function load(id){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');const v=all&&all[id];return v&&typeof v==='object'?v:{}}catch{return {}}}
function save(id,values){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}')||{};delete all[id];if(Object.keys(values).length)all[id]=values;const keys=Object.keys(all);for(const k of keys.slice(0,Math.max(0,keys.length-MAX_SAVED)))delete all[k];localStorage.setItem(STORE,JSON.stringify(all))}catch{}}

// ---- the boxes -----------------------------------------------------------------------------------------------------------
const GROUPS=[['text','Brand and text'],['colours','Colours'],['fonts','Fonts'],['links','Links'],['sections','Sections and rules'],['output','Output']];
function mount(id,promptText,{html:pageHtml=null,onChange=()=>{},document:doc=globalThis.document}={}){
 const analysis=analyse(promptText);if(!analysis)return null;
 const stored=load(id),values={};
 for(const c of analysis.controls)if(Object.hasOwn(stored,c.id)&&clean(c,stored[c.id])!==null)values[c.id]=stored[c.id];
 const el=(tag,props={},...kids)=>{const n=doc.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else if(v===true)n.setAttribute(k,'');else if(v!==false&&v!=null)n.setAttribute(k,v)}n.append(...kids);return n};
 const inputs=new Map(),uid='pc-'+Math.random().toString(36).slice(2,7);
 const count=()=>active(analysis,values).size;
 const summary=el('summary',{}),badge=el('span',{class:'prompt-changed'});
 function paint(){const n=count();summary.textContent='Customise this prompt';badge.textContent=n?` · ${n} changed`:'';badge.hidden=!n;summary.append(badge);reset.disabled=!n}
 function set(c,v){const valid=c.type==='toggle'?v===false:clean(c,v)!==null&&clean(c,v)!==c.orig&&(c.type!=='format'||v)&&(c.type!=='language'||v);if(valid)values[c.id]=v;else delete values[c.id];save(id,values);paint();onChange()}
 function field(c){
  const fid=`${uid}-${inputs.size}`;let control,wrap;
  if(c.type==='colour'){
   control=el('input',{type:'color',id:fid,value:fullHex(c.orig),'aria-label':`${c.label} colour, originally ${c.orig}`});
   const hex=el('code',{class:'prompt-hex',text:c.orig}),used=el('small',{text:`used ${c.spans.length}×`});
   control.addEventListener('input',()=>{hex.textContent=control.value;set(c,control.value)});
   wrap=el('div',{class:'prompt-swatch'},control,el('label',{for:fid,text:c.label}),hex,used);
   control.reset=()=>{control.value=values[c.id]||fullHex(c.orig);hex.textContent=control.value};
  }else if(c.type==='font'){
   const list=[...new Set([c.orig,...FONTS])];
   control=el('select',{id:fid},...list.map(f=>el('option',{value:f,text:f===c.orig?f+' (as written)':f})),el('option',{value:'\u0000other',text:'Other…'}));
   const other=el('input',{type:'text',maxlength:'40',placeholder:'Font name',autocomplete:'off','aria-label':c.label+' name'});other.hidden=true;
   const apply=()=>{other.hidden=control.value!=='\u0000other';set(c,other.hidden?control.value:other.value||c.orig)};
   control.addEventListener('change',apply);other.addEventListener('input',apply);
   wrap=el('div',{class:'prompt-field'},el('label',{for:fid,text:c.label}),control,other);
   control.reset=()=>{const v=values[c.id]||c.orig;if(list.includes(v)){control.value=v;other.hidden=true}else{control.value='\u0000other';other.value=v;other.hidden=false}};
  }else if(c.type==='toggle'){
   control=el('input',{type:'checkbox',id:fid});control.checked=true;
   control.addEventListener('change',()=>set(c,control.checked?true:false));
   wrap=el('div',{class:'prompt-toggle'},control,el('label',{for:fid,text:c.label}));
   control.reset=()=>{control.checked=values[c.id]!==false};
  }else if(c.type==='format'||c.type==='language'){
   const opts=c.type==='format'?FORMATS:LANGUAGES.map(l=>[l,l||'As written (English)']);
   control=el('select',{id:fid},...opts.map(([v,t])=>el('option',{value:v,text:t})));
   control.addEventListener('change',()=>set(c,control.value));
   wrap=el('div',{class:'prompt-field'},el('label',{for:fid,text:c.label}),control);
   control.reset=()=>{control.value=values[c.id]||''};
  }else{
   control=el('input',{type:c.type==='url'?'url':'text',id:fid,maxlength:c.type==='url'?'300':c.type==='brand'?'60':'200',autocomplete:'off',spellcheck:'false'});
   control.addEventListener('input',()=>set(c,control.value));
   wrap=el('div',{class:'prompt-field'+(c.type==='text'&&c.orig.length>40?' wide':'')},el('label',{for:fid,text:c.label}),control,...(c.hint?[el('small',{text:c.hint})]:[]));
   control.reset=()=>{control.value=values[c.id]??c.orig};
  }
  inputs.set(c.id,control);control.reset();return wrap;
 }
 const reset=el('button',{class:'button outline',type:'button',text:'Reset all changes'});
 const body=el('div',{class:'prompt-customise-body'},el('p',{class:'prompt-note',text:'Change anything below: the prompt updates as you go, and the Live page follows wherever it uses the same colours, fonts, words and links. Nothing leaves your browser.'}));
 for(const [group,heading] of GROUPS){
  const list=analysis.controls.filter(c=>c.group===group);if(!list.length)continue;
  const grid=el('div',{class:group==='colours'?'prompt-swatch-grid':group==='sections'?'prompt-toggle-list':'prompt-field-grid'}),limit=group==='colours'?8:group==='text'?7:99,more=el('div',{class:grid.className});
  list.forEach((c,i)=>(i<limit?grid:more).append(field(c)));
  const section=el('fieldset',{class:'prompt-group'},el('legend',{text:heading}),grid);
  if(more.childNodes.length)section.append(el('details',{class:'prompt-more'},el('summary',{text:`More ${group==='colours'?'colours':'text'} (${more.childNodes.length})`}),more));
  body.append(section);
 }
 reset.addEventListener('click',()=>{for(const k of Object.keys(values))delete values[k];for(const control of inputs.values())control.reset();save(id,values);paint();onChange()});
 body.append(el('div',{class:'prompt-field-actions'},reset));
 const node=el('details',{class:'prompt-customise'},summary,body);
 paint();if(count())node.open=true;
 return {node,text:()=>prompt(analysis,values),html:base=>html(analysis,base===undefined?pageHtml:base,values),changed:count,reset:()=>reset.click(),controlCount:analysis.controls.length};
}
return {analyse,prompt,html,active,mount,FONTS,FORMATS,LANGUAGES,STORE};
});
