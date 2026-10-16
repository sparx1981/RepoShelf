// Original 3D and interactive cards: payment card, depth card, page flip, peel sticker, loaders, chart, hover preview, physics pile.
import {ART} from './art-boot.mjs';
const family='3D & galleries';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const galleryC=[
{id:'s-credit-card',title:'Tilting credit card',component:'Tilting credit card',key:'credit-card',family,width:560,
 description:'A payment card that tilts in 3D with a moving glare and a holographic foil, and flips to show its back.',
 prompt:'Build a 340x214px payment card (use obviously fake details such as "•••• •••• •••• 4821" and a generic name). The wrapper has perspective(1000px); the card rotates up to 14 degrees on X and Y towards the pointer using eased values from requestAnimationFrame, and returns to rest on leave. Front: violet-to-pink gradient, an SVG chip, a contactless symbol, number, name, expiry, and two overlays that follow the pointer: a radial glare (white) and a holographic conic-gradient foil with mix-blend-mode: overlay whose angle shifts with the pointer. Back: a black magnetic stripe, a signature panel and a masked CVV. A real "Flip card" button (aria-pressed) and a click on the card toggle a 0.8s rotateY(180deg) flip using transform-style: preserve-3d and backface-visibility: hidden. Reduced motion removes tilt easing and flip animation. Vanilla HTML, CSS and JavaScript.',
 css:`.cr{display:grid;gap:20px;justify-items:center;padding:44px 20px 30px;border:1px solid var(--sc-line);border-radius:28px;background:radial-gradient(ellipse at 50% 30%,var(--sc-ring),transparent 70%),var(--sc-surface)}
.cr-wrap{perspective:1000px}
.cr-card{position:relative;width:min(340px,86vw);aspect-ratio:340/214;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(calc(var(--ry,0deg) + var(--flip,0deg)));transition:--flip .8s cubic-bezier(.3,.8,.2,1);cursor:pointer}
@property --flip{syntax:'<angle>';inherits:true;initial-value:0deg}
.cr-card.is-back{--flip:180deg}
.cr-face{position:absolute;inset:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;box-shadow:0 30px 50px -22px rgba(30,10,80,.6),inset 0 0 0 1px rgba(255,255,255,.2)}
.cr-front{background:linear-gradient(135deg,#5b3dff,#b542ff 55%,#ff5fa8);color:#fff;padding:20px 24px}
.cr-back{background:linear-gradient(135deg,#2a2a3a,#14141c);transform:rotateY(180deg);color:#fff}
.cr-glare{position:absolute;inset:0;background:radial-gradient(circle at var(--gx,30%) var(--gy,20%),rgba(255,255,255,.55),transparent 45%);mix-blend-mode:soft-light;pointer-events:none}
.cr-foil{position:absolute;inset:0;background:conic-gradient(from var(--ga,0deg) at 50% 50%,#ff6ad5,#ffd36a,#6aff9a,#6ad8ff,#a06aff,#ff6ad5);mix-blend-mode:overlay;opacity:.35;pointer-events:none}
.cr-chip{width:44px;height:34px;border-radius:7px;background:linear-gradient(135deg,#ffe9a8,#d9a441);margin-top:40px;position:relative}
.cr-chip::after{content:"";position:absolute;inset:6px 10px;border:1px solid rgba(90,60,0,.5);border-radius:3px}
.cr-nfc{position:absolute;right:22px;top:22px;width:26px;height:26px;opacity:.9}
.cr-num{position:absolute;left:24px;right:24px;bottom:62px;font:600 20px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.cr-row{position:absolute;left:24px;right:24px;bottom:22px;display:flex;justify-content:space-between;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}
.cr-brand{position:absolute;left:24px;top:22px;font:800 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.06em}
.cr-stripe{height:44px;margin-top:26px;background:#05050a}
.cr-sign{margin:22px 24px 0;display:flex;align-items:center;gap:10px}
.cr-sign i{flex:1;height:34px;border-radius:4px;background:repeating-linear-gradient(135deg,#f4f1ea 0 6px,#e6e2d8 6px 12px)}
.cr-sign b{padding:8px 12px;border-radius:4px;background:#fff;color:#111;font:700 13px/1 ui-monospace,monospace;letter-spacing:.2em}
.cr-fine{position:absolute;left:24px;right:24px;bottom:20px;margin:0;font-size:9px;opacity:.6;line-height:1.4}
.cr-btn{padding:9px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600}
.cr-btn:hover,.cr-btn[aria-pressed=true]{border-color:var(--sc-accent)}
@media (prefers-reduced-motion:reduce){.cr-card{transition:none}}`,
 html:`<div class="cr"><div class="cr-wrap"><div class="cr-card"><div class="cr-face cr-front"><span class="cr-brand">ARCHIVE BANK</span><svg class="cr-nfc" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 7c3 3 3 7 0 10M11 5c4.5 4 4.5 10 0 14M15 3c6 5 6 13 0 18"/></svg><div class="cr-chip"></div><div class="cr-num">•••• •••• •••• 4821</div><div class="cr-row"><span>Alex Morgan</span><span>09/28</span></div><i class="cr-foil"></i><i class="cr-glare"></i></div><div class="cr-face cr-back"><div class="cr-stripe"></div><div class="cr-sign"><i></i><b>•••</b></div><p class="cr-fine">Sample card for demonstration only. Not a real account.</p><i class="cr-glare"></i></div></div></div><button class="cr-btn" type="button" aria-pressed="false">Flip card</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cr'),card=root.querySelector('.cr-card'),btn=root.querySelector('.cr-btn'),wrap=root.querySelector('.cr-wrap');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,rx=0,ry=0,tx=0,ty=0,gx=30,gy=20,raf=0,back=false;
function frame(){raf=0;rx+=(tx-rx)*(reduce?1:.12);ry+=(ty-ry)*(reduce?1:.12);card.style.setProperty('--rx',rx.toFixed(2)+'deg');card.style.setProperty('--ry',ry.toFixed(2)+'deg');card.style.setProperty('--ga',(ry*8+rx*4).toFixed(1)+'deg');
 card.querySelectorAll('.cr-glare').forEach(function(g){g.style.setProperty('--gx',gx+'%');g.style.setProperty('--gy',gy+'%')});if(Math.abs(tx-rx)>.02||Math.abs(ty-ry)>.02)raf=requestAnimationFrame(frame)}
function kick(){if(!raf)raf=requestAnimationFrame(frame)}
wrap.addEventListener('pointermove',function(e){var r=wrap.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height;ty=(nx-.5)*28*(back?-1:1);tx=(.5-ny)*28;gx=nx*100;gy=ny*100;kick()});
wrap.addEventListener('pointerleave',function(){tx=ty=0;gx=30;gy=20;kick()});
function flip(){back=!back;card.classList.toggle('is-back',back);btn.setAttribute('aria-pressed',String(back))}
card.addEventListener('click',flip);btn.addEventListener('click',flip);})();`},

{id:'s-depth-card',title:'Depth card',component:'Depth card',key:'depth-card',family,width:560,
 description:'A layered card (sky, mountains, pines and type) whose layers drift at different speeds as the cursor moves.',
 prompt:'Make a 320x420px card built from five stacked layers drawn on canvases at start-up: a sky with sun (the generated landscape), two ranges of hills on transparent canvases, a row of pine-tree silhouettes in the foreground, and the title as real HTML text. Each layer is translated opposite to the pointer by its own depth (sky 6px, far hills 14px, near hills 24px, pines 38px, text 54px) using eased values from requestAnimationFrame, and the whole card tilts up to 10 degrees with perspective(900px), with a soft shadow that shifts. Layers are slightly oversized (inset -40px) so edges never show. When the pointer is away the pointer follows a slow Lissajous path. Pause off-screen, no idle drift for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.dp{display:grid;place-items:center;padding:34px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.dp-card{position:relative;width:320px;height:420px;border-radius:24px;overflow:hidden;background:#111;transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));box-shadow:calc(var(--ry,0deg)*-2px) 34px 50px -26px rgba(0,0,0,.65);will-change:transform}
.dp-l{position:absolute;left:-40px;right:-40px;top:-40px;bottom:-40px;will-change:transform;pointer-events:none}
.dp-l canvas{display:block;width:100%;height:100%}
.dp-txt{position:absolute;left:0;right:0;bottom:32px;text-align:center;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.5)}
.dp-txt strong{display:block;font:800 34px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em}
.dp-txt span{display:block;margin-top:8px;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.24em;text-transform:uppercase;opacity:.85}`,
 html:`<div class="dp"><div class="dp-card" role="img" aria-label="A layered mountain landscape card titled Highlands"><div class="dp-l" data-d="6"></div><div class="dp-l" data-d="14"></div><div class="dp-l" data-d="24"></div><div class="dp-l" data-d="38"></div><div class="dp-l" data-d="54"><div class="dp-txt"><strong>Highlands</strong><span>Where the light lands</span></div></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.dp'),card=root.querySelector('.dp-card'),layers=[].slice.call(card.querySelectorAll('.dp-l'));
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=400,H=500,x=0,y=0,tx=0,ty=0,inside=false,raf=0,visible=true;
function cvs(){var c=document.createElement('canvas');c.width=W;c.height=H;return c}
function hills(col1,col2,y0,amp,seed){var c=cvs(),g=c.getContext('2d'),gr=g.createLinearGradient(0,y0-amp,0,H);gr.addColorStop(0,col1);gr.addColorStop(1,col2);g.fillStyle=gr;g.beginPath();g.moveTo(0,H);for(var px=0;px<=W+4;px+=4){var t=px/W;g.lineTo(px,y0+Math.sin(t*3.2+seed)*amp+Math.sin(t*7.5+seed*2)*amp*.4+Math.sin(t*15+seed*3)*amp*.12)}g.lineTo(W,H);g.closePath();g.fill();return c}
function pines(){var c=cvs(),g=c.getContext('2d');g.fillStyle='#07101a';for(var i=0;i<14;i++){var bx=i*30-10+((i*37)%11),h=70+((i*53)%60),base=H-10+((i*19)%14);for(var k=0;k<4;k++){var w=26-k*5,yy=base-h+k*h*.22;g.beginPath();g.moveTo(bx,yy-h*.22);g.lineTo(bx+w,yy+h*.25);g.lineTo(bx-w,yy+h*.25);g.closePath();g.fill()}g.fillRect(bx-2,base-h*.1,4,h*.14)}g.fillRect(0,H-26,W,26);return c}
var sky=art(2,W,H),ctxs=[sky,hills('#a8472f','#3a1624',H*.62,26,1.3),hills('#5c2236','#1a0b1e',H*.74,22,3.1),pines()];
layers.forEach(function(l,i){if(ctxs[i])l.appendChild(ctxs[i])});
function frame(now){raf=0;var t=now/1000;if(!inside&&!reduce){tx=Math.sin(t*.7)*.6;ty=Math.cos(t*.5)*.5}x+=(tx-x)*.1;y+=(ty-y)*.1;
 card.style.setProperty('--ry',(x*10).toFixed(2)+'deg');card.style.setProperty('--rx',(-y*10).toFixed(2)+'deg');layers.forEach(function(l){var d=+l.getAttribute('data-d');l.style.transform='translate('+(-x*d).toFixed(2)+'px,'+(-y*d*.7).toFixed(2)+'px)'});
 if(visible&&(!reduce||Math.abs(tx-x)>.01||Math.abs(ty-y)>.01))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect();inside=true;tx=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));ty=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height-.5)*2));go()});
root.addEventListener('pointerleave',function(){inside=false;if(reduce){tx=ty=0}go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-page-flip',title:'Page flip book',component:'Page flip book',key:'page-flip',family,width:760,
 description:'A book whose pages turn in 3D; click a page edge or drag it across, with shading that follows the fold.',
 prompt:'Create a two-page book spread (each page 300x400px) from three double-sided sheets. Each sheet is a transform-style: preserve-3d element positioned on the right half with transform-origin: left centre and rotateY(var(--a)); its front face is a right-hand page and its back face (rotated 180 degrees, backface-visibility hidden) is the next left-hand page. Sheets stack with z-index so unturned sheets are ordered from the first at the top, turned ones the opposite way. Clicking the right page turns forward (0 to -180deg over 0.9s), clicking the left page turns back, and dragging a page edge follows the pointer: the angle comes from the horizontal position relative to the spine, releasing past 90 degrees completes the turn otherwise it returns. While turning, a gradient overlay darkens the page in proportion to sin(angle) so the fold looks curved. Pages hold generated landscape plates, a heading and a line of copy. Previous/Next buttons and ArrowLeft/ArrowRight keys turn pages. Reduced motion turns instantly. Vanilla HTML, CSS and JavaScript.',
 css:`.pf{display:grid;gap:18px;justify-items:center;padding:34px 20px 24px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.pf-book{position:relative;width:min(100%,600px);height:400px;perspective:1800px;user-select:none;touch-action:pan-y}
.pf-sheet{position:absolute;top:0;left:50%;width:50%;height:100%;transform-origin:0 50%;transform-style:preserve-3d;transform:rotateY(var(--a,0deg))}
.pf-page{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;background:#fbf8f1;color:#2a2622;border-radius:0 10px 10px 0;box-shadow:inset 8px 0 14px -10px rgba(0,0,0,.35),0 10px 24px -14px rgba(0,0,0,.4);cursor:pointer}
.pf-page.b{transform:rotateY(180deg);border-radius:10px 0 0 10px;box-shadow:inset -8px 0 14px -10px rgba(0,0,0,.35),0 10px 24px -14px rgba(0,0,0,.4)}
.pf-art{height:62%;background-size:cover;background-position:center}
.pf-copy{padding:16px 20px}
.pf-copy h3{margin:0 0 6px;font:800 20px/1.1 Georgia,"Times New Roman",serif}
.pf-copy p{margin:0;font:14px/1.5 Georgia,"Times New Roman",serif;color:#5b554d}
.pf-num{position:absolute;bottom:10px;font:600 11px/1 ui-monospace,monospace;color:#8f877b}
.pf-page:not(.b) .pf-num{right:16px}.pf-page.b .pf-num{left:16px}
.pf-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.5),transparent 70%);opacity:var(--sh,0)}
.pf-page.b .pf-shade{background:linear-gradient(270deg,rgba(0,0,0,.5),transparent 70%)}
.pf-empty{position:absolute;left:0;top:0;width:50%;height:100%;border-radius:10px 0 0 10px;background:rgba(0,0,0,.06);box-shadow:inset -6px 0 12px -8px rgba(0,0,0,.25)}
.pf-bar{display:flex;gap:10px;align-items:center}
.pf-btn{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.pf-btn:hover{border-color:var(--sc-accent)}
.pf-btn:disabled{opacity:.4;cursor:default}
.pf-st{min-width:5em;text-align:center;font:600 12px/1 ui-monospace,monospace;color:var(--sc-muted)}`,
 html:`<div class="pf" role="group" aria-label="Book" tabindex="0"><div class="pf-book"><div class="pf-empty"></div></div><div class="pf-bar"><button class="pf-btn" type="button" data-d="-1">Previous</button><span class="pf-st" aria-live="polite"></span><button class="pf-btn" type="button" data-d="1">Next</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pf'),book=root.querySelector('.pf-book'),st=root.querySelector('.pf-st'),bp=root.querySelectorAll('.pf-btn');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=3,sheets=[],turned=0,drag=null,copy=['Long shadows fall where the day gives up.','Water keeps the colour of the sky it borrows.','Every ridge is a horizon for someone below.','Night arrives in layers, slowly and then at once.','Mint light before the market opens.','The last page is only the first, turned over.'];
function page(i,back){var p=document.createElement('div');p.className='pf-page'+(back?' b':'');var a=document.createElement('div');a.className='pf-art';a.style.backgroundImage='url('+artURL(i,300,250)+')';var c=document.createElement('div');c.className='pf-copy';var h=document.createElement('h3');h.textContent=NAMES[i%8];var t=document.createElement('p');t.textContent=copy[i%6];c.appendChild(h);c.appendChild(t);var n=document.createElement('span');n.className='pf-num';n.textContent=i+1;var s=document.createElement('i');s.className='pf-shade';p.appendChild(a);p.appendChild(c);p.appendChild(n);p.appendChild(s);return p}
for(var i=0;i<N;i++){var sh=document.createElement('div');sh.className='pf-sheet';var f=page(i*2,false),b=page(i*2+1,true);sh.appendChild(f);sh.appendChild(b);book.appendChild(sh);sheets.push({el:sh,a:0,t:0,f:f,b:b});(function(k){f.addEventListener('click',function(){if(!drag||!drag.moved)turn(1)});b.addEventListener('click',function(){if(!drag||!drag.moved)turn(-1)})})(i)}
function z(){sheets.forEach(function(s,i){s.el.style.zIndex=i<turned?i+1:N-i+10})}
function paint(s){s.el.style.setProperty('--a',s.a.toFixed(2)+'deg');var sh=Math.sin(Math.min(180,Math.max(0,-s.a))/180*Math.PI);s.f.style.setProperty('--sh',(sh*.8).toFixed(2));s.b.style.setProperty('--sh',(sh*.8).toFixed(2))}
function anim(){var moving=false;sheets.forEach(function(s){if(Math.abs(s.t-s.a)>.2){moving=true;s.a+=(s.t-s.a)*(reduce?1:.12)}else s.a=s.t;paint(s)});if(moving||drag)requestAnimationFrame(anim)}
function turn(d){var n=Math.max(0,Math.min(N,turned+d));if(n===turned)return;if(d>0)sheets[turned].t=-180;else sheets[n].t=0;turned=n;z();ui();anim()}
function ui(){bp[0].disabled=turned===0;bp[1].disabled=turned===N;st.textContent=turned===0?'Cover':turned===N?'The end':(turned*2)+' – '+(turned*2+1)}
bp.forEach(function(b){b.addEventListener('click',function(){turn(+b.getAttribute('data-d'))})});
root.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();turn(1)}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}});
book.addEventListener('pointerdown',function(e){var r=book.getBoundingClientRect(),right=e.clientX>r.left+r.width/2,k=right?turned:turned-1;if(k<0||k>=N)return;drag={k:k,r:r,x:e.clientX,moved:false,from:right?0:-180};try{book.setPointerCapture(e.pointerId)}catch(_){}});
book.addEventListener('pointermove',function(e){if(!drag)return;if(Math.abs(e.clientX-drag.x)>6)drag.moved=true;if(!drag.moved)return;var mid=drag.r.left+drag.r.width/2,half=drag.r.width/2,a=-Math.max(0,Math.min(180,(1-(e.clientX-(mid-half))/(2*half))*180));var s=sheets[drag.k];s.a=a;s.t=a;paint(s);sheets.forEach(function(q,i){q.el.style.zIndex=i===drag.k?50:q.el.style.zIndex})});
function up(){if(!drag)return;var d=drag;drag=null;if(d.moved){var s=sheets[d.k],go=s.a<-90;s.t=go?-180:0;turned=go?d.k+1:d.k;z();ui();anim()}}
book.addEventListener('pointerup',up);book.addEventListener('pointercancel',up);z();ui();sheets.forEach(paint);})();`},

{id:'s-peel-sticker',title:'Peel sticker',component:'Peel sticker',key:'peel-sticker',family,width:560,
 description:'A sticker whose corner you can lift and fold back with real shading; pull far enough and it comes away.',
 prompt:'Build a 230px square sticker (generated artwork with a bold caption) that can be peeled from its bottom-right corner. Peeling is a diagonal fold: with side S and a fold position c between S and 2S, the visible part of the sticker is the polygon {x + y <= c} clipped to the square, and the folded flap is the triangle (S, c-S), (c-S, S), (c-S, c-S) showing the paper back in an off-white with a gradient shadow. Implement with two layers using clip-path: polygon(); update c from the pointer: when dragging from the corner, c = S + (px + py)/2 clamped to [S + 12, 2S]. Release springs c back to 2S (with a rAF ease) unless it was pulled past 1.45*S, in which case the sticker lifts off (translate and rotate away, fade) and a "Stick it back" button (real button) restores it. Add a subtle drop shadow and a paper backing outline. The corner shows a small affordance (a curled highlight). The sticker has role="img". Reduced motion jumps instead of easing. Vanilla HTML, CSS and JavaScript.',
 css:`.ps2{display:grid;gap:18px;justify-items:center;padding:44px 20px 26px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ps2-sheet{position:relative;width:250px;height:250px;padding:10px;border-radius:14px;background:repeating-linear-gradient(135deg,var(--sc-surface) 0 8px,var(--sc-bg) 8px 16px);border:1px dashed var(--sc-line)}
.ps2-s{position:absolute;left:10px;top:10px;width:230px;height:230px;transition:transform .6s cubic-bezier(.4,0,.2,1),opacity .5s}
.ps2-s.off{transform:translate(70px,-90px) rotate(24deg);opacity:0;pointer-events:none}
.ps2-main,.ps2-fold{position:absolute;inset:0}
.ps2-main{background-size:cover;background-position:center;border-radius:16px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.3))}
.ps2-cap{position:absolute;left:16px;top:16px;color:#fff;font:900 30px/.95 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;text-shadow:0 2px 10px rgba(0,0,0,.4);pointer-events:none}
.ps2-fold{background:linear-gradient(135deg,#fffdf6 0%,#e8e2d2 100%);filter:drop-shadow(-4px -4px 7px rgba(0,0,0,.35));cursor:grab}
.ps2-hit{position:absolute;right:0;bottom:0;width:70px;height:70px;cursor:grab;touch-action:none;z-index:5}
.ps2-btn{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.ps2-btn:hover{border-color:var(--sc-accent)}
.ps2-btn[hidden]{display:none}
.ps2-note{margin:0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sc-muted)}`,
 html:`<div class="ps2"><div class="ps2-sheet"><div class="ps2-s" role="img" aria-label="A peelable sticker that reads Hello, world"><div class="ps2-main"></div><div class="ps2-fold"></div><div class="ps2-cap">Hello,<br>world</div><div class="ps2-hit"></div></div></div><p class="ps2-note">Drag the corner to peel</p><button class="ps2-btn" type="button" hidden>Stick it back</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ps2'),s=root.querySelector('.ps2-s'),main=root.querySelector('.ps2-main'),fold=root.querySelector('.ps2-fold'),hit=root.querySelector('.ps2-hit'),btn=root.querySelector('.ps2-btn');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,S=230,c=2*S,tc=2*S,drag=false,raf=0;main.style.backgroundImage='url('+artURL(5,230,230)+')';
function poly(c){var a=c-S;if(c>=2*S-.5)return {m:'none',f:'polygon(0 0,0 0,0 0)'};return {m:'polygon(0 0,'+S+'px 0,'+S+'px '+a+'px,'+a+'px '+S+'px,0 '+S+'px)',f:'polygon('+S+'px '+a+'px,'+a+'px '+S+'px,'+a+'px '+a+'px)'}}
function paint(){var p=poly(c);main.style.clipPath=p.m==='none'?'none':p.m;fold.style.clipPath=p.f;fold.style.display=c>=2*S-.5?'none':'block'}
function frame(){raf=0;if(drag){c=tc}else{c+=(tc-c)*(reduce?1:.18);if(Math.abs(tc-c)<.3)c=tc}paint();if(drag||c!==tc)raf=requestAnimationFrame(frame)}
function kick(){if(!raf)raf=requestAnimationFrame(frame)}
hit.addEventListener('pointerdown',function(e){drag=true;try{hit.setPointerCapture(e.pointerId)}catch(_){}kick()});
hit.addEventListener('pointermove',function(e){if(!drag)return;var r=s.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;tc=Math.max(S+12,Math.min(2*S,S+(px+py)/2));c=tc});
function up(){if(!drag)return;drag=false;if(c<1.45*S){s.classList.add('off');btn.hidden=false;tc=2*S;c=2*S;paint()}else tc=2*S;kick()}
hit.addEventListener('pointerup',up);hit.addEventListener('pointercancel',up);
btn.addEventListener('click',function(){s.classList.remove('off');btn.hidden=true});
paint();})();`},

{id:'s-loader-set',title:'Loading screens',component:'Loading screens',key:'loader-set',family,width:820,
 description:'Five distinct loading animations in one set: counting ring, equaliser bars, orbit, wipe text and a curtain reveal.',
 prompt:'Create a set of five preloaders in a responsive grid of cards, each with a label. (1) A progress ring: an SVG circle whose stroke-dashoffset follows a counter that eases from 0 to 100 percent over 3s with the number in the middle, then pauses and restarts. (2) Equaliser bars: five rounded bars scaling on Y with staggered keyframes. (3) Orbit: three dots circling a centre at different radii and speeds with a glow. (4) Wipe text: the word LOADING drawn twice (outline and filled) where the filled copy is revealed from left to right by an animated clip-path, with three dots that blink. (5) Curtain: two panels slide apart to reveal a check mark that scales in, then close again. A "Restart all" button resets every animation by toggling a class and forcing a reflow. Everything honours prefers-reduced-motion by showing a static end state; use aria-hidden on decoration and role="status" with an aria-label on each loader. Vanilla HTML, CSS and JavaScript.',
 css:`.ld{display:grid;gap:16px;justify-items:center}
.ld-grid{width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ld-cell{display:grid;gap:12px;justify-items:center;align-content:center;height:190px;border:1px solid var(--sc-line);border-radius:22px;background:var(--sc-surface);padding:14px}
.ld-cell small{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--sc-muted)}
.ld-ring{position:relative;width:90px;height:90px}
.ld-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ld-ring circle{fill:none;stroke-width:6;stroke-linecap:round}
.ld-ring .t{stroke:var(--sc-line)}.ld-ring .v{stroke:var(--sc-accent);stroke-dasharray:264;stroke-dashoffset:264}
.ld-ring b{position:absolute;inset:0;display:grid;place-items:center;font:700 18px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
.ld-bars{display:flex;align-items:center;gap:6px;height:70px}
.ld-bars i{width:8px;height:100%;border-radius:4px;background:var(--sc-accent);transform-origin:50% 50%;animation:ld-eq 1s ease-in-out infinite;animation-delay:calc(var(--i)*-.17s)}
.ld-orbit{position:relative;width:90px;height:90px}
.ld-orbit i{position:absolute;left:50%;top:50%;border-radius:50%;background:var(--sc-accent);box-shadow:0 0 14px var(--sc-accent);animation:ld-spin var(--d) linear infinite}
.ld-orbit i:nth-child(1){width:12px;height:12px;margin:-6px;--d:1.2s;--r:36px}
.ld-orbit i:nth-child(2){width:9px;height:9px;margin:-4.5px;--d:1.9s;--r:24px;opacity:.8}
.ld-orbit i:nth-child(3){width:7px;height:7px;margin:-3.5px;--d:2.6s;--r:12px;opacity:.6}
.ld-wipe{position:relative;font:900 26px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.06em}
.ld-wipe span{display:block;color:transparent;-webkit-text-stroke:1.4px var(--sc-muted)}
.ld-wipe span+span{position:absolute;left:0;top:0;color:var(--sc-fg);-webkit-text-stroke:0;clip-path:inset(0 100% 0 0);animation:ld-wipe 2.4s cubic-bezier(.6,0,.3,1) infinite}
.ld-dots b{display:inline-block;width:6px;height:6px;margin:0 3px;border-radius:50%;background:var(--sc-accent);animation:ld-blink 1.2s infinite;animation-delay:calc(var(--i)*.18s)}
.ld-curtain{position:relative;width:110px;height:78px;border-radius:12px;overflow:hidden;background:var(--sc-bg);border:1px solid var(--sc-line);display:grid;place-items:center}
.ld-curtain svg{width:34px;height:34px;fill:none;stroke:var(--sc-accent);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;animation:ld-check 3s ease infinite}
.ld-curtain i{position:absolute;top:0;bottom:0;width:51%;background:var(--sc-accent);animation:ld-open 3s cubic-bezier(.7,0,.3,1) infinite}
.ld-curtain i:first-child{left:0}.ld-curtain i:last-child{right:0;--s:1}
.ld.rs *{animation:none!important}
.ld-btn{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.ld-btn:hover{border-color:var(--sc-accent)}
@keyframes ld-eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes ld-spin{from{transform:rotate(0) translateX(var(--r))}to{transform:rotate(360deg) translateX(var(--r))}}
@keyframes ld-wipe{0%{clip-path:inset(0 100% 0 0)}60%,85%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 100%)}}
@keyframes ld-blink{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes ld-open{0%,15%{transform:translateX(0)}45%,70%{transform:translateX(var(--o,-102%))}100%{transform:translateX(0)}}
.ld-curtain i:last-child{--o:102%}
@keyframes ld-check{0%,30%{transform:scale(0);opacity:0}50%,70%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}
@media (prefers-reduced-motion:reduce){.ld-wipe span+span{clip-path:none}.ld-curtain i{display:none}.ld-curtain svg{transform:none;opacity:1}}`,
 html:`<div class="ld"><div class="ld-grid"><div class="ld-cell"><div class="ld-ring" role="status" aria-label="Loading, progress ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="t" cx="50" cy="50" r="42"/><circle class="v" cx="50" cy="50" r="42"/></svg><b>0%</b></div><small>Ring</small></div><div class="ld-cell"><div class="ld-bars" role="status" aria-label="Loading, equaliser"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i></div><small>Bars</small></div><div class="ld-cell"><div class="ld-orbit" role="status" aria-label="Loading, orbit"><i></i><i></i><i></i></div><small>Orbit</small></div><div class="ld-cell"><div role="status" aria-label="Loading, wipe text"><div class="ld-wipe" aria-hidden="true"><span>LOADING</span><span>LOADING</span></div><div class="ld-dots" aria-hidden="true" style="text-align:center;margin-top:8px"><b style="--i:0"></b><b style="--i:1"></b><b style="--i:2"></b></div></div><small>Wipe</small></div><div class="ld-cell"><div class="ld-curtain" role="status" aria-label="Loading, curtain"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><i></i><i></i></div><small>Curtain</small></div></div><button class="ld-btn" type="button">Restart all</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ld'),ring=root.querySelector('.ld-ring .v'),num=root.querySelector('.ld-ring b'),btn=root.querySelector('.ld-btn');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,t0=0,raf=0,visible=true;
function ease(x){return 1-Math.pow(1-x,3)}
function setP(p){ring.style.strokeDashoffset=(264*(1-p)).toFixed(1);num.textContent=Math.round(p*100)+'%'}
function frame(now){raf=0;var t=(now-t0)%4200,p=t<3000?ease(t/3000):1;setP(p);if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function start(){t0=performance.now();if(reduce){setP(1);return}if(!raf)raf=requestAnimationFrame(frame)}
btn.addEventListener('click',function(){root.classList.add('rs');void root.offsetWidth;root.classList.remove('rs');start()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)start()}).observe(root);start();})();`},

{id:'s-line-graph',title:'Smooth line graph',component:'Smooth line graph',key:'line-graph',family,width:780,
 description:'A smooth animated line chart with gradient area, range switching that morphs between datasets and a scrubbing tooltip.',
 prompt:'Build a chart card. Header: a metric label, a large value that follows the hovered point (or the latest value) and a delta chip. Chart: an SVG (viewBox 640x240) with three datasets for 7D, 30D and 90D (deterministic generated series), drawn as a smooth path using Catmull-Rom to cubic Bezier conversion, a gradient area under it, three faint horizontal grid lines with value labels and a draw-on animation using stroke-dasharray and pathLength=1 when the card scrolls into view. Range buttons (aria-pressed) morph between the datasets by tweening the points over 600ms. Hovering or dragging scrubs a vertical guide, dot and tooltip showing value and a date label; keyboard: the SVG is focusable and ArrowLeft/ArrowRight move the point, with the value announced in an aria-live region. Colours follow the theme tokens, reduced motion skips tweening and the draw-on animation. Vanilla HTML, CSS and JavaScript.',
 css:`.lg{display:grid;gap:14px;padding:22px 22px 16px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.lg-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}
.lg-label{margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--sc-muted)}
.lg-val{margin:6px 0 0;font:800 38px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.lg-delta{display:inline-block;margin-left:10px;padding:4px 10px;border-radius:999px;font:700 13px/1 system-ui;background:var(--sc-ring);color:var(--sc-accent);vertical-align:middle;letter-spacing:0}
.lg-tabs{display:flex;gap:6px}
.lg-tab{padding:6px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.lg-tab[aria-pressed=true]{border-color:var(--sc-accent);background:var(--sc-ring)}
.lg-svg{width:100%;height:auto;display:block;overflow:visible;touch-action:pan-y;cursor:crosshair}
.lg-svg:focus-visible{outline:2px solid var(--sc-accent);outline-offset:6px;border-radius:8px}
.lg-grid line{stroke:var(--sc-line);stroke-dasharray:3 5}
.lg-grid text{fill:var(--sc-muted);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
.lg-line{fill:none;stroke:var(--sc-accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.lg-line.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:lg-draw 1.1s cubic-bezier(.5,0,.2,1) forwards}
.lg-area{opacity:.9}
.lg-guide{stroke:var(--sc-accent);stroke-width:1.2;stroke-dasharray:4 4;opacity:0;transition:opacity .15s}
.lg-dot{fill:var(--sc-bg);stroke:var(--sc-accent);stroke-width:3;opacity:0;transition:opacity .15s}
.lg-tip{position:absolute;pointer-events:none;padding:6px 10px;border-radius:10px;background:var(--sc-fg);color:var(--sc-bg);font:700 12px/1.3 system-ui;white-space:nowrap;opacity:0;transform:translate(-50%,-130%);transition:opacity .15s}
.lg-tip small{display:block;font-weight:500;opacity:.7}
.lg-wrap{position:relative}
.lg-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@keyframes lg-draw{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.lg-line.draw{animation:none;stroke-dashoffset:0}}`,
 html:`<div class="lg"><div class="lg-head"><div><p class="lg-label">Weekly active readers</p><p class="lg-val"><span class="lg-num">0</span><span class="lg-delta"></span></p></div><div class="lg-tabs"><button class="lg-tab" type="button" data-r="0" aria-pressed="true">7D</button><button class="lg-tab" type="button" data-r="1" aria-pressed="false">30D</button><button class="lg-tab" type="button" data-r="2" aria-pressed="false">90D</button></div></div><div class="lg-wrap"><svg class="lg-svg" viewBox="0 0 640 240" tabindex="0" role="img" aria-label="Line chart of weekly active readers. Use left and right arrow keys to inspect values."><defs><linearGradient id="lg-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sc-accent);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--sc-accent);stop-opacity:0"/></linearGradient></defs><g class="lg-grid"></g><path class="lg-area" fill="url(#lg-fill)"/><path class="lg-line" pathLength="1"/><line class="lg-guide" y1="10" y2="220"/><circle class="lg-dot" r="6"/></svg><div class="lg-tip"></div><p class="lg-live" aria-live="polite"></p></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.lg'),svg=root.querySelector('.lg-svg'),grid=root.querySelector('.lg-grid'),line=root.querySelector('.lg-line'),area=root.querySelector('.lg-area'),guide=root.querySelector('.lg-guide'),dot=root.querySelector('.lg-dot'),tip=root.querySelector('.lg-tip'),num=root.querySelector('.lg-num'),delta=root.querySelector('.lg-delta'),live=root.querySelector('.lg-live'),tabs=root.querySelectorAll('.lg-tab'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=640,H=240,P=[10,16,12,28],ranges=[{n:7,u:'day'},{n:30,u:'day'},{n:90,u:'day'}],data=[],cur=[],range=0,sel=-1,seen=false;
function gen(n,seed){var a=[],v=4200+seed*300;for(var i=0;i<n;i++){v+=Math.sin(i*.7+seed)*180+Math.sin(i*.19+seed*2)*260+Math.cos(i*1.9)*60+30;a.push(Math.round(v))}return a}
ranges.forEach(function(r,i){data.push(gen(r.n,i+1))});
var MIN=3000,MAX=7600;
function fmt(v){return v.toLocaleString('en-GB')}
function xy(vals){var n=vals.length;return vals.map(function(v,i){return [P[3]+(W-P[3]-P[1])*i/(n-1),P[0]+(H-P[0]-P[2])*(1-(v-MIN)/(MAX-MIN))]})}
function pathOf(p){var d='M'+p[0][0].toFixed(1)+','+p[0][1].toFixed(1);for(var i=0;i<p.length-1;i++){var p0=p[Math.max(0,i-1)],p1=p[i],p2=p[i+1],p3=p[Math.min(p.length-1,i+2)];d+=' C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+','+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+','+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0].toFixed(1)+','+p2[1].toFixed(1)}return d}
function draw(vals){var p=xy(vals),d=pathOf(p);line.setAttribute('d',d);area.setAttribute('d',d+' L'+p[p.length-1][0].toFixed(1)+','+(H-P[2])+' L'+p[0][0].toFixed(1)+','+(H-P[2])+' Z')}
function grids(){grid.textContent='';[0,.5,1].forEach(function(f){var y=P[0]+(H-P[0]-P[2])*f,v=Math.round(MAX-(MAX-MIN)*f),l=document.createElementNS(NS,'line');l.setAttribute('x1',P[3]);l.setAttribute('x2',W-P[1]);l.setAttribute('y1',y);l.setAttribute('y2',y);var t=document.createElementNS(NS,'text');t.setAttribute('x',0);t.setAttribute('y',y+4);t.textContent=(v/1000).toFixed(1)+'k';grid.appendChild(l);grid.appendChild(t)})}
function label(i){var r=ranges[range],back=r.n-1-i;return back===0?'Today':back+' days ago'}
function show(i){sel=i;var vals=data[range],p=xy(vals)[i];num.textContent=fmt(vals[i]);guide.setAttribute('x1',p[0]);guide.setAttribute('x2',p[0]);dot.setAttribute('cx',p[0]);dot.setAttribute('cy',p[1]);guide.style.opacity=dot.style.opacity=1;
 var r=svg.getBoundingClientRect(),wr=svg.parentNode.getBoundingClientRect();tip.style.left=(p[0]/W*r.width)+'px';tip.style.top=(p[1]/H*r.height+(r.top-wr.top))+'px';tip.style.opacity=1;tip.textContent=fmt(vals[i]);var sm=document.createElement('small');sm.textContent=label(i);tip.appendChild(sm);live.textContent=fmt(vals[i])+' readers, '+label(i)}
function hide(){sel=-1;guide.style.opacity=dot.style.opacity=0;tip.style.opacity=0;summary()}
function summary(){var v=data[range],last=v[v.length-1],first=v[0],pct=(last-first)/first*100;num.textContent=fmt(last);delta.textContent=(pct>=0?'+':'')+pct.toFixed(1)+'%'}
function setRange(r){var from=cur.length?cur.slice():data[r].slice(),to=data[r],n=Math.max(from.length,to.length);range=r;tabs.forEach(function(t,i){t.setAttribute('aria-pressed',String(i===r))});function res(a,n){var o=[];for(var i=0;i<n;i++){var f=i/(n-1)*(a.length-1),lo=Math.floor(f),hi=Math.min(a.length-1,lo+1);o.push(a[lo]+(a[hi]-a[lo])*(f-lo))}return o}
 var A=res(from,n),B=res(to,n),t0=performance.now();if(reduce){cur=to.slice();draw(cur);summary();return}
 (function step(now){var k=Math.min(1,(now-t0)/600),e=1-Math.pow(1-k,3);var cv=A.map(function(v,i){return v+(B[i]-v)*e});if(k<1){draw(cv);requestAnimationFrame(step)}else{cur=to.slice();draw(cur);summary()}})(t0)}
tabs.forEach(function(t){t.addEventListener('click',function(){setRange(+t.getAttribute('data-r'))})});
function at(e){var r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,n=data[range].length,i=Math.round((x-P[3])/(W-P[3]-P[1])*(n-1));show(Math.max(0,Math.min(n-1,i)))}
svg.addEventListener('pointermove',at);svg.addEventListener('pointerdown',at);svg.addEventListener('pointerleave',hide);
svg.addEventListener('keydown',function(e){var n=data[range].length;if(e.key==='ArrowLeft'){e.preventDefault();show(sel<0?n-1:Math.max(0,sel-1))}if(e.key==='ArrowRight'){e.preventDefault();show(sel<0?0:Math.min(n-1,sel+1))}if(e.key==='Escape')hide()});svg.addEventListener('blur',hide);
grids();cur=data[0].slice();draw(cur);summary();
function play(){line.classList.remove('draw');void line.getBoundingClientRect();line.classList.add('draw')}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting&&!seen){seen=true;play()}},{threshold:.3}).observe(root);else play();})();`},

{id:'s-hover-preview',title:'Hover preview list',component:'Hover preview list',key:'hover-preview',family,width:780,
 description:'Giant words that bring a floating photo preview to your cursor, tilting with your movement while the others fade back.',
 prompt:'Make an editorial list of five huge words (Aurora, Mesa, Tide, Lilac, Neon) with an index and a short caption on each row. Hovering or focusing a row dims the others and shows a floating preview card (180x230px, generated landscape for that word) that follows the pointer with easing (lerp 0.14), tilts by the horizontal velocity (rotate up to 10 degrees), scales in with a spring transition and sits above the text with pointer-events none; when the pointer leaves it scales out. For keyboard focus the card appears next to the row. The rows are real links (href="#") with prevented default and the preview is aria-hidden. Pause when off-screen; reduced motion uses no tilt or scale animation. Vanilla HTML, CSS and JavaScript.',
 css:`.hp{position:relative;padding:20px 30px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.hp-row{display:flex;align-items:baseline;gap:18px;padding:14px 0;border-bottom:1px solid var(--sc-line);color:inherit;text-decoration:none;transition:opacity .3s,transform .3s}
.hp-row:last-of-type{border-bottom:0}
.hp-row small{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--sc-muted);letter-spacing:.1em}
.hp-row strong{flex:1;font:900 clamp(40px,9vw,76px)/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.045em}
.hp-row em{font-style:normal;font-size:14px;color:var(--sc-muted);text-align:right}
.hp.has .hp-row{opacity:.25}
.hp.has .hp-row.on{opacity:1;transform:translateX(10px)}
.hp-card{position:absolute;left:0;top:0;width:180px;height:230px;border-radius:14px;background-size:cover;background-position:center;box-shadow:0 26px 40px -16px rgba(0,0,0,.6),0 0 0 4px #fff;pointer-events:none;opacity:0;transform:translate(-999px,-999px) scale(.6);transition:opacity .25s;z-index:5}
.hp-card.on{opacity:1}
@media (prefers-reduced-motion:reduce){.hp-row{transition:none}}`,
 html:`<div class="hp"><a class="hp-row" href="#"><small>01</small><strong>Aurora</strong><em>Northern light</em></a><a class="hp-row" href="#"><small>02</small><strong>Mesa</strong><em>Desert evening</em></a><a class="hp-row" href="#"><small>03</small><strong>Tide</strong><em>Teal shoreline</em></a><a class="hp-row" href="#"><small>04</small><strong>Lilac</strong><em>Soft morning</em></a><a class="hp-row" href="#"><small>05</small><strong>Neon</strong><em>City after dark</em></a><div class="hp-card" aria-hidden="true"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.hp'),rows=[].slice.call(root.querySelectorAll('.hp-row')),card=root.querySelector('.hp-card');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,ids=[1,2,6,7,5],x=0,y=0,tx=0,ty=0,rot=0,sc=0,tsc=0,raf=0,visible=true,first=true;
rows.forEach(function(r,i){r.addEventListener('click',function(e){e.preventDefault()});function on(){root.classList.add('has');rows.forEach(function(q){q.classList.toggle('on',q===r)});card.style.backgroundImage='url('+artURL(ids[i],180,230)+')';card.classList.add('on');tsc=1;go()}function off(){root.classList.remove('has');rows.forEach(function(q){q.classList.remove('on')});card.classList.remove('on');tsc=0;go()}
 r.addEventListener('pointerenter',on);r.addEventListener('pointerleave',off);r.addEventListener('focus',function(){var b=r.getBoundingClientRect(),p=root.getBoundingClientRect();tx=b.left-p.left+b.width*.55;ty=b.top-p.top+b.height/2;if(first){x=tx;y=ty;first=false}on()});r.addEventListener('blur',off)});
function frame(){raf=0;var px=x;x+=(tx-x)*(reduce?1:.14);y+=(ty-y)*(reduce?1:.14);var vx=x-px;rot+=((reduce?0:Math.max(-10,Math.min(10,vx*1.4)))-rot)*.2;sc+=(tsc-sc)*(reduce?1:.16);
 card.style.transform='translate('+(x-90).toFixed(1)+'px,'+(y-115).toFixed(1)+'px) rotate('+rot.toFixed(2)+'deg) scale('+(.6+sc*.4).toFixed(3)+')';if(visible&&(Math.abs(tx-x)>.2||Math.abs(ty-y)>.2||Math.abs(tsc-sc)>.01||Math.abs(rot)>.05))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var b=root.getBoundingClientRect();tx=e.clientX-b.left;ty=e.clientY-b.top;if(first){x=tx;y=ty;first=false}go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);})();`},

{id:'s-tumble-pile',title:'Tumble pile',component:'Tumble pile',key:'tumble-pile',family,width:780,
 description:'A pile of labelled bubbles that rains in under gravity, stacks and collides, and can be grabbed and thrown.',
 prompt:'Create a small physics playground on a canvas with no libraries. Make 28 circular bodies (radius 24-38px) with labels (design words) and colours from a violet-to-pink-to-amber palette. Each frame integrate gravity 0.5, damping 0.995, collide with the floor and side walls (restitution 0.35, floor friction), and resolve circle-circle collisions with four solver iterations per frame: push overlapping pairs apart in proportion to the inverse masses (mass = r squared) and exchange velocity along the contact normal with restitution 0.3. Bodies spawn above the stage with staggered delays so they rain in when it scrolls into view. Dragging a body grabs it with a spring to the pointer (stiffness 0.2) and releasing throws it with the recent pointer velocity; a Shake button gives every body a random upward impulse and a Rain again button respawns them. Draw circles with a soft highlight and centred bold text. Handle devicePixelRatio, resize (clamp bodies inside), off-screen pausing and reduced motion (bodies start already settled and the simulation only runs while dragging). Vanilla HTML, CSS and JavaScript.',
 css:`.tb{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.tb.drag{cursor:grabbing}
.tb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.tb-bar{position:absolute;right:14px;top:14px;display:flex;gap:8px}
.tb-btn{padding:7px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.tb-btn:hover{border-color:var(--sc-accent)}`,
 html:`<div class="tb"><canvas role="img" aria-label="A pile of labelled bubbles you can drag and throw"></canvas><div class="tb-bar"><button class="tb-btn" type="button" data-a="shake">Shake</button><button class="tb-btn" type="button" data-a="rain">Rain again</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tb'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,B=[],grab=null,hist=[],raf=0,visible=true,seen=false,words=['Design','Type','Motion','Craft','Brand','Grid','Color','Layout','Icons','Voice','Form','Scale','Light','Depth','Flow','Space','Edge','Tone','Ink','Rhythm','Weight','Shape','Kern','Hue','Frame','Blend','Mask','Echo'];
function mk(){B=[];for(var i=0;i<28;i++){var r=24+(i*37%15);B.push({x:0,y:0,vx:0,vy:0,r:r,m:r*r,w:words[i],c:'hsl('+(255+i*5.4)+',80%,'+(58+(i%3)*4)+'%)',delay:i*70,t:0,on:false})}}
function place(settled){B.forEach(function(b,i){if(settled){b.x=b.r+((i*97)%(W-2*b.r));b.y=H-b.r-Math.floor(i/6)*60;b.on=true}else{b.x=b.r+Math.random()*(W-2*b.r);b.y=-b.r-Math.random()*400;b.vx=(Math.random()-.5)*3;b.vy=0;b.on=false;b.t=performance.now()+b.delay}})}
function size(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);B.forEach(function(b){b.x=Math.max(b.r,Math.min(W-b.r,b.x));b.y=Math.min(H-b.r,b.y)})}
function step(now){B.forEach(function(b){if(!b.on){if(now>=b.t)b.on=true;else return}if(b===grab)return;b.vy+=.5;b.vx*=.995;b.vy*=.995;b.x+=b.vx;b.y+=b.vy;if(b.x<b.r){b.x=b.r;b.vx*=-.35}if(b.x>W-b.r){b.x=W-b.r;b.vx*=-.35}if(b.y>H-b.r){b.y=H-b.r;b.vy*=-.35;b.vx*=.97;if(Math.abs(b.vy)<.6)b.vy=0}});
 if(grab&&grab.p){grab.vx=(grab.p.x-grab.x)*.2;grab.vy=(grab.p.y-grab.y)*.2;grab.x+=grab.vx;grab.y+=grab.vy}
 for(var it=0;it<4;it++)for(var i=0;i<B.length;i++)for(var j=i+1;j<B.length;j++){var a=B[i],b=B[j];if(!a.on||!b.on)continue;var dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||.001,min=a.r+b.r;if(d<min){var nx=dx/d,ny=dy/d,ov=min-d,ia=1/a.m,ib=1/b.m,s=ia+ib;if(a!==grab)a.x-=nx*ov*ia/s;if(b!==grab)b.x+=nx*ov*ib/s;if(a!==grab)a.y-=ny*ov*ia/s;if(b!==grab)b.y+=ny*ov*ib/s;var rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){var jj=-(1+.3)*rv/s;if(a!==grab){a.vx-=jj*ia*nx;a.vy-=jj*ia*ny}if(b!==grab){b.vx+=jj*ib*nx;b.vy+=jj*ib*ny}}}}
 B.forEach(function(b){if(b.y>H-b.r){b.y=H-b.r}if(b.x<b.r)b.x=b.r;if(b.x>W-b.r)b.x=W-b.r})}
function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);B.forEach(function(b){if(!b.on)return;ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();var g=ctx.createRadialGradient(b.x-b.r*.35,b.y-b.r*.4,0,b.x-b.r*.35,b.y-b.r*.4,b.r);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 '+Math.round(b.r*.42)+'px system-ui,-apple-system,Segoe UI,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.w,b.x,b.y+1)})}
function frame(now){raf=0;step(now);render();if(visible&&(!reduce||grab))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function pos(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
root.addEventListener('pointerdown',function(e){if(e.target.closest('.tb-bar'))return;var p=pos(e);for(var i=B.length-1;i>=0;i--){var b=B[i];if(b.on&&Math.hypot(p.x-b.x,p.y-b.y)<=b.r){grab=b;b.p=p;hist=[];root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}go();return}}});
root.addEventListener('pointermove',function(e){if(!grab)return;var p=pos(e);grab.p=p;hist.push([p.x,p.y]);if(hist.length>5)hist.shift()});
function up(){if(!grab)return;if(hist.length>1){var a=hist[0],b=hist[hist.length-1];grab.vx=(b[0]-a[0])/hist.length*1.4;grab.vy=(b[1]-a[1])/hist.length*1.4}grab.p=null;grab=null;root.classList.remove('drag');go()}
root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.querySelectorAll('.tb-btn').forEach(function(b){b.addEventListener('click',function(){if(b.getAttribute('data-a')==='shake'){B.forEach(function(q){q.vy-=8+Math.random()*10;q.vx+=(Math.random()-.5)*10})}else place(false);go()})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible&&!seen){seen=true;if(!reduce)place(false)}go()}).observe(root);
mk();if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){var first=!lw;lw=cv.clientWidth;size();if(first)place(reduce);go()}}).observe(cv)}else{size();place(reduce);go()}if(reduce){step(0);render()}})();`}
];
