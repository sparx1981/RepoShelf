// Original DOM and SVG text effects: wave, cubes, split-flap, ring, marquee, neon, vapour and more. No third-party code.
const family='Text effects';
export const textfxMore=[
{id:'s-wave-lettering',title:'Wave lettering',component:'Wave lettering',key:'wave-lettering',family,width:780,
 description:'A travelling sine wave runs through the letters; the pointer sets its height and frequency.',
 prompt:'Build a two-line headline where each letter rides a travelling sine wave. Split the text into word spans (nowrap) and letter spans (inline-block). Every frame set translateY = amplitude * sin(index * frequency - time * speed), rotate = cos(...) * 9deg and a colour hue from violet to pink that follows the wave. The pointer controls the effect: vertical position sets the amplitude (about 10 to 46px) and horizontal position sets the frequency; both ease towards their targets. With no pointer the values drift slowly on their own. Pause off-screen, render the static headline for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.wv{display:grid;place-items:center;min-height:340px;padding:44px 28px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.wv-line{margin:0;text-align:center;font:900 clamp(44px,11.5vw,104px)/1.08 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.045em}
.wv-w{display:inline-block;white-space:nowrap}
.wv-l{display:inline-block;will-change:transform}`,
 html:`<div class="wv"><h2 class="wv-line"></h2></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.wv'),line=root.querySelector('.wv-line'),lines=['Ride the','wave'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],raf=0,visible=true,amp=22,freq=.5,tAmp=22,tFreq=.5,ptr=false;
line.setAttribute('aria-label',lines.join(' '));
lines.forEach(function(txt,li){if(li)line.appendChild(document.createElement('br'));txt.split(' ').forEach(function(word,wi){if(wi)line.appendChild(document.createTextNode(' '));var w=document.createElement('span');w.className='wv-w';w.setAttribute('aria-hidden','true');for(var i=0;i<word.length;i++){var s=document.createElement('span');s.className='wv-l';s.textContent=word.charAt(i);w.appendChild(s);L.push({el:s,i:L.length+li*2})}line.appendChild(w)})});
function frame(now){raf=0;var t=now/1000;if(!ptr){tAmp=26+10*Math.sin(t*.4);tFreq=.5+.18*Math.sin(t*.27)}amp+=(tAmp-amp)*.08;freq+=(tFreq-freq)*.08;
 L.forEach(function(l){var ph=l.i*freq-t*3.2,s=Math.sin(ph),c=Math.cos(ph);l.el.style.transform='translateY('+(s*amp).toFixed(2)+'px) rotate('+(c*9).toFixed(2)+'deg)';l.el.style.color='hsl('+(262+(s*.5+.5)*78).toFixed(0)+',86%,'+(60+s*6).toFixed(0)+'%)'});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
if(reduce)L.forEach(function(l,i){l.el.style.color='hsl('+(262+i*6)+',86%,62%)'});
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();ptr=true;tAmp=10+36*(1-(e.clientY-r.top)/r.height);tFreq=.28+.7*((e.clientX-r.left)/r.width)});
root.addEventListener('pointerleave',function(){ptr=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);go();})();`},

{id:'s-split-flap',title:'Split-flap board',component:'Split-flap board',key:'split-flap',family,width:780,
 description:'An airport-style departures board whose characters flip through the alphabet to their new value.',
 prompt:'Build a split-flap departures board with three rows of 13 character cells. Each cell is built from four halves: a static top (new character), a static bottom (old character), a flipping top (old character, rotateX from 0 to -90deg around its bottom edge) and a flipping bottom (new character, rotateX from 90deg to 0 around its top edge). Cells step through a fixed character set one flip at a time (about 90ms per half) until they reach the target, starting at most ten steps back so changes finish quickly, with a small stagger across cells. Alternate between two sets of destinations every few seconds and on click. The board is dark with warm off-white characters and a hairline across each cell. Size everything with container query units, expose the board contents to assistive tech through an aria-live polite visually hidden text, and show the final text immediately for reduced motion. Vanilla HTML, CSS and JavaScript using the Web Animations API.',
 css:`.sf{padding:2.4cqw;border:1px solid #2a2a30;border-radius:24px;background:#0d0d10;container-type:inline-size;cursor:pointer;overflow:hidden}
.sf-wrap{container-type:inline-size}
.sf-board{--c:min(6.5cqw,48px);display:grid;gap:calc(var(--c)*.14);justify-content:center}
.sf-row{display:flex;gap:calc(var(--c)*.08)}
.sf-cell{position:relative;width:var(--c);height:calc(var(--c)*1.46);perspective:calc(var(--c)*6);font:700 calc(var(--c)*1.02)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#f3ead7}
.sf-half{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:#1b1b20;backface-visibility:hidden}
.sf-half span{position:absolute;left:0;right:0;height:200%;display:grid;place-items:center}
.sf-top,.sf-ft{top:0;border-radius:calc(var(--c)*.1) calc(var(--c)*.1) 0 0;background:linear-gradient(#202026,#1a1a1f)}
.sf-bot,.sf-fb{bottom:0;border-radius:0 0 calc(var(--c)*.1) calc(var(--c)*.1);background:linear-gradient(#17171b,#1e1e24)}
.sf-bot span,.sf-fb span{bottom:0}
.sf-ft{transform-origin:50% 100%;z-index:3}.sf-fb{transform-origin:50% 0;z-index:3;transform:rotateX(90deg)}
.sf-cell::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#050507;z-index:5}
.sf-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sf-title{margin:0 0 calc(var(--c,40px)*.4);text-align:center;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.3em;color:#7d7a72}`,
 html:`<div class="sf" role="group" aria-label="Departures board"><p class="sf-title">DEPARTURES</p><div class="sf-board"></div><p class="sf-live" aria-live="polite"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sf'),board=root.querySelector('.sf-board'),live=root.querySelector('.sf-live');
var SET=' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:',sets=[['LONDON    0940','TOKYO     1115','NEW YORK  1305'],['PARIS     0955','LISBON    1130','OSLO      1320'],['SYDNEY    0715','DUBAI     0830','LAGOS     0945']],COLS=14,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,cells=[],cur=-1,timer=0;
function half(cls){var d=document.createElement('div');d.className='sf-half '+cls;var s=document.createElement('span');d.appendChild(s);return d}
for(var r=0;r<3;r++){var row=document.createElement('div');row.className='sf-row';row.setAttribute('aria-hidden','true');for(var c=0;c<COLS;c++){var cell=document.createElement('div');cell.className='sf-cell';var top=half('sf-top'),bot=half('sf-bot'),ft=half('sf-ft'),fb=half('sf-fb');ft.style.visibility=fb.style.visibility='hidden';
  [top,bot,ft,fb].forEach(function(h){cell.appendChild(h)});row.appendChild(cell);cells.push({el:cell,top:top.firstChild,bot:bot.firstChild,ft:ft,ftS:ft.firstChild,fb:fb,fbS:fb.firstChild,ch:' ',busy:0,target:' '})}board.appendChild(row)}
function show(c,ch){c.top.textContent=c.bot.textContent=c.ftS.textContent=c.fbS.textContent=ch===' '?String.fromCharCode(160):ch;c.ch=ch}
cells.forEach(function(c){show(c,' ')});
function flip(c,next,done){var old=c.ch;c.top.textContent=next===' '?String.fromCharCode(160):next;c.ftS.textContent=old===' '?String.fromCharCode(160):old;c.fbS.textContent=next===' '?String.fromCharCode(160):next;
 c.ft.style.visibility=c.fb.style.visibility='visible';
 var a=c.ft.animate([{transform:'rotateX(0deg)'},{transform:'rotateX(-90deg)'}],{duration:85,easing:'ease-in',fill:'forwards'});
 a.onfinish=function(){var b=c.fb.animate([{transform:'rotateX(90deg)'},{transform:'rotateX(0deg)'}],{duration:95,easing:'ease-out',fill:'forwards'});
  b.onfinish=function(){c.bot.textContent=next===' '?String.fromCharCode(160):next;c.ch=next;c.ft.style.visibility=c.fb.style.visibility='hidden';a.cancel();b.cancel();done()}}}
function settle(c,delay){clearTimeout(c.timer);var ti=Math.max(0,SET.indexOf(c.target)),ci=Math.max(0,SET.indexOf(c.ch)),dist=(ti-ci+SET.length)%SET.length;if(!dist)return;if(dist>10){ci=(ti-10+SET.length)%SET.length;show(c,SET.charAt(ci))}
 function step(){var ci2=SET.indexOf(c.ch);if(c.ch===c.target)return;flip(c,SET.charAt((ci2+1)%SET.length),function(){step()})}
 c.timer=setTimeout(step,delay)}
function setBoard(n){cur=n%sets.length;var rows=sets[cur];cells.forEach(function(c,i){var rr=Math.floor(i/COLS),cc=i%COLS,ch=rows[rr].charAt(cc)||' ';c.target=ch;if(reduce){show(c,ch)}else settle(c,cc*28+rr*70)});live.textContent=rows.map(function(s){return s.replace(/ +/g,' ')}).join('. ');
 clearTimeout(timer);if(!reduce)timer=setTimeout(function(){setBoard(cur+1)},5200)}
root.addEventListener('click',function(){setBoard(cur+1)});
setBoard(0);})();`},

{id:'s-letter-cubes',title:'Letter cubes',component:'Letter cubes',key:'letter-cubes',family,width:780,
 description:'A word built from 3D blocks that roll over, one after another, to reveal the next word.',
 prompt:'Build a word out of six CSS 3D blocks. Each block is a four-sided prism that rotates around the X axis: its four faces sit at rotateX(k*90deg) translateZ(half the block height), show the n-th letter of four different six-letter words (CREATE, REFINE, LAUNCH, REPEAT) and use a different hue per word (a gradient from hsl at 82% to 48% lightness). One shared --r custom property on the row sets the step; every block transforms to translateZ(-half) rotateX(calc(var(--r) * -90deg)) with a transition of 0.9s cubic-bezier(.65,0,.25,1) and a delay of 70ms per block so they roll in a wave. Advance every 2.8s and on click or Enter, pause the auto advance while hovering, and expose the current word in an aria-live caption. Size with container query units. Reduced motion advances without transition. Vanilla HTML, CSS and JavaScript.',
 css:`.lc{display:grid;gap:26px;justify-items:center;padding:56px 20px 36px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);container-type:inline-size;cursor:pointer;overflow:hidden}
.lc-row{--u:min(12cqw,84px);--ch:calc(var(--u)*1.5);--r:0;display:flex;gap:calc(var(--u)*.1);perspective:calc(var(--u)*9)}
.lc-cube{position:relative;width:calc(var(--u)*1.02);height:var(--ch);transform-style:preserve-3d;transform:translateZ(calc(var(--ch)*-.5)) rotateX(calc(var(--r)*-90deg));transition:transform .9s cubic-bezier(.65,0,.25,1) calc(var(--n)*70ms)}
.lc-face{position:absolute;inset:0;display:grid;place-items:center;border-radius:calc(var(--u)*.16);color:#fff;font:900 calc(var(--u)*.95)/1 system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(160deg,hsl(var(--hue) 84% 64%),hsl(var(--hue) 78% 46%));backface-visibility:hidden;transform:rotateX(calc(var(--k)*90deg)) translateZ(calc(var(--ch)*.5));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.lc-cap{margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--sc-muted)}
@media (prefers-reduced-motion:reduce){.lc-cube{transition:none}}`,
 html:`<div class="lc" tabindex="0" role="button" aria-label="Roll to the next word"><div class="lc-row" aria-hidden="true"></div><p class="lc-cap" aria-live="polite">Create</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.lc'),row=root.querySelector('.lc-row'),cap=root.querySelector('.lc-cap');
var words=['CREATE','REFINE','LAUNCH','REPEAT'],hues=[262,300,336,20],reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,step=0,timer=0,hover=false;
for(var n=0;n<6;n++){var cube=document.createElement('div');cube.className='lc-cube';cube.style.setProperty('--n',n);for(var k=0;k<4;k++){var f=document.createElement('div');f.className='lc-face';f.style.setProperty('--k',k);f.style.setProperty('--hue',hues[k]);f.textContent=words[k].charAt(n);cube.appendChild(f)}row.appendChild(cube)}
function advance(){step++;row.style.setProperty('--r',step);var w=words[step%4];cap.textContent=w.charAt(0)+w.slice(1).toLowerCase()}
function loop(){clearTimeout(timer);if(reduce)return;timer=setTimeout(function(){if(!hover)advance();loop()},2800)}
root.addEventListener('click',function(){advance();loop()});root.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();advance();loop()}});
root.addEventListener('pointerenter',function(){hover=true});root.addEventListener('pointerleave',function(){hover=false});loop();})();`},

{id:'s-ring-text',title:'Orbiting ring text',component:'Orbiting ring text',key:'ring-text',family,width:560,
 description:'Two rings of text spin in opposite directions around a glowing core and tilt towards the pointer.',
 prompt:'Make a badge from two concentric rings of text set on circular SVG paths (<textPath> with textLength so each phrase fits its circumference exactly). The outer ring turns clockwise in 26s and the inner ring counter-clockwise in 18s using CSS animations with transform-origin at the viewBox centre. A glowing gradient orb with a small spinning star sits in the middle. Pointer movement tilts the whole badge in 3D (perspective on the parent, rotateX/rotateY up to 16 degrees, eased with requestAnimationFrame) and hovering speeds both rings up by changing animation-duration. The SVG has role="img" and a title/aria-label; honour reduced motion by stopping the spin. Vanilla HTML, CSS and JavaScript.',
 css:`.rt{display:grid;place-items:center;padding:34px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);perspective:900px}
.rt-svg{width:min(100%,400px);height:auto;transform-style:preserve-3d;will-change:transform;overflow:visible}
.rt-ring{transform-origin:200px 200px;font:800 21px system-ui,-apple-system,"Segoe UI",sans-serif;fill:var(--sc-fg)}
.rt-out{animation:rt-spin var(--do,26s) linear infinite}
.rt-in{animation:rt-spin var(--di,18s) linear infinite reverse;font-size:16px;fill:var(--sc-accent)}
.rt-star{transform-origin:200px 200px;animation:rt-spin 9s linear infinite reverse}
.rt-pulse{transform-origin:200px 200px;animation:rt-pulse 3.2s ease-in-out infinite}
@keyframes rt-spin{to{transform:rotate(360deg)}}
@keyframes rt-pulse{50%{transform:scale(1.08)}}
@media (prefers-reduced-motion:reduce){.rt-ring,.rt-star,.rt-pulse{animation:none}}`,
 html:`<div class="rt"><svg class="rt-svg" viewBox="0 0 400 400" role="img" aria-label="Rotating badge reading: design in motion, type that turns"><defs><path id="rt-p1" d="M200,200 m-160,0 a160,160 0 1,1 320,0 a160,160 0 1,1 -320,0"/><path id="rt-p2" d="M200,200 m-118,0 a118,118 0 1,1 236,0 a118,118 0 1,1 -236,0"/><radialGradient id="rt-g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffd6f5"/><stop offset=".35" stop-color="#d36bff"/><stop offset="1" stop-color="#4b2bd6"/></radialGradient></defs><g class="rt-ring rt-out"><text><textPath href="#rt-p1" textLength="1000" lengthAdjust="spacing">DESIGN IN MOTION ✦ TYPE THAT TURNS ✦ LETTERS IN ORBIT ✦ </textPath></text></g><g class="rt-ring rt-in"><text><textPath href="#rt-p2" textLength="736" lengthAdjust="spacing">ROUND AND ROUND ✦ NEVER THE SAME ✦ </textPath></text></g><g class="rt-pulse"><circle cx="200" cy="200" r="58" fill="url(#rt-g)"/></g><g class="rt-star"><path d="M200 168 L207 193 L232 200 L207 207 L200 232 L193 207 L168 200 L193 193 Z" fill="#fff" opacity=".92"/></g></svg></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.rt'),svg=root.querySelector('.rt-svg');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,rx=0,ry=0,tx=0,ty=0,raf=0;
function frame(){raf=0;rx+=(tx-rx)*.1;ry+=(ty-ry)*.1;svg.style.transform='rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg)';if(Math.abs(tx-rx)>.02||Math.abs(ty-ry)>.02)raf=requestAnimationFrame(frame)}
function kick(){if(!raf&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;ty=x*32;tx=-y*32;kick()});
root.addEventListener('pointerenter',function(){root.style.setProperty('--do','9s');root.style.setProperty('--di','6s')});
root.addEventListener('pointerleave',function(){tx=ty=0;root.style.removeProperty('--do');root.style.removeProperty('--di');kick()});})();`},

{id:'s-bending-marquee',title:'Bending marquee',component:'Bending marquee',key:'bending-marquee',family,width:820,
 description:'A giant marquee riding a curve that bends towards your pointer and surges when you scroll.',
 prompt:'Create a marquee whose text runs along an SVG path: a quadratic curve M -100,Y Q 450,Cy 1000,Y inside a 900x320 viewBox, with the text set on it using <textPath href> and a startOffset that changes every frame so it scrolls. Repeat a short phrase (alternating solid and outlined tspans, with a star separator) enough times to cover the path, measure one repeat with getComputedTextLength() and wrap the offset by that length for a seamless loop. The control-point Cy eases towards a target set by the pointer height (up to +-150 units); with no pointer it oscillates slowly. Wheel and touch-drag add velocity that decays back to a base speed. Fade the left and right edges with a CSS mask. The SVG has role="img" with an aria-label; reduced motion stops scrolling and shows a gentle fixed curve. Pause off-screen. Vanilla HTML, CSS and JavaScript.',
 css:`.bm{position:relative;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;touch-action:pan-y}
.bm-svg{display:block;width:100%;height:auto;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.bm-text{font:900 84px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em;fill:var(--sc-fg)}
.bm-o{fill:transparent;stroke:var(--sc-fg);stroke-width:1.6}
.bm-star{fill:var(--sc-accent)}
.bm-hint{position:absolute;left:0;right:0;bottom:12px;margin:0;text-align:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--sc-muted);pointer-events:none}`,
 html:`<div class="bm"><svg class="bm-svg" viewBox="0 0 900 320" role="img" aria-label="Marquee reading: keep it moving"><defs><path id="bm-path" d="M -100,170 Q 450,170 1000,170"/></defs><text class="bm-text" aria-hidden="true"><textPath id="bm-tp" href="#bm-path" startOffset="0"></textPath></text><text class="bm-text" id="bm-measure" style="visibility:hidden" aria-hidden="true"></text></svg><p class="bm-hint">Move up and down · scroll to surge</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.bm'),svg=root.querySelector('.bm-svg'),path=svg.querySelector('#bm-path'),tp=svg.querySelector('#bm-tp'),meas=svg.querySelector('#bm-measure'),NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,off=0,vel=0,base=1.1,cy=170,tcy=170,ptr=false,raf=0,visible=true,period=600,lastT=0;
function span(txt,cls){var s=document.createElementNS(NS,'tspan');if(cls)s.setAttribute('class',cls);s.textContent=txt;return s}
var unit=['KEEP IT MOVING ','\\u2726 ','keep it moving ','\\u2726 '];
meas.textContent=unit.join('');
for(var i=0;i<6;i++){tp.appendChild(span('KEEP IT MOVING '));tp.appendChild(span('\\u2726 ','bm-star'));tp.appendChild(span('keep it moving ','bm-o'));tp.appendChild(span('\\u2726 ','bm-star'))}
function measure(){period=meas.getComputedTextLength()||600}
function frame(now){raf=0;var dt=Math.min(40,now-lastT||16)/16;lastT=now;if(!ptr)tcy=170+70*Math.sin(now/1700);cy+=(tcy-cy)*.07;path.setAttribute('d','M -100,170 Q 450,'+(cy*2-170).toFixed(1)+' 1000,170');
 vel+=(0-vel)*.05*dt;off-=(base+vel)*dt;if(off<-period)off+=period;if(off>0)off-=period;tp.setAttribute('startOffset',off.toFixed(1));if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce){lastT=performance.now();raf=requestAnimationFrame(frame)}}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();ptr=true;tcy=170+((e.clientY-r.top)/r.height-.5)*300});
root.addEventListener('pointerleave',function(){ptr=false});
root.addEventListener('wheel',function(e){vel+=Math.max(-14,Math.min(14,e.deltaY*.04))},{passive:true});
var sx=0;root.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});root.addEventListener('touchmove',function(e){var x=e.touches[0].clientX;vel+=(sx-x)*.05;sx=x},{passive:true});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);measure();if(reduce){path.setAttribute('d','M -100,170 Q 450,120 1000,170')}go();})();`},

{id:'s-neon-sign',title:'Neon sign',component:'Neon sign',key:'neon-sign',family,width:780,
 description:'A glowing neon tube sign that powers on with a flicker and occasionally stutters.',
 prompt:'Build a neon sign on a dark wall. The sign is a rounded rectangle tube (cyan border with layered box-shadows, inside and out) around bold italic rounded text. Each letter has an off-white tube core and a pink multi-layer text-shadow (3, 10, 22, 46 and 90px blurs). A wall glow (radial gradient) behind the sign fades with the power state. A "Power" toggle button (aria-pressed) turns the sign off (letters become dull plum with no shadow) and on again with a startup sequence: letters ignite in a random order with two quick flickers each. While on, one random letter occasionally stutters off for 80-140ms and a faint hum-style flicker of the whole wall glow runs. Use classes and CSS transitions, honour reduced motion by skipping flicker, and keep the text readable in both states. Vanilla HTML, CSS and JavaScript.',
 css:`.nn{--c:#ff3fa4;--c2:#34d5ff;position:relative;display:grid;gap:30px;justify-items:center;padding:56px 24px 34px;border:1px solid #2a1f36;border-radius:28px;background:radial-gradient(ellipse at 50% 120%,#1f1229,#08060d 72%);overflow:hidden;color:#fff}
.nn::before{content:"";position:absolute;left:50%;top:44%;width:86%;height:78%;transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(255,63,164,.3),transparent);opacity:0;transition:opacity .6s;pointer-events:none}
.nn.is-on::before{opacity:1}
.nn-sign{position:relative;padding:22px 46px 26px;border:4px solid #25414a;border-radius:30px;transition:border-color .3s,box-shadow .3s}
.nn.is-on .nn-sign{border-color:var(--c2);box-shadow:0 0 5px var(--c2),0 0 20px var(--c2),0 0 44px rgba(52,213,255,.5),inset 0 0 5px var(--c2),inset 0 0 22px rgba(52,213,255,.45)}
.nn-text{margin:0;text-align:center;font:800 italic clamp(40px,10.5vw,92px)/1.04 ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Segoe UI",system-ui,sans-serif;letter-spacing:.01em}
.nn-w{display:inline-block;white-space:nowrap}
.nn-l{display:inline-block;color:#4a3345;text-shadow:none;transition:color .08s,text-shadow .08s}
.nn.is-on .nn-l{color:#fff4fb;text-shadow:0 0 3px #fff,0 0 10px var(--c),0 0 22px var(--c),0 0 46px var(--c),0 0 90px var(--c)}
.nn.is-on .nn-l.is-dim{color:#6e4a63;text-shadow:none}
.nn-btn{position:relative;padding:10px 20px;border:1px solid #3b2c4a;border-radius:999px;background:#150e1c;color:#e9dff5;cursor:pointer;font-size:14px;font-weight:600}
.nn-btn[aria-pressed=true]{border-color:var(--c);box-shadow:0 0 14px rgba(255,63,164,.45)}`,
 html:`<div class="nn"><div class="nn-sign"><h2 class="nn-text"></h2></div><button class="nn-btn" type="button" aria-pressed="true">Power</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.nn'),text=root.querySelector('.nn-text'),btn=root.querySelector('.nn-btn'),lines=['Open','all night'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],timers=[],on=true,stutter=0;
text.setAttribute('aria-label',lines.join(' '));
lines.forEach(function(txt,li){if(li)text.appendChild(document.createElement('br'));txt.split(' ').forEach(function(word,wi){if(wi)text.appendChild(document.createTextNode(' '));var w=document.createElement('span');w.className='nn-w';w.setAttribute('aria-hidden','true');for(var i=0;i<word.length;i++){var s=document.createElement('span');s.className='nn-l';s.textContent=word.charAt(i);w.appendChild(s);L.push(s)}text.appendChild(w)})});
function later(fn,ms){timers.push(setTimeout(fn,ms))}
function clear(){timers.forEach(clearTimeout);timers=[];clearTimeout(stutter);L.forEach(function(l){l.classList.remove('is-dim')})}
function ignite(){root.classList.remove('is-on');clear();L.forEach(function(l){l.style.color=''});var order=L.map(function(_,i){return i}).sort(function(){return Math.random()-.5});
 if(reduce){root.classList.add('is-on');return}
 L.forEach(function(l){l.classList.add('is-dim')});later(function(){root.classList.add('is-on')},120);
 order.forEach(function(i,n){var t=260+n*95;later(function(){L[i].classList.remove('is-dim')},t);later(function(){L[i].classList.add('is-dim')},t+70);later(function(){L[i].classList.remove('is-dim')},t+140);later(function(){L[i].classList.add('is-dim')},t+190);later(function(){L[i].classList.remove('is-dim')},t+260)});
 later(hum,260+L.length*95+400)}
function hum(){if(!on)return;var l=L[Math.floor(Math.random()*L.length)];l.classList.add('is-dim');setTimeout(function(){l.classList.remove('is-dim');if(Math.random()<.5)setTimeout(function(){l.classList.add('is-dim');setTimeout(function(){l.classList.remove('is-dim')},60)},90)},80+Math.random()*60);stutter=setTimeout(hum,1800+Math.random()*3600)}
function power(state){on=state;btn.setAttribute('aria-pressed',String(on));if(on)ignite();else{clear();root.classList.remove('is-on')}}
btn.addEventListener('click',function(){power(!on)});power(true);})();`}
];
