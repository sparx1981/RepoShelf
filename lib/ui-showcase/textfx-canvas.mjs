// Original canvas text effects: particles, shards and morphing words. No third-party code.
const family='Text effects';
export const textfxCanvas=[
{id:'s-particle-text',title:'Particle text',component:'Particle text',key:'particle-text',family,width:780,
 description:'A word built from thousands of glowing particles that scatter around the pointer and flow home.',
 prompt:'Build a canvas text effect. Draw a bold word to an offscreen canvas, sample its alpha every few pixels (step scaled to the canvas width so the particle count stays under about 5000) and create a particle for each sample with a home position, velocity and a hue taken from its x position (violet to pink). Each frame apply a spring to home (k=0.06), damping 0.86 and a pointer repulsion inside a 90px radius; draw 2px squares in hue buckets over a translucent dark fill so motion leaves short trails. Particles start scattered and assemble on load; a click bursts them outwards. When no pointer is present, a virtual pointer drifts through the word. Handle devicePixelRatio (cap 2), rebuild on resize with ResizeObserver, pause off-screen, and draw one static frame for reduced motion. The canvas has role="img" and an aria-label with the word. Vanilla HTML, CSS and JavaScript.',
 css:`.pt{position:relative;border:1px solid #23232b;border-radius:28px;background:#07070b;overflow:hidden;cursor:crosshair}
.pt canvas{display:block;width:100%;height:340px}
.pt-hint{position:absolute;left:0;right:0;bottom:14px;margin:0;text-align:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8d8da0;pointer-events:none}`,
 html:`<div class="pt"><canvas role="img" aria-label="STARDUST made of glowing particles"></canvas><p class="pt-hint">Move through it · click to burst</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pt'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),WORD='STARDUST';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,P=[],buckets=[],ptr=null,raf=0,visible=true,BUCKETS=12;
function build(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
 var tc=document.createElement('canvas');tc.width=W;tc.height=H;var t=tc.getContext('2d');var size=100;t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';var mw=t.measureText(WORD).width;size=Math.floor(size*Math.min(W*.86/mw,H*.5));
 t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';t.textAlign='center';t.textBaseline='middle';t.fillStyle='#fff';t.fillText(WORD,W/2,H/2+size*.04);
 var d=t.getImageData(0,0,W,H).data,step=Math.max(3,Math.round(W/230)),pts=[];for(var y=0;y<H;y+=step)for(var x=0;x<W;x+=step)if(d[(y*W+x)*4+3]>140)pts.push(x,y);
 P=[];buckets=[];for(var b=0;b<BUCKETS;b++)buckets.push([]);
 for(var i=0;i<pts.length;i+=2){var hx=pts[i]+(Math.random()-.5)*step*.5,hy=pts[i+1]+(Math.random()-.5)*step*.5,a=Math.random()*6.283,r=Math.max(W,H)*(.4+Math.random()*.6);
  var p={x:W/2+Math.cos(a)*r,y:H/2+Math.sin(a)*r,hx:hx,hy:hy,vx:0,vy:0,b:Math.min(BUCKETS-1,Math.floor(hx/W*BUCKETS)),s:1.3+Math.random()*1.3};P.push(p);buckets[p.b].push(p)}
 if(reduce)P.forEach(function(p){p.x=p.hx;p.y=p.hy});draw(true)}
function draw(clear){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=clear?'#07070b':'rgba(7,7,11,.32)';ctx.fillRect(0,0,W,H);
 for(var b=0;b<BUCKETS;b++){ctx.fillStyle='hsl('+(255+b/(BUCKETS-1)*95)+',92%,68%)';var arr=buckets[b]||[];for(var i=0;i<arr.length;i++){var p=arr[i];ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s)}}}
function frame(now){raf=0;var t=now/1000,px,py,R=90;if(ptr){px=ptr.x;py=ptr.y}else{px=W*(.5+.4*Math.sin(t*.7));py=H*(.5+.16*Math.sin(t*1.4));R=70}
 for(var i=0;i<P.length;i++){var p=P[i],dx=p.x-px,dy=p.y-py,d=Math.sqrt(dx*dx+dy*dy)+.001;if(d<R){var f=(1-d/R);f=f*f*7;p.vx+=dx/d*f;p.vy+=dy/d*f}
  p.vx+=(p.hx-p.x)*.06;p.vy+=(p.hy-p.y)*.06;p.vx*=.86;p.vy*=.86;p.x+=p.vx;p.y+=p.vy}
 draw(false);if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});
root.addEventListener('pointerleave',function(){ptr=null});
root.addEventListener('pointerdown',function(){P.forEach(function(p){var a=Math.random()*6.283,s=6+Math.random()*14;p.vx+=Math.cos(a)*s;p.vy+=Math.sin(a)*s})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var last=0;new ResizeObserver(function(){if(cv.clientWidth!==last){last=cv.clientWidth;build()}}).observe(cv)}else build();
go();})();`},

{id:'s-shatter-type',title:'Shatter type',component:'Shatter type',key:'shatter-type',family,width:780,
 description:'Click a gradient word to shatter it into glass shards that tumble away and then reassemble.',
 prompt:'Create a canvas word that shatters on click. Render the word with a violet-to-pink gradient to an offscreen canvas. Build a jittered grid of vertices (about 46px cells), split every cell into two triangles and keep only triangles that cover text pixels (sample the centroid and corners). Idle: draw the offscreen image as-is. On click: each shard gets a velocity pointing away from the click point (stronger when closer), a random spin and gravity, and is drawn by clipping the offscreen image to its triangle with a translate/rotate transform; shards fade after 0.8s. Draw an expanding accent ring at the click point. After about 1.3s every shard eases back to its home position with easeOutBack and a small stagger while fading in. Add a real "Shatter" button so keyboard users can trigger it (it breaks from the centre), auto-shatter after several idle seconds, handle devicePixelRatio and resizes, pause off-screen and skip motion for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.sh{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.sh canvas{display:block;width:100%;height:320px;cursor:pointer}
.sh-btn{position:absolute;right:16px;bottom:16px;padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.sh-btn:hover{border-color:var(--sc-accent)}
.sh-hint{position:absolute;left:20px;bottom:20px;margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--sc-muted);pointer-events:none}`,
 html:`<div class="sh"><canvas role="img" aria-label="FRACTURE, a word that shatters when clicked"></canvas><p class="sh-hint">Click the word</p><button class="sh-btn" type="button">Shatter</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sh'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),btn=root.querySelector('.sh-btn'),WORD='FRACTURE';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,tc,shards=[],phase='idle',t0=0,origin={x:0,y:0},ring=0,raf=0,visible=true,idleSince=performance.now();
function ease(t){var c=1.70158,c3=c+1;return 1+c3*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
function build(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
 tc=document.createElement('canvas');tc.width=cv.width;tc.height=cv.height;var t=tc.getContext('2d');t.scale(dpr,dpr);var size=100;t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';size=Math.floor(size*Math.min(W*.86/t.measureText(WORD).width,H*.56));
 t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';t.textAlign='center';t.textBaseline='middle';var g=t.createLinearGradient(W*.1,0,W*.9,H);g.addColorStop(0,'#7c5cff');g.addColorStop(.55,'#c24bff');g.addColorStop(1,'#ff5fa8');t.fillStyle=g;t.fillText(WORD,W/2,H/2+size*.04);
 var data=t.getImageData(0,0,tc.width,tc.height).data;function solid(x,y){x=Math.round(x*dpr);y=Math.round(y*dpr);if(x<0||y<0||x>=tc.width||y>=tc.height)return false;return data[(y*tc.width+x)*4+3]>40}
 var cs=Math.max(34,Math.round(W/17)),cols=Math.ceil(W/cs)+1,rows=Math.ceil(H/cs)+1,V=[];for(var r=0;r<=rows;r++){V.push([]);for(var c=0;c<=cols;c++){var j=(r===0||c===0||r===rows||c===cols)?0:cs*.32;V[r].push([c*cs+(Math.random()-.5)*j,r*cs+(Math.random()-.5)*j])}}
 shards=[];function add(a,b,c){var cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3;if(!(solid(cx,cy)||solid(a[0]*.5+cx*.5,a[1]*.5+cy*.5)||solid(b[0]*.5+cx*.5,b[1]*.5+cy*.5)||solid(c[0]*.5+cx*.5,c[1]*.5+cy*.5)))return;shards.push({v:[a,b,c],cx:cx,cy:cy,x:0,y:0,r:0,vx:0,vy:0,vr:0,a:1,sx:0,sy:0,sr:0,sa:1,delay:0})}
 for(r=0;r<rows;r++)for(c=0;c<cols;c++){var A=V[r][c],B=V[r][c+1],C=V[r+1][c],D=V[r+1][c+1];if(Math.random()<.5){add(A,B,C);add(B,D,C)}else{add(A,B,D);add(A,D,C)}}
 paint()}
function paint(){if(!tc)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
 if(phase==='idle'){ctx.drawImage(tc,0,0);return}
 for(var i=0;i<shards.length;i++){var s=shards[i];if(s.a<=.01)continue;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=Math.max(0,Math.min(1,s.a));ctx.translate(s.cx+s.x,s.cy+s.y);ctx.rotate(s.r);ctx.translate(-s.cx,-s.cy);
  ctx.beginPath();ctx.moveTo(s.v[0][0],s.v[0][1]);ctx.lineTo(s.v[1][0],s.v[1][1]);ctx.lineTo(s.v[2][0],s.v[2][1]);ctx.closePath();ctx.clip();
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.translate(s.cx+s.x,s.cy+s.y);ctx.rotate(s.r);ctx.translate(-s.cx,-s.cy);ctx.scale(1/dpr,1/dpr);ctx.drawImage(tc,0,0);ctx.restore()}
 if(ring>0&&ring<1){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='rgba(194,75,255,'+(1-ring)*.8+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(origin.x,origin.y,10+ring*140,0,6.283);ctx.stroke()}}
function shatter(x,y){if(phase!=='idle'||reduce)return;origin.x=x;origin.y=y;phase='break';t0=performance.now();ring=0;
 shards.forEach(function(s){var dx=s.cx-x,dy=s.cy-y,d=Math.sqrt(dx*dx+dy*dy)+8,f=Math.min(11,1100/d);s.vx=dx/d*f+(Math.random()-.5)*3;s.vy=dy/d*f-4-Math.random()*4;s.vr=(Math.random()-.5)*.35;s.x=0;s.y=0;s.r=0;s.a=1;s.delay=Math.random()*250});go()}
function frame(now){raf=0;var t=now-t0;
 if(phase==='break'){ring=t/700;shards.forEach(function(s){s.vy+=.42;s.vx*=.992;s.x+=s.vx;s.y+=s.vy;s.r+=s.vr;s.a=t<800?1:Math.max(0,1-(t-800)/500);s.sx=s.x;s.sy=s.y;s.sr=s.r});if(t>1350){phase='return';t0=now;shards.forEach(function(s){s.delay=Math.random()*380});}}
 else if(phase==='return'){var done=true;shards.forEach(function(s){var k=Math.max(0,Math.min(1,(t-s.delay)/820));if(k<1)done=false;var e=ease(k);s.x=s.sx*(1-e);s.y=s.sy*(1-e);s.r=s.sr*(1-e);s.a=Math.min(1,k*2.4)});if(done){phase='idle';idleSince=now}}
 else if(now-idleSince>6500){shatter(W*(.25+Math.random()*.5),H*(.35+Math.random()*.3))}
 paint();if(visible&&(phase!=='idle'||!reduce))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
cv.addEventListener('pointerdown',function(e){var r=cv.getBoundingClientRect();shatter(e.clientX-r.left,e.clientY-r.top)});
btn.addEventListener('click',function(){shatter(W/2,H/2)});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)idleSince=performance.now();go()}).observe(root);
if('ResizeObserver' in window){var last=0;new ResizeObserver(function(){if(cv.clientWidth!==last){last=cv.clientWidth;phase='idle';build()}}).observe(cv)}else build();
go();})();`},

{id:'s-word-morph',title:'Word morph',component:'Word morph',key:'word-morph',family,width:780,
 description:'A cloud of dots flows from one word into the next, swirling as it travels.',
 prompt:'Build a canvas that morphs between words using a fixed pool of about 3400 dots. For each word, draw it to an offscreen canvas, sample alpha on a grid and resample the points to exactly the pool size (random subset when there are too many, duplicates with small jitter when too few). Sort both the dots and the targets by x so pairs stay roughly in order. Each dot springs to its target with its own stiffness (0.03 to 0.08), plus a perpendicular swirl proportional to the remaining distance so the flow curves, plus a tiny pointer repulsion. Colour dots by their x position, violet to pink. Advance every 2.6s and on click, with a visible label under the canvas that names the current word for assistive tech (aria-live polite). Handle devicePixelRatio and resize, pause off-screen, and show static words for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.wm{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:pointer}
.wm canvas{display:block;width:100%;height:320px}
.wm-label{position:absolute;left:20px;bottom:18px;margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--sc-muted)}`,
 html:`<div class="wm"><canvas aria-hidden="true"></canvas><p class="wm-label" aria-live="polite">Fluid</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.wm'),cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),label=root.querySelector('.wm-label'),words=['Fluid','Form','Flow','Focus'],N=3400;
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,dpr=1,W=0,H=0,D=[],targets=[],idx=0,timer=0,raf=0,visible=true,ptr=null,fg='#111';
function sample(word){var tc=document.createElement('canvas');tc.width=W;tc.height=H;var t=tc.getContext('2d'),size=100;t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';size=Math.floor(size*Math.min(W*.8/t.measureText(word).width,H*.58));t.font='900 '+size+'px system-ui,-apple-system,Segoe UI,sans-serif';t.textAlign='center';t.textBaseline='middle';t.fillStyle='#000';t.fillText(word,W/2,H/2+size*.04);
 var d=t.getImageData(0,0,W,H).data,pts=[],step=3;for(var y=0;y<H;y+=step)for(var x=0;x<W;x+=step)if(d[(y*W+x)*4+3]>140)pts.push([x,y]);var out=[];for(var i=0;i<N;i++){var p=pts[pts.length>N?Math.floor(Math.random()*pts.length):i%pts.length];out.push([p[0]+(Math.random()-.5)*step,p[1]+(Math.random()-.5)*step])}
 out.sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});return out}
function build(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);targets=words.map(sample);
 D=[];var seed=targets[idx];for(var i=0;i<N;i++){var a=Math.random()*6.283,r=Math.max(W,H)*Math.random()*.6;D.push({x:W/2+Math.cos(a)*r,y:H/2+Math.sin(a)*r,vx:0,vy:0,k:.03+Math.random()*.05,tx:seed[i][0],ty:seed[i][1],h:seed[i][0]/W})}
 if(reduce)D.forEach(function(d){d.x=d.tx;d.y=d.ty});draw()}
function setWord(n){idx=n%words.length;label.textContent=words[idx];var tg=targets[idx];if(!tg)return;D.forEach(function(d,i){d.tx=tg[i][0];d.ty=tg[i][1];d.h=tg[i][0]/W});if(reduce)D.forEach(function(d){d.x=d.tx;d.y=d.ty});draw();clearTimeout(timer);if(!reduce)timer=setTimeout(function(){setWord(idx+1)},2600)}
function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);for(var i=0;i<D.length;i++){var d=D[i];ctx.fillStyle='hsl('+(258+d.h*92)+',88%,64%)';ctx.beginPath();ctx.arc(d.x,d.y,1.45,0,6.283);ctx.fill()}}
function frame(){raf=0;for(var i=0;i<D.length;i++){var d=D[i],dx=d.tx-d.x,dy=d.ty-d.y,dist=Math.sqrt(dx*dx+dy*dy);d.vx+=dx*d.k+(-dy)*.0035*Math.min(dist,60)/60*(i%2?1:-1)*3;d.vy+=dy*d.k+dx*.0035*Math.min(dist,60)/60*(i%2?1:-1)*3;
  if(ptr){var px=d.x-ptr.x,py=d.y-ptr.y,pd=Math.sqrt(px*px+py*py)+.001;if(pd<70){var f=(1-pd/70)*3;d.vx+=px/pd*f;d.vy+=py/pd*f}}
  d.vx*=.84;d.vy*=.84;d.x+=d.vx;d.y+=d.vy}
 draw();if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointerdown',function(){setWord(idx+1)});root.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});root.addEventListener('pointerleave',function(){ptr=null});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window){var last=0;new ResizeObserver(function(){if(cv.clientWidth!==last){last=cv.clientWidth;build();setWord(idx)}}).observe(cv)}else{build();setWord(0)}
go();})();`}
];
