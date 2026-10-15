// Original micro-interactions and cursor effects. Plain HTML, CSS and a little JavaScript.
const family='Micro-interactions',cursor='Hover & cursor effects';
export const micro=[
{id:'s-squish-switch',title:'Squish switch',component:'Squish switch',key:'squish-switch',family,width:460,
 description:'A toggle whose knob squashes while pressed and springs into place.',
 prompt:'Build an accessible toggle switch (role="switch" on a real button, aria-checked). The knob squashes horizontally while pressed and settles with an overshooting spring curve when released; the track colour fades to the accent colour when on. Show three switches with labels. Support keyboard (Space/Enter) and reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.qs{display:grid;gap:16px}
.qs-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 18px;border:1px solid var(--sc-line);border-radius:16px;background:var(--sc-surface)}
.qs-row span{font-size:15px}
.qs-sw{position:relative;width:58px;height:34px;padding:0;border:0;border-radius:999px;background:var(--sc-line);cursor:pointer;transition:background .3s}
.qs-sw[aria-checked=true]{background:var(--sc-accent)}
.qs-knob{position:absolute;top:4px;left:4px;width:26px;height:26px;border-radius:999px;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.3);transition:transform .45s cubic-bezier(.34,1.7,.5,1),width .2s}
.qs-sw[aria-checked=true] .qs-knob{transform:translateX(24px)}
.qs-sw:active .qs-knob{width:34px}.qs-sw[aria-checked=true]:active .qs-knob{transform:translateX(16px)}`,
 html:`<div class="qs"><label class="qs-row"><span>Notifications</span><button class="qs-sw" role="switch" aria-checked="true" aria-label="Notifications"><i class="qs-knob"></i></button></label><label class="qs-row"><span>Dark mode</span><button class="qs-sw" role="switch" aria-checked="false" aria-label="Dark mode"><i class="qs-knob"></i></button></label><label class="qs-row"><span>Auto-save</span><button class="qs-sw" role="switch" aria-checked="true" aria-label="Auto-save"><i class="qs-knob"></i></button></label></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling;
root.querySelectorAll('.qs-sw').forEach(function(sw){sw.addEventListener('click',function(e){e.preventDefault();sw.setAttribute('aria-checked',String(sw.getAttribute('aria-checked')!=='true'))})});})();`},

{id:'s-spring-checkbox',title:'Spring checkbox',component:'Spring checkbox',key:'spring-checkbox',family,width:460,
 description:'A checkbox whose tick draws itself and bounces as it lands.',
 prompt:'Create a list of three custom checkboxes built on real input[type=checkbox] elements (visually hidden) with a styled box. On check, the box fills with the accent colour, bounces (scale 0.8 to 1.15 to 1) and an SVG tick is drawn with stroke-dashoffset. The label text gets a strike-through that animates across. Keyboard focus ring and reduced motion respected. Vanilla HTML and CSS only.',
 css:`.sk{display:grid;gap:10px}
.sk label{display:flex;align-items:center;gap:14px;padding:14px 18px;border:1px solid var(--sc-line);border-radius:14px;background:var(--sc-surface);cursor:pointer}
.sk input{position:absolute;opacity:0;pointer-events:none}
.sk-box{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;border:2px solid var(--sc-line);background:var(--sc-bg);transition:background .2s,border-color .2s}
.sk-box svg{width:16px;height:16px;fill:none;stroke:var(--sc-accent-fg);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;transition:stroke-dashoffset .3s .08s}
.sk input:checked+.sk-box{background:var(--sc-accent);border-color:var(--sc-accent);animation:sk-pop .45s cubic-bezier(.3,1.6,.5,1)}
.sk input:checked+.sk-box svg{stroke-dashoffset:0}
.sk input:focus-visible+.sk-box{outline:2px solid var(--sc-accent);outline-offset:3px}
.sk-text{position:relative;transition:color .3s}
.sk-text::after{content:"";position:absolute;left:0;top:55%;height:2px;width:100%;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .35s}
.sk input:checked~.sk-text{color:var(--sc-muted)}.sk input:checked~.sk-text::after{transform:scaleX(1)}
@keyframes sk-pop{0%{transform:scale(.8)}60%{transform:scale(1.18)}100%{transform:scale(1)}}`,
 html:`<div class="sk"><label><input type="checkbox" checked><span class="sk-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="sk-text">Plan the launch</span></label><label><input type="checkbox"><span class="sk-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="sk-text">Write the announcement</span></label><label><input type="checkbox"><span class="sk-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="sk-text">Ship it</span></label></div>`,
 js:`/* Pure CSS component: no script required. */`},

{id:'s-hold-to-confirm',title:'Hold to confirm',component:'Hold button',key:'hold-button',family,width:460,
 description:'A destructive action that only fires after you press and hold.',
 prompt:'Build a "Hold to delete" button. While the pointer or Space/Enter is held, a fill sweeps left to right over 1.2 seconds using requestAnimationFrame; if released early the fill drains back. When it completes, the button switches to a confirmed state with a check icon and announces "Deleted" in a live region, then offers a Reset link. Keyboard and touch supported. Vanilla HTML, CSS and JavaScript.',
 css:`.hb{display:grid;gap:14px;justify-items:center}
.hb-btn{position:relative;overflow:hidden;min-width:220px;padding:15px 26px;border:1px solid color-mix(in srgb,#ef4444 50%,var(--sc-line));border-radius:14px;background:var(--sc-surface);cursor:pointer;font-weight:600;touch-action:none;user-select:none;-webkit-user-select:none}
.hb-fill{position:absolute;inset:0;background:#ef4444;transform:scaleX(var(--p,0));transform-origin:left}
.hb-label{position:relative;color:var(--sc-fg);mix-blend-mode:normal}
.hb-btn[data-done=true]{border-color:#16a34a}.hb-btn[data-done=true] .hb-fill{background:#16a34a;transform:scaleX(1)}.hb-btn[data-done=true] .hb-label{color:#fff}
.hb-btn[data-holding=true] .hb-label{color:#fff}
.hb-reset{border:0;background:none;color:var(--sc-muted);text-decoration:underline;cursor:pointer;font-size:13px}`,
 html:`<div class="hb"><button class="hb-btn" aria-describedby="hb-hint"><span class="hb-fill"></span><span class="hb-label">Hold to delete</span></button><p id="hb-hint" class="hb-live" role="status" aria-live="polite" style="margin:0;font-size:13px;color:var(--sc-muted)">Press and hold for 1.2 seconds.</p><button class="hb-reset" hidden>Reset</button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,btn=root.querySelector('.hb-btn'),label=root.querySelector('.hb-label'),live=root.querySelector('.hb-live'),reset=root.querySelector('.hb-reset'),p=0,raf=0,last=0,holding=false,done=false,TIME=1200;
function paint(){btn.style.setProperty('--p',p)}
function tick(t){var dt=last?t-last:0;last=t;p=Math.max(0,Math.min(1,p+(holding?dt/TIME:-dt/(TIME/2))));paint();if(holding&&p>=1){holding=false;done=true;btn.dataset.done='true';btn.dataset.holding='false';label.textContent='Deleted \\u2713';live.textContent='Deleted';reset.hidden=false;raf=0;return}if(holding||p>0)raf=requestAnimationFrame(tick);else{raf=0;btn.dataset.holding='false'}}
function start(){if(done)return;holding=true;btn.dataset.holding='true';last=0;if(!raf)raf=requestAnimationFrame(tick)}
function stop(){holding=false;last=0;if(!raf&&p>0)raf=requestAnimationFrame(tick)}
btn.addEventListener('pointerdown',function(e){e.preventDefault();btn.setPointerCapture(e.pointerId);start()});btn.addEventListener('pointerup',stop);btn.addEventListener('pointercancel',stop);
btn.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();start()}});btn.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter')stop()});btn.addEventListener('blur',stop);
reset.addEventListener('click',function(){done=false;p=0;paint();delete btn.dataset.done;label.textContent='Hold to delete';live.textContent='Press and hold for 1.2 seconds.';reset.hidden=true});})();`},

{id:'s-swipe-rows',title:'Swipe to delete rows',component:'Swipe row',key:'swipe-row',family,width:520,
 description:'List rows you drag sideways to reveal a delete action, or fling away.',
 prompt:'Create a list of four rows (title and subtitle). Each row can be dragged horizontally with pointer events: the row follows the pointer with slight resistance, revealing a red Delete area behind it. If released past 40% of the width the row slides out and the list collapses; otherwise it springs back. Provide a visible Delete button on each row for keyboard users. Announce removals in a live region. Vanilla HTML, CSS and JavaScript.',
 css:`.sw{display:grid;gap:8px}
.sw-item{position:relative;border-radius:14px;overflow:hidden;background:#ef4444;max-height:80px;transition:max-height .35s .1s,margin .35s .1s,opacity .3s}
.sw-item.is-gone{max-height:0;margin-top:-8px;opacity:0}
.sw-bin{position:absolute;right:0;top:0;bottom:0;display:flex;align-items:center;padding:0 22px;color:#fff;border:0;background:none;font-weight:600;cursor:pointer}
.sw-row{position:relative;display:block;padding:14px 18px;background:var(--sc-surface);border:1px solid var(--sc-line);border-radius:14px;transform:translateX(var(--x,0px));touch-action:pan-y;cursor:grab;transition:transform .35s cubic-bezier(.3,1.3,.5,1)}
.sw-row.is-drag{transition:none;cursor:grabbing}
.sw-row strong{display:block;font-size:15px}.sw-row span{font-size:13px;color:var(--sc-muted)}`,
 html:`<div class="sw"><div class="sw-item"><button class="sw-bin">Delete</button><div class="sw-row"><strong>Invoice #1042</strong><span>Due in 3 days</span></div></div><div class="sw-item"><button class="sw-bin">Delete</button><div class="sw-row"><strong>Welcome email</strong><span>Draft · edited 2h ago</span></div></div><div class="sw-item"><button class="sw-bin">Delete</button><div class="sw-row"><strong>Team offsite</strong><span>Friday · 12 people</span></div></div><div class="sw-item"><button class="sw-bin">Delete</button><div class="sw-row"><strong>Release notes</strong><span>Needs review</span></div></div><p class="sw-live" role="status" aria-live="polite" style="margin:6px 0 0;font-size:13px;color:var(--sc-muted)">Drag a row left, or use its Delete button.</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,live=root.querySelector('.sw-live');
root.querySelectorAll('.sw-item').forEach(function(item){var row=item.querySelector('.sw-row'),bin=item.querySelector('.sw-bin'),sx=0,x=0,on=false;
function remove(){row.style.setProperty('--x','-110%');item.classList.add('is-gone');live.textContent='Removed '+row.querySelector('strong').textContent;setTimeout(function(){item.style.display='none'},520)}
row.addEventListener('pointerdown',function(e){on=true;sx=e.clientX-x;row.classList.add('is-drag');row.setPointerCapture(e.pointerId)});
row.addEventListener('pointermove',function(e){if(!on)return;var d=e.clientX-sx;x=d<0?d:d*.2;row.style.setProperty('--x',x+'px')});
function end(){if(!on)return;on=false;row.classList.remove('is-drag');if(x<-row.offsetWidth*.4)remove();else{x=0;row.style.setProperty('--x','0px')}}
row.addEventListener('pointerup',end);row.addEventListener('pointercancel',end);bin.addEventListener('click',remove);});})();`},

{id:'s-rubber-segmented',title:'Rubber segmented control',component:'Segmented control',key:'segmented-control',family,width:520,
 description:'A segmented control whose indicator stretches and overshoots as it moves.',
 prompt:'Build a segmented control with three options (Day, Week, Month) as radio-style buttons in a role="radiogroup". A single indicator slides under the selected option; while moving it stretches (width grows) and overshoots slightly using an elastic cubic-bezier, then settles. Arrow keys move selection. Vanilla HTML, CSS and JavaScript.',
 css:`.rs{display:grid;gap:18px;justify-items:center}
.rs-bar{position:relative;display:inline-flex;padding:5px;border-radius:14px;background:var(--sc-surface);border:1px solid var(--sc-line)}
.rs-ind{position:absolute;top:5px;bottom:5px;left:0;width:0;border-radius:10px;background:var(--sc-bg);box-shadow:0 1px 4px rgba(0,0,0,.2),0 0 0 1px var(--sc-line);transition:transform .5s cubic-bezier(.3,1.5,.5,1),width .5s cubic-bezier(.3,1.5,.5,1)}
.rs-opt{position:relative;padding:9px 24px;border:0;background:none;border-radius:10px;cursor:pointer;color:var(--sc-muted);transition:color .2s}
.rs-opt[aria-checked=true]{color:var(--sc-fg);font-weight:600}
.rs-out{font-size:34px;font-weight:700;letter-spacing:-.03em}.rs-out small{display:block;font-size:13px;font-weight:400;color:var(--sc-muted);letter-spacing:0}`,
 html:`<div class="rs"><div class="rs-bar" role="radiogroup" aria-label="Range"><span class="rs-ind"></span><button class="rs-opt" role="radio" aria-checked="false">Day</button><button class="rs-opt" role="radio" aria-checked="true">Week</button><button class="rs-opt" role="radio" aria-checked="false">Month</button></div><div class="rs-out" aria-live="polite">48,210<small>visitors this week</small></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,bar=root.querySelector('.rs-bar'),ind=bar.querySelector('.rs-ind'),opts=[].slice.call(bar.querySelectorAll('.rs-opt')),out=root.querySelector('.rs-out'),data=[['6,918','visitors today'],['48,210','visitors this week'],['201,774','visitors this month']];
function sel(i,focus){opts.forEach(function(o,n){o.setAttribute('aria-checked',String(n===i));o.tabIndex=n===i?0:-1});var o=opts[i];ind.style.width=o.offsetWidth+'px';ind.style.transform='translateX('+(o.offsetLeft-5)+'px)';out.firstChild.textContent=data[i][0];out.querySelector('small').textContent=data[i][1];if(focus)o.focus()}
opts.forEach(function(o,i){o.addEventListener('click',function(){sel(i)});o.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:-1;if(n>=0){e.preventDefault();sel(n,true)}})});
ind.style.transition='none';sel(1);requestAnimationFrame(function(){ind.style.transition=''});})();`},

{id:'s-slosh-gauge',title:'Sloshing gauge',component:'Liquid gauge',key:'liquid-gauge',family,width:460,
 description:'A round gauge filled with gently sloshing liquid that follows a slider.',
 prompt:'Draw a circular gauge on a canvas: a clipped circle filled with liquid whose surface is two overlapping sine waves with different speeds. The fill level follows a range input (0-100) with smoothing, the percentage is shown in the centre, and the wave amplitude grows briefly when the value changes. Pause animation when the document is hidden and draw a flat surface for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.lg{display:grid;gap:18px;justify-items:center}
.lg canvas{width:190px;height:190px;border-radius:50%;box-shadow:0 0 0 2px var(--sc-line)}
.lg label{display:grid;gap:6px;width:min(100%,260px);font-size:13px;color:var(--sc-muted)}.lg input{width:100%;accent-color:var(--sc-accent)}`,
 html:`<div class="lg"><canvas width="380" height="380" role="img" aria-label="Gauge at 64 percent"></canvas><label>Level <input type="range" min="0" max="100" value="64"></label></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),input=root.querySelector('input'),calm=matchMedia('(prefers-reduced-motion: reduce)'),level=.64,target=.64,kick=0,t=0,css=getComputedStyle(root);
function colour(n,f){return css.getPropertyValue(n).trim()||f}
function draw(){var W=cv.width,H=cv.height,accent=colour('--sc-accent','#6d5ef5'),fg=colour('--sc-fg','#111'),y=H*(1-level),amp=calm.matches?0:6+kick*14,label=Math.round(level*100)+'%';
function waves(k){ctx.beginPath();ctx.moveTo(0,H);for(var x=0;x<=W;x+=6){ctx.lineTo(x,y+Math.sin(x/(k?38:55)+t*(k?-1.6:1.1)+k)*amp*(k?.7:1))}ctx.lineTo(W,H);ctx.closePath()}
function text(c){ctx.fillStyle=c;ctx.font='700 64px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,W/2,H/2)}
ctx.clearRect(0,0,W,H);ctx.save();ctx.beginPath();ctx.arc(W/2,H/2,W/2-4,0,Math.PI*2);ctx.clip();ctx.fillStyle=colour('--sc-surface','#f5f5f7');ctx.fillRect(0,0,W,H);
ctx.fillStyle=accent;ctx.globalAlpha=.45;waves(1);ctx.fill();ctx.globalAlpha=1;waves(0);ctx.fill();text(fg);ctx.save();waves(0);ctx.clip();text('#fff');ctx.restore();ctx.restore()}
function frame(){level+=(target-level)*.08;kick*=.95;t+=.04;draw();if(!document.hidden)requestAnimationFrame(frame);else document.addEventListener('visibilitychange',function w(){document.removeEventListener('visibilitychange',w);requestAnimationFrame(frame)})}
input.addEventListener('input',function(){target=input.value/100;kick=1;cv.setAttribute('aria-label','Gauge at '+input.value+' percent')});frame();})();`},

{id:'s-burst-like',title:'Burst like button',component:'Like button',key:'like-button',family,width:460,
 description:'A heart button that pops, rings and counts up when you like it.',
 prompt:'Make a like button with a heart icon and a counter. When toggled on, the heart fills with red and pops (scale 1 to 1.35 to 1), a ring expands and fades from behind it, and six small dots fly outward. The counter slides up to the new number. Toggling off reverses without the burst. Use aria-pressed and update an accessible label. Vanilla HTML, CSS and JavaScript.',
 css:`.lk{display:grid;place-items:center;padding:30px 0}
.lk-btn{position:relative;display:inline-flex;align-items:center;gap:12px;padding:12px 22px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-surface);cursor:pointer;font-weight:600}
.lk-heart{position:relative;width:26px;height:26px}.lk-heart svg{width:26px;height:26px;fill:none;stroke:var(--sc-muted);stroke-width:2;transition:fill .2s,stroke .2s}
.lk-btn[aria-pressed=true] .lk-heart svg{fill:#ef4444;stroke:#ef4444;animation:lk-pop .5s cubic-bezier(.3,1.6,.5,1)}
.lk-ring{position:absolute;inset:0;border-radius:50%;border:2px solid #ef4444;opacity:0;pointer-events:none}
.lk-btn.burst .lk-ring{animation:lk-ring .55s ease-out}
.lk-dot{position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;border-radius:50%;background:#ef4444;opacity:0;pointer-events:none}
.lk-btn.burst .lk-dot{animation:lk-fly .6s ease-out}
.lk-count{display:inline-block;min-width:2.2ch;overflow:hidden;height:1.5em}.lk-count b{display:block;font-weight:600;transition:transform .35s cubic-bezier(.3,1.2,.5,1)}
@keyframes lk-pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}
@keyframes lk-ring{from{transform:scale(.6);opacity:.9}to{transform:scale(2.2);opacity:0}}
@keyframes lk-fly{from{opacity:1;transform:rotate(var(--a)) translateY(0)}to{opacity:0;transform:rotate(var(--a)) translateY(-26px)}}`,
 html:`<div class="lk"><button class="lk-btn" aria-pressed="false" aria-label="Like, 128 likes"><span class="lk-heart"><span class="lk-ring"></span><i class="lk-dot" style="--a:0deg"></i><i class="lk-dot" style="--a:60deg"></i><i class="lk-dot" style="--a:120deg"></i><i class="lk-dot" style="--a:180deg"></i><i class="lk-dot" style="--a:240deg"></i><i class="lk-dot" style="--a:300deg"></i><svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.6 1 4.6 2.6l1 1.5 1-1.5c1-1.6 2.6-2.6 4.6-2.6 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z"/></svg></span><span class="lk-count"><b>128</b><b>129</b></span></button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,btn=root.querySelector('.lk-btn'),nums=btn.querySelector('.lk-count'),base=128;
function set(on){btn.setAttribute('aria-pressed',String(on));var n=base+(on?1:0);nums.querySelectorAll('b').forEach(function(b){b.style.transform='translateY('+(on?-100:0)+'%)'});btn.setAttribute('aria-label',(on?'Unlike':'Like')+', '+n+' likes')}
btn.addEventListener('click',function(){var on=btn.getAttribute('aria-pressed')!=='true';set(on);btn.classList.remove('burst');if(on){void btn.offsetWidth;btn.classList.add('burst')}});})();`},

{id:'s-voice-pill',title:'Voice recording pill',component:'Voice pill',key:'voice-pill',family,width:480,
 description:'A pill that expands into a live recorder with moving level bars and a timer.',
 prompt:'Build a "Record" pill button that expands into a recording state: the pill widens, shows a pulsing red dot, a running mm:ss timer and a row of twelve bars whose heights animate pseudo-randomly with smoothing. Pressing it again collapses back and shows "Saved 0:07" briefly. Use aria-live for state changes and aria-pressed on the button. Respect reduced motion by holding the bars steady. Vanilla HTML, CSS and JavaScript.',
 css:`.vp{display:grid;place-items:center;padding:24px 0}
.vp-btn{display:inline-flex;align-items:center;gap:12px;height:54px;padding:0 24px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-surface);cursor:pointer;font-weight:600;transition:width .5s cubic-bezier(.3,1.1,.4,1),background .3s,color .3s;width:150px;overflow:hidden;justify-content:center;white-space:nowrap}
.vp-btn[aria-pressed=true]{width:330px;background:var(--sc-fg);color:var(--sc-bg);justify-content:flex-start}
.vp-dot{flex:none;width:12px;height:12px;border-radius:50%;background:#ef4444}.vp-btn[aria-pressed=true] .vp-dot{animation:vp-pulse 1.2s infinite}
.vp-bars{display:none;align-items:center;gap:3px;height:26px;margin-left:auto}.vp-btn[aria-pressed=true] .vp-bars{display:flex}
.vp-bars i{width:3px;height:var(--h,6px);border-radius:2px;background:currentColor;opacity:.85;transition:height .1s}
.vp-time{display:none;font-variant-numeric:tabular-nums}.vp-btn[aria-pressed=true] .vp-time{display:inline}
@keyframes vp-pulse{50%{opacity:.35;transform:scale(.8)}}`,
 html:`<div class="vp"><button class="vp-btn" aria-pressed="false"><span class="vp-dot"></span><span class="vp-label">Record</span><span class="vp-time">0:00</span><span class="vp-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></button><p class="vp-live" role="status" aria-live="polite" style="position:absolute;left:-9999px"></p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,btn=root.querySelector('.vp-btn'),label=root.querySelector('.vp-label'),time=root.querySelector('.vp-time'),live=root.querySelector('.vp-live'),bars=[].slice.call(root.querySelectorAll('.vp-bars i')),calm=matchMedia('(prefers-reduced-motion: reduce)'),secs=0,timer=0,anim=0,hs=bars.map(function(){return 6});
function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function loop(){bars.forEach(function(b,i){var target=calm.matches?10:4+Math.random()*22;hs[i]+=(target-hs[i])*.45;b.style.setProperty('--h',hs[i].toFixed(1)+'px')});}
btn.addEventListener('click',function(){var on=btn.getAttribute('aria-pressed')!=='true';btn.setAttribute('aria-pressed',String(on));if(on){secs=0;time.textContent='0:00';label.textContent='Recording';live.textContent='Recording started';timer=setInterval(function(){secs++;time.textContent=fmt(secs)},1000);anim=setInterval(loop,110)}else{clearInterval(timer);clearInterval(anim);label.textContent='Saved '+fmt(secs);live.textContent='Recording saved, '+fmt(secs);setTimeout(function(){if(btn.getAttribute('aria-pressed')!=='true')label.textContent='Record'},1800)}});})();`},

{id:'s-spring-tooltip',title:'Spring tooltip',component:'Tooltip',key:'tooltip',family,width:520,
 description:'Tooltips that pop in with a small spring and flip away from the screen edge.',
 prompt:'Create three icon buttons that each show a tooltip on hover and keyboard focus. The tooltip scales and fades in from the button with a spring curve, has a small arrow, and uses role="tooltip" with aria-describedby. Flip it below the button if there is not enough room above. Hide on Escape. Vanilla HTML, CSS and JavaScript.',
 css:`.tp{display:flex;gap:14px;justify-content:center;padding:58px 0 20px}
.tp-wrap{position:relative}
.tp-btn{display:grid;place-items:center;width:48px;height:48px;border:1px solid var(--sc-line);border-radius:14px;background:var(--sc-surface);cursor:pointer}
.tp-btn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tp-tip{position:absolute;left:50%;bottom:calc(100% + 10px);padding:6px 11px;border-radius:9px;background:var(--sc-fg);color:var(--sc-bg);font-size:13px;white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(-50%) translateY(6px) scale(.85);transform-origin:50% 100%;transition:opacity .15s,transform .35s cubic-bezier(.3,1.6,.5,1)}
.tp-tip::after{content:"";position:absolute;left:50%;top:100%;width:8px;height:8px;margin:-4px 0 0 -4px;background:inherit;transform:rotate(45deg)}
.tp-wrap.is-flip .tp-tip{bottom:auto;top:calc(100% + 10px);transform-origin:50% 0}.tp-wrap.is-flip .tp-tip::after{top:0;margin-top:-4px}
.tp-wrap.is-open .tp-tip{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}`,
 html:`<div class="tp"><div class="tp-wrap"><button class="tp-btn" aria-describedby="tip-1" aria-label="Copy"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg></button><span class="tp-tip" role="tooltip" id="tip-1">Copy link</span></div><div class="tp-wrap"><button class="tp-btn" aria-describedby="tip-2" aria-label="Share"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/></svg></button><span class="tp-tip" role="tooltip" id="tip-2">Share with the team</span></div><div class="tp-wrap"><button class="tp-btn" aria-describedby="tip-3" aria-label="Archive"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/></svg></button><span class="tp-tip" role="tooltip" id="tip-3">Archive (A)</span></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling;
root.querySelectorAll('.tp-wrap').forEach(function(w){var btn=w.querySelector('.tp-btn');
function open(){var r=btn.getBoundingClientRect();w.classList.toggle('is-flip',r.top<70);w.classList.add('is-open')}function close(){w.classList.remove('is-open')}
w.addEventListener('mouseenter',open);w.addEventListener('mouseleave',close);btn.addEventListener('focus',open);btn.addEventListener('blur',close);btn.addEventListener('keydown',function(e){if(e.key==='Escape')close()})});})();`},

{id:'s-scrub-number',title:'Scrubbable number field',component:'Scrub field',key:'scrub-field',family,width:480,
 description:'Drag a label sideways to change a number, like a design tool.',
 prompt:'Build three labelled number inputs (Width, Height, Opacity) where dragging the label horizontally changes the value: one pixel of movement equals one step, holding Shift multiplies by ten, and the cursor shows ew-resize. The input also accepts typing and ArrowUp/ArrowDown. Clamp to min and max. Use pointer capture, and keep each input a real input[type=number] for accessibility. Vanilla HTML, CSS and JavaScript.',
 css:`.sf{display:grid;gap:10px}
.sf-row{display:flex;align-items:center;border:1px solid var(--sc-line);border-radius:12px;background:var(--sc-surface);overflow:hidden}
.sf-row:focus-within{border-color:var(--sc-accent);box-shadow:0 0 0 3px var(--sc-ring)}
.sf-label{width:96px;padding:12px 14px;color:var(--sc-muted);font-size:13px;cursor:ew-resize;user-select:none;-webkit-user-select:none;touch-action:none;border-right:1px solid var(--sc-line);transition:background .15s,color .15s}
.sf-label:hover,.sf-label.is-drag{background:var(--sc-accent);color:var(--sc-accent-fg)}
.sf-row input{flex:1;min-width:0;padding:12px 14px;border:0;background:none;color:var(--sc-fg);font:inherit;font-variant-numeric:tabular-nums;outline:none}
.sf-unit{padding-right:14px;color:var(--sc-muted);font-size:13px}`,
 html:`<div class="sf"><div class="sf-row"><span class="sf-label" aria-hidden="true">Width</span><input type="number" aria-label="Width" value="320" min="0" max="1000"><span class="sf-unit">px</span></div><div class="sf-row"><span class="sf-label" aria-hidden="true">Height</span><input type="number" aria-label="Height" value="180" min="0" max="1000"><span class="sf-unit">px</span></div><div class="sf-row"><span class="sf-label" aria-hidden="true">Opacity</span><input type="number" aria-label="Opacity" value="80" min="0" max="100"><span class="sf-unit">%</span></div><p style="margin:4px 0 0;font-size:13px;color:var(--sc-muted)">Drag a label sideways. Hold Shift for bigger steps.</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling;
root.querySelectorAll('.sf-row').forEach(function(row){var label=row.querySelector('.sf-label'),input=row.querySelector('input'),start=0,base=0,on=false;
label.addEventListener('pointerdown',function(e){on=true;start=e.clientX;base=Number(input.value)||0;label.classList.add('is-drag');label.setPointerCapture(e.pointerId)});
label.addEventListener('pointermove',function(e){if(!on)return;var step=e.shiftKey?10:1,v=Math.round(base+(e.clientX-start)/2*step);v=Math.max(Number(input.min),Math.min(Number(input.max),v));input.value=v});
function end(){on=false;label.classList.remove('is-drag')}label.addEventListener('pointerup',end);label.addEventListener('pointercancel',end);});})();`},

{id:'s-status-morph-button',title:'Status morph button',component:'Status button',key:'status-button',family,width:460,
 description:'A button that morphs through idle, loading, success and error states.',
 prompt:'Create a submit button that morphs between four states: idle ("Save changes"), loading (label replaced by a spinner and the button narrows to a circle-ish pill), success (green with a drawn checkmark) and error (red with a shake). Clicking runs a simulated 1.6s request that succeeds twice then fails once, then returns to idle after 1.8s. Announce each state through a polite live region and disable the button while busy. Vanilla HTML, CSS and JavaScript.',
 css:`.sb{display:grid;place-items:center;gap:14px;padding:20px 0}
.sb-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-width:170px;height:50px;padding:0 26px;border:0;border-radius:999px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:600;cursor:pointer;transition:min-width .4s cubic-bezier(.3,1.1,.4,1),background .3s}
.sb-btn[data-state=loading]{min-width:50px;padding:0}.sb-btn[data-state=success]{background:#16a34a;color:#fff}.sb-btn[data-state=error]{background:#dc2626;color:#fff;animation:sb-shake .4s}
.sb-btn:disabled{cursor:progress}
.sb-ico{display:none;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.sb-btn[data-state=loading] .sb-label,.sb-btn[data-state=loading] .sb-check,.sb-btn[data-state=loading] .sb-cross{display:none}.sb-btn[data-state=loading] .sb-spin{display:block;animation:sb-spin .8s linear infinite}
.sb-btn[data-state=success] .sb-check{display:block;stroke-dasharray:24;animation:sb-draw .4s forwards}.sb-btn[data-state=error] .sb-cross{display:block}
.sb-btn[data-state=success] .sb-label,.sb-btn[data-state=error] .sb-label{display:none}
@keyframes sb-spin{to{transform:rotate(360deg)}}@keyframes sb-draw{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}@keyframes sb-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`,
 html:`<div class="sb"><button class="sb-btn" data-state="idle"><span class="sb-label">Save changes</span><svg class="sb-ico sb-spin" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9" /></svg><svg class="sb-ico sb-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><svg class="sb-ico sb-cross" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><p class="sb-live" role="status" aria-live="polite" style="margin:0;font-size:13px;color:var(--sc-muted)">Ready</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,btn=root.querySelector('.sb-btn'),live=root.querySelector('.sb-live'),runs=0;
function set(s,msg){btn.dataset.state=s;live.textContent=msg}
btn.addEventListener('click',function(){if(btn.disabled)return;btn.disabled=true;set('loading','Saving…');setTimeout(function(){runs++;if(runs%3===0)set('error','Could not save. Try again.');else set('success','Saved');setTimeout(function(){set('idle','Ready');btn.disabled=false},1800)},1600)});})();`},

{id:'s-peek-rating',title:'Peek star rating',component:'Rating',key:'rating',family,width:460,
 description:'A star rating that previews your choice on hover and bounces when set.',
 prompt:'Build a five-star rating as a radiogroup of buttons. Hovering previews the rating by filling stars up to the pointer; leaving restores the chosen value. Clicking sets the rating with a small bounce on the chosen star and updates a caption ("Loved it"). Arrow keys change the rating. Stars are inline SVG. Vanilla HTML, CSS and JavaScript.',
 css:`.pr{display:grid;gap:12px;justify-items:center}
.pr-stars{display:inline-flex;gap:4px}
.pr-star{padding:4px;border:0;background:none;cursor:pointer;border-radius:8px}
.pr-star svg{display:block;width:38px;height:38px;fill:transparent;stroke:var(--sc-muted);stroke-width:1.6;stroke-linejoin:round;transition:fill .15s,stroke .15s,transform .2s}
.pr-star.on svg{fill:#f59e0b;stroke:#f59e0b}.pr-star:hover svg{transform:scale(1.12)}
.pr-star.pop svg{animation:pr-pop .45s cubic-bezier(.3,1.6,.5,1)}
.pr-cap{margin:0;min-height:1.5em;color:var(--sc-muted);font-size:14px}
@keyframes pr-pop{50%{transform:scale(1.4) rotate(-12deg)}}`,
 html:`<div class="pr"><div class="pr-stars" role="radiogroup" aria-label="Rating"><button class="pr-star" role="radio" aria-checked="false" aria-label="1 star"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg></button><button class="pr-star" role="radio" aria-checked="false" aria-label="2 stars"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg></button><button class="pr-star" role="radio" aria-checked="false" aria-label="3 stars"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg></button><button class="pr-star" role="radio" aria-checked="false" aria-label="4 stars"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg></button><button class="pr-star" role="radio" aria-checked="false" aria-label="5 stars"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg></button></div><p class="pr-cap" role="status" aria-live="polite">Tap a star to rate</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,stars=[].slice.call(root.querySelectorAll('.pr-star')),cap=root.querySelector('.pr-cap'),value=4,words=['','Not for me','It was fine','Pretty good','Loved it','Absolutely brilliant'];
function paint(n){stars.forEach(function(s,i){s.classList.toggle('on',i<n)})}
function set(n,focus){value=n;stars.forEach(function(s,i){s.setAttribute('aria-checked',String(i+1===n));s.tabIndex=i+1===n||(!n&&!i)?0:-1});paint(n);cap.textContent=words[n];var s=stars[n-1];s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');if(focus)s.focus()}
stars.forEach(function(s,i){s.addEventListener('mouseenter',function(){paint(i+1)});s.addEventListener('click',function(){set(i+1)});s.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'||e.key==='ArrowUp'?Math.min(5,value+1):e.key==='ArrowLeft'||e.key==='ArrowDown'?Math.max(1,value-1):0;if(n){e.preventDefault();set(n,true)}})});
root.querySelector('.pr-stars').addEventListener('mouseleave',function(){paint(value)});set(4);})();`},

{id:'s-magnet-button',title:'Magnetic button',component:'Magnet',key:'magnet',family:cursor,width:520,
 description:'A button that leans towards the pointer as it gets close, then snaps back.',
 prompt:'Create a large call-to-action button that is attracted to the pointer: when the pointer comes within about 90px of the button, move the button (and its label slightly more) towards the pointer by up to 12px using transform; spring back with an overshoot curve when the pointer leaves the zone. Disable for reduced motion and touch. Vanilla HTML, CSS and JavaScript.',
 css:`.mg{display:grid;place-items:center;min-height:220px}
.mg-btn{position:relative;padding:18px 40px;border:0;border-radius:999px;background:var(--sc-fg);color:var(--sc-bg);font-weight:700;font-size:17px;cursor:pointer;transform:translate(var(--x,0),var(--y,0));transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
.mg-btn.is-near{transition:transform .12s ease-out}
.mg-label{display:block;transform:translate(var(--lx,0),var(--ly,0));transition:transform .5s cubic-bezier(.3,1.6,.5,1)}.mg-btn.is-near .mg-label{transition:transform .12s ease-out}`,
 html:`<div class="mg"><button class="mg-btn"><span class="mg-label">Get started</span></button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,zone=root.querySelector('.mg'),btn=root.querySelector('.mg-btn'),calm=matchMedia('(prefers-reduced-motion: reduce)'),R=110;
function leave(){btn.classList.remove('is-near');['--x','--y','--lx','--ly'].forEach(function(p){btn.style.setProperty(p,'0px')})}
zone.addEventListener('pointermove',function(e){if(calm.matches||e.pointerType==='touch')return;var r=btn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),reach=Math.max(r.width,r.height)/2+R;if(d>reach){leave();return}btn.classList.add('is-near');var k=1-d/reach;btn.style.setProperty('--x',(dx*.18*k+dx*.04)+'px');btn.style.setProperty('--y',(dy*.18*k+dy*.04)+'px');btn.style.setProperty('--lx',(dx*.06)+'px');btn.style.setProperty('--ly',(dy*.06)+'px')});
zone.addEventListener('pointerleave',leave);})();`},

{id:'s-click-spark',title:'Click spark',component:'Click spark',key:'click-spark',family:cursor,width:520,
 description:'Click anywhere on the surface to release a quick burst of sparks.',
 prompt:'Make a large pointer surface. On every click or tap, draw a burst of eight short lines radiating outwards from the click point on a canvas overlay, in the accent colour; each line shortens and fades over about 450ms using requestAnimationFrame. The canvas must be pointer-events none and resize with the container. Provide a sentence of instruction text and make the surface focusable so Enter triggers a burst at the centre. Vanilla HTML, CSS and JavaScript.',
 css:`.cp{position:relative;display:grid;place-items:center;min-height:260px;border:1px dashed var(--sc-line);border-radius:20px;background:var(--sc-surface);cursor:crosshair;overflow:hidden;text-align:center;padding:20px}
.cp canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cp p{position:relative;margin:0;color:var(--sc-muted);font-size:15px}.cp b{display:block;color:var(--sc-fg);font-size:20px;margin-bottom:4px}`,
 html:`<div class="cp" tabindex="0" role="button" aria-label="Click or press Enter to release sparks"><canvas></canvas><p><b>Click anywhere</b>to release a burst of sparks</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,box=root.querySelector('.cp'),cv=box.querySelector('canvas'),ctx=cv.getContext('2d'),sparks=[],raf=0,calm=matchMedia('(prefers-reduced-motion: reduce)');
function size(){var r=box.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)}size();new ResizeObserver(size).observe(box);
function burst(x,y){if(calm.matches)return;var colour=getComputedStyle(root).getPropertyValue('--sc-accent').trim()||'#6d5ef5';for(var i=0;i<8;i++)sparks.push({x:x,y:y,a:i/8*Math.PI*2+Math.random()*.3,t:performance.now(),c:colour});if(!raf)raf=requestAnimationFrame(draw)}
function draw(now){var r=box.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);sparks=sparks.filter(function(s){var k=(now-s.t)/450;if(k>=1)return false;var e=1-Math.pow(1-k,3),d1=8+e*26,d2=d1+(1-k)*12;ctx.strokeStyle=s.c;ctx.globalAlpha=1-k;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s.x+Math.cos(s.a)*d1,s.y+Math.sin(s.a)*d1);ctx.lineTo(s.x+Math.cos(s.a)*d2,s.y+Math.sin(s.a)*d2);ctx.stroke();return true});ctx.globalAlpha=1;raf=sparks.length?requestAnimationFrame(draw):0}
box.addEventListener('pointerdown',function(e){var r=box.getBoundingClientRect();burst(e.clientX-r.left,e.clientY-r.top)});box.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();var r=box.getBoundingClientRect();burst(r.width/2,r.height/2)}});})();`},

{id:'s-glare-hover',title:'Glare hover card',component:'Glare hover',key:'glare-hover',family:cursor,width:520,
 description:'A glossy sweep of light glides across a card when you hover it.',
 prompt:'Create a card with an image-like gradient and a caption. On hover, a diagonal white highlight band (a skewed gradient overlay with mix-blend-mode overlay) sweeps from the top-left to the bottom-right once, over 700ms, and then rests. On mouse-out it resets without sweeping backwards. Include keyboard focus triggering the same sweep. Vanilla HTML and CSS only.',
 css:`.gh{display:grid;place-items:center;padding:12px 0}
.gh-card{position:relative;width:min(100%,340px);border-radius:22px;overflow:hidden;border:1px solid var(--sc-line);background:var(--sc-surface);cursor:pointer;padding:0;text-align:left;display:block}
.gh-art{height:190px;background:linear-gradient(140deg,#0ea5e9,#6d5ef5 55%,#ec4899)}
.gh-body{padding:16px 20px 20px}.gh-body b{display:block;font-size:18px}.gh-body span{font-size:14px;color:var(--sc-muted)}
.gh-card::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-18deg) translateX(0);mix-blend-mode:overlay;opacity:0;pointer-events:none}
.gh-card:hover::after,.gh-card:focus-visible::after{opacity:1;animation:gh-sweep .8s ease-out forwards}
@keyframes gh-sweep{from{transform:skewX(-18deg) translateX(0)}to{transform:skewX(-18deg) translateX(420%)}}`,
 html:`<div class="gh"><button class="gh-card"><div class="gh-art"></div><div class="gh-body"><b>Midnight series</b><span>Hover to catch the light</span></div></button></div>`,
 js:`/* Pure CSS component: no script required. */`}
];
