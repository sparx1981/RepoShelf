// Original image effects and visual centrepieces. Artwork is generated in the browser; nothing is loaded from elsewhere.
import {ART} from './art-boot.mjs';
import {BOOT} from './cursorfx-boot.mjs';
const family='3D & galleries';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
const hint=(cls,colour)=>`.${cls}-hint{position:absolute;left:0;right:0;bottom:12px;margin:0;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${colour};pointer-events:none}`;
export const galleryB=[
{id:'s-compare-slider',title:'Before & after slider',component:'Before & after slider',key:'compare-slider',family,width:800,
 description:'A draggable before-and-after reveal with keyboard control, three scenes and a gentle demo sweep.',
 prompt:'Build an image comparison slider. Two layers are stacked: the "after" artwork in full colour and the "before" version (the same picture with filter: grayscale(1) contrast(.85) brightness(.9)) clipped with clip-path: inset(0 calc(100% - var(--p)) 0 0). A vertical divider with a round grip sits at --p. Pointer dragging anywhere on the stage sets the position; a real input type=range (visually hidden but focusable, aria-label "Reveal") is kept in sync so arrow keys work and the grip shows a focus ring on :focus-visible. Three scene buttons (aria-pressed) switch the artwork, which is generated procedurally on a canvas and stored as a data URL. Corner labels read Before and After. While nobody has touched the control the divider sweeps slowly between 25% and 75%. Pause off-screen, no sweep for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.cp{display:grid;gap:14px;padding:14px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.cp-stage{--p:50%;position:relative;height:380px;border-radius:18px;overflow:hidden;cursor:ew-resize;touch-action:pan-y;user-select:none}
.cp-img{position:absolute;inset:0;background-size:cover;background-position:center}
.cp-before{filter:grayscale(1) contrast(.85) brightness(.9);clip-path:inset(0 calc(100% - var(--p)) 0 0)}
.cp-line{position:absolute;top:0;bottom:0;left:var(--p);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.5)}
.cp-grip{position:absolute;top:50%;left:var(--p);width:44px;height:44px;margin:-22px 0 0 -22px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#222;box-shadow:0 6px 20px rgba(0,0,0,.4);font-weight:800;font-size:15px;pointer-events:none}
.cp-range{position:absolute;width:1px;height:1px;opacity:0}
.cp-range:focus-visible~.cp-grip{outline:3px solid var(--sc-accent);outline-offset:3px}
.cp-tag{position:absolute;top:14px;padding:5px 11px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;pointer-events:none}
.cp-tag.a{right:14px}.cp-tag.b{left:14px}
.cp-tabs{display:flex;gap:8px;justify-content:center}
.cp-tab{padding:7px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.cp-tab[aria-pressed=true]{border-color:var(--sc-accent);background:var(--sc-ring)}`,
 html:`<div class="cp"><div class="cp-stage"><div class="cp-img cp-after"></div><div class="cp-img cp-before"></div><div class="cp-line"></div><input class="cp-range" type="range" min="0" max="100" value="50" aria-label="Reveal"><div class="cp-grip" aria-hidden="true">&#8644;</div><span class="cp-tag b">Before</span><span class="cp-tag a">After</span></div><div class="cp-tabs"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cp'),stage=root.querySelector('.cp-stage'),after=root.querySelector('.cp-after'),before=root.querySelector('.cp-before'),range=root.querySelector('.cp-range'),tabs=root.querySelector('.cp-tabs');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,pos=50,touched=false,drag=false,raf=0,visible=true,btns=[],scenes=[0,2,5];
function set(p){pos=Math.max(0,Math.min(100,p));stage.style.setProperty('--p',pos.toFixed(2)+'%');range.value=Math.round(pos)}
function scene(n){var url='url('+artURL(scenes[n],800,380)+')';after.style.backgroundImage=url;before.style.backgroundImage=url;btns.forEach(function(b,i){b.setAttribute('aria-pressed',String(i===n))})}
scenes.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.className='cp-tab';b.textContent=NAMES[s];b.addEventListener('click',function(){scene(i)});tabs.appendChild(b);btns.push(b)});
function frame(now){raf=0;if(!touched&&!drag)set(50+25*Math.sin(now/1500));if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
function at(e){var r=stage.getBoundingClientRect();set((e.clientX-r.left)/r.width*100)}
stage.addEventListener('pointerdown',function(e){drag=true;touched=true;at(e);try{stage.setPointerCapture(e.pointerId)}catch(_){}});
stage.addEventListener('pointermove',function(e){if(drag)at(e)});
function up(){drag=false}stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
range.addEventListener('input',function(){touched=true;set(+range.value)});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
scene(0);set(50);go();})();`},

{id:'s-particle-image',title:'Particle image',component:'Particle image',key:'particle-image',family,width:800,
 description:'A landscape built from thousands of coloured particles that swirl apart around the pointer and reform into the next scene.',
 prompt:'Turn a generated landscape into particles. Draw the artwork cover-fitted into an offscreen canvas the size of the stage, read its pixels every 4th pixel (about 10,000 particles) and give every particle a home position, current position, velocity and a colour. Render by writing 2x2 pixel blocks straight into an ImageData buffer (a Uint32Array view) rather than drawing shapes. Each frame apply a spring to home (0.05) with damping 0.86; the pointer repels particles within 80px with a swirl (add a perpendicular component of 60% to the repulsion). Every six seconds when idle, or on click, scatter the particles with a radial impulse and swap their colours to the next artwork so the picture reassembles as a different scene. Start scattered so the first image assembles. Handle resize, pause off-screen and for reduced motion draw the assembled image without animation. Vanilla HTML, CSS and JavaScript.',
 css:`.pi{position:relative;border:1px solid #1d1d28;border-radius:28px;background:#08080e;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.pi canvas{display:block;width:100%;height:380px}
${hint('pi','#8a8aa8')}`,
 html:`<div class="pi"><canvas role="img" aria-label="A landscape made of coloured particles"></canvas><p class="pi-hint">Move through it · click to change scene</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pi'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=0,H=0,N=0,hx,hy,px,py,vx,vy,col,img,u32,scene=0,ptr=null,raf=0,visible=true,next=0,BG=0xff0e0808;
function loadColours(i){var a=art(i,W,H),d=a.getContext('2d').getImageData(0,0,W,H).data,k=0,step=4;for(var y=0;y<H;y+=step)for(var x=0;x<W;x+=step){var o=(y*W+x)*4;col[k++]=(255<<24)|(d[o+2]<<16)|(d[o+1]<<8)|d[o]}}
function build(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W;cv.height=H;var step=4;N=Math.ceil(W/step)*Math.ceil(H/step);hx=new Float32Array(N);hy=new Float32Array(N);px=new Float32Array(N);py=new Float32Array(N);vx=new Float32Array(N);vy=new Float32Array(N);col=new Uint32Array(N);var k=0;
 for(var y=0;y<H;y+=step)for(var x=0;x<W;x+=step){hx[k]=x;hy[k]=y;if(reduce){px[k]=x;py[k]=y}else{px[k]=Math.random()*W;py[k]=Math.random()*H}k++}
 loadColours(scene);img=ctx.createImageData(W,H);u32=new Uint32Array(img.data.buffer);next=performance.now()+6000;draw()}
function draw(){u32.fill(BG);for(var i=0;i<N;i++){var x=px[i]|0,y=py[i]|0;if(x<0||y<0||x>=W-2||y>=H-2)continue;var o=y*W+x,c=col[i];u32[o]=c;u32[o+1]=c;u32[o+2]=c;u32[o+W]=c;u32[o+W+1]=c;u32[o+W+2]=c;u32[o+2*W]=c;u32[o+2*W+1]=c;u32[o+2*W+2]=c}ctx.putImageData(img,0,0)}
function scatter(){scene=(scene+3)%8;loadColours(scene);for(var i=0;i<N;i++){var a=Math.atan2(py[i]-H/2,px[i]-W/2)+(Math.random()-.5),s=6+Math.random()*16;vx[i]+=Math.cos(a)*s;vy[i]+=Math.sin(a)*s}}
function frame(now){raf=0;if(!ptr&&now>next){next=now+6500;scatter()}
 for(var i=0;i<N;i++){var dx=px[i]-(ptr?ptr.x:-999),dy=py[i]-(ptr?ptr.y:-999);if(ptr){var d=Math.sqrt(dx*dx+dy*dy)+.001;if(d<80){var f=(1-d/80)*3.2;vx[i]+=(dx/d-dy/d*.6)*f;vy[i]+=(dy/d+dx/d*.6)*f}}
  vx[i]+=(hx[i]-px[i])*.05;vy[i]+=(hy[i]-py[i])*.05;vx[i]*=.86;vy[i]*=.86;px[i]+=vx[i];py[i]+=vy[i]}
 draw();if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});root.addEventListener('pointerleave',function(){ptr=null});root.addEventListener('pointerdown',function(){next=performance.now()+7000;scatter();go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;build();go()}}).observe(cv)}else{build();go()}})();`},

{id:'s-bulge-card',title:'Bulge card',component:'Bulge card',key:'bulge-card',family,width:560,
 description:'A photo card whose picture swells like a lens under the cursor while the whole card tilts in 3D.',
 prompt:'Make an image card (300x380 CSS pixels, canvas backing 1.5x) whose picture bulges under the cursor. Keep the artwork as a Uint32Array of pixels. Each frame copy the source into the output buffer and then, inside a radius of 95px around the (eased) cursor, replace every pixel by the source pixel sampled at centre + offset * (1 - strength * (1 - d^2/R^2)^2) with strength 0.55, which magnifies the centre and compresses the rim, and add up to 25% brightness near the centre for a glassy highlight. The strength eases to 0 when the pointer leaves, and a virtual cursor drifts across the card when idle. Wrap the canvas in an element that tilts with perspective(900px) rotateX/rotateY of up to 8 degrees towards the pointer. Overlay a title and caption as real text. Pause off-screen; for reduced motion draw the static image. Vanilla HTML, CSS and JavaScript.',
 css:`.bc{display:grid;place-items:center;padding:34px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.bc-tilt{position:relative;width:300px;height:380px;border-radius:22px;overflow:hidden;transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));box-shadow:0 34px 50px -24px rgba(0,0,0,.6);transition:box-shadow .3s}
.bc canvas{display:block;width:300px;height:380px}
.bc-cap{position:absolute;left:0;right:0;bottom:0;padding:56px 20px 20px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.6));pointer-events:none}
.bc-cap strong{display:block;font:800 26px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}
.bc-cap span{font-size:13px;opacity:.85}`,
 html:`<div class="bc"><div class="bc-tilt"><canvas aria-hidden="true"></canvas><div class="bc-cap"><strong>Mesa Hour</strong><span>Warp the light with your cursor</span></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.bc'),tilt=root.querySelector('.bc-tilt'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,S=1.5,w=450,h=570,src,out,o32,s32,cx=w/2,cy=h/2,tx=w/2,ty=h/2,str=0,tstr=0,inside=false,raf=0,visible=true;
cv.width=w;cv.height=h;var a=art(2,w,h),d=a.getContext('2d').getImageData(0,0,w,h);src=d;s32=new Uint32Array(d.data.buffer.slice(0));out=ctx.createImageData(w,h);o32=new Uint32Array(out.data.buffer);o32.set(s32);ctx.putImageData(out,0,0);
function frame(now){raf=0;var t=now/1000;if(!inside){tx=w*(.5+.28*Math.sin(t*.8));ty=h*(.5+.25*Math.sin(t*1.1+1));tstr=.5}
 cx+=(tx-cx)*.15;cy+=(ty-cy)*.15;str+=(tstr-str)*.12;o32.set(s32);var R=95*S,R2=R*R,x0=Math.max(0,Math.floor(cx-R)),x1=Math.min(w-1,Math.ceil(cx+R)),y0=Math.max(0,Math.floor(cy-R)),y1=Math.min(h-1,Math.ceil(cy+R));
 if(str>.01)for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++){var dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy;if(d2>=R2)continue;var f=1-d2/R2,k=1-str*f*f,sx=Math.round(cx+dx*k),sy=Math.round(cy+dy*k),c=s32[sy*w+sx],lift=1+f*f*.28*str/.55;
  var r=Math.min(255,(c&255)*lift),g=Math.min(255,((c>>8)&255)*lift),b=Math.min(255,((c>>16)&255)*lift);o32[y*w+x]=(255<<24)|(b<<16)|(g<<8)|r}
 ctx.putImageData(out,0,0);if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
tilt.addEventListener('pointermove',function(e){var r=tilt.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height;inside=true;tx=nx*w;ty=ny*h;tstr=.55;tilt.style.setProperty('--ry',((nx-.5)*16).toFixed(2)+'deg');tilt.style.setProperty('--rx',((.5-ny)*16).toFixed(2)+'deg')});
tilt.addEventListener('pointerleave',function(){inside=false;tilt.style.setProperty('--ry','0deg');tilt.style.setProperty('--rx','0deg')});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-pond-image',title:'Pond image',component:'Pond image',key:'pond-image',family,width:800,
 description:'A landscape you can stir like water: ripples refract the picture and catch the light.',
 prompt:'Make a photo that behaves like a pond. Use a water height field at half the backing resolution (two Float32Array buffers, wave step new = (left+right+up+down)/2 - old, times 0.985, run twice per frame). Render the artwork into an ImageData buffer: for each output pixel read the gradient of the height field at its cell (dx = h[right]-h[left], dy = h[down]-h[up]), sample the artwork at the pixel offset by 18 * gradient, and add a specular glint (brightness boost proportional to -(0.6*dx + 0.8*dy)). The pointer disturbs the water in proportion to its speed, a click drops a big stone, and when idle random drops fall every second or so with a wandering virtual pointer. Backing size is about 0.75 of the CSS size, handle resize, pause off-screen and for reduced motion only react to pointer events. Vanilla HTML, CSS and JavaScript.',
 css:`.pd{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:#0b0b12;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.pd canvas{display:block;width:100%;height:380px}
${hint('pd','rgba(255,255,255,.75)')}`,
 html:`<div class="pd"><canvas role="img" aria-label="A landscape photograph rippling like water"></canvas><p class="pd-hint">Stir the pond · click to drop a stone</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pd'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=0,H=0,gw=0,gh=0,a,b,src,img,o32,s32,px=-1,py=-1,lx=0,ly=0,inside=false,raf=0,visible=true,until=0,nextDrop=0;
function build(){var cw=cv.clientWidth,ch=cv.clientHeight;W=Math.round(cw*.75);H=Math.round(ch*.75);cv.width=W;cv.height=H;gw=Math.ceil(W/2);gh=Math.ceil(H/2);a=new Float32Array(gw*gh);b=new Float32Array(gw*gh);var ar=art(6,W,H);src=ar.getContext('2d').getImageData(0,0,W,H);s32=new Uint32Array(src.data.buffer.slice(0));img=ctx.createImageData(W,H);o32=new Uint32Array(img.data.buffer);o32.set(s32);ctx.putImageData(img,0,0);lx=W/2;ly=H/2}
function drop(x,y,v){var cx=Math.round(x/2),cy=Math.round(y/2);for(var j=-2;j<=2;j++)for(var i=-2;i<=2;i++){var X=cx+i,Y=cy+j;if(X>1&&Y>1&&X<gw-2&&Y<gh-2)a[Y*gw+X]+=v*(1-Math.hypot(i,j)/3)}}
function frame(now){raf=0;if(!a){go();return}var tx,ty;if(inside){tx=px;ty=py}else{tx=W*(.5+.34*Math.sin(now*.0007));ty=H*(.5+.3*Math.sin(now*.00095+1));if(now>nextDrop){nextDrop=now+900+Math.random()*900;drop(Math.random()*W,Math.random()*H,-5)}}
 var sp=Math.hypot(tx-lx,ty-ly);if(sp>1)drop(tx,ty,-Math.min(3,.3+sp*.06));lx=tx;ly=ty;
 for(var st=0;st<2;st++){for(var y=1;y<gh-1;y++)for(var x=1;x<gw-1;x++){var i=y*gw+x;b[i]=((a[i-1]+a[i+1]+a[i-gw]+a[i+gw])/2-b[i])*.985}var t=a;a=b;b=t}
 for(var y2=0;y2<H;y2++){var gy=Math.min(gh-2,Math.max(1,y2>>1));for(var x2=0;x2<W;x2++){var gx=Math.min(gw-2,Math.max(1,x2>>1)),gi=gy*gw+gx,dx=a[gi+1]-a[gi-1],dy=a[gi+gw]-a[gi-gw],sx=x2+dx*18,sy=y2+dy*18;sx=sx<0?0:sx>W-1?W-1:sx;sy=sy<0?0:sy>H-1?H-1:sy;var c=s32[(sy|0)*W+(sx|0)],gl=1+Math.max(-.25,Math.min(.9,-(dx*.6+dy*.8)*.9));
   var r=Math.min(255,(c&255)*gl),g=Math.min(255,((c>>8)&255)*gl),bl=Math.min(255,((c>>16)&255)*gl);o32[y2*W+x2]=(255<<24)|(bl<<16)|(g<<8)|r}}
 ctx.putImageData(img,0,0);if(visible&&(!reduce||now<until))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function poke(){until=performance.now()+1500;go()}
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();px=(e.clientX-r.left)*.75;py=(e.clientY-r.top)*.75;inside=true;if(reduce)poke()});root.addEventListener('pointerleave',function(){inside=false});
root.addEventListener('pointerdown',function(e){var r=cv.getBoundingClientRect();drop((e.clientX-r.left)*.75,(e.clientY-r.top)*.75,-18);if(reduce)poke()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;build();go()}}).observe(cv)}else{build();go()}
if(!reduce)go();})();`},

{id:'s-ember-reveal',title:'Ember reveal',component:'Ember reveal',key:'ember-reveal',family,width:800,
 description:'A burning hole spreads from your click, eating one picture to reveal the next through glowing embers.',
 prompt:'Create a burn transition between two generated pictures. Precompute a noise field n (0..1, three octaves of smoothed value noise) at the backing resolution (about 0.6 of the stage). When a burn starts from a point (a click, or a random point on a timer) every pixel gets t = n * 0.55 + (distance to the origin / max distance) * 0.45 and a moving front p that rises from 0 to 1.25 over about 2.6s. Pixels with t < p - 0.07 show the new picture, pixels with t between p - 0.07 and p form the fire band coloured from white-yellow through orange to deep red with some brightness from n, pixels within 0.05 ahead of the front show the old picture darkened and warmed (charring), and everything else shows the old picture. Write the result to an ImageData Uint32Array each frame. Clicking starts the next burn at the pointer, auto-start every 5s of idle, a button "Burn" is available for keyboard users. Pause off-screen and for reduced motion cross-fade instead. Vanilla HTML, CSS and JavaScript.',
 css:`.er{position:relative;border:1px solid #2a1c18;border-radius:28px;background:#0b0706;overflow:hidden;cursor:crosshair;touch-action:pan-y}
.er canvas{display:block;width:100%;height:380px}
.er-btn{position:absolute;right:14px;bottom:14px;padding:8px 16px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(0,0,0,.45);color:#fff;cursor:pointer;font-size:13px;font-weight:600}
.er-btn:hover{border-color:#ffb36b}
${hint('er','rgba(255,255,255,.8)').replace('left:0;right:0;','left:18px;').replace('text-align:center;','').replace('bottom:12px','bottom:20px')}`,
 html:`<div class="er"><canvas role="img" aria-label="A landscape photograph burning away to reveal another"></canvas><p class="er-hint">Click to ignite</p><button class="er-btn" type="button">Burn</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.er'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),btn=root.querySelector('.er-btn');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=0,H=0,noise,A32,B32,img,o32,cur=0,ox=0,oy=0,start=-1,maxD=1,raf=0,visible=true,nextAuto=0,DUR=2600;
function vnoise(w,h,cell,seed){var gw=Math.ceil(w/cell)+2,gh=Math.ceil(h/cell)+2,g=new Float32Array(gw*gh),s=seed;for(var i=0;i<g.length;i++){s=(s*16807)%2147483647;g[i]=s/2147483647}var o=new Float32Array(w*h);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var fx=x/cell,fy=y/cell,ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);var a=g[iy*gw+ix],b=g[iy*gw+ix+1],c=g[(iy+1)*gw+ix],d=g[(iy+1)*gw+ix+1];o[y*w+x]=a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty}return o}
function px32(i){var c=art(i,W,H),d=c.getContext('2d').getImageData(0,0,W,H);return new Uint32Array(d.data.buffer.slice(0))}
function build(){var cw=cv.clientWidth,ch=cv.clientHeight;W=Math.round(cw*.6);H=Math.round(ch*.6);cv.width=W;cv.height=H;var n1=vnoise(W,H,40,7),n2=vnoise(W,H,18,11),n3=vnoise(W,H,7,23);noise=new Float32Array(W*H);for(var i=0;i<noise.length;i++)noise[i]=n1[i]*.55+n2[i]*.3+n3[i]*.15;
 A32=px32(cur%8);B32=px32((cur+3)%8);img=ctx.createImageData(W,H);o32=new Uint32Array(img.data.buffer);o32.set(A32);ctx.putImageData(img,0,0);start=-1}
function ignite(x,y){if(start>=0)return;ox=x*.6;oy=y*.6;maxD=Math.max(Math.hypot(ox,oy),Math.hypot(W-ox,oy),Math.hypot(ox,H-oy),Math.hypot(W-ox,H-oy));start=performance.now();if(reduce){o32.set(B32);ctx.putImageData(img,0,0);finish()}else go()}
function finish(){start=-1;cur=(cur+3)%8;A32=B32;B32=px32((cur+3)%8);nextAuto=performance.now()+5000}
function frame(now){raf=0;if(start<0){if(!reduce&&now>nextAuto&&visible){var r=cv.getBoundingClientRect();ignite(Math.random()*r.width,Math.random()*r.height)}if(visible)raf=requestAnimationFrame(frame);return}
 var p=(now-start)/DUR*1.25;for(var y=0;y<H;y++)for(var x=0;x<W;x++){var i=y*W+x,t=noise[i]*.55+Math.hypot(x-ox,y-oy)/maxD*.45,c;
  if(t<p-.07)c=B32[i];else if(t<p){var f=(p-t)/.07,n=noise[i],heat=1-f,r=255,g=Math.min(255,90+heat*190*(.6+n*.6)),b=Math.min(255,20+heat*heat*210);c=(255<<24)|(b<<16)|(g<<8)|r;if(f<.35){var k=f/.35,rr=Math.min(255,(B32[i]&255)*(1-k)+255*k),gg=((B32[i]>>8)&255)*(1-k)+g*k,bb=((B32[i]>>16)&255)*(1-k)+b*k;c=(255<<24)|((bb|0)<<16)|((gg|0)<<8)|(rr|0)}}
  else if(t<p+.05){var d=A32[i],q=1-(t-p)/.05*.0;c=(255<<24)|(((((d>>16)&255)*.18)|0)<<16)|(((((d>>8)&255)*.28)|0)<<8)|Math.min(255,((d&255)*.55+40)|0)}
  else c=A32[i];o32[i]=c}
 ctx.putImageData(img,0,0);if(p>1.25){finish();o32.set(A32);ctx.putImageData(img,0,0)}if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
cv.addEventListener('pointerdown',function(e){var r=cv.getBoundingClientRect();ignite(e.clientX-r.left,e.clientY-r.top)});
btn.addEventListener('click',function(){var r=cv.getBoundingClientRect();ignite(r.width*.5,r.height*.5)});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible){nextAuto=performance.now()+1800;go()}}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;build();nextAuto=performance.now()+1800;go()}}).observe(cv)}else{build();go()}})();`},

{id:'s-pixel-reveal',title:'Pixel reveal',component:'Pixel reveal',key:'pixel-reveal',family,width:800,
 description:'A picture resolves from coarse blocks to fine pixels in a diagonal sweep; hovering re-pixelates it under your cursor.',
 prompt:'Build a pixel-sweep reveal on a canvas. Pre-render the artwork at full resolution and at three pixelated sizes (20, 10 and 5 px blocks) by drawing it to small canvases and scaling up with image smoothing disabled. Divide the stage into 20px blocks with a delay based on the diagonal position plus noise. For each block draw nothing before its delay, then the 20px version, the 10px version, the 5px version and finally the full version at intervals of 130ms using drawImage from the matching canvas. Hovering the stage re-pixelates a circle of radius 90 around the pointer with the 12px version (clip an arc and draw the pixelated canvas over it). A Replay button restarts the sweep with the next scene; it also replays every 7s. Pause off-screen; reduced motion shows the finished picture. Vanilla HTML, CSS and JavaScript.',
 css:`.px2{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.px2 canvas{display:block;width:100%;height:380px}
.px2-btn{position:absolute;right:14px;bottom:14px;padding:8px 16px;border:1px solid rgba(255,255,255,.4);border-radius:999px;background:rgba(0,0,0,.5);color:#fff;cursor:pointer;font-size:13px;font-weight:600}
.px2-btn:hover{border-color:#fff}`,
 html:`<div class="px2"><canvas role="img" aria-label="A landscape photograph resolving from large pixels"></canvas><button class="px2-btn" type="button">Replay</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.px2'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),btn=root.querySelector('.px2-btn');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=0,H=0,B=20,full,p20,p10,p5,p12,delays=[],cols=0,rows=0,t0=0,scene=0,ptr=null,raf=0,visible=true,timer=0,done=false;
function pix(src,b){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(W/b));c.height=Math.max(1,Math.round(H/b));var x=c.getContext('2d');x.drawImage(src,0,0,c.width,c.height);return c}
function build(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W;cv.height=H;load();}
function load(){full=art(scene,W,H);p20=pix(full,20);p10=pix(full,10);p5=pix(full,5);p12=pix(full,12);cols=Math.ceil(W/B);rows=Math.ceil(H/B);delays=[];for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)delays.push((c/cols+r/rows)*900+Math.random()*500);t0=performance.now();done=reduce;go()}
function blk(c,sx,sy,w,h,dx,dy,dw,dh){ctx.drawImage(c,sx,sy,w,h,dx,dy,dw,dh)}
function frame(now){raf=0;var t=now-t0,all=true;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#0b0b12';ctx.fillRect(0,0,W,H);
 for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){var d=delays[r*cols+c],e=t-d,x=c*B,y=r*B,w=Math.min(B,W-x),h=Math.min(B,H-y);if(done)e=1e6;if(e<0){all=false;continue}
  if(e<130){blk(p20,x*p20.width/W,y*p20.height/H,w*p20.width/W,h*p20.height/H,x,y,w,h);all=false}else if(e<260){blk(p10,x*p10.width/W,y*p10.height/H,w*p10.width/W,h*p10.height/H,x,y,w,h);all=false}else if(e<390){blk(p5,x*p5.width/W,y*p5.height/H,w*p5.width/W,h*p5.height/H,x,y,w,h);all=false}else blk(full,x,y,w,h,x,y,w,h)}
 if(ptr&&all){ctx.save();ctx.beginPath();ctx.arc(ptr.x,ptr.y,90,0,6.283);ctx.clip();ctx.drawImage(p12,0,0,W,H);ctx.restore();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ptr.x,ptr.y,90,0,6.283);ctx.stroke()}
 if(all&&!done){done=true;clearTimeout(timer);if(!reduce)timer=setTimeout(function(){scene=(scene+2)%8;load()},7000)}
 if(visible&&(!done||ptr))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
btn.addEventListener('click',function(){clearTimeout(timer);scene=(scene+2)%8;load()});
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top};go()});root.addEventListener('pointerleave',function(){ptr=null;go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;build()}}).observe(cv)}else build();})();`},

{id:'s-relief-light',title:'Relief light',component:'Relief light',key:'relief-light',family,width:800,
 description:'A flat picture turned into relief and relit by a lamp that follows the cursor, with soft shadows and glints.',
 prompt:'Make a picture look embossed and light it with a moving lamp. Render the artwork at a backing size of about 0.5 of the stage, compute a height map from its luminance (blurred a few times so film grain does not become bumps), then precompute surface normals with a Sobel filter (height scale about 6). Each frame loop over the pixels: the light vector is the normalised (lamp.x - x, lamp.y - y, 60); shade = 0.38 + 0.95 * max(0, dot(N, L)) plus a specular term pow(max(0, dot(N, H)), 24) * 0.5 using a half vector with the view direction (0,0,1); multiply the artwork colour by the shade, add the specular and write to a Uint32Array. A soft radial glow is drawn at the lamp position on the displayed canvas. The lamp eases towards the pointer and follows a Lissajous path when idle. Pause off-screen and for reduced motion only react to pointer events. Vanilla HTML, CSS and JavaScript.',
 css:`.rl2{position:relative;border:1px solid #1d1d28;border-radius:28px;background:#08080e;overflow:hidden;cursor:none;touch-action:pan-y}
.rl2 canvas{display:block;width:100%;height:380px;image-rendering:auto}
${hint('rl2','rgba(255,255,255,.7)')}`,
 html:`<div class="rl2"><canvas role="img" aria-label="A relief landscape lit by a moving lamp"></canvas><p class="rl2-hint">Move the lamp</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rl2'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=0,H=0,col,nx,ny,img,o32,lx=0,ly=0,tx=0,ty=0,inside=false,raf=0,visible=true,until=0;
function build(){var cw=cv.clientWidth,ch=cv.clientHeight;W=Math.round(cw*.5);H=Math.round(ch*.5);cv.width=W;cv.height=H;var a=art(5,W,H),d=a.getContext('2d').getImageData(0,0,W,H);col=new Uint32Array(d.data.buffer.slice(0));var hgt=new Float32Array(W*H);for(var i=0;i<W*H;i++){var o=i*4;hgt[i]=(d.data[o]*.3+d.data[o+1]*.59+d.data[o+2]*.11)/255}
 for(var pass=0;pass<3;pass++){var tmp=new Float32Array(W*H);for(var y0=1;y0<H-1;y0++)for(var x0=1;x0<W-1;x0++){var j=y0*W+x0;tmp[j]=(hgt[j]*4+hgt[j-1]+hgt[j+1]+hgt[j-W]+hgt[j+W])/8}hgt=tmp}
 nx=new Float32Array(W*H);ny=new Float32Array(W*H);for(var y=1;y<H-1;y++)for(var x=1;x<W-1;x++){var i2=y*W+x,gx=(hgt[i2-W+1]+2*hgt[i2+1]+hgt[i2+W+1])-(hgt[i2-W-1]+2*hgt[i2-1]+hgt[i2+W-1]),gy=(hgt[i2+W-1]+2*hgt[i2+W]+hgt[i2+W+1])-(hgt[i2-W-1]+2*hgt[i2-W]+hgt[i2-W+1]);var l=Math.sqrt(gx*gx*36+gy*gy*36+1);nx[i2]=-gx*6/l;ny[i2]=-gy*6/l}
 img=ctx.createImageData(W,H);o32=new Uint32Array(img.data.buffer);lx=tx=W/2;ly=ty=H/2}
function frame(now){raf=0;if(!col){go();return}if(!inside){tx=W*(.5+.38*Math.sin(now*.0007));ty=H*(.5+.3*Math.sin(now*.00093+1))}lx+=(tx-lx)*.15;ly+=(ty-ly)*.15;
 for(var y=0;y<H;y++)for(var x=0;x<W;x++){var i=y*W+x,dx=lx-x,dy=ly-y,dz=60,il=1/Math.sqrt(dx*dx+dy*dy+dz*dz),Lx=dx*il,Ly=dy*il,Lz=dz*il,Nx=nx[i],Ny=ny[i],Nz=Math.sqrt(Math.max(0,1-Nx*Nx-Ny*Ny)),nl=Nx*Lx+Ny*Ly+Nz*Lz;if(nl<0)nl=0;
  var hx=Lx,hy=Ly,hz=Lz+1,hl=1/Math.sqrt(hx*hx+hy*hy+hz*hz),nh=(Nx*hx+Ny*hy+Nz*hz)*hl;if(nh<0)nh=0;var sp=Math.pow(nh,24)*.5,fall=1/(1+(dx*dx+dy*dy)/(W*W*.18)),sh=(.28+1.05*nl*fall);var c=col[i];
  var r=Math.min(255,(c&255)*sh+sp*255),g=Math.min(255,((c>>8)&255)*sh+sp*255),b=Math.min(255,((c>>16)&255)*sh+sp*255);o32[i]=(255<<24)|(b<<16)|(g<<8)|r}
 ctx.putImageData(img,0,0);var gl=ctx.createRadialGradient(lx,ly,0,lx,ly,40);gl.addColorStop(0,'rgba(255,246,214,.9)');gl.addColorStop(.25,'rgba(255,230,170,.35)');gl.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=gl;ctx.fillRect(lx-42,ly-42,84,84);
 if(visible&&(!reduce||now<until))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function poke(){until=performance.now()+1500;go()}
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();tx=(e.clientX-r.left)*W/r.width;ty=(e.clientY-r.top)*H/r.height;inside=true;if(reduce)poke()});root.addEventListener('pointerleave',function(){inside=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;build();go()}}).observe(cv)}else{build();go()}
if(reduce)poke();})();`},

{id:'s-dotted-globe',title:'Dotted globe',component:'Dotted globe',key:'dotted-globe',family,width:640,
 description:'A rotating globe made of dots, with continents from procedural noise and glowing arcs that connect its cities.',
 prompt:'Draw a dotted 3D globe on a canvas without libraries. Generate about 2000 points on a sphere with a Fibonacci spiral. Classify each as land when a 3D value-noise fractal (three octaves) sampled at the point is above 0.5. Rotate points by the globe\'s yaw (auto-spinning at 0.004 rad per frame, or dragged with inertia) and a fixed 0.38 rad tilt, project with a simple orthographic projection and draw front-facing dots with size and alpha from depth (land in an accent colour, ocean dim) and back-facing dots very faint to give a glass look. Draw a thin atmosphere ring with a radial gradient. Pick six city points and draw great-circle arcs between five pairs, lifted above the surface by sin(pi*t) * 0.22 of the radius, as polylines with a bright travelling head and a fading trail (the head advances 0.006 per frame, offset per arc). Dark stage; pause off-screen, reduced motion shows a still globe. Vanilla HTML, CSS and JavaScript.',
 css:`.gb{position:relative;border:1px solid #1a1d2c;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#10162c,#05070f 72%);overflow:hidden;cursor:grab;touch-action:pan-y}
.gb.drag{cursor:grabbing}
.gb canvas{display:block;width:100%;height:420px}
${hint('gb','#5f6f94')}`,
 html:`<div class="gb"><canvas role="img" aria-label="A rotating globe of dots with glowing connection arcs"></canvas><p class="gb-hint">Drag to turn the globe</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gb'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,R=0,pts=[],yaw=.6,vy=0,drag=false,lx=0,raf=0,visible=true,TILT=.38,cities=[[51.5,-.1],[40.7,-74],[35.7,139.7],[-33.9,151.2],[25.2,55.3],[-23.5,-46.6]],pairs=[[0,1],[1,5],[0,4],[4,2],[2,3]];
function h3(x,y,z){var n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n)}
function vn(x,y,z){var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);function l(a,b,t){return a+(b-a)*t}
 return l(l(l(h3(ix,iy,iz),h3(ix+1,iy,iz),fx),l(h3(ix,iy+1,iz),h3(ix+1,iy+1,iz),fx),fy),l(l(h3(ix,iy,iz+1),h3(ix+1,iy,iz+1),fx),l(h3(ix,iy+1,iz+1),h3(ix+1,iy+1,iz+1),fx),fy),fz)}
function land(x,y,z){return (vn(x*2.2+9,y*2.2,z*2.2)*.55+vn(x*4.4,y*4.4+3,z*4.4)*.3+vn(x*8.8,y*8.8,z*8.8+5)*.15)>.5}
var N=2000;for(var i=0;i<N;i++){var yy=1-2*(i+.5)/N,r=Math.sqrt(1-yy*yy),th=i*2.399963;var x=Math.cos(th)*r,z=Math.sin(th)*r;pts.push({x:x,y:yy,z:z,l:land(x,yy,z)})}
function ll(lat,lon){var a=lat*Math.PI/180,b=lon*Math.PI/180;return [Math.cos(a)*Math.sin(b),Math.sin(a),Math.cos(a)*Math.cos(b)]}
function rot(p){var c=Math.cos(yaw),s=Math.sin(yaw),x=p[0]*c+p[2]*s,z=-p[0]*s+p[2]*c,y=p[1],ct=Math.cos(TILT),st=Math.sin(TILT);return [x,y*ct-z*st,y*st+z*ct]}
function arc(a,b,t){var dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])),om=Math.acos(dot),so=Math.sin(om)||1,k1=Math.sin((1-t)*om)/so,k2=Math.sin(t*om)/so,x=a[0]*k1+b[0]*k2,y=a[1]*k1+b[1]*k2,z=a[2]*k1+b[2]*k2,lift=1+Math.sin(Math.PI*t)*.22*(om/1.6);return [x*lift,y*lift,z*lift]}
var C=cities.map(function(c){return ll(c[0],c[1])});
function size(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);R=Math.min(W,H)*.4}
function frame(now){raf=0;if(!drag){yaw+=vy;vy*=.95;if(!reduce&&Math.abs(vy)<.004)yaw+=.004}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);var cx=W/2,cy=H/2;
 var g=ctx.createRadialGradient(cx,cy,R*.9,cx,cy,R*1.28);g.addColorStop(0,'rgba(90,130,255,.28)');g.addColorStop(1,'rgba(90,130,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(18,26,56,.55)';ctx.beginPath();ctx.arc(cx,cy,R*.985,0,6.283);ctx.fill();
 for(var i=0;i<N;i++){var q=rot([pts[i].x,pts[i].y,pts[i].z]),px=cx+q[0]*R,py=cy-q[1]*R;if(q[2]<0){ctx.fillStyle='rgba(120,150,255,.1)';ctx.fillRect(px,py,1.2,1.2);continue}
  var s=1.6+q[2]*1.6;ctx.fillStyle=pts[i].l?'rgba(170,205,255,'+(.5+q[2]*.5)+')':'rgba(80,110,190,'+(.28+q[2]*.3)+')';ctx.fillRect(px-s/2,py-s/2,s,s)}
 pairs.forEach(function(pr,k){var a=C[pr[0]],b=C[pr[1]],head=((now*.0004*(reduce?0:1)+k*.23)%1.3),steps=40;ctx.lineCap='round';
  for(var j=0;j<steps;j++){var t0=j/steps,t1=(j+1)/steps,p0=rot(arc(a,b,t0)),p1=rot(arc(a,b,t1));if(p0[2]<-.05&&p1[2]<-.05)continue;var d=head-t1,al=.12+(d>0&&d<.35?(1-d/.35)*.8:0);ctx.strokeStyle='rgba(255,150,220,'+al+')';ctx.lineWidth=1.2+(d>0&&d<.35?(1-d/.35)*1.4:0);ctx.beginPath();ctx.moveTo(cx+p0[0]*R,cy-p0[1]*R);ctx.lineTo(cx+p1[0]*R,cy-p1[1]*R);ctx.stroke()}});
 C.forEach(function(c){var q=rot(c);if(q[2]<0)return;var px=cx+q[0]*R,py=cy-q[1]*R,pulse=.5+.5*Math.sin(now*.004+px);ctx.fillStyle='rgba(255,210,240,.95)';ctx.beginPath();ctx.arc(px,py,2.6,0,6.283);ctx.fill();ctx.strokeStyle='rgba(255,150,220,'+(.5*(1-pulse))+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(px,py,4+pulse*9,0,6.283);ctx.stroke()});
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;vy=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;yaw+=dx*.008;vy=dx*.008;if(reduce)go()});
function up(){drag=false;root.classList.remove('drag')}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window)new ResizeObserver(function(){size();go()}).observe(cv);else{size();go()}go();})();`},

{id:'s-gradient-blob',title:'Gradient blob',component:'Gradient blob',key:'gradient-blob',family,width:760,
 description:'A soft, glowing gradient blob that breathes, drifts and stretches towards the cursor.',
 prompt:'Draw a liquid gradient blob on a dark canvas. The blob is a closed smooth curve through 10 points around a centre; each point has radius base * (1 + 0.2 sin(t*0.0011 + i*1.7) + 0.1 sin(t*0.0017 + i*2.9)). The centre eases towards the cursor (factor 0.04, clamped to the middle 60% of the stage) and points facing the cursor are pushed out by up to 35% so the blob stretches towards it. Build the path with the midpoint quadratic technique. Fill it with a linear gradient whose hue rotates slowly (violet, pink, orange, blue) and add a second radial gradient inside a clip for a soft highlight in the upper left and a darker core, plus a large coloured shadowBlur (60) as glow and a fine grain overlay. Idle: the cursor follows a Lissajous path. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (one still frame). Vanilla HTML, CSS and JavaScript.',
 css:`.bl{position:relative;height:400px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#12101e,#05050a 75%);overflow:hidden;cursor:none;touch-action:pan-y}
.bl canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
${hint('bl','#6c6c86')}`,
 html:`<div class="bl"><canvas aria-hidden="true"></canvas><p class="bl-hint">Move to pull the blob</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.bl'),cv=root.querySelector('canvas');
${BOOT}
var bx=0,by=0,ready=false,grain=null;
function mk(s){bx=s.W/2;by=s.H/2;ready=true;grain=document.createElement('canvas');grain.width=grain.height=128;var g=grain.getContext('2d'),d=g.createImageData(128,128);for(var i=0;i<d.data.length;i+=4){var v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=26}g.putImageData(d,0,0)}
Stage(root,cv,function(s){var c=s.ctx,t=s.t,W=s.W,H=s.H;if(!ready)return;c.clearRect(0,0,W,H);
 var tx=Math.max(W*.2,Math.min(W*.8,s.x)),ty=Math.max(H*.2,Math.min(H*.8,s.y));bx+=(tx-bx)*.045;by+=(ty-by)*.045;var base=Math.min(W,H)*.22,dx=s.x-bx,dy=s.y-by,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),prox=Math.min(1,dist/180),N=10,P=[];
 for(var i=0;i<N;i++){var a=i/N*6.283,r=base*(1+.2*Math.sin(t*.0011+i*1.7)+.1*Math.sin(t*.0017+i*2.9));r*=1+.35*Math.max(0,Math.cos(a-ang))*prox;P.push([bx+Math.cos(a)*r,by+Math.sin(a)*r])}
 function path(){c.beginPath();var m0=[(P[N-1][0]+P[0][0])/2,(P[N-1][1]+P[0][1])/2];c.moveTo(m0[0],m0[1]);for(var k=0;k<N;k++){var p=P[k],q=P[(k+1)%N];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2)}c.closePath()}
 var hue=(t*.012)%360,g=c.createLinearGradient(bx-base,by-base,bx+base,by+base);g.addColorStop(0,'hsl('+(265+Math.sin(t*.0004)*30)+',90%,62%)');g.addColorStop(.5,'hsl('+(320+Math.sin(t*.0005)*30)+',88%,62%)');g.addColorStop(1,'hsl('+(20+Math.sin(t*.0003)*20)+',95%,62%)');
 c.save();c.shadowColor='rgba(190,90,255,.55)';c.shadowBlur=70;c.fillStyle=g;path();c.fill();c.restore();
 c.save();path();c.clip();var hl=c.createRadialGradient(bx-base*.4,by-base*.45,0,bx-base*.4,by-base*.45,base*1.1);hl.addColorStop(0,'rgba(255,255,255,.55)');hl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=hl;c.fillRect(bx-base*2,by-base*2,base*4,base*4);
 var dk=c.createRadialGradient(bx+base*.35,by+base*.4,0,bx+base*.35,by+base*.4,base*1.1);dk.addColorStop(0,'rgba(40,0,90,.42)');dk.addColorStop(1,'rgba(40,0,90,0)');c.fillStyle=dk;c.fillRect(bx-base*2,by-base*2,base*4,base*4);
 c.globalCompositeOperation='overlay';c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(bx-base*2,by-base*2,base*4,base*4);c.restore();
 c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(s.x,s.y,3,0,6.283);c.fill()},mk);})();`},

{id:'s-star-burst',title:'Star burst',component:'Star burst',key:'star-burst',family,width:760,
 description:'Four-pointed stars stream out of a glowing point, trailing sparkle, and a click triggers a supernova.',
 prompt:'Make a star field that bursts from a point. Keep an origin that eases to the pointer (and wanders when idle). Each frame emit 2 stars from the origin at random angles with speed 1.5-4px per frame, a spin and a hue from cyan to pink; each star accelerates (speed *= 1.018) and grows from 2 to 9px as it travels. Draw each star as a four-pointed sparkle (two crossed thin rhombi) plus a soft glow circle and a short trail of faded copies, with additive blending, and remove stars that leave the stage. A click (or the Supernova button) throws 140 stars at once with a shockwave ring and a bright flash. Draw the glowing origin with a radial gradient. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only). The button is a real button. Vanilla HTML, CSS and JavaScript.',
 css:`.sb{position:relative;height:400px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 50%,#0f0f22,#04040a 78%);overflow:hidden;cursor:crosshair;touch-action:pan-y}
.sb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sb-btn{position:absolute;right:14px;bottom:14px;padding:8px 16px;border:1px solid #3a3a58;border-radius:999px;background:rgba(10,10,24,.7);color:#e6e6ff;cursor:pointer;font-size:13px;font-weight:600}
.sb-btn:hover{border-color:#a99bff}
${hint('sb','#6c6c86').replace('left:0;right:0;','left:18px;').replace('text-align:center;','').replace('bottom:12px','bottom:20px')}`,
 html:`<div class="sb"><canvas aria-hidden="true"></canvas><p class="sb-hint">Move the source · click for a supernova</p><button class="sb-btn" type="button">Supernova</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sb'),cv=root.querySelector('canvas'),btn=root.querySelector('.sb-btn');
${BOOT}
var P=[],ox=0,oy=0,ready=false,flash=0,rings=[];
function emit(n,fast){for(var i=0;i<n;i++){var a=Math.random()*6.283;P.push({x:ox,y:oy,a:a,sp:(fast?3:1.5)+Math.random()*(fast?6:2.5),r:Math.random()*6.283,vr:(Math.random()-.5)*.1,h:185+Math.random()*140,d:0,hist:[]})}if(P.length>420)P.splice(0,P.length-420)}
function star(c,x,y,s,rot){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s*.12,-s*.12,s,0);c.quadraticCurveTo(s*.12,s*.12,0,s);c.quadraticCurveTo(-s*.12,s*.12,-s,0);c.quadraticCurveTo(-s*.12,-s*.12,0,-s);c.fill();c.restore()}
var s=Stage(root,cv,function(s){var c=s.ctx,t=s.t;if(!ready){ox=s.W/2;oy=s.H/2;ready=true}c.clearRect(0,0,s.W,s.H);ox+=(s.x-ox)*.08;oy+=(s.y-oy)*.08;emit(2,false);c.globalCompositeOperation='lighter';
 for(var i=P.length-1;i>=0;i--){var p=P[i];p.sp*=1.018;p.x+=Math.cos(p.a)*p.sp;p.y+=Math.sin(p.a)*p.sp;p.r+=p.vr;p.d+=p.sp;p.hist.push(p.x,p.y);if(p.hist.length>12)p.hist.splice(0,2);
  if(p.x<-30||p.y<-30||p.x>s.W+30||p.y>s.H+30){P.splice(i,1);continue}var sz=1.5+Math.min(8,p.d*.03),al=Math.min(1,p.d/40);
  for(var k=0;k<p.hist.length;k+=2){var f=k/p.hist.length;c.fillStyle='hsla('+p.h+',90%,70%,'+(f*.18*al)+')';c.beginPath();c.arc(p.hist[k],p.hist[k+1],sz*.3*f,0,6.283);c.fill()}
  c.fillStyle='hsla('+p.h+',95%,'+(72+(p.d>200?8:0))+'%,'+al+')';star(c,p.x,p.y,sz,p.r);c.fillStyle='hsla('+p.h+',95%,70%,'+(al*.1)+')';c.beginPath();c.arc(p.x,p.y,sz*1.6,0,6.283);c.fill()}
 rings=rings.filter(function(r){return t-r.t<900});rings.forEach(function(r){var k=(t-r.t)/900;c.strokeStyle='rgba(190,180,255,'+(1-k)*.5+')';c.lineWidth=3*(1-k)+1;c.beginPath();c.arc(r.x,r.y,10+k*Math.max(s.W,s.H)*.6,0,6.283);c.stroke()});
 var g=c.createRadialGradient(ox,oy,0,ox,oy,60+flash*140);g.addColorStop(0,'rgba(255,255,255,'+(.9)+')');g.addColorStop(.2,'rgba(170,200,255,'+(.5+flash*.4)+')');g.addColorStop(1,'rgba(120,100,255,0)');c.fillStyle=g;c.fillRect(ox-220,oy-220,440,440);flash*=.92;c.globalCompositeOperation='source-over'});
s.click=function(){emit(140,true);flash=1;rings.push({x:ox,y:oy,t:s.t})};
btn.addEventListener('click',function(){emit(140,true);flash=1;rings.push({x:ox,y:oy,t:s.t})});})();`},

{id:'s-warp-portal',title:'Warp portal',component:'Warp portal',key:'warp-portal',family,width:760,
 description:'A glowing portal of streaming light: click to jump through and a landscape opens in its centre.',
 prompt:'Build a portal on a dark canvas. Idle state: 14 concentric elliptical rings that expand from the centre outwards (radius grows with a per-frame speed and wraps), twisted by a slow rotation and coloured violet to cyan, plus 220 radial light streaks (angle, radius, speed) that stream outwards with short trails and a glowing rim around a dark core. Pressing the pointer or the "Jump" button triggers a 3.2s sequence: speed multiplies by up to 8 (ease in), a white flash peaks at about 35%, then a generated landscape appears inside a circle that grows from 0 to 38% of the stage height (clip an arc and draw the artwork scaled to it) with a bright ring, holds for a moment and then shrinks away while the speed settles back to normal. Handle devicePixelRatio, resize, off-screen pausing and reduced motion (pointer events only; the jump just shows the picture). Vanilla HTML, CSS and JavaScript.',
 css:`.wp{position:relative;height:420px;border:1px solid #1d1d28;border-radius:28px;background:#03030a;overflow:hidden;cursor:pointer;touch-action:pan-y}
.wp canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.wp-btn{position:absolute;right:14px;bottom:14px;padding:8px 16px;border:1px solid #3a3a58;border-radius:999px;background:rgba(10,10,24,.7);color:#e6e6ff;cursor:pointer;font-size:13px;font-weight:600}
.wp-btn:hover{border-color:#a99bff}
${hint('wp','#6c6c86').replace('left:0;right:0;','left:18px;').replace('text-align:center;','').replace('bottom:12px','bottom:20px')}`,
 html:`<div class="wp"><canvas aria-hidden="true"></canvas><p class="wp-hint">Click to jump through</p><button class="wp-btn" type="button">Jump</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.wp'),cv=root.querySelector('canvas'),btn=root.querySelector('.wp-btn');
${BOOT}
${ART}
var S=[],jump=-1,DUR=3200,scene=0,off=0,ready=false,pic=null;
function mk(s){S=[];for(var i=0;i<220;i++)S.push({a:Math.random()*6.283,r:Math.random(),v:.004+Math.random()*.012});pic=null;ready=true}
function ease(x){return x*x*(3-2*x)}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H,cx=W/2,cy=H/2,t=s.t;if(!ready)return;c.fillStyle='#03030a';c.fillRect(0,0,W,H);
 var k=jump>=0?(t-jump)/DUR:-1,boost=1,flash=0,disc=0;if(k>=1){jump=-1;k=-1}
 if(k>=0){boost=1+7*Math.sin(Math.min(1,k/.5)*Math.PI/2)*(k<.7?1:Math.max(0,1-(k-.7)/.3));flash=k<.5?Math.max(0,1-Math.abs(k-.35)/.15):0;disc=k<.3?0:k<.85?ease(Math.min(1,(k-.3)/.25)):1-ease((k-.85)/.15)}
 off=(off+.0035*boost)%1;var R=Math.max(W,H)*.75;c.globalCompositeOperation='lighter';
 for(var i=0;i<14;i++){var u=((i/14+off)%1),r=Math.pow(u,2.2)*R,al=Math.sin(u*Math.PI)*.8;if(r<4)continue;c.strokeStyle='hsla('+(260+u*80)+',90%,'+(50+u*14)+'%,'+al+')';c.lineWidth=1+u*4;c.save();c.translate(cx,cy);c.rotate(t*.0003*boost+i*.3);c.beginPath();c.ellipse(0,0,r,r*.7,0,0,6.283);c.stroke();c.restore()}
 S.forEach(function(p){p.r+=p.v*boost;if(p.r>1.1){p.r=.02;p.a=Math.random()*6.283}var r0=Math.pow(p.r,1.7)*R,r1=Math.pow(Math.max(0,p.r-.03*boost),1.7)*R,ca=Math.cos(p.a+Math.log(1+p.r)*.6),sa=Math.sin(p.a+Math.log(1+p.r)*.6);c.strokeStyle='hsla('+(190+p.a*10)+',90%,'+(60+p.r*30)+'%,'+Math.min(1,p.r*1.4)*.8+')';c.lineWidth=1+p.r*1.6;c.beginPath();c.moveTo(cx+ca*r1,cy+sa*r1*.7);c.lineTo(cx+ca*r0,cy+sa*r0*.7);c.stroke()});
 var rim=c.createRadialGradient(cx,cy,10,cx,cy,Math.min(W,H)*.32);rim.addColorStop(0,'rgba(0,0,0,1)');rim.addColorStop(.55,'rgba(0,0,0,.92)');rim.addColorStop(.8,'rgba(150,110,255,.35)');rim.addColorStop(1,'rgba(150,110,255,0)');c.globalCompositeOperation='source-over';c.fillStyle=rim;c.fillRect(0,0,W,H);
 if(disc>0){var dr=disc*H*.38;if(!pic||pic.sc!==scene)pic={sc:scene,c:art(scene,Math.round(H*.8),Math.round(H*.8))};c.save();c.beginPath();c.arc(cx,cy,dr,0,6.283);c.clip();c.drawImage(pic.c,cx-dr,cy-dr,dr*2,dr*2);c.restore();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(200,190,255,'+(.9*disc)+')';c.lineWidth=3+6*(1-disc);c.beginPath();c.arc(cx,cy,dr,0,6.283);c.stroke();c.globalCompositeOperation='source-over'}
 if(flash>0){c.fillStyle='rgba(255,255,255,'+flash*.85+')';c.fillRect(0,0,W,H)}},mk);
function go(){if(jump<0){jump=performance.now();scene=(scene+1)%8}}
s.click=go;btn.addEventListener('click',go);})();`}
];
