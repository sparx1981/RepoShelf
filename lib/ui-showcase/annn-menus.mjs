// Original buttons, steppers and navigation menus. Plain HTML, CSS and JavaScript; no third-party code.
import {ART} from './art-boot.mjs';
const family='Menus & buttons';
export const annnMenus=[
{id:'s-fill-buttons',title:'Fill and jelly buttons',component:'Fill and jelly buttons',key:'fill-buttons',family,width:760,
 description:'Three hover buttons: a fill that grows from wherever the cursor lands, a curved wave from the side you came in, and a jelly button that squashes and pokes.',
 prompt:'Make a row of three buttons that respond to where and how the pointer arrives. (1) Circle fill: on pointerenter measure the entry point inside the button and place an absolutely positioned circle there (diameter twice the distance to the farthest corner) that scales from 0 to 1 in 0.55s cubic-bezier(.3,.8,.2,1), so the fill always takes the same time wherever you come in; on leave it shrinks back towards the exit point; the label colour swaps with a short delay. (2) Curve fill: work out which side the pointer entered from (largest normalised offset from the centre), and slide a 240% ellipse with a curved leading edge in from that side to cover the button; on leave it rolls back out through the side the pointer left by. (3) Jelly: a real spring simulation (stiffness 0.22, damping 0.82) in requestAnimationFrame with scale x/y and a small translate; pressing squashes it to (1.14, 0.84), releasing lets it wobble back, and entering from a side gives it a poke in that direction. All three are real buttons with visible focus (focus-visible shows the fill state) and reduced motion swaps the colours with no movement. Vanilla HTML, CSS and JavaScript.',
 css:`.fbt{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;padding:22px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.fbt-cell{display:grid;gap:12px;justify-items:center;align-content:center;height:190px;border:1px solid var(--sc-line);border-radius:22px;background:var(--sc-bg)}
.fbt-cell small{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--sc-muted)}
.fbt-b{position:relative;overflow:hidden;padding:15px 30px;border:2px solid var(--sc-fg);border-radius:999px;background:transparent;color:var(--sc-fg);cursor:pointer;font:700 16px/1 system-ui,-apple-system,"Segoe UI",sans-serif;isolation:isolate}
.fbt-b span{position:relative;z-index:2;transition:color .3s .08s}
.fbt-fill{position:absolute;z-index:1;border-radius:50%;background:var(--sc-fg);transform:translate(-50%,-50%) scale(0);transition:transform .55s cubic-bezier(.3,.8,.2,1);pointer-events:none}
.fbt-b.is-on .fbt-fill{transform:translate(-50%,-50%) scale(1)}
.fbt-b.is-on span{color:var(--sc-bg)}
.fbt-wave{position:absolute;z-index:1;left:-60%;top:-60%;width:220%;height:220%;border-radius:50%;background:var(--sc-accent);transform:translate(var(--tx,-100%),var(--ty,0));transition:transform .6s cubic-bezier(.3,.8,.2,1);pointer-events:none}
.fbt-b.wave{border-color:var(--sc-accent)}
.fbt-b.wave.is-on .fbt-wave{transform:translate(0,0)}
.fbt-b.wave.is-on span{color:var(--sc-accent-fg)}
.fbt-jelly{border-color:transparent;background:var(--sc-accent);color:var(--sc-accent-fg);will-change:transform}
.fbt-jelly span{transition:none}
.fbt-b:focus-visible{outline:2px solid var(--sc-accent);outline-offset:4px}
@media (prefers-reduced-motion:reduce){.fbt-fill,.fbt-wave{transition:none}}`,
 html:`<div class="fbt"><div class="fbt-cell"><button class="fbt-b circ" type="button"><i class="fbt-fill"></i><span>Start a project</span></button><small>Circle fill</small></div><div class="fbt-cell"><button class="fbt-b wave" type="button"><i class="fbt-wave"></i><span>See our work</span></button><small>Curve fill</small></div><div class="fbt-cell"><button class="fbt-b fbt-jelly" type="button"><span>Add to bag</span></button><small>Jelly</small></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.fbt'),circ=root.querySelector('.circ'),wave=root.querySelector('.wave'),jel=root.querySelector('.fbt-jelly'),fill=circ.querySelector('.fbt-fill'),wv=wave.querySelector('.fbt-wave');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function pt(b,e){var r=b.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height}}
function fillAt(p){var d=Math.max(Math.hypot(p.x,p.y),Math.hypot(p.w-p.x,p.y),Math.hypot(p.x,p.h-p.y),Math.hypot(p.w-p.x,p.h-p.y))*2;fill.style.width=fill.style.height=d+'px';fill.style.left=p.x+'px';fill.style.top=p.y+'px'}
circ.addEventListener('pointerenter',function(e){var p=pt(circ,e);fill.style.transition='none';fillAt(p);void fill.offsetWidth;fill.style.transition='';circ.classList.add('is-on')});
circ.addEventListener('pointerleave',function(e){var p=pt(circ,e);fill.style.left=Math.max(0,Math.min(p.w,p.x))+'px';fill.style.top=Math.max(0,Math.min(p.h,p.y))+'px';circ.classList.remove('is-on')});
circ.addEventListener('focus',function(){fill.style.transition='none';fillAt({x:circ.offsetWidth/2,y:circ.offsetHeight/2,w:circ.offsetWidth,h:circ.offsetHeight});void fill.offsetWidth;fill.style.transition='';circ.classList.add('is-on')});circ.addEventListener('blur',function(){circ.classList.remove('is-on')});
function side(b,e){var p=pt(b,e),nx=(p.x/p.w-.5)*2,ny=(p.y/p.h-.5)*2;return Math.abs(nx*b.offsetWidth)>Math.abs(ny*b.offsetHeight)?[nx<0?-1:1,0]:[0,ny<0?-1:1]}
wave.addEventListener('pointerenter',function(e){var s=side(wave,e);wv.style.transition='none';wv.style.setProperty('--tx',(s[0]*110)+'%');wv.style.setProperty('--ty',(s[1]*110)+'%');void wv.offsetWidth;wv.style.transition='';wave.classList.add('is-on')});
wave.addEventListener('pointerleave',function(e){var s=side(wave,e);wv.style.setProperty('--tx',(s[0]*110)+'%');wv.style.setProperty('--ty',(s[1]*110)+'%');wave.classList.remove('is-on')});
wave.addEventListener('focus',function(){wv.style.setProperty('--tx','0%');wv.style.setProperty('--ty','0%');wave.classList.add('is-on')});wave.addEventListener('blur',function(){wave.classList.remove('is-on')});
var sx=1,sy=1,vx=0,vy=0,tx=0,ty=0,px=0,py=0,tsx=1,tsy=1,raf=0;
function frame(){raf=0;vx+=(tsx-sx)*.22;vx*=.82;sx+=vx;vy+=(tsy-sy)*.22;vy*=.82;sy+=vy;px+=(tx-px)*.3;py+=(ty-py)*.3;tx*=.8;ty*=.8;jel.style.transform='translate('+px.toFixed(2)+'px,'+py.toFixed(2)+'px) scale('+sx.toFixed(3)+','+sy.toFixed(3)+')';if(Math.abs(sx-tsx)>.002||Math.abs(vx)>.002||Math.abs(sy-tsy)>.002||Math.abs(vy)>.002||Math.abs(px)>.05||Math.abs(py)>.05)raf=requestAnimationFrame(frame)}
function kick(){if(!raf&&!reduce)raf=requestAnimationFrame(frame)}
jel.addEventListener('pointerdown',function(){tsx=1.14;tsy=.84;kick()});function rel(){tsx=1;tsy=1;vx+=.04;kick()}jel.addEventListener('pointerup',rel);jel.addEventListener('pointerleave',function(e){if(tsx!==1)rel();var s=side(jel,e);tx=-s[0]*4;ty=-s[1]*4;kick()});
jel.addEventListener('pointerenter',function(e){var s=side(jel,e);vx+=s[0]*.06;vy+=s[1]*.06;tx=s[0]*5;ty=s[1]*5;sx=1+(s[0]?-.06:.05);sy=1+(s[1]?-.1:.05);kick()});
jel.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){tsx=1.14;tsy=.84;kick()}});jel.addEventListener('keyup',function(){rel()});
if(reduce){jel.addEventListener('pointerenter',function(){jel.style.filter='brightness(1.1)'});jel.addEventListener('pointerleave',function(){jel.style.filter=''})}})();`},

{id:'s-pill-stepper',title:'Rolling pill stepper',component:'Rolling pill stepper',key:'pill-stepper',family,width:560,
 description:'A quantity picker in a pill whose digits roll up for more and down for less, with a line total that rolls along; hold to repeat faster.',
 prompt:'Build a quantity stepper for a cart row (a product with a generated thumbnail, a name and a unit price of $48). The stepper is a pill with a minus button, a number slot and a plus button; the line total sits to its right. Numbers are drawn as slots of single characters in overflow-hidden boxes (height 1.2em): when a character changes, the old one slides out (up when the value went up, down when it went down) while the new one slides in from the opposite side (0.35s cubic-bezier(.3,.9,.3,1)); unchanged characters stay put. The total is formatted as $ with thousands separators, rebuilt if the number of characters changes. Pressing and holding a button repeats: first step immediately, then after 400ms repeat every 140ms, accelerating to 60ms after eight steps; releasing or leaving stops it. Limits are 0 to 99 and the buttons disable at the limits (aria-disabled). Announce the quantity and total in a visually hidden aria-live region. Buttons are real buttons with aria-labels; arrow keys on the focused number group also step. Reduced motion swaps characters without sliding. Vanilla HTML, CSS and JavaScript.',
 css:`.st2{display:grid;place-items:center;min-height:240px;padding:30px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.st2-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;padding:14px 18px;border:1px solid var(--sc-line);border-radius:24px;background:var(--sc-bg)}
.st2-th{flex:none;width:64px;height:64px;border-radius:16px;background-size:cover;background-position:center}
.st2-nm{min-width:110px}.st2-nm strong{display:block;font-size:16px}.st2-nm span{font-size:13px;color:var(--sc-muted)}
.st2-pill{display:flex;align-items:center;gap:2px;padding:4px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-surface)}
.st2-b{width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;font:600 22px/1 system-ui;transition:background .2s,transform .15s}
.st2-b:hover{background:var(--sc-line)}.st2-b:active{transform:scale(.9)}
.st2-b[aria-disabled=true]{opacity:.35;cursor:default}
.st2-num{display:inline-flex;min-width:2.4ch;justify-content:center;font:800 20px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace}
.st2-slot{position:relative;display:inline-block;height:1.2em;overflow:hidden;width:1ch}
.st2-slot span{position:absolute;left:0;right:0;top:0;text-align:center;transition:transform .35s cubic-bezier(.3,.9,.3,1),opacity .35s}
.st2-tot{min-width:4.2em;text-align:right;font:800 22px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:flex-end}
.st2-tot .st2-slot{width:.62em}.st2-tot .st2-slot.p{width:.62em}.st2-tot .st2-slot.c{width:.3em}
.st2-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (prefers-reduced-motion:reduce){.st2-slot span{transition:none}}`,
 html:`<div class="st2"><div class="st2-row"><span class="st2-th"></span><div class="st2-nm"><strong>Linen shirt</strong><span>$48 each</span></div><div class="st2-pill" role="group" aria-label="Quantity"><button class="st2-b" type="button" data-d="-1" aria-label="Decrease quantity">&minus;</button><span class="st2-num" aria-hidden="true"></span><button class="st2-b" type="button" data-d="1" aria-label="Increase quantity">+</button></div><div class="st2-tot" aria-hidden="true"></div><span class="st2-live" aria-live="polite"></span></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.st2'),th=root.querySelector('.st2-th'),numEl=root.querySelector('.st2-num'),totEl=root.querySelector('.st2-tot'),live=root.querySelector('.st2-live'),btns=root.querySelectorAll('.st2-b');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,qty=2,PRICE=48,hold=0,rep=0,steps=0;th.style.backgroundImage='url('+artURL(2,128,128)+')';
function fmtMoney(n){return '$'+String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')}
function slot(ch,cls){var s=document.createElement('span');s.className='st2-slot'+(cls?' '+cls:'');var c=document.createElement('span');c.textContent=ch;s.appendChild(c);return s}
function setText(el,str,dir){var slots=el.children;if(slots.length!==str.length){el.textContent='';for(var i=0;i<str.length;i++)el.appendChild(slot(str.charAt(i),str.charAt(i)==='$'?'p':str.charAt(i)===','?'c':''));return}
 for(var j=0;j<str.length;j++){var s=slots[j],cur=s.lastElementChild;if(cur.textContent===str.charAt(j))continue;if(reduce){cur.textContent=str.charAt(j);continue}var n=document.createElement('span');n.textContent=str.charAt(j);n.style.transform='translateY('+(dir>0?'100%':'-100%')+')';n.style.opacity=0;s.appendChild(n);void n.offsetWidth;cur.style.transform='translateY('+(dir>0?'-100%':'100%')+')';cur.style.opacity=0;(function(c){setTimeout(function(){c.remove()},380)})(cur);n.style.transform='none';n.style.opacity=1}}
function render(dir){setText(numEl,String(qty),dir);setText(totEl,fmtMoney(qty*PRICE),dir);btns[0].setAttribute('aria-disabled',String(qty<=0));btns[1].setAttribute('aria-disabled',String(qty>=99));live.textContent='Quantity '+qty+', total '+fmtMoney(qty*PRICE)}
function step(d){var n=Math.max(0,Math.min(99,qty+d));if(n===qty)return false;qty=n;render(d);return true}
function stop(){clearTimeout(hold);clearTimeout(rep);steps=0}
btns.forEach(function(b){var d=+b.getAttribute('data-d');function loop(){if(!step(d))return;steps++;rep=setTimeout(loop,steps>8?60:140)}
 b.addEventListener('pointerdown',function(e){e.preventDefault();stop();if(!step(d))return;hold=setTimeout(loop,400)});b.addEventListener('pointerup',stop);b.addEventListener('pointerleave',stop);b.addEventListener('pointercancel',stop);
 b.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();step(d)}})});
render(1);var auto=0,dirs=[1,1,1,-1,-1,1,-1,-1];function tick(){if(root.matches(':hover')||root.contains(document.activeElement))return;step(dirs[auto++%dirs.length])}var ai=setInterval(tick,1300);root.addEventListener('pointerenter',function(){clearInterval(ai)});})();`},

{id:'s-mega-menu',title:'Mega menu',component:'Mega menu',key:'mega-menu',family,width:760,
 description:'One dropdown that grows, shrinks and slides to fit each menu group as you move along the bar, with a short intent delay.',
 prompt:'Build a navigation bar with four groups (Products, Solutions, Resources, Company) and one shared dropdown panel. Triggers are real buttons (aria-expanded, aria-controls). Hovering or focusing a trigger waits 90ms (hover intent) and opens the panel; the panel is a single absolutely positioned element below the bar whose left, width and height are set from the active group\'s measured content and whose left edge follows the trigger (clamped inside the bar), transitioning over 0.4s cubic-bezier(.3,.9,.3,1). Each group\'s content (two or three link columns with a small coloured icon, a title and a one-line description, plus a featured card with a generated image for Products) is absolutely stacked inside the panel; when you move between groups the old content fades and slides 24px away in the direction of travel while the new content slides in from the other side. Leaving the whole nav closes the panel after 140ms; Escape closes it and returns focus to the trigger; ArrowLeft/ArrowRight move between triggers and ArrowDown moves into the panel links. Below 560px of container width (container query) the panel becomes a normal accordion block under the bar. Reduced motion removes transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.mg{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;container-type:inline-size}
.mg-bar{position:relative;z-index:6;display:flex;align-items:center;gap:4px;margin:16px;padding:6px;border:1px solid var(--sc-line);border-radius:18px;background:var(--sc-bg)}
.mg-logo{margin:0 12px 0 10px;font:900 18px/1 system-ui;letter-spacing:-.03em}
.mg-t{padding:10px 16px;border:0;border-radius:12px;background:transparent;color:var(--sc-muted);cursor:pointer;font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;transition:background .2s,color .2s}
.mg-t:hover,.mg-t[aria-expanded=true]{background:var(--sc-surface);color:var(--sc-fg)}
.mg-panel{position:absolute;z-index:5;top:70px;left:16px;width:300px;height:200px;border:1px solid var(--sc-line);border-radius:20px;background:var(--sc-bg);box-shadow:0 30px 50px -24px rgba(0,0,0,.4);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(-8px);transition:left .4s cubic-bezier(.3,.9,.3,1),width .4s cubic-bezier(.3,.9,.3,1),height .4s cubic-bezier(.3,.9,.3,1),opacity .2s,transform .3s,visibility 0s .3s}
.mg-panel.open{opacity:1;visibility:visible;transform:none;transition:left .4s cubic-bezier(.3,.9,.3,1),width .4s cubic-bezier(.3,.9,.3,1),height .4s cubic-bezier(.3,.9,.3,1),opacity .2s,transform .3s,visibility 0s}
.mg-c{position:absolute;left:0;top:0;padding:18px;display:flex;gap:18px;opacity:0;pointer-events:none;transition:opacity .25s,transform .4s cubic-bezier(.3,.9,.3,1)}
.mg-c.on{opacity:1;pointer-events:auto}
.mg-col{display:grid;gap:4px;align-content:start;min-width:170px}
.mg-col h4{margin:0 0 6px 10px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--sc-muted)}
.mg-a{display:flex;gap:12px;padding:9px 10px;border-radius:12px;color:inherit;text-decoration:none}
.mg-a:hover,.mg-a:focus-visible{background:var(--sc-surface)}
.mg-ic{flex:none;width:34px;height:34px;border-radius:10px;background:hsl(var(--h) 80% 62%)}
.mg-a strong{display:block;font-size:14px;line-height:1.2}.mg-a span{display:block;margin-top:2px;font-size:12px;color:var(--sc-muted);line-height:1.3}
.mg-feat{width:170px;border-radius:14px;background-size:cover;background-position:center;position:relative;min-height:170px}
.mg-feat b{position:absolute;left:12px;bottom:12px;right:12px;color:#fff;font:800 15px/1.15 system-ui;text-shadow:0 1px 8px rgba(0,0,0,.5)}
@container (max-width:560px){.mg-panel{position:static;margin:0 16px;width:auto!important;height:auto!important}.mg-c{position:static;flex-direction:column;display:none}.mg-c.on{display:flex}}
@media (prefers-reduced-motion:reduce){.mg-panel,.mg-c{transition:none!important}}`,
 html:`<div class="mg"><nav class="mg-bar" aria-label="Main"><span class="mg-logo">Northline</span></nav><div class="mg-panel" role="region" aria-label="Menu content"></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.mg'),bar=root.querySelector('.mg-bar'),panel=root.querySelector('.mg-panel');
${ART}
var G=[{n:'Products',cols:[['Build',[['Editor','Design in the browser',262],['Components','A shared library',330],['Prototypes','Click-through flows',200]]],['Ship',[['Hosting','Global edge network',150],['Analytics','Product insight',28]]]],feat:['Meet the new editor',2]},{n:'Solutions',cols:[['By team',[['Design','Systems at scale',262],['Engineering','Handoff without friction',200],['Marketing','Launch faster',330]]],['By size',[['Startups','Start free',150],['Enterprise','Security and support',28]]]]},{n:'Resources',cols:[['Learn',[['Guides','Step-by-step tutorials',200],['Templates','Start from a head start',330]],],['Community',[['Events','Meetups and talks',28],['Journal','Stories and news',262]]]]},{n:'Company',cols:[['About',[['Our story','Why we exist',262],['Careers','Open roles',150],['Press','Media kit',330]]]]}];
var T=[],C=[],cur=-1,openT=0,closeT=0,open=false;
G.forEach(function(g,i){var b=document.createElement('button');b.type='button';b.className='mg-t';b.textContent=g.n;b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','mg-c'+i);bar.appendChild(b);T.push(b);
 var c=document.createElement('div');c.className='mg-c';c.id='mg-c'+i;g.cols.forEach(function(col){var d=document.createElement('div');d.className='mg-col';var h=document.createElement('h4');h.textContent=col[0];d.appendChild(h);col[1].forEach(function(l){var a=document.createElement('a');a.className='mg-a';a.href='#';a.tabIndex=-1;a.addEventListener('click',function(e){e.preventDefault()});var ic=document.createElement('i');ic.className='mg-ic';ic.style.setProperty('--h',l[2]);var t=document.createElement('div');var s=document.createElement('strong');s.textContent=l[0];var p=document.createElement('span');p.textContent=l[1];t.appendChild(s);t.appendChild(p);a.appendChild(ic);a.appendChild(t);d.appendChild(a)});c.appendChild(d)});
 if(g.feat){var f=document.createElement('div');f.className='mg-feat';f.style.backgroundImage='url('+artURL(g.feat[1],170,170)+')';var fb=document.createElement('b');fb.textContent=g.feat[0];f.appendChild(fb);c.appendChild(f)}
 panel.appendChild(c);C.push(c);
 b.addEventListener('pointerenter',function(){intent(i)});b.addEventListener('focus',function(){show(i)});b.addEventListener('click',function(){open&&cur===i?hide():show(i)});
 b.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();T[(i+1)%T.length].focus()}if(e.key==='ArrowLeft'){e.preventDefault();T[(i+T.length-1)%T.length].focus()}if(e.key==='ArrowDown'){e.preventDefault();show(i);var a=C[i].querySelector('a');if(a)a.focus()}if(e.key==='Escape')hide()})});
function intent(i){clearTimeout(closeT);clearTimeout(openT);openT=setTimeout(function(){show(i)},open?0:90)}
function show(i){clearTimeout(closeT);var prev=cur;cur=i;open=true;T.forEach(function(t,k){t.setAttribute('aria-expanded',String(k===i))});C.forEach(function(c,k){var on=k===i;c.classList.toggle('on',on);c.querySelectorAll('a').forEach(function(a){a.tabIndex=on?0:-1});var dir=prev<0||prev===i?0:(i>prev?1:-1);if(on){if(dir){c.style.transition='none';c.style.transform='translateX('+(dir*24)+'px)';void c.offsetWidth;c.style.transition=''}c.style.transform='none'}else if(k===prev&&dir){c.style.transform='translateX('+(-dir*24)+'px)'}});
 var c=C[i],w=c.offsetWidth,h=c.offsetHeight,t=T[i],bw=bar.clientWidth,left=Math.max(16,Math.min(root.clientWidth-w-34,bar.offsetLeft+t.offsetLeft+t.offsetWidth/2-w/2));if(root.clientWidth>560){panel.style.left=left+'px';panel.style.width=(w+2)+'px';panel.style.height=(h+2)+'px'}panel.classList.add('open')}
function hide(){clearTimeout(openT);closeT=setTimeout(function(){open=false;panel.classList.remove('open');T.forEach(function(t){t.setAttribute('aria-expanded','false')});C.forEach(function(c){c.classList.remove('on')})},140)}
bar.addEventListener('pointerleave',hide);panel.addEventListener('pointerenter',function(){clearTimeout(closeT)});panel.addEventListener('pointerleave',hide);root.addEventListener('keydown',function(e){if(e.key==='Escape'){hide();if(cur>=0)T[cur].focus()}});
var n=0,auto=setInterval(function(){if(root.matches(':hover')||root.contains(document.activeElement))return;show(n++%4)},2200);root.addEventListener('pointerenter',function(){clearInterval(auto)});show(0);})();`},

{id:'s-slide-menu',title:'Page-turn menu',component:'Page-turn menu',key:'slide-menu',family,width:760,
 description:'A fullscreen menu where the whole page slides, turns and shrinks away as a dark panel arrives, with the image behind swapping per link.',
 prompt:'Create a fullscreen menu transition inside a stage. The page (a hero with a generated landscape background, a big headline and a burger button at the top right) sits above a dark menu layer. Activating the burger (aria-expanded) does three things over 0.75s cubic-bezier(.7,0,.2,1): the page transforms to translateX(-34%) rotate(-4deg) scale(.82) with a larger border radius and a deeper shadow so it appears to turn away like a page, a dark panel slides in from the right (translateX(100%) to 0) covering the right 62% of the stage, and the burger lines flip into an X. The panel holds four large links (Home, Work, About, Journal) that rise in with a stagger of 60ms once the panel is in; hovering or focusing a link crossfades the image area (a 40% wide generated landscape at the right of the panel) to that link\'s picture and nudges the link right by 10px. Close with the X, Escape or by clicking the shrunken page. Links are real anchors that are inert (visibility hidden) when closed. Reduced motion removes transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.sm{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:#0b0b10;overflow:hidden;perspective:1200px}
.sm-page{position:absolute;inset:0;z-index:2;overflow:hidden;background-size:cover;background-position:center;transform-origin:0 50%;transition:transform .75s cubic-bezier(.7,0,.2,1),border-radius .75s,box-shadow .75s;cursor:default}
.sm.open .sm-page{transform:translateX(-12%) rotate(-4deg) scale(.82);border-radius:30px;box-shadow:0 40px 80px -20px rgba(0,0,0,.7);cursor:pointer}
.sm-hero{position:absolute;left:34px;bottom:40px;max-width:420px;color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.sm-hero h2{margin:0;font:900 54px/.98 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.04em}
.sm-hero p{margin:12px 0 0;font-size:16px;opacity:.92}
.sm-burger{position:absolute;right:20px;top:18px;z-index:6;width:48px;height:48px;border:0;border-radius:50%;background:rgba(255,255,255,.22);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer;display:grid;place-content:center;gap:5px}
.sm-burger i{display:block;width:20px;height:2px;border-radius:2px;background:#fff;transition:transform .5s cubic-bezier(.7,0,.2,1)}
.sm.open .sm-burger i:first-child{transform:translateY(3.5px) rotate(45deg)}.sm.open .sm-burger i:last-child{transform:translateY(-3.5px) rotate(-45deg)}
.sm-panel{position:absolute;top:0;right:0;bottom:0;z-index:4;width:62%;background:#101018;transform:translateX(100%);transition:transform .75s cubic-bezier(.7,0,.2,1);display:grid;grid-template-columns:1fr 40%;gap:14px;padding:86px 22px 28px 34px}
.sm.open .sm-panel{transform:none}
.sm-nav{display:grid;align-content:start;gap:6px}
.sm-a{display:block;overflow:hidden;color:#fff;text-decoration:none;font:800 42px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.sm-a span{display:block;transform:translateY(110%);transition:transform .6s cubic-bezier(.3,.9,.3,1),color .25s,padding .3s}
.sm.open .sm-a span{transform:none;transition-delay:calc(.5s + var(--i)*60ms),0s,0s}
.sm-a:hover span,.sm-a:focus-visible span{padding-left:10px;color:hsl(262 90% 78%)}
.sm-img{position:relative;border-radius:18px;overflow:hidden;align-self:end;height:70%}
.sm-img i{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity .45s}
.sm-img i.on{opacity:1}
.sm:not(.open) .sm-panel{visibility:hidden;transition:transform .75s cubic-bezier(.7,0,.2,1),visibility 0s .75s}
@media (prefers-reduced-motion:reduce){.sm-page,.sm-panel,.sm-a span,.sm-burger i,.sm-img i{transition:none}}`,
 html:`<div class="sm"><div class="sm-page"><div class="sm-hero"><h2>Slow light, big skies.</h2><p>A field guide to the hours we love.</p></div></div><button class="sm-burger" type="button" aria-expanded="false" aria-controls="sm-nav" aria-label="Open menu"><i></i><i></i></button><div class="sm-panel"><nav class="sm-nav" id="sm-nav" aria-label="Main"></nav><div class="sm-img" aria-hidden="true"></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sm'),page=root.querySelector('.sm-page'),btn=root.querySelector('.sm-burger'),nav=root.querySelector('.sm-nav'),imgBox=root.querySelector('.sm-img');
${ART}
var links=['Home','Work','About','Journal'],ids=[2,5,1,6],I=[];page.style.backgroundImage='url('+artURL(2,760,430)+')';
links.forEach(function(t,i){var a=document.createElement('a');a.className='sm-a';a.href='#';a.style.setProperty('--i',i);a.tabIndex=-1;var s=document.createElement('span');s.textContent=t;a.appendChild(s);a.addEventListener('click',function(e){e.preventDefault();set(false)});nav.appendChild(a);var im=document.createElement('i');im.style.backgroundImage='url('+artURL(ids[i],240,300)+')';if(!i)im.className='on';imgBox.appendChild(im);I.push(im);
 function sel(){I.forEach(function(x,k){x.classList.toggle('on',k===i)})}a.addEventListener('pointerenter',sel);a.addEventListener('focus',sel)});
function set(o){root.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o));btn.setAttribute('aria-label',o?'Close menu':'Open menu');nav.querySelectorAll('a').forEach(function(a){a.tabIndex=o?0:-1});if(!o)btn.focus()}
btn.addEventListener('click',function(){set(!root.classList.contains('open'))});page.addEventListener('click',function(){if(root.classList.contains('open'))set(false)});root.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('open'))set(false)});
var auto=setInterval(function(){if(!root.matches(':hover')&&!root.contains(document.activeElement)){var o=!root.classList.contains('open');root.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o))}},3800);root.addEventListener('pointerenter',function(){clearInterval(auto)});root.addEventListener('focusin',function(){clearInterval(auto)});})();`}
];
