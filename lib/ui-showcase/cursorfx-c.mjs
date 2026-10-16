// Original cursor effects, part three: tile pour, pixel swarm, ribbon, goo, photo trail, stardust and warp mesh.
import {BOOT} from './cursorfx-boot.mjs';
const family='Cursor effects';
const hint=(cls,colour)=>`.${cls}-hint{position:absolute;left:0;right:0;bottom:14px;margin:0;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${colour};pointer-events:none}`;
export const cursorfxC=[
{id:'s-tile-pour',title:'Tile pour',component:'Tile pour',key:'tile-pour',family,width:780,
 description:'A stream of lettered tiles pours after the cursor like a snake and splashes apart when you click.',
 prompt:'Create a chain of 26 rounded square tiles that follow the cursor. The head eases to the cursor (factor 0.35) and every other tile is pulled towards the one in front of it with a distance constraint (spacing 22px, correction 0.55 of the excess) so the chain bends naturally. Tiles shrink from 36px to 18px along the chain, rotate to face the direction to the previous tile, are filled from a violet-to-pink hue ramp and show one glyph each (from the string {}</>#*=+) in a bold monospace font. Clicking splashes the chain: each tile gets a random velocity, gravity and drag for about 40 frames and then rejoins the chain. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.tp{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.tp canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('tp','var(--sc-muted)')}`,
 html:`<div class="tp"><canvas aria-hidden="true"></canvas><p class="tp-hint">Lead the stream · click to splash</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tp'),cv=root.querySelector('canvas');
${BOOT}
var N=26,T=[],glyphs='{}</>#*=+',init=false;
function reset(s){T=[];for(var i=0;i<N;i++)T.push({x:s.x-i*22,y:s.y,vx:0,vy:0,free:0,a:0})}
var s=Stage(root,cv,function(s){var c=s.ctx;if(!T.length)reset(s);c.clearRect(0,0,s.W,s.H);
 T[0].x+=(s.x-T[0].x)*.35;T[0].y+=(s.y-T[0].y)*.35;
 for(var i=1;i<N;i++){var t=T[i],p=T[i-1];if(t.free>0){t.free--;t.vy+=.35;t.vx*=.97;t.vy*=.97;t.x+=t.vx;t.y+=t.vy;if(t.y>s.H-10){t.y=s.H-10;t.vy*=-.5}continue}
  var dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy)||.001;if(d>22){t.x+=dx/d*(d-22)*.55;t.y+=dy/d*(d-22)*.55}t.a=Math.atan2(dy,dx)}
 T[0].a=T[1]?T[1].a+Math.PI:0;
 for(var j=N-1;j>=0;j--){var q=T[j],k=j/(N-1),sz=36-18*k;c.save();c.translate(q.x,q.y);c.rotate(q.a);c.fillStyle='hsl('+(255+k*85)+',84%,'+(58+k*8)+'%)';var h=sz/2,r=sz*.24;c.beginPath();c.moveTo(-h+r,-h);c.arcTo(h,-h,h,h,r);c.arcTo(h,h,-h,h,r);c.arcTo(-h,h,-h,-h,r);c.arcTo(-h,-h,h,-h,r);c.fill();
  c.fillStyle='rgba(255,255,255,.92)';c.font='800 '+Math.round(sz*.6)+'px ui-monospace,SFMono-Regular,Menlo,monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(glyphs.charAt(j%glyphs.length),0,1);c.restore()}},reset);
s.click=function(){for(var i=1;i<N;i++){var t=T[i],a=Math.random()*6.283,sp=4+Math.random()*9;t.vx=Math.cos(a)*sp;t.vy=Math.sin(a)*sp-5;t.free=32+Math.random()*16}};})();`},

{id:'s-pixel-swarm',title:'Pixel swarm',component:'Pixel swarm',key:'pixel-swarm',family,width:780,
 description:'A swarm of crisp square pixels orbits and chases the cursor, scattering when you click.',
 prompt:'Build a swarm of 160 square pixels on a dark canvas. Each pixel has an orbit radius (18-92px), an angular speed (positive or negative) and a phase; every frame its target is the cursor plus radius * (cos, sin) of the phase, it accelerates towards the target with 0.02 times the offset, damps its velocity by 0.9 and moves, with a little size-based lag so large pixels trail behind. Pixel sizes are 3, 4 or 6px, positions are rounded to whole pixels for a crisp retro look and colours come from a cyan, pink, violet and amber palette. Fade the previous frame with a translucent fill so each pixel leaves a short trail. A click scatters the swarm: random velocities up to 14px per frame and a 30 frame period of weak attraction. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.ps{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:#07070d;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.ps canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('ps','#6c6c86')}`,
 html:`<div class="ps"><canvas aria-hidden="true"></canvas><p class="ps-hint">Lead the swarm · click to scatter</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ps'),cv=root.querySelector('canvas');
${BOOT}
var A=[],pal=['#38e8ff','#ff5fb0','#8f6bff','#ffc247'],sizes=[3,4,6];
for(var i=0;i<160;i++)A.push({x:0,y:0,vx:0,vy:0,r:18+Math.random()*74,w:(Math.random()<.5?-1:1)*(.012+Math.random()*.03),ph:Math.random()*6.283,sz:sizes[i%3],c:pal[i%4],lost:0,init:false});
var s=Stage(root,cv,function(s){var c=s.ctx;c.fillStyle='rgba(7,7,13,.32)';c.fillRect(0,0,s.W,s.H);
 A.forEach(function(a){if(!a.init){a.x=s.x+Math.cos(a.ph)*a.r;a.y=s.y+Math.sin(a.ph)*a.r;a.init=true}a.ph+=a.w;var k=a.lost>0?.004:.02/(1+a.sz*.12);if(a.lost>0)a.lost--;
  a.vx+=(s.x+Math.cos(a.ph)*a.r-a.x)*k;a.vy+=(s.y+Math.sin(a.ph)*a.r-a.y)*k;a.vx*=.9;a.vy*=.9;a.x+=a.vx;a.y+=a.vy;c.fillStyle=a.c;c.fillRect(Math.round(a.x),Math.round(a.y),a.sz,a.sz)})});
s.click=function(){A.forEach(function(a){var an=Math.random()*6.283,sp=4+Math.random()*10;a.vx+=Math.cos(an)*sp;a.vy+=Math.sin(an)*sp;a.lost=30})};})();`},

{id:'s-ribbon-trail',title:'Ribbon trail',component:'Ribbon trail',key:'ribbon-trail',family,width:780,
 description:'A gymnast\'s ribbon that streams behind the cursor, tapering and fluttering with its speed.',
 prompt:'Draw a pair of fluttering ribbons behind the cursor. Each ribbon is a chain of 42 nodes: the head eases to the cursor, every other node is pulled towards the previous with a distance constraint (spacing 7px, 0.55 of the excess) and gets a perpendicular sine offset sin(i*0.45 - t*0.012) * i * 0.5 * (0.25 + min(1, speed/10)) for the flutter. Build a polygon from left and right offsets of half-width 12 * (1 - i/N)^0.7 along the node normals, fill it with a linear gradient from the head to the tail (hue 330 to 250, alpha 0.95 to 0.1) and stroke a thin white edge along one side. The second ribbon is shorter (30 nodes), thinner and follows more lazily with a shifted hue. Dark stage, additive blending for the overlap. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.rb{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#141226,#06060b 75%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.rb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('rb','#6c6c86')}`,
 html:`<div class="rb"><canvas aria-hidden="true"></canvas><p class="rb-hint">Fly the ribbon</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rb'),cv=root.querySelector('canvas');
${BOOT}
function chain(n,w,hue,lag){var p=[];for(var i=0;i<n;i++)p.push({x:0,y:0});return {p:p,n:n,w:w,hue:hue,lag:lag,init:false}}
var R=[chain(42,15,330,.45),chain(30,9,205,.3)];
function update(r,s,sp,t){var p=r.p;if(!r.init){p.forEach(function(q){q.x=s.x;q.y=s.y});r.init=true}p[0].x+=(s.x-p[0].x)*r.lag;p[0].y+=(s.y-p[0].y)*r.lag;
 for(var i=1;i<r.n;i++){var dx=p[i-1].x-p[i].x,dy=p[i-1].y-p[i].y,d=Math.hypot(dx,dy)||.001;if(d>7){p[i].x+=dx/d*(d-7)*.55;p[i].y+=dy/d*(d-7)*.55}}}
function draw(c,r,t,sp){var p=r.p,L=[],Rr=[],fl=.4+Math.min(1,sp/10);
 for(var i=0;i<r.n;i++){var a=p[Math.max(0,i-1)],b=p[Math.min(r.n-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,w=r.w*Math.pow(1-i/r.n,.6),off=Math.sin(i*.4-t*.011)*i*.95*fl;
  L.push([p[i].x+nx*(w+off),p[i].y+ny*(w+off)]);Rr.push([p[i].x-nx*(w-off),p[i].y-ny*(w-off)])}
 var g=c.createLinearGradient(p[0].x,p[0].y,p[r.n-1].x,p[r.n-1].y);g.addColorStop(0,'hsla('+r.hue+',92%,66%,.9)');g.addColorStop(.5,'hsla('+(r.hue-40)+',90%,58%,.5)');g.addColorStop(1,'hsla('+(r.hue-80)+',90%,60%,.04)');
 c.fillStyle=g;c.beginPath();c.moveTo(L[0][0],L[0][1]);for(var j=1;j<r.n;j++)c.lineTo(L[j][0],L[j][1]);for(var k=r.n-1;k>=0;k--)c.lineTo(Rr[k][0],Rr[k][1]);c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1;c.beginPath();c.moveTo(p[0].x,p[0].y);for(var m=1;m<r.n;m++)c.lineTo(p[m].x+(L[m][0]-Rr[m][0])*0,p[m].y);c.stroke()}
Stage(root,cv,function(s){var c=s.ctx,sp=Math.hypot(s.vx,s.vy);c.clearRect(0,0,s.W,s.H);c.globalCompositeOperation='lighter';R.forEach(function(r){update(r,s,sp,s.t);draw(c,r,s.t,sp)});c.globalCompositeOperation='source-over';
 var g=c.createRadialGradient(s.x,s.y,0,s.x,s.y,18);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,120,200,0)');c.fillStyle=g;c.fillRect(s.x-20,s.y-20,40,40)});})();`},

{id:'s-goo-cursor',title:'Goo cursor',component:'Goo cursor',key:'goo-cursor',family,width:780,
 description:'A liquid blob that stretches, merges and sheds droplets as it follows the cursor.',
 prompt:'Create a gooey liquid cursor. Draw solid coloured circles on a canvas and run the canvas through an SVG filter (feGaussianBlur stdDeviation 9, then feColorMatrix that multiplies alpha by 22 and subtracts 10) so nearby circles fuse into one smooth surface while keeping their colour. The blob is a head circle (radius 22) that springs to the cursor and eight trailing circles (radius 19 down to 7) that each spring towards the one in front (0.18 stiffness, 0.65 damping), plus four satellites orbiting the head at radius 40 that are pulled towards the direction of travel. Colours run through a violet to pink gradient by index. Click throws seven droplets in random directions that are then pulled back into the head after about 40 frames. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). The SVG filter element is aria-hidden. Vanilla HTML, CSS and JavaScript.',
 css:`.gc{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:none;touch-action:pan-y}
.gc canvas{position:absolute;inset:0;width:100%;height:100%;display:block;filter:url(#gc-goo)}
.gc-svg{position:absolute;width:0;height:0}
${hint('gc','var(--sc-muted)')}`,
 html:`<div class="gc"><svg class="gc-svg" aria-hidden="true" focusable="false"><filter id="gc-goo" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/></filter></svg><canvas aria-hidden="true"></canvas><p class="gc-hint">Move · click to throw droplets</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gc'),cv=root.querySelector('canvas');
${BOOT}
var B=[],S=[],D=[],radii=[22,19,17,15,13,11,9,7],init=false;
for(var i=0;i<8;i++)B.push({x:0,y:0,vx:0,vy:0});
function col(i,n){return 'hsl('+(262+i/n*78)+',86%,'+(60+i*1.2)+'%)'}
var s=Stage(root,cv,function(s){var c=s.ctx;c.clearRect(0,0,s.W,s.H);if(!init){B.forEach(function(b){b.x=s.x;b.y=s.y});init=true}
 var h=B[0];h.vx+=(s.x-h.x)*.2;h.vy+=(s.y-h.y)*.2;h.vx*=.65;h.vy*=.65;h.x+=h.vx;h.y+=h.vy;
 for(var i=1;i<8;i++){var b=B[i],p=B[i-1];b.vx+=(p.x-b.x)*.18;b.vy+=(p.y-b.y)*.18;b.vx*=.65;b.vy*=.65;b.x+=b.vx;b.y+=b.vy}
 var tm=s.t*.002,sp=Math.hypot(s.vx,s.vy),dxn=sp>.5?s.vx/sp:0,dyn=sp>.5?s.vy/sp:0;
 for(var k=0;k<4;k++){var a=tm*(1+k*.2)+k*1.57,r=40+Math.min(24,sp*1.1);c.fillStyle=col(k*2+1,8);c.beginPath();c.arc(h.x+Math.cos(a)*r+dxn*sp*.6,h.y+Math.sin(a)*r+dyn*sp*.6,6.5,0,6.283);c.fill()}
 for(var j=7;j>=0;j--){c.fillStyle=col(j,8);c.beginPath();c.arc(B[j].x,B[j].y,radii[j],0,6.283);c.fill()}
 for(var m=D.length-1;m>=0;m--){var d=D[m];d.age++;if(d.age>40){d.vx+=(h.x-d.x)*.05;d.vy+=(h.y-d.y)*.05;d.vx*=.8;d.vy*=.8}else{d.vx*=.96;d.vy*=.96}d.x+=d.vx;d.y+=d.vy;c.fillStyle=col(m%8,8);c.beginPath();c.arc(d.x,d.y,d.r,0,6.283);c.fill();if(d.age>60&&Math.hypot(d.x-h.x,d.y-h.y)<14)D.splice(m,1)}});
s.click=function(x,y){for(var i=0;i<7;i++){var a=Math.random()*6.283,sp=6+Math.random()*8;D.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:5+Math.random()*7,age:0})}};})();`},

{id:'s-photo-trail',title:'Photo trail',component:'Photo trail',key:'photo-trail',family,width:780,
 description:'Instant-print photos drop behind the cursor, tilt, settle and fade away like a scattered contact sheet.',
 prompt:'Make a trail of instant photos. When the pointer has travelled more than 110px since the last drop, add a card at the pointer: a white print with a 6px border, a thicker bottom edge and a picture area made only from CSS gradients (six variants such as sunset over hills, dusk lake, neon street, mint morning, ember sky and indigo night, each with a soft sun or moon from a radial gradient). Each card gets a random tilt between -12 and 12 degrees, appears with a pop animation (scale 0.7 to 1 with a small toss in the direction of travel and a fade in) and fades out after 2.4s, then is removed; keep at most 8 cards and give each a higher z-index than the last. When the pointer is away a timer drops a card every 650ms along a slow Lissajous path. Cards are decorative (aria-hidden) and non-interactive, the stage has an aria-label, reduced motion shows no tossing and fades quickly. Vanilla HTML, CSS and JavaScript.',
 css:`.pt2{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.pt2-card{position:absolute;width:104px;padding:6px 6px 22px;border-radius:4px;background:#fffdf8;box-shadow:0 10px 24px -8px rgba(0,0,0,.45),0 1px 0 rgba(0,0,0,.08);pointer-events:none;animation:pt2-pop .5s cubic-bezier(.2,.9,.3,1.25) both,pt2-out .6s ease 2.4s forwards}
.pt2-pic{display:block;width:100%;height:92px;border-radius:2px;background:var(--bg)}
@keyframes pt2-pop{from{opacity:0;transform:translate(calc(var(--tx)*-1),calc(var(--ty)*-1)) rotate(calc(var(--r)*2.4)) scale(.7)}to{opacity:1;transform:translate(0,0) rotate(var(--r)) scale(1)}}
@keyframes pt2-out{to{opacity:0;transform:translate(0,-14px) rotate(var(--r)) scale(.96)}}
${hint('pt2','var(--sc-muted)')}
@media (prefers-reduced-motion:reduce){.pt2-card{animation:pt2-out .3s ease 1.2s forwards}}`,
 html:`<div class="pt2" role="img" aria-label="A trail of instant photographs follows the pointer"><p class="pt2-hint">Move to drop prints</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pt2');
var scenes=['radial-gradient(circle at 70% 36%,#fff4b8 0 9%,#ffb36b 10% 20%,transparent 21%),linear-gradient(#ff9a6b,#ff5f8f 52%,#5b2a6b 53%,#2a1740)','radial-gradient(circle at 30% 30%,#fff 0 6%,transparent 7%),linear-gradient(#5b8cff,#8fd0ff 55%,#1d4f7a 56%,#10304d)','radial-gradient(circle at 50% 60%,#ff4fd8 0 12%,transparent 13%),linear-gradient(#150b2e,#3b126b 60%,#0b0618)','radial-gradient(circle at 25% 28%,#fffbe0 0 10%,transparent 11%),linear-gradient(#b8ffd8,#6fe0b0 54%,#2a8f6b 55%,#14543f)','radial-gradient(circle at 60% 55%,#fff0a0 0 8%,#ff8a3d 9% 18%,transparent 19%),linear-gradient(#3a1a2e,#a8402a 60%,#2a0f12)','radial-gradient(circle at 78% 24%,#f4f0ff 0 7%,transparent 8%),linear-gradient(#1b1f5e,#3d3aa8 58%,#161845 59%,#0b0c2a)'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cards=[],lx=null,ly=null,z=1,inside=false,n=0,timer=0,tm=0,visible=true;
function drop(x,y,dx,dy){var el=document.createElement('span');el.className='pt2-card';el.setAttribute('aria-hidden','true');var pic=document.createElement('i');pic.className='pt2-pic';pic.style.setProperty('--bg',scenes[n++%scenes.length]);el.appendChild(pic);
 el.style.left=(x-52)+'px';el.style.top=(y-58)+'px';el.style.zIndex=++z;el.style.setProperty('--r',((Math.random()-.5)*24).toFixed(1)+'deg');var l=Math.hypot(dx,dy)||1;el.style.setProperty('--tx',(reduce?0:dx/l*26)+'px');el.style.setProperty('--ty',(reduce?0:dy/l*26)+'px');
 root.appendChild(el);cards.push(el);setTimeout(function(){el.remove();cards=cards.filter(function(c){return c!==el})},3200);while(cards.length>8){var old=cards.shift();old.remove()}}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;inside=true;if(lx===null){lx=x;ly=y;return}if(Math.hypot(x-lx,y-ly)>110){drop(x,y,x-lx,y-ly);lx=x;ly=y}});
root.addEventListener('pointerleave',function(){inside=false;lx=null});
function auto(){if(!inside&&visible){var r=root.getBoundingClientRect(),t=Date.now()/1000;drop(r.width*(.5+.36*Math.sin(t*.9)),r.height*(.48+.26*Math.sin(t*1.3+1)),Math.cos(t*.9),Math.cos(t*1.3))}timer=setTimeout(auto,650)}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting}).observe(root);
auto();})();`},

{id:'s-stardust-wake',title:'Stardust wake',component:'Stardust wake',key:'stardust-wake',family,width:780,
 description:'Fine stardust is carried on a drifting current behind the cursor, and a click blooms into a mushroom puff.',
 prompt:'Make a dust wake. Emit four tiny particles per frame along the cursor path (more when moving faster) with velocity = cursor velocity * 0.12 plus a small random vector, a life of 100-180 frames and a hue from cyan to violet. Move every particle with a flow field: vx += sin(y*0.02 + t*0.001) * 0.02, vy += cos(x*0.02 + t*0.0012) * 0.02 - 0.01 so the dust swirls and slowly rises, with drag 0.985, and draw 1.2px additive dots whose alpha follows the remaining life; cap the pool at 1400. A click makes a puff: 120 particles thrown radially at 2-5px per frame, a second ring of 40 rising faster to form a stalk and cap, and an expanding translucent ring. Dark stage; idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.sw{position:relative;height:380px;border:1px solid #1a1d2c;border-radius:28px;background:radial-gradient(ellipse at 50% 70%,#101a2e,#05070e 75%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.sw canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('sw','#5f6f94')}`,
 html:`<div class="sw"><canvas aria-hidden="true"></canvas><p class="sw-hint">Drag through the dust · click to puff</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sw'),cv=root.querySelector('canvas');
${BOOT}
var P=[],rings=[];
function emit(x,y,vx,vy,n){for(var i=0;i<n;i++)P.push({x:x+(Math.random()-.5)*6,y:y+(Math.random()-.5)*6,vx:vx*.12+(Math.random()-.5)*.8,vy:vy*.12+(Math.random()-.5)*.8,l:0,m:100+Math.random()*80,h:190+Math.random()*100,s:1.3+Math.random()*1.3});if(P.length>1400)P.splice(0,P.length-1400)}
var s=Stage(root,cv,function(s){var c=s.ctx,t=s.t,sp=Math.hypot(s.vx,s.vy);c.clearRect(0,0,s.W,s.H);if(sp>.4)emit(s.x,s.y,s.vx,s.vy,Math.min(14,5+Math.floor(sp/4)));c.globalCompositeOperation='lighter';
 for(var i=P.length-1;i>=0;i--){var p=P[i];p.vx+=Math.sin(p.y*.02+t*.001)*.02;p.vy+=Math.cos(p.x*.02+t*.0012)*.02-.01;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.l++;if(p.l>p.m){P.splice(i,1);continue}
  var a=1-p.l/p.m;c.fillStyle='hsla('+p.h+',90%,'+(62+a*18)+'%,'+(Math.min(1,a*1.4))+')';c.beginPath();c.arc(p.x,p.y,p.s*(.7+a*.7),0,6.283);c.fill()}
 rings=rings.filter(function(r){return t-r.t<900});rings.forEach(function(r){var a=1-(t-r.t)/900;c.strokeStyle='rgba(150,190,255,'+(a*.35)+')';c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,8+(1-a)*90,0,6.283);c.stroke()});c.globalCompositeOperation='source-over'});
s.click=function(x,y){rings.push({x:x,y:y,t:s.t});for(var i=0;i<120;i++){var a=Math.random()*6.283,sp=2+Math.random()*3;P.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.7-.4,l:0,m:90+Math.random()*60,h:190+Math.random()*100,s:1+Math.random()})}
 for(var j=0;j<40;j++){P.push({x:x+(Math.random()-.5)*8,y:y,vx:(Math.random()-.5)*.8,vy:-(2.5+Math.random()*3),l:0,m:110+Math.random()*60,h:250+Math.random()*60,s:1.3})}};})();`},

{id:'s-warp-mesh',title:'Warp mesh',component:'Warp mesh',key:'warp-mesh',family,width:780,
 description:'A fine mesh of glowing lines bends towards the cursor like a gravity well and shudders with each click.',
 prompt:'Draw a 30px mesh of horizontal and vertical lines sampled every 10px along their length. Each sample point p is displaced towards the cursor: with d = p - cursor, f = exp(-|d|^2 / (2 * 120^2)), p\' = p - d * f * 0.55. Clicks add radial shock waves: for each ring of age a (ms) the displacement along the unit vector away from the cursor-click point is sin((r - a*0.45) * 0.09) * 14 * exp(-((r - a*0.45)^2) / 4000) * (1 - a/1800). Stroke all lines in a single path per direction in a translucent violet and add a bright radial glow under the cursor so the well reads as a light source. Dark stage; idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.wm2{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#121128,#05050a 78%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.wm2 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('wm2','#6c6c86')}`,
 html:`<div class="wm2"><canvas aria-hidden="true"></canvas><p class="wm2-hint">Bend the mesh · click to shock it</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.wm2'),cv=root.querySelector('canvas');
${BOOT}
var GS=30,rings=[];
function warp(x,y,s,t){var dx=x-s.x,dy=y-s.y,r2=dx*dx+dy*dy,f=Math.exp(-r2/28800)*.55,px=x-dx*f,py=y-dy*f;
 for(var k=0;k<rings.length;k++){var q=rings[k],a=t-q.t,rx=x-q.x,ry=y-q.y,r=Math.hypot(rx,ry)||1,e=r-a*.45,w=Math.sin(e*.09)*14*Math.exp(-e*e/4000)*(1-a/1800);px+=rx/r*w;py+=ry/r*w}return [px,py]}
var s=Stage(root,cv,function(s){var c=s.ctx,t=s.t;c.clearRect(0,0,s.W,s.H);rings=rings.filter(function(r){return t-r.t<1800});
 var g=c.createRadialGradient(s.x,s.y,0,s.x,s.y,150);g.addColorStop(0,'rgba(140,110,255,.35)');g.addColorStop(1,'rgba(140,110,255,0)');c.fillStyle=g;c.fillRect(s.x-160,s.y-160,320,320);
 c.lineWidth=1.1;c.strokeStyle='rgba(150,130,255,.55)';c.beginPath();
 for(var y=0;y<=s.H+GS;y+=GS){for(var x=0;x<=s.W+10;x+=10){var p=warp(x,y,s,t);if(x===0)c.moveTo(p[0],p[1]);else c.lineTo(p[0],p[1])}}
 for(var x2=0;x2<=s.W+GS;x2+=GS){for(var y2=0;y2<=s.H+10;y2+=10){var q=warp(x2,y2,s,t);if(y2===0)c.moveTo(q[0],q[1]);else c.lineTo(q[0],q[1])}}c.stroke();
 var g2=c.createRadialGradient(s.x,s.y,0,s.x,s.y,14);g2.addColorStop(0,'rgba(255,255,255,.95)');g2.addColorStop(1,'rgba(180,160,255,0)');c.fillStyle=g2;c.fillRect(s.x-16,s.y-16,32,32)});
s.click=function(x,y){rings.push({x:x,y:y,t:s.t})};})();`}
];
