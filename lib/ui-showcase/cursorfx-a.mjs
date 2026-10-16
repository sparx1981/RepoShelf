// Original cursor effects, part one. Each demo is a stage that reacts to the pointer and drifts on its own when nobody is there.
import {BOOT} from './cursorfx-boot.mjs';
const family='Cursor effects';
const hint=(cls,colour)=>`.${cls}-hint{position:absolute;left:0;right:0;bottom:14px;margin:0;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${colour};pointer-events:none}`;
export const cursorfxA=[
{id:'s-storm-tether',title:'Storm tether',component:'Storm tether',key:'storm-tether',family,width:780,
 description:'Crackling lightning arcs from two anchors to your cursor, with forks and an overcharge flash on click.',
 prompt:'Build a canvas lightning effect on a dark stage. Two glowing anchor nodes sit on the left edge; every ~45ms regenerate a bolt from each anchor to the cursor using recursive midpoint displacement (six levels, a perpendicular offset that shrinks each level and scales with distance) and add three short forks off random points. Draw each bolt in three passes with additive blending: a wide faint blue stroke, a mid cyan stroke and a thin white core. Paint a soft radial glow at the cursor and fade the previous frame with a translucent dark fill so the arcs linger for a moment. Clicking triggers an overcharge: a bright flash and eight bolts radiating from the cursor that decay over about 300ms. When the pointer is not over the stage a virtual cursor wanders on a smooth path. Handle devicePixelRatio, resize and off-screen pausing, and for reduced motion only animate in response to pointer events. Vanilla HTML, CSS and JavaScript.',
 css:`.st{position:relative;height:380px;border:1px solid #1b2030;border-radius:28px;background:radial-gradient(ellipse at 20% 50%,#101a33,#05070f 70%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.st canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('st','#6d7aa0')}`,
 html:`<div class="st"><canvas aria-hidden="true"></canvas><p class="st-hint">Move to conduct · click to overcharge</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.st'),cv=root.querySelector('canvas');
${BOOT}
var flash=0,burst=[],lastGen=0,cache=[];
function bolt(ax,ay,bx,by,depth,spread){var pts=[[ax,ay],[bx,by]];for(var d=0;d<depth;d++){var np=[pts[0]];for(var i=0;i<pts.length-1;i++){var a=pts[i],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.sqrt(dx*dx+dy*dy)+.001,off=(Math.random()-.5)*spread/Math.pow(1.85,d);np.push([(a[0]+b[0])/2-dy/len*off,(a[1]+b[1])/2+dx/len*off]);np.push(b)}pts=np}return pts}
function stroke(c,pts,w,col){c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke()}
function anchors(s){return [[26,s.H*.3],[26,s.H*.7]]}
function gen(s){cache=[];anchors(s).forEach(function(a){var d=Math.hypot(s.x-a[0],s.y-a[1]),main=bolt(a[0],a[1],s.x,s.y,6,Math.min(170,d*.28));cache.push({p:main,w:1});
 for(var f=0;f<3;f++){var o=main[Math.floor(main.length*(.2+Math.random()*.6))],ang=Math.atan2(s.y-a[1],s.x-a[0])+(Math.random()-.5)*2.2,l=40+Math.random()*90;cache.push({p:bolt(o[0],o[1],o[0]+Math.cos(ang)*l,o[1]+Math.sin(ang)*l,4,l*.35),w:.5})}})}
var s=Stage(root,cv,function(s){var c=s.ctx;c.globalCompositeOperation='source-over';c.fillStyle='rgba(5,7,15,.3)';c.fillRect(0,0,s.W,s.H);c.globalCompositeOperation='lighter';
 if(s.t-lastGen>46||!cache.length){lastGen=s.t;gen(s)}
 var fl=flash;flash*=.9;
 cache.forEach(function(b){stroke(c,b.p,9*b.w,'rgba(60,110,255,.07)');stroke(c,b.p,3.4*b.w,'rgba(90,190,255,.4)');stroke(c,b.p,1.3*b.w+.2,'rgba(240,250,255,.95)')});
 burst=burst.filter(function(b){b.life-=1;return b.life>0});
 burst.forEach(function(b){var a=b.life/b.max;stroke(c,b.p,6*a,'rgba(110,180,255,'+(.25*a)+')');stroke(c,b.p,1.6,'rgba(255,255,255,'+a+')')});
 var g=c.createRadialGradient(s.x,s.y,0,s.x,s.y,70+fl*120);g.addColorStop(0,'rgba(170,215,255,'+(.5+fl*.5)+')');g.addColorStop(1,'rgba(60,100,255,0)');c.fillStyle=g;c.fillRect(s.x-190,s.y-190,380,380);
 anchors(s).forEach(function(a){var g2=c.createRadialGradient(a[0],a[1],0,a[0],a[1],26);g2.addColorStop(0,'rgba(200,230,255,.95)');g2.addColorStop(.3,'rgba(90,150,255,.5)');g2.addColorStop(1,'rgba(60,100,255,0)');c.fillStyle=g2;c.fillRect(a[0]-30,a[1]-30,60,60)});
 if(fl>.02){c.fillStyle='rgba(160,200,255,'+(fl*.12)+')';c.fillRect(0,0,s.W,s.H)}});
s.click=function(x,y){flash=1;for(var i=0;i<8;i++){var a=i/8*6.283+Math.random()*.4,l=120+Math.random()*110;burst.push({p:bolt(x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,5,l*.3),life:18,max:18})}};})();`},

{id:'s-glyph-trail',title:'Glyph trail',component:'Glyph trail',key:'glyph-trail',family,width:780,
 description:'The cursor leaves a heat trail written in characters that thin out from @ to a faint dot.',
 prompt:'Make an ASCII heat trail. Divide a dark canvas into character cells (13 x 20px) with a Float32Array intensity field. Each frame add a gaussian blob of intensity around the cursor cell (radius about 3 cells, stronger when the cursor moves faster), clamp it and multiply the whole field by 0.955 so it fades. Draw every cell whose intensity is above 0.06 as one character picked from the ramp " .:-=+*#%@" by intensity, in a monospace font, coloured by hsl with the hue running from violet to pink across the width and lightness rising with intensity. Give the stage a faint dot-grid background in CSS that matches the cell size. A virtual cursor wanders when the pointer is away. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (animate only on pointer events). Vanilla HTML, CSS and JavaScript.',
 css:`.gt{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:#07070c radial-gradient(#2a2a3a 1px,transparent 1.4px) 0 0/13px 20px;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.gt canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('gt','#6c6c86').replace('font-size:12px','font:12px/1 ui-monospace,SFMono-Regular,Menlo,monospace')}`,
 html:`<div class="gt"><canvas aria-hidden="true"></canvas><p class="gt-hint">Write with your cursor</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gt'),cv=root.querySelector('canvas');
${BOOT}
var CW=13,CH=20,cols=0,rows=0,field=null,ramp=' .:-=+*#%@';
Stage(root,cv,function(s){var c=s.ctx;c.clearRect(0,0,s.W,s.H);if(!field)return;var cx=s.x/CW,cy=s.y/CH,sp=Math.min(1,Math.hypot(s.vx,s.vy)/26),R=3;
 for(var j=Math.max(0,Math.floor(cy-R-1));j<=Math.min(rows-1,Math.ceil(cy+R+1));j++)for(var i=Math.max(0,Math.floor(cx-R-1));i<=Math.min(cols-1,Math.ceil(cx+R+1));i++){var d2=(i+.5-cx)*(i+.5-cx)+(j+.5-cy)*(j+.5-cy),k=j*cols+i;field[k]=Math.min(1.15,field[k]+Math.exp(-d2/3.2)*(.3+.6*sp))}
 c.font='600 15px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';c.textBaseline='top';
 for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){var k2=y*cols+x,f=field[k2];if(f<.06){field[k2]=f*.9;continue}field[k2]=f*.955;var ch=ramp.charAt(Math.min(9,Math.floor(f*9)));if(ch===' ')continue;c.fillStyle='hsl('+(255+x/cols*85)+',92%,'+(48+Math.min(1,f)*30)+'%)';c.globalAlpha=Math.min(1,.25+f);c.fillText(ch,x*CW+1,y*CH+2)}
 c.globalAlpha=1},function(s){cols=Math.ceil(s.W/CW);rows=Math.ceil(s.H/CH);field=new Float32Array(cols*rows)});})();`},

{id:'s-confetti-cursor',title:'Confetti cursor',component:'Confetti cursor',key:'confetti-cursor',family,width:780,
 description:'Tumbling paper confetti spills from the cursor as it moves and bursts when you click.',
 prompt:'Create a confetti cursor on a light stage canvas. Particles are small rectangles with width 5-10px, height 8-15px, a rotation, a spin and a flip phase whose cosine scales the height so the paper appears to turn in 3D. Spawn particles along the cursor path in proportion to its speed (inheriting about a third of its velocity plus a random spread) and 90 at once on click. Apply gravity 0.12, drag 0.985, fade the last 25% of the life and remove particles that leave the stage; cap the pool at 700. Use a six colour palette (violet, pink, amber, green, sky, grey-white). Idle: a virtual cursor wanders so confetti keeps falling. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.cf{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.cf canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('cf','var(--sc-muted)')}`,
 html:`<div class="cf"><canvas aria-hidden="true"></canvas><p class="cf-hint">Move · click to pop</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cf'),cv=root.querySelector('canvas');
${BOOT}
var P=[],cols=['#7c5cff','#ff5fa8','#ffb454','#2fd6a0','#38bdf8','#c9c9d6'];
function spawn(x,y,vx,vy,n,spread){for(var i=0;i<n;i++){var a=Math.random()*6.283,sp=Math.random()*spread;P.push({x:x,y:y,vx:vx*.33+Math.cos(a)*sp,vy:vy*.33+Math.sin(a)*sp-1.6,w:5+Math.random()*5,h:8+Math.random()*7,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,ph:Math.random()*6.28,vp:.1+Math.random()*.2,c:cols[i%6],life:0,max:150+Math.random()*90})}if(P.length>700)P.splice(0,P.length-700)}
var s=Stage(root,cv,function(s){var c=s.ctx;c.clearRect(0,0,s.W,s.H);var sp=Math.hypot(s.vx,s.vy);if(sp>2)spawn(s.x,s.y,s.vx,s.vy,Math.min(6,Math.floor(sp/6)+1),2.2);
 for(var i=P.length-1;i>=0;i--){var p=P[i];p.vy+=.12;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.ph+=p.vp;p.life++;if(p.life>p.max||p.y>s.H+20){P.splice(i,1);continue}
  c.save();c.globalAlpha=Math.min(1,(p.max-p.life)/(p.max*.25));c.translate(p.x,p.y);c.rotate(p.r);c.scale(1,Math.cos(p.ph));c.fillStyle=p.c;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore()}});
s.click=function(x,y){spawn(x,y,0,0,90,9)};})();`},

{id:'s-chroma-halo',title:'Chroma halo',component:'Chroma halo',key:'chroma-halo',family,width:780,
 description:'Soft ink blooms behind the cursor, split into red, green and blue by the speed of your hand.',
 prompt:'Build a blooming halo trail on a dark stage. Keep a list of blobs; each frame add one blob at the cursor (cap at 120) with an age counter. Draw with additive blending: for every blob draw three solid circles, one red-pink, one green and one blue, offset along the cursor velocity at spawn time (red ahead, blue behind, green centred) so fast movement separates the colours into chromatic fringes. The radius grows from 24px at 0.7px per frame of age and the alpha falls with (1 - age/90)^2. Apply a CSS filter blur(11px) saturate(1.3) on the canvas element, which is a little larger than the stage, so the discs merge into smoke. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.ch{position:relative;height:380px;border:1px solid #1d1d28;border-radius:28px;background:#06060a;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.ch canvas{position:absolute;left:-20px;top:-20px;width:calc(100% + 40px);height:calc(100% + 40px);display:block;filter:blur(11px) saturate(1.3)}
${hint('ch','#6c6c86')}`,
 html:`<div class="ch"><canvas aria-hidden="true"></canvas><p class="ch-hint">Move fast to split the light</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ch'),cv=root.querySelector('canvas');
${BOOT}
var B=[],chan=[[1,'255,70,130',1],[0,'60,255,170',.85],[-1,'70,110,255',1]];
Stage(root,cv,function(s){var c=s.ctx;c.globalCompositeOperation='source-over';c.fillStyle='#06060a';c.fillRect(0,0,s.W,s.H);c.globalCompositeOperation='lighter';B.push({x:s.x,y:s.y,vx:s.vx,vy:s.vy,age:0});if(B.length>120)B.shift();
 for(var i=B.length-1;i>=0;i--){var b=B[i];b.age++;if(b.age>90){B.splice(i,1);continue}var a=Math.pow(1-b.age/90,2)*.5,r=24+b.age*.7;
  chan.forEach(function(ch){c.fillStyle='rgba('+ch[1]+','+(a*ch[2])+')';c.beginPath();c.arc(b.x+b.vx*ch[0]*4.8,b.y+b.vy*ch[0]*4.8,r,0,6.283);c.fill()})}});})();`},

{id:'s-ripple-grid',title:'Ripple grid',component:'Ripple grid',key:'ripple-grid',family,width:780,
 description:'A lattice of tiles that swell, turn and change colour as waves roll out from the cursor and from clicks.',
 prompt:'Make a canvas grid of 24px cells, each drawing a small rounded square at its centre. For every cell compute the distance d to the cursor and an amplitude a = sin(d*0.05 - t*0.006) * exp(-d*0.006), plus a contribution from each click ring: exp(-((d - age*0.35)^2) / (2*30^2)) * (1 - age/2200). Scale the square from 0.5 to about 1.9 with the amplitude, rotate it by a*1.2 radians, and colour it with hsl(255 + a*60, 80%, 60%) at alpha 0.3 + |a|. Click adds a ring and old rings are dropped after 2.2s. Idle: a virtual cursor wanders. Handle devicePixelRatio, resize (rebuild the cell list), off-screen pausing and reduced motion (pointer events only). Vanilla HTML, CSS and JavaScript.',
 css:`.rg{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.rg canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('rg','var(--sc-muted)')}`,
 html:`<div class="rg"><canvas aria-hidden="true"></canvas><p class="rg-hint">Move · click to send a wave</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rg'),cv=root.querySelector('canvas');
${BOOT}
var CS=24,cells=[],rings=[];
function build(s){cells=[];for(var y=CS/2;y<s.H;y+=CS)for(var x=CS/2;x<s.W;x+=CS)cells.push(x,y)}
var s=Stage(root,cv,function(s){var c=s.ctx;c.clearRect(0,0,s.W,s.H);var t=s.t;rings=rings.filter(function(r){return t-r.t<2200});
 for(var i=0;i<cells.length;i+=2){var x=cells[i],y=cells[i+1],d=Math.hypot(x-s.x,y-s.y),a=Math.sin(d*.05-t*.006)*Math.exp(-d*.006);
  for(var k=0;k<rings.length;k++){var r=rings[k],age=t-r.t,dd=Math.hypot(x-r.x,y-r.y)-age*.35;a+=Math.exp(-dd*dd/1800)*(1-age/2200)*.95}
  var m=Math.min(1,Math.abs(a));c.save();c.translate(x,y);c.rotate(a*1.2);var sz=(7+9*m+a*2)*(1);c.fillStyle='hsl('+(255+a*60)+',80%,60%)';c.globalAlpha=Math.min(1,.28+m*.8);var h=Math.max(1.5,sz)/2,rad=Math.min(h,3);c.beginPath();c.moveTo(-h+rad,-h);c.arcTo(h,-h,h,h,rad);c.arcTo(h,h,-h,h,rad);c.arcTo(-h,h,-h,-h,rad);c.arcTo(-h,-h,h,-h,rad);c.fill();c.restore()}},build);
s.click=function(x,y){rings.push({x:x,y:y,t:s.t})};})();`},

{id:'s-morph-cursor',title:'Morph cursor',component:'Morph cursor',key:'morph-cursor',family,width:780,
 description:'A ring-and-dot cursor that stretches around whatever you hover and becomes a text bar over words.',
 prompt:'Create a custom cursor made of a small dot and a larger ring inside a stage (the native cursor is hidden there with cursor:none). The dot follows the pointer with a quick lerp. The ring follows more slowly with an eased position; when the pointer is over an element with data-cursor="box" the ring morphs to that element\'s bounding box (plus 8px/6px padding), adopts its border radius, drops its colour to a soft accent tint and is pulled 30% towards the pointer; over data-cursor="text" it becomes a 3px by 30px bar; otherwise it is a 34px circle. Width, height, radius and colour change with CSS transitions (cubic-bezier(.2,.9,.3,1.15)). The stage holds a headline, three pill links and a gradient card so there is something to hover. When the pointer is away the virtual cursor visits each element in turn so the behaviour can be seen without interaction. Cursor elements are aria-hidden and the real controls stay focusable; reduced motion removes the transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.mc{position:relative;display:grid;gap:24px;justify-items:center;padding:44px 28px 40px;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:none;align-content:center}
.mc *{cursor:none}
.mc-title{margin:0;font:800 clamp(28px,5vw,44px)/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.mc-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.mc-pill{padding:11px 22px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);font-weight:600;font-size:15px;color:inherit;text-decoration:none}
.mc-card{width:min(100%,380px);padding:18px 22px;border-radius:20px;background:linear-gradient(120deg,#7c5cff,#d64bff 60%,#ff7a59);color:#fff;font-weight:700;display:flex;justify-content:space-between;align-items:center}
.mc-ring,.mc-dot{position:absolute;left:0;top:0;pointer-events:none;z-index:5}
.mc-dot{width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--sc-accent);transition:opacity .2s,transform .2s}
.mc-ring{border:1.5px solid var(--sc-accent);width:34px;height:34px;border-radius:17px;transition:width .4s cubic-bezier(.2,.9,.3,1.15),height .4s cubic-bezier(.2,.9,.3,1.15),border-radius .4s,background .3s,border-color .3s;mix-blend-mode:normal}
.mc-ring.is-box{background:var(--sc-ring);border-color:transparent}
.mc-ring.is-text{border-color:transparent;background:var(--sc-accent);border-radius:2px}
.mc-dot.is-hide{opacity:0;transform:scale(.2)}
@media (prefers-reduced-motion:reduce){.mc-ring,.mc-dot{transition:none}}`,
 html:`<div class="mc"><h2 class="mc-title" data-cursor="text">Hover anything.</h2><div class="mc-row"><a class="mc-pill" href="#" data-cursor="box">Work</a><a class="mc-pill" href="#" data-cursor="box">Studio</a><a class="mc-pill" href="#" data-cursor="box">Contact</a></div><div class="mc-card" data-cursor="box"><span>View the project</span><span aria-hidden="true">→</span></div><span class="mc-ring" aria-hidden="true"></span><span class="mc-dot" aria-hidden="true"></span></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.mc'),ring=root.querySelector('.mc-ring'),dot=root.querySelector('.mc-dot'),items=[].slice.call(root.querySelectorAll('[data-cursor]'));
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,px=-100,py=-100,rx=-100,ry=-100,dx=-100,dy=-100,inside=false,raf=0,visible=true,tour=0,tourAt=0,tx=0,ty=0;
root.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});
function hit(x,y){for(var i=0;i<items.length;i++){var b=items[i].getBoundingClientRect(),r=root.getBoundingClientRect();if(x>=b.left-r.left&&x<=b.right-r.left&&y>=b.top-r.top&&y<=b.bottom-r.top)return items[i]}return null}
function frame(now){raf=0;var x=px,y=py;
 if(!inside){if(now-tourAt>1700){tourAt=now;tour=(tour+1)%items.length;var b=items[tour].getBoundingClientRect(),r=root.getBoundingClientRect();tx=b.left-r.left+b.width*(.3+Math.random()*.4);ty=b.top-r.top+b.height*(.3+Math.random()*.4)}x=tx;y=ty}
 dx+=(x-dx)*.45;dy+=(y-dy)*.45;var el=hit(x,y),mode=el?el.getAttribute('data-cursor'):'',w=34,h=34,rad=17,cx=x,cy=y;
 if(mode==='box'){var b2=el.getBoundingClientRect(),r2=root.getBoundingClientRect();w=b2.width+16;h=b2.height+12;rad=parseFloat(getComputedStyle(el).borderTopLeftRadius)+8||10;cx=b2.left-r2.left+b2.width/2+(x-(b2.left-r2.left+b2.width/2))*.3;cy=b2.top-r2.top+b2.height/2+(y-(b2.top-r2.top+b2.height/2))*.3}
 else if(mode==='text'){w=3;h=32;rad=2}
 rx+=(cx-rx)*.22;ry+=(cy-ry)*.22;ring.style.width=w+'px';ring.style.height=h+'px';ring.style.borderRadius=rad+'px';ring.style.transform='translate('+(rx-w/2).toFixed(1)+'px,'+(ry-h/2).toFixed(1)+'px)';
 ring.className='mc-ring'+(mode==='box'?' is-box':mode==='text'?' is-text':'');dot.className='mc-dot'+(mode?' is-hide':'');dot.style.transform=(mode?'scale(.2) ':'')+'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px)';
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;inside=true;if(reduce)go()});
root.addEventListener('pointerleave',function(){inside=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-dither-trail',title:'Dither trail',component:'Dither trail',key:'dither-trail',family,width:780,
 description:'A trail drawn in chunky one-bit dither that fades through its own halftone steps.',
 prompt:'Create a pixel-art cursor trail. Render at a low resolution (one cell is 5 CSS pixels) into a small canvas that is scaled up with image-rendering: pixelated. Keep a Float32Array field. Each frame deposit a disc of radius 7 cells at the cursor (value 1 - distance/7, kept with max), multiply the field by 0.972 and turn it into pixels with a 4x4 Bayer matrix: a pixel is on when field > bayer value. On pixels use the current text colour (read from the stage\'s computed colour) and off pixels are transparent so the theme background shows. Resample the field when the stage resizes. Idle: a virtual cursor wanders. Pause off-screen; reduced motion animates only on pointer events. Vanilla HTML, CSS and JavaScript.',
 css:`.dt{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.dt canvas{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated}
${hint('dt','var(--sc-muted)')}`,
 html:`<div class="dt"><canvas aria-hidden="true"></canvas><p class="dt-hint">Draw in dither</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.dt'),cv=root.querySelector('canvas');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,SC=5,cw=0,ch=0,field=null,img=null,px=0,py=0,inside=false,raf=0,visible=true,until=0,ink=[17,17,19],lastInk=0,first=true,cx=0,cy=0,ctx=cv.getContext('2d'),bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function size(){cw=Math.max(1,Math.ceil(cv.clientWidth/SC));ch=Math.max(1,Math.ceil(cv.clientHeight/SC));cv.width=cw;cv.height=ch;field=new Float32Array(cw*ch);img=ctx.createImageData(cw,ch);first=true}
function readInk(){var m=getComputedStyle(root).color.match(/[0-9.]+/g);if(m)ink=[+m[0],+m[1],+m[2]]}
function frame(now){raf=0;if(!img)return;if(now-lastInk>600){lastInk=now;readInk()}var tx,ty,W=cv.clientWidth,H=cv.clientHeight;if(inside){tx=px;ty=py}else{tx=W*(.5+.34*Math.sin(now*.00071)+.1*Math.sin(now*.0023));ty=H*(.5+.3*Math.sin(now*.00097+1)+.08*Math.cos(now*.0021))}
 if(first){cx=tx;cy=ty;first=false}
 var steps=Math.max(1,Math.ceil(Math.hypot(tx-cx,ty-cy)/(SC*2)));for(var k=1;k<=steps;k++){var x=(cx+(tx-cx)*k/steps)/SC,y=(cy+(ty-cy)*k/steps)/SC,R=7;
  for(var j=Math.max(0,Math.floor(y-R));j<=Math.min(ch-1,Math.ceil(y+R));j++)for(var i=Math.max(0,Math.floor(x-R));i<=Math.min(cw-1,Math.ceil(x+R));i++){var d=Math.hypot(i+.5-x,j+.5-y);if(d<R){var v=1-d/R,idx=j*cw+i;if(v>field[idx])field[idx]=v}}}
 cx=tx;cy=ty;var data=img.data;
 for(var y2=0;y2<ch;y2++)for(var x2=0;x2<cw;x2++){var f=field[y2*cw+x2]*=.972,o=(y2*cw+x2)*4;if(f>(bayer[(y2&3)*4+(x2&3)]+.5)/16){data[o]=ink[0];data[o+1]=ink[1];data[o+2]=ink[2];data[o+3]=255}else data[o+3]=0}
 ctx.putImageData(img,0,0);if(visible&&(!reduce||now<until))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function poke(){until=performance.now()+1200;go()}
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;inside=true;if(reduce)poke()});
root.addEventListener('pointerleave',function(){inside=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;size();go()}}).observe(cv)}else{size();go()}
if(!reduce)go();else poke();})();`},

{id:'s-drafting-crosshair',title:'Drafting crosshair',component:'Drafting crosshair',key:'drafting-crosshair',family,width:780,
 description:'Hairline crosshairs with edge rulers and a live readout; drag to measure width, height, distance and angle.',
 prompt:'Build an engineering-style cursor on a canvas with faint blueprint shapes (a circle, a rectangle, centre lines). Draw 22px rulers along the top and left edges with ticks every 10px, taller ticks every 50px and numbers every 100px, and mark the cursor position on both rulers. Draw hairline crosshairs across the whole stage that leave a 10px gap around the cursor, and a small monospace chip next to the cursor showing "x 312  y 148". Dragging (pointerdown, move, up) measures a rectangle: dashed outline, a very light fill, a width label above the top edge, a height label at the right edge and a chip at the bottom with the distance and angle in degrees. The last measurement stays until the next drag starts. When nobody is hovering the demo plays a repeating cycle: the virtual cursor wanders, then performs a short measured drag between two points and holds the result. Use theme colours, honour devicePixelRatio, pause off-screen and for reduced motion only draw on pointer events. Vanilla HTML, CSS and JavaScript.',
 css:`.dc{position:relative;height:380px;border:1px solid var(--sc-line);border-radius:28px;background:linear-gradient(var(--sc-line) 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,var(--sc-line) 1px,transparent 1px) 0 0/22px 22px,var(--sc-surface);overflow:hidden;cursor:none;touch-action:pan-y}
.dc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('dc','var(--sc-muted)').replace('bottom:14px','bottom:8px')}`,
 html:`<div class="dc"><canvas aria-hidden="true"></canvas><p class="dc-hint">Drag to measure</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.dc'),cv=root.querySelector('canvas');
${BOOT}
var meas=null,drag=null;
function plan(n,W,H){return {a:[W*(.18+.14*Math.abs(Math.sin(n*2.1+1))),H*(.28+.2*Math.abs(Math.sin(n*1.3+2)))],b:[W*(.5+.26*Math.abs(Math.sin(n*1.7+.5))),H*(.58+.2*Math.abs(Math.sin(n*2.9+3)))]}}
function css(n){return getComputedStyle(root).getPropertyValue(n).trim()}
function chip(c,txt,x,y,fg,bg){c.font='600 11px ui-monospace,SFMono-Regular,Menlo,monospace';var w=c.measureText(txt).width+12;c.fillStyle=bg;c.beginPath();c.roundRect?c.roundRect(x,y,w,20,6):c.rect(x,y,w,20);c.fill();c.fillStyle=fg;c.textBaseline='middle';c.fillText(txt,x+6,y+10);return w}
var s=Stage(root,cv,function(s){var c=s.ctx,accent=css('--sc-accent')||'#6d5ef5',fg=css('--sc-fg')||'#111',muted=css('--sc-muted')||'#888',line=css('--sc-line')||'#ddd',bg=css('--sc-bg')||'#fff',W=s.W,H=s.H,t=s.t;
 c.clearRect(0,0,W,H);var cx=s.x,cy=s.y,m=drag||meas;
 if(!s.inside&&!drag){var ph=(t%7000)/7000,n=Math.floor(t/7000),cur=plan(n,W,H),prev=plan(n-1,W,H);
  if(ph<.18){var k0=ph/.18,e0=k0*k0*(3-2*k0);cx=prev.b[0]+(cur.a[0]-prev.b[0])*e0;cy=prev.b[1]+(cur.a[1]-prev.b[1])*e0;m={x0:prev.a[0],y0:prev.a[1],x1:prev.b[0],y1:prev.b[1]}}
  else if(ph<.5){var k=(ph-.18)/.32,e=k*k*(3-2*k);cx=cur.a[0]+(cur.b[0]-cur.a[0])*e;cy=cur.a[1]+(cur.b[1]-cur.a[1])*e;m={x0:cur.a[0],y0:cur.a[1],x1:cx,y1:cy}}
  else{cx=cur.b[0];cy=cur.b[1];m={x0:cur.a[0],y0:cur.a[1],x1:cx,y1:cy}}}
 c.strokeStyle=line;c.lineWidth=1.2;c.beginPath();c.arc(W*.7,H*.52,64,0,6.283);c.moveTo(W*.7-84,H*.52);c.lineTo(W*.7+84,H*.52);c.moveTo(W*.7,H*.52-84);c.lineTo(W*.7,H*.52+84);c.stroke();c.strokeRect(W*.16,H*.3,150,96);
 c.strokeStyle=line;c.setLineDash([6,5]);c.strokeRect(W*.16-12,H*.3-12,174,120);c.setLineDash([]);
 c.fillStyle=bg;c.globalAlpha=.9;c.fillRect(0,0,W,22);c.fillRect(0,0,22,H);c.globalAlpha=1;c.strokeStyle=muted;c.fillStyle=muted;c.font='9px ui-monospace,monospace';c.textBaseline='top';c.lineWidth=1;
 for(var x=0;x<W;x+=10){var L=x%100===0?10:x%50===0?7:4;c.beginPath();c.moveTo(x+.5,22);c.lineTo(x+.5,22-L);c.stroke();if(x%100===0&&x>0)c.fillText(x,x+3,2)}
 for(var y=0;y<H;y+=10){var L2=y%100===0?10:y%50===0?7:4;c.beginPath();c.moveTo(22,y+.5);c.lineTo(22-L2,y+.5);c.stroke();if(y%100===0&&y>0){c.save();c.translate(2,y-3);c.rotate(-Math.PI/2);c.fillText(y,0,0);c.restore()}}
 c.fillStyle=accent;c.fillRect(cx-1,0,2,22);c.fillRect(0,cy-1,22,2);
 c.strokeStyle=accent;c.globalAlpha=.55;c.lineWidth=1;c.beginPath();c.moveTo(22,cy+.5);c.lineTo(cx-10,cy+.5);c.moveTo(cx+10,cy+.5);c.lineTo(W,cy+.5);c.moveTo(cx+.5,22);c.lineTo(cx+.5,cy-10);c.moveTo(cx+.5,cy+10);c.lineTo(cx+.5,H);c.stroke();c.globalAlpha=1;
 c.strokeStyle=accent;c.lineWidth=1.4;c.beginPath();c.arc(cx,cy,3.5,0,6.283);c.stroke();
 if(m){var x0=Math.min(m.x0,m.x1),y0=Math.min(m.y0,m.y1),w=Math.abs(m.x1-m.x0),h=Math.abs(m.y1-m.y0);c.fillStyle=accent;c.globalAlpha=.08;c.fillRect(x0,y0,w,h);c.globalAlpha=1;c.setLineDash([5,4]);c.strokeStyle=accent;c.lineWidth=1.3;c.strokeRect(x0+.5,y0+.5,w,h);c.setLineDash([]);
  [[m.x0,m.y0],[m.x1,m.y0],[m.x0,m.y1],[m.x1,m.y1]].forEach(function(p){c.fillStyle=bg;c.strokeStyle=accent;c.fillRect(p[0]-3,p[1]-3,6,6);c.strokeRect(p[0]-3,p[1]-3,6,6)});
  var dist=Math.hypot(m.x1-m.x0,m.y1-m.y0),ang=Math.round(Math.atan2(-(m.y1-m.y0),m.x1-m.x0)*180/Math.PI);if(w>40)chip(c,Math.round(w)+' px',x0+w/2-22,Math.max(26,y0-26),bg,accent);if(h>40)chip(c,Math.round(h)+' px',Math.min(W-70,x0+w+8),y0+h/2-10,bg,accent);
  if(dist>30)chip(c,'\\u0394 '+Math.round(m.x1-m.x0)+', '+Math.round(m.y1-m.y0)+'  \\u00b7  '+Math.round(dist)+' px  \\u00b7  '+ang+'\\u00b0',Math.max(30,Math.min(W-230,x0+w/2-95)),Math.min(H-26,y0+h+10),bg,fg)}
 else chip(c,'x '+Math.round(cx)+'  y '+Math.round(cy),Math.min(W-100,cx+14),Math.min(H-26,cy+14),bg,fg);
 if(m&&(s.inside||drag))chip(c,'x '+Math.round(cx)+'  y '+Math.round(cy),Math.min(W-100,cx+14),Math.max(30,cy-34),bg,fg)});
root.addEventListener('pointerdown',function(){drag={x0:s.px,y0:s.py,x1:s.px,y1:s.py};meas=null});
root.addEventListener('pointermove',function(){if(drag){drag.x1=s.px;drag.y1=s.py}});
function end(){if(drag){var d=drag;drag=null;if(Math.hypot(d.x1-d.x0,d.y1-d.y0)>6)meas=d}}
root.addEventListener('pointerup',end);root.addEventListener('pointerleave',end);})();`}
];
