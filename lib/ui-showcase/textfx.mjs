// Original text-effect components. Plain HTML, CSS and a little JavaScript; no third-party code.
const family='Text effects';
export const textfx=[
{id:'s-cipher-reveal',title:'Cipher reveal',component:'Cipher reveal',key:'cipher-reveal',family,width:760,
 description:'A headline that decodes from random symbols, resolving one letter at a time with a flash.',
 prompt:'Build a headline that decodes itself. Split each phrase into words (so wrapping stays natural) and letters, lock every letter to its final measured width so nothing jitters, and start each letter as a random symbol in a muted colour. Letters resolve left to right with a small random delay; the moment one resolves it flashes in the accent colour with a soft glow for 260ms. Cycle through three phrases every few seconds and add a "Decode again" button. The heading gets an aria-label with the real phrase and the letter spans are aria-hidden. Respect reduced motion by showing the final text with no scrambling. Vanilla HTML, CSS and JavaScript.',
 css:`.cx{display:grid;gap:20px;justify-items:start;padding:48px 42px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.cx-kicker{display:flex;align-items:center;gap:10px;margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--sc-muted)}
.cx-kicker::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--sc-accent);box-shadow:0 0 0 4px var(--sc-ring)}
.cx-line{margin:0;min-height:2.3em;max-width:15em;font:800 clamp(30px,6.2vw,54px)/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.cx-w{display:inline-block;white-space:nowrap}
.cx-l{display:inline-block;text-align:center;transition:color .3s}
.cx-s{color:var(--sc-muted);opacity:.7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600}
.cx-hit{color:var(--sc-accent);text-shadow:0 0 .6em var(--sc-ring),0 0 .12em var(--sc-accent)}
.cx-btn{padding:10px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600;transition:transform .2s,border-color .2s}
.cx-btn:hover{border-color:var(--sc-accent);transform:translateY(-1px)}`,
 html:`<div class="cx"><p class="cx-kicker">Incoming transmission</p><h2 class="cx-line"></h2><button class="cx-btn" type="button">Decode again</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.cx'),line=root.querySelector('.cx-line'),btn=root.querySelector('.cx-btn');
var phrases=['Signal found beyond the noise.','Every word was once a secret.','Decoded one letter at a time.'],glyphs='!<>-_/[]{}=+*^?#%&01',reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,idx=0,raf=0,timer=0,letters=[];
function build(text){line.textContent='';line.setAttribute('aria-label',text);letters=[];text.split(' ').forEach(function(word,wi){if(wi)line.appendChild(document.createTextNode(' '));var w=document.createElement('span');w.className='cx-w';w.setAttribute('aria-hidden','true');for(var i=0;i<word.length;i++){var s=document.createElement('span');s.className='cx-l';s.textContent=word[i];w.appendChild(s);letters.push({el:s,ch:word[i]})}line.appendChild(w)});
 letters.forEach(function(l){l.el.style.width=l.el.getBoundingClientRect().width+'px'})}
function pick(){return glyphs.charAt(Math.random()*glyphs.length|0)}
function run(text){cancelAnimationFrame(raf);clearTimeout(timer);build(text);if(reduce)return;var t0=performance.now();
 letters.forEach(function(l,i){l.at=i*36+Math.random()*280+140;l.done=false;l.last=0;l.el.className='cx-l cx-s';l.el.textContent=pick()});
 (function step(now){var t=now-t0,left=0;letters.forEach(function(l){if(l.done)return;if(t>=l.at){l.done=true;l.el.textContent=l.ch;l.el.className='cx-l cx-hit';setTimeout(function(){l.el.className='cx-l'},320);return}left++;if(t-l.last>55){l.last=t;l.el.textContent=pick()}});
  if(left)raf=requestAnimationFrame(step);else timer=setTimeout(next,2800)})(t0)}
function next(){idx=(idx+1)%phrases.length;run(phrases[idx])}
btn.addEventListener('click',next);run(phrases[0]);})();`},

{id:'s-proximity-type',title:'Proximity type',component:'Proximity type',key:'proximity-type',family,width:780,
 description:'Letters rise, swell and warm to the accent colour near the pointer, with an idle sweep when nobody is hovering.',
 prompt:'Create a large headline split into words and letters. Each letter measures its centre once (offsetLeft/offsetTop so transforms never disturb it) and every frame eases towards a target between 0 and 1 based on its distance to the pointer, using a smooth-step falloff. The target lifts the letter up to 11px, scales it to 1.3x and mixes its colour from the text colour towards the accent colour with color-mix. When no pointer is present a virtual pointer sweeps slowly along the line so the effect is alive on touch screens. Pause the loop off-screen with IntersectionObserver and do nothing for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.px{display:grid;place-items:center;min-height:300px;padding:44px 32px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.px-line{position:relative;margin:0;max-width:14em;text-align:center;font:800 clamp(32px,6.6vw,60px)/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.035em;cursor:default}
.px-w{display:inline-block;white-space:nowrap}
.px-l{display:inline-block;transform-origin:50% 85%;color:color-mix(in srgb,var(--sc-accent) calc(var(--p,0)*100%),var(--sc-fg));will-change:transform}`,
 html:`<div class="px"><h2 class="px-line"></h2></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.px'),line=root.querySelector('.px-line'),text='Move closer to read between the lines.';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],ptr=null,raf=0,visible=true;
line.setAttribute('aria-label',text);
text.split(' ').forEach(function(word,wi){if(wi)line.appendChild(document.createTextNode(' '));var w=document.createElement('span');w.className='px-w';w.setAttribute('aria-hidden','true');for(var i=0;i<word.length;i++){var s=document.createElement('span');s.className='px-l';s.textContent=word[i];w.appendChild(s);L.push({el:s,p:0,x:0,cx:0,cy:0})}line.appendChild(w)});
function measure(){L.forEach(function(l){l.cx=l.el.offsetLeft+l.el.offsetWidth/2;l.cy=l.el.offsetTop+l.el.offsetHeight/2})}
function frame(now){raf=0;var t=now/1000,w=line.offsetWidth,px,py;if(ptr){px=ptr.x;py=ptr.y}else{px=w*(.5+.48*Math.sin(t*.65));py=line.offsetHeight*(.5+.3*Math.sin(t*1.1))}
 var R=Math.max(120,w*.2);
 L.forEach(function(l){var dx=l.cx-px,dy=l.cy-py,d=Math.sqrt(dx*dx+dy*dy),k=Math.max(0,1-d/R);k=k*k*(3-2*k);l.p+=(k-l.p)*.16;l.x=0;
  l.el.style.transform='translate('+l.x.toFixed(2)+'px,'+(-l.p*11).toFixed(2)+'px) scale('+(1+l.p*.3).toFixed(3)+')';l.el.style.setProperty('--p',l.p.toFixed(3))});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
line.addEventListener('pointermove',function(e){var r=line.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});
line.addEventListener('pointerleave',function(){ptr=null});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);
addEventListener('resize',measure);measure();go();})();`},

{id:'s-echo-type',title:'Echo type',component:'Echo type',key:'echo-type',family,width:780,
 description:'A heavy word trailing a chain of colour-shifted outline echoes that follow the pointer.',
 prompt:'Make a hero word with eight outline echoes. Place the solid word in front and eight copies behind it (aria-hidden, absolutely positioned, transparent fill, -webkit-text-stroke in a hue that shifts from violet to pink and with opacity that falls off). A shared position chain makes each echo follow the one in front of it with an easing factor of about 0.22, so the trail stretches like a ribbon when the pointer moves. The front word follows a scaled, clamped offset of the pointer. When the pointer is away a Lissajous path drives the motion so the effect is never static. Pause off-screen and skip motion for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.ec{position:relative;display:grid;place-items:center;min-height:330px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.ec-stack{position:relative;display:grid;place-items:center;padding:10px 24px}
.ec-word,.ec-ghost{margin:0;font:900 clamp(50px,13.5vw,116px)/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.055em;white-space:nowrap}
.ec-ghost{position:absolute;inset:0;display:grid;place-items:center;color:transparent;-webkit-text-stroke:1.6px hsl(calc(262 + var(--i)*13) 92% 66%);opacity:calc(.95 - var(--i)*.1);pointer-events:none;will-change:transform}
.ec-word{position:relative;will-change:transform}
.ec-hint{position:absolute;bottom:16px;left:0;right:0;margin:0;text-align:center;font-size:13px;color:var(--sc-muted)}`,
 html:`<div class="ec"><div class="ec-stack"><h2 class="ec-word">Afterglow</h2></div><p class="ec-hint">Move across the word</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ec'),stack=root.querySelector('.ec-stack'),word=root.querySelector('.ec-word');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,N=8,ghosts=[],pos=[],tx=0,ty=0,active=false,raf=0,visible=true;
for(var i=N;i>=1;i--){var g=document.createElement('div');g.className='ec-ghost';g.setAttribute('aria-hidden','true');g.style.setProperty('--i',i);g.textContent=word.textContent;stack.insertBefore(g,word);ghosts.unshift(g)}
for(var j=0;j<=N;j++)pos.push({x:0,y:0});
function frame(now){raf=0;var t=now/1000;if(!active){tx=Math.sin(t*.9)*70;ty=Math.cos(t*1.35)*26}
 pos[0].x+=(tx-pos[0].x)*.18;pos[0].y+=(ty-pos[0].y)*.18;
 for(var k=1;k<=N;k++){pos[k].x+=(pos[k-1].x-pos[k].x)*.24;pos[k].y+=(pos[k-1].y-pos[k].y)*.24}
 word.style.transform='translate('+(pos[0].x*.4).toFixed(2)+'px,'+(pos[0].y*.4).toFixed(2)+'px)';
 ghosts.forEach(function(g,idx){var p=pos[idx+1];g.style.transform='translate('+p.x.toFixed(2)+'px,'+p.y.toFixed(2)+'px)'});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=root.getBoundingClientRect();active=true;tx=Math.max(-170,Math.min(170,(e.clientX-r.left-r.width/2)*.7));ty=Math.max(-70,Math.min(70,(e.clientY-r.top-r.height/2)*.5))});
root.addEventListener('pointerleave',function(){active=false});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(reduce){ghosts.forEach(function(g,idx){g.style.transform='translate('+(idx+1)*7+'px,'+(idx+1)*3+'px)'})}go();})();`},

{id:'s-domino-type',title:'Domino type',component:'Domino type',key:'domino-type',family,width:780,
 description:'Letter tiles topple one after another like dominoes; click any tile to start the fall there.',
 prompt:'Build a row of letter tiles that topple like dominoes. Each tile is a rounded block with a bold letter, its colour stepping through an HSL gradient from violet to pink using a --i index variable. Size everything from one unit variable (--u: min(5cqw, 40px)) on a container-type:inline-size wrapper so it scales. Clicking a tile makes it and every tile after it fall: each rotates about its bottom-right corner to a lean of about 9 degrees with 85ms stagger, using a cubic-bezier that accelerates into the hit and overshoots slightly; the very last tile falls flat to 90 degrees. A "Stand them up" button reverses the cascade from the last tile back. Tiles are real buttons with aria-labels and the state is announced with aria-pressed on a toggle. Reduced motion shows the end state immediately. Vanilla HTML, CSS and JavaScript.',
 css:`.dm{display:grid;gap:26px;justify-items:center;padding:40px 24px 30px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);container-type:inline-size;overflow:hidden}
.dm-row{--u:min(5cqw,40px);display:flex;align-items:flex-end;gap:calc(var(--u)*.26);padding-right:calc(var(--u)*1.7);height:calc(var(--u)*1.9);border-bottom:2px solid var(--sc-line)}
.dm-tile{--i:0;position:relative;display:grid;place-items:center;width:calc(var(--u)*1.1);height:calc(var(--u)*1.7);margin:0;padding:0;border:0;border-radius:calc(var(--u)*.22);color:#fff;font:800 calc(var(--u)*.85)/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;background:linear-gradient(160deg,hsl(calc(252 + var(--i)*10) 82% 66%),hsl(calc(252 + var(--i)*10) 78% 52%));box-shadow:inset 0 -3px 0 rgba(0,0,0,.18),0 6px 12px -6px rgba(0,0,0,.45);transform-origin:100% 100%;transition:transform .5s cubic-bezier(.55,.06,.75,.5)}
.dm-tile::after{content:"";position:absolute;left:18%;right:18%;top:50%;height:2px;margin-top:calc(var(--u)*.62);background:rgba(255,255,255,.35);border-radius:2px;opacity:0}
.dm-gap{width:calc(var(--u)*.8);flex:none}
.dm-tile.is-down{transform:rotate(9deg);transition-timing-function:cubic-bezier(.4,0,.2,1.4)}
.dm-tile.is-flat{transform:rotate(90deg);transition-duration:.6s;transition-timing-function:cubic-bezier(.5,0,.9,.6)}
.dm-btn{padding:10px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600}
.dm-btn:hover{border-color:var(--sc-accent)}`,
 html:`<div class="dm"><div class="dm-row" role="group" aria-label="Tipping point"></div><button class="dm-btn" type="button">Topple them</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.dm'),row=root.querySelector('.dm-row'),btn=root.querySelector('.dm-btn');
var phrase='TIPPING POINT',reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,tiles=[],timers=[],fallen=false,STEP=85;
for(var i=0;i<phrase.length;i++){var c=phrase.charAt(i);if(c===' '){var g=document.createElement('span');g.className='dm-gap';g.setAttribute('aria-hidden','true');row.appendChild(g);continue}
 var b=document.createElement('button');b.type='button';b.className='dm-tile';b.textContent=c;b.style.setProperty('--i',tiles.length);b.setAttribute('aria-label','Topple from '+c);row.appendChild(b);tiles.push(b)}
function clear(){timers.forEach(clearTimeout);timers=[]}
function set(tile,state){tile.classList.toggle('is-down',state==='down');tile.classList.toggle('is-flat',state==='flat')}
function fall(from){clear();var n=tiles.length;for(var i=from;i<n;i++)(function(i){var d=reduce?0:(i-from)*STEP;timers.push(setTimeout(function(){set(tiles[i],i===n-1?'flat':'down')},d))})(i);fallen=true;btn.textContent='Stand them up'}
function stand(){clear();var n=tiles.length;for(var i=n-1;i>=0;i--)(function(i){var d=reduce?0:(n-1-i)*55;timers.push(setTimeout(function(){set(tiles[i],'up')},d))})(i);fallen=false;btn.textContent='Topple them'}
tiles.forEach(function(t,i){t.addEventListener('click',function(){if(fallen){stand()}else{fall(i)}})});
btn.addEventListener('click',function(){if(fallen)stand();else fall(0)});
})();`},

{id:'s-scatter-type',title:'Scatter type',component:'Scatter type',key:'scatter-type',family,width:780,
 description:'Letters are blasted away by the pointer, spin through the air and spring home.',
 prompt:'Create a two-line headline where every letter is a physics body. On each frame apply a repulsion force from the pointer inside a 130px radius (stronger when closer), a spring force back to its home position (k=0.07), damping of 0.84 and a rotation that follows horizontal velocity. Letters are inline-block spans positioned with transform only; measure their home positions through layout. Clicking applies a random explosion impulse to every letter. When there is no pointer a soft invisible pointer drifts through the text so the demo is never frozen. Pause when the element is off-screen and render the static headline for reduced motion. Vanilla HTML, CSS and JavaScript, no libraries.',
 css:`.sct{display:grid;place-items:center;min-height:320px;padding:40px 28px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;cursor:crosshair;user-select:none}
.sct-line{position:relative;margin:0;text-align:center;font:900 clamp(40px,10vw,92px)/1.02 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.045em}
.sct-w{display:inline-block;white-space:nowrap}
.sct-l{display:inline-block;will-change:transform;color:color-mix(in srgb,var(--sc-accent) calc(var(--p,0)*100%),var(--sc-fg))}`,
 html:`<div class="sct"><h2 class="sct-line"></h2></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sct'),line=root.querySelector('.sct-line'),lines=['Scatter','& settle'];
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,L=[],ptr=null,raf=0,visible=true;
line.setAttribute('aria-label',lines.join(' '));
lines.forEach(function(txt,li){if(li)line.appendChild(document.createElement('br'));var w=document.createElement('span');w.className='sct-w';w.setAttribute('aria-hidden','true');for(var i=0;i<txt.length;i++){var s=document.createElement('span');s.className='sct-l';s.textContent=txt.charAt(i)===' '?String.fromCharCode(160):txt.charAt(i);w.appendChild(s);L.push({el:s,x:0,y:0,vx:0,vy:0,r:0,hx:0,hy:0})}line.appendChild(w)});
function measure(){L.forEach(function(l){l.hx=l.el.offsetLeft+l.el.offsetWidth/2;l.hy=l.el.offsetTop+l.el.offsetHeight/2})}
function frame(now){raf=0;var t=now/1000,w=line.offsetWidth,h=line.offsetHeight,px,py,R=130;if(ptr){px=ptr.x;py=ptr.y}else{px=w*(.5+.46*Math.sin(t*.8));py=h*(.5+.3*Math.sin(t*1.7+1));R=100}
 L.forEach(function(l){var cx=l.hx+l.x,cy=l.hy+l.y,dx=cx-px,dy=cy-py,d=Math.sqrt(dx*dx+dy*dy)+.001;if(d<R){var f=(1-d/R);f=f*f*9;l.vx+=dx/d*f;l.vy+=dy/d*f}
  l.vx+=-l.x*.07;l.vy+=-l.y*.07;l.vx*=.84;l.vy*=.84;l.x+=l.vx;l.y+=l.vy;var tr=Math.max(-70,Math.min(70,l.vx*5));l.r+=(tr-l.r)*.2;
  var m=Math.min(1,Math.sqrt(l.x*l.x+l.y*l.y)/90);l.el.style.transform='translate('+l.x.toFixed(2)+'px,'+l.y.toFixed(2)+'px) rotate('+l.r.toFixed(2)+'deg)';l.el.style.setProperty('--p',m.toFixed(2))});
 if(visible)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
root.addEventListener('pointermove',function(e){var r=line.getBoundingClientRect();ptr={x:e.clientX-r.left,y:e.clientY-r.top}});
root.addEventListener('pointerleave',function(){ptr=null});
root.addEventListener('pointerdown',function(){L.forEach(function(l){var a=Math.random()*6.283,s=9+Math.random()*16;l.vx+=Math.cos(a)*s;l.vy+=Math.sin(a)*s-6})});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);addEventListener('resize',measure);measure();go();})();`}
];
