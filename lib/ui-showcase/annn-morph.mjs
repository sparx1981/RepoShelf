// Original morphing and liquid UI components. Plain HTML, CSS and JavaScript; no third-party code.
import {ART} from './art-boot.mjs';
const family='Morphing UI';
const GOO=(id,std)=>`<svg class="goo-svg" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><filter id="${id}" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="${std}" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></svg>`;
export const annnMorph=[
{id:'s-morph-tooltip',title:'Morphing tooltip',component:'Morphing tooltip',key:'morph-tooltip',family,width:640,
 description:'One dark tooltip that pulls up out of a toolbar button, slides between neighbours resizing to each caption and sinks back when you leave.',
 prompt:'Build a toolbar of five icon buttons (inline SVG icons, aria-label on each) with a single shared tooltip element. On the first hover or focus the tooltip starts exactly over the button (the same size and position, fully transparent, radius 14px) and transitions to its final place above the button (width = measured caption width + 28px, height 34px, centred, 10px gap) so it appears to be pulled out of the button. Moving to another button updates left and width so the tooltip slides and resizes in 0.38s with cubic-bezier(.3,.9,.3,1.1) while the caption cross-fades. Leaving the toolbar (or blur) transitions it back to the last button\'s rectangle and fades it out. Measure the caption with an off-screen span in the same font, position with left/top/width/height relative to a positioned wrapper, set aria-describedby on the focused button and give the tooltip role="tooltip". Use theme tokens (dark pill on light theme, light pill on dark). Reduced motion removes the transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.mt{display:grid;place-items:center;height:260px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.mt-wrap{position:relative}
.mt-bar{display:flex;gap:6px;padding:8px;border:1px solid var(--sc-line);border-radius:20px;background:var(--sc-bg)}
.mt-btn{display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:14px;background:transparent;color:var(--sc-muted);cursor:pointer;transition:background .2s,color .2s}
.mt-btn:hover,.mt-btn:focus-visible{background:var(--sc-surface);color:var(--sc-fg)}
.mt-btn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mt-tip{position:absolute;left:0;top:0;z-index:3;display:grid;place-items:center;overflow:hidden;background:var(--sc-fg);color:var(--sc-bg);border-radius:14px;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:left .38s cubic-bezier(.3,.9,.3,1.1),top .38s cubic-bezier(.3,.9,.3,1.1),width .38s cubic-bezier(.3,.9,.3,1.1),height .38s cubic-bezier(.3,.9,.3,1.1),border-radius .38s,opacity .2s}
.mt-tip.is-on{opacity:1;border-radius:11px}
.mt-tip span{transition:opacity .16s}
.mt-tip.swap span{opacity:0}
.mt-measure{position:absolute;visibility:hidden;white-space:nowrap;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif}
.mt-hint{margin:16px 0 0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sc-muted);text-align:center}
@media (prefers-reduced-motion:reduce){.mt-tip,.mt-tip span{transition:none}}`,
 html:`<div class="mt"><div><div class="mt-wrap"><div class="mt-bar" role="toolbar" aria-label="Quick actions"><button class="mt-btn" type="button" data-tip="Home" aria-label="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg></button><button class="mt-btn" type="button" data-tip="Search the library" aria-label="Search the library"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg></button><button class="mt-btn" type="button" data-tip="Notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/></svg></button><button class="mt-btn" type="button" data-tip="Settings" aria-label="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></button><button class="mt-btn" type="button" data-tip="Your profile" aria-label="Your profile"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></button></div><div class="mt-tip" role="tooltip" id="mt-tip"><span></span></div><span class="mt-measure"></span></div><p class="mt-hint">Hover or focus a button</p></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.mt'),wrap=root.querySelector('.mt-wrap'),tip=root.querySelector('.mt-tip'),txt=tip.querySelector('span'),meas=root.querySelector('.mt-measure'),btns=[].slice.call(root.querySelectorAll('.mt-btn'));
var cur=null,hideT=0;
function rect(b){var r=b.getBoundingClientRect(),w=wrap.getBoundingClientRect();return {l:r.left-w.left,t:r.top-w.top,w:r.width,h:r.height}}
function setBox(l,t,w,h){tip.style.left=l+'px';tip.style.top=t+'px';tip.style.width=w+'px';tip.style.height=h+'px'}
function show(b){clearTimeout(hideT);var r=rect(b);meas.textContent=b.getAttribute('data-tip');var w=Math.ceil(meas.getBoundingClientRect().width)+28,l=r.l+r.w/2-w/2,t=r.t-34-10;
 if(!cur){tip.style.transition='none';setBox(r.l,r.t,r.w,r.h);txt.textContent='';void tip.offsetWidth;tip.style.transition='';requestAnimationFrame(function(){tip.classList.add('is-on');txt.textContent=b.getAttribute('data-tip');setBox(l,t,w,34)})}
 else{tip.classList.add('swap');setTimeout(function(){txt.textContent=b.getAttribute('data-tip');tip.classList.remove('swap')},110);tip.classList.add('is-on');setBox(l,t,w,34)}
 if(cur)cur.removeAttribute('aria-describedby');b.setAttribute('aria-describedby','mt-tip');cur=b}
function hide(){hideT=setTimeout(function(){if(!cur)return;var r=rect(cur);tip.classList.remove('is-on');setBox(r.l,r.t,r.w,r.h);cur.removeAttribute('aria-describedby');cur=null},60)}
btns.forEach(function(b){b.addEventListener('pointerenter',function(){show(b)});b.addEventListener('focus',function(){show(b)});b.addEventListener('pointerleave',hide);b.addEventListener('blur',hide)});
var n=0,auto=setInterval(function(){if(matchMedia('(hover:hover)').matches&&root.matches(':hover'))return;if(document.activeElement&&root.contains(document.activeElement))return;if(n%7<5)show(btns[n%7]);else hide();n++},1700);
root.addEventListener('pointerenter',function(){clearInterval(auto)});})();`},

{id:'s-morph-island',title:'Morphing island',component:'Morphing island',key:'morph-island',family,width:640,
 description:'A dark capsule pinned to the top that names the section you are in, then grows into a section list and a short description.',
 prompt:'Create a "dynamic island" capsule inside a scrolling stage. The stage holds a scrollable area with four tall sections (Overview, Features, Pricing, Contact), each with a heading and a coloured band. The capsule is absolutely positioned at the top centre and has three states set by a data-state attribute: pill (190x44, radius 22), list (320x222, radius 28) and detail (340x132, radius 26); width, height and radius transition over 0.5s cubic-bezier(.3,1.15,.4,1). The pill shows a coloured dot and the current section name, which rolls (old name slides up and out, new slides in from below) when the scroll position crosses into another section (compute from scrollTop). Clicking the pill opens the list (four buttons), choosing one scrolls the stage smoothly to it and grows the capsule into the detail state with a one-sentence description and a "Scroll to" button and a Back button; after 3s of inactivity or on Escape / outside click the capsule settles back into the pill. Each state\'s content cross-fades (inactive layers have opacity 0 and are inert/hidden). The capsule trigger is a real button with aria-expanded. Reduced motion removes transitions and the smooth scrolling. Vanilla HTML, CSS and JavaScript.',
 css:`.mi{position:relative;height:430px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.mi-scroll{position:absolute;inset:0;overflow-y:auto;scroll-behavior:smooth;padding:70px 22px 22px}
.mi-sec{height:300px;margin-bottom:18px;border-radius:22px;padding:26px;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(135deg,hsl(var(--h) 80% 58%),hsl(calc(var(--h) + 40) 80% 40%))}
.mi-sec h3{margin:0 0 6px;font:800 30px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em}
.mi-sec p{margin:0;opacity:.88;font-size:15px}
.mi-isl{position:absolute;left:50%;top:14px;z-index:5;width:190px;height:44px;border-radius:22px;margin-left:-95px;background:#0b0b0f;color:#fff;overflow:hidden;box-shadow:0 14px 30px -10px rgba(0,0,0,.5);transition:width .5s cubic-bezier(.3,1.15,.4,1),height .5s cubic-bezier(.3,1.15,.4,1),border-radius .5s,margin-left .5s cubic-bezier(.3,1.15,.4,1)}
.mi-isl[data-state=list]{width:320px;height:222px;border-radius:28px;margin-left:-160px}
.mi-isl[data-state=detail]{width:340px;height:132px;border-radius:26px;margin-left:-170px}
.mi-layer{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}
.mi-isl[data-state=pill] .mi-pill,.mi-isl[data-state=list] .mi-list,.mi-isl[data-state=detail] .mi-detail{opacity:1;visibility:visible;transition:opacity .3s .18s,visibility 0s}
.mi-pill{display:flex;align-items:center;gap:10px;padding:0 18px;width:100%;height:44px;border:0;background:transparent;color:inherit;cursor:pointer;font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif}
.mi-dot{flex:none;width:9px;height:9px;border-radius:50%;background:hsl(var(--h,262) 90% 66%);box-shadow:0 0 10px hsl(var(--h,262) 90% 66%)}
.mi-name{position:relative;flex:1;height:18px;overflow:hidden;text-align:left}
.mi-name span{position:absolute;left:0;top:0;line-height:18px;transition:transform .35s cubic-bezier(.3,.9,.3,1),opacity .35s}
.mi-list{padding:16px}
.mi-list p{margin:0 0 8px 4px;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:#8d8da0}
.mi-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:0;border-radius:14px;background:transparent;color:inherit;cursor:pointer;font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}
.mi-item:hover,.mi-item:focus-visible{background:rgba(255,255,255,.1)}
.mi-item i{width:9px;height:9px;border-radius:50%;background:hsl(var(--h) 90% 66%)}
.mi-detail{padding:16px 20px}
.mi-detail h4{margin:0 0 4px;font:800 17px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}
.mi-detail p{margin:0 0 12px;font-size:13px;line-height:1.4;color:#c4c4d2}
.mi-row{display:flex;gap:8px}
.mi-btn{padding:7px 14px;border:0;border-radius:999px;background:#fff;color:#111;cursor:pointer;font-size:12px;font-weight:700}
.mi-btn.ghost{background:rgba(255,255,255,.14);color:#fff}
@media (prefers-reduced-motion:reduce){.mi-isl,.mi-layer,.mi-name span{transition:none}.mi-scroll{scroll-behavior:auto}}`,
 html:`<div class="mi"><div class="mi-scroll" tabindex="0" role="region" aria-label="Sections"></div><div class="mi-isl" data-state="pill"><button class="mi-layer mi-pill" type="button" aria-expanded="false" aria-label="Sections menu"><i class="mi-dot"></i><span class="mi-name"></span></button><div class="mi-layer mi-list" role="menu"><p>JUMP TO</p></div><div class="mi-layer mi-detail"><h4></h4><p></p><div class="mi-row"><button class="mi-btn go" type="button">Scroll to</button><button class="mi-btn ghost back" type="button">Back</button></div></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.mi'),scroll=root.querySelector('.mi-scroll'),isl=root.querySelector('.mi-isl'),pill=root.querySelector('.mi-pill'),nameEl=root.querySelector('.mi-name'),list=root.querySelector('.mi-list'),det=root.querySelector('.mi-detail');
var secs=[['Overview',262,'A quick tour of what is inside and where to start.'],['Features',320,'Everything the product does, grouped into short chapters.'],['Pricing',28,'Simple plans with a yearly discount and no hidden extras.'],['Contact',190,'Talk to the team, book a call or send a message.']],els=[],cur=-1,timer=0,pick=0,state='pill';
secs.forEach(function(s,i){var d=document.createElement('section');d.className='mi-sec';d.style.setProperty('--h',s[1]);var h=document.createElement('h3');h.textContent=s[0];var p=document.createElement('p');p.textContent=s[2];d.appendChild(h);d.appendChild(p);scroll.appendChild(d);els.push(d);
 var b=document.createElement('button');b.type='button';b.className='mi-item';b.setAttribute('role','menuitem');var dot=document.createElement('i');dot.style.setProperty('--h',s[1]);b.appendChild(dot);b.appendChild(document.createTextNode(s[0]));b.addEventListener('click',function(){pick=i;els[i].scrollIntoView({block:'start'});set('detail')});list.appendChild(b)});
function set(s){state=s;isl.setAttribute('data-state',s);pill.setAttribute('aria-expanded',String(s!=='pill'));clearTimeout(timer);if(s==='detail'){var q=secs[pick];det.querySelector('h4').textContent=q[0];det.querySelector('p').textContent=q[2];timer=setTimeout(function(){set('pill')},3200)}}
function label(i){if(i===cur)return;var old=nameEl.querySelector('span:last-child'),n=document.createElement('span');n.textContent=secs[i][0];n.style.transform='translateY(110%)';n.style.opacity=0;nameEl.appendChild(n);void n.offsetWidth;if(old){old.style.transform='translateY(-110%)';old.style.opacity=0;setTimeout(function(){old.remove()},360)}n.style.transform='none';n.style.opacity=1;isl.style.setProperty('--h',secs[i][1]);cur=i}
function spy(){var st=scroll.scrollTop+90,idx=0;els.forEach(function(e,i){if(e.offsetTop<=st)idx=i});label(idx)}
scroll.addEventListener('scroll',spy,{passive:true});label(0);
pill.addEventListener('click',function(){set(state==='pill'?'list':'pill')});
det.querySelector('.go').addEventListener('click',function(){els[pick].scrollIntoView({block:'start'});set('pill')});det.querySelector('.back').addEventListener('click',function(){set('list')});
root.addEventListener('keydown',function(e){if(e.key==='Escape')set('pill')});document.addEventListener('pointerdown',function(e){if(state!=='pill'&&!isl.contains(e.target))set('pill')});
var auto=0,k=0;function tour(){if(state!=='pill')return;k=(k+1)%4;els[k].scrollIntoView({block:'start'})}auto=setInterval(tour,3000);root.addEventListener('pointerenter',function(){clearInterval(auto)});root.addEventListener('focusin',function(){clearInterval(auto)});})();`},

{id:'s-morph-dialog',title:'Morphing dialog',component:'Morphing dialog',key:'morph-dialog',family,width:560,
 description:'A card that grows into a native dialog, its thumbnail and title travelling to their new places, and flying back on close.',
 prompt:'Build a card that morphs into a modal built on the native <dialog> element (showModal(), so focus trapping, Escape and the backdrop come for free). The card is a real button with a 64px generated thumbnail, a title, a meta line and a chevron. On click, show the dialog (opacity 0), measure the card\'s thumbnail and title rectangles and the dialog\'s thumbnail and title rectangles, hide the card\'s own thumbnail/title (visibility hidden) and animate the dialog\'s thumbnail and title with the Web Animations API from the card\'s rectangle (translate + scale, transform-origin top left) to their own place over 0.5s cubic-bezier(.3,.8,.2,1) while the dialog panel fades and scales from 0.94, the body copy fades in 0.15s later and the ::backdrop blurs and darkens. On close (button, Escape via the cancel event, or a click on the backdrop) run the same animation in reverse, then call close() and restore the card. Return focus to the card. Reduced motion skips the animations. Vanilla HTML, CSS and JavaScript.',
 css:`.md{display:grid;place-items:center;min-height:300px;padding:30px 20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.md-card{display:flex;align-items:center;gap:16px;width:min(100%,420px);padding:14px 18px 14px 14px;border:1px solid var(--sc-line);border-radius:22px;background:var(--sc-bg);color:inherit;text-align:left;cursor:pointer;transition:transform .25s,box-shadow .25s}
.md-card:hover{transform:translateY(-2px);box-shadow:0 18px 30px -18px rgba(0,0,0,.35)}
.md-th{flex:none;width:64px;height:64px;border-radius:16px;background-size:cover;background-position:center}
.md-card.is-open .md-th,.md-card.is-open .md-tt{visibility:hidden}
.md-tt{display:block;font:800 17px/1.15 system-ui,-apple-system,"Segoe UI",sans-serif}
.md-meta{display:block;margin-top:4px;font-size:13px;color:var(--sc-muted)}
.md-chev{margin-left:auto;color:var(--sc-muted);font-size:20px}
.md-dlg{width:min(92vw,460px);padding:0;border:0;border-radius:28px;background:var(--sc-bg);color:var(--sc-fg);overflow:visible;box-shadow:0 40px 80px -20px rgba(0,0,0,.5)}
.md-dlg::backdrop{background:rgba(10,10,20,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.md-panel{padding:22px 22px 24px}
.md-big{display:block;width:100%;height:190px;border-radius:20px;background-size:cover;background-position:center;transform-origin:0 0}
.md-h{margin:18px 0 6px;font:800 26px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em;transform-origin:0 0;display:block}
.md-body p{margin:0 0 14px;font-size:15px;line-height:1.55;color:var(--sc-muted)}
.md-close{padding:9px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-surface);color:inherit;cursor:pointer;font-size:14px;font-weight:600}
.md-close:hover{border-color:var(--sc-accent)}`,
 html:`<div class="md"><button class="md-card" type="button" aria-haspopup="dialog"><span class="md-th"></span><span><span class="md-tt">Lilac Morning</span><span class="md-meta">Photo story · 4 min read</span></span><span class="md-chev" aria-hidden="true">&#8250;</span></button><dialog class="md-dlg" aria-labelledby="md-h"><div class="md-panel"><span class="md-big"></span><span class="md-h" id="md-h">Lilac Morning</span><div class="md-body"><p>Soft light arrives before the colour does. The valley holds its breath, the ridgelines stack into pale violet layers, and for a few minutes everything looks painted.</p><p>Shot over three early mornings with a single wide lens.</p><button class="md-close" type="button">Close</button></div></div></dialog></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.md'),card=root.querySelector('.md-card'),dlg=root.querySelector('.md-dlg'),th=card.querySelector('.md-th'),tt=card.querySelector('.md-tt'),big=dlg.querySelector('.md-big'),hh=dlg.querySelector('.md-h'),body=dlg.querySelector('.md-body'),panel=dlg.querySelector('.md-panel'),close=dlg.querySelector('.md-close');
${ART}
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,busy=false,E='cubic-bezier(.3,.8,.2,1)';
th.style.backgroundImage='url('+artURL(7,128,128)+')';big.style.backgroundImage='url('+artURL(7,420,190)+')';
function tf(from,to){var sx=from.width/to.width,sy=from.height/to.height;return 'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+sx+','+sy+')'}
function run(el,a,b,opts){return el.animate([{transform:a},{transform:b}],opts)}
function open(){if(busy||dlg.open)return;busy=true;dlg.style.opacity=0;dlg.showModal();var c1=th.getBoundingClientRect(),c2=tt.getBoundingClientRect(),d1=big.getBoundingClientRect(),d2=hh.getBoundingClientRect();card.classList.add('is-open');dlg.style.opacity='';
 if(reduce){busy=false;return}
 var o={duration:500,easing:E};run(big,tf(c1,d1),'none',o);run(hh,tf(c2,d2),'none',o);dlg.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'none'}],{duration:380,easing:E});body.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:400,delay:150,easing:'ease',fill:'backwards'});
 setTimeout(function(){busy=false},520)}
function shut(){if(busy||!dlg.open)return;busy=true;var finish=function(){dlg.close();card.classList.remove('is-open');busy=false;card.focus()};if(reduce){finish();return}
 var c1=th.getBoundingClientRect(),c2=tt.getBoundingClientRect(),d1=big.getBoundingClientRect(),d2=hh.getBoundingClientRect(),o={duration:420,easing:E,fill:'forwards'};
 run(big,'none',tf(c1,d1),o);run(hh,'none',tf(c2,d2),o);body.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});var a=dlg.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.96)'}],{duration:420,easing:E,fill:'forwards'});a.onfinish=function(){finish();[big,hh,body,dlg].forEach(function(e){e.getAnimations().forEach(function(x){x.cancel()})})}}
card.addEventListener('click',open);close.addEventListener('click',shut);dlg.addEventListener('cancel',function(e){e.preventDefault();shut()});dlg.addEventListener('click',function(e){if(e.target===dlg)shut()});})();`},

{id:'s-gooey-toast',title:'Gooey toasts',component:'Gooey toasts',key:'gooey-toast',family,width:640,
 description:'Notification toasts with a liquid stack: a new one slides in under the last and the two stay joined by a stretching neck.',
 prompt:'Make a toast stack in a corner of a stage. Each toast has two parts at the same position: a background shape (dark rounded rectangle 320x58) placed in a "goo" layer that has an SVG filter applied (feGaussianBlur stdDeviation 9 followed by feColorMatrix that multiplies alpha by 20 and subtracts 9), and the readable content (icon, title, message and a close button) in a separate layer above, un-filtered, so text stays sharp. Toasts are absolutely positioned and transform: translateY(index * (58 + gap)) with transitions of 0.55s cubic-bezier(.3,1.25,.4,1); index 0 is the newest at the bottom. Adding a toast makes it enter from below the stack (translateY(+90px) to its slot) while every older toast shifts up one slot; at a gap of 8px the filter joins neighbours with a liquid neck while they are moving. Hovering the stack opens the gap to 16px with the same effect. Closing a toast (button or after 5s) shrinks it and closes the gap. Keep at most four visible (the oldest is removed). The container is role="region" aria-live="polite" label "Notifications"; an "Add toast" button creates sample messages. Reduced motion removes transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.gt2{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden}
.gt2-btn{position:absolute;left:20px;top:20px;padding:10px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:14px;font-weight:600}
.gt2-btn:hover{border-color:var(--sc-accent)}
.gt2-stack{position:absolute;right:20px;bottom:20px;width:320px;height:290px}
.gt2-goo,.gt2-txt{position:absolute;inset:0}
.gt2-goo{filter:url(#gt2-goo);pointer-events:none}
.gt2-bg,.gt2-it{position:absolute;left:0;bottom:0;width:320px;height:58px;transform:translateY(calc(var(--y,0)*1px));transition:transform .55s cubic-bezier(.3,1.25,.4,1),opacity .35s}
.gt2-bg{border-radius:29px;background:var(--sc-fg)}
.gt2-it{display:flex;align-items:center;gap:12px;padding:0 10px 0 14px;color:var(--sc-bg)}
.gt2-bg.out,.gt2-it.out{opacity:0}
.gt2-ic{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:hsl(var(--h) 80% 62%);color:#fff;font:800 14px/1 system-ui}
.gt2-tx{min-width:0;flex:1}
.gt2-tx strong{display:block;font-size:14px;line-height:1.1}
.gt2-tx span{display:block;font-size:12px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gt2-x{flex:none;width:30px;height:30px;border:0;border-radius:50%;background:rgba(127,127,127,.25);color:inherit;cursor:pointer;font-size:16px;line-height:1}
.gt2-x:hover{background:rgba(127,127,127,.45)}
@media (prefers-reduced-motion:reduce){.gt2-bg,.gt2-it{transition:none}}`,
 html:`<div class="gt2"><button class="gt2-btn" type="button">Add toast</button><div class="gt2-stack" role="region" aria-live="polite" aria-label="Notifications"><div class="gt2-goo"></div><div class="gt2-txt"></div></div>${GOO('gt2-goo',9)}</div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gt2'),stack=root.querySelector('.gt2-stack'),goo=root.querySelector('.gt2-goo'),txt=root.querySelector('.gt2-txt'),btn=root.querySelector('.gt2-btn');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,T=[],n=0,gap=8,msgs=[['Saved','Your changes are live.',150,'\\u2713'],['New comment','Ines replied to your post.',262,'\\u2709'],['Build passed','Deploy finished in 1m 12s.',200,'\\u2713'],['Invite sent','Theo will get an email.',330,'+'],['Upload done','12 files added to Assets.',40,'\\u2191']];
function layout(){T.forEach(function(t,i){var y=-(i*(58+gap));t.bg.style.setProperty('--y',y);t.it.style.setProperty('--y',y)})}
function add(){var m=msgs[n++%msgs.length],bg=document.createElement('div');bg.className='gt2-bg';var it=document.createElement('div');it.className='gt2-it';
 var ic=document.createElement('span');ic.className='gt2-ic';ic.style.setProperty('--h',m[2]);ic.textContent=m[3];var tx=document.createElement('div');tx.className='gt2-tx';var s=document.createElement('strong');s.textContent=m[0];var p=document.createElement('span');p.textContent=m[1];tx.appendChild(s);tx.appendChild(p);var x=document.createElement('button');x.type='button';x.className='gt2-x';x.setAttribute('aria-label','Dismiss '+m[0]);x.textContent='\\u00d7';it.appendChild(ic);it.appendChild(tx);it.appendChild(x);
 bg.style.setProperty('--y',90);it.style.setProperty('--y',90);bg.style.opacity=0;it.style.opacity=0;goo.appendChild(bg);txt.appendChild(it);var t={bg:bg,it:it,timer:0};T.unshift(t);void bg.offsetWidth;bg.style.opacity='';it.style.opacity='';layout();
 x.addEventListener('click',function(){remove(t)});t.timer=setTimeout(function(){remove(t)},5200);if(T.length>4)remove(T[T.length-1])}
function remove(t){var i=T.indexOf(t);if(i<0)return;clearTimeout(t.timer);T.splice(i,1);t.bg.classList.add('out');t.it.classList.add('out');layout();setTimeout(function(){t.bg.remove();t.it.remove()},reduce?0:400)}
btn.addEventListener('click',add);stack.addEventListener('pointerenter',function(){gap=16;layout()});stack.addEventListener('pointerleave',function(){gap=8;layout()});
add();setTimeout(add,500);var auto=setInterval(function(){if(!root.matches(':hover'))add()},2600);root.addEventListener('pointerenter',function(){clearInterval(auto)});})();`},

{id:'s-gooey-chips',title:'Gooey filter chips',component:'Gooey filter chips',key:'gooey-chips',family,width:640,
 description:'Filter chips fly down into a selection tray and merge into it with a liquid neck; remove one and it snaps back out.',
 prompt:'Build a filter panel with a pool of eight chips and a tray beneath it. Every chip is made of two elements at the same position: a background pill in a goo layer (SVG filter: feGaussianBlur stdDeviation 8, feColorMatrix alpha x20 - 9) and the readable label in an unfiltered layer above; the tray background is also a shape in the goo layer so chips merge into it. A layout function wraps the unselected chips in the top area and the selected chips inside the tray (using measured label widths and 8px gaps) and sets each chip\'s transform: translate(x, y); the transition is 0.65s cubic-bezier(.3,1.2,.4,1) with a delay proportional to the chip\'s distance moved so far ones arrive later. Clicking a chip toggles it (aria-pressed on a real button sitting in the label layer). A results line rolls its number (the old digit slides up, the new one in from below) as the count changes, e.g. 128 results divided by the selection. A Clear button empties the tray. Reduced motion removes transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.gc2{position:relative;height:390px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface);overflow:hidden;padding:22px}
.gc2-area{position:relative;height:320px}
.gc2-goo,.gc2-lab{position:absolute;inset:0}
.gc2-goo{filter:url(#gc2-goo);pointer-events:none}
.gc2-tray{position:absolute;left:0;right:0;bottom:60px;height:130px;border-radius:26px;background:var(--sc-line)}
.gc2-bg,.gc2-chip{position:absolute;left:0;top:0;height:40px;transform:translate(calc(var(--x)*1px),calc(var(--y)*1px));transition:transform .65s cubic-bezier(.3,1.2,.4,1) var(--d,0s)}
.gc2-bg{border-radius:20px;width:calc(var(--w)*1px);background:hsl(var(--h) 80% 62%)}
.gc2-chip{display:flex;align-items:center;justify-content:center;width:calc(var(--w)*1px);padding:0;border:0;border-radius:20px;background:transparent;color:#fff;cursor:pointer;font:700 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.25)}
.gc2-tl{position:absolute;left:18px;bottom:68px;margin:0;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--sc-muted);transform:translateY(-124px);pointer-events:none}
.gc2-foot{position:absolute;left:22px;right:22px;bottom:18px;display:flex;align-items:center;justify-content:space-between}
.gc2-res{display:flex;align-items:baseline;gap:8px;font:600 14px/1 system-ui;color:var(--sc-muted)}
.gc2-num{position:relative;display:inline-block;height:28px;min-width:3ch;overflow:hidden;font:800 26px/28px system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--sc-fg)}
.gc2-num span{position:absolute;left:0;top:0;transition:transform .4s cubic-bezier(.3,.9,.3,1),opacity .4s}
.gc2-clr{padding:8px 16px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-bg);cursor:pointer;font-size:13px;font-weight:600}
.gc2-clr:hover{border-color:var(--sc-accent)}
@media (prefers-reduced-motion:reduce){.gc2-bg,.gc2-chip,.gc2-num span{transition:none}}`,
 html:`<div class="gc2"><div class="gc2-area" role="group" aria-label="Filters"><div class="gc2-goo"><div class="gc2-tray"></div></div><div class="gc2-lab"></div><p class="gc2-tl">Selected</p></div><div class="gc2-foot"><div class="gc2-res"><span class="gc2-num" aria-live="polite"></span>results</div><button class="gc2-clr" type="button">Clear</button></div>${GOO('gc2-goo',5)}</div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.gc2'),area=root.querySelector('.gc2-area'),goo=root.querySelector('.gc2-goo'),lab=root.querySelector('.gc2-lab'),numEl=root.querySelector('.gc2-num'),clr=root.querySelector('.gc2-clr');
var names=['Landscape','Portrait','Night','Golden hour','Minimal','Texture','Abstract','Aerial'],hues=[262,330,222,28,190,150,300,350],C=[],cur=-1;
names.forEach(function(nm,i){var bg=document.createElement('div');bg.className='gc2-bg';bg.style.setProperty('--h',hues[i]);var b=document.createElement('button');b.type='button';b.className='gc2-chip';b.textContent=nm;b.setAttribute('aria-pressed','false');var w=Math.ceil(nm.length*8.6+34);bg.style.setProperty('--w',w);b.style.setProperty('--w',w);goo.appendChild(bg);lab.appendChild(b);var c={bg:bg,b:b,w:w,sel:false,x:0,y:0};C.push(c);b.addEventListener('click',function(){c.sel=!c.sel;b.setAttribute('aria-pressed',String(c.sel));layout()})});
function flow(list,x0,y0,W){var x=x0,y=y0;list.forEach(function(c){if(x+c.w>x0+W){x=x0;y+=50}c.nx=x;c.ny=y;x+=c.w+14})}
function layout(){var W=area.clientWidth,pool=C.filter(function(c){return !c.sel}),sel=C.filter(function(c){return c.sel});flow(pool,0,0,W);var trayTop=area.clientHeight-130-0+0;flow(sel,16,area.clientHeight-118,W-32);
 var prevS=C.map(function(c){return [c.x,c.y]});C.forEach(function(c,i){var dist=Math.hypot(c.nx-c.x,c.ny-c.y),d=Math.min(.25,dist/1800);c.bg.style.setProperty('--d',d+'s');c.b.style.setProperty('--d',d+'s');c.x=c.nx;c.y=c.ny;c.bg.style.setProperty('--x',c.x);c.bg.style.setProperty('--y',c.y);c.b.style.setProperty('--x',c.x);c.b.style.setProperty('--y',c.y)});
 var k=sel.length,total=k?Math.max(6,Math.round(128/Math.pow(1.9,k))):128;roll(total)}
function roll(v){if(v===cur)return;var up=v<cur||cur<0,o=numEl.querySelector('span:last-child'),n=document.createElement('span');n.textContent=v;n.style.transform='translateY('+(up?'100%':'-100%')+')';n.style.opacity=0;numEl.appendChild(n);void n.offsetWidth;if(o){o.style.transform='translateY('+(up?'-100%':'100%')+')';o.style.opacity=0;setTimeout(function(){o.remove()},420)}n.style.transform='none';n.style.opacity=1;cur=v}
clr.addEventListener('click',function(){C.forEach(function(c){c.sel=false;c.b.setAttribute('aria-pressed','false')});layout()});
C.forEach(function(c){c.x=c.nx=0});layout();
var auto=0,seq=[1,4,6,1,4,6],si=0;auto=setInterval(function(){var c=C[seq[si%seq.length]];c.sel=!c.sel;c.b.setAttribute('aria-pressed',String(c.sel));si++;layout()},1700);root.addEventListener('pointerenter',function(){clearInterval(auto)});root.addEventListener('focusin',function(){clearInterval(auto)});addEventListener('resize',layout);})();`},

{id:'s-morph-tabs',title:'Morphing tabs',component:'Morphing tabs',key:'morph-tabs',family,width:640,
 description:'Tabs whose highlight pill is joined to the content panel by a curved neck that follows it as it springs along.',
 prompt:'Create a tab set where the active pill and the content panel below are drawn as one continuous shape. Use real buttons (role="tab") in a bar and a panel (role="tabpanel"). An absolutely positioned SVG sits behind them and draws three things in the same tint: the pill (a rounded rectangle matching the active tab\'s offsetLeft/offsetWidth), the panel (a rounded rectangle from the panel\'s top to the bottom of the component) and a neck path between them: M x 44 L x+w 44 Q x+w P x+w+18 P L x-18 P Q x P x 44 Z where x and w are the pill\'s animated position and width and P is the panel\'s top edge, so concave fillets join the pill to the panel. Animate x and w with a spring (stiffness 0.16, damping 0.72) in requestAnimationFrame and redraw the path each frame. Clicking or arrowing between tabs (left/right, Home/End) changes the tab; the panel content slides out in the direction of travel and the new content slides in, with aria-selected, aria-controls and roving tabindex. Four tabs (Overview, Specs, Pricing, Reviews) with a short paragraph and two key-value rows each. Reduced motion jumps without springs. Vanilla HTML, CSS and JavaScript.',
 css:`.mtb{position:relative;padding:20px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.mtb-in{position:relative;width:min(100%,520px);margin:0 auto}
.mtb-svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.mtb-svg *{fill:color-mix(in srgb,var(--sc-accent) 16%,var(--sc-bg))}
.mtb-bar{position:relative;display:flex;gap:4px;height:44px;margin-bottom:8px}
.mtb-tab{position:relative;z-index:2;padding:0 20px;border:0;border-radius:22px;background:transparent;color:var(--sc-muted);cursor:pointer;font:700 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;transition:color .25s}
.mtb-tab[aria-selected=true]{color:var(--sc-fg)}
.mtb-panel{position:relative;z-index:2;min-height:178px;padding:26px 24px 24px;overflow:hidden}
.mtb-pane{transition:transform .4s cubic-bezier(.3,.9,.3,1),opacity .3s}
.mtb-pane h3{margin:0 0 8px;font:800 22px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}
.mtb-pane p{margin:0 0 14px;font-size:15px;line-height:1.5;color:var(--sc-muted)}
.mtb-kv{display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid var(--sc-line);font-size:14px}
.mtb-kv b{font-weight:700}
@media (prefers-reduced-motion:reduce){.mtb-pane{transition:none}}`,
 html:`<div class="mtb"><div class="mtb-in"><svg class="mtb-svg" aria-hidden="true"><rect class="p" rx="22"/><path class="n"/><rect class="r" rx="22"/></svg><div class="mtb-bar" role="tablist" aria-label="Product details"></div><div class="mtb-panel" role="tabpanel" id="mtb-panel"></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.mtb'),inn=root.querySelector('.mtb-in'),bar=root.querySelector('.mtb-bar'),panel=root.querySelector('.mtb-panel'),rp=root.querySelector('.p'),rn=root.querySelector('.n'),rr=root.querySelector('.r');
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,data=[['Overview','A compact studio lamp that stays out of the way and lights up the whole desk.',[['Finish','Matte graphite'],['Weight','1.2 kg']]],['Specs','Built from machined aluminium with a diffused, flicker-free light source.',[['Output','900 lumens'],['Colour','2700\\u20136500 K']]],['Pricing','One price, two years of cover and free replacement parts.',[['Lamp','$129'],['Care plan','$19 / year']]],['Reviews','Rated 4.8 out of 5 by more than two thousand owners.',[['Build','4.9'],['Value','4.7']]]],tabs=[],cur=0,x=0,w=80,vx=0,vw=0,tx=0,tw=80,raf=0,P=52;
data.forEach(function(d,i){var b=document.createElement('button');b.type='button';b.className='mtb-tab';b.setAttribute('role','tab');b.setAttribute('aria-controls','mtb-panel');b.textContent=d[0];b.addEventListener('click',function(){go(i)});b.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:-1;if(n>=0){e.preventDefault();go(n);tabs[n].focus()}});bar.appendChild(b);tabs.push(b)});
function pane(i){var d=data[i],p=document.createElement('div');p.className='mtb-pane';var h=document.createElement('h3');h.textContent=d[0];var t=document.createElement('p');t.textContent=d[1];p.appendChild(h);p.appendChild(t);d[2].forEach(function(kv){var r=document.createElement('div');r.className='mtb-kv';var a=document.createElement('span');a.textContent=kv[0];var b=document.createElement('b');b.textContent=kv[1];r.appendChild(a);r.appendChild(b);p.appendChild(r)});return p}
function draw(){var H=inn.offsetHeight,W=inn.offsetWidth;rp.setAttribute('x',x);rp.setAttribute('y',0);rp.setAttribute('width',Math.max(0,w));rp.setAttribute('height',44);rr.setAttribute('x',0);rr.setAttribute('y',P);rr.setAttribute('width',W);rr.setAttribute('height',Math.max(0,H-P));
 rn.setAttribute('d','M '+x+' 30 L '+x+' 44 L '+(x+w)+' 44 L '+(x+w)+' 30 L '+(x+w)+' 44 Q '+(x+w)+' '+P+' '+(x+w+18)+' '+P+' L '+(x-18)+' '+P+' Q '+x+' '+P+' '+x+' 44 Z')}
function frame(){raf=0;if(reduce){x=tx;w=tw}else{vx+=(tx-x)*.16;vx*=.72;x+=vx;vw+=(tw-w)*.16;vw*=.72;w+=vw}draw();if(!reduce&&(Math.abs(tx-x)>.1||Math.abs(vx)>.1||Math.abs(tw-w)>.1||Math.abs(vw)>.1))raf=requestAnimationFrame(frame)}
function target(){var b=tabs[cur];tx=b.offsetLeft;tw=b.offsetWidth;if(!raf)raf=requestAnimationFrame(frame)}
function go(n,first){var dir=n>=cur?1:-1;tabs.forEach(function(t,i){t.setAttribute('aria-selected',String(i===n));t.tabIndex=i===n?0:-1});var old=panel.firstChild,np=pane(n);
 if(first||reduce){panel.textContent='';panel.appendChild(np)}else{np.style.transform='translateX('+dir*40+'px)';np.style.opacity=0;panel.appendChild(np);if(old){old.style.position='absolute';old.style.left='24px';old.style.right='24px';old.style.top='26px'}void np.offsetWidth;if(old){old.style.transform='translateX('+(-dir*40)+'px)';old.style.opacity=0;setTimeout(function(){old.remove()},400)}np.style.transform='none';np.style.opacity=1}
 cur=n;target();setTimeout(draw,0)}
go(0,true);x=tabs[0].offsetLeft;w=tabs[0].offsetWidth;tx=x;tw=w;draw();addEventListener('resize',function(){target()});if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){target()});
var auto=setInterval(function(){go((cur+1)%4)},3200);root.addEventListener('pointerenter',function(){clearInterval(auto)});root.addEventListener('focusin',function(){clearInterval(auto)});})();`},

{id:'s-morph-accordion',title:'Pouring accordion',component:'Pouring accordion',key:'morph-accordion',family,width:640,
 description:'An FAQ accordion where each answer pours out of its question pill like liquid before settling into a clean panel.',
 prompt:'Build an FAQ accordion of four items. Each item is a wrapper with: a goo layer (position absolute, inset 0, filter url(#goo): feGaussianBlur stdDeviation 8 and feColorMatrix alpha x20 - 9) holding two shapes in the same colour, a question pill (top 0, height 56, full width, radius 28) and an answer panel (top 40px, bottom 0, radius 24, transform scaleY(0) from the top, opacity 0); a real button (the question, aria-expanded, aria-controls) above it with a rotating plus icon; and an answer region whose height animates with grid-template-rows 0fr to 1fr over 0.5s cubic-bezier(.3,1.1,.4,1) so the wrapper grows. When opened the panel shape scales to 1 over the same curve, so it pours out of the pill, briefly merging with it through the filter, before settling into a rounded panel. Only one item stays open at a time (opening one closes the others); the answer text sits in the unfiltered layer and fades in 0.15s late. Keyboard: Enter/Space toggle, focus visible. Reduced motion skips animation. Vanilla HTML, CSS and JavaScript.',
 css:`.ma{display:grid;gap:12px;padding:22px;border:1px solid var(--sc-line);border-radius:28px;background:var(--sc-surface)}
.ma-item{position:relative}
.ma-goo{position:absolute;inset:0;filter:url(#ma-goo);pointer-events:none}
.ma-pill,.ma-pan{position:absolute;left:6px;right:6px;background:var(--sc-line)}
.ma-pill{top:0;height:56px;border-radius:28px}
.ma-pan{top:36px;bottom:0;border-radius:24px;transform:scaleY(0);transform-origin:50% 0;opacity:0;transition:transform .5s cubic-bezier(.3,1.1,.4,1),opacity .2s}
.ma-item.open .ma-pan{transform:scaleY(1);opacity:1}
.ma-q{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;height:56px;padding:0 22px 0 26px;border:0;border-radius:28px;background:transparent;color:inherit;cursor:pointer;text-align:left;font:700 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif}
.ma-q i{position:relative;flex:none;width:18px;height:18px;transition:transform .45s cubic-bezier(.3,1.3,.4,1)}
.ma-q i::before,.ma-q i::after{content:"";position:absolute;left:0;right:0;top:8px;height:2px;border-radius:2px;background:currentColor}
.ma-q i::after{transform:rotate(90deg)}
.ma-item.open .ma-q i{transform:rotate(135deg)}
.ma-a{position:relative;z-index:2;display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.3,1.1,.4,1)}
.ma-item.open .ma-a{grid-template-rows:1fr}
.ma-a>div{overflow:hidden}
.ma-a p{margin:0;padding:18px 28px 22px;font-size:15px;line-height:1.55;color:var(--sc-muted);opacity:0;transition:opacity .3s}
.ma-item.open .ma-a p{opacity:1;transition-delay:.15s}
@media (prefers-reduced-motion:reduce){.ma-pan,.ma-a,.ma-a p,.ma-q i{transition:none}}`,
 html:`<div class="ma">${GOO('ma-goo',8)}</div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.ma'),items=[];
var faq=[['How do I get started?','Create a free account, pick a template and publish your first page in a few minutes. No card is needed.'],['Can I use my own domain?','Yes. Add your domain in settings, point the records we show you and we handle the certificate.'],['What happens to my data?','Everything is stored in the region you choose and you can export it as files at any time.'],['Is there a team plan?','Teams get shared libraries, roles and review workflows from the second seat onwards.']];
faq.forEach(function(f,i){var it=document.createElement('div');it.className='ma-item';var g=document.createElement('div');g.className='ma-goo';g.setAttribute('aria-hidden','true');var a=document.createElement('i');a.className='ma-pill';var b=document.createElement('i');b.className='ma-pan';g.appendChild(a);g.appendChild(b);
 var q=document.createElement('button');q.type='button';q.className='ma-q';q.setAttribute('aria-expanded','false');q.id='ma-q'+i;q.setAttribute('aria-controls','ma-a'+i);var sp=document.createElement('span');sp.textContent=f[0];var ic=document.createElement('i');ic.setAttribute('aria-hidden','true');q.appendChild(sp);q.appendChild(ic);
 var an=document.createElement('div');an.className='ma-a';an.id='ma-a'+i;an.setAttribute('role','region');an.setAttribute('aria-labelledby','ma-q'+i);var inn=document.createElement('div');var p=document.createElement('p');p.textContent=f[1];inn.appendChild(p);an.appendChild(inn);
 it.appendChild(g);it.appendChild(q);it.appendChild(an);root.appendChild(it);items.push({it:it,q:q});
 q.addEventListener('click',function(){var open=it.classList.contains('open');items.forEach(function(o){o.it.classList.remove('open');o.q.setAttribute('aria-expanded','false')});if(!open){it.classList.add('open');q.setAttribute('aria-expanded','true')}})});
items[0].it.classList.add('open');items[0].q.setAttribute('aria-expanded','true');})();`},

{id:'s-pill-menu',title:'Morphing menu pill',component:'Morphing menu pill',key:'pill-menu',family,width:640,
 description:'A small Menu pill that grows into the whole navigation panel, with links that cascade in letter by letter and roll on hover.',
 prompt:'Make a menu where the button itself becomes the panel. A dark pill (110x44, radius 22) sits at the top right of a stage. Clicking it sets aria-expanded and transitions width to min(440px, stage - 32px), height to 330px and border-radius to 26px over 0.6s cubic-bezier(.3,.9,.2,1) so no overlay is stacked: the same element morphs. A header row (the label swaps between Menu and Close with a roll) stays at the top. Four large links (Work, Studio, Journal, Contact) are split into letters (each letter a span inside an overflow-hidden line) that slide up from 110% with a delay of 22ms per letter plus 40ms per link after the panel has grown; they roll on hover by translating a duplicated copy of the text (the doubled label approach). A generated artwork thumbnail sits in an image slot on the right and changes with the hovered link. Closing reverses (letters drop first). Real links and a real toggle button, Escape closes and returns focus, links are inert while closed. Reduced motion removes the transitions. Vanilla HTML, CSS and JavaScript.',
 css:`.pm{position:relative;height:420px;border:1px solid var(--sc-line);border-radius:28px;background:linear-gradient(135deg,var(--sc-ring),transparent 60%),var(--sc-surface);overflow:hidden}
.pm-hero{position:absolute;left:30px;top:44px;margin:0;max-width:300px;font:800 40px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em}
.pm-hero small{display:block;margin-top:12px;font:500 15px/1.5 system-ui;letter-spacing:0;color:var(--sc-muted)}
.pm-box{position:absolute;right:16px;top:16px;z-index:5;width:110px;height:44px;border-radius:22px;background:#0d0d12;color:#fff;overflow:hidden;transition:width .6s cubic-bezier(.3,.9,.2,1),height .6s cubic-bezier(.3,.9,.2,1),border-radius .6s;box-shadow:0 18px 36px -14px rgba(0,0,0,.5)}
.pm-box.open{width:min(440px,calc(100% - 32px));height:330px;border-radius:26px}
.pm-head{position:absolute;left:0;top:0;width:110px;height:44px;border:0;background:transparent;color:inherit;cursor:pointer;font:700 14px/1 system-ui;display:flex;align-items:center;justify-content:center;gap:8px}
.pm-lab{position:relative;display:block;height:16px;overflow:hidden;width:44px;text-align:left}
.pm-lab span{display:block;line-height:16px;transition:transform .4s cubic-bezier(.3,.9,.3,1)}
.pm-box.open .pm-lab span{transform:translateY(-16px)}
.pm-bars{display:grid;gap:4px}.pm-bars i{display:block;width:16px;height:2px;border-radius:2px;background:#fff;transition:transform .4s}
.pm-box.open .pm-bars i:first-child{transform:translateY(3px) rotate(45deg)}.pm-box.open .pm-bars i:last-child{transform:translateY(-3px) rotate(-45deg)}
.pm-nav{position:absolute;left:28px;top:70px;display:grid;gap:2px}
.pm-link{display:block;color:#fff;text-decoration:none;font:800 40px/1.12 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;overflow:hidden;height:1.12em}
.pm-roll{display:block;transition:transform .45s cubic-bezier(.3,.9,.3,1)}
.pm-link:hover .pm-roll,.pm-link:focus-visible .pm-roll{transform:translateY(-100%)}
.pm-line{display:block;white-space:nowrap}
.pm-line i{display:inline-block;font-style:normal;transform:translateY(110%);transition:transform .55s cubic-bezier(.3,.9,.3,1);transition-delay:0s}
.pm-box.open .pm-line i{transform:none;transition-delay:calc(.28s + var(--l)*40ms + var(--i)*22ms)}
.pm-line.b i{color:hsl(262 90% 78%)}
.pm-img{position:absolute;right:22px;bottom:22px;width:130px;height:170px;border-radius:16px;background-size:cover;background-position:center;opacity:0;transform:scale(.9);transition:opacity .4s,transform .5s cubic-bezier(.3,.9,.3,1)}
.pm-box.open .pm-img{opacity:1;transform:none;transition-delay:.35s}
.pm-box:not(.open) .pm-nav{visibility:hidden;transition:visibility 0s .6s}
@media (prefers-reduced-motion:reduce){.pm-box,.pm-line i,.pm-lab span,.pm-img,.pm-roll,.pm-bars i{transition:none}}`,
 html:`<div class="pm"><h2 class="pm-hero">Make things worth opening.<small>An independent design studio for brands, products and film.</small></h2><div class="pm-box"><button class="pm-head" type="button" aria-expanded="false" aria-controls="pm-nav"><span class="pm-lab"><span>Menu</span><span>Close</span></span><span class="pm-bars" aria-hidden="true"><i></i><i></i></span></button><nav class="pm-nav" id="pm-nav" aria-label="Main"></nav><div class="pm-img" aria-hidden="true"></div></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling.querySelector('.pm'),box=root.querySelector('.pm-box'),btn=root.querySelector('.pm-head'),nav=root.querySelector('.pm-nav'),img=root.querySelector('.pm-img');
${ART}
var links=['Work','Studio','Journal','Contact'],ids=[0,2,5,6];
function line(txt,cls,li){var s=document.createElement('span');s.className='pm-line '+cls;s.style.setProperty('--l',li);for(var i=0;i<txt.length;i++){var c=document.createElement('i');c.style.setProperty('--i',i);c.textContent=txt.charAt(i);s.appendChild(c)}return s}
links.forEach(function(t,i){var a=document.createElement('a');a.className='pm-link';a.href='#';a.addEventListener('click',function(e){e.preventDefault()});var r=document.createElement('span');r.className='pm-roll';r.appendChild(line(t,'a',i));r.appendChild(line(t,'b',i));a.appendChild(r);a.setAttribute('aria-label',t);a.tabIndex=-1;nav.appendChild(a);a.addEventListener('pointerenter',function(){img.style.backgroundImage='url('+artURL(ids[i],130,170)+')'});a.addEventListener('focus',function(){img.style.backgroundImage='url('+artURL(ids[i],130,170)+')'})});
img.style.backgroundImage='url('+artURL(ids[0],130,170)+')';
function set(o){box.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o));nav.querySelectorAll('a').forEach(function(a){a.tabIndex=o?0:-1});if(!o)btn.focus()}
btn.addEventListener('click',function(){set(!box.classList.contains('open'))});root.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('open'))set(false)});
var auto=setInterval(function(){if(!root.matches(':hover')&&!root.contains(document.activeElement)){box.classList.toggle('open');btn.setAttribute('aria-expanded',String(box.classList.contains('open')))}},3600);root.addEventListener('pointerenter',function(){clearInterval(auto)});root.addEventListener('focusin',function(){clearInterval(auto)});})();`}
];
