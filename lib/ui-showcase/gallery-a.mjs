// Original 3D galleries and card decks. The artwork is generated in the browser, so nothing is loaded from elsewhere.
import {ART} from './art-boot.mjs';
const family='3D & galleries';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const galleryA=[
{id:'s-concave-carousel',title:'Concave carousel',component:'Concave carousel',key:'concave-carousel',family,width:820,
 description:'A gallery wall that curves around you like the inside of a cylinder; drag to turn it or flip to the outside view.',
 prompt:'Build a 3D carousel from sixteen figures arranged on a cylinder (radius 800px, 22.5 degrees apart, 230x340px panels) with CSS 3D transforms. Each panel is rotateY(i*22.5deg) translateZ(s*R) with backface-visibility hidden, where s is -1 for the inside view (panels face the centre, the camera sits at the cylinder\'s centre so the wall curves around you) and +1 for the outside view. The ring is transform: translateZ(var(--z)) rotateY(var(--a)) inside a parent with perspective 900px. Register --z and --s with @property so the switch between inside and outside animates over 0.9s while --a is set from JavaScript every frame. Dragging rotates the ring (0.2deg per pixel) with inertia, it turns slowly when idle, arrow keys and Previous/Next buttons rotate by one panel, and a toggle button (aria-pressed) flips the view. Panels carry a caption, artwork comes from a procedural canvas generator embedded in the component, reduced motion disables auto-rotation. Vanilla HTML, CSS and JavaScript.',
 css:`@property --cc-z{syntax:'<length>';inherits:true;initial-value:900px}
@property --cc-s{syntax:'<number>';inherits:true;initial-value:-1}
.cc{position:relative;height:440px;border:1px solid #1d1b2e;border-radius:28px;background:radial-gradient(ellipse at 50% 55%,#1c1738,#07060f 75%);overflow:hidden;touch-action:pan-y;cursor:grab;user-select:none;transition:--cc-z .9s cubic-bezier(.6,0,.2,1),--cc-s .9s cubic-bezier(.6,0,.2,1)}
.cc.is-out{--cc-z:-800px;--cc-s:1}
.cc.drag{cursor:grabbing}
.cc-view{position:absolute;inset:0;perspective:900px;perspective-origin:50% 42%}
.cc-ring{position:absolute;left:50%;top:46%;width:0;height:0;transform-style:preserve-3d;transform:translateZ(var(--cc-z)) rotateY(var(--a,0deg))}
.cc-panel{position:absolute;left:-115px;top:-170px;width:230px;height:340px;margin:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;transform:rotateY(calc(var(--i)*22.5deg)) translateZ(calc(var(--cc-s)*800px));background-size:cover;background-position:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
.cc-panel figcaption{position:absolute;left:0;right:0;bottom:0;padding:44px 20px 18px;color:#fff;font:700 18px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(transparent,rgba(0,0,0,.55))}
.cc-panel figcaption small{display:block;margin-top:4px;font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;opacity:.8}
.cc-bar{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:center;gap:10px}
.cc-btn{padding:8px 16px;border:1px solid #3a3558;border-radius:999px;background:rgba(14,12,28,.8);color:#e8e4ff;cursor:pointer;font-size:13px;font-weight:600}
.cc-btn:hover,.cc-btn[aria-pressed=true]{border-color:#a99bff}`,
 html:`<div class="cc" role="group" aria-roledescription="carousel" aria-label="Gallery wall" tabindex="0"><div class="cc-view"><div class="cc-ring"></div></div><div class="cc-bar"><button class="cc-btn" type="button" data-d="-1" aria-label="Previous panel">Prev</button><button class="cc-btn cc-flip" type="button" aria-pressed="false">Outside view</button><button class="cc-btn" type="button" data-d="1" aria-label="Next panel">Next</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cc'),ring=root.querySelector('.cc-ring'),flip=root.querySelector('.cc-flip');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,a=0,v=0,target=null,drag=false,lastX=0,raf=0,visible=true;
for(var i=0;i<16;i++){var f=document.createElement('figure');f.className='cc-panel';f.style.setProperty('--i',i);f.style.backgroundImage='url('+artURL(i,230,340)+')';var cap=document.createElement('figcaption');cap.textContent=NAMES[i%8];var sm=document.createElement('small');sm.textContent='PLATE '+(i<9?'0':'')+(i+1);cap.appendChild(sm);f.appendChild(cap);ring.appendChild(f)}
function frame(){raf=0;if(target!==null){a+=(target-a)*.12;if(Math.abs(target-a)<.05){a=target;target=null}}else if(!drag){a+=v;v*=.95;if(Math.abs(v)<.02&&!reduce)a-=.06}
 ring.style.setProperty('--a',a.toFixed(3)+'deg');if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function step(d){var cur=Math.round(a/22.5);target=(cur-d)*22.5;v=0}
root.addEventListener('pointerdown',function(e){if(e.target.closest('.cc-bar'))return;drag=true;target=null;lastX=e.clientX;v=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lastX;lastX=e.clientX;var k=root.classList.contains('is-out')?.2:-.2;a+=dx*k;v=dx*k});
function up(){drag=false;root.classList.remove('drag')}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
root.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){step(+b.getAttribute('data-d'))})});
flip.addEventListener('click',function(){var out=root.classList.toggle('is-out');flip.setAttribute('aria-pressed',String(out));flip.textContent=out?'Inside view':'Outside view'});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-helix-gallery',title:'Helix gallery',component:'Helix gallery',key:'helix-gallery',family,width:820,
 description:'Photos spiral around a vertical axis like a double staircase; drag to spin and scroll them up and down.',
 prompt:'Create a helix of 22 photo cards. Card i sits at rotateY(i*26deg) translateY(i*30px) translateZ(250px) inside a transform-style: preserve-3d group that is rotateY(var(--a)) translateY(var(--y)) inside a parent with perspective 1100px. Dragging horizontally spins the helix (0.35deg per pixel with inertia), dragging vertically or using the wheel moves it up and down (clamped), and with no interaction it turns slowly. Each frame compute the facing of every card (cos of its world angle) and set its brightness so cards at the back dim to about 55% while the ones facing the viewer are full colour. Cards show a generated landscape and a small index label; a gentle vignette hides the top and bottom edges. Pause off-screen, no auto-rotation for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.hx{position:relative;height:440px;border:1px solid #1d1b2e;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#1a1533,#06050c 78%);overflow:hidden;cursor:grab;touch-action:none;user-select:none}
.hx.drag{cursor:grabbing}
.hx-view{position:absolute;inset:0;perspective:1100px;perspective-origin:50% 50%;-webkit-mask-image:linear-gradient(transparent,#000 18%,#000 82%,transparent);mask-image:linear-gradient(transparent,#000 18%,#000 82%,transparent)}
.hx-group{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transform:translateY(var(--y,0px)) rotateY(var(--a,0deg))}
.hx-card{position:absolute;left:-62px;top:-80px;width:124px;height:160px;border-radius:10px;background-size:cover;background-position:center;box-shadow:0 14px 30px -12px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,255,255,.18);filter:brightness(var(--b,1))}
.hx-card span{position:absolute;left:8px;bottom:6px;font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;color:rgba(255,255,255,.85)}
.hx-hint{position:absolute;left:0;right:0;bottom:12px;margin:0;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#7b76a6;pointer-events:none}`,
 html:`<div class="hx" role="img" aria-label="A spiral of landscape photographs"><div class="hx-view"><div class="hx-group"></div></div><p class="hx-hint">Drag to spin · wheel to climb</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.hx'),group=root.querySelector('.hx-group');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=22,STEP=26,cards=[],a=0,va=0,y=0,ty=0,drag=false,lx=0,ly=0,raf=0,visible=true,maxY=N*30/2;
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='hx-card';c.setAttribute('aria-hidden','true');c.style.backgroundImage='url('+artURL(i,124,160)+')';c.style.transform='rotateY('+i*STEP+'deg) translateY('+(i*30-N*15)+'px) translateZ(250px)';var l=document.createElement('span');l.textContent=(i<9?'0':'')+(i+1);c.appendChild(l);group.appendChild(c);cards.push(c)}
function frame(){raf=0;if(!drag){a+=va;va*=.94;if(!reduce&&Math.abs(va)<.05)a+=.18}y+=(ty-y)*.1;
 group.style.setProperty('--a',a.toFixed(2)+'deg');group.style.setProperty('--y',y.toFixed(1)+'px');
 for(var i=0;i<N;i++){var ang=(i*STEP+a)*Math.PI/180,f=(Math.cos(ang)+1)/2;cards[i].style.setProperty('--b',(.5+.5*f).toFixed(2))}
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;ly=e.clientY;va=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;a+=dx*.35;va=dx*.35;ty=Math.max(-maxY,Math.min(maxY,ty+dy))});
function up(){drag=false;root.classList.remove('drag')}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('wheel',function(e){ty=Math.max(-maxY,Math.min(maxY,ty-e.deltaY*.5))},{passive:true});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-circle-stack',title:'Circle stack',component:'Circle stack',key:'circle-stack',family,width:760,
 description:'A tilted stack of round photos; the top disc lifts away and drops to the bottom as you cycle.',
 prompt:'Build a stack of six circular photo discs (230px) seen at a steep angle: the stack is rotateX(58deg) rotateZ(-20deg) in a perspective(1000px) container and each disc is translateZ(k * -34px) where k is its place in the stack (0 is the top). Each disc has a generated landscape as a circular background, a thin white ring and a soft shadow. Clicking the stack (or pressing the Next button) lifts the top disc (translateZ(220px), scale 0.88, fade out over 0.5s), then moves it to the back with transitions disabled and fades it in at the bottom, while every other disc moves up one place with a 0.6s cubic-bezier transition. Auto-advance every 2.8s, pause on hover and when off-screen; reduced motion swaps instantly. A caption below names the current photo (aria-live polite). Vanilla HTML, CSS and JavaScript.',
 css:`.cs{display:grid;gap:18px;justify-items:center;padding:34px 20px 24px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.cs-view{width:min(100%,520px);height:330px;perspective:1000px;cursor:pointer}
.cs-stack{position:relative;width:100%;height:100%;transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(-20deg) translateY(-40px)}
.cs-disc{position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-115px 0 0 -115px;border-radius:50%;background-size:cover;background-position:center;box-shadow:0 0 0 4px rgba(255,255,255,.92),0 26px 36px -10px rgba(0,0,0,.5);transform:translateZ(calc(var(--k)*-34px));transition:transform .6s cubic-bezier(.3,.8,.2,1),opacity .5s ease}
.cs-disc.is-out{transform:translateZ(220px) scale(.88);opacity:0}
.cs-disc.is-hold{transition:none}
.cs-bar{display:flex;align-items:center;gap:14px;margin-top:10px}
.cs-cap{min-width:7em;margin:0;text-align:center;font:700 16px/1 system-ui,-apple-system,"Segoe UI",sans-serif}
.cs-btn{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.cs-btn:hover{border-color:var(--sc-accent)}`,
 html:`<div class="cs"><div class="cs-view"><div class="cs-stack"></div></div><div class="cs-bar"><button class="cs-btn" type="button" data-d="-1" aria-label="Previous photo">Prev</button><p class="cs-cap" aria-live="polite"></p><button class="cs-btn" type="button" data-d="1" aria-label="Next photo">Next</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cs'),stack=root.querySelector('.cs-stack'),cap=root.querySelector('.cs-cap'),view=root.querySelector('.cs-view');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=6,order=[],discs=[],busy=false,hover=false,timer=0,top=0;
for(var i=0;i<N;i++){var d=document.createElement('div');d.className='cs-disc';d.setAttribute('aria-hidden','true');d.style.backgroundImage='url('+artURL(i,230,230)+')';stack.appendChild(d);discs.push(d);order.push(i)}
function place(){order.forEach(function(id,k){discs[id].style.setProperty('--k',k);discs[id].style.zIndex=N-k});cap.textContent=NAMES[order[0]%8]}
function next(){if(busy)return;busy=true;var id=order[0],d=discs[id];if(reduce){order.push(order.shift());place();busy=false;return}
 d.classList.add('is-out');setTimeout(function(){d.classList.add('is-hold');order.push(order.shift());place();d.classList.remove('is-out');void d.offsetWidth;d.style.opacity='0';void d.offsetWidth;d.classList.remove('is-hold');d.style.opacity='';busy=false},520)}
function prev(){if(busy)return;order.unshift(order.pop());place()}
view.addEventListener('click',next);root.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){+b.getAttribute('data-d')>0?next():prev();loop()})});
root.addEventListener('pointerenter',function(){hover=true});root.addEventListener('pointerleave',function(){hover=false});
function loop(){clearTimeout(timer);if(reduce)return;timer=setTimeout(function(){if(!hover)next();loop()},2800)}
place();loop();})();`},

{id:'s-drift-field',title:'Drift field',component:'Drift field',key:'drift-field',family,width:820,
 description:'An endless field of photos you drift through in 3D; the pointer steers and the wheel makes you fly faster.',
 prompt:'Make an infinite 3D gallery. Place 24 cards (220x280px) at random x/y positions (x within +-640, y within +-330) and z positions spread across a 2800px depth. Inside a stage with perspective 800px and transform-style: preserve-3d, every frame advance a camera depth by a base speed of 1.4px (plus a wheel boost that decays back) and set each card to translate3d(x - camX, y - camY, -zz) where zz is ((z - camera) modulo depth) - 400 so cards flow towards the viewer and wrap around endlessly. Fade cards in over the far 20% of the depth and out as they pass the camera. The pointer shifts the camera x/y with easing by up to +-120px for parallax. Add a small speed readout. Pause off-screen, and for reduced motion do not drift unless the user uses the wheel. Vanilla HTML, CSS and JavaScript.',
 css:`.df{position:relative;height:440px;border:1px solid #1d1b2e;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#17142e,#05040b 78%);overflow:hidden;touch-action:pan-y}
.df-view{position:absolute;inset:0;perspective:800px;perspective-origin:50% 50%}
.df-stage{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}
.df-card{position:absolute;left:-110px;top:-140px;width:220px;height:280px;border-radius:12px;background-size:cover;background-position:center;box-shadow:0 18px 40px -14px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.14);will-change:transform,opacity}
.df-hint{position:absolute;left:0;right:0;bottom:12px;margin:0;text-align:center;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#7b76a6;pointer-events:none}`,
 html:`<div class="df" role="img" aria-label="Photographs drifting towards you in three dimensions"><div class="df-view"><div class="df-stage"></div></div><p class="df-hint">Steer with the pointer · scroll to fly</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.df'),stage=root.querySelector('.df-stage'),hint=root.querySelector('.df-hint');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,D=2800,N=24,cards=[],cam=0,boost=0,cx=0,cy=0,tx=0,ty=0,raf=0,visible=true;
function rnd(i){var x=Math.sin(i*127.1+11.7)*43758.5453;return x-Math.floor(x)}
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='df-card';c.setAttribute('aria-hidden','true');c.style.backgroundImage='url('+artURL(i,220,280)+')';stage.appendChild(c);cards.push({el:c,x:(rnd(i)-.5)*1280,y:(rnd(i+50)-.5)*660,z:i/N*D})}
function frame(){raf=0;cam+=(reduce?0:1.4)+boost;boost*=.96;cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;
 cards.forEach(function(c){var zz=((c.z-cam)%D+D)%D-400,t=(zz+400)/D,op=Math.min(1,(1-t)/.2)*Math.min(1,(zz+400)/520);c.el.style.opacity=Math.max(0,op).toFixed(3);c.el.style.transform='translate3d('+(c.x-cx).toFixed(1)+'px,'+(c.y-cy).toFixed(1)+'px,'+(-zz).toFixed(1)+'px)'});
 hint.textContent='Steer with the pointer · scroll to fly'+(boost>1.5?'  ·  '+Math.round(1.4+boost)*4+' u/s':'');
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*240;ty=((e.clientY-r.top)/r.height-.5)*160});
root.addEventListener('pointerleave',function(){tx=ty=0});
root.addEventListener('wheel',function(e){boost=Math.max(-6,Math.min(18,boost+Math.abs(e.deltaY)*.02));if(reduce)go()},{passive:true});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-tilted-wall',title:'Tilted wall',component:'Tilted wall',key:'tilted-wall',family,width:820,
 description:'A tilted wall of photo columns that scroll past in alternating directions, lifting a tile as you hover.',
 prompt:'Create a slanted wall of images. Five columns of tiles (150x190px with 14px gaps) sit inside a container rotated rotateX(54deg) rotateZ(-26deg) under perspective 1200px. Each column holds the same eight generated landscapes (in a different order per column), duplicated so the content is twice as tall, and scrolls infinitely with a CSS animation from translateY(0) to translateY(-50%) in alternating directions at different durations (28s to 44s). Tiles lift (translateZ(40px), scale 1.05, brighter shadow) on hover with a short transition, and hovering pauses the column they belong to. Add a gradient mask so the wall fades into the stage at its edges. Reduced motion stops the scrolling. Vanilla HTML, CSS and JavaScript.',
 css:`.tw2{position:relative;height:440px;border:1px solid #1d1b2e;border-radius:28px;background:#07060d;overflow:hidden}
.tw2-view{position:absolute;inset:0;perspective:1200px;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 38%,transparent 78%);mask-image:radial-gradient(ellipse at 50% 50%,#000 38%,transparent 78%)}
.tw2-wall{position:absolute;left:50%;top:50%;display:flex;gap:14px;transform:translate(-50%,-50%) rotateX(54deg) rotateZ(-26deg);transform-style:preserve-3d}
.tw2-col{width:150px;height:680px;overflow:visible;transform-style:preserve-3d}
.tw2-track{display:flex;flex-direction:column;gap:14px;animation:tw2-scroll var(--d,36s) linear infinite;animation-direction:var(--dir,normal);transform-style:preserve-3d}
.tw2-col:hover .tw2-track{animation-play-state:paused}
.tw2-tile{flex:none;width:150px;height:190px;border-radius:12px;background-size:cover;background-position:center;box-shadow:0 10px 24px -10px rgba(0,0,0,.8);transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .3s}
.tw2-tile:hover{transform:translateZ(40px) scale(1.05);box-shadow:0 30px 50px -10px rgba(120,100,255,.5)}
@keyframes tw2-scroll{to{transform:translateY(calc(-50% - 7px))}}
@media (prefers-reduced-motion:reduce){.tw2-track{animation:none}}`,
 html:`<div class="tw2" role="img" aria-label="A slanted wall of landscape photographs scrolling past"><div class="tw2-view"><div class="tw2-wall"></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tw2'),wall=root.querySelector('.tw2-wall');
${ART}
var durs=[34,42,30,44,38];
for(var c=0;c<5;c++){var col=document.createElement('div');col.className='tw2-col';col.style.marginTop=(c%2?-120:40)+'px';var tr=document.createElement('div');tr.className='tw2-track';tr.style.setProperty('--d',durs[c]+'s');tr.style.setProperty('--dir',c%2?'reverse':'normal');
 for(var rep=0;rep<2;rep++)for(var k=0;k<8;k++){var t=document.createElement('div');t.className='tw2-tile';t.setAttribute('aria-hidden','true');t.style.backgroundImage='url('+artURL((k+c*3)%8,150,190)+')';tr.appendChild(t)}
 col.appendChild(tr);wall.appendChild(col)}})();`},

{id:'s-card-spread',title:'Card spread',component:'Card spread',key:'card-spread',family,width:760,
 description:'A fanned hand of photo cards that opens wide on hover or focus, with the hovered card rising above the rest.',
 prompt:'Build a fanned deck of five cards (170x236px) whose transform origin is the bottom centre. At rest card i is rotated (i - 2) * 7 degrees and nudged (i - 2) * 22px sideways; when the deck is hovered or contains focus the rotation grows to (i - 2) * 17 degrees and the offset to (i - 2) * 76px with a 0.5s cubic-bezier(.2,.9,.3,1.2) transition and a 30ms stagger. The hovered or focused card rises 34px, straightens by 40% and scales to 1.07 above the others (z-index). Each card is a button with a generated landscape, a title and a small number, with a visible focus outline; clicking selects it and the selected name appears under the deck (aria-live polite). Reduced motion removes the transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.sp{display:grid;gap:22px;justify-items:center;padding:56px 20px 30px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.sp-deck{position:relative;width:min(100%,560px);height:270px}
.sp-card{--i:0;position:absolute;left:50%;bottom:0;width:170px;height:236px;margin:0 0 0 -85px;padding:0;border:0;border-radius:16px;overflow:hidden;cursor:pointer;color:#fff;text-align:left;background-size:cover;background-position:center;box-shadow:0 18px 30px -12px rgba(0,0,0,.5),0 0 0 3px #fff;transform-origin:50% 120%;transform:translateX(calc(var(--i)*22px)) rotate(calc(var(--i)*7deg));transition:transform .5s cubic-bezier(.2,.9,.3,1.2) calc(var(--n)*30ms),box-shadow .3s;z-index:var(--z)}
.sp-deck:hover .sp-card,.sp-deck:focus-within .sp-card{transform:translateX(calc(var(--i)*64px)) rotate(calc(var(--i)*15deg))}
.sp-deck .sp-card:hover,.sp-deck .sp-card:focus-visible{transform:translateX(calc(var(--i)*64px)) translateY(-34px) rotate(calc(var(--i)*9deg)) scale(1.07);z-index:20;box-shadow:0 30px 44px -14px rgba(0,0,0,.6),0 0 0 3px #fff}
.sp-card span{position:absolute;left:12px;bottom:12px;font:800 17px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.sp-card small{position:absolute;left:12px;top:12px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;opacity:.9}
.sp-sel{margin:0;min-height:1.4em;font-weight:700;color:var(--sc-muted)}
@media (prefers-reduced-motion:reduce){.sp-card{transition:none}}`,
 html:`<div class="sp"><div class="sp-deck" role="group" aria-label="Photo deck"></div><p class="sp-sel" aria-live="polite">Pick a card</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sp'),deck=root.querySelector('.sp-deck'),sel=root.querySelector('.sp-sel');
${ART}
${NAMES}
for(var i=0;i<5;i++){var b=document.createElement('button');b.type='button';b.className='sp-card';b.style.setProperty('--i',i-2);b.style.setProperty('--n',Math.abs(i-2));b.style.setProperty('--z',10-Math.abs(i-2));b.style.backgroundImage='url('+artURL(i*2+1,170,236)+')';
 var t=document.createElement('span');t.textContent=NAMES[(i*2+1)%8];var s=document.createElement('small');s.textContent='0'+(i+1);b.appendChild(s);b.appendChild(t);(function(name){b.addEventListener('click',function(){sel.textContent='Selected: '+name})})(NAMES[(i*2+1)%8]);deck.appendChild(b)}})();`},

{id:'s-click-stack',title:'Click stack',component:'Click stack',key:'click-stack',family,width:760,
 description:'A pile of photo cards you click through: the top card spins away and slides under the stack.',
 prompt:'Make a stack of five photo cards (270x350px), each slightly rotated and offset (rotate ((k * 5) - 4)deg, translate k*10px, scale 1 - k*0.04, z-index descending). Clicking the top card (a real button) throws it to the side (translateX(+-340px) rotate(+-24deg), fade to 0.3 over 0.45s), then moves it to the back of the stack and the others move forward by one place with a 0.5s cubic-bezier(.2,.9,.3,1.2) transition. Throw alternately left and right. Show a counter ("2 / 5") and a Previous button that brings the last card back to the top. Keyboard: the top card is focusable and Enter/Space throw it. Cards show generated landscapes and a title. Reduced motion swaps instantly. Vanilla HTML, CSS and JavaScript.',
 css:`.ks{display:grid;gap:22px;justify-items:center;padding:36px 20px 26px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.ks-stack{position:relative;width:270px;height:350px}
.ks-card{--k:0;position:absolute;inset:0;padding:0;border:0;border-radius:20px;overflow:hidden;cursor:pointer;color:#fff;text-align:left;background-size:cover;background-position:center;box-shadow:0 24px 36px -16px rgba(0,0,0,.55),0 0 0 4px #fff;transform:translateX(calc(var(--k)*10px)) translateY(calc(var(--k)*-8px)) rotate(calc(var(--k)*5deg - 4deg)) scale(calc(1 - var(--k)*.04));z-index:calc(10 - var(--k));transition:transform .5s cubic-bezier(.2,.9,.3,1.2),opacity .3s}
.ks-card[tabindex="-1"]{cursor:default}
.ks-card.is-throw{transform:translateX(var(--tx)) rotate(var(--tr)) !important;opacity:.3;transition:transform .45s cubic-bezier(.5,0,.8,.4),opacity .45s}
.ks-card.is-hold{transition:none}
.ks-card strong{position:absolute;left:18px;bottom:18px;font:800 24px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 10px rgba(0,0,0,.5)}
.ks-bar{display:flex;align-items:center;gap:14px}
.ks-count{min-width:4em;text-align:center;font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--sc-muted)}
.ks-btn{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.ks-btn:hover{border-color:var(--sc-accent)}
@media (prefers-reduced-motion:reduce){.ks-card{transition:none}}`,
 html:`<div class="ks"><div class="ks-stack"></div><div class="ks-bar"><button class="ks-btn" type="button" data-d="-1" aria-label="Previous card">Prev</button><span class="ks-count" aria-live="polite"></span><button class="ks-btn" type="button" data-d="1" aria-label="Next card">Next</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ks'),stack=root.querySelector('.ks-stack'),count=root.querySelector('.ks-count');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=5,order=[],cards=[],side=1,busy=false;
for(var i=0;i<N;i++){var c=document.createElement('button');c.type='button';c.className='ks-card';c.style.backgroundImage='url('+artURL(i+2,270,350)+')';c.setAttribute('aria-label',NAMES[(i+2)%8]);var s=document.createElement('strong');s.textContent=NAMES[(i+2)%8];c.appendChild(s);(function(el){el.addEventListener('click',function(){if(order[0]===cards.indexOf(el))next()})})(c);stack.appendChild(c);cards.push(c);order.push(i)}
function place(){order.forEach(function(id,k){var c=cards[id];c.style.setProperty('--k',k);c.tabIndex=k===0?0:-1;c.setAttribute('aria-hidden',k===0?'false':'true')});count.textContent=(order[0]+1)+' / '+N}
function next(){if(busy)return;busy=true;var id=order[0],c=cards[id];if(reduce){order.push(order.shift());place();busy=false;return}
 c.style.setProperty('--tx',(side*340)+'px');c.style.setProperty('--tr',(side*24)+'deg');side=-side;c.classList.add('is-throw');
 setTimeout(function(){c.classList.add('is-hold');order.push(order.shift());place();c.classList.remove('is-throw');void c.offsetWidth;c.classList.remove('is-hold');busy=false},440)}
function prev(){if(busy)return;order.unshift(order.pop());place()}
root.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){+b.getAttribute('data-d')>0?next():prev()})});place();})();`},

{id:'s-contact-sheet',title:'Contact sheet',component:'Contact sheet',key:'contact-sheet',family,width:820,
 description:'A strip of film frames that develop one by one from a murky negative into full-colour prints.',
 prompt:'Build a film contact sheet: a dark panel with three rows of four 4:5 frames, sprocket-hole rows above and below each strip and a frame number under every picture. Each frame holds a generated landscape. When the sheet scrolls into view (or the "Develop" button is pressed) every frame animates from a murky state (filter: brightness(.18) sepia(1) contrast(.6) blur(7px)) to normal over 1.8s with a random stagger of up to 1.6s so the prints appear to develop unevenly. Hovering a developed frame lifts it slightly and brightens it. Use CSS animations restarted by toggling a class, pause nothing else, and for reduced motion show developed frames immediately. Vanilla HTML, CSS and JavaScript.',
 css:`.ct{display:grid;gap:18px;justify-items:center;padding:26px 22px 22px;border:1px solid #26231f;border-radius:28px;background:#14110e;overflow:hidden}
.ct-strip{width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 12px;border-radius:6px;background:#0b0907}
.ct-strip{background-image:radial-gradient(circle,#2b2620 2.6px,transparent 3px),radial-gradient(circle,#2b2620 2.6px,transparent 3px);background-size:20px 12px,20px 12px;background-position:0 2px,0 calc(100% - 2px);background-repeat:repeat-x}
.ct-frame{margin:0;text-align:center;font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:#d9a441}
.ct-pic{display:block;aspect-ratio:4/5;margin-bottom:6px;border-radius:2px;background-size:cover;background-position:center;filter:brightness(.18) sepia(1) contrast(.6) blur(7px);transition:transform .3s,box-shadow .3s}
.ct.dev .ct-pic{animation:ct-develop 1.8s ease forwards var(--dl)}
.ct.done .ct-pic{filter:none}
.ct.done .ct-frame:hover .ct-pic{transform:translateY(-4px) scale(1.04);box-shadow:0 14px 24px -8px rgba(0,0,0,.8)}
.ct-btn{padding:8px 18px;border:1px solid #4a4236;border-radius:999px;background:#1d1914;color:#f0e6d2;cursor:pointer;font-size:13px;font-weight:600}
.ct-btn:hover{border-color:#d9a441}
@keyframes ct-develop{0%{filter:brightness(.18) sepia(1) contrast(.6) blur(7px)}55%{filter:brightness(.7) sepia(.8) contrast(.9) blur(2px)}100%{filter:none}}
@media (prefers-reduced-motion:reduce){.ct-pic{filter:none!important;animation:none!important}}`,
 html:`<div class="ct" role="img" aria-label="A contact sheet of twelve landscape photographs developing"><div class="ct-strips"></div><button class="ct-btn" type="button">Develop again</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ct'),holder=root.querySelector('.ct-strips'),btn=root.querySelector('.ct-btn');
${ART}
var timer=0,seen=false;
for(var r=0;r<3;r++){var strip=document.createElement('div');strip.className='ct-strip';strip.style.marginBottom='12px';for(var c=0;c<4;c++){var n=r*4+c,f=document.createElement('figure');f.className='ct-frame';f.setAttribute('aria-hidden','true');var p=document.createElement('i');p.className='ct-pic';p.style.backgroundImage='url('+artURL(n,200,250)+')';p.style.setProperty('--dl',(Math.random()*1.6).toFixed(2)+'s');var l=document.createElement('span');l.textContent=(n<9?'0':'')+(n+1)+'A';f.appendChild(p);f.appendChild(l);strip.appendChild(f)}holder.appendChild(strip)}
holder.style.width='100%';
function develop(){clearTimeout(timer);root.classList.remove('dev','done');root.querySelectorAll('.ct-pic').forEach(function(p){p.style.setProperty('--dl',(Math.random()*1.6).toFixed(2)+'s')});void root.offsetWidth;root.classList.add('dev');timer=setTimeout(function(){root.classList.add('done')},3600)}
btn.addEventListener('click',develop);
if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting&&!seen){seen=true;develop()}},{threshold:.3}).observe(root);else develop();})();`},

{id:'s-parallax-carousel',title:'Parallax carousel',component:'Parallax carousel',key:'parallax-carousel',family,width:820,
 description:'A draggable carousel whose photos slide inside their frames at a different speed for a layered depth effect.',
 prompt:'Build a horizontally draggable carousel of seven cards (300x400px, 24px gap). Each card has an inner image layer that is 140% as wide as the card and is translated horizontally by -offset * 70px where offset is the card\'s signed distance from the centre in card widths, so the photo moves against the frame while sliding. Cards also scale (1 - 0.1 * |offset|) and rotateY(offset * -10deg) under perspective(1200px). Dragging moves a target position with 1:1 pointer movement, release applies the velocity and snaps to the nearest card with an eased animation, wheel/trackpad horizontal scroll nudges it and Previous/Next buttons and arrow keys step by one. Show a progress bar and the title of the centred card in aria-live text. Pause off-screen; reduced motion snaps without easing. Vanilla HTML, CSS and JavaScript.',
 css:`.pc{position:relative;height:470px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.pc.drag{cursor:grabbing}
.pc-view{position:absolute;left:0;right:0;top:34px;height:400px;perspective:1200px}
.pc-card{position:absolute;left:50%;top:0;width:300px;height:400px;margin-left:-150px;border-radius:22px;overflow:hidden;box-shadow:0 30px 50px -22px rgba(0,0,0,.55);will-change:transform}
.pc-img{position:absolute;top:0;bottom:0;left:-20%;width:140%;background-size:cover;background-position:center;will-change:transform}
.pc-card strong{position:absolute;left:20px;bottom:20px;color:#fff;font:800 22px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 10px rgba(0,0,0,.5)}
.pc-bar{position:absolute;left:24px;right:24px;bottom:16px;display:flex;align-items:center;gap:14px}
.pc-prog{flex:1;height:3px;border-radius:3px;background:var(--sc-line);overflow:hidden}
.pc-prog i{display:block;height:100%;width:0;background:var(--sc-accent)}
.pc-btn{padding:7px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.pc-btn:hover{border-color:var(--sc-accent)}
.pc-name{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="pc" role="group" aria-roledescription="carousel" aria-label="Landscape carousel" tabindex="0"><div class="pc-view"></div><p class="pc-name" aria-live="polite"></p><div class="pc-bar"><button class="pc-btn" type="button" data-d="-1" aria-label="Previous">Prev</button><span class="pc-prog"><i></i></span><button class="pc-btn" type="button" data-d="1" aria-label="Next">Next</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pc'),view=root.querySelector('.pc-view'),prog=root.querySelector('.pc-prog i'),nm=root.querySelector('.pc-name');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=7,W=324,cards=[],x=0,tx=0,v=0,drag=false,lx=0,raf=0,visible=true,lastName=-1;
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='pc-card';var im=document.createElement('div');im.className='pc-img';im.style.backgroundImage='url('+artURL(i+4,420,400)+')';var t=document.createElement('strong');t.textContent=NAMES[(i+4)%8];c.appendChild(im);c.appendChild(t);view.appendChild(c);cards.push({el:c,img:im})}
function frame(){raf=0;if(!drag){if(Math.abs(v)>.4){tx+=v;v*=.92}else{var snap=Math.round(tx/W)*W;snap=Math.max(0,Math.min((N-1)*W,snap));tx=reduce?snap:tx+(snap-tx)*.14;v=0}}tx=Math.max(-W*.3,Math.min((N-1)*W+W*.3,tx));x+=(tx-x)*(reduce?1:.25);
 cards.forEach(function(c,i){var off=(i*W-x)/W,a=Math.abs(off);c.el.style.transform='translateX('+(off*W).toFixed(1)+'px) scale('+(1-Math.min(.25,a*.1)).toFixed(3)+') rotateY('+(off*-10).toFixed(2)+'deg)';c.el.style.zIndex=100-Math.round(a*10);c.el.style.opacity=Math.max(.15,1-a*.28).toFixed(2);c.img.style.transform='translateX('+(-off*70).toFixed(1)+'px)'});
 prog.style.width=(Math.max(0,Math.min(1,x/((N-1)*W)))*100).toFixed(1)+'%';var cur=Math.max(0,Math.min(N-1,Math.round(x/W)));if(cur!==lastName){lastName=cur;nm.textContent=NAMES[(cur+4)%8]}
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function step(d){tx=Math.max(0,Math.min((N-1)*W,Math.round(tx/W)*W+d*W));v=0}
root.addEventListener('pointerdown',function(e){if(e.target.closest('.pc-bar'))return;drag=true;lx=e.clientX;v=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;tx-=dx;v=-dx});
function up(){drag=false;root.classList.remove('drag')}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('wheel',function(e){if(Math.abs(e.deltaX)>Math.abs(e.deltaY))tx+=e.deltaX},{passive:true});
root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
root.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){step(+b.getAttribute('data-d'))})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);tx=W*2;x=tx;go();})();`}
];
