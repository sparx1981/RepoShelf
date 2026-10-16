// Motion toolkit demos, part four: lens type lanes, dancing figures, tween conflict modes, text replace, split explorer, timeline sequencer, anchor scrolling, disintegrate and shine buttons. No third-party code.
import {ART} from './art-boot.mjs';
import {BOOT} from './cursorfx-boot.mjs';
const family='Motion toolkit';
export const motionD=[
{id:'s-lens-lanes',title:'Lens type lanes',component:'Lens type lanes',key:'lens-lanes',family,width:780,
 description:'Rows of looping type travelling in alternate directions under a fisheye: letters swell and spread around the pointer and slide back to rhythm.',
 prompt:'Build a canvas typography piece. Six lanes of a bold monospace word chain ("MOTION  TYPE  FLOW  ") fill a dark stage; lane i moves left on even rows and right on odd rows at a speed of 30 + i * 12 px per second. Each glyph position is computed with modular arithmetic so the chain wraps seamlessly: x = ((index * advance + time * speed * direction) mod chainLength) - margin, where chainLength is the sum of glyph advances repeated until it exceeds the stage width plus 200px. A fisheye lens follows the pointer (or a roaming virtual pointer): for a glyph at horizontal distance dx from the lens centre and dy vertical distance from the pointer, lens = exp(-(dx / 180)^2 - (dy / 120)^2); displayed x = pointerX + dx * (1 + 0.9 * lens), scale = 1 + 1.3 * lens, and the colour mixes from muted slate to the accent. Lanes sit at 14px glyph height rhythm and each lane has a small vertical wave of 3px. Pause off-screen; reduced motion draws a still frame. Vanilla HTML, CSS and JavaScript.',
 css:`.ll{position:relative;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:#0b0a12;cursor:crosshair}
.ll canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="ll" role="img" aria-label="Looping lanes of the words motion, type and flow with a fisheye lens that follows the pointer"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ll'),cv=root.querySelector('canvas');
${BOOT}
var WORD='MOTION  TYPE  FLOW  ',LANES=6,adv=[],chain=0,glyphs=[],FS=40,fnt='800 '+FS+'px ui-monospace,"SF Mono",Menlo,Consolas,monospace';
function build(s){var c=s.ctx;c.font=fnt;var w=c.measureText('M').width;adv=[];glyphs=[];var str='',total=0;while(total<s.W+260){for(var i=0;i<WORD.length;i++){glyphs.push(WORD.charAt(i));adv.push(w);total+=w}}chain=total}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H,t=reduce?3:s.t/1000;if(!glyphs.length)build(s);
 c.fillStyle='#0b0a12';c.fillRect(0,0,W,H);c.font=fnt;c.textBaseline='middle';c.textAlign='center';
 var px=s.x,py=s.y,pitch=H/(LANES+.4);
 for(var l=0;l<LANES;l++){var dir=l%2?1:-1,sp=30+l*12,y0=pitch*(l+.7),off=((t*sp*dir)%chain+chain)%chain;
  for(var i=0;i<glyphs.length;i++){var ch=glyphs[i];if(ch===' ')continue;var bx=i*adv[0];var x=(((bx+off)%chain)+chain)%chain-130;
   var dx=x-px,dy=y0-py,lens=Math.exp(-(dx*dx)/32400-(dy*dy)/14400),X=px+dx*(1+.9*lens),Y=y0+Math.sin(t*1.4+x*.012+l)*3+dy*.0,sc=1+1.3*lens;
   if(X<-40||X>W+40)continue;
   var mix=Math.min(1,lens*1.25),r=Math.round(86+mix*(165-86)),g=Math.round(92+mix*(151-92)),b=Math.round(118+mix*(255-118));
   c.save();c.translate(X,Y);c.scale(sc,sc);c.fillStyle='rgba('+r+','+g+','+b+','+(.55+.45*lens).toFixed(2)+')';c.fillText(ch,0,0);c.restore()}}
 });
})();`},

{id:'s-dancing-figures',title:'Dancing figures',component:'Dancing figures',key:'dancing-figures',family,width:780,
 description:'Five jointed stage dancers that keep to one tempo: click any of them to swap between bounce, sway and robot moves.',
 prompt:'Build a canvas stage with five jointed figures standing on a floor with a spotlight and a floor ring that pulses on every beat. Each figure is a forward-kinematics skeleton drawn with rounded thick lines (head circle, torso, two-segment arms, two-segment legs) in its own colour. A global beat b = time * BPM / 60 (BPM 112) drives three moves: Bounce (hips dip with abs(sin(pi * b)), arms alternate overhead), Sway (torso leans with sin(pi * b / 2), arms wave in opposite phases, legs step) and Robot (angles snap through four fixed poses on each half beat). A figure goes through limb angles measured from straight down. Clicking or tapping near a figure cycles its move and shows the move name under its feet for a second. Each figure starts with a different move and phase offset. Pause off-screen; reduced motion shows one static pose per figure. Vanilla HTML, CSS and JavaScript.',
 css:`.df{position:relative;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:radial-gradient(90% 120% at 50% -10%,#41306e,#0d0a1a);cursor:pointer}
.df canvas{position:absolute;inset:0;width:100%;height:100%;display:block}`,
 html:`<div class="df" role="img" aria-label="Five stick-figure dancers; click one to change its dance"><canvas></canvas></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.df'),cv=root.querySelector('canvas');
${BOOT}
var MOVES=['Bounce','Sway','Robot'],COL=['#ff6bb5','#6dd3ff','#ffd24d','#8cf0b0','#b9a6ff'],F=COL.map(function(c,i){return {col:c,move:i%3,ph:i*.23,label:0,x:0}});
function limb(x,y,a1,l1,a2,l2){var mx=x+Math.sin(a1)*l1,my=y+Math.cos(a1)*l1;return [x,y,mx,my,mx+Math.sin(a2)*l2,my+Math.cos(a2)*l2]}
var ROBOT=[[2.7,-2.7,.25,-.25],[1.6,1.6,.1,-.1],[-2.9,2.9,.2,-.2],[1.2,-1.2,-.1,.1]];
function pose(f,b){var m=f.move,hip=0,tilt=0,aL,aR,eL,eR,lL,lR,kL,kR,p=b+f.ph*4;
 if(m===0){var sn=Math.sin(Math.PI*p),ab=Math.abs(sn);hip=-ab*20;aL=Math.PI-.55+.7*sn;aR=Math.PI-.55-.7*sn;eL=aL+.3;eR=aR-.3;lL=.2+ab*.15;lR=-.2-ab*.15;kL=-.2-(1-ab)*.35;kR=.2+(1-ab)*.35}
 else if(m===1){var s2=Math.sin(Math.PI*p/2),s1=Math.sin(Math.PI*p);tilt=s2*.18;hip=-Math.abs(s1)*6;aL=2.3+s2*.9+.3*Math.sin(Math.PI*p*2);aR=-2.3+s2*.9-.3*Math.sin(Math.PI*p*2);eL=aL+.5*Math.sin(Math.PI*p*2);eR=aR-.5*Math.sin(Math.PI*p*2);lL=.15+s2*.3;lR=-.15+s2*.3;kL=-.1-Math.max(0,s2)*.4;kR=.1-Math.min(0,s2)*.4}
 else{var q=ROBOT[Math.floor(p*2)%4+0&3];hip=(Math.floor(p*2)%2)*-8;tilt=(Math.floor(p*2)%4-1.5)*.05;aL=q[0];aR=q[1];eL=aL+(Math.abs(q[0])>2?0:-.6);eR=aR+(Math.abs(q[1])>2?0:.6);lL=.2+(Math.floor(p*2)%2)*.12;lR=-.2-(Math.floor(p*2)%2)*.12;kL=q[2];kR=q[3]}
 return {hip:hip,tilt:tilt,aL:aL,aR:aR,eL:eL,eR:eR,lL:lL,lR:lR,kL:kL,kR:kR}}
var s=Stage(root,cv,function(s){var c=s.ctx,W=s.W,H=s.H,t=reduce?1.1:s.t/1000,b=t*112/60,floor=H*.82;c.clearRect(0,0,W,H);
 var pulse=Math.pow(1-((b%1)),3);c.strokeStyle='rgba(255,255,255,'+(.08+pulse*.22).toFixed(3)+')';c.lineWidth=2;c.beginPath();c.ellipse(W/2,floor+6,W*.46+pulse*14,22+pulse*5,0,0,6.283);c.stroke();
 c.fillStyle='rgba(255,255,255,.05)';c.beginPath();c.ellipse(W/2,floor+6,W*.46,22,0,0,6.283);c.fill();
 var gap=W/(F.length+.3);
 F.forEach(function(f,i){f.x=gap*(i+.65);var P=pose(f,b),hx=f.x,hy=floor-74+P.hip,sh=[hx+Math.sin(P.tilt)*38,hy-Math.cos(P.tilt)*38],head=[sh[0]+Math.sin(P.tilt)*18,sh[1]-Math.cos(P.tilt)*18];
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(hx,floor+6,24-(P.hip<-6?-P.hip*.4:0)*.2,5,0,0,6.283);c.fill();
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=f.col;c.lineWidth=9;
  var L1=limb(hx-5,hy,P.lL,32,P.lL+P.kL,30),L2=limb(hx+5,hy,P.lR,32,P.lR+P.kR,30);
  [L1,L2].forEach(function(l){c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.lineTo(l[4],l[5]);c.stroke()});
  c.beginPath();c.moveTo(hx,hy);c.lineTo(sh[0],sh[1]);c.lineWidth=12;c.stroke();
  c.lineWidth=7;var A1=limb(sh[0],sh[1]+2,P.aL,24,P.eL,22),A2=limb(sh[0],sh[1]+2,P.aR,24,P.eR,22);
  [A1,A2].forEach(function(l){c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.lineTo(l[4],l[5]);c.stroke()});
  c.fillStyle=f.col;c.beginPath();c.arc(head[0],head[1],12,0,6.283);c.fill();c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.arc(head[0]+3,head[1]-1,1.8,0,6.283);c.arc(head[0]+8,head[1]-1,1.8,0,6.283);c.fill();
  if(s.t-f.label<1100){var al=1-(s.t-f.label)/1100;c.fillStyle='rgba(255,255,255,'+al.toFixed(2)+')';c.font='700 12px system-ui,sans-serif';c.textAlign='center';c.fillText(MOVES[f.move],hx,floor+30)}});
 });
s.click=function(x){var bi=0,bd=1e9;F.forEach(function(f,i){var d=Math.abs(f.x-x);if(d<bd){bd=d;bi=i}});var f=F[bi];f.move=(f.move+1)%3;f.label=s.t};
})();`},

{id:'s-tween-modes',title:'Tween conflict modes',component:'Tween conflict modes',key:'tween-modes',family,width:780,
 description:'What happens when you click before the last move finished? Three lanes answer differently: replace it, queue it or blend it additively.',
 prompt:'Build a three-lane demo of tween conflict handling. Each lane is a track with a rounded marker and a left label (Replace, Queue, Blend). A click on any track sends the same new target x (as a fraction of track width) to all three lanes, leaving a fading ghost pin at that target. Lane rules: Replace cancels the running tween and starts a new one from the current position; Queue stores targets and runs them one after another, each 650ms; Blend adds a delta tween (target minus the sum of all pending end values) so overlapping moves are summed and the motion stays continuous. All use easeOutCubic over 650ms via a small requestAnimationFrame engine of tween objects {from, to, start, duration}. When idle the demo fires a rapid sequence of five targets every few seconds to show the difference, and a short caption under each lane explains its rule. Reduced motion jumps directly. Vanilla HTML, CSS and JavaScript.',
 css:`.tm{display:grid;gap:12px;padding:18px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.tm-lane{display:grid;grid-template-columns:90px 1fr;gap:12px;align-items:center}
.tm-lane b{font:800 14px/1.1 system-ui;color:var(--sc-fg)}.tm-lane b small{display:block;margin-top:4px;font:600 11px/1.3 system-ui;color:var(--sc-muted)}
.tm-track{position:relative;height:62px;border:1px solid var(--sc-line);border-radius:14px;background:var(--sc-bg);cursor:pointer;overflow:hidden}
.tm-track::before{content:"";position:absolute;left:14px;right:14px;top:50%;height:2px;margin-top:-1px;background:var(--sc-line)}
.tm-mk{position:absolute;left:0;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:var(--c,var(--sc-accent));box-shadow:0 8px 16px -6px var(--c,var(--sc-accent))}
.tm-pin{position:absolute;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;border:2px solid var(--sc-fg);opacity:.7;animation:tm-fade 1.4s ease-out forwards;pointer-events:none}
@keyframes tm-fade{to{opacity:0;transform:scale(2)}}
.tm-hint{text-align:center;font:600 12px/1 system-ui;color:var(--sc-muted)}
@media (prefers-reduced-motion:reduce){.tm-pin{animation:none;opacity:0}}`,
 html:`<div class="tm"><div class="tm-lane"><b>Replace<small>cancel and restart</small></b><div class="tm-track" data-l="0" role="button" tabindex="0" aria-label="Replace lane: click to set a target"><i class="tm-mk" style="--c:#ff6bb5"></i></div></div><div class="tm-lane"><b>Queue<small>one after another</small></b><div class="tm-track" data-l="1" role="button" tabindex="0" aria-label="Queue lane: click to set a target"><i class="tm-mk" style="--c:#6dd3ff"></i></div></div><div class="tm-lane"><b>Blend<small>add the moves together</small></b><div class="tm-track" data-l="2" role="button" tabindex="0" aria-label="Blend lane: click to set a target"><i class="tm-mk" style="--c:#ffd24d"></i></div></div><div class="tm-hint">Click any track quickly, several times in a row</div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tm'),tracks=[].slice.call(root.querySelectorAll('.tm-track'));
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,DUR=650,raf=0,visible=true,touched=false;
function ease(t){return 1-Math.pow(1-t,3)}
var L=tracks.map(function(t){return {el:t,mk:t.querySelector('.tm-mk'),pos:.08,tw:[],queue:[],base:.08,end:.08}});
function pins(f){tracks.forEach(function(t){var p=document.createElement('i');p.className='tm-pin';p.style.left=(14+f*(t.clientWidth-28))+'px';t.appendChild(p);setTimeout(function(){p.remove()},1500)})}
function send(f,now){f=Math.max(0,Math.min(1,f));pins(f);
 var r=L[0];if(reduce){L.forEach(function(l){l.pos=f;l.end=f});render();return}
 r.tw=[{from:r.pos,to:f,start:now,d:DUR}];r.end=f;
 var q=L[1];q.queue.push(f);
 var b=L[2];b.tw.push({from:0,to:f-b.end,start:now,d:DUR});b.end=f;
 go()}
function step(now){raf=0;var more=false;
 var r=L[0];if(r.tw.length){var t=r.tw[0],k=Math.min(1,(now-t.start)/t.d);r.pos=t.from+(t.to-t.from)*ease(k);if(k<1)more=true;else r.tw=[]}
 var q=L[1];if(!q.tw.length&&q.queue.length){q.tw=[{from:q.pos,to:q.queue.shift(),start:now,d:DUR}]}
 if(q.tw.length){var tq=q.tw[0],kq=Math.min(1,(now-tq.start)/tq.d);q.pos=tq.from+(tq.to-tq.from)*ease(kq);if(kq>=1){q.tw=[];if(q.queue.length)more=true}else more=true}else if(q.queue.length)more=true;
 var b=L[2];var sum=0,keep=[];b.tw.forEach(function(t){var k=Math.min(1,(now-t.start)/t.d);sum+=t.to*ease(k);if(k<1)keep.push(t);else b.base+=t.to});
 var done=b.tw.filter(function(t){return (now-t.start)/t.d>=1}).length;b.tw=keep;
 b.pos=b.base+sum*(1);if(keep.length)more=true;
 render();if(more&&visible)raf=requestAnimationFrame(step)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(step)}
function render(){L.forEach(function(l){var w=l.el.clientWidth-28;l.mk.style.transform='translateX('+(14+l.pos*w).toFixed(1)+'px)'})}
tracks.forEach(function(t){t.addEventListener('pointerdown',function(e){touched=true;var r=t.getBoundingClientRect();send((e.clientX-r.left-14)/(r.width-28),performance.now())});t.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();touched=true;send(Math.random(),performance.now())}})});
var seq=[.85,.2,.7,.35,.9],auto=0;function demo(){if(touched||document.hidden){auto=setTimeout(demo,3000);return}var i=0;(function fire(){if(touched)return;send(seq[i++],performance.now());if(i<seq.length)setTimeout(fire,260)})();auto=setTimeout(demo,5200)}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)go()}).observe(root);
render();if(!reduce)setTimeout(demo,900);addEventListener('resize',render);})();`},

{id:'s-text-replace',title:'Text replace',component:'Text replace',key:'text-replace',family,width:780,
 description:'Swap a phrase and only the letters that changed move: matching characters stay put while the rest roll out and in and the line resizes smoothly.',
 prompt:'Build a headline that replaces its text smartly. The headline is a row of slot spans (one per character, inline-block, overflow hidden, height 1.2em). Changing the phrase compares old and new character by character: unchanged slots stay still; changed slots roll the old glyph up and out while the new glyph rises in from below (WAAPI translateY 100% to 0, 420ms ease-out, stagger 28ms); extra slots grow from width 0 and removed slots shrink to 0 and are deleted; slot widths animate between the old and new glyph width, measured with a hidden measuring span using the same font. The phrase cycles through four lines every 2.4 seconds until the visitor types in the input (max 24 characters) and presses Replace or Enter. A live region (aria-live polite) mirrors the current phrase for assistive tech while the slots are aria-hidden. Reduced motion swaps instantly. Vanilla HTML, CSS and JavaScript.',
 css:`.tr{display:grid;gap:22px;place-items:center;height:300px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;padding:24px}
.tr-line{display:flex;font:900 clamp(34px,7vw,62px)/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;color:var(--sc-fg);white-space:pre;min-height:1.2em}
.tr-s{display:inline-block;overflow:hidden;height:1.2em;position:relative;white-space:pre}
.tr-s i{display:block;font-style:normal;position:absolute;left:0;top:0;white-space:pre;will-change:transform}
.tr-s i.k{position:relative}
.tr-m{position:absolute;visibility:hidden;white-space:pre;font:inherit;pointer-events:none}
.tr-f{display:flex;gap:8px}
.tr-f input{width:220px;padding:10px 14px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);color:var(--sc-fg);font:600 14px/1 system-ui}
.tr-f input:focus-visible{outline:2px solid var(--sc-ring);outline-offset:2px}
.tr-f button{padding:10px 16px;border:0;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);font:700 14px/1 system-ui;cursor:pointer}`,
 html:`<div class="tr"><div class="tr-line" aria-hidden="true"></div><span class="tr-live" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" aria-live="polite"></span><form class="tr-f"><input type="text" maxlength="24" placeholder="Type a new phrase" aria-label="New headline text"><button type="submit">Replace</button></form></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tr'),line=root.querySelector('.tr-line'),live=root.querySelector('.tr-live'),form=root.querySelector('.tr-f'),inp=form.querySelector('input');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,P=['Design in motion','Ship with feeling','Polish every frame','Make it move'],pi=0,cur=[],touched=false,meas=document.createElement('span');meas.className='tr-m';line.appendChild(meas);
var EASE='cubic-bezier(.2,.9,.25,1)';
function w(ch){meas.textContent=ch;return meas.getBoundingClientRect().width}
function slot(ch,grow){var s=document.createElement('span');s.className='tr-s';var g=document.createElement('i');g.className='k';g.textContent=ch;s.appendChild(g);var cw=w(ch);s.style.width=cw+'px';line.appendChild(s);return {el:s,g:g,ch:ch,w:cw}}
function set(txt){live.textContent=txt;var nw=txt.split(''),n=Math.max(nw.length,cur.length),out=[];
 if(!cur.length){nw.forEach(function(ch){out.push(slot(ch))});cur=out;return}
 for(var i=0;i<n;i++){var o=cur[i],ch=nw[i];
  if(o&&ch!==undefined){if(o.ch===ch){out.push(o);continue}
   var nwid=w(ch),ng=document.createElement('i');ng.textContent=ch;o.el.appendChild(ng);ng.style.position='absolute';
   if(reduce){o.g.textContent=ch;o.g.style.transform='';ng.remove();o.el.style.width=nwid+'px';o.ch=ch;o.w=nwid;out.push(o);continue}
   var old=o.g,dl=i*28;old.style.position='absolute';
   old.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-100%)',opacity:0}],{duration:420,delay:dl,easing:EASE,fill:'both'}).onfinish=function(){this.effect.target.remove()};
   ng.animate([{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:420,delay:dl,easing:EASE,fill:'both'}).onfinish=(function(g,s){return function(){g.style.position='relative';g.className='k';g.getAnimations().forEach(function(a){a.cancel()})}})(ng,o.el);
   o.el.animate([{width:o.w+'px'},{width:nwid+'px'}],{duration:420,delay:dl,easing:EASE,fill:'forwards'});
   o.g=ng;o.ch=ch;o.w=nwid;out.push(o)}
  else if(!o&&ch!==undefined){var ns=slot(ch);if(!reduce){ns.el.animate([{width:'0px'},{width:ns.w+'px'}],{duration:420,delay:i*28,easing:EASE});ns.g.animate([{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:420,delay:i*28,easing:EASE,fill:'backwards'})}out.push(ns)}
  else if(o&&ch===undefined){(function(o){if(reduce){o.el.remove();return}o.el.animate([{width:o.w+'px',opacity:1},{width:'0px',opacity:0}],{duration:360,easing:EASE,fill:'forwards'}).onfinish=function(){o.el.remove()}})(o)}}
 cur=out}
function cycle(){if(!touched&&!document.hidden){pi=(pi+1)%P.length;set(P[pi])}setTimeout(cycle,2400)}
form.addEventListener('submit',function(e){e.preventDefault();var v=inp.value.trim();if(!v)return;touched=true;set(v)});
inp.addEventListener('focus',function(){touched=true});
set(P[0]);if(!reduce)setTimeout(cycle,2000);})();`},

{id:'s-split-explorer',title:'Split explorer',component:'Split explorer',key:'split-explorer',family,width:780,
 description:'Break a paragraph into characters, words or lines and see exactly how each piece is boxed, counted and staggered into place.',
 prompt:'Build a text-splitting explorer. A segmented radio control (Characters, Words, Lines) sits above a paragraph of about 30 words in a card. Choosing a mode rebuilds the paragraph into spans: Characters wraps every non-space character in an inline-block span, Words wraps each word, Lines first wraps each word, measures offsetTop to group words into rendered lines and wraps each line in a block span with overflow hidden and an inner span. Pieces get a dashed accent outline and a faint tint so the structure is visible, and a count chip reads like "126 characters". On every change the pieces stagger in with WAAPI (translateY 60% and opacity 0 to rest, 460ms, delay index * total/count with total 900ms). The real text stays available to assistive tech through an aria-label on the paragraph and aria-hidden spans. Lines rebuild on resize. The mode cycles automatically every 3.2 seconds until the visitor uses the control. Reduced motion skips the stagger. Vanilla HTML, CSS and JavaScript.',
 css:`.sx{display:grid;gap:18px;padding:22px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.sx-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sx-seg{display:inline-flex;padding:4px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg)}
.sx-seg label{position:relative;cursor:pointer}.sx-seg input{position:absolute;opacity:0}
.sx-seg span{display:block;padding:8px 14px;border-radius:999px;font:700 13px/1 system-ui;color:var(--sc-muted);transition:background .2s,color .2s}
.sx-seg input:checked+span{background:var(--sc-accent);color:var(--sc-accent-fg)}
.sx-seg input:focus-visible+span{outline:2px solid var(--sc-ring);outline-offset:2px}
.sx-chip{padding:7px 12px;border-radius:999px;background:var(--sc-bg);border:1px solid var(--sc-line);font:700 12px/1 ui-monospace,monospace;color:var(--sc-fg)}
.sx-p{margin:0;min-height:196px;font:700 27px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em;color:var(--sc-fg)}
.sx-p .u{display:inline-block;white-space:pre;outline:1px dashed color-mix(in srgb,var(--sc-accent) 75%,transparent);outline-offset:1px;background:color-mix(in srgb,var(--sc-accent) 9%,transparent);border-radius:3px}
.sx-p .ln{display:block;overflow:hidden;outline:1px dashed color-mix(in srgb,var(--sc-accent) 75%,transparent);outline-offset:-1px;background:color-mix(in srgb,var(--sc-accent) 9%,transparent)}
.sx-p .ln>span{display:block;white-space:nowrap}`,
 html:`<div class="sx"><div class="sx-top"><div class="sx-seg" role="radiogroup" aria-label="Split mode"><label><input type="radio" name="sx-m" value="chars" checked><span>Characters</span></label><label><input type="radio" name="sx-m" value="words"><span>Words</span></label><label><input type="radio" name="sx-m" value="lines"><span>Lines</span></label></div><span class="sx-chip" aria-live="polite"></span></div><p class="sx-p" aria-label="Great motion begins with great structure. Split the words, the letters or the lines and every piece becomes a small actor of its own."></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sx'),p=root.querySelector('.sx-p'),chip=root.querySelector('.sx-chip'),radios=[].slice.call(root.querySelectorAll('input[name=sx-m]'));
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,TXT=p.getAttribute('aria-label'),mode='chars',touched=false,idx=0;
function clear(){while(p.firstChild)p.removeChild(p.firstChild)}
function stagger(pcs){if(reduce)return;var n=pcs.length;pcs.forEach(function(e,i){e.animate([{transform:'translateY(60%)',opacity:0},{transform:'none',opacity:1}],{duration:460,delay:i*Math.min(40,900/n),easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'})})}
function build(){clear();var pcs=[],unit='';
 var words=TXT.split(' ');
 if(mode==='chars'){words.forEach(function(w,wi){var g=document.createElement('span');g.style.display='inline-block';g.style.whiteSpace='nowrap';g.setAttribute('aria-hidden','true');for(var i=0;i<w.length;i++){var s=document.createElement('span');s.className='u';s.textContent=w.charAt(i);g.appendChild(s);pcs.push(s)}p.appendChild(g);if(wi<words.length-1)p.appendChild(document.createTextNode(' '))});unit='characters';chip.textContent=pcs.length+' characters'}
 else if(mode==='words'){words.forEach(function(w,wi){var s=document.createElement('span');s.className='u';s.setAttribute('aria-hidden','true');s.textContent=w;p.appendChild(s);pcs.push(s);if(wi<words.length-1)p.appendChild(document.createTextNode(' '))});chip.textContent=pcs.length+' words'}
 else{var ws=[];words.forEach(function(w,wi){var s=document.createElement('span');s.textContent=w;s.style.display='inline-block';s.setAttribute('aria-hidden','true');p.appendChild(s);ws.push(s);if(wi<words.length-1)p.appendChild(document.createTextNode(' '))});
  var groups=[],lastTop=null;ws.forEach(function(s){var t=s.offsetTop;if(lastTop===null||Math.abs(t-lastTop)>6){groups.push([]);lastTop=t}groups[groups.length-1].push(s.textContent)});
  clear();groups.forEach(function(g){var ln=document.createElement('span');ln.className='ln';ln.setAttribute('aria-hidden','true');var inner=document.createElement('span');inner.textContent=g.join(' ');ln.appendChild(inner);p.appendChild(ln);pcs.push(inner)});chip.textContent=pcs.length+' lines'}
 stagger(pcs)}
function setMode(m){mode=m;radios.forEach(function(r){r.checked=r.value===m});build()}
radios.forEach(function(r){r.addEventListener('change',function(){touched=true;setMode(r.value)})});
function cycle(){if(!touched&&!document.hidden){idx=(idx+1)%3;setMode(['chars','words','lines'][idx])}setTimeout(cycle,3200)}
if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){var w=p.clientWidth;if(w&&lw&&w!==lw&&mode==='lines')build();lw=w}).observe(p)}
build();if(!reduce)setTimeout(cycle,3000);})();`},

{id:'s-timeline-sequencer',title:'Timeline sequencer',component:'Timeline sequencer',key:'timeline-sequencer',family,width:780,
 description:'A mini animation timeline: drag clips to retime them, stretch their ends, scrub the playhead and watch the stage obey every change.',
 prompt:'Build a compact timeline sequencer (6 second loop). Top: a stage (150px) with four elements - a square that slides right while rotating, a circle that scales up and fades in, a bold word that rises from below and a progress bar that fills. Below: a ruler with second ticks and four tracks, each holding one clip (a button) positioned by start and length in seconds (starting at 0.3s/1.8s, 1.2s/1.6s, 2.4s/1.5s, 3.4s/2.2s). Clips can be dragged to move, stretched from a right-edge handle (min 0.4s), and moved with arrow keys (0.1s, shift for 0.5s) or resized with Alt+arrows. The playhead is a vertical line; dragging the ruler scrubs time; Play/Pause toggles autoplay with a looping time display. For each clip progress p = clamp((t - start) / length) eased with easeInOutCubic; before the clip the element sits at its start state and after it at its end state. Snapping to 0.05s. Vanilla HTML, CSS and JavaScript.',
 css:`.tq{display:grid;gap:12px;padding:16px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);user-select:none}
.tq-stage{position:relative;height:150px;border-radius:16px;background:var(--sc-bg);border:1px solid var(--sc-line);overflow:hidden}
.tq-box{position:absolute;left:18px;top:18px;width:36px;height:36px;border-radius:9px;background:#ff6bb5}
.tq-dot{position:absolute;right:90px;top:20px;width:54px;height:54px;border-radius:50%;background:#6dd3ff}
.tq-word{position:absolute;left:50%;bottom:16px;margin-left:-70px;width:140px;text-align:center;font:900 30px/1 system-ui;color:var(--sc-fg);letter-spacing:-.03em}
.tq-bar{position:absolute;left:18px;right:18px;bottom:8px;height:5px;border-radius:5px;background:var(--sc-line)}.tq-bar i{display:block;height:100%;width:0;border-radius:5px;background:#ffd24d}
.tq-bar{bottom:0;left:0;right:0;border-radius:0}
.tq-ctl{display:flex;align-items:center;gap:10px}
.tq-play{padding:8px 14px;border:0;border-radius:999px;background:var(--sc-fg);color:var(--sc-bg);font:700 13px/1 system-ui;cursor:pointer}
.tq-time{font:700 13px/1 ui-monospace,monospace;color:var(--sc-fg)}
.tq-hint{margin-left:auto;font:600 11px/1 system-ui;color:var(--sc-muted)}
.tq-tl{position:relative;margin-left:64px}
.tq-ruler{position:relative;height:24px;border-bottom:1px solid var(--sc-line);cursor:ew-resize}
.tq-ruler b{position:absolute;top:6px;font:600 10px/1 ui-monospace,monospace;color:var(--sc-muted);transform:translateX(-50%)}
.tq-ruler i{position:absolute;bottom:0;width:1px;height:6px;background:var(--sc-line)}
.tq-row{position:relative;height:32px;border-bottom:1px dashed var(--sc-line)}
.tq-row>em{position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);font:700 11px/1 system-ui;font-style:normal;color:var(--sc-muted);white-space:nowrap}
.tq-clip{position:absolute;top:4px;height:24px;padding:0 10px;border:0;border-radius:7px;background:var(--c);color:#111;font:800 11px/24px system-ui;text-align:left;cursor:grab;overflow:hidden;white-space:nowrap;touch-action:none}
.tq-clip:focus-visible{outline:2px solid var(--sc-fg);outline-offset:2px}
.tq-clip s{position:absolute;right:0;top:0;bottom:0;width:9px;cursor:ew-resize;background:rgba(0,0,0,.25);text-decoration:none}
.tq-ph{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--sc-fg);pointer-events:none;z-index:5}
.tq-ph::before{content:"";position:absolute;top:-1px;left:-5px;border:6px solid transparent;border-top-color:var(--sc-fg)}
@media (max-width:640px){.tq-tl{margin-left:0}.tq-row>em{display:none}}`,
 html:`<div class="tq"><div class="tq-stage"><div class="tq-box"></div><div class="tq-dot"></div><div class="tq-word">RISE</div><div class="tq-bar"><i></i></div></div><div class="tq-ctl"><button class="tq-play" type="button">Pause</button><span class="tq-time">0.00s</span><span class="tq-hint">Drag clips, pull their edge, click the ruler</span></div><div class="tq-tl"><div class="tq-ruler" aria-label="Timeline ruler: drag to scrub"></div><div class="tq-rows"></div><div class="tq-ph"></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.tq'),tl=root.querySelector('.tq-tl'),ruler=root.querySelector('.tq-ruler'),rows=root.querySelector('.tq-rows'),ph=root.querySelector('.tq-ph'),tm=root.querySelector('.tq-time'),pb=root.querySelector('.tq-play'),stage=root.querySelector('.tq-stage');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,T=6,t=1.4,playing=!reduce,raf=0,last=0,visible=true;
var els={box:root.querySelector('.tq-box'),dot:root.querySelector('.tq-dot'),word:root.querySelector('.tq-word'),bar:root.querySelector('.tq-bar i')};
var CL=[{k:'box',n:'Slide',s:.3,l:1.8,c:'#ff6bb5'},{k:'dot',n:'Pop',s:1.2,l:1.6,c:'#6dd3ff'},{k:'word',n:'Rise',s:2.4,l:1.5,c:'#b9a6ff'},{k:'bar',n:'Fill',s:3.4,l:2.2,c:'#ffd24d'}];
function eio(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function W(){return tl.clientWidth}
function snap(v){return Math.round(v/.05)*.05}
for(var i=0;i<=T;i++){var tk=document.createElement('i');tk.style.left=(i/T*100)+'%';ruler.appendChild(tk);var lb=document.createElement('b');lb.style.left=(i/T*100)+'%';lb.textContent=i+'s';ruler.appendChild(lb)}
CL.forEach(function(c,i){var r=document.createElement('div');r.className='tq-row';var em=document.createElement('em');em.textContent=c.n;r.appendChild(em);var b=document.createElement('button');b.type='button';b.className='tq-clip';b.style.setProperty('--c',c.c);b.setAttribute('aria-label',c.n+' clip, starts '+c.s+' seconds, lasts '+c.l+' seconds. Arrow keys move it, Alt plus arrows resize it.');var h=document.createElement('s');h.setAttribute('aria-hidden','true');b.appendChild(document.createTextNode(c.n));b.appendChild(h);r.appendChild(b);rows.appendChild(r);c.el=b;c.h=h;
 var mode=0,sx=0,s0=0,l0=0;
 b.addEventListener('pointerdown',function(e){mode=e.target===h?2:1;sx=e.clientX;s0=c.s;l0=c.l;b.setPointerCapture(e.pointerId);playing=false;pb.textContent='Play';e.preventDefault()});
 b.addEventListener('pointermove',function(e){if(!mode)return;var dt=(e.clientX-sx)/W()*T;if(mode===1)c.s=Math.max(0,Math.min(T-c.l,snap(s0+dt)));else c.l=Math.max(.4,Math.min(T-c.s,snap(l0+dt)));place();draw()});
 function up(){mode=0}b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
 b.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();var st=e.shiftKey?.5:.1;if(e.altKey)c.l=Math.max(.4,Math.min(T-c.s,snap(c.l+d*st)));else c.s=Math.max(0,Math.min(T-c.l,snap(c.s+d*st)));place();draw()})});
function place(){CL.forEach(function(c){c.el.style.left=(c.s/T*100)+'%';c.el.style.width=(c.l/T*100)+'%'})}
function prog(c){return eio(Math.max(0,Math.min(1,(t-c.s)/c.l)))}
function draw(){var sw=stage.clientWidth,p0=prog(CL[0]),p1=prog(CL[1]),p2=prog(CL[2]),p3=prog(CL[3]);
 els.box.style.transform='translateX('+(p0*(sw-90))+'px) rotate('+(p0*180)+'deg)';
 els.dot.style.transform='scale('+(.15+p1*.85)+')';els.dot.style.opacity=(p1*.9+.1).toFixed(2);
 els.word.style.transform='translateY('+((1-p2)*50)+'px)';els.word.style.opacity=p2.toFixed(2);
 els.bar.style.width=(p3*100)+'%';
 ph.style.left=(t/T*100)+'%';tm.textContent=t.toFixed(2)+'s'}
function frame(now){raf=0;if(playing){var dt=Math.min(.05,(now-(last||now))/1000);last=now;t+=dt;if(t>T+.3)t=0}else last=0;draw();if(visible&&(playing))raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function scrub(e){var r=tl.getBoundingClientRect();t=Math.max(0,Math.min(T,(e.clientX-r.left)/r.width*T));playing=false;pb.textContent='Play';draw()}
var dragging=false;ruler.addEventListener('pointerdown',function(e){dragging=true;ruler.setPointerCapture(e.pointerId);scrub(e)});ruler.addEventListener('pointermove',function(e){if(dragging)scrub(e)});ruler.addEventListener('pointerup',function(){dragging=false});
pb.addEventListener('click',function(){playing=!playing;pb.textContent=playing?'Pause':'Play';if(playing){if(t>=T)t=0;go()}else draw()});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if('ResizeObserver' in window)new ResizeObserver(function(){draw()}).observe(root);
pb.textContent=playing?'Pause':'Play';place();draw();go();})();`},

{id:'s-anchor-scroll',title:'Anchor scroll spy',component:'Anchor scroll spy',key:'anchor-scroll',family,width:780,
 description:'A sticky pill nav that eases the page to each section with a custom curve, while a sliding indicator tracks whichever section is in view.',
 prompt:'Build a scroll-to-anchors pattern. A scrollable panel (380px tall) has a sticky nav of five pill buttons (Intro, Craft, Motion, Detail, Finish) with a sliding indicator pill behind the active one, and five full-height coloured sections (each 380px with a big index, a heading and a line of text and a decorative shape that moves with a small parallax). Clicking a pill runs a custom scrollTo tween with easeInOutCubic over 900ms using requestAnimationFrame on the panel (not scroll-behavior), cancelled if the visitor uses the wheel or touch. A scroll spy updates the active pill from the scroll position (section nearest the top plus 40px) and moves the indicator with transform and width transitions. The panel tours the sections automatically every 2.6 seconds until the visitor interacts. Pills are real buttons with aria-current on the active one. Reduced motion jumps without easing. Vanilla HTML, CSS and JavaScript.',
 css:`.as2{position:relative;border:1px solid var(--sc-line);border-radius:28px;overflow:hidden;background:var(--sc-surface)}
.as2-box{height:380px;overflow:auto;scrollbar-width:none}.as2-box::-webkit-scrollbar{display:none}
.as2-nav{position:sticky;top:14px;z-index:10;display:flex;gap:2px;width:max-content;max-width:calc(100% - 28px);margin:14px auto 0;padding:4px;border-radius:999px;background:rgba(20,20,28,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);overflow:hidden}
.as2-ind{position:absolute;top:4px;bottom:4px;left:0;border-radius:999px;background:#fff;transition:transform .45s cubic-bezier(.3,1.2,.4,1),width .45s cubic-bezier(.3,1.2,.4,1)}
.as2-nav button{position:relative;z-index:1;padding:8px 14px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.8);font:700 13px/1 system-ui;cursor:pointer;transition:color .25s}
.as2-nav button[aria-current=true]{color:#111}
.as2-sec{position:relative;height:380px;display:grid;align-content:center;justify-items:start;gap:8px;padding-left:60px;color:#fff;overflow:hidden}
.as2-nav+.as2-sec{margin-top:-52px;padding-top:52px}
.as2-sec b{font:900 80px/1 system-ui;letter-spacing:-.05em;opacity:.95}.as2-sec h3{margin:0;font:800 28px/1.1 system-ui}.as2-sec p{margin:0;max-width:34ch;font:500 15px/1.5 system-ui;opacity:.85}
.as2-sh{position:absolute;right:8%;top:30%;width:150px;height:150px;border-radius:38% 62% 55% 45%;background:rgba(255,255,255,.2);will-change:transform}`,
 html:`<div class="as2"><div class="as2-box" tabindex="0" role="region" aria-label="Sections with anchor navigation"><nav class="as2-nav" aria-label="Sections"><i class="as2-ind"></i></nav></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.as2'),box=root.querySelector('.as2-box'),nav=root.querySelector('.as2-nav'),ind=root.querySelector('.as2-ind');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,S=[['Intro','#6d5ef5','Start with intent'],['Craft','#e0457b','Shape every detail'],['Motion','#f08a3c','Let it flow'],['Detail','#1f9d8b','Mind the edges'],['Finish','#2f6fe0','Land it softly']],B=[],SEC=[],SH=[],active=-1,tw=0,auto=!reduce,touched=false;
S.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=s[0];nav.appendChild(b);B.push(b);b.addEventListener('click',function(){stopAuto();to(i)});
 var sec=document.createElement('section');sec.className='as2-sec';sec.style.background='linear-gradient(150deg,'+s[1]+',color-mix(in srgb,'+s[1]+' 55%,#000))';var n=document.createElement('b');n.textContent='0'+(i+1);var h=document.createElement('h3');h.textContent=s[2];var p=document.createElement('p');p.textContent='Section '+(i+1)+' of 5: '+s[0].toLowerCase()+' is where the page settles for a moment.';var sh=document.createElement('i');sh.className='as2-sh';sec.appendChild(sh);sec.appendChild(n);sec.appendChild(h);sec.appendChild(p);box.appendChild(sec);SEC.push(sec);SH.push(sh)});
function top(i){return SEC[i].offsetTop+(i?52:0)-(i?52:0)}
function to(i){cancelAnimationFrame(tw);var from=box.scrollTop,dest=Math.min(SEC[i].offsetTop-0,box.scrollHeight-box.clientHeight),dur=reduce?1:900,t0=0;if(reduce){box.scrollTop=dest;return}
 function st(now){if(!t0)t0=now;var k=Math.min(1,(now-t0)/dur),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;box.scrollTop=from+(dest-from)*e;if(k<1)tw=requestAnimationFrame(st)}tw=requestAnimationFrame(st)}
function spy(){var y=box.scrollTop+40,idx=0;SEC.forEach(function(s,i){if(s.offsetTop<=y+26)idx=i});if(idx!==active){active=idx;B.forEach(function(b,i){if(i===idx)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});var bb=B[idx];ind.style.width=bb.offsetWidth+'px';ind.style.transform='translateX('+(bb.offsetLeft)+'px)'}
 var vh=box.clientHeight;SH.forEach(function(sh,i){var d=(SEC[i].offsetTop-box.scrollTop)/vh;sh.style.transform=reduce?'none':'translateY('+(d*40).toFixed(1)+'px) rotate('+(d*30).toFixed(1)+'deg)'})}
function stopAuto(){auto=false;touched=true}
['wheel','touchstart','pointerdown','keydown'].forEach(function(e){box.addEventListener(e,function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('.as2-nav'))return;cancelAnimationFrame(tw);stopAuto()},{passive:true})});
box.addEventListener('scroll',spy,{passive:true});
var ai=0;function tour(){if(auto&&!document.hidden){ai=(ai+1)%S.length;to(ai)}setTimeout(tour,2600)}
requestAnimationFrame(function(){spy()});if(!reduce)setTimeout(tour,2200);addEventListener('resize',spy);})();`},

{id:'s-disintegrate',title:'Disintegrate image',component:'Disintegrate image',key:'disintegrate',family,width:780,
 description:'An image breaks into thousands of tiny squares that drift away on the wind and fade, then flies back together on the next click.',
 prompt:'Build a canvas image that disintegrates. Draw a generated artwork (520x300) to an offscreen canvas and read its ImageData. Create one particle per 4x4 block (about 9,750). Each particle stores its block colour, home position, a random delay (0.55 * x / width + 0.25 * random, in seconds), a drift vector (dx 70 to 190 right, dy from -90 to 40) and a spin. A state machine with forward (dissolve) and backward (assemble) runs over 2 seconds using time since the last click: progress per particle k = clamp((t - delay) / 1.1) eased with easeInOutCubic; position = home + drift * k, alpha = 1 - k. Composite each frame into one Uint32 buffer and put it with putImageData (do not draw 10,000 rectangles). Click or tap toggles between dissolve and assemble; the demo plays automatically every 2.6 seconds until the first click. A caption reads Click to snap. Pause off-screen; reduced motion fades the image with a simple opacity change. Vanilla HTML, CSS and JavaScript.',
 css:`.dg{position:relative;display:grid;place-items:center;height:380px;border-radius:28px;overflow:hidden;border:1px solid var(--sc-line);background:var(--sc-surface);cursor:pointer}
.dg canvas{width:min(94%,520px);aspect-ratio:520/300;display:block;border-radius:14px;image-rendering:auto}
.dg-cap{position:absolute;left:0;right:0;bottom:14px;text-align:center;font:700 12px/1 ui-monospace,monospace;color:var(--sc-muted);letter-spacing:.06em}`,
 html:`<div class="dg" role="button" tabindex="0" aria-label="Picture that disintegrates and reassembles; press to toggle"><canvas width="520" height="300"></canvas><div class="dg-cap">CLICK TO SNAP</div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.dg'),cv=root.querySelector('canvas'),cx=cv.getContext('2d');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,W=520,H=300,B=4,N=0,src,P=[],buf,out,img,state=0,t0=0,raf=0,visible=true,touched=false,lastAuto=0;
function prep(){var s=art(2,W,H),sc=document.createElement('canvas');sc.width=W;sc.height=H;var x=sc.getContext('2d');x.drawImage(s,0,0);src=x.getImageData(0,0,W,H);var u=new Uint32Array(src.data.buffer);P=[];
 for(var by=0;by<H;by+=B)for(var bx=0;bx<W;bx+=B){var c=u[(by+1)*W+bx+1];P.push({x:bx,y:by,c:c,d:.55*bx/W+.25*Math.random(),dx:70+Math.random()*120,dy:-90+Math.random()*130,sp:0})}
 img=cx.createImageData(W,H);out=new Uint32Array(img.data.buffer);N=P.length}
function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2}
function render(now){var el=(now-t0)/1000,fw=state===1;out.fill(0);
 for(var i=0;i<N;i++){var p=P[i],k=Math.max(0,Math.min(1,(el-p.d)/1.1));if(!fw)k=1-k;if(state===0&&t0===0)k=0;k=ease(k);var a=Math.round((1-k)*255);if(a<=0)continue;
  var x=Math.round(p.x+p.dx*k+Math.sin(p.d*40)*k*10),y=Math.round(p.y+p.dy*k);
  var col=((p.c&0x00ffffff)|(a<<24))>>>0;
  for(var yy=0;yy<B;yy++){var Y=y+yy;if(Y<0||Y>=H)continue;for(var xx=0;xx<B;xx++){var X=x+xx;if(X<0||X>=W)continue;out[Y*W+X]=col}}}
 cx.putImageData(img,0,0)}
function frame(now){raf=0;if(!touched&&!reduce&&now-lastAuto>2600){lastAuto=now;toggle(now)}render(now);if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function toggle(now){state=state===1?2:1;t0=now||performance.now();if(reduce){render(t0+2500)}}
function go(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function press(){touched=true;toggle(performance.now());go();if(reduce){cv.style.opacity=state===1?.15:1}}
root.addEventListener('pointerdown',press);root.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();press()}});
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
prep();t0=0;lastAuto=performance.now()-1200;render(0);go();})();`},

{id:'s-shine-buttons',title:'Shine buttons',component:'Shine buttons',key:'shine-buttons',family,width:780,
 description:'Four buttons, four kinds of light: a sweeping glint, a pointer-chasing specular highlight, a rotating brushed-metal sheen and shimmering type.',
 prompt:'Build a row of four large buttons that each use light differently. 1) Glint: a skewed white gradient bar sweeps across on hover and once every 3.5 seconds on its own. 2) Specular: a glossy dark button with a radial highlight positioned at the pointer through CSS variables --mx and --my, drifting on a slow loop when the pointer is not over it. 3) Metal: a brushed silver conic-gradient surface whose start angle follows the pointer angle around the button centre (--a), with dark text and an inner bevel. 4) Shimmer: transparent button with a gradient-clipped text (background-clip text) that scrolls, plus a border drawn with a moving linear gradient. Pointer tracking is done with one pointermove per button updating custom properties; idle motion uses requestAnimationFrame with Lissajous values. All are real buttons with visible focus rings and a pressed scale. Reduced motion freezes the highlights at a flattering position. Vanilla HTML, CSS and JavaScript.',
 css:`.sb{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center;min-height:300px;padding:32px;border:1px solid var(--sc-line);border-radius:28px;background:radial-gradient(100% 100% at 50% 0%,#232038,#0c0b14)}
.sb button{position:relative;min-width:150px;padding:18px 28px;border:0;border-radius:16px;font:800 16px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;overflow:hidden;transition:transform .15s}
.sb button:active{transform:scale(.96)}
.sb button:focus-visible{outline:2px solid #fff;outline-offset:3px}
.sb-1{background:linear-gradient(135deg,#6d5ef5,#9b5cf6);color:#fff}
.sb-1::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-60%;width:36%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);transform:skewX(-22deg);animation:sb-glint 3.5s ease-in-out infinite}
.sb-1:hover::after{animation:sb-glint .8s ease-in-out}
@keyframes sb-glint{0%,55%{left:-60%}100%{left:130%}}
.sb-2{background:radial-gradient(120px 90px at var(--mx,50%) var(--my,30%),rgba(255,255,255,.55),transparent 60%),linear-gradient(180deg,#34304d,#14121f);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -2px 6px rgba(0,0,0,.5),0 12px 24px -12px rgba(0,0,0,.8)}
.sb-3{background:conic-gradient(from var(--a,0deg),#f4f6fa,#a8b0bf,#eef1f6,#7d8699,#f4f6fa,#b8bfcd,#eef1f6,#f4f6fa);color:#1a1d26;box-shadow:inset 0 2px 1px rgba(255,255,255,.9),inset 0 -3px 4px rgba(0,0,0,.25),0 12px 24px -12px rgba(0,0,0,.8)}
.sb-4{background:linear-gradient(#100f1a,#100f1a) padding-box,linear-gradient(var(--a,0deg),#ff6bb5,#6dd3ff,#ffd24d,#ff6bb5) border-box;border:2px solid transparent;color:transparent}
.sb-4 span{background:linear-gradient(90deg,#fff 0%,#ff6bb5 25%,#6dd3ff 50%,#ffd24d 75%,#fff 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:sb-shim 3s linear infinite}
@keyframes sb-shim{to{background-position:-250% 0}}
@media (prefers-reduced-motion:reduce){.sb-1::after,.sb-4 span{animation:none}.sb-1::after{left:70%}}`,
 html:`<div class="sb"><button class="sb-1" type="button">Glint</button><button class="sb-2" type="button">Specular</button><button class="sb-3" type="button">Metal</button><button class="sb-4" type="button"><span>Shimmer</span></button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.sb'),b2=root.querySelector('.sb-2'),b3=root.querySelector('.sb-3'),b4=root.querySelector('.sb-4');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,hover={2:false,3:false,4:false},raf=0,visible=true;
function hook(b,k,fn){b.addEventListener('pointerenter',function(){hover[k]=true});b.addEventListener('pointerleave',function(){hover[k]=false});b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();fn(e.clientX-r.left,e.clientY-r.top,r)})}
hook(b2,2,function(x,y){b2.style.setProperty('--mx',x+'px');b2.style.setProperty('--my',y+'px')});
hook(b3,3,function(x,y,r){var a=Math.atan2(y-r.height/2,x-r.width/2)*180/Math.PI+90;b3.style.setProperty('--a',a.toFixed(1)+'deg')});
hook(b4,4,function(x,y,r){var a=Math.atan2(y-r.height/2,x-r.width/2)*180/Math.PI+90;b4.style.setProperty('--a',a.toFixed(1)+'deg')});
function frame(now){raf=0;var t=now/1000;
 if(!hover[2]){b2.style.setProperty('--mx',(50+38*Math.sin(t*.8))+'%');b2.style.setProperty('--my',(34+22*Math.sin(t*1.3+1))+'%')}
 if(!hover[3])b3.style.setProperty('--a',((t*40)%360).toFixed(1)+'deg');
 if(!hover[4])b4.style.setProperty('--a',((t*90)%360).toFixed(1)+'deg');
 if(visible&&!reduce)raf=requestAnimationFrame(frame)}
function go(){if(!raf&&visible&&!reduce)raf=requestAnimationFrame(frame)}
if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;go()}).observe(root);
if(reduce){b2.style.setProperty('--mx','40%');b2.style.setProperty('--my','28%');b3.style.setProperty('--a','40deg')}go();})();`}
];
