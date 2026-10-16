// Original scroll-driven and text-reveal components. Each demo is a scroll box that scrolls itself until you take over.
import {ART} from './art-boot.mjs';
import {SB} from './annn-boot.mjs';
const family='Scroll & text';
const BOX=(c,h=430)=>`.${c}{position:relative;height:${h}px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
.${c}-pin{position:sticky;top:0;height:${h}px;overflow:hidden}`;
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const annnScroll=[
{id:'s-project-wheel',title:'Project wheel',component:'Project wheel',key:'project-wheel',family,width:760,
 description:'Project titles sit on the rim of a big wheel that turns as you scroll; the one on the centre line lights up and swaps the photo.',
 prompt:'Build a scroll-driven project list on a wheel. A tall track inside a scroll container holds a sticky stage. In the stage, six titles are placed on a circle whose centre is off to the left of the stage (centre x = -300px, vertical centre, radius 370px): title i is transform: translate(cx, cy) rotate((i - f) * 17deg) translate(R, -50%), where f = scroll progress * 5. Titles fade with their angle (opacity 1 - |angle|/38 with a floor of 0.12); the one nearest the centre line gets an accent colour and a small nudge. A thin circle and tick marks are drawn behind the titles. On the right a 260x330px photo area crossfades between six generated landscapes (the photo of the nearest title), with a counter "02 / 06". Scroll progress comes from scrollTop / (scrollHeight - clientHeight). The container auto-scrolls up and down until the visitor scrolls, keyboard focusable with an aria-label; titles are real text and the current one is announced in an aria-live line. Reduced motion shows the wheel responding to manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('pw')}
.pw-track{height:1000px}
.pw-ring{position:absolute;left:-654px;top:calc(50% - 354px);width:708px;height:708px;border-radius:50%;border:1px solid var(--sc-line)}
.pw-t{position:absolute;left:0;top:0;white-space:nowrap;font:800 40px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;transition:color .25s;will-change:transform,opacity}
.pw-t.on{color:var(--sc-accent)}
.pw-ph{position:absolute;right:34px;top:50%;width:250px;height:330px;margin-top:-165px;border-radius:22px;overflow:hidden;box-shadow:0 26px 44px -20px rgba(0,0,0,.5)}
.pw-ph i{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity .45s}
.pw-ph i.on{opacity:1}
.pw-n{position:absolute;right:34px;bottom:26px;margin:0;font:700 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--sc-muted)}
.pw-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="pw" tabindex="0" role="region" aria-label="Project list, scroll to turn the wheel"><div class="pw-track"><div class="pw-pin"><div class="pw-ring"></div><div class="pw-ph"></div><p class="pw-n"></p><p class="pw-live" aria-live="polite"></p></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.pw'),pin=box.querySelector('.pw-pin'),ph=box.querySelector('.pw-ph'),cnt=box.querySelector('.pw-n'),live=box.querySelector('.pw-live');
${ART}
${SB}
var titles=['Northern Light','Quiet Harbour','Paper Cities','Slow Summer','Night Shift','Open Field'],ids=[3,1,7,2,5,4],T=[],P=[],N=6,cur=-1;
titles.forEach(function(t,i){var el=document.createElement('div');el.className='pw-t';el.textContent=t;pin.appendChild(el);T.push(el);var im=document.createElement('i');im.style.backgroundImage='url('+artURL(ids[i],250,330)+')';ph.appendChild(im);P.push(im)});
ScrollDemo(box,function(p){var f=p*(N-1),H=pin.clientHeight,near=Math.round(f);
 T.forEach(function(el,i){var a=(i-f)*17;el.style.transform='translate(-300px,'+(H/2)+'px) rotate('+a.toFixed(2)+'deg) translate('+(370+(i===near?14:0))+'px,-50%)';el.style.opacity=Math.max(.12,1-Math.abs(a)/38).toFixed(2);el.classList.toggle('on',i===near)});
 if(near!==cur){cur=near;P.forEach(function(im,i){im.classList.toggle('on',i===near)});cnt.textContent='0'+(near+1)+' / 0'+N;live.textContent=titles[near]}});})();`},

{id:'s-word-wheel',title:'Word wheel',component:'Word wheel',key:'word-wheel',family,width:760,
 description:'A list of words on a turning 3D wheel: the word on the centre line stands out while the rest fade away above and below.',
 prompt:'Create a vertical word wheel driven by scroll. A tall track holds a sticky stage with perspective 900px. Seven words (fast, alive, tactile, calm, bold, honest, playful) are placed on a cylinder: word i is transform: rotateX((f - i) * 26deg) translateZ(130px) where f = scroll progress * 6, set in a frame loop, so words enter from below, pass the centre line and leave above. Opacity falls with distance from the centre (1 - 0.45 * |i - f|, floored at 0), the centre word is scaled up, coloured with the accent colour and underlined by a thin line, and a label to its left reads "We make products that feel". The nearest word is announced through a visually hidden aria-live region. The scroll box auto-scrolls up and down until the visitor scrolls and has an aria-label; reduced motion only reacts to manual scrolling. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('ww')}
.ww-track{height:900px}
.ww-pin{perspective:900px}
.ww-row{position:absolute;left:0;right:0;top:50%;height:0;display:flex;align-items:center;justify-content:center;gap:26px}
.ww-lab{font:600 22px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--sc-muted);text-align:right;width:200px}
.ww-cyl{position:relative;width:260px;height:0;transform-style:preserve-3d}
.ww-w{position:absolute;left:0;top:0;transform:translateY(-50%);font:800 58px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;white-space:nowrap;will-change:transform,opacity}
.ww-w.on{color:var(--sc-accent)}
.ww-line{position:absolute;left:50%;top:50%;width:420px;height:1px;margin:44px 0 0 -210px;background:var(--sc-line)}
.ww-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="ww" tabindex="0" role="region" aria-label="Word wheel, scroll to turn it"><div class="ww-track"><div class="ww-pin"><div class="ww-row"><span class="ww-lab">We make products<br>that feel</span><div class="ww-cyl"></div></div><p class="ww-live" aria-live="polite"></p></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.ww'),cyl=box.querySelector('.ww-cyl'),live=box.querySelector('.ww-live');
${SB}
var words=['fast','alive','tactile','calm','bold','honest','playful'],W=[],cur=-1;
words.forEach(function(w){var e=document.createElement('div');e.className='ww-w';e.textContent=w;cyl.appendChild(e);W.push(e)});
ScrollDemo(box,function(p){var f=p*6,near=Math.round(f);W.forEach(function(e,i){var d=Math.abs(i-f);e.style.transform='translateY(-50%) rotateX('+((f-i)*26).toFixed(2)+'deg) translateZ(130px) scale('+(1+Math.max(0,1-d)*.12).toFixed(3)+')';e.style.opacity=Math.max(0,1-.45*d).toFixed(2);e.classList.toggle('on',i===near)});
 if(near!==cur){cur=near;live.textContent='We make products that feel '+words[near]}});})();`},

{id:'s-zoom-through',title:'Zoom through text',component:'Zoom through text',key:'zoom-through',family,width:760,
 description:'A big word grows as you scroll until you fly straight through the gap between two letters into the next section.',
 prompt:'Build a zoom-through transition. A tall track holds a sticky stage. The stage contains the "next section" (a generated landscape with a heading, "On the other side") behind a layer holding the word BEYOND set in a very heavy face with generous letter-spacing, each letter in its own span. After layout, compute the transform-origin of the word as the horizontal midpoint of the gap between the third and fourth letters (and the vertical centre of the letters). Scroll progress drives scale = exp(progress * ln(70)) applied to the word with that origin, so the camera dives into the gap: the letters sweep outwards past the edges and the gap opens onto the next section. In the last 25% of the progress the word fades out and the section content fades and rises in. A progress hint reads "Scroll to dive in" and disappears after a little scroll. The word has an aria-label of its real text, the letters are aria-hidden. The scroll container auto-scrolls until the visitor scrolls, and reduced motion shows only manual scrolling. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('zt')}
.zt-track{height:1100px}
.zt-next{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff;background-size:cover;background-position:center}
.zt-next h3{margin:0;font:800 46px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;text-shadow:0 3px 24px rgba(0,0,0,.4)}
.zt-next p{margin:10px 0 0;font-size:16px;opacity:.9}
.zt-word{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
.zt-text{display:flex;font:900 150px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.14em;color:var(--sc-fg);will-change:transform,opacity}
.zt-text i{font-style:normal}
.zt-hint{position:absolute;left:0;right:0;bottom:18px;margin:0;text-align:center;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--sc-muted)}`,
 html:`<div class="zt" tabindex="0" role="region" aria-label="Zoom through text, scroll to dive in"><div class="zt-track"><div class="zt-pin"><div class="zt-next"><div><h3>On the other side</h3><p>The next section was waiting all along.</p></div></div><div class="zt-word"><div class="zt-text" aria-label="BEYOND"></div></div><p class="zt-hint">Scroll to dive in</p></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.zt'),pin=box.querySelector('.zt-pin'),text=box.querySelector('.zt-text'),next=box.querySelector('.zt-next'),hint=box.querySelector('.zt-hint');
${ART}
${SB}
var L=[],ox=0,oy=0;next.style.backgroundImage='url('+artURL(1,760,430)+')';
'BEYOND'.split('').forEach(function(c){var s=document.createElement('i');s.setAttribute('aria-hidden','true');s.textContent=c;text.appendChild(s);L.push(s)});
function measure(){var t=text.getBoundingClientRect(),a=L[2].getBoundingClientRect(),b=L[3].getBoundingClientRect();ox=(a.right+b.left)/2-t.left;oy=t.height*.52;text.style.transformOrigin=ox+'px '+oy+'px'}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);measure();
ScrollDemo(box,function(p){var s=Math.exp(p*Math.log(70));text.style.transform='scale('+s.toFixed(3)+')';var f=Math.max(0,(p-.72)/.28);text.style.opacity=(1-Math.min(1,f*1.6)).toFixed(3);next.style.opacity=(.25+.75*Math.min(1,p*2.2)).toFixed(3);next.firstElementChild.style.transform='translateY('+((1-Math.min(1,Math.max(0,(p-.7)/.3)))*24)+'px)';next.firstElementChild.style.opacity=Math.min(1,Math.max(0,(p-.65)/.3)).toFixed(3);hint.style.opacity=p<.04?1:0});})();`},

{id:'s-crossover-text',title:'Crossover headline',component:'Crossover headline',key:'crossover-text',family,width:760,
 description:'A headline that turns light exactly where photos scroll beneath it, so their edges slice straight through the letters.',
 prompt:'Create a headline that changes colour only where photos pass under it. A tall track holds a sticky stage. The stage has a headline (two lines, "Colour crosses the line") fixed in the centre in the page text colour, and three photo rectangles (generated landscapes, different sizes and corner radii) that rise through the stage as the user scrolls, at different speeds so smaller photos sit further back and drift slower. Each photo element has overflow hidden and, inside it, a copy of the headline in white (aria-hidden) that is positioned at minus the photo\'s own offset so it sits exactly over the original headline; as the photo moves, the copy moves the other way, so only the part of the headline overlapping the photo is white. Photos sit above the dark headline. Compute positions from scroll progress each frame. The scroll container auto-scrolls up and down until the visitor scrolls and is focusable with an aria-label; reduced motion reacts to manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('xo')}
.xo-track{height:1000px}
.xo-h{position:absolute;left:0;right:0;top:50%;margin:0;transform:translateY(-50%);text-align:center;font:900 76px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.045em;color:var(--sc-fg)}
.xo-ph{position:absolute;overflow:hidden;background-size:cover;background-position:center;will-change:transform}
.xo-ph .xo-h{color:#fff;left:0;right:auto;top:0;margin:0;transform:none;text-align:center;text-shadow:0 2px 14px rgba(0,0,0,.25)}`,
 html:`<div class="xo" tabindex="0" role="region" aria-label="Crossover headline, scroll to move the photos"><div class="xo-track"><div class="xo-pin"><h2 class="xo-h">Colour<br>crosses<br>the line</h2></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.xo'),pin=box.querySelector('.xo-pin'),h=pin.querySelector('.xo-h');
${ART}
${SB}
var defs=[{x:.08,w:.26,h:.5,y0:1.15,y1:-.65,r:18,id:2},{x:.56,w:.32,h:.42,y0:1.3,y1:-.7,r:60,id:5},{x:.3,w:.22,h:.3,y0:1.5,y1:-.6,r:14,id:1}],P=[],W=0,H=0;
defs.forEach(function(d){var el=document.createElement('div');el.className='xo-ph';el.style.backgroundImage='url('+artURL(d.id,300,300)+')';el.style.borderRadius=d.r+'px';var c=h.cloneNode(true);c.setAttribute('aria-hidden','true');el.appendChild(c);pin.appendChild(el);P.push({el:el,c:c,d:d})});
var hl=0,ht=0,hw=0;
function measure(){W=pin.clientWidth;H=pin.clientHeight;var r=h.getBoundingClientRect(),pr=pin.getBoundingClientRect();hl=r.left-pr.left;ht=r.top-pr.top;hw=r.width;P.forEach(function(q){q.c.style.width=hw+'px'})}
measure();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);addEventListener('resize',measure);
ScrollDemo(box,function(p){P.forEach(function(q){var d=q.d,w=d.w*W,hh=d.h*H,x=d.x*W,y=(d.y0+(d.y1-d.y0)*p)*H;q.el.style.width=w+'px';q.el.style.height=hh+'px';q.el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';q.c.style.transform='translate('+(hl-x).toFixed(1)+'px,'+(ht-y).toFixed(1)+'px)'})});})();`},

{id:'s-slab-headline',title:'Slab headline',component:'Slab headline',key:'slab-headline',family,width:760,
 description:'A one-word headline that grows a 3D slab of its own copies as you scroll, fading with depth; tip and turn it with three angle sliders.',
 prompt:'Build a 3D slab headline. Inside a perspective(900px) stage the word DEPTH is rendered as 24 stacked copies (the first is the solid front copy, the rest aria-hidden outlines using -webkit-text-stroke with falling opacity and a hue that shifts from the accent colour to a second colour). Copy i is translateZ(-i * gap) where gap = scroll progress * 11px + 0.5px, so the slab grows as the user scrolls. The whole stack is rotated with rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)) set from three range inputs (X -60..60 default 18, Y -60..60 default -28, Z -30..30 default 0) with labels and output values. The scroll container (with a sticky stage) auto-scrolls until the visitor scrolls. The sliders are native inputs with aria-labels. Reduced motion keeps manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('sl')}
.sl-track{height:900px}
.sl-view{position:absolute;inset:0 0 56px;perspective:900px}
.sl-stack{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transform:rotateX(var(--rx,18deg)) rotateY(var(--ry,-28deg)) rotateZ(var(--rz,0deg))}
.sl-c{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;font:900 130px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.sl-c.f{color:var(--sc-fg)}
.sl-c.b{color:transparent;-webkit-text-stroke:1.6px hsl(calc(262 + var(--k)*3) 85% 62%)}
.sl-ctl{position:absolute;left:0;right:0;bottom:0;display:flex;gap:18px;justify-content:center;padding:10px 16px;background:linear-gradient(transparent,var(--sc-surface) 40%)}
.sl-ctl label{display:flex;align-items:center;gap:8px;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--sc-muted)}
.sl-ctl input{width:90px;accent-color:var(--sc-accent)}`,
 html:`<div class="sl" tabindex="0" role="region" aria-label="Slab headline, scroll to grow the slab"><div class="sl-track"><div class="sl-pin"><div class="sl-view"><div class="sl-stack"></div></div><div class="sl-ctl"><label>X <input type="range" min="-60" max="60" value="18" aria-label="Tilt X"></label><label>Y <input type="range" min="-60" max="60" value="-28" aria-label="Turn Y"></label><label>Z <input type="range" min="-30" max="30" value="0" aria-label="Roll Z"></label></div></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.sl'),stack=box.querySelector('.sl-stack'),ins=box.querySelectorAll('input');
${SB}
var N=24,C=[];
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='sl-c '+(i?'b':'f');c.textContent='DEPTH';c.style.setProperty('--k',i);if(i){c.setAttribute('aria-hidden','true');c.style.opacity=Math.max(.04,1-i/N*1.05).toFixed(2)}else c.setAttribute('aria-label','DEPTH');stack.appendChild(c);C.push(c)}
ins.forEach(function(r,i){var v=['--rx','--ry','--rz'][i];function up(){stack.style.setProperty(v,r.value+'deg')}r.addEventListener('input',up);up()});
ScrollDemo(box,function(p){var gap=p*11+.5;C.forEach(function(c,i){c.style.transform='translate(-50%,-50%) translateZ('+(-i*gap).toFixed(2)+'px)'})});})();`},

{id:'s-velocity-type',title:'Velocity type',component:'Velocity type',key:'velocity-type',family,width:760,
 description:'Text that reacts to how fast you scroll: it grows heavier, wider and more slanted with speed and settles back when you stop.',
 prompt:'Make headline text that responds to scroll velocity. A scroll container holds eight tall rows of words (a poem of short phrases set at 64px in a heavy face). A smoothed velocity v is computed each frame from the change in scrollTop (v = v * 0.85 + delta * 0.15) and mapped to: skewX = clamp(-v * 0.9, -18, 18) degrees (leaning into the scroll direction), scaleX = 1 + min(|v| * 0.012, 0.25), a text-stroke width in the text colour of min(|v| * 0.28, 5) px (heavier weight) and letter-spacing of min(|v| * 0.002, 0.04) em. All rows share the same values but each row has a small stagger by index so the motion ripples. The values ease back to rest when scrolling stops. The container auto-scrolls up and down (faster than the other demos) until the visitor scrolls themselves; the text remains real, selectable text. Reduced motion disables the effect on manual scrolling only by clamping the transforms to zero. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('vt')}
.vt-in{padding:40px 30px 120px}
.vt-row{margin:0 0 54px;font:900 64px/1.02 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;text-transform:uppercase;will-change:transform;transform-origin:0 50%}
.vt-row:nth-child(3n+2){color:var(--sc-accent)}`,
 html:`<div class="vt" tabindex="0" role="region" aria-label="Velocity type, scroll fast and slow"><div class="vt-in"></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.vt'),in_=box.querySelector('.vt-in');
${SB}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,lines=['Speed is','a kind of','weight','Slow it down','and it settles','Push harder','and it leans','Let go','and breathe'],R=[],v=0,last=0,hist=[];
lines.forEach(function(l){var p=document.createElement('p');p.className='vt-row';p.textContent=l;in_.appendChild(p);R.push(p)});
ScrollDemo(box,function(p,st){var d=st-last;last=st;v=v*.85+d*.15;hist.push(v);if(hist.length>12)hist.shift();
 R.forEach(function(r,i){var vv=hist[Math.max(0,hist.length-1-i*1)]||0;if(reduce)vv=0;var sk=Math.max(-18,Math.min(18,-vv*.9)),sx=1+Math.min(Math.abs(vv)*.012,.25),sw=Math.min(Math.abs(vv)*.28,5);r.style.transform='skewX('+sk.toFixed(2)+'deg) scaleX('+sx.toFixed(3)+')';r.style.webkitTextStroke=sw.toFixed(2)+'px currentColor';r.style.letterSpacing=Math.min(Math.abs(vv)*.002,.04).toFixed(4)+'em'})},{speed:.42});})();`},

{id:'s-text-on-path',title:'Text on a hidden path',component:'Text on a hidden path',key:'text-on-path',family,width:760,
 description:'Words appear one by one along an invisible curve as you scroll, until a sentence rides the hills and valleys of a line you never see.',
 prompt:'Create text that follows a hidden curve. An SVG (viewBox 760x430) contains an invisible path (stroke none) with several smooth waves. The sentence "Every line you never draw still decides where the words go" is split into words; each word is an SVG text element. Measure each word\'s width with getComputedTextLength() and place the words one after another along the path by arc length (the position of word k is the accumulated width plus a 14px space), using getPointAtLength and a small look-ahead point to get the tangent angle so each word is rotated to follow the curve (transform="translate rotate"). Scroll progress inside a sticky stage reveals the words one by one: word k has reveal = clamp(progress * (N + 1) - k, 0, 1) which drives its opacity and a 14px upward offset and a slight scale. The path itself is never drawn. The SVG has an aria-label with the whole sentence and the word elements are aria-hidden. The container auto-scrolls until the visitor scrolls; reduced motion reacts to manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('tp')}
.tp-track{height:900px}
.tp-svg{position:absolute;inset:0;width:100%;height:100%}
.tp-svg text{font:800 33px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em;fill:var(--sc-fg)}
.tp-svg text.hl{fill:var(--sc-accent)}`,
 html:`<div class="tp" tabindex="0" role="region" aria-label="Text on a hidden path, scroll to reveal the words"><div class="tp-track"><div class="tp-pin"><svg class="tp-svg" viewBox="0 0 760 430" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Every line you never draw still decides where the words go"><path class="tp-path" d="M 20 330 C 90 40 190 40 250 230 S 350 420 420 230 S 520 40 590 230 S 690 420 745 170" fill="none" stroke="none"/><g class="tp-words"></g></svg></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.tp'),svg=box.querySelector('.tp-svg'),path=box.querySelector('.tp-path'),g=box.querySelector('.tp-words'),NS='http://www.w3.org/2000/svg';
${SB}
var words='Every line you never draw still decides where the words go'.split(' '),W=[],hl={'never':1,'decides':1};
function build(){g.textContent='';W=[];var len=path.getTotalLength(),pos=14;words.forEach(function(w,k){var t=document.createElementNS(NS,'text');t.setAttribute('aria-hidden','true');t.textContent=w;if(hl[w])t.setAttribute('class','hl');g.appendChild(t);var wl=t.getComputedTextLength();var s=Math.min(len-wl-2,pos);var p0=path.getPointAtLength(s),p1=path.getPointAtLength(Math.min(len,s+wl)),ang=Math.atan2(p1.y-p0.y,p1.x-p0.x)*180/Math.PI;W.push({el:t,x:p0.x,y:p0.y,a:ang});pos+=wl+14})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(build);build();
ScrollDemo(box,function(p){var N=W.length;W.forEach(function(w,k){var r=Math.max(0,Math.min(1,p*(N+1)-k));w.el.setAttribute('transform','translate('+w.x.toFixed(1)+' '+(w.y-(1-r)*14).toFixed(1)+') rotate('+w.a.toFixed(2)+') scale('+(.92+.08*r).toFixed(3)+')');w.el.style.opacity=r.toFixed(3)})});})();`},

{id:'s-scribble-highlight',title:'Scribble highlighter',component:'Scribble highlighter',key:'scribble-highlight',family,width:760,
 description:'A hand-drawn circle or underline that draws itself around the key word of a headline as it scrolls into view.',
 prompt:'Build a headline with hand-drawn emphasis. The headline "Make it feel alive, not just animated" has two emphasised words ("alive" and "animated"). For each, after layout, measure its bounding box and add an absolutely positioned SVG overlay with a rough hand-drawn path: a circle for the first (an ellipse of 64 points slightly larger than the word, with random radius wobble of +-3px, starting at the upper left and overshooting by about 15% so the ends cross) and a double underline for the second (two wavy strokes with a small random vertical drift). Paths use stroke-linecap round, a theme accent colour, pathLength="1", stroke-dasharray 1 and an animated stroke-dashoffset from 1 to 0 (circle 0.9s, underline strokes 0.5s each with a 0.4s delay) triggered with IntersectionObserver when the headline is 60% visible and replayable with a Replay button. A control with three radio-style buttons (Circle, Underline, Both) chooses which emphasis shows. The overlays are aria-hidden and sized with the word, rebuilt on resize. Reduced motion shows the finished strokes. Vanilla HTML, CSS and JavaScript.',
 css:`.sc2{display:grid;gap:22px;justify-items:center;padding:50px 28px 30px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.sc2-h{position:relative;margin:0;max-width:14em;text-align:center;font:800 clamp(34px,6.5vw,58px)/1.28 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.sc2-w{position:relative;display:inline-block}
.sc2-ov{position:absolute;pointer-events:none;overflow:visible}
.sc2-ov path{fill:none;stroke:var(--sc-accent);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}
.sc2-ov.draw path{animation:sc2-d .9s cubic-bezier(.5,0,.3,1) forwards}
.sc2-ov.ul path:nth-child(2){animation-delay:.4s}
.sc2-ov.ul.draw path{animation-duration:.5s}
.sc2-bar{display:flex;gap:8px;align-items:center}
.sc2-b{padding:7px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.sc2-b[aria-pressed=true]{border-color:var(--sc-accent);background:var(--sc-ring)}
@keyframes sc2-d{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.sc2-ov path{stroke-dashoffset:0!important;animation:none!important}}`,
 html:`<div class="sc2"><h2 class="sc2-h" aria-label="Make it feel alive, not just animated">Make it feel <span class="sc2-w" data-k="c">alive</span>, not just <span class="sc2-w" data-k="u">animated</span></h2><div class="sc2-bar"><button class="sc2-b" type="button" data-m="circle" aria-pressed="false">Circle</button><button class="sc2-b" type="button" data-m="underline" aria-pressed="false">Underline</button><button class="sc2-b" type="button" data-m="both" aria-pressed="true">Both</button><button class="sc2-b" type="button" data-m="replay">Replay</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sc2'),words=root.querySelectorAll('.sc2-w'),btns=root.querySelectorAll('.sc2-b'),NS='http://www.w3.org/2000/svg';
var mode='both',seen=false,timer=0,ovs=[];
function rnd(a,b){return a+Math.random()*(b-a)}
function svgEl(w,h){var s=document.createElementNS(NS,'svg');s.setAttribute('class','sc2-ov');s.setAttribute('aria-hidden','true');s.setAttribute('width',w);s.setAttribute('height',h);return s}
function mk(){ovs.forEach(function(o){o.remove()});ovs=[];words.forEach(function(w){var W=w.offsetWidth,H=w.offsetHeight,k=w.getAttribute('data-k');
 if(k==='c'){var padx=22,pady=8,s=svgEl(W+padx*2,H+pady*2);s.style.left=-padx+'px';s.style.top=-pady+'px';var cx=(W+padx*2)/2,cy=(H+pady*2)/2,rx=(W+padx*2)/2-4,ry=(H+pady*2)/2-3,d='',n=64,start=-2.5;for(var i=0;i<=n*1.15;i++){var a=start+i/n*6.283,jx=rnd(-3,3),jy=rnd(-2.5,2.5),taper=1+i/n*.06;d+=(i?'L':'M')+(cx+Math.cos(a)*(rx*taper)+jx).toFixed(1)+' '+(cy+Math.sin(a)*(ry*taper)+jy).toFixed(1)+' '}
  var p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('pathLength',1);s.appendChild(p);s.setAttribute('data-k','c');w.appendChild(s);ovs.push(s)}
 else{var s2=svgEl(W+16,24);s2.style.left='-8px';s2.style.top=(H-6)+'px';s2.classList.add('ul');s2.setAttribute('data-k','u');for(var j=0;j<2;j++){var y=6+j*9,dd='M2 '+(y+rnd(-1,1)).toFixed(1),x=2;while(x<W+12){x+=rnd(14,24);dd+=' Q'+(x-8).toFixed(1)+' '+(y+rnd(-4,4)).toFixed(1)+' '+Math.min(x,W+12).toFixed(1)+' '+(y+rnd(-2,2)).toFixed(1)}var pp=document.createElementNS(NS,'path');pp.setAttribute('d',dd);pp.setAttribute('pathLength',1);s2.appendChild(pp)}w.appendChild(s2);ovs.push(s2)}});show()}
function show(){ovs.forEach(function(o){var k=o.getAttribute('data-k'),on=mode==='both'||(mode==='circle'&&k==='c')||(mode==='underline'&&k==='u');o.style.display=on?'':'none'})}
function play(){clearTimeout(timer);ovs.forEach(function(o){o.classList.remove('draw')});void root.offsetWidth;ovs.forEach(function(o){o.classList.add('draw')});timer=setTimeout(play,6500)}
btns.forEach(function(b){b.addEventListener('click',function(){var m=b.getAttribute('data-m');if(m!=='replay'){mode=m;btns.forEach(function(q){if(q.getAttribute('data-m')!=='replay')q.setAttribute('aria-pressed',String(q===b))});show()}play()})});
mk();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){mk();if(seen)play()});addEventListener('resize',function(){mk();if(seen)play()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting&&!seen){seen=true;play()}},{threshold:.6}).observe(root);else{seen=true;play()}})();`},

{id:'s-process-rail',title:'Process rail',component:'Process rail',key:'process-rail',family,width:780,
 description:'A row of steps along a line: a bead draws the line as you scroll and each step lights up when it arrives, rolling in its number and image.',
 prompt:'Build a horizontal process rail driven by scroll. A tall track holds a sticky stage. In the stage a horizontal line runs across five equally spaced steps (Brief, Sketch, Build, Test, Launch). Scroll progress moves a glowing bead along the line and an accent-coloured line is drawn behind it (a second line whose width is the bead position). A step becomes active when the bead reaches it: its number rolls in (the old 0 slides up and out, the new digit rises from below, in an overflow-hidden slot), the title darkens from muted to the text colour and a small generated image fades in under it and stays. Steps are real text (an ordered list) and the active step has aria-current="step". The scroll container auto-scrolls and is focusable with an aria-label; reduced motion shows manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('pr')}
.pr-track{height:900px}
.pr-line,.pr-fill{position:absolute;left:60px;top:150px;height:3px;border-radius:3px}
.pr-line{right:60px;background:var(--sc-line)}
.pr-fill{width:0;background:var(--sc-accent);box-shadow:0 0 14px var(--sc-accent)}
.pr-bead{position:absolute;left:60px;top:150px;width:18px;height:18px;margin:-7.5px 0 0 -9px;border-radius:50%;background:#fff;border:3px solid var(--sc-accent);box-shadow:0 0 18px var(--sc-accent)}
.pr-list{position:absolute;left:60px;right:60px;top:110px;margin:0;padding:0;list-style:none}
.pr-step{position:absolute;top:0;width:130px;margin-left:-65px;text-align:center}
.pr-dot{display:block;width:12px;height:12px;margin:34px auto 0;border-radius:50%;background:var(--sc-bg);border:2px solid var(--sc-line);transition:border-color .3s,background .3s}
.pr-step.on .pr-dot{border-color:var(--sc-accent);background:var(--sc-accent)}
.pr-num{position:relative;display:block;height:30px;margin:-62px auto 0;width:2ch;overflow:hidden;font:800 24px/30px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--sc-accent)}
.pr-num span{position:absolute;left:0;right:0;top:0;transition:transform .45s cubic-bezier(.3,.9,.3,1),opacity .45s}
.pr-name{display:block;margin-top:44px;font:700 18px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--sc-muted);transition:color .3s}
.pr-step.on .pr-name{color:var(--sc-fg)}
.pr-img{display:block;width:96px;height:120px;margin:16px auto 0;border-radius:14px;background-size:cover;background-position:center;opacity:0;transform:translateY(12px) scale(.94);transition:opacity .5s,transform .5s cubic-bezier(.3,.9,.3,1)}
.pr-step.on .pr-img{opacity:1;transform:none}`,
 html:`<div class="pr" tabindex="0" role="region" aria-label="Process, scroll to move along the rail"><div class="pr-track"><div class="pr-pin"><div class="pr-line"></div><div class="pr-fill"></div><div class="pr-bead"></div><ol class="pr-list"></ol></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.pr'),pin=box.querySelector('.pr-pin'),list=box.querySelector('.pr-list'),fill=box.querySelector('.pr-fill'),bead=box.querySelector('.pr-bead');
${ART}
${SB}
var names=['Brief','Sketch','Build','Test','Launch'],ids=[4,2,6,1,5],S=[],W=0,N=5;
names.forEach(function(n,i){var li=document.createElement('li');li.className='pr-step';var d=document.createElement('i');d.className='pr-dot';var num=document.createElement('span');num.className='pr-num';num.setAttribute('aria-hidden','true');var z=document.createElement('span');z.textContent='0';num.appendChild(z);var nm=document.createElement('span');nm.className='pr-name';nm.textContent=n;var im=document.createElement('i');im.className='pr-img';im.setAttribute('aria-hidden','true');im.style.backgroundImage='url('+artURL(ids[i],96,120)+')';li.appendChild(num);li.appendChild(d);li.appendChild(nm);li.appendChild(im);list.appendChild(li);S.push({el:li,num:num,on:false})});
function place(){W=pin.clientWidth-120;S.forEach(function(s,i){s.el.style.left=(W*i/(N-1))+'px'})}place();addEventListener('resize',place);
function set(s,i,on){if(on===s.on)return;s.on=on;s.el.classList.toggle('on',on);if(on)s.el.setAttribute('aria-current','step');else s.el.removeAttribute('aria-current');var old=s.num.lastElementChild,nw=document.createElement('span');nw.textContent=on?String(i+1):'0';nw.style.transform='translateY('+(on?'100%':'-100%')+')';nw.style.opacity=0;s.num.appendChild(nw);void nw.offsetWidth;old.style.transform='translateY('+(on?'-100%':'100%')+')';old.style.opacity=0;setTimeout(function(){old.remove()},480);nw.style.transform='none';nw.style.opacity=1}
ScrollDemo(box,function(p){var x=W*Math.min(1,p*1.0);bead.style.transform='translateX('+x.toFixed(1)+'px)';fill.style.width=x.toFixed(1)+'px';S.forEach(function(s,i){set(s,i,x>=W*i/(N-1)-1&&p>.002)})});})();`},

{id:'s-scatter-cluster',title:'Scatter cluster',component:'Scatter cluster',key:'scatter-cluster',family,width:760,
 description:'A pile of photo and stat cards in the centre scatters out to its resting places as you scroll, uncovering the headline beneath.',
 prompt:'Make a scroll-driven scatter. A tall track holds a sticky stage. Under the cards sits a centred headline ("Everything in its place"). Eight cards (six generated photos at 120x150 and two stat cards, "98%" and "4.9★") start piled in the centre, each with its own random rotation (-14 to 14 degrees) and a small offset. As the scroll progress goes from 0 to 1 each card moves to its resting position around the edges of the stage (a ring of positions left, right, top and bottom that leaves the headline clear) with an eased interpolation and a per-card stagger (card i starts at i*0.05 of the progress), and its rotation eases to a smaller resting angle; scrolling back pulls the pile together again. Cards have a soft shadow and the pile z-order is stable. The headline fades from 0.15 to 1 opacity as the cluster opens. The container auto-scrolls up and down until the visitor scrolls; reduced motion reacts to manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`${BOX('sg')}
.sg-track{height:900px}
.sg-h{position:absolute;left:0;right:0;top:50%;margin:0;transform:translateY(-50%);text-align:center;font:900 52px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.sg-c{position:absolute;left:50%;top:50%;width:120px;height:150px;margin:-75px 0 0 -60px;border-radius:14px;background-size:cover;background-position:center;box-shadow:0 14px 26px -12px rgba(0,0,0,.5);will-change:transform;display:grid;place-items:center;color:#fff;font:900 30px/1 system-ui}
.sg-c.stat{background:linear-gradient(135deg,#6d5ef5,#d64bff)}
.sg-c.stat small{display:block;margin-top:6px;font:600 10px/1 ui-monospace,monospace;letter-spacing:.14em;opacity:.85}`,
 html:`<div class="sg" tabindex="0" role="region" aria-label="Scatter cluster, scroll to open the pile"><div class="sg-track"><div class="sg-pin"><h2 class="sg-h">Everything<br>in its place</h2></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.sg'),pin=box.querySelector('.sg-pin'),h=box.querySelector('.sg-h');
${ART}
${SB}
var C=[],defs=[{p:[-.36,-.28],id:3},{p:[.36,-.3],id:5},{p:[-.4,.12],stat:['98%','HAPPY']},{p:[.4,.14],id:2},{p:[-.2,.34],id:7},{p:[.2,.34],stat:['4.9\\u2605','RATING']},{p:[0,-.38],id:1},{p:[.02,.38],id:4}],seed=7;
function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
defs.forEach(function(d,i){var c=document.createElement('div');c.className='sg-c'+(d.stat?' stat':'');c.setAttribute('aria-hidden','true');if(d.stat){var b=document.createElement('span');b.textContent=d.stat[0];var sm=document.createElement('small');sm.textContent=d.stat[1];b.appendChild(sm);c.appendChild(b)}else c.style.backgroundImage='url('+artURL(d.id,120,150)+')';pin.appendChild(c);C.push({el:c,d:d,r0:(rnd()-.5)*28,r1:(rnd()-.5)*10,ox:(rnd()-.5)*16,oy:(rnd()-.5)*16})});
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
ScrollDemo(box,function(p){var W=pin.clientWidth,H=pin.clientHeight;C.forEach(function(c,i){var t=ease(Math.max(0,Math.min(1,(p-i*.045)/.6))),x=c.ox*(1-t)+c.d.p[0]*W*t,y=c.oy*(1-t)+c.d.p[1]*H*t,r=c.r0*(1-t)+c.r1*t;c.el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+r.toFixed(2)+'deg)';c.el.style.zIndex=10+i});h.style.opacity=(.12+.88*Math.min(1,p*1.6)).toFixed(2)});})();`}
];
