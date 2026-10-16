// Original UI centrepieces: connected flow, live feed, glow frame, chrome gyroscope, assistant orb, stacking cards and expanding cards.
import {ART} from './art-boot.mjs';
const family='3D & galleries';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const galleryD=[
{id:'s-hub-flow',title:'Hub flow',component:'Hub flow',key:'hub-flow',family,width:780,
 description:'A central hub wired to six services, with glowing pulses travelling both ways along curved connections.',
 prompt:'Draw a hub-and-spoke diagram in an SVG (viewBox 640x340). A circular hub with a gradient and a soft pulsing ring sits in the centre; six rounded-rectangle nodes (96x44) with a coloured letter badge and a label (Docs, Mail, Chat, Data, Auth, Build) sit on an ellipse around it. Each node is joined to the hub by a quadratic curve path. Pulses travel along the paths: use pathLength="1" on a second accent-coloured path per connection and animate its stroke-dasharray (.12 1.2) and stroke-dashoffset from JavaScript so a short glowing segment moves hub to node on even connections and node to hub on odd ones, each at a different speed and phase. When a pulse arrives at a node, the node briefly scales up and its badge glows; arriving at the hub makes the hub ring ripple. Hovering or focusing a node (make the nodes focusable groups) speeds its pulse up and highlights its path. Use theme colour tokens, pause off-screen and for reduced motion show static paths with no pulses. Vanilla HTML, CSS and JavaScript.',
 css:`.hf{padding:14px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.hf-svg{display:block;width:100%;height:auto}
.hf-path{fill:none;stroke:var(--sc-line);stroke-width:2}
.hf-pulse{fill:none;stroke:var(--sc-accent);stroke-width:3.5;stroke-linecap:round;filter:drop-shadow(0 0 5px var(--sc-accent));stroke-dasharray:.12 1.2}
.hf-node{cursor:pointer;outline:none}
.hf-node rect{fill:var(--sc-bg);stroke:var(--sc-line);stroke-width:1.5;transition:stroke .2s}
.hf-node:hover rect,.hf-node:focus-visible rect,.hf-node.hot rect{stroke:var(--sc-accent)}
.hf-node text{fill:var(--sc-fg);font:700 14px system-ui,-apple-system,"Segoe UI",sans-serif}
.hf-badge{transition:filter .2s}
.hf-node .g{transform-box:fill-box;transform-origin:center;transition:transform .35s cubic-bezier(.2,.9,.3,1.4)}
.hf-node.hit .g{transform:scale(1.08)}
.hf-node.hit .hf-badge{filter:drop-shadow(0 0 8px currentColor)}
.hf-ring{fill:none;stroke:var(--sc-accent);stroke-width:2;opacity:0}
.hf-hub text{fill:#fff;font:800 17px system-ui,-apple-system,"Segoe UI",sans-serif}`,
 html:`<div class="hf"><svg class="hf-svg" viewBox="0 0 640 340" role="group" aria-label="A hub connected to six services: Docs, Mail, Chat, Data, Auth and Build"><defs><radialGradient id="hf-hub" cx="35%" cy="30%" r="80%"><stop offset="0" style="stop-color:#c9b8ff"/><stop offset=".5" style="stop-color:var(--sc-accent)"/><stop offset="1" style="stop-color:#3a1f9a"/></radialGradient></defs><g class="hf-paths"></g><g class="hf-nodes"></g><g class="hf-hub"><circle class="hf-ring" cx="320" cy="170" r="46"/><circle cx="320" cy="170" r="44" fill="url(#hf-hub)"/><text x="320" y="176" text-anchor="middle">Hub</text></g></svg></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.hf'),paths=root.querySelector('.hf-paths'),nodes=root.querySelector('.hf-nodes'),ring=root.querySelector('.hf-ring'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cx=320,cy=170,labels=['Docs','Mail','Chat','Data','Auth','Build'],hues=[262,330,200,150,30,290],C=[],raf=0,visible=true,last=0;
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
labels.forEach(function(l,i){var ang=-Math.PI/2+i*Math.PI/3,nx=cx+Math.cos(ang)*235,ny=cy+Math.sin(ang)*112;
 var d=i%2?'M'+nx+','+ny+' Q'+((nx+cx)/2+(i<3?30:-30))+','+((ny+cy)/2+(i%3===0?0:(ny<cy?-30:30)))+' '+cx+','+cy:'M'+cx+','+cy+' Q'+((nx+cx)/2+(i<3?30:-30))+','+((ny+cy)/2+(i%3===0?0:(ny<cy?-30:30)))+' '+nx+','+ny;
 el('path',{d:d,class:'hf-path',pathLength:1},paths);var pu=el('path',{d:d,class:'hf-pulse',pathLength:1},paths);
 var g=el('g',{class:'hf-node',tabindex:0,role:'img','aria-label':l},nodes),gg=el('g',{class:'g'},g);el('rect',{x:nx-52,y:ny-24,width:104,height:48,rx:14},gg);var b=el('g',{class:'hf-badge',style:'color:hsl('+hues[i]+' 85% 62%)'},gg);el('circle',{cx:nx-28,cy:ny,r:13,fill:'hsl('+hues[i]+' 85% 62%)'},b);var t=el('text',{x:nx-28,y:ny+5,'text-anchor':'middle',fill:'#fff',style:'font-size:13px;fill:#fff'},b);t.textContent=l.charAt(0);var tt=el('text',{x:nx-8,y:ny+5},gg);tt.textContent=l;
 var c={pu:pu,g:g,p:(i*.17)%1,sp:.0003+i*.00004,dir:i%2?1:-1,hot:false,hit:0};g.addEventListener('pointerenter',function(){c.hot=true;g.classList.add('hot')});g.addEventListener('pointerleave',function(){c.hot=false;g.classList.remove('hot')});g.addEventListener('focus',function(){c.hot=true;g.classList.add('hot')});g.addEventListener('blur',function(){c.hot=false;g.classList.remove('hot')});C.push(c)});
var ringT=-1;
function frame(now){raf=0;var dt=Math.min(50,now-(last||now));last=now;
 C.forEach(function(c){var prev=c.p;c.p+=c.sp*dt*(c.hot?3:1);if(c.p>1.25){c.p-=1.25;}
  var p=Math.min(1,c.p);c.pu.style.strokeDashoffset=(.12-p*1.12).toFixed(3);c.pu.style.opacity=c.p>1?0:1;
  if(prev<1&&c.p>=1){if(c.dir<0){c.g.classList.add('hit');setTimeout(function(){c.g.classList.remove('hit')},450)}else{ringT=now}}});
 if(ringT>0){var k=(now-ringT)/700;if(k>=1){ringT=-1;ring.style.opacity=0}else{ring.setAttribute('r',(46+k*26).toFixed(1));ring.style.opacity=(1-k)*.8}}
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce){last=0;raf=requestAnimationFrame(frame)}}
if(reduce)C.forEach(function(c){c.pu.style.opacity=0});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-live-feed',title:'Live feed list',component:'Live feed list',key:'live-feed',family,width:560,
 description:'A notification feed where new items drop in at the top while the rest slide down and the oldest one fades out.',
 prompt:'Build an animated list. Keep a model array of up to six items (avatar with initials on a hue gradient, a title, a one-line detail and a relative time label). Items are absolutely positioned and translated with translateY(index * 76px) so that inserting at the top changes every other item\'s transform and CSS transitions (0.55s cubic-bezier(.2,.9,.3,1.1)) slide them down; a new item enters from translateY(-60px) with scale 0.92 and opacity 0 to its place, and the item that falls off the end fades and shrinks before it is removed. A new event arrives every 1.8s from a list of sample events; the feed pauses while the pointer or focus is inside it and when off-screen, an "Add event" button adds one manually, and the container has role="log" and aria-live="polite" so additions are announced. Time labels update (just now, 4s ago, ...) every second. Reduced motion inserts without transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.fd{display:grid;gap:14px;padding:18px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.fd-list{position:relative;height:456px;overflow:hidden;-webkit-mask-image:linear-gradient(#000 80%,transparent);mask-image:linear-gradient(#000 80%,transparent)}
.fd-item{position:absolute;left:0;right:0;top:0;height:68px;display:flex;align-items:center;gap:14px;padding:0 16px;border:1px solid var(--sc-line);border-radius:18px;background:var(--sc-bg);transform:translateY(calc(var(--i)*76px));transition:transform .55s cubic-bezier(.2,.9,.3,1.1),opacity .4s,scale .4s}
.fd-item.enter{transform:translateY(-60px) scale(.92);opacity:0}
.fd-item.leave{opacity:0;scale:.9}
.fd-av{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font:800 14px/1 system-ui;background:linear-gradient(135deg,hsl(var(--h) 80% 62%),hsl(calc(var(--h) + 40) 80% 52%))}
.fd-t{min-width:0;flex:1}
.fd-t strong{display:block;font-size:15px;line-height:1.2}
.fd-t span{display:block;margin-top:3px;font-size:13px;color:var(--sc-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-time{flex:none;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--sc-muted)}
.fd-btn{justify-self:center;padding:8px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.fd-btn:hover{border-color:var(--sc-accent)}
@media (prefers-reduced-motion:reduce){.fd-item{transition:none}}`,
 html:`<div class="fd"><div class="fd-list" role="log" aria-live="polite" aria-label="Activity feed"></div><button class="fd-btn" type="button">Add event</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.fd'),list=root.querySelector('.fd-list'),btn=root.querySelector('.fd-btn');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,MAX=6,items=[],n=0,hold=false,visible=true,timer=0,tick=0;
var ev=[['Mara Quinn','merged the release branch',20],['Build #482','passed in 1m 12s',150],['Jun Park','commented on Landing page',262],['Deploy','finished for production',200],['Ines Roca','invited 3 teammates',330],['Alerts','latency back to normal',40],['Theo Hart','uploaded 12 assets',290],['Sana Idris','closed 4 issues',170]];
function ago(t){var s=Math.floor((Date.now()-t)/1000);return s<3?'just now':s<60?s+'s ago':Math.floor(s/60)+'m ago'}
function add(){var e=ev[n++%ev.length],it=document.createElement('div');it.className='fd-item'+(reduce?'':' enter');var av=document.createElement('span');av.className='fd-av';av.style.setProperty('--h',e[2]);av.textContent=e[0].split(' ').map(function(w){return w.charAt(0)}).join('').slice(0,2);var t=document.createElement('div');t.className='fd-t';var s=document.createElement('strong');s.textContent=e[0];var d=document.createElement('span');d.textContent=e[1];t.appendChild(s);t.appendChild(d);var tm=document.createElement('span');tm.className='fd-time';tm.textContent='just now';it.appendChild(av);it.appendChild(t);it.appendChild(tm);
 var rec={el:it,time:tm,at:Date.now()};items.unshift(rec);list.appendChild(it);layout();if(!reduce){void it.offsetWidth;it.classList.remove('enter')}
 if(items.length>MAX){var old=items.pop();old.el.classList.add('leave');setTimeout(function(){old.el.remove()},reduce?0:420)}}
function layout(){items.forEach(function(r,i){r.el.style.setProperty('--i',i)})}
function loop(){clearTimeout(timer);timer=setTimeout(function(){if(!hold&&visible)add();loop()},1800)}
btn.addEventListener('click',add);root.addEventListener('pointerenter',function(){hold=true});root.addEventListener('pointerleave',function(){hold=false});root.addEventListener('focusin',function(){hold=true});root.addEventListener('focusout',function(){hold=false});
setInterval(function(){if(visible)items.forEach(function(r){r.time.textContent=ago(r.at)})},1000);
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting}).observe(root);
for(var i=0;i<5;i++){add();items[0].at-=(5-i)*7000;items[0].time.textContent=ago(items[0].at)}loop();})();`},

{id:'s-glow-frame',title:'Glow frame',component:'Glow frame',key:'glow-frame',family,width:520,
 description:'A card wrapped in a crisp animated gradient border with a soft halo that speeds up on hover.',
 prompt:'Make a pricing-style card framed by a light that runs around its border. The outer wrapper has padding 2px, border-radius 26px and background: conic-gradient(from var(--gf-a), violet, pink, amber, cyan, violet) where --gf-a is registered with @property as an <angle> and animated from 0 to 360deg with a 5s linear infinite keyframe animation. A blurred pseudo-element copy of the same gradient sits behind it at 45% opacity as the halo. The inner card has the theme background, a heading, a price, three feature rows with check icons and a real button. Hovering or focusing inside the card shortens the animation to 2s and lifts the halo to 70%. Provide a static gradient fallback for browsers without @property support and stop the animation for reduced motion. Vanilla HTML and CSS only.',
 css:`@property --gf-a{syntax:'<angle>';inherits:false;initial-value:0deg}
.gfx{display:grid;place-items:center;padding:44px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.gf{--gf-a:0deg;position:relative;width:min(100%,340px);padding:2px;border-radius:26px;background:conic-gradient(from var(--gf-a),#7c5cff,#ff5fa8,#ffb454,#38e8ff,#7c5cff);animation:gf-spin 5s linear infinite}
.gf::before{content:"";position:absolute;inset:-2px;border-radius:30px;background:inherit;filter:blur(22px);opacity:.45;z-index:-1;transition:opacity .3s}
.gf:hover,.gf:focus-within{animation-duration:2s}
.gf:hover::before,.gf:focus-within::before{opacity:.7}
.gf-in{border-radius:24px;padding:26px 26px 24px;background:var(--sc-bg)}
.gf-tag{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--sc-ring);color:var(--sc-accent);font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}
.gf-in h3{margin:14px 0 2px;font:800 24px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}
.gf-price{margin:0 0 18px;font:800 46px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.gf-price small{font-size:15px;font-weight:600;color:var(--sc-muted);letter-spacing:0}
.gf-in ul{margin:0 0 22px;padding:0;list-style:none;display:grid;gap:10px}
.gf-in li{display:flex;align-items:center;gap:10px;font-size:15px}
.gf-in li svg{flex:none;width:18px;height:18px;padding:3px;border-radius:50%;background:var(--sc-accent);fill:none;stroke:var(--sc-accent-fg);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.gf-btn{width:100%;padding:13px;border:0;border-radius:14px;background:var(--sc-accent);color:var(--sc-accent-fg);cursor:pointer;font-size:15px;font-weight:700}
.gf-btn:hover{filter:brightness(1.08)}
@keyframes gf-spin{to{--gf-a:360deg}}
@media (prefers-reduced-motion:reduce){.gf{animation:none}}`,
 html:`<div class="gfx"><div class="gf"><div class="gf-in"><span class="gf-tag">Most popular</span><h3>Studio plan</h3><p class="gf-price">$24 <small>/ month</small></p><ul><li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Unlimited projects</li><li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Shared design tokens</li><li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Priority support</li></ul><button class="gf-btn" type="button">Start free trial</button></div></div></div>`,
 js:`(function(){})();`},

{id:'s-chrome-gyro',title:'Chrome gyroscope',component:'Chrome gyroscope',key:'chrome-gyro',family,width:560,
 description:'Nested chrome rings that spin on different axes like a gyroscope and snap into a flat halo when you click.',
 prompt:'Build a gyroscope from three concentric CSS 3D rings plus a chrome sphere in the middle. Each ring is a round div with a conic-gradient metal finish (white, steel blue, near black, silver) cut into a ring with mask: radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px)); the group uses transform-style: preserve-3d under perspective(900px). In a requestAnimationFrame loop integrate rotation angles for each ring about X, Y and Z with different speeds. Clicking (or the Halo button, aria-pressed) toggles a halo mode: the target angles become rotateX(72deg) with decreasing radii and small Z offsets so the rings lie flat like a halo, the spin slows and the central sphere brightens; the transition eases through the animation loop. Pointer movement tilts the whole assembly slightly. The central sphere uses radial gradients for chrome reflection. Pause off-screen and for reduced motion render a static pose. Vanilla HTML, CSS and JavaScript.',
 css:`.cg{position:relative;display:grid;place-items:center;height:400px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 45%,#232338,#07070d 72%);overflow:hidden}
.cg-view{width:300px;height:300px;perspective:900px;filter:drop-shadow(0 0 10px rgba(160,180,255,.35))}
.cg-scene{position:relative;width:100%;height:100%;transform-style:preserve-3d}
.cg-ring{position:absolute;left:50%;top:50%;border-radius:50%;transform-style:preserve-3d;background:conic-gradient(from var(--s,0deg),#ffffff,#8aa0c8,#1a1f2c,#e6eeff,#5c6f94,#0d1018,#ffffff);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 14px),#000 calc(100% - 13px));mask:radial-gradient(farthest-side,transparent calc(100% - 14px),#000 calc(100% - 13px));}
.cg-core{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff 0,#cfd8ee 14%,#5e6e92 42%,#11141d 72%,#7f90b8 100%);box-shadow:0 0 30px rgba(140,160,255,.35);transition:box-shadow .5s,filter .5s}
.cg.halo .cg-core{box-shadow:0 0 60px rgba(170,190,255,.8);filter:brightness(1.25)}
.cg-btn{position:absolute;right:14px;bottom:14px;padding:8px 16px;border:1px solid #3a3a58;border-radius:999px;background:rgba(10,10,24,.7);color:#e6e6ff;cursor:pointer;font-size:13px;font-weight:600}
.cg-btn:hover,.cg-btn[aria-pressed=true]{border-color:#a99bff}`,
 html:`<div class="cg"><div class="cg-view" role="img" aria-label="A chrome gyroscope of three spinning rings around a metal sphere"><div class="cg-scene"><div class="cg-ring" data-r="0"></div><div class="cg-ring" data-r="1"></div><div class="cg-ring" data-r="2"></div><div class="cg-core"></div></div></div><button class="cg-btn" type="button" aria-pressed="false">Halo</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cg'),scene=root.querySelector('.cg-scene'),rings=[].slice.call(root.querySelectorAll('.cg-ring')),btn=root.querySelector('.cg-btn');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,size=[290,222,156],sp=[[.6,.9,.2],[-.8,.4,.7],[.5,-.7,1.1]],ang=[[10,20,0],[60,-30,40],[110,40,80]],halo=false,mix=0,tx=0,ty=0,px=0,py=0,raf=0,visible=true;
rings.forEach(function(r,i){r.style.width=r.style.height=size[i]+'px';r.style.marginLeft=r.style.marginTop=(-size[i]/2)+'px';r.style.setProperty('--s',(i*70)+'deg')});
var haloR=[290,236,182],haloZ=[0,16,32];
function frame(){raf=0;mix+=((halo?1:0)-mix)*(reduce?1:.06);px+=(tx-px)*.1;py+=(ty-py)*.1;
 rings.forEach(function(r,i){var k=halo?(1-mix*.9):1;if(!reduce){ang[i][0]+=sp[i][0]*k;ang[i][1]+=sp[i][1]*k;ang[i][2]+=sp[i][2]*k}
  var a0=ang[i][0]*(1-mix)+72*mix,a1=ang[i][1]*(1-mix)+(i*3-3)*mix,a2=ang[i][2]*(1-mix),sz=size[i]*(1-mix)+haloR[i]*mix;
  r.style.width=r.style.height=sz+'px';r.style.marginLeft=r.style.marginTop=(-sz/2)+'px';r.style.transform='rotateX('+a0.toFixed(2)+'deg) rotateY('+a1.toFixed(2)+'deg) rotateZ('+a2.toFixed(2)+'deg) translateZ('+(haloZ[i]*mix).toFixed(1)+'px)'});
 scene.style.transform='rotateX('+(py*-14).toFixed(2)+'deg) rotateY('+(px*18).toFixed(2)+'deg)';
 if(visible&&(!reduce||Math.abs((halo?1:0)-mix)>.003))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function toggle(){halo=!halo;btn.setAttribute('aria-pressed',String(halo));root.classList.toggle('halo',halo);go()}
btn.addEventListener('click',toggle);root.querySelector('.cg-view').addEventListener('click',toggle);
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;if(reduce)go()});root.addEventListener('pointerleave',function(){tx=ty=0;if(reduce)go()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-assistant-orb',title:'Assistant orb',component:'Assistant orb',key:'assistant-orb',family,width:560,
 description:'A glass orb with a slow swirl inside that listens with ripples, thinks with a faster swirl and speaks with a pulsing glow.',
 prompt:'Create an AI assistant orb in four states: idle, listening, thinking and speaking. The orb is a 200px sphere: a radial-gradient body, an inner swirl made from a blurred rotating conic-gradient clipped by the sphere (rotation duration 14s idle, 5s listening, 1.6s thinking, 3s speaking), a glass highlight and an inner shadow, with an outer glow. Listening adds three rings that expand and fade from the orb while a simulated microphone level (smoothed random values updated from requestAnimationFrame) scales the orb between 1 and 1.12 and sets a --lvl custom property used by the rings. Thinking shifts the hue towards cyan and makes the orb\'s border-radius gently wobble. Speaking pulses the scale and glow in a rhythm and shows five small bars under the orb that move like an equaliser. A row of state buttons (aria-pressed) selects the state and a status line (aria-live polite) names it; if the user never picks one the demo cycles through the states every 3.2s. Reduced motion shows a still orb with state shown by colour only. Vanilla HTML, CSS and JavaScript.',
 css:`.ao{display:grid;gap:22px;justify-items:center;padding:44px 20px 26px;border:1px solid #1d1d28;border-radius:28px;background:radial-gradient(ellipse at 50% 38%,#1c1a3a,#07070f 72%);color:#e9e6ff}
.ao-stage{position:relative;width:260px;height:260px;display:grid;place-items:center}
.ao-orb{--lvl:0;--h:262;position:relative;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 34% 28%,hsl(var(--h) 90% 82%),hsl(var(--h) 80% 58%) 38%,hsl(calc(var(--h) + 30) 80% 30%) 72%,#0c0820 100%);box-shadow:0 0 70px hsla(var(--h),90%,60%,.45),inset 0 -18px 40px rgba(0,0,0,.45);overflow:hidden;transform:scale(calc(1 + var(--lvl)*.12));transition:box-shadow .6s;animation:ao-wob 7s ease-in-out infinite}
.ao-orb::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,transparent,hsla(calc(var(--h) + 60),95%,70%,.75),transparent 40%,hsla(calc(var(--h) - 50),95%,65%,.6),transparent 75%);filter:blur(18px);animation:ao-spin var(--sp,14s) linear infinite}
.ao-orb::after{content:"";position:absolute;left:14%;top:8%;width:46%;height:30%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,255,255,.7),transparent 70%);filter:blur(3px)}
.ao-ring{position:absolute;left:50%;top:50%;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:2px solid hsla(var(--h),90%,70%,.6);opacity:0}
.ao[data-s=listening] .ao-ring{animation:ao-ripple 2.4s ease-out infinite}
.ao[data-s=listening] .ao-ring:nth-child(2){animation-delay:.8s}.ao[data-s=listening] .ao-ring:nth-child(3){animation-delay:1.6s}
.ao[data-s=idle]{--sp:14s}.ao[data-s=listening]{--sp:5s}.ao[data-s=thinking]{--sp:1.6s}.ao[data-s=speaking]{--sp:3s}
.ao[data-s=thinking] .ao-orb{--h:196;animation:ao-wob 1.8s ease-in-out infinite}
.ao[data-s=speaking] .ao-orb{--h:312;animation:ao-wob 7s ease-in-out infinite,ao-talk .9s ease-in-out infinite}
.ao[data-s=listening] .ao-orb{--h:222}
.ao-bars{display:flex;gap:5px;height:22px;align-items:center;opacity:0;transition:opacity .3s}
.ao[data-s=speaking] .ao-bars{opacity:1}
.ao-bars i{width:5px;height:100%;border-radius:3px;background:hsl(312 90% 72%);animation:ao-bar .7s ease-in-out infinite;animation-delay:calc(var(--i)*-.12s)}
.ao-st{margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#a8a3d9}
.ao-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ao-btn{padding:8px 16px;border:1px solid #38365a;border-radius:999px;background:rgba(14,12,32,.7);color:#e9e6ff;cursor:pointer;font-size:13px;font-weight:600}
.ao-btn:hover,.ao-btn[aria-pressed=true]{border-color:#a99bff;background:rgba(120,100,255,.18)}
@keyframes ao-spin{to{transform:rotate(360deg)}}
@keyframes ao-wob{0%,100%{border-radius:50%}50%{border-radius:48% 52% 51% 49%/52% 48% 52% 48%}}
@keyframes ao-ripple{0%{transform:scale(1);opacity:calc(.5 + var(--lvl)*.4)}100%{transform:scale(1.75);opacity:0}}
@keyframes ao-talk{0%,100%{box-shadow:0 0 60px hsla(var(--h),90%,60%,.4),inset 0 -18px 40px rgba(0,0,0,.45)}50%{box-shadow:0 0 110px hsla(var(--h),90%,65%,.75),inset 0 -18px 40px rgba(0,0,0,.45)}}
@keyframes ao-bar{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.ao-orb,.ao-orb::before,.ao-ring,.ao-bars i{animation:none!important}}`,
 html:`<div class="ao" data-s="idle"><div class="ao-stage"><i class="ao-ring"></i><i class="ao-ring"></i><i class="ao-ring"></i><div class="ao-orb" role="img" aria-label="Assistant orb"></div></div><div class="ao-bars" aria-hidden="true"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i></div><p class="ao-st" aria-live="polite">Idle</p><div class="ao-row"><button class="ao-btn" type="button" data-s="idle" aria-pressed="true">Idle</button><button class="ao-btn" type="button" data-s="listening" aria-pressed="false">Listening</button><button class="ao-btn" type="button" data-s="thinking" aria-pressed="false">Thinking</button><button class="ao-btn" type="button" data-s="speaking" aria-pressed="false">Speaking</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ao'),orb=root.querySelector('.ao-orb'),st=root.querySelector('.ao-st'),btns=root.querySelectorAll('.ao-btn');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,order=['idle','listening','thinking','speaking'],names={idle:'Idle',listening:'Listening',thinking:'Thinking',speaking:'Speaking'},idx=0,picked=false,timer=0,lvl=0,tl=0,raf=0,visible=true;
function set(s){root.setAttribute('data-s',s);st.textContent=names[s];btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-s')===s))});if(s!=='listening')orb.style.setProperty('--lvl',0);root.style.setProperty('--lvl',0)}
function cycle(){clearTimeout(timer);if(picked||reduce)return;timer=setTimeout(function(){idx=(idx+1)%4;set(order[idx]);cycle()},3200)}
btns.forEach(function(b){b.addEventListener('click',function(){picked=true;set(b.getAttribute('data-s'))})});
function frame(now){raf=0;if(root.getAttribute('data-s')==='listening'){if(Math.random()<.12)tl=Math.random();lvl+=(tl-lvl)*.2;orb.style.setProperty('--lvl',lvl.toFixed(3));root.style.setProperty('--lvl',lvl.toFixed(3))}if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);set('idle');cycle();go();})();`},

{id:'s-scroll-stack',title:'Scroll stack',component:'Scroll stack',key:'scroll-stack',family,width:640,
 description:'Cards that pin to the top as you scroll and shrink and dim behind the next one to build a tidy stack.',
 prompt:'Build a scrolling stack inside a 440px tall scroll container. It holds five full-width cards (260px tall, each with a generated landscape band, a step number, a heading and a line of text) with position: sticky and top: 18px + index * 14px, so each card sticks slightly lower than the one before it. A scroll handler (requestAnimationFrame throttled) computes, for each card, how far the next card has overlapped it (0 to 1) and applies transform: scale(1 - 0.05 * overlapAndAfter) with filter brightness down to 0.7 and a slight translateY so the cards beneath read as a neat deck. Add bottom padding so the last card can reach its place. Show a small progress indicator ("2 / 5") and make the scroll container focusable with a label. Reduced motion keeps the sticky layout but drops the scale and dimming. Vanilla HTML, CSS and JavaScript.',
 css:`.sk2{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.sk2-scroll{height:440px;overflow-y:auto;padding:18px 18px 260px;scroll-behavior:smooth}
.sk2-card{position:sticky;top:calc(18px + var(--i)*14px);height:260px;margin-bottom:34px;border-radius:24px;overflow:hidden;background:var(--sc-bg);border:1px solid var(--sc-line);box-shadow:0 18px 34px -18px rgba(0,0,0,.45);transform-origin:50% 0;will-change:transform,filter;display:grid;grid-template-columns:1fr 1.1fr}
.sk2-art{background-size:cover;background-position:center}
.sk2-txt{padding:26px 26px 20px;display:flex;flex-direction:column;justify-content:center}
.sk2-txt small{font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:var(--sc-accent)}
.sk2-txt h3{margin:10px 0 8px;font:800 26px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em}
.sk2-txt p{margin:0;font-size:15px;line-height:1.5;color:var(--sc-muted)}
.sk2-count{position:absolute;right:16px;top:14px;padding:5px 10px;border-radius:999px;background:var(--sc-bg);border:1px solid var(--sc-line);font:700 12px/1 ui-monospace,monospace;z-index:20}
@media (max-width:520px){.sk2-card{grid-template-columns:1fr}.sk2-art{display:none}}`,
 html:`<div class="sk2"><span class="sk2-count" aria-live="polite">1 / 5</span><div class="sk2-scroll" tabindex="0" role="region" aria-label="Stacking cards, scroll to continue"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sk2'),sc=root.querySelector('.sk2-scroll'),count=root.querySelector('.sk2-count');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cards=[],raf=0,heads=['Sketch the idea','Block it out','Add the light','Polish the details','Ship it'],body=['Start loose. Capture the shape of the thing before its edges.','Rough in the layout so the rhythm of the page is clear.','Colour and shadow turn flat blocks into a place to look at.','Spacing, type and motion get one last careful pass.','Release it, watch how people use it, begin the next draft.'];
for(var i=0;i<5;i++){var c=document.createElement('article');c.className='sk2-card';c.style.setProperty('--i',i);var a=document.createElement('div');a.className='sk2-art';a.style.backgroundImage='url('+artURL(i*3+1,300,260)+')';var t=document.createElement('div');t.className='sk2-txt';var s=document.createElement('small');s.textContent='STEP 0'+(i+1);var h=document.createElement('h3');h.textContent=heads[i];var p=document.createElement('p');p.textContent=body[i];t.appendChild(s);t.appendChild(h);t.appendChild(p);c.appendChild(a);c.appendChild(t);sc.appendChild(c);cards.push(c)}
function update(){raf=0;var top=sc.getBoundingClientRect().top,cur=0;
 cards.forEach(function(c,i){var next=cards[i+1],ov=0;if(next){var cr=c.getBoundingClientRect(),nr=next.getBoundingClientRect();ov=Math.max(0,Math.min(1,(cr.top+cr.height*.55-nr.top)/(cr.height*.55)))}if(c.getBoundingClientRect().top-top<60+i*14)cur=i;
  var depth=0;for(var j=i+1;j<cards.length;j++){var q=cards[j].getBoundingClientRect();depth+=Math.max(0,Math.min(1,(c.getBoundingClientRect().top+c.offsetHeight*.55-q.top)/(c.offsetHeight*.55)))}
  if(reduce)return;c.style.transform='scale('+(1-.045*Math.min(depth,3)).toFixed(4)+')';c.style.filter='brightness('+(1-.12*Math.min(depth,3)).toFixed(3)+')'});
 count.textContent=(cur+1)+' / 5'}
function sched(){if(!raf)raf=requestAnimationFrame(update)}
sc.addEventListener('scroll',sched,{passive:true});update();})();`},

{id:'s-expand-cards',title:'Expanding cards',component:'Expanding cards',key:'expand-cards',family,width:780,
 description:'A grid of photo cards that grow in place into a full detail panel and shrink back to their slot.',
 prompt:'Build a 2x2 grid of photo cards (generated landscapes with a title) that expand into a detail view. On click or Enter the card\'s rectangle (relative to the grid container) is measured, a clone element with the same artwork and border radius is absolutely positioned at that rectangle and then, after forcing layout, transitioned to fill the whole container (left/top/width/height over 0.55s cubic-bezier(.3,.8,.2,1)); the detail content (heading, three lines of copy and a Close button) fades in after 0.25s. Closing (Close button, Escape or clicking outside the content) reverses the transition back to the original rectangle and then removes the clone. The original card is hidden (visibility hidden) while expanded. Focus moves into the detail view when it opens and returns to the originating card when it closes; the detail has role="dialog", aria-modal="true" and a label. Reduced motion skips the transition. Vanilla HTML, CSS and JavaScript.',
 css:`.xc{position:relative;height:430px;padding:14px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.xc-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;height:100%}
.xc-card{position:relative;padding:0;border:0;border-radius:20px;overflow:hidden;cursor:pointer;color:#fff;text-align:left;background-size:cover;background-position:center;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .3s}
.xc-card:hover{transform:scale(1.015);box-shadow:0 18px 30px -16px rgba(0,0,0,.55)}
.xc-card span{position:absolute;left:18px;bottom:16px;font:800 22px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 10px rgba(0,0,0,.5)}
.xc-card small{position:absolute;left:18px;top:16px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;opacity:.9}
.xc-open{position:absolute;border-radius:20px;overflow:hidden;background-size:cover;background-position:center;z-index:10;transition:left .55s cubic-bezier(.3,.8,.2,1),top .55s cubic-bezier(.3,.8,.2,1),width .55s cubic-bezier(.3,.8,.2,1),height .55s cubic-bezier(.3,.8,.2,1),border-radius .55s}
.xc-open .xc-body{position:absolute;left:0;right:0;bottom:0;padding:70px 30px 28px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.75));opacity:0;transition:opacity .35s .25s}
.xc-open.full .xc-body{opacity:1}
.xc-body h3{margin:0 0 8px;font:800 34px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em}
.xc-body p{margin:0 0 16px;max-width:36em;font-size:16px;line-height:1.5;opacity:.92}
.xc-close{padding:9px 18px;border:1px solid rgba(255,255,255,.6);border-radius:999px;background:rgba(0,0,0,.35);color:#fff;cursor:pointer;font-size:14px;font-weight:600}
.xc-close:hover{background:rgba(0,0,0,.6)}
@media (prefers-reduced-motion:reduce){.xc-open,.xc-open .xc-body{transition:none}}`,
 html:`<div class="xc"><div class="xc-grid"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.xc'),grid=root.querySelector('.xc-grid');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,ids=[0,2,5,6],texts=['Warm light settling over the ridgelines as the day closes.','A cold, bright morning above a quiet glacier basin.','Neon haze over an empty highway, long after midnight.','Teal water, soft wind and one last bright moon.'],cards=[],open=null;
function rectOf(el){var r=el.getBoundingClientRect(),p=root.getBoundingClientRect();return {l:r.left-p.left,t:r.top-p.top,w:r.width,h:r.height}}
function place(el,r){el.style.left=r.l+'px';el.style.top=r.t+'px';el.style.width=r.w+'px';el.style.height=r.h+'px'}
ids.forEach(function(id,i){var b=document.createElement('button');b.type='button';b.className='xc-card';b.style.backgroundImage='url('+artURL(id,380,200)+')';var s=document.createElement('span');s.textContent=NAMES[id%8];var sm=document.createElement('small');sm.textContent='0'+(i+1);b.appendChild(sm);b.appendChild(s);b.addEventListener('click',function(){expand(i,b)});grid.appendChild(b);cards.push(b)});
function expand(i,card){if(open)return;var r=rectOf(card),el=document.createElement('div');el.className='xc-open';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',NAMES[ids[i]%8]);el.style.backgroundImage='url('+artURL(ids[i],780,430)+')';place(el,r);
 var body=document.createElement('div');body.className='xc-body';var h=document.createElement('h3');h.textContent=NAMES[ids[i]%8];var p=document.createElement('p');p.textContent=texts[i];var c=document.createElement('button');c.type='button';c.className='xc-close';c.textContent='Close';body.appendChild(h);body.appendChild(p);body.appendChild(c);el.appendChild(body);root.appendChild(el);void el.offsetWidth;
 card.style.visibility='hidden';var full={l:0,t:0,w:root.clientWidth,h:root.clientHeight};place(el,full);el.style.borderRadius='0px';el.classList.add('full');open={el:el,card:card};c.focus();c.addEventListener('click',close);el.addEventListener('pointerdown',function(e){if(e.target===el)close()})}
function close(){if(!open)return;var o=open;open=null;o.el.classList.remove('full');place(o.el,rectOf(o.card));o.el.style.borderRadius='20px';var done=function(){o.card.style.visibility='';o.el.remove();o.card.focus()};if(reduce)done();else setTimeout(done,560)}
root.addEventListener('keydown',function(e){if(e.key==='Escape')close()});})();`}
];
