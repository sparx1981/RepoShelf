import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const C=createRequire(import.meta.url)('../dist/prompt-customise.js');
import {QUOTED,UNQUOTED,NUMBERED,PAGE,VIDEO,SHORT} from './fixtures/prompts.mjs';
// Prompts written in the library's format (labelled paragraphs, quoted copy, an invented brand, a Rules line).
const byLabel=(a,label)=>a.controls.find(c=>c.label===label);

// ---- detection ----
const q=C.analyse(QUOTED),ids=q.controls.map(c=>c.id);
assert.equal(q.byId.get('b').orig,'Kiln & Co');assert.equal(q.byId.get('b').spans.length,2,'every use of the brand name, including the wordmark');assert.match(q.byId.get('b').hint,/studio/);
assert.deepEqual(q.controls.filter(c=>c.type==='font').map(c=>[c.label,c.orig]),[['Heading font','Fraunces'],['Body font','DM Sans'],['Label font','DM Mono']],'quoted fonts, in order, with their roles');
assert.equal(q.controls.filter(c=>c.type==='colour').length,7,'every distinct colour once (#d9582b is used twice)');assert.equal(q.byId.get('c:#d9582b').spans.length,2);
assert.deepEqual(q.controls.filter(c=>c.type==='colour').slice(0,5).map(c=>c.label),['Background','Surface','Border','Text','Secondary text'],'colours are named by the words around them');
assert.deepEqual([q.byId.get('c:#d9582b').label,q.byId.get('c:#b44420').label],['Accent','Hover'],'an accent and its hover shade');
const texts=q.controls.filter(c=>c.type==='text');
assert.equal(texts[0].label,'Headline');assert.equal(texts[0].orig,'Clay you can hold.');assert(texts.some(t=>t.orig==='Book a class'&&t.label==='Button'),'buttons are named');assert(texts.some(t=>t.orig==='Open studio, Leeds'&&t.label==='Label'));
assert(!texts.some(t=>t.orig==='Kiln & Co'||t.orig==='Fraunces'),'the brand and font names are not also text boxes');
assert(!texts.some(t=>/^(Classes|hidden)$/.test(t.orig)),'unquoted words and code are not text');
const rank=texts.map(t=>t.label);assert(rank.indexOf('Headline')<rank.indexOf('Button'),'important text comes first');
assert.deepEqual(q.controls.filter(c=>c.type==='url').map(c=>c.orig),['https://cdn.example.com/clay-loop.mp4']);assert.match(q.controls.find(c=>c.type==='url').label,/video url/i,'links are named by the words before them');
assert.deepEqual(q.controls.filter(c=>c.type==='toggle').map(c=>c.label),['Interaction and animation','Responsive behaviour','Respect the reduced-motion setting','Use only invented names'],'optional sections and rules');
assert.equal(q.byId.get('o:format').span!==null,true,'the single-HTML sentence is found');assert(ids.includes('o:lang'));
// unquoted fonts and brand, "#hex label" colour style
const u=C.analyse(UNQUOTED);assert.equal(u.byId.get('b').orig,'Seedling');assert.deepEqual(u.controls.filter(c=>c.type==='font').map(c=>c.orig),['Newsreader','Hanken Grotesk']);
assert.deepEqual(u.controls.filter(c=>c.type==='colour').map(c=>c.label),['Cream','Text','Secondary text','Accent','Accent 2'],'labels that follow a colour belong to it, not to the next colour');
assert.equal(u.byId.get('o:format').span!==null,true,'the "Deliver a single HTML file" wording is found too');
// numbered (SceneAI-style) prompts: colours, logo, links and copy still work; no section toggles; output is appended
const n=C.analyse(NUMBERED);assert.equal(n.byId.get('b').orig,'Oasis');assert.equal(n.controls.filter(c=>c.type==='colour').length,3);assert.equal(n.byId.get('c:#a1a1aa').orig,'#a1a1aa','colours are matched case-insensitively');
assert.equal(n.controls.filter(c=>c.type==='toggle').length,0);assert.equal(n.byId.get('o:format').span,null);assert(n.controls.some(c=>c.type==='url'));
assert.deepEqual(n.controls.filter(c=>c.type==='text').map(c=>c.orig).sort(),['Build faster','Pricing','Product','Ship with confidence.']);
assert.equal(C.analyse('   '),null);assert.equal(C.analyse(null),null);assert.equal(C.analyse(42),null);
const plain=C.analyse('Just build me a page about cats.');assert.deepEqual(plain.controls.map(c=>c.id),['o:format','o:lang'],'a prompt with nothing to swap still offers output format and language');

// numbered markdown style: fonts on a "Font Family:" line, colours in brackets named by the words before the bracket
const v=C.analyse(VIDEO);assert.deepEqual(v.controls.filter(c=>c.type==='font').map(c=>[c.orig,c.spans.length]),[['Rubik',2]],'a font named on a Font Family line is found everywhere it is used');
assert.deepEqual(v.controls.filter(c=>c.type==='colour').map(c=>[c.orig,c.label]),[['#21346e','Background'],['#161a20','Text']]);assert.equal(v.controls.find(c=>c.type==='url').label,'Video URL');
assert.deepEqual(v.controls.filter(c=>c.type==='text').map(c=>c.orig).sort(),['GET STARTED','NEW ERA','OF DESIGN']);
assert(C.prompt(v,{'f:Rubik':'Sora'}).split('Sora').length-1===2&&!C.prompt(v,{'f:Rubik':'Sora'}).includes('Rubik'));assert(C.prompt(v,{'o:format':'vue'}).endsWith('This replaces any earlier instruction about the output.'));
// short colours and fonts without weights; a short colour never matches the start of a longer one
const sh=C.analyse(SHORT);assert.deepEqual(sh.controls.filter(c=>c.type==='colour').map(c=>c.orig),['#0c0c0f','#fff','#ff6b4a','#ffd166','#6ee7b7']);assert.deepEqual(sh.controls.filter(c=>c.type==='font').map(c=>c.orig),['Instrument Serif','Inter']);
let shOut=C.prompt(sh,{'c:#fff':'#ff0000'});assert(shOut.includes('(#ff0000)')&&shOut.includes('#ffd166')&&!shOut.includes('#fff,'),'#fff is swapped without touching #ffd166');assert.equal(C.prompt(sh,{'c:#fff':'#ffffff'}),SHORT,'the same colour written in full changes nothing');
assert(C.prompt(sh,{'o:format':'react'}).includes('Rules: Deliver a React 18'));
assert.equal(C.html(sh,'<p style="color:#FFF;background:#ffd166">x</p>',{'c:#fff':'#000000'}),'<p style="color:#000000;background:#ffd166">x</p>','short colours in a page are matched exactly');

// ---- nothing changed means nothing changes ----
assert.equal(C.prompt(q,{}),QUOTED);assert.equal(C.prompt(q,{'c:#d9582b':'#D9582B','f:Fraunces':'Fraunces','b':'Kiln & Co','s:Interaction':true}),QUOTED,'values equal to the original change nothing');
assert.equal(C.prompt(q,{'c:#nothere':'#ffffff','zzz':'x'}),QUOTED,'unknown boxes are ignored');
// ---- replacements ----
let out=C.prompt(q,{'c:#d9582b':'#2a9d8f'});assert.equal(out.split('#2a9d8f').length-1,2,'one swap changes every use');assert(!out.includes('#d9582b'));assert(out.includes('#b44420'),'other colours are untouched');
// swapping a colour for one the prompt already uses never cascades
out=C.prompt(q,{'c:#d9582b':'#b44420','c:#b44420':'#000000'});assert(out.includes('Accent kiln orange #b44420'),'orange became the hover shade');assert(out.includes('hover #000000'),'and the hover shade became black, independently');assert.equal(out.split('#b44420').length-1,2,'both old orange uses became the hover colour');assert.equal(out.split('#000000').length-1,1);
out=C.prompt(q,{'b':'Ember Works'});assert.equal(out.split('Ember Works').length-1,2);assert(!out.includes('Kiln & Co'));
const shout=C.prompt(C.analyse('Invented shop "Pebble". Wordmark "PEBBLE" and pebble.'),{b:'Stone'});assert.equal(shout,'Invented shop "Stone". Wordmark "STONE" and stone.','the brand keeps the capitalisation of each use');
out=C.prompt(q,{'f:Fraunces':'Sora','f:DM Mono':'JetBrains Mono'});assert(out.includes('"Sora" 600/700')&&out.includes('"JetBrains Mono" 400')&&!out.includes('Fraunces')&&out.includes('"DM Sans"'));
out=C.prompt(u,{'f:Newsreader':'Lora'});assert(out.includes('Lora 500/600')&&!out.includes('Newsreader'));
out=C.prompt(q,{'t:Clay you can hold.':'Make it by hand.','t:Book a class':'Join us','u:https://cdn.example.com/clay-loop.mp4':'https://media.example.org/new.mp4'});assert(out.includes('"Make it by hand."')&&out.includes('button "Join us"')&&out.includes('video URL: https://media.example.org/new.mp4')&&!out.includes('clay-loop'));
// a changed text keeps its quotes and can never add new ones, lines or markup that escape them
out=C.prompt(q,{'t:Book a class':'Say "hi"\nthere\r\n<b>x</b>'});assert(out.includes('button "Say ”hi” there <b>x</b>"'),out.match(/button "[^\n]*/)[0]);assert.equal(out.split('\n').length,QUOTED.split('\n').length,'a value never adds lines');
// invalid values are ignored rather than half-applied
for(const bad of [{'c:#d9582b':'red'},{'c:#d9582b':'#12345'},{'c:#d9582b':'javascript:1'},{'u:https://cdn.example.com/clay-loop.mp4':'javascript:alert(1)'},{'u:https://cdn.example.com/clay-loop.mp4':'https://x.test/a b'},{'f:Fraunces':'!!!'},{'o:format':'cobol'},{'o:lang':'Klingon'},{'b':'   '}])assert.equal(C.prompt(q,bad),QUOTED,JSON.stringify(bad));
assert(C.prompt(q,{'f:Fraunces':'Fira <script>'}).includes('"Fira script" 600/700'),'font names are reduced to safe characters');
// ---- sections and rules ----
out=C.prompt(q,{'s:Interaction':false});assert(!out.includes('Interaction:')&&!out.includes('types in over 900ms')&&out.includes('Responsive:'));assert(!/\n{3,}/.test(out),'removing a section leaves no gap');
out=C.prompt(q,{'s:Interaction':false,'s:Responsive':false});assert(out.includes('Layout:')&&out.includes('Rules:')&&!out.includes('Responsive:'));
out=C.prompt(q,{'r:motion':false,'r:names':false});assert(!/reduced-motion/.test(out)&&!/Invented names/.test(out)&&out.includes('Visible focus 3px #d9582b.')&&out.endsWith('Visible focus 3px #d9582b.'),'rule sentences come out cleanly: '+out.slice(-120));
// an edit inside a section that is switched off is dropped with it
out=C.prompt(q,{'s:Interaction':false,'t:That email looks incomplete':'Nope'});assert(!out.includes('Nope')&&!out.includes('looks incomplete'));
// the last paragraph can be removed without leaving blank lines at the end
out=C.prompt(C.analyse('Layout: x.\n\nInteraction: y.'),{'s:Interaction':false});assert.equal(out,'Layout: x.');
// ---- output format and language ----
out=C.prompt(q,{'o:format':'react'});assert(out.includes('Rules: Deliver a React 18 function component styled with Tailwind CSS')&&!/Single HTML file/.test(out)&&out.includes('[hidden]{display:none!important}'),'the output sentence is replaced where it is');
out=C.prompt(u,{'o:format':'vue'});assert(out.includes('Rules: Deliver a Vue 3 single-file component')&&out.includes('Use invented names only.'));
out=C.prompt(n,{'o:format':'next'});assert(out.endsWith('This replaces any earlier instruction about the output.')&&out.includes('\n\nOutput format: Deliver a Next.js App Router'),'prompts without that sentence get an override line');
out=C.prompt(q,{'o:lang':'French'});assert(out.endsWith('\n\nLanguage: write all visible copy in French. Keep the brand name, numbers and code unchanged.'));assert.equal(out.slice(0,QUOTED.length),QUOTED);
out=C.prompt(n,{'o:format':'svelte','o:lang':'German'});assert(out.endsWith('unchanged.')&&out.indexOf('Output format:')<out.indexOf('Language:'));

// ---- the Live page follows the same swaps ----
let page=C.html(q,PAGE,{'c:#d9582b':'#2a9d8f','f:Fraunces':'Sora','f:DM Sans':'Manrope','b':'Ember Works','t:Clay you can hold.':'Make <it> "by" hand.','t:Book a class':'Join','u:https://cdn.example.com/clay-loop.mp4':'https://media.example.org/new.mp4'});
assert(page.includes('--a:#2a9d8f')&&!/d9582b/i.test(page),'colours match whatever case the page used');assert(page.includes('family=Sora:wght@600&family=Manrope')&&page.includes('font-family:\'Manrope\'')&&page.includes('font-family:"Sora"'),'both the font stylesheet and the CSS follow');
assert(page.includes('<h1>Make &lt;it&gt; \u201dby\u201d hand.</h1>'),'new words go in as text, never as markup');assert(page.includes('<a>Join</a>')&&page.includes('Ember Works</b>')&&page.includes('src="https://media.example.org/new.mp4"'));
assert.equal(C.html(q,PAGE,{}),PAGE);assert.equal(C.html(q,PAGE,{'c:#d9582b':'#b44420','c:#b44420':'#000000'}).match(/--a:#[0-9a-f]+;--b:#[0-9a-f]+/)[0],'--a:#b44420;--b:#000000','page swaps never cascade either');
assert.equal(C.html(q,undefined,{}),undefined);
// ---- stable ids: a remembered choice survives the prompt being re-read ----
assert.deepEqual(C.analyse(QUOTED).controls.map(c=>c.id),ids);assert.equal(C.mount('x',''),null);
// ---- size and speed: a very large prompt stays quick, and the number of boxes stays bounded ----
const big=Array.from({length:300},(_,i)=>`Section ${i}: Colour #${(i*2654435).toString(16).padStart(6,'0').slice(-6)} for "Heading ${i} text" and button "Go ${i}" at https://cdn.example.com/a${i}.png with ${'word '.repeat(60)}`).join('\n\n');
const t0=performance.now(),bigAnalysis=C.analyse(big),bigOut=C.prompt(bigAnalysis,{'c:#000000':'#ffffff'}),ms=performance.now()-t0;
assert(big.length>60000&&ms<400,`analysing ${big.length} characters took ${Math.round(ms)}ms`);
assert(bigAnalysis.controls.filter(c=>c.type==='colour').length<=30&&bigAnalysis.controls.filter(c=>c.type==='text').length<=40&&bigAnalysis.controls.filter(c=>c.type==='url').length<=6,'boxes are capped');
assert.equal(bigOut.length<=big.length,true);
// text that merely looks risky never breaks the matching
for(const odd of ['"((((((((((((','#','Invented ','Invented a "','Typography: "','Rules:\n\nRules:','\n\n\n','"" "" ""','\u0000#abcdef\u0000'])assert.doesNotThrow(()=>C.prompt(C.analyse(odd+' x')||{controls:[],byId:new Map(),text:''},{}),JSON.stringify(odd));
console.log('PASS: prompt customiser finds brand, text, colours, fonts, links, sections, rules and output in library prompts, swaps each exactly once without cascades, keeps values safe, drops edits inside removed sections and applies the same swaps to the live page.');
