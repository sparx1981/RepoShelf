// Anime-style form controls: squash-and-stretch, impact bursts, dust puffs and lettering.
// Original RepoShelf code, inspired by the idea of "controls that react like anime" (sakuga-vfx, MIT);
// no code or artwork from that project is used.
const family='Anime controls';
const CSS=`.sv{position:relative;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;padding:28px 12px;min-height:150px}
.sv-p{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:5}
.sv-p.chip{border-radius:2px;width:8px;height:5px}
.sv-p.dust{width:10px;height:10px;opacity:.7}
.sv-w{position:absolute;pointer-events:none;z-index:6;font:900 italic 22px/1 system-ui,sans-serif;letter-spacing:.04em;color:var(--sc-accent);-webkit-text-stroke:1.5px var(--sc-fg);paint-order:stroke fill;white-space:nowrap}`;
const FX=`var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
function fly(p,a,t){p.animate(a,{duration:t,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=function(){p.remove()}}
function burst(h,x,y,o){if(rm)return;o=o||{};var n=o.n||9,r=o.r||38,i,a,d,p;for(i=0;i<n;i++){a=o.arc?o.arc[0]+(o.arc[1]-o.arc[0])*i/Math.max(1,n-1):i/n*6.283;d=r*(.6+Math.random()*.7);p=document.createElement('i');p.className='sv-p '+(o.shape||'');p.style.left=x+'px';p.style.top=y+'px';p.style.background=o.c||'var(--sc-accent)';h.appendChild(p);fly(p,[{transform:'translate(-50%,-50%) rotate(0) scale(1)',opacity:1},{transform:'translate(calc(-50% + '+Math.cos(a)*d+'px),calc(-50% + '+Math.sin(a)*d+'px)) rotate(200deg) scale(.2)',opacity:0}],o.t||560)}}
function word(h,x,y,t,rot){if(rm)return;var s=document.createElement('b');s.className='sv-w';s.textContent=t;s.style.left=x+'px';s.style.top=y+'px';h.appendChild(s);rot=rot||-8;s.animate([{transform:'translate(-50%,-50%) rotate('+rot+'deg) scale(.3)',opacity:0},{transform:'translate(-50%,-90%) rotate('+rot+'deg) scale(1.2)',opacity:1,offset:.25},{transform:'translate(-50%,-150%) rotate('+rot+'deg) scale(1)',opacity:0}],{duration:760,easing:'ease-out'}).onfinish=function(){s.remove()}}
function mid(h,el){var a=h.getBoundingClientRect(),b=el.getBoundingClientRect();return[b.left-a.left+b.width/2,b.top-a.top+b.height/2]}
function squash(el,a,t){if(rm)return;el.animate(a,{duration:t||420,easing:'cubic-bezier(.3,1.6,.5,1)'})}`;
const wrap=js=>`(function(){var root=document.currentScript.previousElementSibling,h=root.querySelector('.sv');\n${FX}\n${js}})();`;

export const animeControls=[
{id:'s-anime-button',title:'Impact button',component:'Impact button',key:'anime-button',family,width:520,
 description:'A button that squashes under the press and fires an impact burst with a lettered hit.',
 prompt:'Build a primary and a secondary button that behave like an anime hit. On pointer down the button squashes (scaleX 1.06, scaleY 0.9); on release it springs back with an overshoot while a ring of small particles bursts from its centre and a bold outlined word (such as "DON!") floats up and fades. After the click the label briefly turns into a check mark. Real button elements, keyboard operable, effects skipped when prefers-reduced-motion is set. Vanilla HTML, CSS and JavaScript using the Web Animations API.',
 css:`${CSS}
.sv-btn{position:relative;padding:14px 30px;border:2px solid var(--sc-accent);border-radius:14px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:700;font-size:16px;cursor:pointer;transition:transform .12s}
.sv-btn.alt{background:transparent;color:var(--sc-fg);border-color:var(--sc-line)}
.sv-btn:active{transform:scale(1.06,.9)}`,
 html:`<div class="sv"><button class="sv-btn" data-w="DON!">Launch</button><button class="sv-btn alt" data-w="POW!">Charge up</button></div>`,
 js:wrap(`root.querySelectorAll('.sv-btn').forEach(function(b){var label=b.textContent;b.addEventListener('click',function(){var c=mid(h,b);squash(b,[{transform:'scale(1.12,.88)'},{transform:'scale(.95,1.08)'},{transform:'scale(1)'}]);burst(h,c[0],c[1],{n:12,r:56,c:b.classList.contains('alt')?'var(--sc-fg)':'var(--sc-accent)'});word(h,c[0],c[1]-22,b.dataset.w);b.textContent='\\u2713';setTimeout(function(){b.textContent=label},900)})})`),
 thumb:{click:'.sv-btn',wait:160}},

{id:'s-anime-toggle',title:'Smear toggle',component:'Smear toggle',key:'anime-toggle',family,width:520,
 description:'A switch whose knob smears across the track and splashes on landing.',
 prompt:'Create a row of labelled switches (button role="switch" with aria-checked). When toggled the knob stretches into a long smear while it travels, then lands with a squash and throws a small splash of particles upward. The track colour animates to the accent colour. Keyboard operable, reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv-row{display:flex;align-items:center;gap:14px;padding:12px 18px;border:1px solid var(--sc-line);border-radius:16px;background:var(--sc-surface)}
.sv-sw{position:relative;width:64px;height:34px;border:0;border-radius:99px;background:var(--sc-line);cursor:pointer;transition:background .25s;padding:0}
.sv-sw[aria-checked=true]{background:var(--sc-accent)}
.sv-kn{position:absolute;top:4px;left:4px;width:26px;height:26px;border-radius:99px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .38s cubic-bezier(.3,1.5,.5,1),width .16s}
.sv-sw[aria-checked=true] .sv-kn{transform:translateX(30px)}
.sv-sw.smear .sv-kn{width:46px}.sv-sw.smear[aria-checked=true] .sv-kn{transform:translateX(14px)}`,
 html:`<div class="sv"><label class="sv-row"><span>Sound</span><button class="sv-sw" role="switch" aria-checked="false" aria-label="Sound"><i class="sv-kn"></i></button></label><label class="sv-row"><span>Haptics</span><button class="sv-sw" role="switch" aria-checked="true" aria-label="Haptics"><i class="sv-kn"></i></button></label></div>`,
 js:wrap(`root.querySelectorAll('.sv-sw').forEach(function(s){s.addEventListener('click',function(e){e.preventDefault();var on=s.getAttribute('aria-checked')!=='true';s.classList.add('smear');s.setAttribute('aria-checked',String(on));setTimeout(function(){s.classList.remove('smear');var c=mid(h,s.firstElementChild);burst(h,c[0],c[1]-6,{n:8,r:30,arc:[-2.6,-.5],c:on?'var(--sc-accent)':'var(--sc-muted)'})},190)})})`),
 thumb:{click:'.sv-sw',wait:420}},

{id:'s-anime-slider',title:'Speed-line slider',component:'Speed-line slider',key:'anime-slider',family,width:520,
 description:'A teardrop thumb with a value bubble that throws speed lines on a fast drag.',
 prompt:'Build a range slider on top of a real transparent input[type=range]. The visible thumb is a teardrop that follows the value, a bubble above it shows the number, and when the value changes quickly short speed lines trail behind the thumb. On release a small crescent burst plays. Keyboard arrows work through the native input; reduced motion disables the effects. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv-sl{position:relative;width:min(380px,90%);height:56px}
.sv-track{position:absolute;left:0;right:0;top:36px;height:8px;border-radius:99px;background:var(--sc-line)}
.sv-fill{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--sc-accent)}
.sv-th{position:absolute;top:26px;width:28px;height:28px;margin-left:-14px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--sc-accent);box-shadow:0 3px 8px rgba(0,0,0,.3)}
.sv-bub{position:absolute;top:-4px;margin-left:-20px;width:40px;text-align:center;font-weight:800;font-size:15px;color:var(--sc-fg)}
.sv-sl input{position:absolute;inset:0;width:100%;margin:0;opacity:0;cursor:grab}
.sv-sl:focus-within .sv-th{outline:2px solid var(--sc-fg);outline-offset:3px}
.sv-ln{position:absolute;height:2px;width:22px;background:var(--sc-fg);border-radius:2px;pointer-events:none;opacity:0}`,
 html:`<div class="sv"><div class="sv-sl"><div class="sv-track"><div class="sv-fill"></div></div><div class="sv-bub">40</div><div class="sv-th"></div><input type="range" min="0" max="100" value="40" aria-label="Power"></div></div>`,
 js:wrap(`var inp=root.querySelector('input'),fill=root.querySelector('.sv-fill'),th=root.querySelector('.sv-th'),bub=root.querySelector('.sv-bub'),sl=root.querySelector('.sv-sl'),last=+inp.value,lt=0;
function set(){var v=+inp.value,p=v+'%';fill.style.width=p;th.style.left=p;bub.style.left=p;bub.textContent=v;var now=performance.now(),dv=v-last;if(!rm&&Math.abs(dv)>=3&&now-lt>40){lt=now;var s=document.createElement('i'),b=sl.getBoundingClientRect(),x=b.width*v/100,hb=h.getBoundingClientRect();s.className='sv-ln';s.style.left=(b.left-hb.left+x-(dv>0?34:-12))+'px';s.style.top=(b.top-hb.top+30+Math.random()*22)+'px';h.appendChild(s);s.animate([{opacity:.8,transform:'scaleX(.4)'},{opacity:0,transform:'scaleX(1.4) translateX('+(dv>0?-18:18)+'px)'}],{duration:320}).onfinish=function(){s.remove()}}last=v}
inp.addEventListener('input',set);inp.addEventListener('change',function(){var b=th.getBoundingClientRect(),hb=h.getBoundingClientRect();burst(h,b.left-hb.left+14,b.top-hb.top+14,{n:6,r:24,arc:[-3.2,-.1]})});set();`),
 thumb:{wait:100}},

{id:'s-anime-checkbox',title:'Chip-burst checkbox',component:'Chip-burst checkbox',key:'anime-checkbox',family,width:520,
 description:'Checkboxes that pop and throw crystal chips when ticked.',
 prompt:'Make a list of custom checkboxes built on real input[type=checkbox] elements visually hidden behind a styled box. When ticked the box squashes then springs, the tick draws with stroke-dashoffset and a handful of small rectangular chips fly outward from the box. Visible keyboard focus, reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv{flex-direction:column;align-items:stretch;max-width:340px;margin:auto}
.sv label{display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid var(--sc-line);border-radius:14px;background:var(--sc-surface);cursor:pointer}
.sv input{position:absolute;opacity:0;pointer-events:none}
.sv-bx{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;border:2px solid var(--sc-line);background:var(--sc-bg);transition:background .2s,border-color .2s}
.sv-bx svg{width:16px;height:16px;fill:none;stroke:var(--sc-accent-fg);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;transition:stroke-dashoffset .3s .08s}
.sv input:checked+.sv-bx{background:var(--sc-accent);border-color:var(--sc-accent)}.sv input:checked+.sv-bx svg{stroke-dashoffset:0}
.sv input:focus-visible+.sv-bx{outline:2px solid var(--sc-accent);outline-offset:3px}`,
 html:`<div class="sv"><label><input type="checkbox"><span class="sv-bx"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.5"/></svg></span>Ship the build</label><label><input type="checkbox" checked><span class="sv-bx"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.5"/></svg></span>Write the notes</label><label><input type="checkbox"><span class="sv-bx"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.5"/></svg></span>Tell the team</label></div>`,
 js:wrap(`root.querySelectorAll('input').forEach(function(i){i.addEventListener('change',function(){var b=i.nextElementSibling,c=mid(h,b);if(i.checked){squash(b,[{transform:'scale(.8)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],380);burst(h,c[0],c[1],{n:8,r:30,shape:'chip'})}})})`),
 thumb:{click:'label:nth-child(1)',wait:200}},

{id:'s-anime-radio',title:'Ripple radio',component:'Ripple radio',key:'anime-radio',family,width:520,
 description:'Radio options whose selected dot lands with a ring ripple and a small burst.',
 prompt:'Build a group of three radio options using real input[type=radio] elements sharing a name, wrapped in a fieldset with a legend. When one is selected its inner dot springs in, an expanding ring ripples outward and a few particles pop. Arrow keys move selection natively; focus ring visible; reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv fieldset{border:0;margin:0;padding:0;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.sv legend{position:absolute;opacity:0}
.sv label{display:flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid var(--sc-line);border-radius:14px;background:var(--sc-surface);cursor:pointer}
.sv input{position:absolute;opacity:0}
.sv-rd{position:relative;width:24px;height:24px;border-radius:50%;border:2px solid var(--sc-line);display:grid;place-items:center}
.sv-rd::after{content:'';width:12px;height:12px;border-radius:50%;background:var(--sc-accent);transform:scale(0);transition:transform .4s cubic-bezier(.3,1.7,.5,1)}
.sv input:checked+.sv-rd{border-color:var(--sc-accent)}.sv input:checked+.sv-rd::after{transform:scale(1)}
.sv input:focus-visible+.sv-rd{outline:2px solid var(--sc-accent);outline-offset:3px}
.sv-ring{position:absolute;width:24px;height:24px;border-radius:50%;border:2px solid var(--sc-accent);pointer-events:none}`,
 html:`<div class="sv"><fieldset><legend>Plan</legend><label><input type="radio" name="pl" checked><span class="sv-rd"></span>Solo</label><label><input type="radio" name="pl"><span class="sv-rd"></span>Team</label><label><input type="radio" name="pl"><span class="sv-rd"></span>Studio</label></fieldset></div>`,
 js:wrap(`root.querySelectorAll('input').forEach(function(i){i.addEventListener('change',function(){var d=i.nextElementSibling,c=mid(h,d);if(rm)return;var r=document.createElement('i');r.className='sv-ring';r.style.left=(c[0]-12)+'px';r.style.top=(c[1]-12)+'px';h.appendChild(r);r.animate([{transform:'scale(1)',opacity:.9},{transform:'scale(2.6)',opacity:0}],{duration:520,easing:'ease-out'}).onfinish=function(){r.remove()};burst(h,c[0],c[1],{n:6,r:26})})})`),
 thumb:{click:'label:nth-child(2)',wait:180}},

{id:'s-anime-input',title:'Dust-trail input',component:'Dust-trail input',key:'anime-input',family,width:520,
 description:'A text field that kicks up dust at the caret on every keystroke.',
 prompt:'Create a text input that puffs a little dust at the caret position each time a character is typed. Measure the text width with a hidden span that shares the input font so the puff appears right after the last character. Use a real labelled input, keep typing performance smooth, and skip the effect when prefers-reduced-motion is set. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv-fld{position:relative;width:min(360px,92%)}
.sv-fld input{width:100%;padding:14px 16px;font:500 17px system-ui,sans-serif;color:var(--sc-fg);background:var(--sc-surface);border:2px solid var(--sc-line);border-radius:14px;transition:border-color .2s}
.sv-fld input:focus{outline:none;border-color:var(--sc-accent)}
.sv-fld input:focus-visible{outline:2px solid var(--sc-accent);outline-offset:3px}
.sv-ms{position:absolute;visibility:hidden;white-space:pre;font:500 17px system-ui,sans-serif;left:0;top:0}`,
 html:`<div class="sv"><label class="sv-fld"><span style="position:absolute;opacity:0">Name your project</span><input type="text" placeholder="Name your project" autocomplete="off"><span class="sv-ms"></span></label></div>`,
 js:wrap(`var inp=root.querySelector('input'),ms=root.querySelector('.sv-ms'),fld=root.querySelector('.sv-fld');
inp.addEventListener('input',function(){ms.textContent=inp.value;var f=fld.getBoundingClientRect(),hb=h.getBoundingClientRect();burst(h,f.left-hb.left+18+ms.offsetWidth,f.top-hb.top+f.height-8,{n:5,r:22,arc:[-2.8,-.3],shape:'dust',c:'var(--sc-muted)',t:480})});`),
 thumb:{eval:'var i=document.querySelector("input");i.focus();i.value="Neon sketch";i.dispatchEvent(new Event("input"))',wait:120}},

{id:'s-anime-tabs',title:'Stretch tabs',component:'Stretch tabs',key:'anime-tabs',family,width:520,
 description:'A raised tab pill that stretches between tabs and lands with a puff.',
 prompt:'Build a tablist (role="tablist", buttons with role="tab", aria-selected, and a tabpanel). A raised pill sits behind the selected tab; when selection changes the pill stretches toward the new tab (width grows mid-flight) then settles with an overshoot and a small puff of dust. Arrow keys move between tabs. Reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv{flex-direction:column;gap:14px}
.sv-tl{position:relative;display:flex;gap:4px;padding:5px;border-radius:16px;background:var(--sc-surface);border:1px solid var(--sc-line)}
.sv-pill{position:absolute;top:5px;bottom:5px;border-radius:12px;background:var(--sc-accent);transition:left .42s cubic-bezier(.3,1.4,.5,1),width .42s cubic-bezier(.3,1.4,.5,1);z-index:0}
.sv-tab{position:relative;z-index:1;padding:10px 20px;border:0;background:none;border-radius:12px;font-weight:700;cursor:pointer;color:var(--sc-muted);transition:color .2s}
.sv-tab[aria-selected=true]{color:var(--sc-accent-fg)}
.sv-pn{color:var(--sc-muted);min-height:24px;text-align:center}`,
 html:`<div class="sv"><div class="sv-tl" role="tablist" aria-label="Views"><i class="sv-pill"></i><button class="sv-tab" role="tab" aria-selected="true">Frames</button><button class="sv-tab" role="tab" aria-selected="false" tabindex="-1">Timing</button><button class="sv-tab" role="tab" aria-selected="false" tabindex="-1">Export</button></div><p class="sv-pn" role="tabpanel">Frames: every drawing in sequence.</p></div>`,
 js:wrap(`var tabs=[].slice.call(root.querySelectorAll('.sv-tab')),pill=root.querySelector('.sv-pill'),pn=root.querySelector('.sv-pn'),txt=['Frames: every drawing in sequence.','Timing: hold, ease and snap.','Export: render the final cut.'];
function place(t,fx){pill.style.left=t.offsetLeft+'px';pill.style.width=t.offsetWidth+'px';if(fx){var c=mid(h,t);burst(h,c[0],h.querySelector('.sv-tl').offsetTop+t.offsetHeight+2,{n:5,r:20,arc:[-2.9,-.2],shape:'dust',c:'var(--sc-muted)',t:460})}}
function pick(i,fx){tabs.forEach(function(t,k){t.setAttribute('aria-selected',String(k===i));t.tabIndex=k===i?0:-1});pn.textContent=txt[i];place(tabs[i],fx)}
tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(i,true)});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){var n=(i+d+tabs.length)%tabs.length;pick(n,true);tabs[n].focus()}})});
place(tabs[0]);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){place(tabs[+(tabs.map(function(t){return t.getAttribute('aria-selected')}).indexOf('true'))])});`),
 thumb:{click:'.sv-tab:nth-of-type(2)',wait:520}},

{id:'s-anime-progress',title:'Storm-front progress',component:'Storm-front progress',key:'anime-progress',family,width:520,
 description:'A progress bar with puffs at its leading edge and a burst on completion.',
 prompt:'Build a progress bar (role="progressbar" with aria-valuenow) with a Start button. While it fills, puffs of dust drift off the leading edge; when it reaches 100% the bar bursts with particles and shows a check mark and a lettered word. Start again resets it. Use requestAnimationFrame, keep the button keyboard accessible and skip effects for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv{flex-direction:column;gap:18px}
.sv-pg{position:relative;width:min(400px,92%);height:16px;border-radius:99px;background:var(--sc-line)}
.sv-pf{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:var(--sc-accent)}
.sv-pn{font-weight:800;font-variant-numeric:tabular-nums}`,
 html:`<div class="sv"><div class="sv-pg" role="progressbar" aria-label="Render" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="sv-pf"></div></div><div class="sv-pn">0%</div><button class="sv-btn" style="padding:10px 24px;border:2px solid var(--sc-accent);border-radius:12px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:700;cursor:pointer">Start render</button></div>`,
 js:wrap(`var pg=root.querySelector('.sv-pg'),pf=root.querySelector('.sv-pf'),pn=root.querySelector('.sv-pn'),btn=root.querySelector('button'),run=false;
function show(v){pf.style.width=v+'%';pg.setAttribute('aria-valuenow',Math.round(v));pn.textContent=v>=100?'\\u2713 Done':Math.round(v)+'%'}
btn.addEventListener('click',function(){if(run)return;run=true;var t0=performance.now(),puff=0;show(0);(function step(t){var v=Math.min(100,(t-t0)/3000*100);show(v);if(t-puff>150&&v<100){puff=t;var b=pg.getBoundingClientRect(),hb=h.getBoundingClientRect();burst(h,b.left-hb.left+b.width*v/100,b.top-hb.top+8,{n:3,r:20,arc:[-2.4,-.7],shape:'dust',c:'var(--sc-muted)',t:520})}if(v<100)requestAnimationFrame(step);else{run=false;var b2=pg.getBoundingClientRect(),h2=h.getBoundingClientRect();burst(h,b2.right-h2.left,b2.top-h2.top+8,{n:14,r:50});word(h,b2.right-h2.left-40,b2.top-h2.top-6,'DONE!')}})(t0)});`),
 thumb:{click:'button',wait:1500}},

{id:'s-anime-rating',title:'Pop-in rating',component:'Pop-in rating',key:'anime-rating',family,width:520,
 description:'Stars that pop in one after another, bursting when you give five.',
 prompt:'Make a five-star rating built from real buttons inside a role="radiogroup" with aria-label on each star. Clicking a star fills all stars up to it in sequence, each popping with a small scale overshoot, and choosing five fires a burst of particles from the last star. Hover previews the rating. Keyboard operable, reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv-st{display:flex;gap:6px}
.sv-s{width:44px;height:44px;border:0;background:none;padding:0;cursor:pointer;color:var(--sc-line);transition:color .2s}
.sv-s svg{width:100%;height:100%;fill:currentColor}
.sv-s.on{color:#f5b301}`,
 html:`<div class="sv"><div class="sv-st" role="radiogroup" aria-label="Rating"><button class="sv-s" role="radio" aria-checked="false" aria-label="1 star"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"/></svg></button><button class="sv-s" role="radio" aria-checked="false" aria-label="2 stars"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"/></svg></button><button class="sv-s" role="radio" aria-checked="false" aria-label="3 stars"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"/></svg></button><button class="sv-s" role="radio" aria-checked="false" aria-label="4 stars"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"/></svg></button><button class="sv-s" role="radio" aria-checked="false" aria-label="5 stars"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"/></svg></button></div></div>`,
 js:wrap(`var st=[].slice.call(root.querySelectorAll('.sv-s'));
function paint(n){st.forEach(function(s,i){s.classList.toggle('on',i<n)})}
st.forEach(function(s,i){s.addEventListener('mouseenter',function(){paint(i+1)});s.addEventListener('mouseleave',function(){paint(st.filter(function(x){return x.getAttribute('aria-checked')==='true'}).length?+st.filter(function(x){return x.getAttribute('aria-checked')==='true'})[0].dataset.n:0)});s.dataset.n=i+1;
s.addEventListener('click',function(){st.forEach(function(x,k){x.setAttribute('aria-checked',String(k===i))});paint(i+1);st.forEach(function(x,k){if(k<=i&&!rm)x.animate([{transform:'scale(.7)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:380,delay:k*70,easing:'cubic-bezier(.3,1.6,.5,1)'})});if(i===4){var c=mid(h,s);setTimeout(function(){burst(h,c[0],c[1],{n:14,r:58,c:'#f5b301'});word(h,c[0],c[1]-24,'PERFECT!')},320)}})});`),
 thumb:{click:'.sv-s:nth-child(5)',wait:520}},

{id:'s-anime-toast',title:'Streak-in toast',component:'Streak-in toast',key:'anime-toast',family,width:520,
 description:'A toast that streaks in from the side, lands in dust and shrinks away.',
 prompt:'Build a toast notification triggered by a button. The toast (role="status") slides in from the left with a horizontal skew, lands with a small bounce and a puff of dust plus a lettered word, stays for two seconds, then shrinks out. Multiple clicks replace the previous toast. Reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv{flex-direction:column;gap:18px;overflow:hidden}
.sv-btn{padding:12px 24px;border:2px solid var(--sc-accent);border-radius:12px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:700;cursor:pointer}
.sv-t{padding:12px 20px;border-radius:14px;background:var(--sc-fg);color:var(--sc-bg);font-weight:600;min-height:46px;display:flex;align-items:center;gap:10px}
.sv-t[hidden]{display:none}`,
 html:`<div class="sv"><button class="sv-btn">Save changes</button><div class="sv-t" role="status" hidden>✓ Saved to your shelf</div></div>`,
 js:wrap(`var btn=root.querySelector('.sv-btn'),t=root.querySelector('.sv-t'),tm;
btn.addEventListener('click',function(){clearTimeout(tm);t.hidden=false;if(!rm){t.animate([{transform:'translateX(-130%) skewX(-24deg)',opacity:0},{transform:'translateX(8%) skewX(8deg)',opacity:1,offset:.6},{transform:'translateX(0) skewX(0)'}],{duration:520,easing:'cubic-bezier(.2,.9,.3,1.2)'}).onfinish=function(){var c=mid(h,t);burst(h,c[0]-40,c[1]+22,{n:7,r:26,arc:[-3,-.2],shape:'dust',c:'var(--sc-muted)'});word(h,c[0]+30,c[1]-10,'ZA!')}}
tm=setTimeout(function(){if(rm){t.hidden=true;return}t.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.2)',opacity:0}],{duration:300,easing:'ease-in'}).onfinish=function(){t.hidden=true}},2400)});`),
 thumb:{click:'.sv-btn',wait:900}},

{id:'s-anime-tooltip',title:'Speech-bubble tooltip',component:'Speech-bubble tooltip',key:'anime-tooltip',family,width:520,
 description:'Hints that pop up as speech bubbles with a puff and a spring.',
 prompt:'Build tooltips shown on hover and keyboard focus for three buttons. Each tooltip is a speech bubble with a small tail, linked with aria-describedby and role="tooltip". On show it springs up from the tail point with a tiny puff of particles. Escape hides it. Reduced motion respected. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.sv-tw{position:relative}
.sv-tb{padding:12px 22px;border:2px solid var(--sc-line);border-radius:12px;background:var(--sc-surface);font-weight:700;cursor:pointer}
.sv-tip{position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%) scale(0);transform-origin:50% 120%;padding:8px 14px;border-radius:12px;background:var(--sc-fg);color:var(--sc-bg);font-size:13px;font-weight:600;white-space:nowrap;transition:transform .38s cubic-bezier(.3,1.7,.5,1);pointer-events:none}
.sv-tip::after{content:'';position:absolute;left:50%;top:100%;margin-left:-6px;border:6px solid transparent;border-top-color:var(--sc-fg)}
.sv-tw.open .sv-tip{transform:translateX(-50%) scale(1)}`,
 html:`<div class="sv"><span class="sv-tw"><button class="sv-tb" aria-describedby="t1">Undo</button><span class="sv-tip" id="t1" role="tooltip">Take that back!</span></span><span class="sv-tw"><button class="sv-tb" aria-describedby="t2">Share</button><span class="sv-tip" id="t2" role="tooltip">Send it out</span></span><span class="sv-tw"><button class="sv-tb" aria-describedby="t3">Archive</button><span class="sv-tip" id="t3" role="tooltip">Tuck it away</span></span></div>`,
 js:wrap(`root.querySelectorAll('.sv-tw').forEach(function(w){var b=w.firstElementChild;function open(){if(w.classList.contains('open'))return;w.classList.add('open');var c=mid(h,b);burst(h,c[0],c[1]-b.offsetHeight/2-4,{n:5,r:18,arc:[-2.8,-.3],shape:'dust',c:'var(--sc-muted)',t:420})}function close(){w.classList.remove('open')}w.addEventListener('mouseenter',open);w.addEventListener('mouseleave',close);b.addEventListener('focus',open);b.addEventListener('blur',close);b.addEventListener('keydown',function(e){if(e.key==='Escape')close()})})`),
 thumb:{hover:'.sv-tw:nth-child(2) .sv-tb',wait:520}},
];
