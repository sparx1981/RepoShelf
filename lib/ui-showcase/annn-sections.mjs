// Original section-level components: rails, sliders, grids, dividers, pricing and footers. No third-party code.
import {ART} from './art-boot.mjs';
import {SB} from './annn-boot.mjs';
const family='Sections & components';
const NAMES="var NAMES=['Dusk','Glacier','Mesa','Night','Mint','Neon','Tide','Lilac'];";
export const annnSections=[
{id:'s-feature-rail',title:'Chapter rail',component:'Chapter rail',key:'feature-rail',family,width:760,
 description:'A sticky chapter rail with scroll-spy: names stay pinned while their content scrolls by and a hairline slides and resizes to the active chapter.',
 prompt:'Build a two-column section inside a scroll container: a sticky rail on the left (170px) listing four chapter names as real buttons, and the chapters on the right, each about 340px tall with a number, heading, paragraph and a generated image. A 2px accent hairline sits at the left edge of the rail and its top and height follow the active button (transitions of 0.4s cubic-bezier(.3,.9,.3,1)). The active chapter is the last one whose top has passed 35% of the container height (computed from scrollTop); the active rail button turns to the text colour and gets aria-current="true". Clicking a rail button scrolls its chapter into view smoothly. Chapters fade up slightly when they become active. The container auto-scrolls up and down until the visitor scrolls (reduced motion keeps manual scrolling only) and is keyboard focusable with an aria-label. Vanilla HTML, CSS and JavaScript.',
 css:`.fr{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
.fr-in{display:grid;grid-template-columns:170px 1fr;gap:28px;padding:0 30px 180px}
.fr-rail{position:sticky;top:0;align-self:start;display:grid;gap:2px;padding:30px 0 0 16px;height:fit-content}
.fr-hair{position:absolute;left:0;top:30px;width:2px;height:40px;border-radius:2px;background:var(--sc-accent);transition:top .4s cubic-bezier(.3,.9,.3,1),height .4s cubic-bezier(.3,.9,.3,1)}
.fr-btn{display:block;padding:10px 0;border:0;background:transparent;color:var(--sc-muted);cursor:pointer;text-align:left;font:700 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;transition:color .25s}
.fr-btn[aria-current=true]{color:var(--sc-fg)}
.fr-ch{height:340px;padding-top:30px;opacity:.35;transform:translateY(10px);transition:opacity .4s,transform .5s cubic-bezier(.3,.9,.3,1)}
.fr-ch.on{opacity:1;transform:none}
.fr-ch small{font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:var(--sc-accent)}
.fr-ch h3{margin:10px 0 8px;font:800 32px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.fr-ch p{margin:0 0 16px;max-width:30em;font-size:15px;line-height:1.55;color:var(--sc-muted)}
.fr-ch i{display:block;height:130px;border-radius:18px;background-size:cover;background-position:center}
@media (prefers-reduced-motion:reduce){.fr-hair,.fr-ch{transition:none}}`,
 html:`<div class="fr" tabindex="0" role="region" aria-label="Product chapters"><div class="fr-in"><nav class="fr-rail" aria-label="Chapters"><i class="fr-hair"></i></nav><div class="fr-chs"></div></div></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.fr'),rail=box.querySelector('.fr-rail'),hair=box.querySelector('.fr-hair'),chs=box.querySelector('.fr-chs');
${ART}
${SB}
var data=[['Capture','Bring everything in from any source and keep it tidy from the start.',2],['Shape','Rearrange, tag and link ideas until the structure shows itself.',5],['Share','Send a link, set permissions and let people comment in place.',1],['Ship','Publish with one click and watch the results come in live.',6]],B=[],C=[],cur=-1;
data.forEach(function(d,i){var b=document.createElement('button');b.type='button';b.className='fr-btn';b.textContent=d[0];b.addEventListener('click',function(){box.scrollTo({top:C[i].offsetTop-30,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})});rail.appendChild(b);B.push(b);
 var c=document.createElement('section');c.className='fr-ch';var s=document.createElement('small');s.textContent='0'+(i+1);var h=document.createElement('h3');h.textContent=d[0];var p=document.createElement('p');p.textContent=d[1];var im=document.createElement('i');im.style.backgroundImage='url('+artURL(d[2],400,130)+')';c.appendChild(s);c.appendChild(h);c.appendChild(p);c.appendChild(im);chs.appendChild(c);C.push(c)});
function setActive(i){if(i===cur)return;cur=i;B.forEach(function(b,k){if(k===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});C.forEach(function(c,k){c.classList.toggle('on',k===i)});var b=B[i];hair.style.top=(b.offsetTop)+'px';hair.style.height=b.offsetHeight+'px'}
ScrollDemo(box,function(p,st){var line=st+box.clientHeight*.35,idx=0;C.forEach(function(c,i){if(c.offsetTop<=line)idx=i});setActive(idx)},{speed:.09});})();`},

{id:'s-curtain-slider',title:'Curtain slider',component:'Curtain slider',key:'curtain-slider',family,width:760,
 description:'A full-bleed slider whose slide change plays a twelve-column curtain wipe, revealing the next picture settling underneath.',
 prompt:'Build a hero image slider with four generated landscape slides. Each slide change plays a staggered curtain: place twelve full-height column elements over the stage, each showing the outgoing image with the correct background-position so together they reproduce it; underneath, the incoming image sits on a base layer that scales from 1.12 to 1 (settling) while the columns wipe away. Each column\'s clip-path goes from inset(0 0 0 0) to inset(0 0 0 100%) (the edge sweeps sideways) over 0.7s cubic-bezier(.6,0,.3,1) with a 45ms stagger between columns. The slide title (large), chapter label ("Chapter 02") and a counter animate with the change (old text slides up and fades out, new text rises in 0.2s later). Controls: Previous/Next buttons, four dot buttons with aria-labels and an auto-advance every 3.6s that pauses on hover and focus. Block clicks while a transition runs. Reduced motion swaps slides with a fade. Vanilla HTML, CSS and JavaScript.',
 css:`.cl{position:relative;height:420px;border-radius:28px;overflow:hidden;background:#0b0b10;border:1px solid var(--sc-line)}
.cl-base,.cl-cols{position:absolute;inset:0}
.cl-img{position:absolute;inset:0;background-size:cover;background-position:center;transform-origin:50% 50%}
.cl-col{position:absolute;top:0;bottom:0;background-repeat:no-repeat;will-change:clip-path}
.cl-ov{position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,.55));pointer-events:none}
.cl-txt{position:absolute;left:34px;bottom:38px;color:#fff;pointer-events:none}
.cl-ch{display:block;margin-bottom:10px;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;opacity:.85}
.cl-ttl{position:relative;display:block;height:64px;overflow:hidden}
.cl-ttl span{position:absolute;left:0;top:0;white-space:nowrap;font:900 52px/64px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em;transition:transform .6s cubic-bezier(.3,.9,.3,1),opacity .4s}
.cl-ui{position:absolute;right:24px;bottom:30px;display:flex;align-items:center;gap:10px}
.cl-btn{width:42px;height:42px;border:1px solid rgba(255,255,255,.5);border-radius:50%;background:rgba(0,0,0,.3);color:#fff;cursor:pointer;font-size:18px}
.cl-btn:hover{background:rgba(255,255,255,.25)}
.cl-dots{display:flex;gap:6px}
.cl-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer}
.cl-dot[aria-current=true]{background:#fff;transform:scale(1.4)}
@media (prefers-reduced-motion:reduce){.cl-ttl span{transition:none}}`,
 html:`<div class="cl" role="group" aria-roledescription="carousel" aria-label="Featured landscapes"><div class="cl-base"><div class="cl-img"></div></div><div class="cl-cols" aria-hidden="true"></div><div class="cl-ov"></div><div class="cl-txt"><span class="cl-ch"></span><span class="cl-ttl" aria-live="polite"></span></div><div class="cl-ui"><div class="cl-dots"></div><button class="cl-btn" type="button" data-d="-1" aria-label="Previous slide">&#8592;</button><button class="cl-btn" type="button" data-d="1" aria-label="Next slide">&#8594;</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cl'),img=root.querySelector('.cl-img'),cols=root.querySelector('.cl-cols'),ch=root.querySelector('.cl-ch'),ttl=root.querySelector('.cl-ttl'),dots=root.querySelector('.cl-dots');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,slides=[['Golden hour',2],['Glass ridge',1],['Neon tide',5],['Lilac road',7]],cur=0,busy=false,timer=0,hover=false,E='cubic-bezier(.6,0,.3,1)',D=[];
function W(){return root.clientWidth}function H(){return root.clientHeight}
function url(i){return artURL(slides[i][1],760,420)}
slides.forEach(function(s,i){var d=document.createElement('button');d.type='button';d.className='cl-dot';d.setAttribute('aria-label','Go to slide '+(i+1));d.addEventListener('click',function(){go(i)});dots.appendChild(d);D.push(d)});
function setText(i,first){ch.textContent='Chapter 0'+(i+1);var old=ttl.lastElementChild,n=document.createElement('span');n.textContent=slides[i][0];if(!first){n.style.transform='translateY(100%)';n.style.opacity=0}ttl.appendChild(n);if(old){old.style.transform='translateY(-100%)';old.style.opacity=0;setTimeout(function(){old.remove()},650)}void n.offsetWidth;n.style.transition='transform .6s cubic-bezier(.3,.9,.3,1) .2s,opacity .4s .2s';n.style.transform='none';n.style.opacity=1;D.forEach(function(d,k){if(k===i)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')})}
function go(n){if(busy||n===cur)return;n=(n+slides.length)%slides.length;busy=true;var from=cur,w=W(),h=H(),N=12,cw=w/N;
 if(reduce){cur=n;img.style.backgroundImage='url('+url(n)+')';setText(n);busy=false;return}
 img.style.backgroundImage='url('+url(n)+')';img.animate([{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:1100,easing:E});
 cols.textContent='';var anims=[];for(var i=0;i<N;i++){var c=document.createElement('div');c.className='cl-col';c.style.left=(i*cw)+'px';c.style.width=(cw+1)+'px';c.style.backgroundImage='url('+url(from)+')';c.style.backgroundSize=w+'px '+h+'px';c.style.backgroundPosition=(-i*cw)+'px 0';cols.appendChild(c);anims.push(c.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{duration:700,delay:i*45,easing:E,fill:'forwards'}))}
 setText(n);cur=n;Promise.all(anims.map(function(a){return a.finished})).then(function(){cols.textContent='';busy=false}).catch(function(){busy=false})}
root.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){go(cur+ +b.getAttribute('data-d'));loop()})});
function loop(){clearTimeout(timer);if(reduce)return;timer=setTimeout(function(){if(!hover)go(cur+1);loop()},3600)}
root.addEventListener('pointerenter',function(){hover=true});root.addEventListener('pointerleave',function(){hover=false});root.addEventListener('focusin',function(){hover=true});root.addEventListener('focusout',function(){hover=false});
img.style.backgroundImage='url('+url(0)+')';setText(0,true);loop();})();`},

{id:'s-bento-focus',title:'Bento focus',component:'Bento focus',key:'bento-focus',family,width:780,
 description:'Five photo tiles on a bento grid with one big focus slot: click a small tile and it grows into the slot while the rest re-settle.',
 prompt:'Create a bento layout with five tiles and five slots in a 430px tall container: slot 0 is the large focus slot (left 58%, full height), the others are four mixed-shape slots on the right (fractions of the container: {x:.6,y:0,w:.19,h:.48}, {x:.8,y:0,w:.2,h:.28}, {x:.8,y:.3,w:.2,h:.7}, {x:.6,y:.5,w:.19,h:.5}). Tiles are real buttons with generated photos and captions, absolutely positioned with left/top/width/height transitions of 0.8s cubic-bezier(.3,.9,.2,1). Clicking a small tile moves it into slot 0 and sends the previous focus tile to the clicked tile\'s old slot; the three remaining tiles rotate one slot along the small slots so everything re-settles, each tile delayed in proportion to how far it has to travel (farther tiles later, up to 0.2s). Clicking again during the flight simply retargets (the CSS transitions handle it). The focus tile shows a large caption and description; small tiles show a small caption. Keep gaps of 10px (inset every tile by 5px). Recompute on resize, auto-click a random small tile every 3.5s until the visitor interacts, reduced motion removes transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.bf{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.bf-t{position:absolute;padding:0;border:0;border-radius:22px;overflow:hidden;cursor:pointer;color:#fff;text-align:left;background-size:cover;background-position:center;transition:left .8s cubic-bezier(.3,.9,.2,1) var(--d,0s),top .8s cubic-bezier(.3,.9,.2,1) var(--d,0s),width .8s cubic-bezier(.3,.9,.2,1) var(--d,0s),height .8s cubic-bezier(.3,.9,.2,1) var(--d,0s)}
.bf-t::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 50%,rgba(0,0,0,.55));pointer-events:none}
.bf-t span{position:absolute;left:16px;bottom:14px;z-index:2;font:800 15px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;transition:font-size .5s,transform .5s}
.bf-t.main span{font-size:32px;transform:translateY(-4px)}
.bf-t small{display:none;position:absolute;left:16px;bottom:56px;z-index:2;font-size:14px;opacity:0;transition:opacity .4s .4s}
.bf-t.main small{display:block;opacity:.9}
.bf-t:focus-visible{outline:3px solid var(--sc-accent);outline-offset:-3px}
@media (prefers-reduced-motion:reduce){.bf-t,.bf-t span{transition:none}}`,
 html:`<div class="bf" role="group" aria-label="Featured photos"></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.bf');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,slots=[{x:0,y:0,w:.58,h:1},{x:.6,y:0,w:.19,h:.48},{x:.8,y:0,w:.2,h:.28},{x:.8,y:.3,w:.2,h:.7},{x:.6,y:.5,w:.19,h:.5}],cap=[['Golden hour','Warm light across the mesa.'],['Glass ridge','Cold air over a still basin.'],['Neon tide','Colour on a wet street.'],['Lilac road','A soft, quiet morning drive.'],['Night field','Stars over the open grass.']],ids=[2,1,5,7,3],tiles=[],slotOf=[0,1,2,3,4],touched=false;
cap.forEach(function(c,i){var b=document.createElement('button');b.type='button';b.className='bf-t';b.style.backgroundImage='url('+artURL(ids[i],560,430)+')';var s=document.createElement('span');s.textContent=c[0];var sm=document.createElement('small');sm.textContent=c[1];b.appendChild(sm);b.appendChild(s);b.setAttribute('aria-label',c[0]);b.addEventListener('click',function(){touched=true;pick(i)});root.appendChild(b);tiles.push(b)});
function rect(s){var W=root.clientWidth,H=root.clientHeight,g=5;return {l:slots[s].x*W+g,t:slots[s].y*H+g,w:slots[s].w*W-g*2,h:slots[s].h*H-g*2}}
function layout(){tiles.forEach(function(b,i){var s=slotOf[i],r=rect(s),prevL=parseFloat(b.style.left)||r.l,prevT=parseFloat(b.style.top)||r.t,dist=Math.hypot(r.l-prevL,r.t-prevT);b.style.setProperty('--d',reduce?'0s':Math.min(.2,dist/2200)+'s');b.style.left=r.l+'px';b.style.top=r.t+'px';b.style.width=r.w+'px';b.style.height=r.h+'px';b.classList.toggle('main',s===0)})}
function pick(i){var s=slotOf[i];if(s===0)return;var focus=slotOf.indexOf(0);slotOf[i]=0;slotOf[focus]=s;var others=[];slotOf.forEach(function(x,k){if(k!==i&&k!==focus)others.push(k)});var small=others.map(function(k){return slotOf[k]}).sort();others.sort(function(a,b){return slotOf[a]-slotOf[b]});
 var rot=[small[1],small[2],small[0]];others.forEach(function(k,n){slotOf[k]=small[(n+1)%3]});layout()}
layout();addEventListener('resize',layout);
var auto=setInterval(function(){if(touched)return;var cand=[];slotOf.forEach(function(s,i){if(s!==0)cand.push(i)});pick(cand[Math.floor(Math.random()*cand.length)])},3500);root.addEventListener('pointerenter',function(){clearInterval(auto)});})();`},

{id:'s-circle-slider',title:'Crest slider',component:'Crest slider',key:'circle-slider',family,width:780,
 description:'A row of cards riding the top of a huge circle that curve past as you drag, throw or use the arrows, then snap to the nearest card.',
 prompt:'Make a slider whose cards sit on a large circle of radius 640px whose centre is far below the stage, so only the top crest is visible. Nine cards (150x210px, generated artwork with a caption) are placed at angle (index - position) * 11 degrees using transform: translate(centre) rotate(angle) translateY(-R) with the card centred, so they curve down on both sides of the crest. The central card is slightly larger (scale 1 + 0.12 * (1 - min(1, |offset|))) and full opacity, others fade a little with distance. Pointer drag moves the position (1 card per 120px of drag), releasing throws it with velocity and inertia (friction 0.94) and snaps to the nearest integer position with an eased animation; clamp to the first and last card. Previous/Next arrow buttons and ArrowLeft/ArrowRight keys step by one, the focused card index is announced (aria-live), the slider is a role="group" with aria-roledescription="carousel". Pause nothing automatically except a slow idle drift to the next card every 3s until the visitor interacts. Reduced motion snaps without easing. Vanilla HTML, CSS and JavaScript.',
 css:`.cs4{position:relative;height:400px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none}
.cs4.drag{cursor:grabbing}
.cs4-card{position:absolute;left:50%;top:0;width:150px;height:210px;will-change:transform}
.cs4-face{position:absolute;inset:0;border-radius:16px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 22px 34px -18px rgba(0,0,0,.55),0 0 0 3px #fff;color:#fff}
.cs4-card span{position:absolute;left:12px;bottom:12px;font:800 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.cs4-bar{position:absolute;left:0;right:0;bottom:22px;display:flex;justify-content:center;align-items:center;gap:14px}
.cs4-btn{width:42px;height:42px;border:1px solid var(--sc-line);border-radius:50%;background:var(--sc-bg);cursor:pointer;font-size:18px;color:inherit}
.cs4-btn:hover{border-color:var(--sc-accent)}.cs4-btn:disabled{opacity:.35;cursor:default}
.cs4-name{min-width:8em;text-align:center;font:700 16px/1 system-ui;margin:0}
.cs4-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`,
 html:`<div class="cs4" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Landscape carousel"><div class="cs4-stage"></div><div class="cs4-bar"><button class="cs4-btn" type="button" data-d="-1" aria-label="Previous">&#8592;</button><p class="cs4-name" aria-live="polite"></p><button class="cs4-btn" type="button" data-d="1" aria-label="Next">&#8594;</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cs4'),stage=root.querySelector('.cs4-stage'),name=root.querySelector('.cs4-name'),btns=root.querySelectorAll('.cs4-btn');
${ART}
${NAMES}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=9,STEP=11,R=640,cards=[],pos=4,tgt=4,v=0,drag=false,lx=0,raf=0,visible=true,touched=false,lastName=-1,idle=0;
for(var i=0;i<N;i++){var c=document.createElement('div');c.className='cs4-card';c.setAttribute('aria-hidden','true');var fc=document.createElement('div');fc.className='cs4-face';fc.style.backgroundImage='url('+artURL(i,150,210)+')';var s=document.createElement('span');s.textContent=NAMES[i%8];fc.appendChild(s);c.appendChild(fc);stage.appendChild(c);cards.push({el:c,face:fc})}
function frame(now){raf=0;if(!drag){if(Math.abs(v)>.002){tgt+=v;v*=.94;tgt=Math.max(0,Math.min(N-1,tgt));pos=tgt}else{var snap=Math.round(tgt);tgt=snap;pos+=(snap-pos)*(reduce?1:.14);if(Math.abs(snap-pos)<.001)pos=snap}}else pos=tgt;
 var W=root.clientWidth,cx=0,base=root.clientHeight-232-60;cards.forEach(function(c,i){var off=i-pos,a=off*STEP,sc=1+.12*(1-Math.min(1,Math.abs(off)));c.el.style.transformOrigin='50% '+R+'px';c.el.style.transform='translate(-50%,'+base+'px) rotate('+a.toFixed(3)+'deg)';c.face.style.transform='scale('+sc.toFixed(3)+')';c.el.style.opacity=Math.max(.35,1-Math.abs(off)*.14).toFixed(2);c.el.style.zIndex=100-Math.round(Math.abs(off)*10)});
 var cur=Math.round(pos);if(cur!==lastName){lastName=cur;name.textContent=NAMES[cur%8]}btns[0].disabled=cur<=0;btns[1].disabled=cur>=N-1;
 if(visible&&(drag||Math.abs(v)>.002||Math.abs(Math.round(tgt)-pos)>.001||!touched))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function step(d){touched=true;v=0;tgt=Math.max(0,Math.min(N-1,Math.round(tgt)+d));go()}
root.addEventListener('pointerdown',function(e){if(e.target.closest('.cs4-bar'))return;touched=true;drag=true;lx=e.clientX;v=0;root.classList.add('drag');try{root.setPointerCapture(e.pointerId)}catch(_){}go()});
root.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;var d=-dx/120;tgt=Math.max(-.4,Math.min(N-.6,tgt+d));v=d;go()});
function up(){drag=false;root.classList.remove('drag');tgt=Math.max(0,Math.min(N-1,tgt));go()}root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
btns.forEach(function(b){b.addEventListener('click',function(){step(+b.getAttribute('data-d'))})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
setInterval(function(){if(touched||!visible||reduce)return;var n=Math.round(tgt)+1;if(n>N-2)n=2;tgt=n;go()},3000);go();})();`},

{id:'s-elastic-divider',title:'Elastic divider',component:'Elastic divider',key:'elastic-divider',family,width:760,
 description:'A thin line between two sections that springs away and rings back like a guitar string as the cursor sweeps across it.',
 prompt:'Make a section divider that behaves like a plucked string. An SVG line spans the width between two blocks of text. Simulate it with 90 points (index 0 and 89 pinned): each step v[i] += (y[i-1] + y[i+1] - 2*y[i]) * 0.38 - y[i] * 0.004, v[i] *= 0.985, y[i] += v[i], run twice per frame. Detect the pointer crossing the line (its vertical position moving from one side of the divider\'s centre to the other between two pointermove events, while its x is within the line): pluck at the crossing x by adding an impulse of pointer vertical speed * 0.9 (clamped to +-40) spread over a gaussian of 4 points, so faster sweeps ring harder. Draw the line as a smooth path (quadratic curves through midpoints) in the accent colour at 2px, with a thin muted straight baseline when it is at rest. Nothing moves on scroll and nothing moves on its own except an occasional automatic pluck every 3.5s when idle. Pause off-screen, honour reduced motion by disabling the idle pluck. Vanilla HTML, CSS and JavaScript.',
 css:`.ed{padding:34px 34px 30px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ed h3{margin:0 0 8px;font:800 30px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.ed p{margin:0;max-width:34em;font-size:15px;line-height:1.55;color:var(--sc-muted)}
.ed-line{position:relative;height:120px;margin:10px -34px;cursor:crosshair;touch-action:pan-y}
.ed-line svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ed-base{stroke:var(--sc-line);stroke-width:1}
.ed-str{fill:none;stroke:var(--sc-accent);stroke-width:2;stroke-linecap:round}`,
 html:`<div class="ed"><h3>Before the line</h3><p>The first section ends here. Move across the divider below, fast or slow, and listen with your eyes.</p><div class="ed-line"><svg aria-hidden="true"><line class="ed-base"/><path class="ed-str"/></svg></div><h3>After the line</h3><p>The second section begins. The divider never moves unless you touch it, and it settles back to a perfectly straight rule.</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ed'),zone=root.querySelector('.ed-line'),svg=zone.querySelector('svg'),str=svg.querySelector('.ed-str'),base=svg.querySelector('.ed-base');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=90,y=new Float32Array(N),v=new Float32Array(N),W=0,H=0,lastY=null,raf=0,visible=true,idle=0,moving=false;
function size(){W=zone.clientWidth;H=zone.clientHeight;base.setAttribute('x1',0);base.setAttribute('x2',W);base.setAttribute('y1',H/2);base.setAttribute('y2',H/2);draw()}
function pluck(x,imp){var c=Math.round(x/W*(N-1));for(var i=-8;i<=8;i++){var k=c+i;if(k>0&&k<N-1)v[k]+=imp*Math.exp(-i*i/16)}moving=true;go()}
function draw(){var d='M0 '+(H/2),px=0,py=H/2;for(var i=1;i<N;i++){var x=i/(N-1)*W,yy=H/2+y[i],mx=(px+x)/2,my=(py+yy)/2;d+=' Q'+px.toFixed(1)+' '+py.toFixed(1)+' '+mx.toFixed(1)+' '+my.toFixed(1);px=x;py=yy}d+=' L'+W+' '+(H/2);str.setAttribute('d',d)}
function frame(now){raf=0;var e=0;for(var s=0;s<2;s++){for(var i=1;i<N-1;i++){v[i]+=(y[i-1]+y[i+1]-2*y[i])*.38-y[i]*.004;v[i]*=.985}for(var j=1;j<N-1;j++){y[j]+=v[j];e+=Math.abs(v[j])+Math.abs(y[j])}}draw();if(e<.4&&moving){moving=false;y.fill(0);v.fill(0);draw()}if(visible&&(moving))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
zone.addEventListener('pointermove',function(e){var r=zone.getBoundingClientRect(),py=e.clientY-r.top-r.height/2,x=e.clientX-r.left;if(lastY!==null&&((lastY<0&&py>=0)||(lastY>0&&py<=0))){var sp=Math.max(-40,Math.min(40,(py-lastY)*.9));pluck(x,sp*1.2)}lastY=py;idle=0});zone.addEventListener('pointerleave',function(){lastY=null});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(!reduce)setInterval(function(){if(!visible||zone.matches(':hover'))return;pluck(W*(.2+Math.random()*.6),(Math.random()<.5?-1:1)*(14+Math.random()*16))},3500);
size();addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(zone);setTimeout(function(){pluck(W*.5,22)},600);})();`},

{id:'s-tag-cloud',title:'Magnetic tag cloud',component:'Magnetic tag cloud',key:'tag-cloud',family,width:780,
 description:'A pack of colourful tags that your pointer knocks outward, tilting as they bump into each other, then pulls back to their places.',
 prompt:'Build a tag cloud with 22 colourful pill tags (words about design) absolutely positioned in the middle of a stage. After measuring each tag, lay them out in centred rows (a few pixels of random vertical jitter per row) to get a home position for every tag. Each frame: apply a spring to home (k = 0.05) and damping 0.84; the pointer knocks tags away: for tags within 120px of the pointer add a repulsive velocity of (1 - d/120)^2 * (2 + pointer speed * 0.35) in the direction away from the pointer; tags tilt (rotate) by their horizontal velocity * 2.4 up to 25 degrees with easing back to zero; resolve overlaps between pairs of tags with a simple AABB push (half the overlap each along the smaller axis) and an exchange of a little velocity so they visibly bump into each other. Idle: a virtual pointer sweeps through the cloud every few seconds. Tags are decorative spans, the stage has role="img" with an aria-label. Pause off-screen, no idle sweep for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.tc{position:relative;height:400px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;touch-action:pan-y}
.tc-t{position:absolute;left:0;top:0;padding:9px 18px;border-radius:999px;color:#fff;font:700 16px/1 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;background:hsl(var(--h) 78% 56%);box-shadow:0 8px 16px -8px hsla(var(--h),80%,40%,.7);will-change:transform;user-select:none}`,
 html:`<div class="tc" role="img" aria-label="A cloud of design topic tags that move away from the pointer"></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tc');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,words=['Branding','Motion','Type','Layout','Colour','Icons','Systems','3D','Editorial','Packaging','Web','Print','Illustration','Voice','Grids','Craft','Texture','Film','Product','Signage','Posters','Identity'],T=[],px=-999,py=-999,spd=0,inside=false,raf=0,visible=true,W=0,H=0;
words.forEach(function(w,i){var e=document.createElement('span');e.className='tc-t';e.textContent=w;e.style.setProperty('--h',(250+i*14)%360);e.setAttribute('aria-hidden','true');root.appendChild(e);T.push({el:e,w:0,h:0,x:0,y:0,hx:0,hy:0,vx:0,vy:0,r:0})});
function layout(){W=root.clientWidth;H=root.clientHeight;T.forEach(function(t){t.w=t.el.offsetWidth;t.h=t.el.offsetHeight});var rows=[],cur=[],cw=0,maxW=Math.min(W-60,560);T.forEach(function(t){if(cw+t.w>maxW&&cur.length){rows.push(cur);cur=[];cw=0}cur.push(t);cw+=t.w+10});if(cur.length)rows.push(cur);
 var rh=46,top=H/2-rows.length*rh/2;rows.forEach(function(r,ri){var tw=r.reduce(function(a,t){return a+t.w+10},-10),x=W/2-tw/2;r.forEach(function(t){t.hx=x+t.w/2;t.hy=top+ri*rh+rh/2+(Math.sin(ri*3+t.w)*4);x+=t.w+10;if(!t.init){t.x=t.hx;t.y=t.hy;t.init=true}})})}
function frame(now){raf=0;var vpx=px,vpy=py,vs=spd,t=now/1000;
 if(!inside&&!reduce){var ph=(t%5)/5;if(ph<.35){vpx=W*(-.1+ph/.35*1.2);vpy=H*(.5+.12*Math.sin(t*3));vs=30}else{vpx=-999;vs=0}}
 T.forEach(function(a){var dx=a.x-vpx,dy=a.y-vpy,d=Math.sqrt(dx*dx+dy*dy)+.001;if(d<120){var f=Math.pow(1-d/120,2)*(2+vs*.35);a.vx+=dx/d*f;a.vy+=dy/d*f}a.vx+=(a.hx-a.x)*.05;a.vy+=(a.hy-a.y)*.05;a.vx*=.84;a.vy*=.84});
 for(var i=0;i<T.length;i++)for(var j=i+1;j<T.length;j++){var a=T[i],b=T[j],ox=(a.w+b.w)/2+4-Math.abs(a.x-b.x),oy=(a.h+b.h)/2+4-Math.abs(a.y-b.y);if(ox>0&&oy>0){if(ox<oy){var s=a.x<b.x?-1:1;a.x+=s*ox/2;b.x-=s*ox/2;var tv=a.vx;a.vx=a.vx*.6+b.vx*.4;b.vx=b.vx*.6+tv*.4}else{var s2=a.y<b.y?-1:1;a.y+=s2*oy/2;b.y-=s2*oy/2;var tw=a.vy;a.vy=a.vy*.6+b.vy*.4;b.vy=b.vy*.6+tw*.4}}}
 T.forEach(function(a){a.x+=a.vx;a.y+=a.vy;var tr=Math.max(-25,Math.min(25,a.vx*2.4));a.r+=(tr-a.r)*.2;a.el.style.transform='translate('+(a.x-a.w/2).toFixed(1)+'px,'+(a.y-a.h/2).toFixed(1)+'px) rotate('+a.r.toFixed(1)+'deg)'});spd*=.9;
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
var lx=0,ly=0;root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;spd=Math.max(spd,Math.hypot(x-lx,y-ly));lx=x;ly=y;px=x;py=y;inside=true});root.addEventListener('pointerleave',function(){inside=false;px=py=-999});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
layout();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout()});addEventListener('resize',layout);go();})();`},

{id:'s-flip-filter',title:'Flip filter grid',component:'Flip filter grid',key:'flip-filter',family,width:780,
 description:'A filterable product grid where category changes fly every card to its new place and a toggle swaps grid and list without losing your place.',
 prompt:'Build a product grid with twelve cards (generated artwork, a name and a price) in four categories (Bags, Shoes, Jackets, Hats), category filter chips (All, Bags, Shoes, Jackets, Hats; aria-pressed) and a Grid/List toggle (aria-pressed). Use the FLIP technique with the Web Animations API: when a chip is chosen, first fade and shrink the cards that will leave (0.18s) and set them hidden; record the first rectangle of every remaining card, update the layout, record the last rectangles and animate each persisting card with transform from translate(first - last) to none over 0.6s cubic-bezier(.3,.9,.2,1) with a delay proportional to its travel distance (up to 0.2s, farther cards move later); cards that newly appear scale and fade in with a short delay. Toggling between grid (auto-fill columns of 170px) and list (single column rows with a thumbnail on the left) uses the same FLIP for position and a quick crossfade of the card\'s inner content, so cards never jump. Show the visible count in an aria-live region. Reduced motion skips animation. Vanilla HTML, CSS and JavaScript.',
 css:`.ff{display:grid;gap:16px;padding:20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ff-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
.ff-chips,.ff-view{display:flex;gap:6px;flex-wrap:wrap}
.ff-chip,.ff-v{padding:7px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600;color:inherit}
.ff-chip[aria-pressed=true],.ff-v[aria-pressed=true]{border-color:var(--sc-accent);background:var(--sc-ring)}
.ff-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;min-height:330px;align-content:start}
.ff-card{display:block;border:1px solid var(--sc-line);border-radius:18px;background:var(--sc-bg);overflow:hidden}
.ff-card[hidden]{display:none}
.ff-pic{display:block;aspect-ratio:4/3;background-size:cover;background-position:center}
.ff-txt{display:block;padding:10px 12px}
.ff-txt b{display:block;font-size:14px}.ff-txt span{display:block;margin-top:2px;font-size:13px;color:var(--sc-muted)}
.ff-grid.list{grid-template-columns:1fr;gap:8px}
.ff-grid.list .ff-card{display:flex;align-items:center;gap:12px}
.ff-grid.list .ff-card[hidden]{display:none}
.ff-grid.list .ff-pic{width:92px;flex:none;aspect-ratio:4/3}
.ff-count{margin:0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sc-muted)}`,
 html:`<div class="ff"><div class="ff-bar"><div class="ff-chips" role="group" aria-label="Category"></div><div class="ff-view" role="group" aria-label="Layout"><button class="ff-v" type="button" data-v="grid" aria-pressed="true">Grid</button><button class="ff-v" type="button" data-v="list" aria-pressed="false">List</button></div></div><div class="ff-grid"></div><p class="ff-count" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ff'),chips=root.querySelector('.ff-chips'),grid=root.querySelector('.ff-grid'),count=root.querySelector('.ff-count'),vbtns=root.querySelectorAll('.ff-v');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cats=['All','Bags','Shoes','Jackets','Hats'],items=[['Field tote','Bags',64,2],['Studio sling','Bags',82,5],['Weekend duffel','Bags',120,1],['Trail runner','Shoes',110,6],['Court low','Shoes',95,4],['Canvas mid','Shoes',78,7],['Shell jacket','Jackets',180,3],['Wool overcoat','Jackets',260,0],['Quilted vest','Jackets',140,2],['Bucket hat','Hats',38,5],['Dad cap','Hats',29,1],['Wool beanie','Hats',34,6]],cards=[],cat='All',view='grid',busy=false,btns=[];
items.forEach(function(it){var c=document.createElement('article');c.className='ff-card';var p=document.createElement('i');p.className='ff-pic';p.style.backgroundImage='url('+artURL(it[3],240,180)+')';var t=document.createElement('span');t.className='ff-txt';var b=document.createElement('b');b.textContent=it[0];var s=document.createElement('span');s.textContent=it[1]+' \\u00b7 $'+it[2];t.appendChild(b);t.appendChild(s);c.appendChild(p);c.appendChild(t);grid.appendChild(c);cards.push({el:c,cat:it[1]})});
cats.forEach(function(n){var b=document.createElement('button');b.type='button';b.className='ff-chip';b.textContent=n;b.setAttribute('aria-pressed',String(n==='All'));b.addEventListener('click',function(){if(busy||n===cat)return;cat=n;btns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});update(false)});chips.appendChild(b);btns.push(b)});
vbtns.forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-v');if(busy||v===view)return;view=v;vbtns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});update(true)})});
function vis(c){return cat==='All'||c.cat===cat}
function update(layoutOnly){busy=true;var leaving=cards.filter(function(c){return !c.el.hidden&&!vis(c)}),entering=cards.filter(function(c){return c.el.hidden&&vis(c)});
 var run=function(){var stay=cards.filter(function(c){return !c.el.hidden&&vis(c)}),first=stay.map(function(c){return c.el.getBoundingClientRect()});
  leaving.forEach(function(c){c.el.hidden=true;c.el.style.opacity='';c.el.style.transform=''});entering.forEach(function(c){c.el.hidden=false});grid.classList.toggle('list',view==='list');
  stay.forEach(function(c,i){var l=c.el.getBoundingClientRect(),f=first[i],dx=f.left-l.left,dy=f.top-l.top,dist=Math.hypot(dx,dy);if(reduce||(!dx&&!dy))return;c.el.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:600,delay:Math.min(200,dist/3),easing:'cubic-bezier(.3,.9,.2,1)',fill:'backwards'});if(layoutOnly)c.el.animate([{opacity:.3},{opacity:1}],{duration:400,delay:Math.min(200,dist/3)})});
  entering.forEach(function(c,i){if(!reduce)c.el.animate([{opacity:0,transform:'scale(.9)'},{opacity:1,transform:'none'}],{duration:450,delay:150+i*40,easing:'cubic-bezier(.3,.9,.2,1)',fill:'backwards'})});
  var n=cards.filter(function(c){return !c.el.hidden}).length;count.textContent=n+' products';setTimeout(function(){busy=false},reduce?0:700)};
 if(!leaving.length||reduce){run()}else{leaving.forEach(function(c){c.el.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.9)'}],{duration:180,fill:'forwards'})});setTimeout(run,190)}}
count.textContent=items.length+' products';
var n=0,seq=[['Shoes','grid'],['Shoes','list'],['All','list'],['Hats','grid'],['All','grid']];function auto(){if(root.matches(':hover')||root.contains(document.activeElement)||busy)return;var s=seq[n++%seq.length];if(s[0]!==cat){cat=s[0];btns.forEach(function(x){x.setAttribute('aria-pressed',String(x.textContent===cat))});update(false)}else if(s[1]!==view){view=s[1];vbtns.forEach(function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-v')===view))});update(true)}}
var ai=setInterval(auto,2600);root.addEventListener('pointerenter',function(){clearInterval(ai)});})();`},

{id:'s-pricing-roll',title:'Rolling pricing',component:'Rolling pricing',key:'pricing-roll',family,width:780,
 description:'A pricing section with a monthly/yearly switch: every price rolls digit by digit, a savings chip pops in and plan names shimmer.',
 prompt:'Build a three-plan pricing section (Starter, Studio, Scale) with a monthly/yearly switch (a real button with role="switch" and aria-checked, labelled Monthly and Yearly with the active label highlighted). Monthly prices are $12, $29 and $79; yearly prices (per month) are 20% lower and rounded ($10, $23, $63) with a line "billed $120 yearly" (price * 12). Prices are drawn as slots of single characters inside overflow-hidden boxes: when the switch flips, each changed digit rolls to its new value (the old digit slides up and out, the new one rises from below when the price goes up, and the opposite when it goes down) with a stagger of 70ms per plan and 40ms per digit. A "Save 20%" chip next to the switch pops in with a spring scale (0 to 1.15 to 1) when yearly is chosen and pops out when monthly. Each plan name carries a constant shimmer: a bright band travelling across the text through background-clip: text and an animated background-position. The middle plan is highlighted with an accent border and a "Popular" tag. Each plan has three feature rows with check icons and a button. Announce price changes in an aria-live region. Reduced motion swaps values without rolling or shimmer. Vanilla HTML, CSS and JavaScript.',
 css:`.pc3{display:grid;gap:22px;padding:26px 22px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.pc3-top{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
.pc3-lab{font-size:14px;font-weight:700;color:var(--sc-muted);transition:color .2s}
.pc3-lab.on{color:var(--sc-fg)}
.pc3-sw{position:relative;width:56px;height:30px;padding:0;border:0;border-radius:999px;background:var(--sc-line);cursor:pointer;transition:background .3s}
.pc3-sw[aria-checked=true]{background:var(--sc-accent)}
.pc3-sw i{position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.3);transition:transform .45s cubic-bezier(.34,1.7,.5,1)}
.pc3-sw[aria-checked=true] i{transform:translateX(26px)}
.pc3-chip{padding:5px 11px;border-radius:999px;background:var(--sc-ring);color:var(--sc-accent);font:800 12px/1 system-ui;transform:scale(0);transition:transform .5s cubic-bezier(.34,1.8,.5,1)}
.pc3-chip.on{transform:scale(1)}
.pc3-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.pc3-plan{position:relative;display:grid;gap:8px;padding:20px;border:1px solid var(--sc-line);border-radius:22px;background:var(--sc-bg)}
.pc3-plan.pop{border-color:var(--sc-accent);box-shadow:0 18px 34px -20px var(--sc-accent)}
.pc3-tag{position:absolute;right:14px;top:14px;padding:4px 9px;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);font:800 10px/1 system-ui;letter-spacing:.08em;text-transform:uppercase}
.pc3-name{width:fit-content;margin:0;font:900 20px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(100deg,var(--sc-fg) 30%,var(--sc-accent) 45%,#ff7ac8 52%,var(--sc-fg) 66%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pc3-sh 3.4s linear infinite}
.pc3-price{display:flex;align-items:baseline;font:900 44px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.pc3-price small{margin-left:4px;font:600 14px/1 system-ui;letter-spacing:0;color:var(--sc-muted)}
.pc3-slot{position:relative;display:inline-block;height:1.05em;overflow:hidden}
.pc3-slot.d{width:.58em}.pc3-slot.s{width:.5em}
.pc3-slot span{position:absolute;left:0;right:0;top:0;text-align:center;transition:transform .45s cubic-bezier(.3,.9,.3,1),opacity .45s}
.pc3-bill{margin:0;min-height:1.2em;font-size:12px;color:var(--sc-muted)}
.pc3-plan ul{margin:6px 0 4px;padding:0;list-style:none;display:grid;gap:8px;font-size:14px}
.pc3-plan li{display:flex;gap:8px;align-items:center}
.pc3-plan li svg{flex:none;width:16px;height:16px;padding:2px;border-radius:50%;background:var(--sc-ring);fill:none;stroke:var(--sc-accent);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.pc3-btn{padding:11px;border:1px solid var(--sc-line);border-radius:12px;background:var(--sc-surface);color:inherit;cursor:pointer;font-weight:700;font-size:14px}
.pc3-plan.pop .pc3-btn{background:var(--sc-accent);color:var(--sc-accent-fg);border-color:transparent}
.pc3-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@keyframes pc3-sh{to{background-position:-250% 0}}
@media (prefers-reduced-motion:reduce){.pc3-name{animation:none;background:none;color:var(--sc-fg)}.pc3-slot span,.pc3-chip,.pc3-sw i{transition:none}}`,
 html:`<div class="pc3"><div class="pc3-top"><span class="pc3-lab on" data-l="m">Monthly</span><button class="pc3-sw" type="button" role="switch" aria-checked="false" aria-label="Bill yearly"><i></i></button><span class="pc3-lab" data-l="y">Yearly</span><span class="pc3-chip">Save 20%</span></div><div class="pc3-grid"></div><p class="pc3-live" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pc3'),sw=root.querySelector('.pc3-sw'),chip=root.querySelector('.pc3-chip'),grid=root.querySelector('.pc3-grid'),live=root.querySelector('.pc3-live'),labs=root.querySelectorAll('.pc3-lab');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,plans=[['Starter',12,['3 projects','Basic analytics','Email support']],['Studio',29,['Unlimited projects','Shared libraries','Priority support']],['Scale',79,['Everything in Studio','SSO and audit logs','Dedicated manager']]],yearly=false,P=[];
function price(i,y){var m=plans[i][1];return y?Math.round(m*.8):m}
function slot(ch){var s=document.createElement('span');s.className='pc3-slot '+(ch==='$'?'s':'d');var c=document.createElement('span');c.textContent=ch;s.appendChild(c);return s}
function setPrice(el,str,dir,delay){var slots=el.querySelectorAll('.pc3-slot');if(slots.length!==str.length){el.querySelectorAll('.pc3-slot').forEach(function(s){s.remove()});for(var i=0;i<str.length;i++)el.insertBefore(slot(str.charAt(i)),el.querySelector('small'));return}
 slots.forEach(function(s,j){var cur=s.lastElementChild;if(cur.textContent===str.charAt(j))return;if(reduce){cur.textContent=str.charAt(j);return}var n=document.createElement('span');n.textContent=str.charAt(j);n.style.transition='none';n.style.transform='translateY('+(dir>0?'100%':'-100%')+')';n.style.opacity=0;s.appendChild(n);void n.offsetWidth;var d=(delay+j*40)+'ms';n.style.transition='';n.style.transitionDelay=d;cur.style.transitionDelay=d;cur.style.transform='translateY('+(dir>0?'-100%':'100%')+')';cur.style.opacity=0;setTimeout(function(){cur.remove()},delay+j*40+500);n.style.transform='none';n.style.opacity=1})}
plans.forEach(function(pl,i){var d=document.createElement('div');d.className='pc3-plan'+(i===1?' pop':'');if(i===1){var t=document.createElement('span');t.className='pc3-tag';t.textContent='Popular';d.appendChild(t)}
 var h=document.createElement('h3');h.className='pc3-name';h.textContent=pl[0];var pr=document.createElement('div');pr.className='pc3-price';pr.setAttribute('aria-hidden','true');var sm=document.createElement('small');sm.textContent='/ month';pr.appendChild(sm);var bill=document.createElement('p');bill.className='pc3-bill';var ul=document.createElement('ul');pl[2].forEach(function(f){var li=document.createElement('li');var sp=document.createElement('span');sp.textContent=f;li.appendChild(document.createElementNS('http://www.w3.org/2000/svg','svg'));var svg=li.firstChild;svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');var pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d','M5 12.5l4.5 4.5L19 7.5');svg.appendChild(pa);li.appendChild(sp);ul.appendChild(li)});
 var b=document.createElement('button');b.type='button';b.className='pc3-btn';b.textContent='Choose '+pl[0];d.appendChild(h);d.appendChild(pr);d.appendChild(bill);d.appendChild(ul);d.appendChild(b);grid.appendChild(d);P.push({pr:pr,bill:bill});setPrice(pr,'$'+price(i,false),1,0);bill.textContent=' '})
function apply(y,animate){var dir=y?-1:1;P.forEach(function(p,i){var n=price(i,y);setPrice(p.pr,'$'+n,dir,animate?i*70:0);p.bill.textContent=y?'billed $'+(n*12)+' yearly':' '});chip.classList.toggle('on',y);labs.forEach(function(l){l.classList.toggle('on',(l.getAttribute('data-l')==='y')===y)});sw.setAttribute('aria-checked',String(y));live.textContent=(y?'Yearly':'Monthly')+' prices: '+plans.map(function(p,i){return p[0]+' $'+price(i,y)+' per month'}).join(', ')}
sw.addEventListener('click',function(){yearly=!yearly;apply(yearly,true);clearInterval(ai)});labs.forEach(function(l){l.addEventListener('click',function(){yearly=l.getAttribute('data-l')==='y';apply(yearly,true);clearInterval(ai)})});
apply(false,false);var ai=setInterval(function(){yearly=!yearly;apply(yearly,true)},3200);root.addEventListener('pointerenter',function(){clearInterval(ai)});})();`},

{id:'s-brand-footer',title:'Brand footer',component:'Brand footer',key:'brand-footer',family,width:760,
 description:'A drop-in footer with a glow rising off the bottom edge and a giant brand name that scales to fill the width, fading up as you scroll to it.',
 prompt:'Create a footer section that reveals at the end of a scrolling page. Inside a scroll container put a couple of tall content blocks followed by the footer. The footer has a radial accent glow rising from its bottom edge, a giant brand name (LUMEN&CO) whose font-size is computed so the word exactly fills the footer width (measure at 100px, then scale to the available width minus padding, re-run on resize and after fonts load) with a gradient fill that fades towards the bottom, and four link columns (Product, Company, Resources, Social) of real links whose underline slides in from the left on hover and out to the right on leave (a pseudo-element with transform scaleX and transform-origin switching). Footer elements fade and rise (opacity 0 to 1, translateY 24px to 0, staggered by column) according to how much of the footer is visible, computed from scroll position each frame; the glow intensity follows the same value. The container auto-scrolls to the end and back until the visitor scrolls, reduced motion shows the finished footer with manual scrolling. Vanilla HTML, CSS and JavaScript.',
 css:`.bf2{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
.bf2-blk{height:300px;margin:18px;border-radius:22px;display:grid;place-items:center;font:800 28px/1 system-ui;color:#fff;background:linear-gradient(135deg,hsl(var(--h) 80% 58%),hsl(calc(var(--h) + 40) 80% 42%))}
.bf2-f{position:relative;margin-top:30px;padding:60px 28px 20px;overflow:hidden;background:#0a0a10;color:#fff;border-radius:22px 22px 0 0}
.bf2-glow{position:absolute;left:-10%;right:-10%;bottom:-70%;height:140%;background:radial-gradient(ellipse at 50% 100%,hsl(262 90% 60%),hsl(300 85% 50%) 28%,transparent 62%);opacity:var(--g,0);pointer-events:none}
.bf2-cols{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:34px}
.bf2-col{opacity:var(--o,0);transform:translateY(calc((1 - var(--o,0))*24px))}
.bf2-col h4{margin:0 0 12px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#a29fc4}
.bf2-col a{position:relative;display:block;width:fit-content;margin-bottom:8px;color:#fff;text-decoration:none;font-size:15px}
.bf2-col a::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .4s cubic-bezier(.3,.9,.3,1)}
.bf2-col a:hover::after,.bf2-col a:focus-visible::after{transform:scaleX(1);transform-origin:0 50%}
.bf2-brand{position:relative;display:block;margin:0;white-space:nowrap;font-weight:900;letter-spacing:-.05em;line-height:.8;background:linear-gradient(#fff 20%,rgba(255,255,255,.18));-webkit-background-clip:text;background-clip:text;color:transparent;opacity:var(--b,0);transform:translateY(calc((1 - var(--b,0))*30px))}
.bf2-copy{position:relative;margin:14px 0 0;font-size:12px;color:#8d8aa8}
@media (max-width:560px){.bf2-cols{grid-template-columns:1fr 1fr}}`,
 html:`<div class="bf2" tabindex="0" role="region" aria-label="Page with footer"><div class="bf2-blk" style="--h:262">Your page content</div><div class="bf2-blk" style="--h:190">More content</div><footer class="bf2-f"><i class="bf2-glow"></i><div class="bf2-cols"></div><p class="bf2-brand" aria-label="Lumen and Co">LUMEN&amp;CO</p><p class="bf2-copy">© 2026 Lumen &amp; Co. All rights reserved.</p></footer></div>`,
 js:`(function(){var box=document.currentScript.previousElementSibling.querySelector('.bf2'),f=box.querySelector('.bf2-f'),glow=box.querySelector('.bf2-glow'),cols=box.querySelector('.bf2-cols'),brand=box.querySelector('.bf2-brand');
${SB}
var data=[['Product',['Overview','Features','Pricing','Changelog']],['Company',['About','Careers','Press','Contact']],['Resources',['Guides','Templates','Community','Support']],['Social',['Instagram','LinkedIn','YouTube','Dribbble']]],C=[];
data.forEach(function(d){var c=document.createElement('div');c.className='bf2-col';var h=document.createElement('h4');h.textContent=d[0];c.appendChild(h);d[1].forEach(function(t){var a=document.createElement('a');a.href='#';a.textContent=t;a.addEventListener('click',function(e){e.preventDefault()});c.appendChild(a)});cols.appendChild(c);C.push(c)});
function fit(){brand.style.fontSize='100px';var w=brand.scrollWidth||brand.getBoundingClientRect().width,avail=f.clientWidth-56;brand.style.fontSize=(100*avail/w).toFixed(1)+'px'}
fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);addEventListener('resize',fit);
ScrollDemo(box,function(p,st){var r=f.getBoundingClientRect(),b=box.getBoundingClientRect(),vis=Math.max(0,Math.min(1,(b.bottom-r.top)/f.offsetHeight));glow.style.setProperty('--g',(vis*.9).toFixed(3));C.forEach(function(c,i){c.style.setProperty('--o',Math.max(0,Math.min(1,vis*1.6-.15-i*.1)).toFixed(3))});brand.style.setProperty('--b',Math.max(0,Math.min(1,vis*1.4-.2)).toFixed(3))},{speed:.1});})();`}
];
