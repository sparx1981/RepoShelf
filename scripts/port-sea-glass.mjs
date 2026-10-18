// Ports the Sea Glass web playground (https://github.com/mttmcknn/sea-glass, Apache License 2.0) into the RepoShelf UI showcase.
// Usage: node scripts/port-sea-glass.mjs /path/to/sea-glass-checkout
// Writes lib/ui-showcase/sea-glass.mjs and lib/ui-showcase/third-party/sea-glass-LICENSE.txt. The output is committed, so the
// showcase does not need the upstream checkout. Changes made to the upstream files (stated in the licence notice, as Apache-2.0 requires):
//   - ES modules became one classic script; exports and imports were removed.
//   - Selectors are scoped to a root element, so the component can sit inside any page.
//   - innerHTML assignments became DOMParser calls; the playground no longer saves its state in localStorage.
//   - The small components (buttons, toolbar, pebbles, shapes) are cut from the playground's markup and styles.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const src=process.argv[2];if(!src)throw Error('Usage: node scripts/port-sea-glass.mjs /path/to/sea-glass');
const web=src.replace(/\/$/,'')+'/web/dist/';
const read=name=>readFile(web+name,'utf8');
const [engine,state,app,html,css,license]=await Promise.all([read('sea-glass.mjs'),read('state.mjs'),read('app.mjs'),read('index.html'),read('styles.css'),readFile(src.replace(/\/$/,'')+'/LICENSE','utf8')]);
const must=(text,part,what)=>{if(!text.includes(part))throw Error('Upstream changed: '+what);return text};

// ---- script -------------------------------------------------------------------------------------------------------------------
const engineClassic=engine.replace(/^export (function|const|class)/gm,'$1').replace(/\/\*\*[\s\S]*?\*\/\n/,m=>m); // keep the doc comments
if(/^export /m.test(engineClassic)||/\bimport\b.*from/.test(engineClassic))throw Error('engine still has module syntax');
const stateClassic=state.replace(/^export (function|const)/gm,'$1');
const setMarkup="function setMarkup(target,markup){const parsed=new DOMParser().parseFromString(markup,'text/html');target.replaceChildren(...parsed.body.childNodes)}\n";
let appClassic=app.replace(/^import .*\n/gm,'');
appClassic=must(appClassic,"el.innerHTML=iconMarkup(el.dataset.icon)",'icon hydration').replace("el.innerHTML=iconMarkup(el.dataset.icon)","setMarkup(el,iconMarkup(el.dataset.icon))");
appClassic=appClassic.replace(/const storageKey=.*\n/,'').replace(/^try \{ const saved=JSON\.parse\(localStorage.*\n/m,'').replace(/function persist\(\) \{.*\}\n/,'function persist() {}\n');
if(/localStorage|storageKey/.test(appClassic))throw Error('state is still saved in localStorage');
appClassic=must(appClassic,"$('#shape-grid').innerHTML=",'shape grid').replace("$('#shape-grid').innerHTML=","setMarkup($('#shape-grid'),").replace(/(\)\.join\(''\))(;\n)(\$\$\('\[data-glass\]'\))/,"$1);\n$3");
appClassic=must(appClassic,"$('#palette-options').innerHTML=",'palette options').replace("$('#palette-options').innerHTML=","setMarkup($('#palette-options'),").replace(/(\)\.join\(''\))(;\nconst conversions)/,"$1);\nconst conversions");
appClassic=must(appClassic,"$('#comparison-grid').innerHTML=comparisonCard('pinned',pinned)+comparisonCard('current',recipe);",'comparison grid').replace("$('#comparison-grid').innerHTML=comparisonCard('pinned',pinned)+comparisonCard('current',recipe);","setMarkup($('#comparison-grid'),comparisonCard('pinned',pinned)+comparisonCard('current',recipe));");
if(/innerHTML\s*=/.test(appClassic))throw Error('an innerHTML assignment is left');
const playgroundJs=`(function(){\n'use strict';\n${engineClassic}\n${stateClassic}\n${setMarkup}${appClassic}\n})();`;

// ---- styles -------------------------------------------------------------------------------------------------------------------
function splitTop(text,char){const out=[];let depth=0,last=0;for(let i=0;i<text.length;i++){const c=text[i];if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===char&&depth===0){out.push(text.slice(last,i));last=i+1}}out.push(text.slice(last));return out}
function scopeSelector(selector,root){
 const s=selector.trim();if(!s)return '';
 if(s===':root'||s==='html'||s==='body')return root;
 const lead=/^(:root|html|body)(?=[\s.:#\[>+~])/.exec(s);if(lead)return root+s.slice(lead[1].length);
 return root+' '+s;
}
export function scopeCss(text,root){
 let out='',i=0;
 while(i<text.length){
  const open=text.indexOf('{',i);if(open<0){out+=text.slice(i);break}
  const prelude=text.slice(i,open).trim();let depth=1,j=open+1;
  while(j<text.length&&depth>0){if(text[j]==='{')depth++;else if(text[j]==='}')depth--;j++}
  const body=text.slice(open+1,j-1);
  if(/^@(media|supports)/.test(prelude))out+=prelude+'{'+scopeCss(body,root)+'}\n';
  else if(prelude.startsWith('@'))out+=prelude+'{'+body+'}\n';
  else out+=splitTop(prelude,',').map(sel=>scopeSelector(sel,root)).filter(Boolean).join(',')+'{'+body+'}\n';
  i=j;
 }
 return out.replace(/\/\*[\s\S]*?\*\//g,'');
}
const ruleList=text=>text.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+\{[^{}]*\}/g)||[];
const pick=(re)=>ruleList(css).filter(rule=>re.test(rule.split('{')[0].trim())).join('\n');

// ---- icons and shared pieces for the small components -----------------------------------------------------------------------
const paths={share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="5" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6m-7.6 7 7.6 4.6"/>',message:'<path d="M4 4h16v13H9l-5 4V4Z"/><path d="M8 8h8M8 12h8"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',pencil:'<path d="m16 3 5 5L8 21H3v-5L16 3ZM14 5l5 5M3 21l5-5"/>',more:'<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',plus:'<path d="M12 4v16M4 12h16"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const STAGE=(root)=>`${root}{--glass-ink:#2c6074;position:relative;overflow-x:clip;padding:44px 18px;border:1px solid #dde3d7;border-radius:16px;background:radial-gradient(ellipse at 50% 22%,#fbfcf7 0%,#edf0e9 80%);color:#253d36;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}
${root} button{font:inherit;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}
${root} .glass{position:relative;isolation:isolate;overflow:visible;border:0;background:transparent;color:var(--glass-ink,#2c6074);flex-shrink:0}
${root} .glass>canvas{z-index:-1;position:absolute;pointer-events:none}
${root} .glass span,${root} .glass svg{position:relative;pointer-events:none}
${root} .glass:focus-visible{outline-offset:8px}
${root} .glass[data-glass]:is(button):active{transform:translateY(2px)}
${root} .note{margin:30px 0 0;font:italic 13px Georgia,"Times New Roman",serif;color:#667c68}`;
const DRIVER=(root,extra='')=>`(function(){
'use strict';
${engineClassic}
var host=document.querySelector('${root}'),renderers=[];
function setup(el){
 var r=mountGlass(el,{shape:el.dataset.shape||'rounded',palette:el.dataset.palette||'lagoon',seed:Number(el.dataset.seed)||0});
 renderers.push([el,r]);
 el.addEventListener('pointerdown',function(){r.update({elevation:5})});
 ['pointerup','pointercancel','pointerleave'].forEach(function(type){el.addEventListener(type,function(){r.update({elevation:8})})});
}
host.querySelectorAll('[data-glass]').forEach(setup);
${extra}
})();`;
const say=(root)=>`<p class="note" role="status" id="${root}-status">Press them. They have a little give.</p>`;

const items=[];
const family='Sea Glass';
const base={family};

// 1. buttons
items.push({...base,id:'s-sea-glass-buttons',title:'Sea glass buttons',component:'Glass button',key:'sea-glass-button',width:760,
 description:'Frosted, softly tumbled glass buttons in five pastel colours that give a little when pressed.',
 prompt:'Build a set of buttons that look like pieces of frosted sea glass: a large Compose button with a pencil icon, a smaller "New idea" button, a toggle that reads "Save a moment" and becomes "Moment saved" when pressed, and a rounded tag chip. Each button is a native button element with real text and an accessible name, drawn over a transparent background by a canvas behind it. Draw one seeded, slightly uneven pebble outline per button, a microscopic frost texture, a curved coloured interior and a luminous lower edge, so no two buttons are alike but every button keeps its own shape when the page is resized. Use five soft palettes (lagoon blue, lilac, rose, amber, mint). Lower the lift on press and restore it on release. Keep the text readable, keep keyboard focus visible, and use plain HTML, CSS and JavaScript with no libraries.',
 css:`${STAGE('.sgb')}
.sgb-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:30px 26px;margin:0}
.sgb-compose{width:260px;height:86px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:24px;letter-spacing:-.5px;font-weight:550}
.sgb-compose svg{width:32px;height:32px;stroke-width:2.3}
.sgb-small{height:58px;padding:0 28px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:550}
.sgb-small svg{width:20px;height:20px;stroke-width:2.2}
.sgb-chip{height:46px;padding:0 24px;font-size:13px;font-weight:550;letter-spacing:.2px}
@media(max-width:520px){.sgb-compose{width:220px;height:76px;font-size:21px}}`,
 html:`<div class="sgb">
 <div class="sgb-row"><button class="glass sgb-compose" data-glass data-shape="rounded" data-palette="lagoon" data-seed="33"><span>${icon('pencil')}</span><span>Compose</span></button></div>
 <div class="sgb-row" style="margin-top:34px"><button class="glass sgb-small" data-glass data-shape="rounded" data-palette="rose" data-seed="25"><span>${icon('plus')}</span><span>New idea</span></button><button class="glass sgb-small" id="sgb-save" data-glass data-shape="rounded" data-palette="lagoon" data-seed="144" aria-pressed="false"><span>${icon('bookmark')}</span><span id="sgb-save-text">Save a moment</span></button><button class="glass sgb-chip" data-glass data-shape="capsule" data-palette="mint" data-seed="111" aria-pressed="true"><span>Calm</span></button><button class="glass sgb-chip" data-glass data-shape="capsule" data-palette="amber" data-seed="97" aria-pressed="false"><span>Warm</span></button></div>
 ${say('sgb')}
</div>`,
 js:DRIVER('.sgb',`var save=document.getElementById('sgb-save'),text=document.getElementById('sgb-save-text'),status=document.getElementById('sgb-status');
host.querySelectorAll('[aria-pressed]').forEach(function(button){button.addEventListener('click',function(){
 var on=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(on));button.style.opacity=on?'1':'.7';
 if(button===save){text.textContent=on?'Moment saved':'Save a moment';status.textContent=on?'Saved for later.':'Removed.'}
})});
host.querySelectorAll('button:not([aria-pressed])').forEach(function(button){button.addEventListener('click',function(){status.textContent=button.textContent.trim()+' pressed.'})});`),
 thumb:{wait:900}});

// 2. toolbar
items.push({...base,id:'s-sea-glass-toolbar',title:'Sea glass toolbar',component:'Glass toolbar',key:'sea-glass-toolbar',width:760,
 description:'A capsule of frosted glass holding icon actions, with a glass view switcher beside it.',
 prompt:'Build a toolbar made of one capsule of frosted sea glass with five icon buttons inside it (share, comments, download, edit, more). The capsule is a container with role group and an accessible label; every icon button is a native button with an aria-label and a visible focus ring. Draw the capsule on a canvas behind the buttons with a seeded, slightly uneven outline, microscopic frost, a curved coloured interior and a luminous lower edge. Add a second smaller glass capsule that works as a three-way view switcher (Grid, List, Gallery) using aria-pressed on its buttons. Announce each action in a polite status line. Lilac glass, plain HTML, CSS and JavaScript only.',
 css:`${STAGE('.sgt')}
.sgt-bar{height:80px;width:min(100%,430px);margin:0 auto;display:flex;align-items:center;justify-content:space-evenly;padding:0 16px}
.sgt-icon{position:relative;width:48px;height:48px;display:grid;place-items:center;border:0;background:transparent;border-radius:50%;color:inherit}
.sgt-icon:hover{background:#ffffff25}
.sgt-icon:active{transform:translateY(2px)}
.sgt-icon svg{width:24px;height:24px;stroke-width:2.2}
.sgt-view{height:50px;width:min(100%,300px);margin:34px auto 0;display:flex;align-items:center;justify-content:space-evenly;padding:0 10px}
.sgt-view button{border:0;background:transparent;padding:8px 12px;font-size:13px;font-weight:500;border-radius:999px;opacity:.7}
.sgt-view button[aria-pressed=true]{opacity:1;font-weight:700;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}`,
 html:`<div class="sgt">
 <div class="glass sgt-bar" data-glass data-shape="capsule" data-palette="lilac" data-seed="11" role="group" aria-label="Document actions"><button class="sgt-icon" aria-label="Share" data-say="Share link copied"><span>${icon('share')}</span></button><button class="sgt-icon" aria-label="Comments" data-say="Comments opened"><span>${icon('message')}</span></button><button class="sgt-icon" aria-label="Download" data-say="Download started"><span>${icon('download')}</span></button><button class="sgt-icon" aria-label="Edit" data-say="Ready to edit"><span>${icon('pencil')}</span></button><button class="sgt-icon" aria-label="More actions" data-say="More actions opened"><span>${icon('more')}</span></button></div>
 <div class="glass sgt-view" data-glass data-shape="capsule" data-palette="mint" data-seed="155" role="group" aria-label="Collection view"><button aria-pressed="true">Grid</button><button aria-pressed="false">List</button><button aria-pressed="false">Gallery</button></div>
 ${say('sgt')}
</div>`,
 js:DRIVER('.sgt',`var status=document.getElementById('sgt-status');
host.querySelectorAll('[data-say]').forEach(function(button){button.addEventListener('click',function(){status.textContent=button.dataset.say+'.'})});
var views=host.querySelectorAll('.sgt-view button');
views.forEach(function(button){button.addEventListener('click',function(){views.forEach(function(other){other.setAttribute('aria-pressed',String(other===button))});status.textContent=button.textContent+' view.'})});`),
 thumb:{wait:900}});

// 3. pebbles
items.push({...base,id:'s-sea-glass-pebbles',title:'Sea glass colour pebbles',component:'Glass swatch',key:'sea-glass-swatch',width:760,
 description:'Round glass pebbles that pick the colour of a glass button, each one slightly different.',
 prompt:'Build a colour picker made of round pieces of frosted sea glass. Five disc-shaped pebbles (amber, mint, lilac, rose, lagoon) are native buttons with aria-labels such as "Choose lilac glass" and aria-pressed for the selected one. Next to them sits a large glass button that takes the chosen colour straight away, without redrawing its outline. Each pebble is drawn on a canvas behind the button with a seeded, slightly uneven outline, microscopic frost, a curved coloured interior and a luminous lower edge, so no two pebbles are the same size or shape even with the same settings. Keep keyboard focus visible, announce the chosen colour in a polite status line, and use plain HTML, CSS and JavaScript.',
 css:`${STAGE('.sgk')}
.sgk-target{width:240px;height:80px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:14px;font-size:22px;font-weight:550;letter-spacing:-.4px}
.sgk-target svg{width:28px;height:28px;stroke-width:2.3}
.sgk-row{display:flex;justify-content:center;flex-wrap:wrap;gap:24px;margin:40px 0 0}
.sgk-pebble{width:70px;height:68px;padding:0}
.sgk-pebble[aria-pressed=true]::after{content:"";position:absolute;left:50%;bottom:-18px;width:6px;height:6px;border-radius:50%;background:#385e50;transform:translateX(-50%)}`,
 html:`<div class="sgk">
 <button class="glass sgk-target" data-glass data-shape="rounded" data-palette="lagoon" data-seed="33" id="sgk-target"><span>${icon('pencil')}</span><span>Compose</span></button>
 <div class="sgk-row" role="group" aria-label="Glass colour"><button class="glass sgk-pebble" data-glass data-shape="disc" data-palette="amber" data-seed="61" data-choose="amber" aria-label="Choose warm amber glass" aria-pressed="false"></button><button class="glass sgk-pebble" data-glass data-shape="disc" data-palette="mint" data-seed="72" data-choose="mint" aria-label="Choose seafoam glass" aria-pressed="false"></button><button class="glass sgk-pebble" data-glass data-shape="disc" data-palette="lilac" data-seed="86" data-choose="lilac" aria-label="Choose lilac glass" aria-pressed="false"></button><button class="glass sgk-pebble" data-glass data-shape="disc" data-palette="rose" data-seed="49" data-choose="rose" aria-label="Choose rose glass" aria-pressed="false"></button><button class="glass sgk-pebble" data-glass data-shape="disc" data-palette="lagoon" data-seed="18" data-choose="lagoon" aria-label="Choose lagoon glass" aria-pressed="true"></button></div>
 ${say('sgk')}
</div>`,
 js:DRIVER('.sgk',`var target=renderers.filter(function(pair){return pair[0].id==='sgk-target'})[0][1],status=document.getElementById('sgk-status'),pebbles=host.querySelectorAll('[data-choose]');
pebbles.forEach(function(button){button.addEventListener('click',function(){
 pebbles.forEach(function(other){other.setAttribute('aria-pressed',String(other===button))});
 target.update({},button.dataset.choose);status.textContent=button.dataset.choose.charAt(0).toUpperCase()+button.dataset.choose.slice(1)+' glass.'});
});`),
 thumb:{click:'[data-choose=lilac]',wait:900}});

// 4. shapes
items.push({...base,id:'s-sea-glass-shapes',title:'Sea glass shapes',component:'Glass shapes',key:'sea-glass-shapes',width:760,
 description:'Six pieces of glass from one set of settings. A shape seed makes each outline its own.',
 prompt:'Build a specimen board of six pieces of frosted sea glass: discs, rounded squares and one capsule, in different pastel colours. Each piece is a native button with an aria-label naming its colour and seed, drawn on a canvas behind it. A seeded random number generator builds each outline from a few low sine waves around a nearly half-round corner, so the same settings with a different seed give a different, believable pebble, and the same seed always gives the same pebble at any size. Add a "Tumble" range input from 0 to 6.5 percent that changes how uneven the outlines are, labelled and keyboard accessible. Label each piece "PIECE 17 / LAGOON" underneath. Plain HTML, CSS and JavaScript only.',
 css:`${STAGE('.sgs')}
.sgs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 20px;margin:0}
.sgs-item{display:flex;flex-direction:column;align-items:center;gap:15px}
.sgs-item .glass{width:95px;height:95px;padding:0}
.sgs-item span.label{font-size:9px;letter-spacing:1px;color:#7c8d80}
.sgs-tumble{display:flex;justify-content:center;align-items:center;gap:12px;margin:34px 0 0;font-size:12px}
.sgs-tumble input{width:min(60%,260px);accent-color:#557b61}
@media(max-width:520px){.sgs-item .glass{width:76px;height:76px}.sgs-item span.label{font-size:7px}}`,
 html:`<div class="sgs">
 <div class="sgs-grid"><div class="sgs-item"><button class="glass" data-glass data-shape="disc" data-palette="amber" data-seed="4" aria-label="Amber glass, seed 4"></button><span class="label">PIECE 04 / AMBER</span></div><div class="sgs-item"><button class="glass" data-glass data-shape="rounded" data-palette="lagoon" data-seed="17" aria-label="Lagoon glass, seed 17"></button><span class="label">PIECE 17 / LAGOON</span></div><div class="sgs-item"><button class="glass" data-glass data-shape="disc" data-palette="mint" data-seed="29" aria-label="Mint glass, seed 29"></button><span class="label">PIECE 29 / MINT</span></div><div class="sgs-item"><button class="glass" data-glass data-shape="rounded" data-palette="rose" data-seed="38" aria-label="Rose glass, seed 38"></button><span class="label">PIECE 38 / ROSE</span></div><div class="sgs-item"><button class="glass" data-glass data-shape="capsule" data-palette="lilac" data-seed="51" aria-label="Lilac glass, seed 51" style="width:115px;height:76px"></button><span class="label">PIECE 51 / LILAC</span></div><div class="sgs-item"><button class="glass" data-glass data-shape="disc" data-palette="lagoon" data-seed="63" aria-label="Lagoon glass, seed 63"></button><span class="label">PIECE 63 / LAGOON</span></div></div>
 <label class="sgs-tumble" for="sgs-tumble"><span>Tumble <output id="sgs-tumble-value">2.5%</output></span><input id="sgs-tumble" type="range" min="0" max="65" value="25" aria-valuetext="2.5%"></label>
 <p class="note">Same settings, different histories. Change the tumble to see the edges drift.</p>
</div>`,
 js:DRIVER('.sgs',`var range=document.getElementById('sgs-tumble'),out=document.getElementById('sgs-tumble-value');
range.addEventListener('input',function(){var value=Number(range.value)/1000,text=(value*100).toFixed(1)+'%';out.textContent=text;range.setAttribute('aria-valuetext',text);renderers.forEach(function(pair){pair[1].update({tumble:value})})});`),
 thumb:{wait:900}});

// 5. full playground
const body=must(html,'<header class="topbar">','page header').slice(html.indexOf('<header class="topbar">'),html.indexOf('<script type="module"')).replace('href="./"','href="#"');
if(/https?:\/\//.test(body.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,'')))throw Error('the playground markup links to the network');
items.push({...base,id:'s-sea-glass-playground',title:'Sea glass material playground',component:'Glass playground',key:'sea-glass-playground',width:1180,
 description:'The full playground: shape the frost, tumble, thickness and light of every glass piece live, compare two directions and copy the recipe.',
 prompt:'Build an interactive playground for a frosted sea glass material in plain HTML, CSS and JavaScript. A preview area has three tabs (original feel, no two alike, everyday magic) showing glass buttons, a capsule toolbar, round pebbles and small app-like cards. Each glass piece is a native button or container drawn by a canvas behind its content: one seeded, slightly uneven outline drives a microscopic frost texture, a curved coloured interior, a luminous lower edge and soft transmitted light. A side panel offers three presets, five pastel palettes plus a coastal mix, and range inputs for frost, grain, tumble, thickness, bulge, lift, light direction and transmission, plus a shape seed with shuffle and a frost on/off switch. Add "Pin this direction" and a side-by-side comparison dialog, a "Copy recipe" button that copies the settings as JSON, light and dark scenes, a polite toast for feedback, full keyboard support and visible focus. Respect reduced motion and keep it usable down to 360px wide.',
 css:`.sgp{overflow-x:clip} /* the glass canvases reach 48px past their piece; keep them from widening the page */\n${scopeCss(css,'.sgp')}`,
 html:`<div class="sgp">\n${body.trim()}\n</div>`,
 js:playgroundJs,thumb:{eval:"document.querySelector('.stage-toolbar').scrollIntoView({block:'start'})",wait:1300}});

// ---- licence ----------------------------------------------------------------------------------------------------------------------
const NOTICE='Sea Glass by mttmcknn (https://github.com/mttmcknn/sea-glass), Apache License 2.0. Changed for RepoShelf: ported from ES modules to one plain script, selectors scoped, innerHTML replaced and local storage removed. Licence: https://www.apache.org/licenses/LICENSE-2.0 and https://www.reposhelf.co.uk/licences.html';
const LICENCE_TEXT=`Sea Glass by mttmcknn
https://github.com/mttmcknn/sea-glass

This component is a port of the Sea Glass web playground, which is licensed under the Apache License, Version 2.0 (full text below).

Changes made by RepoShelf, as the licence requires us to state:
- The ES modules were combined into one classic script and their exports and imports removed.
- Every style rule was scoped to a root element so the component can sit inside any page.
- innerHTML assignments were replaced by DOMParser calls, and the playground no longer saves its state in local storage.
- The buttons, toolbar, colour pebbles and shapes components were cut from the playground's own markup and styles; the descriptions and prompts are new.

Keep this notice and the licence text with any code you reuse.

${license.trim()}
`;
await mkdir(new URL('../lib/ui-showcase/third-party/',import.meta.url),{recursive:true});
await writeFile(new URL('../lib/ui-showcase/third-party/sea-glass-LICENSE.txt',import.meta.url),license);
const out=`// GENERATED by scripts/port-sea-glass.mjs from https://github.com/mttmcknn/sea-glass (Apache License 2.0). Do not edit by hand.
// Sea Glass is third-party code, so every item carries its own licence notice instead of the RepoShelf showcase licence.
export const SEA_GLASS_NOTICE=${JSON.stringify(NOTICE)};
export const SEA_GLASS_LICENCE_TEXT=${JSON.stringify(LICENCE_TEXT)};
const items=${JSON.stringify(items,null,1)};
export const seaGlass=items.map(item=>({...item,licence:SEA_GLASS_NOTICE,licenceText:SEA_GLASS_LICENCE_TEXT}));
`;
await writeFile(new URL('../lib/ui-showcase/sea-glass.mjs',import.meta.url),out);
console.log('Wrote',items.length,'Sea Glass items');
