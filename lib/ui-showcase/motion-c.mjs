// Motion toolkit demos, part three: gooey scroll rail, cover flow, poster shuffle, tunnel scroll, shoal, 3D scroll, spring waves, HUD, tween editor, jello, soup and scramble. No third-party code.
import {ART} from './art-boot.mjs';
import {BOOT} from './cursorfx-boot.mjs';
import {SB} from './annn-boot.mjs';
const family='Motion toolkit';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const motionC=[
{id:'s-gooey-scroll',title:'Gooey scroll rail',component:'Gooey scroll rail',key:'gooey-scroll',family,width:780,
 description:'A scroll progress rail made of liquid: a head and a chain of lagging droplets that stretch, merge and snap back as you scroll.',
 prompt:'Build a scrollable article panel (380px tall, five sections with a big number, a heading and two lines of copy) with a scroll progress rail on its right edge made of liquid. The rail is an overlay (pointer-events none) filtered by an inline SVG goo filter (feGaussianBlur stdDeviation 7 then feColorMatrix "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"). Inside it sit one large head circle (22px) and five trailing droplets (18, 15, 12, 9, 6px). The head follows the scroll progress mapped to the rail height; each droplet chases the one in front of it with a lag factor from 0.28 down to 0.1, so fast scrolling stretches the chain into a tail and it merges back when you stop. A round bubble at the bottom left of the panel shows the current section number and scales with the scroll speed. Without any input the panel scrolls itself up and down; touching it takes over for a few seconds. Reduced motion shows static progress. Vanilla HTML, CSS and JavaScript.',
 css:`.gs{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.gs-box{height:380px;overflow:auto;scrollbar-width:none;padding:0 70px 0 0}
.gs-box::-webkit-scrollbar{display:none}
.gs-sec{height:380px;display:grid;align-content:center;gap:8px;padding:0 48px;border-bottom:1px solid var(--sc-line)}
.gs-sec b{font:900 72px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.05em;color:var(--sc-accent)}
.gs-sec h3{margin:0;font:800 26px/1.15 system-ui;color:var(--sc-fg)}
.gs-sec p{margin:0;max-width:44ch;font:500 15px/1.5 system-ui;color:var(--sc-muted)}
.gs-rail{position:absolute;right:0;top:0;bottom:0;width:60px;pointer-events:none;filter:url(#gs-goo)}
.gs-d{position:absolute;left:50%;top:0;border-radius:50%;background:var(--sc-accent);will-change:transform}
.gs-bub{position:absolute;right:76px;bottom:18px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--sc-fg);color:var(--sc-bg);font:800 16px/1 system-ui;transition:transform .15s}`,
 html:`<div class="gs"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="gs-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"/></filter></defs></svg><div class="gs-box" tabindex="0" role="region" aria-label="Article sections"><section class="gs-sec"><b>01</b><h3>Start with the flow</h3><p>Everything on the page follows the same slow curve of attention.</p></section><section class="gs-sec"><b>02</b><h3>Show the structure</h3><p>A good rail says where you are before you have to look for it.</p></section><section class="gs-sec"><b>03</b><h3>Let motion explain</h3><p>Speed is information: a fast scroll should look different from a slow one.</p></section><section class="gs-sec"><b>04</b><h3>Keep it physical</h3><p>Lag, stretch and snap-back make a plain bar feel like a material.</p></section><section class="gs-sec"><b>05</b><h3>Finish quietly</h3><p>The tail catches up and the page settles into stillness.</p></section></div><div class="gs-rail"></div><div class="gs-bub" aria-hidden="true">01</div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gs'),box=root.querySelector('.gs-box'),rail=root.querySelector('.gs-rail'),bub=root.querySelector('.gs-bub');
${SB}
var R=[22,18,15,12,9,6],LAG=[1,.3,.24,.19,.14,.1],D=R.map(function(r,i){var d=document.createElement('i');d.className='gs-d';d.style.width=d.style.height=r+'px';d.style.marginLeft=(-r/2)+'px';rail.appendChild(d);return {el:d,y:0,r:r}}),lastP=0,sp=0,sec=-1;
ScrollDemo(box,function(p){var H=rail.clientHeight-40,ty=20+p*H;sp=sp*.85+Math.abs(p-lastP)*40;lastP=p;
 D.forEach(function(d,i){d.y+=(i===0?ty-d.y:(D[i-1].y-d.y))*LAG[i]*(matchMedia('(prefers-reduced-motion:reduce)').matches?10:1);d.el.style.transform='translateY('+(d.y-d.r/2).toFixed(1)+'px)'});
 var n=Math.min(4,Math.floor(p*5-.0001+.0001*p));n=Math.max(0,Math.min(4,Math.round(p*4)));if(n!==sec){sec=n;bub.textContent='0'+(n+1)}bub.style.transform='scale('+(1+Math.min(.5,sp*.5)).toFixed(2)+')'});})();`},

{id:'s-cover-flow',title:'Cover flow',component:'Cover flow',key:'cover-flow',family,width:780,
 description:'A classic cover-flow shelf rebuilt with springs: the centre card faces you, neighbours fold away in depth, with reflections underneath.',
 prompt:'Build a cover-flow carousel of eight cards (170x220px, generated artwork) in a 3D scene (perspective 1100px). A float cur holds the current position and eases to the target index with a spring (stiffness 0.1, damping 0.78). For a card with offset d = i - cur: t = clamp(d, -1, 1); x = d * 58 + t * 120; z = -abs(t) * 150 - max(0, abs(d) - 1) * 24; rotateY = -t * 56 degrees; z-index = 100 - abs(d). Each card has a mirrored reflection below it (a flipped copy with a mask gradient fading out). A caption under the shelf shows the nearest card name and its number. Click a side card to bring it forward, drag horizontally to scrub through, arrow keys change the selection, and the shelf advances itself every 2.4 seconds until the visitor interacts. The shelf is focusable with an aria-label. Vanilla HTML, CSS and JavaScript.',
 css:`.cv{position:relative;height:390px;border:1px solid var(--sc-line);border-radius:28px;background:radial-gradient(120% 90% at 50% 20%,color-mix(in srgb,var(--sc-accent) 14%,var(--sc-surface)),var(--sc-surface));overflow:hidden;cursor:grab;user-select:none;touch-action:pan-y}
.cv-s{position:absolute;inset:0 0 54px;perspective:1100px;perspective-origin:50% 40%}
.cv-c{position:absolute;left:50%;top:36px;width:170px;height:220px;margin-left:-85px;transform-style:preserve-3d;will-change:transform}
.cv-f,.cv-r{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:12px;background-size:cover;background-position:center}
.cv-f{box-shadow:0 18px 30px -14px rgba(0,0,0,.55)}
.cv-r{top:100%;margin-top:4px;transform:scaleY(-1);opacity:.4;-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,.7),transparent 55%);mask-image:linear-gradient(to top,rgba(0,0,0,.7),transparent 55%)}
.cv-cap{z-index:500;position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;gap:10px;align-items:baseline;font:700 17px/1 system-ui;color:var(--sc-fg)}
.cv-cap small{font:600 12px/1 ui-monospace,monospace;color:var(--sc-muted)}`,
 html:`<div class="cv" tabindex="0" role="region" aria-label="Cover flow: drag, click a card or use the arrow keys"><div class="cv-s"></div><div class="cv-cap" aria-live="polite"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cv'),stage=root.querySelector('.cv-s'),cap=root.querySelector('.cv-cap');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=8,cur=0,vel=0,target=0,C=[],raf=0,visible=true,auto=!reduce,drag=false,lx=0,moved=0,t0=0,shown=-1,resume=0;
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='cv-c';var u='url('+artURL(i,170,220)+')',f=document.createElement('div');f.className='cv-f';f.style.backgroundImage=u;var r=document.createElement('div');r.className='cv-r';r.style.backgroundImage=u;c.appendChild(f);c.appendChild(r);stage.appendChild(c);C.push(c);(function(k,el){el.addEventListener('click',function(){if(moved>6)return;touch();target=k})})(i,c)}
function touch(){auto=false;clearTimeout(resume);if(!reduce)resume=setTimeout(function(){auto=true},5000)}
function lay(){C.forEach(function(c,i){var d=((i-cur)%N+N+N/2)%N-N/2,t=Math.max(-1,Math.min(1,d)),x=d*58+t*120,z=-Math.abs(t)*150-Math.max(0,Math.abs(d)-1)*24;c.style.transform='translateX('+x.toFixed(1)+'px) translateZ('+z.toFixed(1)+'px) rotateY('+(-t*56).toFixed(1)+'deg)';c.style.zIndex=String(100-Math.round(Math.abs(d)*10));c.style.opacity=String(Math.max(0,1-Math.max(0,Math.abs(d)-3.2)*.8))});
 var n=((Math.round(cur)%N)+N)%N;if(n!==shown){shown=n;cap.textContent='';var a=document.createElement('span');a.textContent=NAMES[n];var b=document.createElement('small');b.textContent=(n+1)+' / '+N;cap.appendChild(a);cap.appendChild(b)}}
function frame(now){raf=0;if(auto&&now-t0>2400){t0=now;target=Math.round(target)+1}
 if(reduce){cur=target}else{vel+=(target-cur)*.1;vel*=.78;cur+=vel}
 if(Math.abs(target-cur)<.0005&&Math.abs(vel)<.0005)cur=target;lay();if(visible&&(!reduce||Math.abs(target-cur)>.001||true))raf=requestAnimationFrame(frame);if(reduce&&!auto&&Math.abs(target-cur)<.001){raf=0}}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;moved=0;touch();root.style.cursor='grabbing';go()});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;moved+=Math.abs(dx);target-=dx/70;go()});
function up(){if(drag){drag=false;root.style.cursor='';target=Math.round(target)}}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);root.addEventListener('pointerleave',up);
root.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();touch();target=Math.round(target)+1;go()}if(e.key==='ArrowLeft'){e.preventDefault();touch();target=Math.round(target)-1;go()}});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
lay();go();})();`},

{id:'s-poster-shuffle',title:'Poster shuffle',component:'Poster shuffle',key:'poster-shuffle',family,width:780,
 description:'Six posters that regroup into new editorial layouts on every shuffle, flying to their places with a staggered, springy ease.',
 prompt:'Build a poster board (780x400 stage) with six poster tiles (generated artwork with a small caption). Define five layout functions returning six rectangles in fractions of the stage: a 3x2 grid, a hero (one tall tile on the left, two on top right and three along the bottom right), six vertical stripes, a diagonal cascade of overlapping tilted tiles and a mosaic with mixed sizes. A Shuffle button (and an automatic shuffle every 3.2 seconds until the visitor presses it) advances to the next layout and also randomises which poster takes which slot (Fisher-Yates). Tiles move by CSS transitions on left, top, width, height and rotate with a per-tile stagger of 55ms and a slightly overshooting cubic-bezier(.3,1.35,.5,1) over 700ms; z-index follows the slot order so overlaps stay predictable. A layout name chip updates on every change. Reduced motion switches instantly. Vanilla HTML, CSS and JavaScript.',
 css:`.ps{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;padding:14px}
.ps-st{position:relative;height:372px}
.ps-t{position:absolute;border-radius:12px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 14px 26px -14px rgba(0,0,0,.55);transition:left .7s cubic-bezier(.3,1.35,.5,1),top .7s cubic-bezier(.3,1.35,.5,1),width .7s cubic-bezier(.3,1.35,.5,1),height .7s cubic-bezier(.3,1.35,.5,1),transform .7s cubic-bezier(.3,1.35,.5,1)}
.ps-t span{position:absolute;left:10px;bottom:8px;color:#fff;font:800 13px/1 system-ui;text-shadow:0 1px 8px rgba(0,0,0,.55)}
.ps-bar{position:absolute;right:22px;top:22px;z-index:200;display:flex;gap:8px;align-items:center}
.ps-chip{padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font:700 12px/1 ui-monospace,monospace;backdrop-filter:blur(6px)}
.ps-btn{padding:8px 14px;border:0;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);font:700 13px/1 system-ui;cursor:pointer}
@media (prefers-reduced-motion:reduce){.ps-t{transition:none}}`,
 html:`<div class="ps"><div class="ps-st"></div><div class="ps-bar"><span class="ps-chip" aria-live="polite"></span><button class="ps-btn" type="button">Shuffle</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ps'),st=root.querySelector('.ps-st'),chip=root.querySelector('.ps-chip'),btn=root.querySelector('.ps-btn');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,g=.014,T=[],L=[
{n:'Grid',f:function(){var o=[];for(var i=0;i<6;i++){var c=i%3,r=(i/3)|0;o.push([c/3+g/2,r/2+g/2,1/3-g,.5-g,0])}return o}},
{n:'Hero',f:function(){return [[0,0,.42,1,0],[.44,0,.27,.48,0],[.73,0,.27,.48,0],[.44,.52,.17,.48,0],[.63,.52,.17,.48,0],[.82,.52,.18,.48,0]]}},
{n:'Stripes',f:function(){var o=[];for(var i=0;i<6;i++)o.push([i/6+g/2,0,1/6-g,1,0]);return o}},
{n:'Cascade',f:function(){var o=[];for(var i=0;i<6;i++)o.push([.02+i*.145,i%2?.34:.04,.27,.62,(i%2?5:-5)+(i-2.5)*1.2]);return o}},
{n:'Mosaic',f:function(){return [[0,0,.3,.6,0],[.32,0,.38,.36,0],[.72,0,.28,.6,0],[0,.62,.5,.38,0],[.32,.38,.38,.22,0],[.52,.62,.48,.38,0]]}}],li=0,order=[0,1,2,3,4,5],auto=!reduce,timer=0;
for(var i=0;i<6;i++){var t=document.createElement('div');t.className='ps-t';t.style.backgroundImage='url('+artURL(i,260,300)+')';var s=document.createElement('span');s.textContent=NAMES[i];t.appendChild(s);st.appendChild(t);T.push(t)}
function apply(){var W=st.clientWidth,H=st.clientHeight,rects=L[li].f();chip.textContent=L[li].n;order.forEach(function(p,slot){var r=rects[slot],t=T[p];t.style.transitionDelay=reduce?'0s':(slot*55)+'ms';t.style.left=(r[0]*W).toFixed(1)+'px';t.style.top=(r[1]*H).toFixed(1)+'px';t.style.width=(r[2]*W).toFixed(1)+'px';t.style.height=(r[3]*H).toFixed(1)+'px';t.style.transform='rotate('+r[4]+'deg)';t.style.zIndex=String(slot+1)})}
function shuffle(){li=(li+1)%L.length;for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=order[i];order[i]=order[j];order[j]=x}apply()}
btn.addEventListener('click',function(){auto=false;shuffle()});
function loop(){if(auto&&!document.hidden)shuffle();timer=setTimeout(loop,3200)}
var obs=null;if('ResizeObserver' in window){obs=new ResizeObserver(function(){apply()});obs.observe(st)}
apply();if(!reduce)timer=setTimeout(loop,2400);})();`},

{id:'s-tunnel-scroll',title:'Tunnel scroll',component:'Tunnel scroll',key:'tunnel-scroll',family,width:780,
 description:'Scrolling flies the camera through a tunnel of framed pictures: frames grow, pass the lens and fade while the next ones arrive from the distance.',
 prompt:'Build a scroll-driven tunnel. A scrollable box (380px tall) contains a track 4x the height and a sticky stage (position sticky, top 0, 380px) holding seven stacked frames (generated artwork with a number and a name). Scroll progress p (0 to 1) moves a camera along depth c = p * 6.4. For frame i with depth d = i - c: scale = 2.35 raised to the power (-d) (so far frames are small and near frames are large), opacity = smoothstep over d (fade in over the farthest 1.2 units and fade out as d drops below -0.15), a small blur on distant frames and a slight rotation of d * 2.2 degrees alternating by sign. Thin guide rectangles at each depth form the tunnel walls. A depth meter shows the current frame number. Without input the box scrolls itself; user input takes over. Reduced motion shows the middle of the tunnel statically. Vanilla HTML, CSS and JavaScript.',
 css:`.tn{border:1px solid var(--sc-line);border-radius:28px;background:#07080f;overflow:hidden;position:relative}
.tn-box{height:380px;overflow:auto;scrollbar-width:none}
.tn-box::-webkit-scrollbar{display:none}
.tn-track{height:1700px;position:relative}
.tn-stage{position:sticky;top:0;height:380px;overflow:hidden;perspective:900px}
.tn-f{position:absolute;left:50%;top:50%;width:300px;height:200px;margin:-100px 0 0 -150px;border-radius:14px;background-size:cover;background-position:center;box-shadow:0 0 0 2px rgba(255,255,255,.55),0 30px 60px -20px rgba(0,0,0,.8);will-change:transform,opacity,filter}
.tn-f span{position:absolute;left:14px;bottom:12px;color:#fff;font:900 22px/1 system-ui;letter-spacing:-.02em;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.tn-w{position:absolute;left:50%;top:50%;width:300px;height:200px;margin:-100px 0 0 -150px;border:1.5px solid rgba(165,151,255,.45);border-radius:18px;will-change:transform,opacity}
.tn-m{position:absolute;right:18px;top:16px;z-index:3;color:#dcd7ff;font:700 12px/1 ui-monospace,monospace;letter-spacing:.08em}`,
 html:`<div class="tn"><div class="tn-m" aria-hidden="true">DEPTH 01 / 07</div><div class="tn-box" tabindex="0" role="region" aria-label="Tunnel of pictures: scroll to travel through"><div class="tn-track"><div class="tn-stage"></div></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tn'),box=root.querySelector('.tn-box'),stage=root.querySelector('.tn-stage'),meter=root.querySelector('.tn-m');
${ART}
${NAMES}
${SB}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,F=[],W=[],N=7,shown=-1;
for(var i=0;i<N;i++){var w=document.createElement('div');w.className='tn-w';stage.appendChild(w);W.push(w)}
for(var j=0;j<N;j++){var f=document.createElement('div');f.className='tn-f';f.style.backgroundImage='url('+artURL(j,300,200)+')';var s=document.createElement('span');s.textContent=(j+1<10?'0':'')+(j+1)+' '+NAMES[j%8];f.appendChild(s);stage.appendChild(f);F.push(f)}
function ss(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
ScrollDemo(box,function(p){var c=(reduce?.45:p)*6.4;
 for(var i=0;i<N;i++){var d=i-c,sc=Math.pow(2.35,-d),op=ss(5.2,3.9,d)*ss(-.9,-.15,d)*1;op=Math.max(0,Math.min(1,op));
  F[i].style.transform='scale('+Math.min(sc,9).toFixed(3)+') rotate('+((i%2?1:-1)*d*2.2).toFixed(2)+'deg)';F[i].style.opacity=op.toFixed(3);F[i].style.filter=d>0.4?'blur('+Math.min(5,d*1.1).toFixed(1)+'px)':'none';F[i].style.zIndex=String(100-Math.round(d*10));
  var wd=i-c+.5,ws=Math.pow(2.35,-wd);W[i].style.transform='scale('+Math.min(ws,9).toFixed(3)+')';W[i].style.opacity=Math.max(0,Math.min(.9,ss(5.5,2,wd)*ss(-1.2,0,wd))).toFixed(3)}
 var n=Math.max(0,Math.min(N-1,Math.round(c)));if(n!==shown){shown=n;meter.textContent='DEPTH 0'+(n+1)+' / 07'}});})();`},

{id:'s-shoal',title:'Shoal',component:'Shoal',key:'shoal',family,width:780,
 description:'A school of fish steering by simple flocking rules, drawn to your pointer, scattering when you click and leaving soft trails in the water.',
 prompt:'Build a canvas flocking simulation of 110 small fish on a deep teal gradient. Each fish keeps position, velocity and a tail phase. Every frame each fish applies separation (steer away from neighbours within 18px), alignment (match the average heading of neighbours within 60px), cohesion (steer to the neighbours centre within 80px), a gentle attraction to the pointer (or a roaming virtual target when the pointer is outside), a soft turn away from the edges, and a speed clamp (min 1.1, max 3.2). Click or tap scatters the shoal: neighbours within 140px of the click get a strong outward impulse that decays. Draw each fish as a tapered body with a tail that wags by sin(tailPhase) scaled by speed, coloured along a teal-to-gold scale by speed, over a canvas that is faded with rgba(4,22,30,0.22) each frame for gentle trails. Pause when off-screen; reduced motion draws a still school. Vanilla HTML, CSS and JavaScript.',
 css:`.sh{position:relative;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:radial-gradient(120% 120% at 50% 0%,#0f4a56,#04161e);cursor:crosshair}
.sh canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="sh" role="img" aria-label="A school of fish following the pointer"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sh'),cv=root.querySelector('canvas');
${BOOT}
var N=110,F=[];function seed(s){F=[];for(var i=0;i<N;i++){var a=Math.random()*6.283;F.push({x:Math.random()*s.W,y:Math.random()*s.H,vx:Math.cos(a)*2,vy:Math.sin(a)*2,ph:Math.random()*6.28,sc:0,sx:0,sy:0})}}
var scatter=[];
var s=Stage(root,cv,function(s){var c=s.ctx;if(!F.length)seed(s);
 c.fillStyle='rgba(4,22,30,'+(reduce?1:.22)+')';c.fillRect(0,0,s.W,s.H);
 var tx=s.x,ty=s.y;
 for(var i=0;i<N;i++){var f=F[i],sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,na=0,nc=0;
  for(var j=0;j<N;j++){if(i===j)continue;var g=F[j],dx=g.x-f.x,dy=g.y-f.y,d2=dx*dx+dy*dy;if(d2>6400)continue;var d=Math.sqrt(d2)+.001;
   if(d<24){sx-=dx/d*(24-d)/24;sy-=dy/d*(24-d)/24}
   if(d<60){ax+=g.vx;ay+=g.vy;na++}
   cx+=g.x;cy+=g.y;nc++}
  var ux=0,uy=0;ux+=sx*1.5;uy+=sy*1.5;
  if(na){ux+=(ax/na-f.vx)*.045;uy+=(ay/na-f.vy)*.045}
  if(nc){ux+=(cx/nc-f.x)*.0009;uy+=(cy/nc-f.y)*.0009}
  var px=tx-f.x,py=ty-f.y,pd=Math.sqrt(px*px+py*py)+1;ux+=px/pd*.028;uy+=py/pd*.028;
  var m=40;if(f.x<m)ux+=.12;if(f.x>s.W-m)ux-=.12;if(f.y<m)uy+=.12;if(f.y>s.H-m)uy-=.12;
  f.vx+=ux+f.sx;f.vy+=uy+f.sy;f.sx*=.9;f.sy*=.9;
  var sp=Math.sqrt(f.vx*f.vx+f.vy*f.vy)||1,cl=Math.max(1.1,Math.min(2.7,sp));f.vx=f.vx/sp*cl;f.vy=f.vy/sp*cl;
  f.x+=f.vx*(reduce?0:s.dt/16);f.y+=f.vy*(reduce?0:s.dt/16);f.ph+=cl*.28;
  var ang=Math.atan2(f.vy,f.vx),k=(cl-1.1)/1.6,len=9+k*3,wag=Math.sin(f.ph)*.55;
  c.save();c.translate(f.x,f.y);c.rotate(ang);
  var col='hsl('+(168+(i%7)*7-k*70)+' 76% '+(50+k*14)+'%)';c.fillStyle=col;
  c.beginPath();c.moveTo(len,0);c.quadraticCurveTo(len*.2,-len*.42,-len*.5,0);c.quadraticCurveTo(len*.2,len*.42,len,0);c.fill();
  c.beginPath();c.moveTo(-len*.4,0);c.lineTo(-len*1.05,-len*.5+wag*len*.5);c.lineTo(-len*1.05,len*.5+wag*len*.5);c.closePath();c.fill();
  c.restore()}
 },function(s){seed(s)});
s.click=function(x,y){for(var i=0;i<N;i++){var f=F[i],dx=f.x-x,dy=f.y-y,d=Math.sqrt(dx*dx+dy*dy)+1;if(d<160){var p=(1-d/160)*1.1;f.sx+=dx/d*p;f.sy+=dy/d*p;f.vx+=dx/d*p*3;f.vy+=dy/d*p*3}}};
})();`},

{id:'s-smooth-3d',title:'Smooth scroll in 3D',component:'Smooth scroll in 3D',key:'smooth-3d',family,width:780,
 description:'A vertical list on rails: scrolling is eased with inertia while every card tilts, recedes and fades depending on how far it is from the middle.',
 prompt:'Build a smooth-scrolling 3D list. A scrollable viewport (380px tall, perspective 900px) holds seven large cards (generated artwork, name and index) stacked vertically with 24px gaps. Real scrolling is used for input, but the visual position is eased: a variable sm chases scrollTop with a factor of 0.1 each frame, and the cards sit inside a wrapper translated by -sm so the motion has inertia. For each card the signed distance from the viewport centre (in units of card height) s drives rotateX(s * -34deg), translateZ(-abs(s) * 150px), scale(1 - abs(s) * 0.08) and opacity (1 - abs(s) * 0.55, min 0.15). A progress hairline shows the position. The list scrolls itself until the visitor touches it. Reduced motion removes the easing and the 3D tilt. Vanilla HTML, CSS and JavaScript.',
 css:`.s3{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.s3-box{height:380px;overflow:auto;scrollbar-width:none;perspective:900px;perspective-origin:50% 50%}
.s3-box::-webkit-scrollbar{display:none}
.s3-in{position:relative}
.s3-c{position:absolute;left:50%;width:min(560px,86%);height:240px;margin-left:calc(min(560px,86%)/-2);border-radius:18px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 26px 40px -22px rgba(0,0,0,.6);will-change:transform,opacity}
.s3-c span{position:absolute;left:18px;bottom:14px;color:#fff;font:900 30px/1 system-ui;letter-spacing:-.03em;text-shadow:0 2px 14px rgba(0,0,0,.55)}
.s3-c b{position:absolute;right:16px;top:12px;color:rgba(255,255,255,.85);font:700 12px/1 ui-monospace,monospace}
.s3-p{position:absolute;right:12px;top:12px;bottom:12px;width:2px;background:var(--sc-line);border-radius:2px}
.s3-p i{position:absolute;left:0;right:0;top:0;height:20%;background:var(--sc-accent);border-radius:2px}`,
 html:`<div class="s3"><div class="s3-box" tabindex="0" role="region" aria-label="Cards: scroll to move through the list"><div class="s3-in"></div></div><div class="s3-p"><i></i></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.s3'),box=root.querySelector('.s3-box'),inner=root.querySelector('.s3-in'),bar=root.querySelector('.s3-p i');
${ART}
${NAMES}
${SB}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,CH=240,GAP=24,N=7,C=[],sm=0,H=380,TOTAL=N*(CH+GAP)+H-CH-GAP;
inner.style.height=TOTAL+'px';
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='s3-c';c.style.top=(H/2-CH/2+i*(CH+GAP))+'px';c.style.backgroundImage='url('+artURL(i,560,240)+')';var s=document.createElement('span');s.textContent=NAMES[i%8];var b=document.createElement('b');b.textContent='0'+(i+1);c.appendChild(s);c.appendChild(b);inner.appendChild(c);C.push(c)}
var first=true;
ScrollDemo(box,function(p,top){H=box.clientHeight||380;if(first||reduce){sm=top;first=false}else sm+=(top-sm)*.1;
 inner.style.transform='translateY('+(top-sm).toFixed(2)+'px)';
 var mid=top+H/2;for(var i=0;i<N;i++){var cy=H/2-CH/2+i*(CH+GAP)+CH/2,sd=(cy-(sm+H/2))/(CH+GAP),a=Math.abs(sd);
  C[i].style.transform=reduce?'none':'rotateX('+(sd*-34).toFixed(2)+'deg) translateZ('+(-a*150).toFixed(1)+'px) scale('+(1-a*.08).toFixed(3)+')';C[i].style.opacity=reduce?'1':Math.max(.15,1-a*.55).toFixed(3);C[i].style.zIndex=String(50-Math.round(a*10))}
 bar.style.top=(p*80)+'%'});})();`},

{id:'s-spring-waves',title:'Spring ripple dots',component:'Spring ripple dots',key:'spring-waves',family,width:780,
 description:'A field of dots that answer a click with a wave of damped springs, each dot kicked later the further it is from the touch.',
 prompt:'Build a canvas dot field (13 columns by 7 rows, spacing 48px) where each dot is a damped spring. A click or tap (and an automatic one every 2.6 seconds until the visitor interacts) records an origin and a time. Every dot then receives an impulse when the wave front reaches it: delay = distance / 0.45 px per ms, impulse direction away from the origin, strength 7 * (1 - distance / 620) clamped to at least 1.2. Each dot integrates pos += vel; vel += -0.085 * pos - 0.06 * vel (so it overshoots and rings) with offset magnitude driving the dot size (base 4px up to 9px) and the colour from slate to accent. Hovering with the pointer also nudges nearby dots gently. Draw faint links between each dot and its right and lower neighbours when they are displaced. Pause off-screen; reduced motion draws a still field with a single small wave frozen. Vanilla HTML, CSS and JavaScript.',
 css:`.sw{position:relative;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:#0a0c16;cursor:pointer}
.sw canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="sw" role="img" aria-label="Field of dots with spring waves; click to send a ripple"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sw'),cv=root.querySelector('canvas');
${BOOT}
var COLS=13,ROWS=7,SP=48,D=[],waves=[],lastAuto=0,touched=false;
function layout(s){D=[];var ox=(s.W-(COLS-1)*SP)/2,oy=(s.H-(ROWS-1)*SP)/2;for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)D.push({hx:ox+c*SP,hy:oy+r*SP,x:0,y:0,vx:0,vy:0,fired:-1})}
function fire(x,y,t){waves.push({x:x,y:y,t:t})}
var s=Stage(root,cv,function(s){var c=s.ctx;if(!D.length)layout(s);
 if(!touched&&!reduce&&s.t-lastAuto>2600){lastAuto=s.t;fire(s.W*(.2+Math.random()*.6),s.H*(.25+Math.random()*.5),s.t)}
 if(reduce&&!waves.length)fire(s.W/2,s.H/2,s.t-420);
 c.fillStyle='#0a0c16';c.fillRect(0,0,s.W,s.H);
 for(var i=0;i<D.length;i++){var d=D[i];
  for(var w=0;w<waves.length;w++){var W=waves[w],dx=d.hx-W.x,dy=d.hy-W.y,dist=Math.sqrt(dx*dx+dy*dy);if(d.fired!==W.t&&s.t-W.t>=dist/.45){d.fired=W.t;var k=Math.max(1.2,7*(1-dist/620)),n=dist+1;d.vx+=dx/n*k;d.vy+=dy/n*k}}
  if(s.inside&&!reduce){var hx=d.hx+d.x-s.x,hy=d.hy+d.y-s.y,hd=Math.sqrt(hx*hx+hy*hy);if(hd<90){var hk=(1-hd/90)*.5;d.vx+=hx/(hd+1)*hk;d.vy+=hy/(hd+1)*hk}}
  var ax=-.085*d.x-.06*d.vx,ay=-.085*d.y-.06*d.vy;d.vx+=ax;d.vy+=ay;d.x+=d.vx*(s.dt/16);d.y+=d.vy*(s.dt/16)}
 waves=waves.filter(function(w){return s.t-w.t<5000});
 c.lineWidth=1;
 for(var r=0;r<ROWS;r++)for(var q=0;q<COLS;q++){var a=D[r*COLS+q],m=Math.min(1,Math.sqrt(a.x*a.x+a.y*a.y)/14);
  if(m>.04){c.strokeStyle='rgba(165,151,255,'+(m*.45).toFixed(3)+')';if(q<COLS-1){var b=D[r*COLS+q+1];c.beginPath();c.moveTo(a.hx+a.x,a.hy+a.y);c.lineTo(b.hx+b.x,b.hy+b.y);c.stroke()}if(r<ROWS-1){var e=D[(r+1)*COLS+q];c.beginPath();c.moveTo(a.hx+a.x,a.hy+a.y);c.lineTo(e.hx+e.x,e.hy+e.y);c.stroke()}}}
 for(var j=0;j<D.length;j++){var p=D[j],mg=Math.min(1,Math.sqrt(p.x*p.x+p.y*p.y)/16),rad=4+mg*5;c.fillStyle='rgb('+Math.round(94+mg*(165-94))+','+Math.round(105+mg*(151-105))+','+Math.round(140+mg*(255-140))+')';c.beginPath();c.arc(p.hx+p.x,p.hy+p.y,rad,0,6.283);c.fill()}
 },function(s){layout(s)});
s.click=function(x,y){touched=true;fire(x,y,s.t)};
})();`},

{id:'s-hud-scope',title:'HUD scope',component:'HUD scope',key:'hud-scope',family,width:780,
 description:'A sci-fi targeting display: counter-rotating tick rings, a radar sweep that lights up blips, live readouts and a lock-on crosshair.',
 prompt:'Build a canvas HUD on a near-black blue background. Centre: concentric rings with different radii; the outer ring carries 72 tick marks rotating slowly clockwise, the middle one 36 ticks rotating counter-clockwise and the inner is a dashed circle. A radar sweep (a rotating wedge with a fading gradient trail) turns once every 4 seconds; 14 blips sit at random polar positions and light up when the sweep passes, fading afterwards. The pointer (or a roaming virtual target) places a crosshair: four animated brackets close in on it, a line connects it to the centre and a readout beside it shows bearing in degrees and range in metres, updated live; the nearest blip is highlighted with a lock box. Left and right columns show monospaced readouts (a small bar graph, scrolling hex digits, a rolling counter). Colours: cyan 0,229,255 with amber 255,184,0 for the lock. Pause off-screen; reduced motion renders a still frame. Vanilla HTML, CSS and JavaScript.',
 css:`.hd{position:relative;height:390px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:radial-gradient(100% 100% at 50% 50%,#08202d,#030913);cursor:crosshair}
.hd canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="hd" role="img" aria-label="Sci-fi targeting display with radar sweep"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.hd'),cv=root.querySelector('canvas');
${BOOT}
var B=[],hex=[],lockT=0;for(var i=0;i<14;i++)B.push({a:Math.random()*6.283,r:.2+Math.random()*.75,lit:0});
for(var h=0;h<9;h++)hex.push(Math.floor(Math.random()*65535));
var CY='0,229,255',AM='255,184,0';
function ring(c,cx,cy,r,n,len,rot,w){c.lineWidth=w||1;for(var i=0;i<n;i++){var a=rot+i/n*6.283,l=i%6===0?len*1.7:len;c.beginPath();c.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);c.lineTo(cx+Math.cos(a)*(r-l),cy+Math.sin(a)*(r-l));c.stroke()}}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H,cx=W/2,cy=H/2,R=Math.min(W,H)*.42,t=reduce?1.3:s.t/1000;c.clearRect(0,0,W,H);
 c.strokeStyle='rgba('+CY+',.18)';c.lineWidth=1;for(var g=-6;g<=6;g++){c.beginPath();c.moveTo(cx+g*60,0);c.lineTo(cx+g*60,H);c.stroke();c.beginPath();c.moveTo(0,cy+g*60);c.lineTo(W,cy+g*60);c.stroke()}
 c.strokeStyle='rgba('+CY+',.55)';ring(c,cx,cy,R,72,6,t*.12,1);c.strokeStyle='rgba('+CY+',.4)';ring(c,cx,cy,R*.78,36,5,-t*.2,1);
 c.strokeStyle='rgba('+CY+',.5)';c.beginPath();c.arc(cx,cy,R+10,0,6.283);c.stroke();c.setLineDash([4,6]);c.beginPath();c.arc(cx,cy,R*.52,0,6.283);c.stroke();c.setLineDash([]);c.beginPath();c.arc(cx,cy,R*.25,0,6.283);c.stroke();
 c.beginPath();c.moveTo(cx-R-18,cy);c.lineTo(cx+R+18,cy);c.moveTo(cx,cy-R-18);c.lineTo(cx,cy+R+18);c.strokeStyle='rgba('+CY+',.22)';c.stroke();
 var sw=(t/4*6.283)%6.283;
 for(var k=0;k<40;k++){var a0=sw-k*.028,al=(1-k/40)*.32;c.fillStyle='rgba('+CY+','+al.toFixed(3)+')';c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R*.98,a0-.03,a0,false);c.closePath();c.fill()}
 c.strokeStyle='rgba('+CY+',.9)';c.lineWidth=1.5;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(sw)*R*.98,cy+Math.sin(sw)*R*.98);c.stroke();
 var tx=s.inside?s.x:s.x,ty=s.y,best=-1,bd=1e9;
 for(var i=0;i<B.length;i++){var b=B[i],bx=cx+Math.cos(b.a)*b.r*R,by=cy+Math.sin(b.a)*b.r*R,da=((sw-b.a)%6.283+6.283)%6.283;if(da<.12)b.lit=1;b.lit=Math.max(reduce?.8:0,b.lit-.006*(s.dt/16));
  if(b.lit>0){c.fillStyle='rgba('+CY+','+(b.lit*.9).toFixed(3)+')';c.beginPath();c.arc(bx,by,2.4+b.lit*2,0,6.283);c.fill()}
  var d=Math.hypot(bx-tx,by-ty);if(d<bd){bd=d;best=i}}
 if(best>=0&&bd<90){var bb=B[best],bx2=cx+Math.cos(bb.a)*bb.r*R,by2=cy+Math.sin(bb.a)*bb.r*R,sz=12+Math.sin(t*6)*2;lockT=Math.min(1,lockT+.08);c.strokeStyle='rgba('+AM+','+lockT+')';c.lineWidth=1.5;
  c.strokeRect(bx2-sz,by2-sz,sz*2,sz*2);c.font='11px ui-monospace,monospace';c.fillStyle='rgba('+AM+','+lockT+')';c.fillText('LOCK '+('0'+(best+1)).slice(-2),bx2+sz+6,by2-sz+10)}else lockT=Math.max(0,lockT-.1);
 var cl=10+Math.max(0,24-Math.hypot(s.vx,s.vy)*1.2)+Math.sin(t*5)*2;c.strokeStyle='rgba('+CY+',.95)';c.lineWidth=1.5;
 [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){c.beginPath();c.moveTo(tx+q[0]*cl,ty+q[1]*(cl-9));c.lineTo(tx+q[0]*cl,ty+q[1]*cl);c.lineTo(tx+q[0]*(cl-9),ty+q[1]*cl);c.stroke()});
 c.setLineDash([3,5]);c.strokeStyle='rgba('+CY+',.35)';c.beginPath();c.moveTo(cx,cy);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);
 var brg=((Math.atan2(tx-cx,-(ty-cy))*180/Math.PI)+360)%360,rng=Math.hypot(tx-cx,ty-cy)/R*4200;
 c.font='11px ui-monospace,monospace';c.fillStyle='rgba('+CY+',.95)';c.fillText('BRG '+('00'+Math.round(brg)).slice(-3)+'\\u00b0',tx+cl+8,ty-4);c.fillText('RNG '+Math.round(rng)+' M',tx+cl+8,ty+10);
 c.fillStyle='rgba('+CY+',.8)';c.font='10px ui-monospace,monospace';
 for(var q=0;q<9;q++){if(!reduce&&Math.random()<.04)hex[q]=Math.floor(Math.random()*65535);c.fillText(('0000'+hex[q].toString(16)).slice(-4).toUpperCase()+' '+('0000'+(hex[(q+3)%9]).toString(16)).slice(-4).toUpperCase(),24,44+q*16)}
 for(var bq=0;bq<8;bq++){var v=.35+.55*Math.abs(Math.sin(t*.9+bq*1.7)),bw=90;c.strokeStyle='rgba('+CY+',.5)';c.strokeRect(W-24-bw,40+bq*15,bw,7);c.fillStyle='rgba('+CY+',.8)';c.fillRect(W-24-bw,40+bq*15,bw*v,7)}
 c.fillStyle='rgba('+CY+',.9)';c.font='700 12px ui-monospace,monospace';c.fillText('SCAN '+(100+Math.floor(t*37)%900),24,H-24);c.fillText('TRACKS '+B.filter(function(b){return b.lit>.2}).length+'/14',W-130,H-24);
 });
})();`},

{id:'s-tween-editor',title:'Tween editor',component:'Tween editor',key:'tween-editor',family,width:780,
 description:'A tiny live tween editor: pick an ease, set distance, rotation and scale, watch the box play it, and copy the exact Web Animations code.',
 prompt:'Build a compact tween editor card. Left column controls: an ease select (Ease out cubic, Ease in-out, Back out, Expo out, Spring, Bounce) as a segmented radio group, range sliders for Duration (200 to 2000ms), Distance (60 to 360px), Rotation (0 to 360deg) and Scale (0.5 to 2), and a Yoyo checkbox. Right column: a track with a rounded square that plays the tween when Play is pressed (and once whenever a control changes, debounced 250ms), plus a small SVG curve preview of the easing and a read-only code block showing the exact element.animate([...], {...}) call with the real keyframes, duration and easing. Easings: cubic-bezier strings for the first four; Spring and Bounce are generated as CSS linear() lists from small simulations (about 40 points each). Playback uses the Web Animations API and honours reduced motion by jumping to the end state. Copy button writes the code to the clipboard with a short Copied message. Vanilla HTML, CSS and JavaScript.',
 css:`.te{display:grid;grid-template-columns:230px 1fr;gap:18px;padding:18px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.te-ctl{display:grid;gap:12px;align-content:start}
.te-ctl label{display:grid;gap:4px;font:600 12px/1.2 system-ui;color:var(--sc-muted)}
.te-ctl label span{display:flex;justify-content:space-between}
.te-ctl label output{font:700 12px/1 ui-monospace,monospace;color:var(--sc-fg)}
.te-ctl input[type=range]{width:100%;accent-color:var(--sc-accent)}
.te-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.te-seg label{position:relative;cursor:pointer}
.te-seg input{position:absolute;opacity:0}
.te-seg span{display:block;padding:7px 8px;border:1px solid var(--sc-line);border-radius:10px;background:var(--sc-bg);text-align:center;font:700 12px/1 system-ui;color:var(--sc-fg)}
.te-seg input:checked+span{background:var(--sc-accent);border-color:var(--sc-accent);color:var(--sc-accent-fg)}
.te-seg input:focus-visible+span{outline:2px solid var(--sc-ring);outline-offset:2px}
.te-main{display:grid;gap:12px;min-width:0}
.te-track{position:relative;height:96px;border-radius:16px;background:var(--sc-bg);border:1px solid var(--sc-line);overflow:hidden}
.te-box{position:absolute;left:14px;top:50%;width:44px;height:44px;margin-top:-22px;border-radius:12px;background:linear-gradient(135deg,var(--sc-accent),#ff6bb5);box-shadow:0 10px 18px -8px var(--sc-accent)}
.te-row{display:flex;gap:10px;align-items:center}
.te-play{padding:9px 16px;border:0;border-radius:999px;background:var(--sc-fg);color:var(--sc-bg);font:700 13px/1 system-ui;cursor:pointer}
.te-copy{padding:9px 14px;border:1px solid var(--sc-line);border-radius:999px;background:transparent;color:var(--sc-fg);font:700 13px/1 system-ui;cursor:pointer}
.te-curve{width:120px;height:64px;flex:none;border:1px solid var(--sc-line);border-radius:10px;background:var(--sc-bg)}
.te-code{margin:0;padding:12px;border-radius:12px;background:var(--sc-bg);border:1px solid var(--sc-line);font:500 11px/1.5 ui-monospace,monospace;color:var(--sc-fg);overflow:auto;white-space:pre;max-height:136px}
.te-msg{font:600 12px/1 system-ui;color:var(--sc-accent);min-width:50px}
@media (max-width:640px){.te{grid-template-columns:1fr}}`,
 html:`<div class="te"><div class="te-ctl"><div class="te-seg" role="radiogroup" aria-label="Ease"><label><input type="radio" name="te-ease" value="0" checked><span>Ease out</span></label><label><input type="radio" name="te-ease" value="1"><span>In-out</span></label><label><input type="radio" name="te-ease" value="2"><span>Back out</span></label><label><input type="radio" name="te-ease" value="3"><span>Expo out</span></label><label><input type="radio" name="te-ease" value="4"><span>Spring</span></label><label><input type="radio" name="te-ease" value="5"><span>Bounce</span></label></div><label><span>Duration <output>900ms</output></span><input type="range" data-k="dur" min="200" max="2000" step="50" value="900"></label><label><span>Distance <output>240px</output></span><input type="range" data-k="dist" min="60" max="360" step="10" value="240"></label><label><span>Rotation <output>180deg</output></span><input type="range" data-k="rot" min="0" max="360" step="15" value="180"></label><label><span>Scale <output>1.3</output></span><input type="range" data-k="sc" min="0.5" max="2" step="0.1" value="1.3"></label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="te-yo" checked> Yoyo</label></div><div class="te-main"><div class="te-track"><div class="te-box"></div></div><div class="te-row"><button class="te-play" type="button">Play</button><button class="te-copy" type="button">Copy code</button><span class="te-msg" aria-live="polite"></span><svg class="te-curve" viewBox="0 0 120 64" aria-hidden="true"><path class="te-cp" d="" fill="none" stroke="var(--sc-accent)" stroke-width="2.5" stroke-linecap="round"/></svg></div><pre class="te-code"></pre></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.te'),box=root.querySelector('.te-box'),code=root.querySelector('.te-code'),cp=root.querySelector('.te-cp'),msg=root.querySelector('.te-msg'),yo=root.querySelector('.te-yo'),track=root.querySelector('.te-track');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,V={dur:900,dist:240,rot:180,sc:1.3},ease=0,anim=null,deb=0;
function lin(fn,n){var a=[];for(var i=0;i<=n;i++)a.push(+fn(i/n).toFixed(4));return 'linear('+a.join(', ')+')'}
function spring(t){return 1-Math.exp(-6.4*t)*Math.cos(t*Math.PI*3.4)}
function bounce(t){var n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375}t-=2.625/d;return n*t*t+.984375}
var E=[{n:'ease-out',css:'cubic-bezier(0.22, 1, 0.36, 1)',f:function(t){return 1-Math.pow(1-t,3)}},{n:'in-out',css:'cubic-bezier(0.65, 0, 0.35, 1)',f:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}},{n:'back-out',css:'cubic-bezier(0.34, 1.56, 0.64, 1)',f:function(t){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}},{n:'expo-out',css:'cubic-bezier(0.16, 1, 0.3, 1)',f:function(t){return t===1?1:1-Math.pow(2,-10*t)}},{n:'spring',css:lin(spring,40),f:spring},{n:'bounce',css:lin(bounce,40),f:bounce}];
function snippet(){var e=E[ease],d=Math.min(V.dist,Math.max(40,track.clientWidth-90));return 'box.animate([\\n  { transform: "translateX(0) rotate(0deg) scale(1)" },\\n  { transform: "translateX('+d+'px) rotate('+V.rot+'deg) scale('+V.sc+')" }\\n], {\\n  duration: '+V.dur+',\\n  easing: "'+(e.css.length>60?e.css.slice(0,52)+'...)':e.css)+'",\\n  fill: "forwards"'+(yo.checked?',\\n  direction: "alternate",\\n  iterations: 2':'')+'\\n});'}
function realCode(){return snippet().replace(/easing: ".*"/,'easing: "'+E[ease].css+'"')}
function drawCurve(){var f=E[ease].f,p='';for(var i=0;i<=60;i++){var t=i/60,y=f(t);p+=(i?'L':'M')+(6+t*108).toFixed(1)+' '+(52-y*34).toFixed(1)+' '}cp.setAttribute('d',p)}
function refresh(){code.textContent=snippet();drawCurve()}
function play(){if(anim)anim.cancel();var d=Math.min(V.dist,Math.max(40,track.clientWidth-90)),to='translateX('+d+'px) rotate('+V.rot+'deg) scale('+V.sc+')';
 if(reduce){box.style.transform=to;return}
 anim=box.animate([{transform:'translateX(0) rotate(0deg) scale(1)'},{transform:to}],{duration:V.dur,easing:E[ease].css,fill:'forwards',direction:yo.checked?'alternate':'normal',iterations:yo.checked?2:1})}
function again(){clearTimeout(deb);deb=setTimeout(play,250)}
root.querySelectorAll('input[name=te-ease]').forEach(function(r){r.addEventListener('change',function(){ease=+r.value;refresh();again()})});
root.querySelectorAll('input[type=range]').forEach(function(r){r.addEventListener('input',function(){V[r.dataset.k]=+r.value;var o=r.parentNode.querySelector('output');o.textContent=r.dataset.k==='dur'?r.value+'ms':r.dataset.k==='dist'?r.value+'px':r.dataset.k==='rot'?r.value+'deg':r.value;refresh();again()})});
yo.addEventListener('change',function(){refresh();again()});
root.querySelector('.te-play').addEventListener('click',play);
root.querySelector('.te-copy').addEventListener('click',function(){var t=realCode();function ok(){msg.textContent='Copied';setTimeout(function(){msg.textContent=''},1400)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){msg.textContent='Select to copy'})}else msg.textContent='Select to copy'});
refresh();setTimeout(play,500);})();`},

{id:'s-jello-blob',title:'Jello blob',component:'Jello blob',key:'jello-blob',family,width:780,
 description:'A soft-body blob made of 28 springy points: it squashes under the pointer, wobbles after every kick and chases your cursor like jelly.',
 prompt:'Build a canvas soft-body blob. 28 points sit on a circle of base radius 78px around a centre that chases the pointer (or a roaming virtual target) with a spring (stiffness 0.04, damping 0.86). Each point has a radial offset r and velocity; every frame: spring back to 0 (k 0.06), couple to its two neighbours (0.22 of the difference), apply damping 0.9, and add a stretch term from the centre velocity projected on the point normal so the blob lags and squashes when moving. When the pointer is inside or near the blob, points closest to it are pushed inward. Click or tap kicks every point with a random impulse of up to 14px and the centre with a small jump. The outline is drawn as a smooth closed curve through midpoints with a radial gradient (accent to magenta), a glossy highlight crescent and a soft ground shadow that scales with height. Pause off-screen; reduced motion shows a static round blob. Vanilla HTML, CSS and JavaScript.',
 css:`.jb{position:relative;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:radial-gradient(120% 100% at 50% 0%,#241b4b,#0a0814);cursor:none}
.jb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="jb" role="img" aria-label="A jelly blob that follows the pointer"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.jb'),cv=root.querySelector('canvas');
${BOOT}
var N=28,P=[],bx=0,by=0,bvx=0,bvy=0,R0=78,ready=false;for(var i=0;i<N;i++)P.push({r:0,v:0});
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H;if(!ready){bx=W/2;by=H/2;ready=true}
 c.clearRect(0,0,W,H);
 if(!reduce){bvx+=(s.x-bx)*.04;bvy+=(s.y-by)*.04;bvx*=.86;bvy*=.86;bx+=bvx;by+=bvy}
 var sp=Math.sqrt(bvx*bvx+bvy*bvy);
 var near=Math.hypot(s.x-bx,s.y-by)<R0+20&&s.inside;
 for(var i=0;i<N;i++){var a=i/N*6.283,nx=Math.cos(a),ny=Math.sin(a),p=P[i],pr=P[(i+N-1)%N],nx2=P[(i+1)%N];
  var f=-.06*p.r+.22*((pr.r+nx2.r)/2-p.r);f-=(bvx*nx+bvy*ny)*.09;
  if(near){var px=bx+nx*(R0+p.r)-s.x,py=by+ny*(R0+p.r)-s.y,d=Math.sqrt(px*px+py*py);if(d<60)f-=(1-d/60)*5}
  p.v=(p.v+f)*.9;if(reduce)p.v=0}
 for(var j=0;j<N;j++){if(!reduce)P[j].r+=P[j].v;if(P[j].r>38)P[j].r=38;if(P[j].r<-38)P[j].r=-38}
 var squash=Math.min(.35,sp*.02);
 c.save();c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(bx,H*.92,R0*(1.1-squash),12,0,0,6.283);c.fill();c.restore();
 var pts=[];for(var k=0;k<N;k++){var ag=k/N*6.283,rr=R0+P[k].r;pts.push([bx+Math.cos(ag)*rr*(1+squash*Math.abs(bvx)/(sp+1)),by+Math.sin(ag)*rr*(1+squash*Math.abs(bvy)/(sp+1))])}
 c.beginPath();for(var m=0;m<N;m++){var a0=pts[m],a1=pts[(m+1)%N],mx=(a0[0]+a1[0])/2,my=(a0[1]+a1[1])/2;if(m===0)c.moveTo(mx,my);else c.quadraticCurveTo(a0[0],a0[1],mx,my)}
 var f0=pts[0],f1=pts[1];c.quadraticCurveTo(f0[0],f0[1],(f0[0]+f1[0])/2,(f0[1]+f1[1])/2);c.closePath();
 var g=c.createRadialGradient(bx-R0*.3,by-R0*.4,R0*.1,bx,by,R0*1.25);g.addColorStop(0,'#c9bfff');g.addColorStop(.45,'#7a68ff');g.addColorStop(1,'#d63fa4');c.fillStyle=g;c.fill();
 c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.stroke();
 c.save();c.globalAlpha=.5;c.fillStyle='#fff';c.beginPath();c.ellipse(bx-R0*.36,by-R0*.4,R0*.2,R0*.1,-.6,0,6.283);c.fill();c.restore();
 c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(s.x,s.y,4,0,6.283);c.fill();
 });
s.click=function(){for(var i=0;i<N;i++)P[i].v+=(Math.random()-.5)*28;bvx+=(Math.random()-.5)*14;bvy-=8};
})();`},

{id:'s-alphabet-soup',title:'Alphabet soup',component:'Alphabet soup',key:'alphabet-soup',family,width:780,
 description:'Letters floating in a bowl with real collisions: stir with the pointer and they swirl, bump and settle back into the broth.',
 prompt:'Build a canvas physics toy: a round bowl of broth (radius 150px) with 26 letter tokens (circles of radius 15) tumbling inside. Each frame every token gets a slight gravity, damping 0.992 and integration; pairwise circle-circle collisions are resolved over 3 iterations by positional correction and an exchange of normal velocity with restitution 0.45; the bowl wall keeps tokens inside (position clamp and reflected velocity, restitution 0.35). A pointer inside the bowl (or a virtual spoon doing slow circles when idle) stirs: tokens within 70px of the spoon get a tangential push around the bowl centre plus a push away from the spoon. Tokens are drawn as cream discs with a coloured letter (hue by index), a tiny shadow and a rotation that follows their angular velocity. The bowl has a rim, a warm broth gradient with a gentle surface shimmer and a highlight. Click drops a small splash that kicks nearby tokens. Pause off-screen; reduced motion draws the settled bowl once. Vanilla HTML, CSS and JavaScript.',
 css:`.as{position:relative;height:400px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:radial-gradient(100% 100% at 50% 0%,#3a2a20,#17100c);cursor:crosshair}
.as canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="as" role="img" aria-label="Letters floating in a bowl of soup, stirred by the pointer"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.as'),cv=root.querySelector('canvas');
${BOOT}
var N=26,T=[],R=15,spoonA=0,lx=0,ly=0,ready=false,splash=[];
function seed(s){T=[];var cx=s.W/2,cy=s.H/2+10,BR=Math.min(150,Math.min(s.W,s.H)*.36);for(var i=0;i<N;i++){var a=Math.random()*6.283,d=Math.sqrt(Math.random())*(BR-R-6);T.push({ch:String.fromCharCode(65+i),x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,vx:0,vy:0,a:Math.random()*6.28,w:0})}ready=true}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H,cx=W/2,cy=H/2+10,BR=Math.min(150,Math.min(s.W,s.H)*.36);if(!ready)seed(s);
 c.clearRect(0,0,W,H);
 var sx=s.x,sy=s.y;if(!s.inside){spoonA+=.012;sx=cx+Math.cos(spoonA)*BR*.55;sy=cy+Math.sin(spoonA)*BR*.55}
 var svx=sx-lx,svy=sy-ly;lx=sx;ly=sy;
 if(!reduce)for(var it=0;it<1;it++){
  for(var i=0;i<N;i++){var t=T[i];t.vy+=.012;
   var dx=t.x-sx,dy=t.y-sy,d=Math.sqrt(dx*dx+dy*dy)+.1;
   if(d<70&&Math.hypot(sx-cx,sy-cy)<BR){var k=(1-d/70),rx=t.x-cx,ry=t.y-cy,rl=Math.sqrt(rx*rx+ry*ry)+.1;t.vx+=(-ry/rl)*k*.5*(s.inside?1:.6)+dx/d*k*.28+svx*.07*k;t.vy+=(rx/rl)*k*.5*(s.inside?1:.6)+dy/d*k*.28+svy*.07*k;t.w+=k*.01}
   t.vx*=.992;t.vy*=.992;t.w*=.97;t.x+=t.vx;t.y+=t.vy;t.a+=t.w+t.vx*.01}
  for(var p=0;p<3;p++){
   for(var a=0;a<N;a++)for(var b=a+1;b<N;b++){var A=T[a],B=T[b],ex=B.x-A.x,ey=B.y-A.y,ed=Math.sqrt(ex*ex+ey*ey);if(ed<R*2&&ed>.001){var nx=ex/ed,ny=ey/ed,ov=(R*2-ed)/2;A.x-=nx*ov;A.y-=ny*ov;B.x+=nx*ov;B.y+=ny*ov;var rv=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny;if(rv<0){var jj=-(1+.45)*rv/2;A.vx-=jj*nx;A.vy-=jj*ny;B.vx+=jj*nx;B.vy+=jj*ny}}}
   for(var q=0;q<N;q++){var u=T[q],wx=u.x-cx,wy=u.y-cy,wd=Math.sqrt(wx*wx+wy*wy),lim=BR-R-2;if(wd>lim){var wnx=wx/wd,wny=wy/wd;u.x=cx+wnx*lim;u.y=cy+wny*lim;var vn=u.vx*wnx+u.vy*wny;if(vn>0){u.vx-=(1+.35)*vn*wnx;u.vy-=(1+.35)*vn*wny}}}}}
 var rim=c.createRadialGradient(cx,cy-BR*.2,BR*.2,cx,cy,BR+22);rim.addColorStop(0,'#e9d2b0');rim.addColorStop(.86,'#cfae83');rim.addColorStop(1,'#8d6a43');
 c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(cx,cy+BR+20,BR*1.05,16,0,0,6.283);c.fill();
 c.fillStyle=rim;c.beginPath();c.arc(cx,cy,BR+18,0,6.283);c.fill();
 var br=c.createRadialGradient(cx-BR*.25,cy-BR*.3,BR*.1,cx,cy,BR);br.addColorStop(0,'#f2b254');br.addColorStop(.7,'#d97c2d');br.addColorStop(1,'#9b4a1a');c.fillStyle=br;c.beginPath();c.arc(cx,cy,BR,0,6.283);c.fill();
 c.save();c.beginPath();c.arc(cx,cy,BR,0,6.283);c.clip();c.strokeStyle='rgba(255,230,170,.18)';c.lineWidth=2;for(var rr=0;rr<5;rr++){c.beginPath();c.ellipse(cx+Math.sin(s.t*.0006+rr)*6,cy+Math.cos(s.t*.0005+rr)*5,BR*(.3+rr*.16),BR*(.22+rr*.12),0,0,6.283);c.stroke()}
 for(var m=0;m<N;m++){var t2=T[m];c.save();c.translate(t2.x,t2.y);c.rotate(t2.a);c.fillStyle='rgba(60,25,5,.35)';c.beginPath();c.arc(1.5,2.5,R,0,6.283);c.fill();c.fillStyle='#fff5e2';c.beginPath();c.arc(0,0,R,0,6.283);c.fill();c.fillStyle='hsl('+(m*47%360)+' 62% 42%)';c.font='800 19px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t2.ch,0,1);c.restore()}
 splash=splash.filter(function(p){return s.t-p.t<500});splash.forEach(function(p){var k=(s.t-p.t)/500;c.strokeStyle='rgba(255,240,200,'+(1-k)*.8+')';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,6+k*50,0,6.283);c.stroke()});
 c.restore();
 var hl=c.createRadialGradient(cx-BR*.4,cy-BR*.5,2,cx-BR*.4,cy-BR*.5,BR*.5);hl.addColorStop(0,'rgba(255,255,255,.28)');hl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=hl;c.beginPath();c.arc(cx,cy,BR,0,6.283);c.fill();
 },function(s){seed(s)});
s.click=function(x,y){splash.push({x:x,y:y,t:s.t});T.forEach(function(t){var dx=t.x-x,dy=t.y-y,d=Math.sqrt(dx*dx+dy*dy)+1;if(d<90){var k=(1-d/90)*3.2;t.vx+=dx/d*k;t.vy+=dy/d*k;t.w+=(Math.random()-.5)*.2}})};
})();`},

{id:'s-scramble-field',title:'Scramble field',component:'Scramble field',key:'scramble-field',family,width:780,
 description:'A paragraph that glitches around your pointer: letters inside a soft radius scramble through random glyphs and resolve when you leave.',
 prompt:'Build an interactive text block set in a large monospaced style (about 26px, 4 lines of 28 characters). Every character is a span; on resize and when it becomes visible measure each span centre once and cache it. A virtual pointer (the real pointer when inside, otherwise a Lissajous path) drives a radius of 96px. Characters within the radius enter a scramble state: they swap to random glyphs from "!<>-_/[]{}=+*^?#" every 55ms, turning the accent colour and slightly lifting; characters outside return to their true letter with a short resolve (they flicker 3 random glyphs at 40ms steps before settling) and the original colour. The click burst scrambles the entire block for 600ms with a left-to-right wave, then resolves. The block has an aria-label with the true sentence and the spans are aria-hidden, so assistive tech reads the real text. Pause off-screen; reduced motion shows the true text without any scrambling. Vanilla HTML, CSS and JavaScript.',
 css:`.sf{position:relative;display:grid;place-items:center;height:360px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair}
.sf-t{font:700 26px/1.55 ui-monospace,"SF Mono","Cascadia Code",Menlo,monospace;letter-spacing:.02em;color:var(--sc-fg);white-space:pre;user-select:none}
.sf-t i{font-style:normal;display:inline-block;transition:color .15s,transform .15s}
.sf-t i.on{color:var(--sc-accent);transform:translateY(-2px)}`,
 html:`<div class="sf"><div class="sf-t" role="text" aria-label="Motion is a language that every interface already speaks."></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sf'),tx=root.querySelector('.sf-t');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,LINES=['Motion is a language','that every interface','already speaks, so make','it speak clearly.'],G='!<>-_/[]{}=+*^?#',S=[],px=0,py=0,inside=false,raf=0,visible=true,burst=-1,t0=0;
LINES.forEach(function(l,li){for(var i=0;i<l.length;i++){var e=document.createElement('i');e.setAttribute('aria-hidden','true');e.textContent=l.charAt(i);tx.appendChild(e);S.push({el:e,ch:l.charAt(i),x:0,y:0,state:0,next:0,left:0,li:li,i:i})}if(li<LINES.length-1)tx.appendChild(document.createTextNode('\\n'))});
function measure(){var r=root.getBoundingClientRect();S.forEach(function(o){var b=o.el.getBoundingClientRect();o.x=b.left-r.left+b.width/2;o.y=b.top-r.top+b.height/2})}
function frame(now){raf=0;var x=px,y=py,W=root.clientWidth,H=root.clientHeight;if(!inside){x=W*(.5+.36*Math.sin(now*.0006));y=H*(.5+.28*Math.sin(now*.0009+1))}
 S.forEach(function(o,idx){var d=Math.hypot(o.x-x,o.y-y),hit=d<96&&o.ch!==' ',wave=burst>=0&&now-burst>idx*12&&now-burst<idx*12+600;
  if(o.ch===' ')return;
  if(hit||wave){o.state=1;o.left=3;if(now>o.next){o.next=now+55;o.el.textContent=G.charAt(Math.floor(Math.random()*G.length));o.el.className='on'}}
  else if(o.state===1){o.state=2}
  if(o.state===2){if(now>o.next){o.next=now+40;if(o.left-->0){o.el.textContent=G.charAt(Math.floor(Math.random()*G.length))}else{o.el.textContent=o.ch;o.el.className='';o.state=0}}}});
 if(burst>=0&&now-burst>S.length*12+700)burst=-1;
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;inside=true});
root.addEventListener('pointerleave',function(){inside=false});
root.addEventListener('pointerdown',function(){if(!reduce)burst=performance.now()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible){measure();go()}}).observe(root);
if('ResizeObserver' in window)new ResizeObserver(function(){measure()}).observe(root);
setTimeout(function(){measure();go()},60);})();`}
];
