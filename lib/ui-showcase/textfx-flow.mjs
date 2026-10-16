// Original text effects that reveal, scroll or dissolve: vapour, flashlight, type wall, velocity marquee, ink outline, rising lines.
const family='Text effects';
export const textfxFlow=[
{id:'s-vapour-type',title:'Vapour type',component:'Vapour type',key:'vapour-type',family,width:780,
 description:'A word evaporates into smoke letter by letter on hover, then condenses back again.',
 prompt:'Make a word that evaporates. Define an inline SVG filter (feTurbulence with a tall baseFrequency such as 0.012 0.05, feDisplacementMap) and apply it to the word container; each frame set the displacement scale from a progress value P (0 to 150). P eases towards a target: hovering the word (or pressing a toggle button, aria-pressed) sets the target to 1, leaving sets it to 0, and with no interaction it alternates every 3.2s. Each letter has its own progress q = clamp(P*1.5 - index/count*0.5) so they dissolve left to right: opacity = 1 - q^1.4, translate up to 70px with a random sideways drift, scale up to 1.4 and a CSS blur up to 10px. The word is in a dark panel with a soft radial glow. Provide an aria-label, hide letters from assistive tech, honour reduced motion by simply fading the word. Vanilla HTML, CSS and JavaScript.',
 css:`.vp{position:relative;display:grid;gap:26px;justify-items:center;place-content:center;min-height:340px;padding:44px 24px 30px;border:1px solid #232733;border-radius:28px;background:radial-gradient(ellipse at 50% 70%,#20263a,#0b0d14 72%);color:#e9ecff;overflow:hidden;cursor:pointer}
.vp-word{margin:0;white-space:nowrap;font:900 clamp(48px,14vw,128px)/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em;filter:url(#vp-f)}
.vp-l{display:inline-block;will-change:transform,opacity,filter}
.vp-svg{position:absolute;width:0;height:0}
.vp-btn{padding:9px 18px;border:1px solid #343a52;border-radius:999px;background:#12151f;color:#e9ecff;cursor:pointer;font-size:14px;font-weight:600}
.vp-btn:hover,.vp-btn[aria-pressed=true]{border-color:#9aa6ff}`,
 html:`<div class="vp"><svg class="vp-svg" aria-hidden="true" focusable="false"><filter id="vp-f" x="-20%" y="-80%" width="140%" height="260%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="n"/><feDisplacementMap id="vp-d" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg><h2 class="vp-word"></h2><button class="vp-btn" type="button" aria-pressed="false">Evaporate</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.vp'),word=root.querySelector('.vp-word'),btn=root.querySelector('.vp-btn'),disp=root.querySelector('#vp-d'),text='Evaporate';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],P=0,target=0,raf=0,visible=true,lastUser=-1e9,auto=0;
word.setAttribute('aria-label',text);
for(var i=0;i<text.length;i++){var s=document.createElement('span');s.className='vp-l';s.setAttribute('aria-hidden','true');s.textContent=text.charAt(i);s.dx=-12+Math.random()*44;word.appendChild(s);L.push(s)}
function paint(){disp.setAttribute('scale',reduce?'0':(P*150).toFixed(1));L.forEach(function(l,i){var q=Math.max(0,Math.min(1,P*1.5-i/L.length*.5));
  if(reduce){l.style.opacity=(1-P).toFixed(3);return}
  l.style.opacity=(1-Math.pow(q,1.4)).toFixed(3);l.style.transform='translate('+(l.dx*q).toFixed(1)+'px,'+(-70*q).toFixed(1)+'px) scale('+(1+q*.4).toFixed(3)+')';l.style.filter='blur('+(q*10).toFixed(1)+'px)'})}
function frame(now){raf=0;P+=(target-P)*.03;if(Math.abs(target-P)<.002)P=target;paint();
 if(now-lastUser>6000&&now-auto>3200){auto=now;target=target?0:1;btn.setAttribute('aria-pressed',String(!!target))}
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function set(v){target=v;lastUser=performance.now();btn.setAttribute('aria-pressed',String(!!v));if(reduce){P=v;paint()}go()}
word.addEventListener('pointerenter',function(){set(1)});root.addEventListener('pointerleave',function(){set(0)});
btn.addEventListener('click',function(){set(target?0:1)});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);paint();go();})();`},

{id:'s-flashlight-text',title:'Flashlight text',component:'Flashlight text',key:'flashlight-text',family,width:780,
 description:'A hidden message that glows into view wherever the pointer shines a soft beam.',
 prompt:'Build a dark panel with a statement of large bold text on it twice: a base layer in a barely visible dark grey with a thin outline, and an identical lit layer positioned on top (same font, padding and wrapping, aria-hidden) filled with a warm amber-to-pink gradient using background-clip:text. The lit layer is revealed with a CSS mask: radial-gradient(circle var(--r) at var(--x) var(--y), black 0, rgba(0,0,0,.7) 45%, transparent 100%). Add a faint warm glow circle in a pseudo element using the same variables. JavaScript eases --x and --y towards the pointer each frame, grows the radius while the pointer is pressed, and when no pointer is present moves the beam along a slow Lissajous path across the text. Pause off-screen, reduced motion shows a fixed wide beam. Vanilla HTML, CSS and JavaScript.',
 css:`.fl{--x:50%;--y:50%;--r:170px;position:relative;border:1px solid #1c1c24;border-radius:28px;background:#060608;overflow:hidden;cursor:none}
.fl::after{content:"";position:absolute;inset:0;background:radial-gradient(circle calc(var(--r)*1.5) at var(--x) var(--y),rgba(255,160,90,.14),transparent 70%);pointer-events:none}
.fl-base,.fl-lit{margin:0;padding:52px 44px;font:800 clamp(28px,5.8vw,52px)/1.14 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.fl-base{color:transparent;-webkit-text-stroke:1px #2c2c36}
.fl-lit{position:absolute;inset:0;color:transparent;background:linear-gradient(100deg,#ffd166 0%,#ff7a59 45%,#ff4fa0 100%);-webkit-background-clip:text;background-clip:text;-webkit-mask-image:radial-gradient(circle var(--r) at var(--x) var(--y),#000 0,rgba(0,0,0,.72) 45%,transparent 100%);mask-image:radial-gradient(circle var(--r) at var(--x) var(--y),#000 0,rgba(0,0,0,.72) 45%,transparent 100%)}`,
 html:`<div class="fl"><p class="fl-base">Some things only show themselves when you hold the light just right.</p><p class="fl-lit" aria-hidden="true">Some things only show themselves when you hold the light just right.</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.fl');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,x=0,y=0,tx=0,ty=0,r=170,tr=170,ptr=false,raf=0,visible=true;
function frame(now){raf=0;var w=root.offsetWidth,h=root.offsetHeight,t=now/1000;if(!ptr){tx=w*(.5+.4*Math.sin(t*.55));ty=h*(.5+.32*Math.sin(t*.83+1))}
 x+=(tx-x)*.12;y+=(ty-y)*.12;r+=(tr-r)*.14;root.style.setProperty('--x',x.toFixed(1)+'px');root.style.setProperty('--y',y.toFixed(1)+'px');root.style.setProperty('--r',r.toFixed(1)+'px');if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var b=root.getBoundingClientRect();ptr=true;tx=e.clientX-b.left;ty=e.clientY-b.top});
root.addEventListener('pointerleave',function(){ptr=false;tr=170});root.addEventListener('pointerdown',function(){tr=300});root.addEventListener('pointerup',function(){tr=170});
if(reduce){root.style.setProperty('--r','900px');root.style.cursor='default'}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-type-wall',title:'Type wall',component:'Type wall',key:'type-wall',family,width:780,
 description:'A wall of sliding word rows that bulges like a lens around the pointer.',
 prompt:'Create a wall of nine rows, each a marquee of one repeated word (TYPE, FORM, SHAPE, SCALE, RHYTHM, WEIGHT, CONTRAST, SPACE, VOICE) sliding in alternating directions at different speeds with a CSS animation over a duplicated track (translateX 0 to -50%). Rows are outlined by default (transparent fill, thin stroke) and fill with the accent colour when they are the active row. JavaScript works out a fractional pointer row position and gives each row a height weight g = 1 + 2.4 * smoothstep(1 - |row - pos| / 2.4); row heights are the container height times g divided by the sum, font-size is 0.86 of the row height, and everything eases each frame so the wall bulges like a fisheye lens. With no pointer the lens position travels up and down on its own. Pause off-screen; reduced motion stops the sliding and the lens. Vanilla HTML, CSS and JavaScript.',
 css:`.tw{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;padding:10px 0}
.tw-row{display:block;overflow:hidden;line-height:1;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:900;letter-spacing:-.04em;text-transform:uppercase;white-space:nowrap}
.tw-track{display:inline-flex;animation:tw-slide var(--d,30s) linear infinite;animation-direction:var(--dir,normal);will-change:transform}
.tw-track span{padding-right:.45em;color:transparent;-webkit-text-stroke:1.2px var(--sc-muted);transition:color .25s,-webkit-text-stroke-color .25s}
.tw-row.on .tw-track span{color:var(--sc-accent);-webkit-text-stroke-color:transparent}
@keyframes tw-slide{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.tw-track{animation:none}}`,
 html:`<div class="tw" role="img" aria-label="A wall of sliding words: type, form, shape, scale, rhythm, weight, contrast, space, voice"></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tw'),words=['TYPE','FORM','SHAPE','SCALE','RHYTHM','WEIGHT','CONTRAST','SPACE','VOICE'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,rows=[],pos=4,tpos=4,ptr=false,raf=0,visible=true,g=[],cur=[];
words.forEach(function(w,i){var row=document.createElement('div');row.className='tw-row';row.setAttribute('aria-hidden','true');var track=document.createElement('div');track.className='tw-track';track.style.setProperty('--d',(24+i*5)+'s');track.style.setProperty('--dir',i%2?'reverse':'normal');
 for(var k=0;k<2;k++)for(var j=0;j<10;j++){var s=document.createElement('span');s.textContent=w;track.appendChild(s)}row.appendChild(track);root.appendChild(row);rows.push(row);g.push(1);cur.push(1)});
function sm(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
function frame(now){raf=0;if(!ptr)tpos=4+3.6*Math.sin(now/2300);pos+=(tpos-pos)*.1;var H=root.clientHeight-20,sum=0,t=[];
 for(var i=0;i<rows.length;i++){t[i]=1+2.4*sm(1-Math.abs(i-pos)/2.4);cur[i]+=(t[i]-cur[i])*.15;sum+=cur[i]}
 for(i=0;i<rows.length;i++){var h=H*cur[i]/sum;rows[i].style.height=h.toFixed(1)+'px';rows[i].style.fontSize=(h*.86).toFixed(1)+'px';var on=Math.abs(i-pos)<.5;if(on!==rows[i].classList.contains('on'))rows[i].classList.toggle('on',on)}
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var b=root.getBoundingClientRect();ptr=true;tpos=Math.max(0,Math.min(rows.length-1,(e.clientY-b.top-10)/(b.height-20)*rows.length-.5))});
root.addEventListener('pointerleave',function(){ptr=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(reduce){var hh=(root.clientHeight-20)/rows.length;rows.forEach(function(r,i){r.style.height=hh+'px';r.style.fontSize=hh*.86+'px';r.classList.toggle('on',i===4)})}go();})();`},

{id:'s-velocity-marquee',title:'Velocity marquee',component:'Velocity marquee',key:'velocity-marquee',family,width:780,
 description:'Two opposing marquees that skew, surge and reverse as you drag, scroll or fling them.',
 prompt:'Create two stacked marquees of large text moving in opposite directions: the first solid, the second outlined. Each row is a track of repeated words measured once so the offset can wrap seamlessly. A shared velocity eases back to a base speed of 1.2px per frame. Dragging with the pointer moves the rows directly (and sets the velocity from the drag speed so releasing flings them), the mouse wheel adds a push and the direction reverses when you drag the other way. The rows skew horizontally in proportion to velocity (skewX = clamp(-velocity * 0.9, -22, 22) degrees) and the outlined row stays a bit behind. Use pointer events with setPointerCapture, touch-action: pan-y, keep the text content aria-hidden with a single aria-label on the group, pause when off-screen and stop moving for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.vm{display:grid;gap:6px;padding:34px 0;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.vm.drag{cursor:grabbing}
.vm-row{overflow:hidden;white-space:nowrap}
.vm-track{display:inline-flex;will-change:transform}
.vm-track span{padding-right:.5em;font:900 clamp(52px,13vw,110px)/1.02 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.045em;text-transform:uppercase}
.vm-row:nth-child(2) .vm-track span{color:transparent;-webkit-text-stroke:2px var(--sc-fg)}
.vm-row:nth-child(1) .vm-track span:nth-child(3n+2){color:var(--sc-accent)}
.vm-hint{margin:10px 0 0;text-align:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--sc-muted)}`,
 html:`<div class="vm" role="img" aria-label="Marquee reading: keep moving, never stop"><div class="vm-row" aria-hidden="true"><div class="vm-track"></div></div><div class="vm-row" aria-hidden="true"><div class="vm-track"></div></div><p class="vm-hint">Drag, fling or scroll</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.vm'),tracks=[].slice.call(root.querySelectorAll('.vm-track')),words=['Keep moving','Never stop','Full speed'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,BASE=1.2,vel=BASE,x=[0,0],period=[800,800],dragging=false,lastX=0,raf=0,visible=true;
tracks.forEach(function(tr,ti){for(var k=0;k<4;k++)words.forEach(function(w){var s=document.createElement('span');s.textContent=w+' \\u2726';tr.appendChild(s)})});
function measure(){tracks.forEach(function(tr,i){var n=tr.children.length/4,w=0;for(var k=0;k<n;k++)w+=tr.children[k].getBoundingClientRect().width;period[i]=w||800})}
function frame(){raf=0;if(!dragging)vel+=(BASE-vel)*.04;
 tracks.forEach(function(tr,i){var dir=i?1:-1,v=dir===-1?vel:-vel*.88;x[i]+=(dragging?0:v);while(x[i]<-period[i])x[i]+=period[i];while(x[i]>0)x[i]-=period[i];var sk=Math.max(-22,Math.min(22,-vel*.9*(i?-1:1)));tr.style.transform='translateX('+x[i].toFixed(1)+'px) skewX('+sk.toFixed(1)+'deg)'});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(e){dragging=true;lastX=e.clientX;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!dragging)return;var dx=e.clientX-lastX;lastX=e.clientX;x[0]+=dx;x[1]-=dx*.88;vel=vel*.6+(-dx)*.4;if(Math.abs(vel)<BASE&&dx)vel=dx<0?BASE:-BASE});
function up(){if(!dragging)return;dragging=false;root.classList.remove('drag')}
root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('wheel',function(e){vel+=Math.max(-16,Math.min(16,e.deltaY*.05))},{passive:true});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);addEventListener('resize',measure);measure();if(reduce){tracks.forEach(function(tr){tr.style.transform='none'})}go();})();`},

{id:'s-ink-outline',title:'Ink outline',component:'Ink outline',key:'ink-outline',family,width:780,
 description:'Letters draw themselves in a gradient line, one after another, and then fill with colour.',
 prompt:'Make an SVG headline that draws itself. Put one <text> element in a 800x260 viewBox, split into one <tspan> per letter, each with a --n index. Each tspan starts with fill: url(#gradient) at fill-opacity 0, a stroke of the same gradient, stroke-dasharray 1400 and stroke-dashoffset 1400 so nothing shows. Adding a "run" class to the wrapper animates stroke-dashoffset to 0 over 1.5s (cubic-bezier(.6,0,.3,1)) with a 120ms delay per letter, then fill-opacity to 1 over 0.8s once the line is done. A Replay button (and a timer every 8s) removes the class, forces a reflow and adds it again. The SVG has a <title> and role="img"; with reduced motion the letters are shown filled immediately. Vanilla HTML, CSS and JavaScript.',
 css:`.ink{display:grid;gap:12px;justify-items:center;padding:36px 20px 28px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ink-svg{width:100%;height:auto;max-width:700px}
.ink-text{font:900 170px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.ink-l{fill:url(#ink-g);fill-opacity:0;stroke:url(#ink-g);stroke-width:2.4;stroke-linejoin:round;stroke-dasharray:1400;stroke-dashoffset:1400}
.ink.run .ink-l{animation:ink-draw 1.5s cubic-bezier(.6,0,.3,1) forwards calc(var(--n)*.12s),ink-fill .8s ease forwards calc(var(--n)*.12s + 1.25s)}
.ink-btn{padding:9px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600}
.ink-btn:hover{border-color:var(--sc-accent)}
@keyframes ink-draw{to{stroke-dashoffset:0}}
@keyframes ink-fill{to{fill-opacity:1}}
@media (prefers-reduced-motion:reduce){.ink-l{stroke-dashoffset:0;fill-opacity:1;animation:none!important}}`,
 html:`<div class="ink run"><svg class="ink-svg" viewBox="0 0 800 260" role="img"><title>Sketch it</title><defs><linearGradient id="ink-g" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="740" y2="0"><stop offset="0" stop-color="#7c5cff"/><stop offset=".55" stop-color="#d64bff"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs><text class="ink-text" x="400" y="190" text-anchor="middle"><tspan class="ink-l" style="--n:0">S</tspan><tspan class="ink-l" style="--n:1">k</tspan><tspan class="ink-l" style="--n:2">e</tspan><tspan class="ink-l" style="--n:3">t</tspan><tspan class="ink-l" style="--n:4">c</tspan><tspan class="ink-l" style="--n:5">h</tspan></text></svg><button class="ink-btn" type="button">Replay</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ink'),btn=root.querySelector('.ink-btn'),timer=0;
function play(){clearTimeout(timer);root.classList.remove('run');void root.getBoundingClientRect();root.classList.add('run');timer=setTimeout(play,8000)}
btn.addEventListener('click',play);if(matchMedia('(prefers-reduced-motion:reduce)').matches){clearTimeout(timer)}else{play()}})();`},

{id:'s-rising-lines',title:'Rising lines',component:'Rising lines',key:'rising-lines',family,width:780,
 description:'A paragraph that is measured into lines, then lifts into view line by line from behind a mask.',
 prompt:'Build a reveal for a paragraph. Split the text into word spans, wait for fonts and layout, group the words by offsetTop into visual lines and wrap each line in a clipping container (overflow hidden with a little vertical padding) around an inner span. Hidden state: translateY(115%) rotate(3deg) with blur(6px). When the block scrolls into view (IntersectionObserver, threshold 0.35) add an "in" class so each line transitions to rest over 0.9s cubic-bezier(.2,.8,.2,1) with 110ms stagger. A few highlighted words get an accent colour and an underline that draws from left to right after the line lands. Re-measure the lines when the width changes (ResizeObserver, debounced) and a Replay button resets and plays again. Keep the original text in one element for assistive tech (aria-label) and hide the split copy. Reduced motion shows the paragraph without animation. Vanilla HTML, CSS and JavaScript.',
 css:`.rl{display:grid;gap:22px;justify-items:start;padding:44px 40px 34px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.rl-text{margin:0;font:700 clamp(24px,4.6vw,40px)/1.28 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.025em}
.rl-line{display:block;overflow:hidden;padding:.08em 0 .14em;margin:-.08em 0 -.14em}
.rl-in{display:block;transform:translateY(115%) rotate(3deg);transform-origin:0 100%;filter:blur(6px);opacity:0;transition:transform .9s cubic-bezier(.2,.8,.2,1) calc(var(--n)*110ms),filter .9s ease calc(var(--n)*110ms),opacity .5s ease calc(var(--n)*110ms)}
.rl.in .rl-in{transform:none;filter:none;opacity:1}
.rl-hl{color:var(--sc-accent);background:linear-gradient(currentColor,currentColor) 0 100%/0 .09em no-repeat;transition:background-size .7s ease calc(var(--n)*110ms + 700ms)}
.rl.in .rl-hl{background-size:100% .09em}
.rl-btn{padding:9px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600}
.rl-btn:hover{border-color:var(--sc-accent)}
@media (prefers-reduced-motion:reduce){.rl-in{transform:none;filter:none;opacity:1;transition:none}.rl-hl{background-size:100% .09em;transition:none}}`,
 html:`<div class="rl"><p class="rl-text"></p><button class="rl-btn" type="button">Replay</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rl'),p=root.querySelector('.rl-text'),btn=root.querySelector('.rl-btn');
var text='Good typography is invisible until it moves. A line that rises into place gives the eye a rhythm, and a rhythm turns reading into a small pleasure.',hl={'invisible':1,'rhythm':1,'pleasure.':1},seen=false,timer=0,last=0;
p.setAttribute('aria-label',text);
function build(){p.textContent='';var words=text.split(' '),spans=[];words.forEach(function(w,i){if(i)p.appendChild(document.createTextNode(' '));var s=document.createElement('span');s.textContent=w;if(hl[w])s.className='rl-hl';p.appendChild(s);spans.push(s)});
 var groups=[],top=null;spans.forEach(function(s,i){var t=s.offsetTop;if(top===null||Math.abs(t-top)>4){groups.push([]);top=t}groups[groups.length-1].push(i)});
 p.textContent='';groups.forEach(function(g,n){var line=document.createElement('span');line.className='rl-line';line.setAttribute('aria-hidden','true');var inner=document.createElement('span');inner.className='rl-in';inner.style.setProperty('--n',n);
  g.forEach(function(i,k){if(k)inner.appendChild(document.createTextNode(' '));var s=document.createElement('span');s.textContent=words[i];if(hl[words[i]]){s.className='rl-hl';s.style.setProperty('--n',n)}inner.appendChild(s)});line.appendChild(inner);p.appendChild(line)})}
function layout(){var in_=root.classList.contains('in');root.classList.remove('in');build();void root.offsetWidth;if(in_)requestAnimationFrame(function(){root.classList.add('in')})}
function play(){root.classList.remove('in');void root.offsetWidth;requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('in')})})}
btn.addEventListener('click',play);
if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting&&!seen){seen=true;play()}},{threshold:.35}).observe(root);else root.classList.add('in');
if('ResizeObserver' in window)new ResizeObserver(function(){var w=root.clientWidth;if(w===last)return;last=w;clearTimeout(timer);timer=setTimeout(layout,120)}).observe(root);
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(layout);})();`}
];
