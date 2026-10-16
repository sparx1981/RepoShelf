// Motion toolkit demos, part two: proximity, skew, scrubbed layouts, loops, pickers, cart, confetti and paper cut. No third-party code.
import {ART} from './art-boot.mjs';
import {BOOT} from './cursorfx-boot.mjs';
import {SB} from './annn-boot.mjs';
const family='Motion toolkit';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const motionB=[
{id:'s-proximity-grid',title:'Proximity grid',component:'Proximity grid',key:'proximity-grid',family,width:780,
 description:'A grid of buttons that swell, lift and warm in colour as the pointer comes near, with neighbours easing out of the way.',
 prompt:'Make a 12 x 6 grid of round-cornered icon buttons (44px, real buttons with aria-labels such as "Tool 1") in a stage. Each frame the pointer position (or, with no pointer, a virtual one on a Lissajous path) gives every button a target value k = smoothstep(1 - distance/170); the button eases towards it (factor 0.18) and gets transform scale(1 + 0.9 * k) and translateY(-8px * k), a colour mix from the surface tone to the accent (color-mix with a CSS variable --k), and a z-index that rises with k. Neighbours are pushed away slightly by translating each button along the vector from the pointer by up to 6px * k. Buttons show a simple glyph (a letter) that gets bolder when near. On click a button pulses (scale 1.4 and back via the Web Animations API) and toggles aria-pressed. Pause off-screen; reduced motion removes the pointer-driven scaling. Vanilla HTML, CSS and JavaScript.',
 css:`.pg{display:grid;place-items:center;height:400px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.pg-grid{position:relative;display:grid;grid-template-columns:repeat(12,44px);gap:12px;padding:20px}
.pg-b{position:relative;width:44px;height:44px;padding:0;border:0;border-radius:14px;background:color-mix(in srgb,var(--sc-accent) calc(var(--k,0)*100%),var(--sc-line));color:color-mix(in srgb,var(--sc-accent-fg) calc(var(--k,0)*100%),var(--sc-muted));cursor:pointer;font:600 15px/1 system-ui;will-change:transform}
.pg-b[aria-pressed=true]{outline:2px solid var(--sc-accent);outline-offset:2px}
@media (max-width:600px){.pg-grid{grid-template-columns:repeat(8,44px)}}`,
 html:`<div class="pg"><div class="pg-grid"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pg'),grid=root.querySelector('.pg-grid');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,B=[],px=-999,py=-999,inside=false,raf=0,visible=true,glyphs='ABCDEFGHJKLMNPQRSTUVWXYZ';
for(var i=0;i<72;i++){var b=document.createElement('button');b.type='button';b.className='pg-b';b.textContent=glyphs.charAt(i%glyphs.length);b.setAttribute('aria-label','Tool '+(i+1));b.setAttribute('aria-pressed','false');grid.appendChild(b);B.push({el:b,k:0,cx:0,cy:0});(function(o){b.addEventListener('click',function(){o.el.setAttribute('aria-pressed',String(o.el.getAttribute('aria-pressed')!=='true'));if(!reduce)o.el.animate([{transform:o.el.style.transform},{transform:o.el.style.transform+' scale(1.35)'},{transform:o.el.style.transform}],{duration:320,easing:'cubic-bezier(.3,1.5,.5,1)'})})})(B[i])}
function measure(){var g=grid.getBoundingClientRect();B.forEach(function(o){o.cx=o.el.offsetLeft+22;o.cy=o.el.offsetTop+22})}
function frame(now){raf=0;var t=now/1000,x=px,y=py;if(!inside){x=grid.offsetWidth*(.5+.42*Math.sin(t*.7));y=grid.offsetHeight*(.5+.4*Math.sin(t*1.1+1))}
 B.forEach(function(o){var dx=o.cx-x,dy=o.cy-y,d=Math.sqrt(dx*dx+dy*dy),k=Math.max(0,1-d/170);k=k*k*(3-2*k);if(reduce)k=0;o.k+=(k-o.k)*.18;var sc=1+.9*o.k,push=6*o.k/(d+1);o.el.style.transform='translate('+(dx*push).toFixed(2)+'px,'+(dy*push-8*o.k).toFixed(2)+'px) scale('+sc.toFixed(3)+')';o.el.style.setProperty('--k',o.k.toFixed(3));o.el.style.zIndex=Math.round(o.k*10);o.el.style.fontWeight=o.k>.5?800:600});
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=grid.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;inside=true});root.addEventListener('pointerleave',function(){inside=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
measure();addEventListener('resize',function(){measure()});go();})();`},

{id:'s-skew-gallery',title:'Velocity skew gallery',component:'Velocity skew gallery',key:'skew-gallery',family,width:780,
 description:'An endless drag-and-throw gallery whose photos shear and stretch with their speed and relax as they slow down.',
 prompt:'Build an infinite horizontal gallery of eight cards (190x250px, generated artwork) laid out with modular arithmetic: card i is placed at x = ((i * 210 - offset) mod total) shifted so the strip wraps seamlessly (total = 8 * 210). Pointer drag moves the offset 1:1; release gives it momentum (friction 0.95 per frame); with no interaction it drifts slowly at 0.6px per frame. A smoothed velocity v (v = v * 0.88 + frameDelta * 0.12) drives, for every card, transform: skewX(clamp(-v * 1.3, -24, 24) deg) scaleX(1 + min(|v| * 0.012, 0.25)) and an inner image counter-shift of v * 0.8 px for depth; cards at the stage edges fade slightly. Wheel (horizontal or vertical) adds velocity, arrow keys nudge it, and the stage is focusable with an aria-label. Pause off-screen; reduced motion removes the drift and the skew. Vanilla HTML, CSS and JavaScript.',
 css:`.sk3{position:relative;height:360px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.sk3.drag{cursor:grabbing}
.sk3-c{position:absolute;left:0;top:50%;width:190px;height:250px;margin-top:-125px;border-radius:14px;overflow:hidden;box-shadow:0 20px 30px -16px rgba(0,0,0,.5);will-change:transform}
.sk3-c i{position:absolute;inset:-6px;background-size:cover;background-position:center;will-change:transform}
.sk3-c span{position:absolute;left:12px;bottom:10px;color:#fff;font:800 15px/1 system-ui;text-shadow:0 1px 8px rgba(0,0,0,.5);z-index:2}`,
 html:`<div class="sk3" tabindex="0" role="region" aria-label="Photo gallery: drag, scroll or use the arrow keys"></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sk3');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,C=[],off=0,v=0,sv=0,drag=false,lx=0,raf=0,visible=true,STEP=210,TOTAL=8*STEP;
for(var i=0;i<8;i++){var c=document.createElement('div');c.className='sk3-c';var im=document.createElement('i');im.style.backgroundImage='url('+artURL(i,190,250)+')';var s=document.createElement('span');s.textContent=NAMES[i];c.appendChild(im);c.appendChild(s);root.appendChild(c);C.push({el:c,im:im})}
function frame(){raf=0;var prev=off;if(!drag){off+=v;v*=.95;if(Math.abs(v)<.6&&!reduce)off+=.6}
 var d=off-prev;sv=sv*.88+d*.12*(reduce?0:1);var W=root.clientWidth,sk=Math.max(-24,Math.min(24,-sv*1.3*6)),sx=1+Math.min(Math.abs(sv)*.012*6,.25);
 C.forEach(function(c,i){var x=((i*STEP-off)%TOTAL+TOTAL)%TOTAL-STEP;var e=Math.min(1,Math.min(x+190,W-x)/160);c.el.style.transform='translateX('+x.toFixed(1)+'px) skewX('+sk.toFixed(2)+'deg) scaleX('+sx.toFixed(3)+')';c.el.style.opacity=Math.max(.35,e).toFixed(2);c.im.style.transform='translateX('+(sv*.8*6).toFixed(1)+'px)'});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;v=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;off-=dx;v=-dx});
function up(){drag=false;root.classList.remove('drag')}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('wheel',function(e){v+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*.08},{passive:true});
root.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();v+=14}if(e.key==='ArrowLeft'){e.preventDefault();v-=14}});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-scrub-bento',title:'Scrubbed bento',component:'Scrubbed bento',key:'scrub-bento',family,width:780,
 description:'A bento gallery that reflows through three layouts as you scroll, each tile gliding between its rectangles on the scrollbar.',
 prompt:'Build a scroll-scrubbed bento gallery. A tall track in a scroll container holds a sticky stage. Six tiles (generated artwork with captions) have three keyframe layouts (A, B, C) given as rectangles in fractions of the stage (for example A: a big tile on the left and five small on the right; B: a wide tile on top and a row below; C: a tall tile on the right with a 2x2 block on the left). Scroll progress p (scrollTop / max) is mapped to a layout position q in 0..2 and each tile interpolates left, top, width and height between the two surrounding keyframes with a smoothstep ease and a per-tile stagger of 0.04 so tiles do not all arrive together. A caption in the stage names the layout and its position, and a small progress bar tracks p. Tiles have 8px gaps (inset every rectangle by 4px) and rounded corners that scale with size. The scroll container auto-scrolls up and down until the visitor scrolls, and is keyboard focusable with an aria-label; reduced motion reacts to manual scrolling only. Vanilla HTML, CSS and JavaScript.',
 css:`.sb2{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
.sb2-track{height:1100px}
.sb2-pin{position:sticky;top:0;height:430px;overflow:hidden}
.sb2-t{position:absolute;overflow:hidden;background-size:cover;background-position:center;will-change:left,top,width,height;box-shadow:0 14px 24px -16px rgba(0,0,0,.5)}
.sb2-t::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(0,0,0,.5))}
.sb2-t span{position:absolute;left:12px;bottom:10px;z-index:2;color:#fff;font:800 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif}
.sb2-cap{position:absolute;left:18px;top:14px;z-index:5;margin:0;padding:6px 12px;border-radius:999px;background:var(--sc-bg);border:1px solid var(--sc-line);font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase}
.sb2-bar{position:absolute;left:18px;right:18px;bottom:12px;z-index:5;height:3px;border-radius:3px;background:var(--sc-line)}
.sb2-bar i{display:block;height:100%;width:0;border-radius:3px;background:var(--sc-accent)}`,
 html:`<div class="sb2" tabindex="0" role="region" aria-label="Scrubbed bento gallery, scroll to change the layout"><div class="sb2-track"><div class="sb2-pin"><p class="sb2-cap" aria-live="off"></p><div class="sb2-bar"><i></i></div></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.sb2'),pin=box.querySelector('.sb2-pin'),cap=box.querySelector('.sb2-cap'),bar=box.querySelector('.sb2-bar i');
${ART}
${NAMES}
${SB}
var L=[[[.02,.04,.48,.92],[.52,.04,.22,.44],[.76,.04,.22,.28],[.76,.34,.22,.62],[.52,.5,.22,.46],[.52,.5,.0,.0]],[[.02,.04,.96,.4],[.02,.46,.3,.5],[.34,.46,.3,.5],[.66,.46,.32,.24],[.66,.72,.32,.24],[.34,.46,.0,.0]],[[.02,.04,.46,.46],[.5,.04,.2,.92],[.72,.04,.26,.46],[.02,.52,.22,.44],[.26,.52,.22,.44],[.72,.52,.26,.44]]],names=['Layout A','Layout B','Layout C'],T=[];
L[0][5]=[.52,.5,.22,.46];L[1][5]=[.34,.46,.3,.5];L[0][4]=[.52,.5,.22,.46];
var ids=[2,1,5,7,3,6];for(var i=0;i<6;i++){var t=document.createElement('div');t.className='sb2-t';t.style.backgroundImage='url('+artURL(ids[i],300,300)+')';var s=document.createElement('span');s.textContent=NAMES[ids[i]%8];t.appendChild(s);pin.insertBefore(t,cap);T.push(t)}
function sm(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
ScrollDemo(box,function(p){var W=pin.clientWidth,H=pin.clientHeight,q=p*2;T.forEach(function(t,i){var qq=Math.max(0,Math.min(2,q-(i-2.5)*.0)),a=Math.min(1,Math.floor(qq)),f=sm(Math.max(0,Math.min(1,(qq-a)-(i%3)*.04))/(1-(i%3)*.04)),A=L[a][i],Bv=L[Math.min(2,a+1)][i],r=[0,1,2,3].map(function(k){return A[k]+(Bv[k]-A[k])*f});t.style.left=(r[0]*W+4)+'px';t.style.top=(r[1]*H+4)+'px';t.style.width=Math.max(0,r[2]*W-8)+'px';t.style.height=Math.max(0,r[3]*H-8)+'px';t.style.borderRadius=Math.min(22,Math.min(r[2]*W,r[3]*H)/6)+'px'});
 cap.textContent=names[Math.round(q)]+' \\u00b7 '+Math.round(p*100)+'%';bar.style.width=(p*100)+'%'});})();`},

{id:'s-infinite-slider',title:'Infinite card slider',component:'Infinite card slider',key:'infinite-slider',family,width:780,
 description:'A card slider that loops forever in both directions with drag, throw and arrows, the centre card large and the rest receding.',
 prompt:'Create a seamless infinite card slider without cloning DOM. Seven cards (250x320px, generated artwork with title and number) have a floating position p. For card i compute the signed circular offset d = ((i - p + N/2) mod N) - N/2 (N = 7) and apply transform: translateX(d * 230px) scale(1 - min(|d|, 2) * 0.12) with opacity 1 - min(|d|, 3) * 0.22 and z-index by distance, hiding cards beyond |d| > 3 so they can jump from one end to the other unseen. Dragging changes p by dx / 230 with inertia (friction 0.92) and, on release, eases to the nearest integer; Previous/Next buttons and ArrowLeft/ArrowRight advance by one; clicking a side card centres it; auto-advance every 3s until the visitor interacts. The centre card index is announced in an aria-live region. Pause off-screen; reduced motion snaps without easing. Vanilla HTML, CSS and JavaScript.',
 css:`.is2{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.is2.drag{cursor:grabbing}
.is2-c{position:absolute;left:50%;top:40px;width:250px;height:320px;margin-left:-125px;border-radius:20px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 24px 36px -18px rgba(0,0,0,.55);color:#fff;will-change:transform}
.is2-c::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(0,0,0,.55))}
.is2-c b{position:absolute;left:16px;bottom:16px;z-index:2;font:800 22px/1 system-ui}
.is2-c small{position:absolute;left:16px;top:14px;z-index:2;font:700 11px/1 ui-monospace,monospace;letter-spacing:.14em}
.is2-bar{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:center;gap:10px}
.is2-btn{width:42px;height:42px;border:1px solid var(--sc-line);border-radius:50%;background:var(--sc-bg);cursor:pointer;color:inherit;font-size:18px}
.is2-btn:hover{border-color:var(--sc-accent)}
.is2-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="is2" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Card slider"><div class="is2-stage"></div><div class="is2-bar"><button class="is2-btn" type="button" data-d="-1" aria-label="Previous">&#8592;</button><button class="is2-btn" type="button" data-d="1" aria-label="Next">&#8594;</button></div><p class="is2-live" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.is2'),stage=root.querySelector('.is2-stage'),live=root.querySelector('.is2-live');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=7,STEP=230,C=[],p=0,tp=0,v=0,drag=false,lx=0,raf=0,visible=true,touched=false,last=-1;
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='is2-c';c.style.backgroundImage='url('+artURL(i,250,320)+')';var sm=document.createElement('small');sm.textContent='0'+(i+1);var b=document.createElement('b');b.textContent=NAMES[i%8];c.appendChild(sm);c.appendChild(b);(function(k){c.addEventListener('click',function(){var d=((k-p+N/2)%N+N)%N-N/2;if(Math.abs(d)>.4){touched=true;tp=Math.round(p+d)}})})(i);stage.appendChild(c);C.push(c)}
function frame(){raf=0;if(!drag){if(Math.abs(v)>.002){tp+=v;v*=.92;p=tp}else{p+=(tp-p)*(reduce?1:.14);if(Math.abs(tp-p)<.001)p=tp}}else p=tp;
 C.forEach(function(c,i){var d=(((i-p+N/2)%N)+N)%N-N/2,a=Math.abs(d);c.style.visibility=a>3.2?'hidden':'visible';c.style.transform='translateX('+(d*STEP).toFixed(1)+'px) scale('+(1-Math.min(a,2)*.12).toFixed(3)+')';c.style.opacity=(1-Math.min(a,3)*.22).toFixed(2);c.style.zIndex=10-Math.round(a*2)});
 var cur=((Math.round(p)%N)+N)%N;if(cur!==last){last=cur;live.textContent='Card '+(cur+1)+' of '+N+': '+NAMES[cur%8]}
 if(visible&&(drag||Math.abs(v)>.002||Math.abs(tp-p)>.001||!touched))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function step(d){touched=true;v=0;tp=Math.round(tp)+d;go()}
root.addEventListener('pointerdown',function(e){if(e.target.closest('.is2-bar'))return;touched=true;drag=true;lx=e.clientX;v=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}go()});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;var d=-dx/STEP;tp+=d;v=d;go()});
function up(){drag=false;root.classList.remove('drag');if(Math.abs(v)<.01)tp=Math.round(tp);else tp=tp;setTimeout(function(){if(Math.abs(v)<=.002)tp=Math.round(tp)},0);go()}
root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
root.querySelectorAll('.is2-btn').forEach(function(b){b.addEventListener('click',function(){step(+b.getAttribute('data-d'))})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
setInterval(function(){if(touched||!visible||reduce)return;tp=Math.round(tp)+1;go()},3000);go();})();`},

{id:'s-radial-time',title:'Radial time picker',component:'Radial time picker',key:'radial-time',family,width:520,
 description:'A round clock face for choosing a time: drag the hand around to set the hour, then it glides on to the minutes.',
 prompt:'Build a circular time picker. A 280px clock face (SVG) shows either 12 hour numbers or 12 minute marks (0, 5, ... 55). A hand from the centre to a selection bubble rotates with the pointer: pointerdown or drag on the face computes the angle with atan2 and snaps to the nearest hour (30 degree steps) or minute (6 degree steps); the hand and bubble animate between values using the shortest angular path with an ease (rAF, 0.25s). After the hour is chosen (pointerup) the face cross-fades (numbers rotate and fade through 0.35s) to the minutes mode automatically. A header shows the selected time as two large buttons (hour and minute, real buttons that switch mode, aria-pressed) with an AM/PM toggle (radio-style buttons). Keyboard: while the face is focused ArrowUp/ArrowRight add one step, ArrowDown/ArrowLeft remove one, Home/End jump to the first and last values; the picked time is announced in an aria-live region. Idle: when untouched the hand sweeps slowly. Reduced motion jumps. Vanilla HTML, CSS and JavaScript.',
 css:`.rt2{display:grid;gap:14px;justify-items:center;padding:24px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.rt2-head{display:flex;align-items:center;gap:10px}
.rt2-seg{padding:8px 14px;border:0;border-radius:14px;background:var(--sc-line);color:inherit;cursor:pointer;font:800 38px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
.rt2-seg[aria-pressed=true]{background:var(--sc-accent);color:var(--sc-accent-fg)}
.rt2-colon{font:800 38px/1 ui-monospace,monospace}
.rt2-ap{display:grid;gap:4px;margin-left:6px}
.rt2-ap button{padding:5px 10px;border:1px solid var(--sc-line);border-radius:8px;background:var(--sc-bg);color:inherit;cursor:pointer;font:700 12px/1 system-ui}
.rt2-ap button[aria-pressed=true]{border-color:var(--sc-accent);background:var(--sc-ring)}
.rt2-svg{width:min(100%,300px);height:auto;touch-action:none;cursor:pointer;user-select:none;outline-offset:6px}
.rt2-face{fill:var(--sc-bg);stroke:var(--sc-line);stroke-width:2}
.rt2-num{font:700 17px system-ui;fill:var(--sc-fg);text-anchor:middle;dominant-baseline:central;transition:opacity .35s,transform .35s}
.rt2-hand{stroke:var(--sc-accent);stroke-width:3;stroke-linecap:round}
.rt2-bub{fill:var(--sc-accent)}
.rt2-bt{font:800 17px system-ui;fill:var(--sc-accent-fg);text-anchor:middle;dominant-baseline:central}
.rt2-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="rt2"><div class="rt2-head"><button class="rt2-seg" type="button" data-m="h" aria-pressed="true" aria-label="Hour"></button><span class="rt2-colon" aria-hidden="true">:</span><button class="rt2-seg" type="button" data-m="m" aria-pressed="false" aria-label="Minute"></button><div class="rt2-ap" role="group" aria-label="AM or PM"><button type="button" data-ap="AM" aria-pressed="true">AM</button><button type="button" data-ap="PM" aria-pressed="false">PM</button></div></div><svg class="rt2-svg" viewBox="-150 -150 300 300" tabindex="0" role="slider" aria-label="Clock face" aria-valuemin="0" aria-valuemax="11"><circle class="rt2-face" r="144"/><g class="rt2-nums"></g><line class="rt2-hand" x1="0" y1="0" x2="0" y2="-100"/><circle r="5" fill="var(--sc-accent)"/><g class="rt2-b"><circle class="rt2-bub" r="22"/><text class="rt2-bt"></text></g></svg><p class="rt2-live" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rt2'),svg=root.querySelector('.rt2-svg'),nums=root.querySelector('.rt2-nums'),hand=root.querySelector('.rt2-hand'),bub=root.querySelector('.rt2-b'),bt=root.querySelector('.rt2-bt'),segs=root.querySelectorAll('.rt2-seg'),aps=root.querySelectorAll('[data-ap]'),live=root.querySelector('.rt2-live'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,mode='h',H=10,M=25,ap='AM',ang=0,tang=0,raf=0,drag=false,touched=false,R=100;
function pad(n){return (n<10?'0':'')+n}
function build(){nums.textContent='';for(var i=0;i<12;i++){var t=document.createElementNS(NS,'text');t.setAttribute('class','rt2-num');var a=i/12*6.283-Math.PI/2;t.setAttribute('x',(Math.cos(a)*118).toFixed(1));t.setAttribute('y',(Math.sin(a)*118).toFixed(1));t.textContent=mode==='h'?(i===0?12:i):pad(i*5);nums.appendChild(t)}}
function val(){return mode==='h'?H%12:M/5}
function update(){segs[0].textContent=pad(H);segs[1].textContent=pad(M);segs[0].setAttribute('aria-pressed',String(mode==='h'));segs[1].setAttribute('aria-pressed',String(mode==='m'));aps.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-ap')===ap))});var v=mode==='h'?(H%12||12):M;svg.setAttribute('aria-valuenow',String(val()));svg.setAttribute('aria-valuetext',(mode==='h'?'Hour ':'Minute ')+v);bt.textContent=mode==='h'?(H%12||12):pad(M)}
function place(a){var r=a*Math.PI/180-Math.PI/2;hand.setAttribute('x2',(Math.cos(r)*R).toFixed(1));hand.setAttribute('y2',(Math.sin(r)*R).toFixed(1));bub.setAttribute('transform','translate('+(Math.cos(r)*118).toFixed(1)+' '+(Math.sin(r)*118).toFixed(1)+')')}
function frame(){raf=0;var d=tang-ang;d=((d+540)%360)-180;if(Math.abs(d)<.1||reduce){ang=tang}else ang+=d*.25;place(ang);if(Math.abs(tang-ang)>.1&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf)raf=requestAnimationFrame(frame)}
function set(v,commit){if(mode==='h'){H=(v%12)+(ap==='PM'?12:0);if(H%12===0&&ap==='AM')H=0}else M=((v%12)*5+60)%60;tang=mode==='h'?(H%12)*30:M*6;update();go();if(commit)live.textContent=pad(H%12||12)+':'+pad(M)+' '+ap}
function switchMode(m,fade){if(m===mode)return;mode=m;if(fade&&!reduce){nums.style.opacity=0;setTimeout(function(){build();nums.style.opacity=1;nums.style.transition='opacity .35s'},180)}else build();tang=mode==='h'?(H%12)*30:M*6;update();go()}
function at(e){var r=svg.getBoundingClientRect(),a=Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI+90;a=(a+360)%360;return Math.round(a/30)%12}
svg.addEventListener('pointerdown',function(e){touched=true;drag=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}set(at(e),false)});svg.addEventListener('pointermove',function(e){if(drag)set(at(e),false)});
svg.addEventListener('pointerup',function(){if(!drag)return;drag=false;set(val(),true);if(mode==='h')setTimeout(function(){switchMode('m',true)},220)});
svg.addEventListener('keydown',function(e){var d=e.key==='ArrowUp'||e.key==='ArrowRight'?1:e.key==='ArrowDown'||e.key==='ArrowLeft'?-1:0;if(e.key==='Home'){e.preventDefault();set(0,true);return}if(e.key==='End'){e.preventDefault();set(11,true);return}if(d){e.preventDefault();touched=true;if(mode==='h'){var h=(H%12+d+12)%12;set(h,true)}else{M=(M+d*5+60)%60;tang=M*6;update();go();live.textContent=pad(H%12||12)+':'+pad(M)+' '+ap}}});
segs.forEach(function(b){b.addEventListener('click',function(){touched=true;switchMode(b.getAttribute('data-m'),true)})});aps.forEach(function(b){b.addEventListener('click',function(){touched=true;ap=b.getAttribute('data-ap');H=H%12+(ap==='PM'?12:0);update();live.textContent=pad(H%12||12)+':'+pad(M)+' '+ap})});
build();update();tang=H%12*30;ang=tang;place(ang);
var auto=setInterval(function(){if(touched||document.hidden||reduce)return;if(mode==='h'){H=(H+3)%24;ap=H>=12?'PM':'AM';tang=(H%12)*30;update();go();if(Math.random()<.5)setTimeout(function(){if(!touched)switchMode('m',true)},900)}else{M=(M+15)%60;tang=M*6;update();go();if(Math.random()<.5)setTimeout(function(){if(!touched)switchMode('h',true)},900)}},1800);})();`},

{id:'s-thermo-slider',title:'Temperature slider',component:'Temperature slider',key:'thermo-slider',family,width:640,
 description:'A thermometer slider whose mercury, colours and scene change together: frost and snow when cold, sun rays and heat shimmer when warm.',
 prompt:'Build a temperature control. A native input type=range (-10 to 40, step 1, aria-label "Temperature in degrees Celsius") drives a vertical thermometer drawn in SVG (a tube with a bulb and a mercury rectangle whose height and colour interpolate from blue at -10 to red at 40) and a large rolling number (old digits slide away, new digits arrive from the direction of change) with the unit. Beside it a scene card changes with the temperature: below 8 degrees a snowflake icon with 14 falling flakes (CSS animation) on an icy gradient; between 8 and 24 a calm mix with a soft sun and a cloud; above 24 a bright sun with rotating rays and a faint heat shimmer (an SVG feTurbulence displacement that animates its baseFrequency). The background gradient and the thermometer\'s glow interpolate smoothly (compute colours with hsl in JavaScript each time the value changes). Mercury level eases with a CSS transition. A caption names the feeling (Freezing, Cold, Mild, Warm, Hot) in an aria-live region. Dragging the slider thumb is the only interaction needed; the demo sweeps the value automatically until the visitor touches it. Reduced motion removes falling flakes, rotation and shimmer. Vanilla HTML, CSS and JavaScript.',
 css:`.th{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;padding:26px 24px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.th-left{display:grid;gap:14px;justify-items:center}
.th-svg{width:84px;height:270px;overflow:visible}
.th-tube{fill:var(--sc-bg);stroke:var(--sc-line);stroke-width:3}
.th-merc{transition:y .35s cubic-bezier(.3,.9,.3,1),height .35s cubic-bezier(.3,.9,.3,1),fill .3s}
.th-num{position:relative;display:flex;height:48px;overflow:hidden;font:900 42px/48px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.th-d{position:relative;display:inline-block;width:.6em;height:48px;overflow:hidden}
.th-d span{position:absolute;left:0;right:0;top:0;text-align:center;transition:transform .35s cubic-bezier(.3,.9,.3,1),opacity .35s}
.th-d.s{width:.4em}.th-unit{font:700 18px/48px system-ui;color:var(--sc-muted);margin-left:2px}
.th-rng{width:100%;accent-color:var(--sc-accent)}
.th-scene{position:relative;height:300px;border-radius:22px;overflow:hidden;background:var(--bg,#9bd);transition:background .3s;display:grid;place-items:center;color:#fff}
.th-snow,.th-sun{position:absolute;inset:0;transition:opacity .5s}
.th-flake{position:absolute;top:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#fff;opacity:.85;left:var(--x);animation:th-fall var(--d) linear infinite;animation-delay:var(--l)}
.th-rays{transform-origin:50% 50%;animation:th-spin 24s linear infinite}
.th-cap{position:absolute;left:0;right:0;bottom:14px;margin:0;text-align:center;font:800 22px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 2px 14px rgba(0,0,0,.35)}
@keyframes th-fall{to{transform:translateY(330px) translateX(24px)}}
@keyframes th-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.th-flake,.th-rays{animation:none}.th-merc,.th-d span{transition:none}}
@media (max-width:540px){.th{grid-template-columns:1fr}}`,
 html:`<div class="th"><div class="th-left"><svg class="th-svg" viewBox="0 0 84 270" aria-hidden="true"><defs><filter id="th-heat" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="turbulence" baseFrequency="0.01 0.04" numOctaves="2" result="t"><animate attributeName="baseFrequency" dur="3s" values="0.01 0.04;0.014 0.06;0.01 0.04" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="t" scale="0" id="th-disp"/></filter></defs><rect class="th-tube" x="30" y="6" width="24" height="214" rx="12"/><circle class="th-tube" cx="42" cy="228" r="30"/><rect class="th-merc" x="35" y="20" width="14" height="200" rx="7" fill="#4aa8ff"/><circle class="th-bulb" cx="42" cy="228" r="22" fill="#4aa8ff"/></svg><div class="th-num" aria-hidden="true"></div></div><div><div class="th-scene"><div class="th-snow"></div><div class="th-sun"><svg viewBox="-100 -100 200 200" style="width:100%;height:100%"><g class="th-rays"></g><circle r="44" fill="#ffe27a"/></svg></div><p class="th-cap" aria-live="polite"></p></div><input class="th-rng" type="range" min="-10" max="40" step="1" value="12" aria-label="Temperature in degrees Celsius"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.th'),rng=root.querySelector('.th-rng'),merc=root.querySelector('.th-merc'),bulb=root.querySelector('.th-bulb'),num=root.querySelector('.th-num'),scene=root.querySelector('.th-scene'),snow=root.querySelector('.th-snow'),sun=root.querySelector('.th-sun'),rays=root.querySelector('.th-rays'),cap=root.querySelector('.th-cap'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cur=null,touched=false,dir=1;
for(var i=0;i<14;i++){var f=document.createElement('i');f.className='th-flake';f.style.setProperty('--x',(Math.random()*96)+'%');f.style.setProperty('--s',(3+Math.random()*6)+'px');f.style.setProperty('--d',(3+Math.random()*4)+'s');f.style.setProperty('--l',(-Math.random()*6)+'s');snow.appendChild(f)}
for(var r=0;r<12;r++){var l=document.createElementNS(NS,'path');l.setAttribute('d','M0 -60 L8 -96 L-8 -96 Z');l.setAttribute('fill','#ffd24d');l.setAttribute('transform','rotate('+r*30+')');rays.appendChild(l)}
function slotsFor(str){return str.split('')}
function setNum(str){var slots=num.querySelectorAll('.th-d');if(slots.length!==str.length){num.textContent='';str.split('').forEach(function(ch){var d=document.createElement('span');d.className='th-d'+(ch==='-'?' s':'');var s=document.createElement('span');s.textContent=ch;d.appendChild(s);num.appendChild(d)});var u=document.createElement('span');u.className='th-unit';u.textContent='\\u00b0C';num.appendChild(u);return}
 slots.forEach(function(d,i){var c=d.lastElementChild;if(c.textContent===str.charAt(i))return;if(reduce){c.textContent=str.charAt(i);return}var n=document.createElement('span');n.textContent=str.charAt(i);n.style.transform='translateY('+(dir>0?'100%':'-100%')+')';n.style.opacity=0;d.appendChild(n);void n.offsetWidth;c.style.transform='translateY('+(dir>0?'-100%':'100%')+')';c.style.opacity=0;setTimeout(function(){c.remove()},380);n.style.transform='none';n.style.opacity=1})}
function mix(a,b,t){return a+(b-a)*t}
function update(){var v=+rng.value,t=(v+10)/50,h=mix(205,6,Math.pow(t,.9)),col='hsl('+h+' 88% 56%)';dir=cur===null||v>=cur?1:-1;cur=v;merc.setAttribute('y',String(220-Math.max(14,t*200)));merc.setAttribute('height',String(Math.max(14,t*200)));merc.setAttribute('fill',col);bulb.setAttribute('fill',col);
 var bg1='hsl('+mix(205,40,Math.min(1,t*1.3))+' 70% '+mix(58,66,t)+'%)',bg2='hsl('+mix(215,14,Math.min(1,t*1.2))+' 80% '+mix(34,52,t)+'%)';scene.style.background='linear-gradient(160deg,'+bg1+','+bg2+')';
 snow.style.opacity=v<10?Math.min(1,(10-v)/8):0;sun.style.opacity=v>18?Math.min(1,(v-18)/10):v>8?.15:0;sun.style.transform='scale('+(.7+Math.max(0,(v-10))/40*.5).toFixed(2)+')';
 var disp=document.getElementById('th-disp');if(disp)disp.setAttribute('scale',reduce?'0':String(Math.max(0,(v-26)/14*8).toFixed(1)));
 cap.textContent=v<=0?'Freezing':v<10?'Cold':v<20?'Mild':v<30?'Warm':'Hot';setNum(String(v))}
rng.addEventListener('input',function(){touched=true;update()});
var phase=0;setInterval(function(){if(touched||document.hidden||reduce)return;phase+=.05;rng.value=Math.round(15+22*Math.sin(phase));update()},120);update();})();`},

{id:'s-cart-flyer',title:'Add to cart',component:'Add to cart',key:'cart-flyer',family,width:780,
 description:'Add-to-bag buttons that morph into a tick while the product flies in an arc to the cart, which bumps its count and slides the item into its drawer.',
 prompt:'Build a small shop. Three product cards (generated thumbnail, name, price and an "Add to bag" button) sit on the left and a cart (bag icon with a count badge, and a drawer list under it) on the right. Clicking Add to bag: (1) the button morphs over 0.35s into a circle-sized pill with a tick icon (the label text collapses away) and returns after 1.4s; (2) a clone of the product thumbnail (position fixed at the thumbnail\'s rectangle) flies to the bag icon along a curved arc using the Web Animations API (two keyframe segments or an offset with a translate and a larger mid-point lift, 0.75s cubic-bezier(.5,0,.2,1)) while scaling to 0.25 and fading at the end; (3) the badge count bumps (scale 1.4 and back) and the drawer shows an item row that slides in from the right while existing rows shift down smoothly (FLIP: measure before/after and animate the delta); adding the same product again increases its quantity chip instead of adding a row. A total price rolls to the new value. The cart is a live region (aria-live polite) announcing the addition; buttons are real buttons. Reduced motion skips the flight and animations. Vanilla HTML, CSS and JavaScript.',
 css:`.ct3{position:relative;display:grid;grid-template-columns:1fr 250px;gap:18px;padding:20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ct3-list{display:grid;gap:10px}
.ct3-p{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid var(--sc-line);border-radius:20px;background:var(--sc-bg)}
.ct3-th{flex:none;width:64px;height:64px;border-radius:14px;background-size:cover;background-position:center}
.ct3-nm{flex:1;min-width:0}.ct3-nm b{display:block;font-size:16px}.ct3-nm span{font-size:13px;color:var(--sc-muted)}
.ct3-add{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 16px;border:0;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);cursor:pointer;font:700 14px/1 system-ui;overflow:hidden;transition:width .35s cubic-bezier(.3,.9,.3,1),background .3s;min-width:40px}
.ct3-add .t{transition:opacity .2s,max-width .35s;max-width:90px;white-space:nowrap}
.ct3-add svg{display:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.ct3-add.ok{background:#2fb87c;width:40px;padding:0}
.ct3-add.ok .t{opacity:0;max-width:0}.ct3-add.ok svg{display:block}
.ct3-cart{display:grid;align-content:start;gap:12px;padding:14px;border:1px solid var(--sc-line);border-radius:20px;background:var(--sc-bg)}
.ct3-top{display:flex;align-items:center;justify-content:space-between}
.ct3-bag{position:relative;width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:var(--sc-surface)}
.ct3-bag svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ct3-badge{position:absolute;right:-6px;top:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);font:800 12px/20px system-ui;text-align:center}
.ct3-rows{position:relative;display:grid;gap:8px;min-height:150px;align-content:start}
.ct3-row{display:flex;align-items:center;gap:10px;font-size:13px}
.ct3-row i{flex:none;width:34px;height:34px;border-radius:9px;background-size:cover;background-position:center}
.ct3-row span{flex:1}.ct3-row b{padding:2px 8px;border-radius:999px;background:var(--sc-ring);color:var(--sc-accent);font-size:12px}
.ct3-tot{display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--sc-line);font:800 16px/1 system-ui}
.ct3-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.ct3-fly{position:fixed;z-index:999;border-radius:14px;background-size:cover;pointer-events:none}
@media (max-width:620px){.ct3{grid-template-columns:1fr}}`,
 html:`<div class="ct3"><div class="ct3-list"></div><aside class="ct3-cart" aria-label="Shopping bag"><div class="ct3-top"><b>Your bag</b><span class="ct3-bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="ct3-badge">0</span></span></div><div class="ct3-rows"></div><div class="ct3-tot"><span>Total</span><span class="ct3-sum">$0</span></div></aside><p class="ct3-live" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ct3'),list=root.querySelector('.ct3-list'),rows=root.querySelector('.ct3-rows'),badge=root.querySelector('.ct3-badge'),bag=root.querySelector('.ct3-bag'),sum=root.querySelector('.ct3-sum'),live=root.querySelector('.ct3-live');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,prods=[['Field tote',64,2],['Studio cap',29,5],['Linen shirt',48,6]],cart={},count=0,total=0,touched=false,tickSvg='M5 12.5l4.5 4.5L19 7.5';
prods.forEach(function(p,i){var d=document.createElement('div');d.className='ct3-p';var th=document.createElement('div');th.className='ct3-th';th.style.backgroundImage='url('+artURL(p[2],128,128)+')';var nm=document.createElement('div');nm.className='ct3-nm';var b=document.createElement('b');b.textContent=p[0];var s=document.createElement('span');s.textContent='$'+p[1];nm.appendChild(b);nm.appendChild(s);var btn=document.createElement('button');btn.type='button';btn.className='ct3-add';var t=document.createElement('span');t.className='t';t.textContent='Add to bag';var sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('viewBox','0 0 24 24');sv.setAttribute('aria-hidden','true');var pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',tickSvg);sv.appendChild(pa);btn.appendChild(t);btn.appendChild(sv);btn.setAttribute('aria-label','Add '+p[0]+' to bag');d.appendChild(th);d.appendChild(nm);d.appendChild(btn);list.appendChild(d);btn.addEventListener('click',function(){touched=true;add(i,th,btn)})});
function rollSum(){sum.textContent='$'+total}
function add(i,th,btn){var p=prods[i];count++;total+=p[1];btn.classList.add('ok');setTimeout(function(){btn.classList.remove('ok')},1400);
 var rowsBefore=[].slice.call(rows.children).map(function(r){return [r,r.getBoundingClientRect().top]});var row=cart[i];
 if(row){row.q++;row.chip.textContent='x'+row.q}else{var el=document.createElement('div');el.className='ct3-row';var im=document.createElement('i');im.style.backgroundImage='url('+artURL(p[2],68,68)+')';var nm=document.createElement('span');nm.textContent=p[0];var chip=document.createElement('b');chip.textContent='x1';el.appendChild(im);el.appendChild(nm);el.appendChild(chip);rows.insertBefore(el,rows.firstChild);cart[i]={el:el,q:1,chip:chip};
  if(!reduce){el.animate([{transform:'translateX(30px)',opacity:0},{transform:'none',opacity:1}],{duration:450,delay:350,easing:'cubic-bezier(.3,.9,.3,1)',fill:'backwards'});rowsBefore.forEach(function(rb){var dy=rb[1]-rb[0].getBoundingClientRect().top;if(dy)rb[0].animate([{transform:'translateY('+dy+'px)'},{transform:'none'}],{duration:450,delay:350,easing:'cubic-bezier(.3,.9,.3,1)'})})}}
 badge.textContent=count;live.textContent=p[0]+' added. '+count+' items, total $'+total;rollSum();
 if(reduce)return;var a=th.getBoundingClientRect(),b=bag.getBoundingClientRect(),fly=document.createElement('div');fly.className='ct3-fly';fly.style.cssText+='left:'+a.left+'px;top:'+a.top+'px;width:'+a.width+'px;height:'+a.height+'px;background-image:'+th.style.backgroundImage;document.body.appendChild(fly);
 var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);var an=fly.animate([{transform:'translate(0,0) scale(1)',opacity:1,offset:0},{transform:'translate('+dx*.55+'px,'+(dy*.5-70)+'px) scale(.7)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.2)',opacity:.2,offset:1}],{duration:750,easing:'cubic-bezier(.5,0,.2,1)'});
 an.onfinish=function(){fly.remove();badge.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.3,1.5,.5,1)'});bag.animate([{transform:'rotate(0)'},{transform:'rotate(-10deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0)'}],{duration:400})}}
var n=0,auto=setInterval(function(){if(touched||document.hidden||!root.isConnected)return;var btn=list.querySelectorAll('.ct3-add')[n%3],th=list.querySelectorAll('.ct3-th')[n%3];add(n%3,th,btn);n++;if(n>6)clearInterval(auto)},1900);})();`},

{id:'s-confetti-shapes',title:'Morphing confetti',component:'Morphing confetti',key:'confetti-shapes',family,width:780,
 description:'Buttons that fire bursts of confetti whose pieces change shape as they fly, from squares to circles to stars, with three burst styles.',
 prompt:'Make a confetti stage with a full-size canvas overlay and three real buttons (Confetti, Sparks, Stars). Clicking a button fires a burst from the button\'s centre (read from getBoundingClientRect relative to the stage). Confetti: 90 pieces with random angle and speed (6-16 px/frame), gravity 0.28 and drag 0.985, spinning, each drawn as a superellipse path whose exponent morphs from 8 (a square) to 2 (a circle) over its first 60% of life; colours from a six colour palette. Sparks: 140 thin lines that stretch with speed and fade quickly with a bright white head. Stars: 40 five-point stars that grow then shrink (scale up to 1.6) and morph their inner radius ratio from 0.5 to 0.9 (star to roundish) as they fall. Particle count is capped at 900 and particles leaving the stage are removed. The buttons also scale 0.94 on press. Handle devicePixelRatio and resize, pause the loop when no particles remain, and for reduced motion fire a short single frame fade. Vanilla HTML, CSS and JavaScript.',
 css:`.cp3{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.cp3 canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cp3-row{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:0 20px}
.cp3-b{padding:14px 26px;border:0;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);cursor:pointer;font:800 16px/1 system-ui,-apple-system,"Segoe UI",sans-serif;transition:transform .2s cubic-bezier(.3,1.5,.5,1)}
.cp3-b:active{transform:scale(.94)}
.cp3-b:nth-child(2){background:var(--sc-fg);color:var(--sc-bg)}
.cp3-b:nth-child(3){background:#ff5fa8;color:#fff}`,
 html:`<div class="cp3"><canvas aria-hidden="true"></canvas><div class="cp3-row"><button class="cp3-b" type="button" data-k="confetti">Confetti</button><button class="cp3-b" type="button" data-k="sparks">Sparks</button><button class="cp3-b" type="button" data-k="stars">Stars</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cp3'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,P=[],raf=0,visible=true,cols=['#7c5cff','#ff5fa8','#ffb454','#2fd6a0','#38bdf8','#f5f5f7'];
function size(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
function fire(kind,x,y){var n=kind==='confetti'?90:kind==='sparks'?140:40;for(var i=0;i<n;i++){var a=Math.random()*6.283,s=kind==='sparks'?8+Math.random()*12:6+Math.random()*10;if(kind==='confetti')a=-Math.PI/2+(Math.random()-.5)*2.4;P.push({k:kind,x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(kind==='sparks'?0:3),r:Math.random()*6.283,vr:(Math.random()-.5)*.3,c:cols[i%6],s:5+Math.random()*7,life:0,max:kind==='sparks'?42+Math.random()*30:110+Math.random()*60})}if(P.length>900)P.splice(0,P.length-900);go()}
function star(c,r,ratio){c.beginPath();for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,rr=i%2?r*ratio:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath()}
function superellipse(c,r,n){c.beginPath();for(var i=0;i<=40;i++){var t=i/40*6.283,ct=Math.cos(t),st=Math.sin(t),x=Math.sign(ct)*Math.pow(Math.abs(ct),2/n)*r,y=Math.sign(st)*Math.pow(Math.abs(st),2/n)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()}
function frame(){raf=0;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 for(var i=P.length-1;i>=0;i--){var p=P[i];p.life++;var u=p.life/p.max;if(u>=1||p.y>H+30){P.splice(i,1);continue}
  if(p.k==='sparks'){p.vx*=.93;p.vy=p.vy*.93+.2;p.x+=p.vx;p.y+=p.vy;ctx.strokeStyle='hsla('+(40+u*20)+',100%,'+(90-u*40)+'%,'+(1-u)+')';ctx.lineWidth=2.2*(1-u)+.4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*1.6,p.y-p.vy*1.6);ctx.stroke();continue}
  p.vy+=.28;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.min(1,(1-u)*3);ctx.fillStyle=p.c;
  if(p.k==='confetti'){var e=8-6*Math.min(1,u/.6);superellipse(ctx,p.s,Math.max(2,e))}else{var sc=u<.4?1+.6*(u/.4):1.6-.6*((u-.4)/.6);ctx.scale(sc,sc);star(ctx,p.s*1.1,.5+.4*u)}ctx.fill();ctx.restore()}
 if(visible&&P.length)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.querySelectorAll('.cp3-b').forEach(function(b){b.addEventListener('click',function(){var r=b.getBoundingClientRect(),w=root.getBoundingClientRect();if(reduce){fire(b.getAttribute('data-k'),r.left-w.left+r.width/2,r.top-w.top+r.height/2);return}fire(b.getAttribute('data-k'),r.left-w.left+r.width/2,r.top-w.top+r.height/2)})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window)new ResizeObserver(function(){size()}).observe(cv);else size();size();
var seq=['confetti','stars','sparks'],n=0;var auto=setInterval(function(){if(!visible||document.hidden||reduce)return;var b=root.querySelectorAll('.cp3-b')[n%3],r=b.getBoundingClientRect(),w=root.getBoundingClientRect();fire(seq[n%3],r.left-w.left+r.width/2,r.top-w.top+r.height/2);n++},1800);root.addEventListener('pointerenter',function(){clearInterval(auto)});})();`},

{id:'s-paper-cut',title:'Paper cut layers',component:'Paper cut layers',key:'paper-cut',family,width:780,
 description:'A diorama of layered paper cut-outs whose hills, trees and sun rise in one after another, then sway and shift with the pointer.',
 prompt:'Build a paper-cut diorama in SVG (viewBox 780x420). Five to six layers (sky with a sun disc, far hills, mid hills, a row of cut pine trees, near hills and a foreground fringe of grass) are polygons with straight segments and slightly jagged edges (generate each ridge line from a seeded sum of sines sampled every 26px, rounded to whole pixels, then extended to the bottom). Every layer has a drop-shadow filter (feDropShadow with a few px offset and blur) so it looks like card stacked above the layer behind it, and a paper colour from a violet-to-warm palette that grows darker towards the front. On load (and on a Replay button) layers rise in one after another (translateY from 70px to 0 with opacity, 0.7s cubic-bezier(.3,.9,.3,1), 120ms apart) and the sun descends from above. Afterwards each layer sways gently (a slow sine translateX of 2-6px with different phases) and shifts opposite to the pointer by its depth (2px to 18px) with easing. Pause off-screen and for reduced motion show the finished static scene. Vanilla HTML, CSS and JavaScript.',
 css:`.pc4{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:#251a3f;overflow:hidden}
.pc4-svg{display:block;width:100%;height:auto}
.pc4-btn{position:absolute;right:14px;top:14px;padding:8px 16px;border:1px solid rgba(255,255,255,.4);border-radius:999px;background:rgba(20,10,40,.55);color:#fff;cursor:pointer;font-size:13px;font-weight:600}
.pc4-btn:hover{border-color:#fff}`,
 html:`<div class="pc4"><svg class="pc4-svg" viewBox="0 0 780 420" role="img" aria-label="A layered paper-cut landscape of hills, pines and a sun"><defs><filter id="pc4-sh" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="-5" stdDeviation="5" flood-color="#10061f" flood-opacity=".45"/></filter></defs><rect width="780" height="420" fill="#3b2a66"/><g class="pc4-g"></g></svg><button class="pc4-btn" type="button">Replay</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pc4'),g=root.querySelector('.pc4-g'),btn=root.querySelector('.pc4-btn'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],px=0,py=0,tx=0,ty=0,inside=false,raf=0,visible=true,start=0,seed=3;
function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
function ridge(base,amp,f,ph,jag,tree){var pts='0,420 ',x;for(x=-30;x<=810;x+=26){var y=base+Math.sin(x*f+ph)*amp+Math.sin(x*f*2.3+ph*2)*amp*.4+(rnd()-.5)*jag;pts+=Math.round(x)+','+Math.round(y)+' '}pts+='810,420';return pts}
function pines(base,col){var pts='-30,420 ',x=-20;while(x<800){var h=40+rnd()*44,w=12+rnd()*8;pts+=Math.round(x)+','+base+' '+Math.round(x+w*.2)+','+Math.round(base-h*.35)+' '+Math.round(x+w*.55)+','+Math.round(base-h*.35)+' '+Math.round(x+w*.1)+','+Math.round(base-h*.65)+' '+Math.round(x+w*.5)+','+Math.round(base-h*.65)+' '+Math.round(x+w*.9)+','+Math.round(base-h)+' '+Math.round(x+w*1.3)+','+Math.round(base-h*.65)+' '+Math.round(x+w*1.7)+','+Math.round(base-h*.65)+' '+Math.round(x+w*1.25)+','+Math.round(base-h*.35)+' '+Math.round(x+w*1.7)+','+Math.round(base-h*.35)+' '+Math.round(x+w*1.9)+','+base+' ';x+=w*2.2+rnd()*14}pts+='810,420';return pts}
function build(){g.textContent='';L=[];seed=3;var defs=[{c:'#5a3d93',depth:2,sway:2,pts:ridge(250,26,.012,1,10)},{c:'#7a4f9e',depth:5,sway:3,pts:ridge(290,22,.017,2,12)},{c:'#a35a9a',depth:8,sway:4,pts:ridge(325,18,.021,3,12)},{c:'#c9695f',depth:11,sway:5,pts:pines(350,'#c9695f')},{c:'#e08a52',depth:15,sway:5,pts:ridge(372,14,.026,4,12)},{c:'#f2b45b',depth:19,sway:6,pts:ridge(398,8,.05,5,10)}];
 var sunG=document.createElementNS(NS,'g');var sun=document.createElementNS(NS,'circle');sun.setAttribute('cx',560);sun.setAttribute('cy',130);sun.setAttribute('r',58);sun.setAttribute('fill','#ffd27a');sunG.appendChild(sun);g.appendChild(sunG);L.push({g:sunG,depth:1,sway:0,sun:true});
 defs.forEach(function(d,i){var gg=document.createElementNS(NS,'g');gg.setAttribute('filter','url(#pc4-sh)');var p=document.createElementNS(NS,'polygon');p.setAttribute('points',d.pts);p.setAttribute('fill',d.c);gg.appendChild(p);g.appendChild(gg);L.push({g:gg,depth:d.depth,sway:d.sway,ph:i*1.3,idx:i+1})});start=performance.now()}
function frame(now){raf=0;var t=(now-start)/1000;px+=(tx-px)*.08;py+=(ty-py)*.08;
 L.forEach(function(l,i){var u=reduce?1:Math.max(0,Math.min(1,(t-(l.sun?0:l.idx*.12))/.7)),e=1-Math.pow(1-u,3),rise=l.sun?-120*(1-e):70*(1-e),sway=reduce||l.sun?0:Math.sin(t*.6+l.ph)*l.sway;l.g.setAttribute('transform','translate('+(sway-px*l.depth).toFixed(2)+' '+(rise-py*l.depth*.4).toFixed(2)+')');l.g.style.opacity=u})
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;inside=true});root.addEventListener('pointerleave',function(){tx=ty=0});
btn.addEventListener('click',function(){build();if(reduce)frame(start+5000);go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)go()}).observe(root);
build();if(reduce)frame(start+5000);else go();})();`}
];
