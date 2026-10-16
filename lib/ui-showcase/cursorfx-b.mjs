// Original cursor effects, part two: lens, rising tiles, heading compass, ASCII water, parallax pills, pigment brush, needle field.
import {BOOT} from './cursorfx-boot.mjs';
const family='Cursor effects';
const hint=(cls,colour)=>`.${cls}-hint{position:absolute;left:0;right:0;bottom:14px;margin:0;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${colour};pointer-events:none}`;
export const cursorfxB=[
{id:'s-glass-lens',title:'Glass lens',component:'Glass lens',key:'glass-lens',family,width:780,
 description:'A heavy glass lens trails the cursor, magnifying the artwork beneath with a coloured fringe and a glint.',
 prompt:'Build a magnifying glass cursor. Paint a detailed piece of artwork once to an offscreen canvas (a violet-to-indigo base, three radial colour blooms, concentric hairline circles, a huge two-line headline and rows of tiny text so there is something to magnify). Each frame draw the artwork, then draw the lens: its centre eases towards the cursor (factor 0.2) so it feels heavy, the radius grows a little with speed, a soft shadow sits beneath, and inside a circular clip the artwork is drawn again scaled about the lens centre (zoom eased towards 1.7, or 2.6 after a click toggles it). Finish with a rim: a radial gradient that darkens and brightens the edge, red and blue offset stroke rings for chromatic fringing, and a small bright arc glint at the upper left. Idle: a virtual cursor wanders. Handle devicePixelRatio, resizing (rebuild the artwork), off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.gl{position:relative;height:380px;border:1px solid #1d1b33;border-radius:28px;background:#120d2a;overflow:hidden;cursor:none;touch-action:pan-y}
.gl canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('gl','#b3a8e8')}`,
 html:`<div class="gl"><canvas aria-hidden="true"></canvas><p class="gl-hint">Move the lens · click to change zoom</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gl'),cv=root.querySelector('canvas');
${BOOT}
var art=null,lx=0,ly=0,Z=1.7,tZ=1.7,R=80,ready=false;
function makeArt(s){art=document.createElement('canvas');art.width=cv.width;art.height=cv.height;var a=art.getContext('2d'),W=s.W,H=s.H;a.scale(s.dpr,s.dpr);
 var g=a.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1c1146');g.addColorStop(1,'#3a1b78');a.fillStyle=g;a.fillRect(0,0,W,H);
 [[.2,.3,'255,90,170',.5],[.75,.65,'60,200,255',.42],[.55,.1,'255,190,90',.34]].forEach(function(b){var r=a.createRadialGradient(W*b[0],H*b[1],0,W*b[0],H*b[1],Math.max(W,H)*.45);r.addColorStop(0,'rgba('+b[2]+','+b[3]+')');r.addColorStop(1,'rgba('+b[2]+',0)');a.fillStyle=r;a.fillRect(0,0,W,H)});
 a.strokeStyle='rgba(255,255,255,.16)';a.lineWidth=1;for(var i=1;i<9;i++){a.beginPath();a.arc(W*.5,H*.5,i*34,0,6.283);a.stroke()}
 a.fillStyle='#fff';a.font='900 '+Math.round(W*.115)+'px system-ui,-apple-system,Segoe UI,sans-serif';a.textBaseline='alphabetic';a.fillText('LOOK',W*.07,H*.46);a.fillText('CLOSER',W*.07,H*.46+W*.115);
 a.font='9px ui-monospace,SFMono-Regular,Menlo,monospace';a.fillStyle='rgba(255,255,255,.7)';var line='fine print, tiny detail, hidden notes, small wonders, quiet craft, careful kerning, ';for(var y=H*.8;y<H-44;y+=12)a.fillText(line+line+line,W*.07+((y/12)%3)*18,y);
 ready=true}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H;if(!ready)return;c.clearRect(0,0,W,H);c.drawImage(art,0,0,W,H);
 lx+=(s.x-lx)*.2;ly+=(s.y-ly)*.2;Z+=(tZ-Z)*.12;var sp=Math.hypot(s.vx,s.vy);R+=((78+Math.min(16,sp*.7))-R)*.12;
 c.save();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=30;c.shadowOffsetY=14;c.fillStyle='#000';c.beginPath();c.arc(lx,ly,R,0,6.283);c.fill();c.restore();
 c.save();c.beginPath();c.arc(lx,ly,R,0,6.283);c.clip();c.translate(lx,ly);c.scale(Z,Z);c.translate(-lx,-ly);c.drawImage(art,0,0,W,H);c.restore();
 var rim=c.createRadialGradient(lx,ly,R*.72,lx,ly,R);rim.addColorStop(0,'rgba(255,255,255,0)');rim.addColorStop(.8,'rgba(255,255,255,.12)');rim.addColorStop(1,'rgba(10,6,30,.5)');c.fillStyle=rim;c.beginPath();c.arc(lx,ly,R,0,6.283);c.fill();
 c.lineWidth=2.2;c.strokeStyle='rgba(255,80,120,.55)';c.beginPath();c.arc(lx+1.6,ly,R-1,0,6.283);c.stroke();c.strokeStyle='rgba(70,140,255,.55)';c.beginPath();c.arc(lx-1.6,ly,R-1,0,6.283);c.stroke();
 c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.4;c.beginPath();c.arc(lx,ly,R,0,6.283);c.stroke();
 c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=3.2;c.lineCap='round';c.beginPath();c.arc(lx,ly,R*.8,Math.PI*1.08,Math.PI*1.34);c.stroke();c.lineWidth=1.6;c.beginPath();c.arc(lx,ly,R*.8,Math.PI*1.4,Math.PI*1.46);c.stroke()},function(s){makeArt(s);lx=s.W/2;ly=s.H/2});
s.click=function(){tZ=tZ>2?1.7:2.6};})();`},

{id:'s-rise-grid',title:'Rise grid',component:'Rise grid',key:'rise-grid',family,width:780,
 description:'An isometric field of tiles that rises into towers under the cursor and rolls with a wave.',
 prompt:'Draw a 13 x 13 isometric grid of square columns on a canvas (projection sx = ox + (gx - gy) * tw/2, sy = oy + (gx + gy) * th/2 with th = tw/2). For each tile compute its screen-space distance d to the cursor and a height h = 4 + 80 * exp(-d^2 / (2 * 100^2)) * (0.7 + 0.3 * sin(d * 0.04 - t * 0.004)) + a travelling ripple term; ease each height towards its target so the field feels springy. Draw tiles back to front (ascending gx + gy) as three faces: a top rhombus and two side faces that are 10% and 20% darker, with hue running from violet to pink as the column grows taller and a 10% gap between columns. Click sends an extra ring that lifts a band of tiles for a moment. Draw a small accent ellipse on the floor under the cursor. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize (recompute the projection), off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.rs{position:relative;height:400px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 60%,#171428,#07070d 75%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.rs canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('rs','#6c6c86')}`,
 html:`<div class="rs"><canvas aria-hidden="true"></canvas><p class="rs-hint">Raise the city · click for a wave</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rs'),cv=root.querySelector('canvas');
${BOOT}
var N=13,tw=40,th=20,ox=0,oy=0,H0=[],rings=[];
function build(s){tw=Math.min(56,s.W*.9/N);th=tw/2;ox=s.W/2;oy=s.H*.5-N*th/2+26;H0=[];for(var i=0;i<N*N;i++)H0.push(0)}
function shade(h,l){return 'hsl('+(252+Math.min(1,h/90)*88)+',78%,'+l+'%)'}
var s=Stage(root,cv,function(s){var c=s.ctx,t=s.t;c.clearRect(0,0,s.W,s.H);rings=rings.filter(function(r){return t-r.t<1800});
 for(var sum=0;sum<=2*N-2;sum++)for(var gx=Math.max(0,sum-N+1);gx<=Math.min(N-1,sum);gx++){var gy=sum-gx,sx=ox+(gx-gy)*tw/2,sy=oy+(gx+gy)*th/2,d=Math.hypot(sx-s.x,sy-s.y+14),
  target=4+80*Math.exp(-d*d/20000)*(.7+.3*Math.sin(d*.04-t*.004))+Math.sin(d*.03-t*.003)*5*Math.exp(-d*.004);
  for(var k=0;k<rings.length;k++){var r=rings[k],dd=Math.hypot(sx-r.x,sy-r.y)-(t-r.t)*.28;target+=48*Math.exp(-dd*dd/1500)*(1-(t-r.t)/1800)}
  var idx=gy*N+gx,h=H0[idx];h+=(target-h)*.14;H0[idx]=h;var w=tw/2*.9,q=th/2*.9;
  c.fillStyle=shade(h,40);c.beginPath();c.moveTo(sx-w,sy-h);c.lineTo(sx,sy-h+q);c.lineTo(sx,sy+q);c.lineTo(sx-w,sy);c.closePath();c.fill();
  c.fillStyle=shade(h,49);c.beginPath();c.moveTo(sx+w,sy-h);c.lineTo(sx,sy-h+q);c.lineTo(sx,sy+q);c.lineTo(sx+w,sy);c.closePath();c.fill();
  c.fillStyle=shade(h,63);c.beginPath();c.moveTo(sx,sy-h-q);c.lineTo(sx+w,sy-h);c.lineTo(sx,sy-h+q);c.lineTo(sx-w,sy-h);c.closePath();c.fill()}
 c.strokeStyle='rgba(190,170,255,.8)';c.lineWidth=1.4;c.beginPath();c.ellipse(s.x,s.y+14,16,8,0,0,6.283);c.stroke()},build);
s.click=function(x,y){rings.push({x:x,y:y+14,t:s.t})};})();`},

{id:'s-heading-cursor',title:'Heading cursor',component:'Heading cursor',key:'heading-cursor',family,width:780,
 description:'An arrow inside a compass ring that swings to face its direction of travel on a spring and leaves ghost arrows.',
 prompt:'Make a compass cursor. Draw an arrow shape (tip, two rear corners and a notch) rotated to a heading angle, filled with an accent gradient. The heading follows the direction of movement (atan2 of the velocity when speed is above 0.8px per frame) through an angular spring: take the shortest wrapped difference, add 0.12 times it to an angular velocity, damp the velocity by 0.78 and integrate. Stretch the arrow along its length with speed. Around it draw a fixed compass ring (radius 40) with 24 ticks, N/E/S/W letters and a brighter arc of 40 degrees at the current heading. Keep the last 12 positions and headings and draw them as fading smaller ghost arrows. Under the ring show a monospace readout such as "HDG 042 deg  6.2 px/f". Dark stage; idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.hc{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 45%,#16162a,#07070d 72%);overflow:hidden;cursor:none;touch-action:pan-y}
.hc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('hc','#6c6c86')}`,
 html:`<div class="hc"><canvas aria-hidden="true"></canvas><p class="hc-hint">Steer the arrow</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.hc'),cv=root.querySelector('canvas');
${BOOT}
var ang=0,av=0,trail=[],R=48;
function arrow(c,x,y,a,k,fill,stretch){c.save();c.translate(x,y);c.rotate(a);c.scale(k*stretch,k);c.beginPath();c.moveTo(20,0);c.lineTo(-13,12);c.lineTo(-6,0);c.lineTo(-13,-12);c.closePath();c.fillStyle=fill;c.fill();c.restore()}
Stage(root,cv,function(s){var c=s.ctx,sp=Math.hypot(s.vx,s.vy);c.clearRect(0,0,s.W,s.H);
 if(sp>.8){var tg=Math.atan2(s.vy,s.vx),df=tg-ang;df=Math.atan2(Math.sin(df),Math.cos(df));av+=df*.12}av*=.78;ang+=av;
 trail.push([s.x,s.y,ang]);if(trail.length>13)trail.shift();
 for(var i=0;i<trail.length-1;i++){var p=trail[i],a=(i+1)/trail.length;arrow(c,p[0],p[1],p[2],.7+.4*a,'rgba(160,140,255,'+(a*.38)+')',1)}
 c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=1.2;c.beginPath();c.arc(s.x,s.y,R,0,6.283);c.stroke();
 for(var k=0;k<24;k++){var th=k/24*6.283-Math.PI/2,l=k%6===0?9:4;c.strokeStyle='rgba(255,255,255,'+(k%6===0?.5:.22)+')';c.beginPath();c.moveTo(s.x+Math.cos(th)*(R-l),s.y+Math.sin(th)*(R-l));c.lineTo(s.x+Math.cos(th)*R,s.y+Math.sin(th)*R);c.stroke()}
 c.fillStyle='rgba(255,255,255,.7)';c.font='600 10px ui-monospace,SFMono-Regular,Menlo,monospace';c.textAlign='center';c.textBaseline='middle';[['N',0,-1],['E',1,0],['S',0,1],['W',-1,0]].forEach(function(l){c.fillText(l[0],s.x+l[1]*(R+11),s.y+l[2]*(R+11))});
 c.strokeStyle='#a99bff';c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(s.x,s.y,R,ang-.35,ang+.35);c.stroke();
 var g=c.createLinearGradient(-13,0,20,0);arrow(c,s.x,s.y,ang,1.25,'#e4dcff',1+Math.min(.5,sp/50));
 var deg=Math.round(((ang*180/Math.PI+90)%360+360)%360);c.fillStyle='rgba(220,215,255,.85)';c.font='600 11px ui-monospace,SFMono-Regular,Menlo,monospace';c.fillText('HDG '+(deg<100?'0':'')+(deg<10?'0':'')+deg+'\\u00b0  '+sp.toFixed(1)+' px/f',s.x,s.y+R+30)});})();`},

{id:'s-ascii-water',title:'ASCII water',component:'ASCII water',key:'ascii-water',family,width:780,
 description:'A pool simulated live in characters: your cursor makes ripples that interfere and fade as symbols.',
 prompt:'Simulate water as ASCII. Keep two Float32Array height fields on a grid of 9 x 17px character cells (about 80 x 22). Each simulation step (run twice per frame) sets new[i] = (h[i-1] + h[i+1] + h[i-cols] + h[i+cols]) / 2 - old[i], multiplied by 0.985, then swaps buffers. The cursor disturbs the water: add a negative impulse (stronger with speed) to the cell under it and its neighbours, and a click drops a big impulse. With no pointer a virtual cursor wanders and random raindrops fall. Render with the ramp " .,:;~=+*#%@" chosen by |height|; positive heights are bright cyan, negative heights darker blue, and group the draw calls by character so fillStyle changes stay few. Dark stage with monospace text. Handle devicePixelRatio, resize (rebuild the grid), off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.aw{position:relative;height:380px;border:1px solid #14202b;border-radius:28px;background:linear-gradient(#06111a,#04080d);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.aw canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('aw','#4f6f86')}`,
 html:`<div class="aw"><canvas aria-hidden="true"></canvas><p class="aw-hint">Stir the water</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.aw'),cv=root.querySelector('canvas');
${BOOT}
var CW=9,CH=17,cols=0,rows=0,a=null,b=null,ramp=' .,:;~=+*#%@',groups=[];
function build(s){cols=Math.max(8,Math.floor(s.W/CW));rows=Math.max(6,Math.floor(s.H/CH));a=new Float32Array(cols*rows);b=new Float32Array(cols*rows)}
function drop(x,y,v){var cx=Math.round(x/CW),cy=Math.round(y/CH);for(var j=-1;j<=1;j++)for(var i=-1;i<=1;i++){var X=cx+i,Y=cy+j;if(X>0&&Y>0&&X<cols-1&&Y<rows-1)a[Y*cols+X]+=v*(i||j?.5:1)}}
var s=Stage(root,cv,function(s){var c=s.ctx;if(!a)return;var sp=Math.hypot(s.vx,s.vy);if(sp>.4)drop(s.x,s.y,-Math.min(2.2,.4+sp*.05));if(!s.inside&&Math.random()<.025)drop(Math.random()*s.W,Math.random()*s.H,-2.6);
 for(var st=0;st<2;st++){for(var y=1;y<rows-1;y++)for(var x=1;x<cols-1;x++){var i=y*cols+x;b[i]=((a[i-1]+a[i+1]+a[i-cols]+a[i+cols])/2-b[i])*.985}var t=a;a=b;b=t}
 c.clearRect(0,0,s.W,s.H);c.font='600 14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';c.textBaseline='top';
 for(var key=0;key<24;key++){var idx=key>>1,pos=!(key&1);if(idx===0)continue;c.fillStyle=pos?'hsl(188,90%,'+(36+idx*4.2)+'%)':'hsl(222,70%,'+(26+idx*3.4)+'%)';var ch=ramp.charAt(idx);
  for(var yy=0;yy<rows;yy++)for(var xx=0;xx<cols;xx++){var v=a[yy*cols+xx],m=Math.min(11,Math.floor(Math.abs(v)*5.5));if(m===idx&&(v>0)===pos)c.fillText(ch,xx*CW,yy*CH+1)}}},build);
s.click=function(x,y){drop(x,y,-5)};})();`},

{id:'s-parallax-pills',title:'Parallax pills',component:'Parallax pills',key:'parallax-pills',family,width:780,
 description:'A scatter of labelled pills floating at different depths, springing past each other as the pointer moves.',
 prompt:'Make a field of ten labelled pills (a coloured dot plus a word such as Design, Motion, Type, 3D, Code, Brand, Craft, Ideas, Shaders, Systems), absolutely positioned at hand-picked percentages in a stage. Each pill has a depth between 0.4 and 1.7 that scales its font size, its drop shadow and its parallax. Every frame the pointer position (or, with no pointer, a slow Lissajous path) is normalised to -1..1 around the stage centre, and each pill springs towards depth * (nx * 46px, ny * 34px) with a spring constant of 0.06 and damping 0.82 so they overshoot and wobble; tilt each pill slightly with its horizontal velocity. Hovering a pill lifts and scales it with a CSS transition. Pills are decorative spans with aria-hidden and the stage has an aria-label. Pause off-screen and, for reduced motion, place them without motion. Vanilla HTML, CSS and JavaScript.',
 css:`.pp{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:radial-gradient(ellipse at 50% 40%,var(--sc-ring),transparent 65%),var(--sc-surface);overflow:hidden}
.pp-pill{position:absolute;display:inline-flex;align-items:center;gap:8px;padding:.55em 1.1em;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);font-weight:700;white-space:nowrap;will-change:transform;transition:box-shadow .25s,border-color .25s}
.pp-pill i{width:.62em;height:.62em;border-radius:50%;background:hsl(var(--h) 85% 62%)}
.pp-pill:hover{border-color:hsl(var(--h) 85% 62%)}
.pp-in{display:inline-flex;align-items:center;gap:8px;transition:transform .3s cubic-bezier(.2,.9,.3,1.3)}
.pp-pill:hover .pp-in{transform:scale(1.14)}`,
 html:`<div class="pp" role="img" aria-label="Floating labels: design, motion, type, 3D, code, brand, craft, ideas, shaders, systems"></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pp');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,defs=[['Design',16,24,1.2,262],['Motion',50,16,.7,330],['Type',82,26,1.5,20],['3D',30,52,1.7,200],['Code',64,48,.9,150],['Brand',88,62,.6,290],['Craft',12,76,.8,40],['Ideas',44,80,1.4,310],['Shaders',74,82,1,230],['Systems',54,34,.5,180]],P=[],nx=0,ny=0,ptr=false,raf=0,visible=true;
defs.forEach(function(d){var el=document.createElement('span');el.className='pp-pill';el.setAttribute('aria-hidden','true');el.style.left=d[1]+'%';el.style.top=d[2]+'%';el.style.setProperty('--h',d[4]);el.style.fontSize=(12+d[3]*4.2)+'px';el.style.zIndex=Math.round(d[3]*10);el.style.boxShadow='0 '+(d[3]*8)+'px '+(d[3]*18)+'px -'+(d[3]*6)+'px rgba(0,0,0,.35)';
 var inner=document.createElement('span');inner.className='pp-in';var dot=document.createElement('i');var lb=document.createElement('span');lb.textContent=d[0];inner.appendChild(dot);inner.appendChild(lb);el.appendChild(inner);root.appendChild(el);P.push({el:el,d:d[3],x:0,y:0,vx:0,vy:0})});
function frame(now){raf=0;var t=now/1000;if(!ptr){nx=Math.sin(t*.6)*.8;ny=Math.cos(t*.45)*.7}
 P.forEach(function(p){var tx=nx*46*p.d,ty=ny*34*p.d;p.vx+=(tx-p.x)*.06;p.vy+=(ty-p.y)*.06;p.vx*=.82;p.vy*=.82;p.x+=p.vx;p.y+=p.vy;p.el.style.transform='translate('+p.x.toFixed(2)+'px,'+p.y.toFixed(2)+'px) translate(-50%,-50%) rotate('+(p.vx*1.4).toFixed(2)+'deg)'});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();ptr=true;nx=((e.clientX-r.left)/r.width-.5)*2;ny=((e.clientY-r.top)/r.height-.5)*2});
root.addEventListener('pointerleave',function(){ptr=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
P.forEach(function(p){p.el.style.transform='translate(-50%,-50%)'});go();})();`},

{id:'s-pigment-brush',title:'Pigment brush',component:'Pigment brush',key:'pigment-brush',family,width:780,
 description:'A dry-bristle brush that paints flowing pigment strokes behind the cursor, which slowly dry and fade.',
 prompt:'Build a painting cursor. A canvas keeps its pixels between frames. Each frame take the segment from the previous to the current cursor position and stamp along it every ~2px; at each stamp draw 16 bristle dabs offset perpendicular to the direction (offset = (index - 7.5) * brush spacing, where spacing is 1.7 * (1.45 - min(0.9, speed/38)) so fast strokes are thinner), skipping about 15% of bristles at random so the stroke breaks up like dry paint, each a small circle of radius 0.9-1.9px with alpha ~0.4. The hue drifts with distance travelled (violet through pink to orange). Pressing the pointer makes the brush 1.6x wider. Every few frames erase a sliver with destination-out at 0.02 alpha so old paint fades slowly. A real "Clear" button wipes the canvas. Idle: a virtual cursor sweeps flowing curves. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.pb{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:none}
.pb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.pb-btn{position:absolute;right:16px;bottom:16px;padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.pb-btn:hover{border-color:var(--sc-accent)}
${hint('pb','var(--sc-muted)').replace('left:0;right:0;','left:20px;').replace('text-align:center;','')}`,
 html:`<div class="pb"><canvas aria-hidden="true"></canvas><p class="pb-hint">Paint with the cursor</p><button class="pb-btn" type="button">Clear</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pb'),cv=root.querySelector('canvas'),btn=root.querySelector('.pb-btn');
${BOOT}
var dist=0,frames=0;
var s=Stage(root,cv,function(s){var c=s.ctx,sp=Math.hypot(s.vx,s.vy);frames++;
 if(frames%5===0){c.globalCompositeOperation='destination-out';c.fillStyle='rgba(0,0,0,.02)';c.fillRect(0,0,s.W,s.H);c.globalCompositeOperation='source-over'}
 if(sp<.4)return;var nx=-s.vy/sp,ny=s.vx/sp,steps=Math.max(1,Math.ceil(sp/2)),sc=(s.down?1.6:1)*1.7*(1.45-Math.min(.9,sp/38));
 for(var k=1;k<=steps;k++){var x=s.x-s.vx*(1-k/steps),y=s.y-s.vy*(1-k/steps);dist+=sp/steps;var hue=(300+110*Math.sin(dist*.006)+360)%360;
  for(var b=0;b<16;b++){if(Math.random()<.15)continue;var off=(b-7.5)*sc;c.fillStyle='hsla('+(hue+b*1.5)+',82%,'+(52+Math.sin(b)*6)+'%,'+(.32+Math.random()*.2)+')';c.beginPath();c.arc(x+nx*off,y+ny*off,.9+Math.random(),0,6.283);c.fill()}}});
btn.addEventListener('click',function(){s.ctx.clearRect(0,0,s.W,s.H)});})();`},

{id:'s-needle-field',title:'Needle field',component:'Needle field',key:'needle-field',family,width:780,
 description:'A meadow of tiny needles that all turn to face the cursor, lengthening as it comes close; click to repel.',
 prompt:'Fill a canvas with a grid of needles (32px spacing). Each needle keeps its own angle; every frame its target angle is atan2 towards the cursor (plus pi while a click-driven repel value above 0.35 is active; repel jumps to 1 on click and decays by 0.96 per frame) and the needle eases towards it with a wrapped shortest difference times 0.14. The needle length is 8 + 14 * exp(-d / 150), drawn as a round-capped 2.4px line centred on the grid point, with a small bright dot at the tip. Needles within 90px of the cursor use the accent colour and the rest use the muted colour with opacity that falls with distance. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize (rebuild the grid), off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.nf{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.nf canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('nf','var(--sc-muted)')}`,
 html:`<div class="nf"><canvas aria-hidden="true"></canvas><p class="nf-hint">Move · click to repel</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.nf'),cv=root.querySelector('canvas');
${BOOT}
var GS=32,pts=[],angs=null,repel=0,accent='#6d5ef5',muted='#888',lastCss=0;
function build(s){pts=[];for(var y=GS/2;y<s.H;y+=GS)for(var x=GS/2;x<s.W;x+=GS)pts.push(x,y);angs=new Float32Array(pts.length/2)}
var s=Stage(root,cv,function(s){var c=s.ctx;if(!angs)return;if(s.t-lastCss>500){lastCss=s.t;var cs=getComputedStyle(root);accent=cs.getPropertyValue('--sc-accent').trim()||accent;muted=cs.getPropertyValue('--sc-muted').trim()||muted}
 c.clearRect(0,0,s.W,s.H);c.lineCap='round';var flip=repel>.35?Math.PI:0;repel*=.96;
 for(var i=0;i<pts.length;i+=2){var x=pts[i],y=pts[i+1],dx=s.x-x,dy=s.y-y,d=Math.hypot(dx,dy),k=i/2,tg=Math.atan2(dy,dx)+flip,df=tg-angs[k];df=Math.atan2(Math.sin(df),Math.cos(df));angs[k]+=df*.14;
  var len=8+14*Math.exp(-d/150),near=d<90,ux=Math.cos(angs[k])*len/2,uy=Math.sin(angs[k])*len/2;
  c.globalAlpha=near?1:Math.max(.25,.85-d/520);c.strokeStyle=near?accent:muted;c.lineWidth=2.4;c.beginPath();c.moveTo(x-ux,y-uy);c.lineTo(x+ux,y+uy);c.stroke();
  c.fillStyle=near?accent:muted;c.beginPath();c.arc(x+ux,y+uy,1.7,0,6.283);c.fill()}c.globalAlpha=1},build);
s.click=function(){repel=1};})();`}
];
