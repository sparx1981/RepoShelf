// Motion patterns for everyday interface states: overlays, feedback, loading and numbers.
// Original RepoShelf code. They are inspired by common interface-motion ideas (origin-aware scaling,
// staggered entrances, overlapping fades) and use none of the code from any transition library.
const family='Transition patterns';
const CSS=`.tr{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:28px 12px;min-height:200px}
.tr-btn{padding:11px 22px;border:2px solid var(--sc-accent);border-radius:12px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:700;cursor:pointer;transition:transform .15s}
.tr-btn:active{transform:scale(.96)}
.tr-btn.ghost{background:transparent;color:var(--sc-fg);border-color:var(--sc-line)}`;
const wrap=js=>`(function(){var root=document.currentScript.previousElementSibling,h=root.querySelector('.tr');\n${js}})();`;
const E='cubic-bezier(.2,.8,.2,1)';

export const transitionPatterns=[
{id:'s-tr-modal',title:'Modal open and close',component:'Modal open and close',key:'tr-modal',family,width:520,
 description:'A dialog that scales up from its trigger while the backdrop fades and blurs.',
 prompt:'Build a modal dialog (role="dialog", aria-modal, aria-labelledby) opened by a button. The backdrop fades in with a light blur; the dialog scales from 0.94 and rises 12px with a soft ease-out, and reverses on close. Escape and a Close button dismiss it, focus moves into the dialog and returns to the trigger. Use CSS transitions only for the motion, with reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr{overflow:hidden}
.tr-bd{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45);backdrop-filter:blur(0);opacity:0;visibility:hidden;transition:opacity .28s ${E},backdrop-filter .28s ${E},visibility 0s .28s}
.tr-bd.open{opacity:1;visibility:visible;backdrop-filter:blur(4px);transition-delay:0s}
.tr-dl{width:min(320px,88%);padding:22px;border-radius:18px;background:var(--sc-bg);border:1px solid var(--sc-line);transform:translateY(12px) scale(.94);transition:transform .34s ${E}}
.tr-bd.open .tr-dl{transform:none}
.tr-dl h3{margin:0 0 6px}.tr-dl p{margin:0 0 16px;color:var(--sc-muted)}`,
 html:`<div class="tr"><button class="tr-btn">Open dialog</button><div class="tr-bd"><div class="tr-dl" role="dialog" aria-modal="true" aria-labelledby="trm" tabindex="-1"><h3 id="trm">Delete this shelf?</h3><p>You can restore it for thirty days.</p><button class="tr-btn ghost">Close</button></div></div></div>`,
 js:wrap(`var open=root.querySelector('.tr-btn'),bd=root.querySelector('.tr-bd'),dl=root.querySelector('.tr-dl'),close=dl.querySelector('button');
function set(v){bd.classList.toggle('open',v);if(v)dl.focus();else open.focus()}
open.addEventListener('click',function(){set(true)});close.addEventListener('click',function(){set(false)});bd.addEventListener('click',function(e){if(e.target===bd)set(false)});root.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});`),
 thumb:{click:'.tr-btn',wait:500}},

{id:'s-tr-dropdown',title:'Dropdown menu',component:'Dropdown menu',key:'tr-dropdown',family,width:520,
 description:'A menu that grows from its trigger with items that arrive in a quick stagger.',
 prompt:'Create a dropdown menu with a trigger button (aria-haspopup, aria-expanded) and a list of menu items. The panel scales from its top-left origin while items fade and rise in a 30ms stagger. Click outside or Escape closes it, arrow keys move between items. CSS transitions with a small script for state, reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr{justify-content:flex-start;padding-top:36px}
.tr-dd{position:relative}
.tr-mn{position:absolute;top:calc(100% + 8px);left:0;min-width:200px;padding:6px;border-radius:14px;background:var(--sc-bg);border:1px solid var(--sc-line);box-shadow:0 14px 34px rgba(0,0,0,.25);transform-origin:0 0;transform:scale(.9);opacity:0;visibility:hidden;transition:transform .26s ${E},opacity .2s,visibility 0s .26s}
.tr-mn.open{transform:none;opacity:1;visibility:visible;transition-delay:0s}
.tr-mn button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-radius:9px;background:none;cursor:pointer;opacity:0;transform:translateY(6px);transition:opacity .22s,transform .26s ${E},background .15s}
.tr-mn.open button{opacity:1;transform:none;transition-delay:calc(var(--i)*30ms+40ms)}
.tr-mn button:hover,.tr-mn button:focus-visible{background:var(--sc-surface)}`,
 html:`<div class="tr"><div class="tr-dd"><button class="tr-btn" aria-haspopup="menu" aria-expanded="false">Actions</button><div class="tr-mn" role="menu"><button role="menuitem" style="--i:0">Rename</button><button role="menuitem" style="--i:1">Duplicate</button><button role="menuitem" style="--i:2">Move to shelf</button><button role="menuitem" style="--i:3">Delete</button></div></div></div>`,
 js:wrap(`var b=root.querySelector('.tr-btn'),m=root.querySelector('.tr-mn'),items=[].slice.call(m.children);
function set(v){m.classList.toggle('open',v);b.setAttribute('aria-expanded',String(v));if(v)items[0].focus()}
b.addEventListener('click',function(){set(!m.classList.contains('open'))});document.addEventListener('click',function(e){if(!root.contains(e.target))set(false)});
root.addEventListener('keydown',function(e){var i=items.indexOf(document.activeElement);if(e.key==='Escape'){set(false);b.focus()}if(e.key==='ArrowDown'&&i>-1){e.preventDefault();items[(i+1)%items.length].focus()}if(e.key==='ArrowUp'&&i>-1){e.preventDefault();items[(i+items.length-1)%items.length].focus()}});
items.forEach(function(i){i.addEventListener('click',function(){set(false);b.focus()})});`),
 thumb:{click:'.tr-btn',wait:600}},

{id:'s-tr-toast-stack',title:'Stacking toasts',component:'Stacking toasts',key:'tr-toast-stack',family,width:520,
 description:'Toasts that slide up into a stack, push older ones up and dismiss themselves.',
 prompt:'Build a toast stack anchored at the bottom of the container. Each press of the button adds a toast (role="status") that slides up and fades in while older toasts move up smoothly (animate with a FLIP technique or flex column-reverse and transitions). Toasts dismiss after 3 seconds by fading and collapsing their height, or immediately with a close button. Maximum three visible. Reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr{justify-content:flex-start;overflow:hidden;min-height:240px}
.tr-ts{position:absolute;left:0;right:0;bottom:12px;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
.tr-t{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:var(--sc-fg);color:var(--sc-bg);font-weight:600;font-size:14px;max-height:60px;animation:trIn .38s ${E}}
.tr-t button{border:0;background:none;color:inherit;opacity:.7;cursor:pointer;font-size:16px}
.tr-t.out{opacity:0;max-height:0;padding-block:0;margin-top:-8px;transition:all .3s ${E}}
@keyframes trIn{from{opacity:0;transform:translateY(24px) scale(.95)}}`,
 html:`<div class="tr"><button class="tr-btn">Add a toast</button><div class="tr-ts" aria-live="polite"></div></div>`,
 js:wrap(`var ts=root.querySelector('.tr-ts'),n=0;
function drop(t){if(!t.parentNode)return;t.classList.add('out');setTimeout(function(){t.remove()},320)}
root.querySelector('.tr-btn').addEventListener('click',function(){n++;var t=document.createElement('div');t.className='tr-t';t.setAttribute('role','status');var s=document.createElement('span');s.textContent='Saved draft #'+n;var c=document.createElement('button');c.setAttribute('aria-label','Dismiss');c.textContent='\\u00d7';c.addEventListener('click',function(){drop(t)});t.appendChild(s);t.appendChild(c);ts.appendChild(t);while(ts.children.length>3)ts.firstElementChild.remove();setTimeout(function(){drop(t)},3000)});`),
 thumb:{eval:'var b=document.querySelector(".tr-btn");b.click();b.click();b.click()',wait:500}},

{id:'s-tr-accordion',title:'Smooth accordion',component:'Smooth accordion',key:'tr-accordion',family,width:520,
 description:'Accordion panels that animate to their natural height with a chevron turn.',
 prompt:'Create an accordion with three sections. Each header is a button with aria-expanded and aria-controls; the panel animates between 0 and its natural height using grid-template-rows 0fr to 1fr, the content fades slightly later, and a chevron rotates 180 degrees. Only one section is open at a time. Keyboard operable, reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-ac{width:min(400px,94%);border:1px solid var(--sc-line);border-radius:16px;overflow:hidden;background:var(--sc-surface)}
.tr-ai+.tr-ai{border-top:1px solid var(--sc-line)}
.tr-ah{display:flex;justify-content:space-between;align-items:center;width:100%;padding:15px 18px;border:0;background:none;font-weight:700;cursor:pointer;text-align:left}
.tr-ah svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;transition:transform .36s ${E}}
.tr-ah[aria-expanded=true] svg{transform:rotate(180deg)}
.tr-ap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .38s ${E}}
.tr-ah[aria-expanded=true]+.tr-ap{grid-template-rows:1fr}
.tr-ap>div{overflow:hidden;min-height:0}
.tr-ap p{margin:0;padding:0 18px 16px;color:var(--sc-muted);opacity:0;transition:opacity .25s}
.tr-ah[aria-expanded=true]+.tr-ap p{opacity:1;transition-delay:.12s}`,
 html:`<div class="tr"><div class="tr-ac"><div class="tr-ai"><button class="tr-ah" aria-expanded="true" aria-controls="ta1">What is a shelf?<svg viewBox="0 0 16 16"><path d="M3 6l5 5 5-5"/></svg></button><div class="tr-ap" id="ta1"><div><p>A shelf is a named collection of projects you can reorder and share.</p></div></div></div><div class="tr-ai"><button class="tr-ah" aria-expanded="false" aria-controls="ta2">Can I share one?<svg viewBox="0 0 16 16"><path d="M3 6l5 5 5-5"/></svg></button><div class="tr-ap" id="ta2"><div><p>Yes. Send the link and anyone can browse it without an account.</p></div></div></div><div class="tr-ai"><button class="tr-ah" aria-expanded="false" aria-controls="ta3">Is it free?<svg viewBox="0 0 16 16"><path d="M3 6l5 5 5-5"/></svg></button><div class="tr-ap" id="ta3"><div><p>Browsing and saving are free.</p></div></div></div></div></div>`,
 js:wrap(`var hs=[].slice.call(root.querySelectorAll('.tr-ah'));hs.forEach(function(b){b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';hs.forEach(function(x){x.setAttribute('aria-expanded','false')});b.setAttribute('aria-expanded',String(!o))})})`),
 thumb:{click:'.tr-ai:nth-child(2) .tr-ah',wait:500}},

{id:'s-tr-tooltip',title:'Origin-aware tooltip',component:'Origin-aware tooltip',key:'tr-tooltip',family,width:520,
 description:'Tooltips that scale from the point they point at, with a quick hover delay.',
 prompt:'Build a tooltip for an icon button. It appears above the trigger on hover or keyboard focus after a 120ms intent delay, scaling from 0.9 with its transform-origin at the arrow tip and a slight blur-to-sharp fade. Moving between two triggers skips the delay. role="tooltip" with aria-describedby; Escape hides it. Reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-row{display:flex;gap:12px}
.tr-tw{position:relative}
.tr-ib{width:44px;height:44px;border:1px solid var(--sc-line);border-radius:12px;background:var(--sc-surface);cursor:pointer;font-size:18px}
.tr-tp{position:absolute;bottom:calc(100% + 10px);left:50%;translate:-50% 0;transform-origin:50% 100%;padding:6px 10px;border-radius:8px;background:var(--sc-fg);color:var(--sc-bg);font-size:12px;font-weight:600;white-space:nowrap;opacity:0;transform:scale(.9);filter:blur(3px);pointer-events:none;transition:opacity .16s,transform .22s ${E},filter .2s}
.tr-tw.on .tr-tp{opacity:1;transform:none;filter:none}`,
 html:`<div class="tr"><div class="tr-row"><span class="tr-tw"><button class="tr-ib" aria-label="Bookmark" aria-describedby="tt1">★</button><span class="tr-tp" id="tt1" role="tooltip">Save to shelf</span></span><span class="tr-tw"><button class="tr-ib" aria-label="Share" aria-describedby="tt2">↗</button><span class="tr-tp" id="tt2" role="tooltip">Share link</span></span><span class="tr-tw"><button class="tr-ib" aria-label="Settings" aria-describedby="tt3">⚙</button><span class="tr-tp" id="tt3" role="tooltip">Settings</span></span></div></div>`,
 js:wrap(`var ws=[].slice.call(root.querySelectorAll('.tr-tw')),timer,warm=false,cool;
function show(w){clearTimeout(timer);var go=function(){ws.forEach(function(x){x.classList.toggle('on',x===w)});warm=true;clearTimeout(cool)};if(warm)go();else timer=setTimeout(go,120)}
function hide(){clearTimeout(timer);ws.forEach(function(x){x.classList.remove('on')});clearTimeout(cool);cool=setTimeout(function(){warm=false},300)}
ws.forEach(function(w){var b=w.firstElementChild;w.addEventListener('mouseenter',function(){show(w)});w.addEventListener('mouseleave',hide);b.addEventListener('focus',function(){show(w)});b.addEventListener('blur',hide);b.addEventListener('keydown',function(e){if(e.key==='Escape')hide()})})`),
 thumb:{hover:'.tr-tw:nth-child(2) .tr-ib',wait:600}},

{id:'s-tr-skeleton',title:'Skeleton to content',component:'Skeleton to content',key:'tr-skeleton',family,width:520,
 description:'A shimmering placeholder that cross-fades into real content, line by line.',
 prompt:'Build a card with a loading state. A skeleton (avatar, title and two lines) shimmers with a moving gradient; after about 1.4 seconds the real content fades in with each line revealed in a short stagger while the skeleton fades out, with no layout jump. A Reload button replays it. aria-busy reflects the state. Reduced motion shows the content without shimmer. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-cd{position:relative;width:min(340px,92%);padding:18px;border:1px solid var(--sc-line);border-radius:18px;background:var(--sc-surface);min-height:120px}
.tr-sk,.tr-ct{display:grid;grid-template-columns:48px 1fr;gap:6px 14px;align-items:center}
.tr-sk{position:absolute;inset:18px;transition:opacity .3s}
.tr-ct>*{opacity:0;transform:translateY(6px);transition:opacity .35s,transform .4s ${E};transition-delay:calc(var(--i)*90ms)}
.tr-cd.ready .tr-ct>*{opacity:1;transform:none}.tr-cd.ready .tr-sk{opacity:0}
.tr-av{grid-row:span 3;width:48px;height:48px;border-radius:50%;background:var(--sc-accent);display:grid;place-items:center;color:var(--sc-accent-fg);font-weight:800}
.tr-ct b{font-size:16px}.tr-ct span{color:var(--sc-muted);font-size:14px}
.tr-sb{display:block;height:12px;border-radius:6px;background:linear-gradient(100deg,var(--sc-line) 30%,var(--sc-bg) 50%,var(--sc-line) 70%) 0 0/300% 100%;animation:trSh 1.2s linear infinite}
.tr-sb.av{grid-row:span 3;width:48px;height:48px;border-radius:50%}
@keyframes trSh{to{background-position:-300% 0}}`,
 html:`<div class="tr"><div class="tr-cd" aria-busy="true"><div class="tr-sk" aria-hidden="true"><i class="tr-sb av"></i><i class="tr-sb" style="width:60%"></i><i class="tr-sb"></i><i class="tr-sb" style="width:80%"></i></div><div class="tr-ct"><div class="tr-av" style="--i:0">AK</div><b style="--i:1">Aiko Kobayashi</b><span style="--i:2">Motion designer, Osaka</span><span style="--i:3">Cuts frames for a living.</span></div></div><button class="tr-btn ghost">Reload</button></div>`,
 js:wrap(`var cd=root.querySelector('.tr-cd'),tm;
function load(){clearTimeout(tm);cd.classList.remove('ready');cd.setAttribute('aria-busy','true');tm=setTimeout(function(){cd.classList.add('ready');cd.setAttribute('aria-busy','false')},1400)}
root.querySelector('button').addEventListener('click',load);load();`),
 thumb:{wait:2100}},

{id:'s-tr-shimmer-text',title:'Shimmer text',component:'Shimmer text',key:'tr-shimmer-text',family,width:520,
 description:'Status text with a soft light sweeping through it, for thinking and loading states.',
 prompt:'Create a status line (for example "Thinking...") whose letters are filled with a gradient that sweeps left to right on a loop, using background-clip:text with a moving background-position. Include a variant with a slower, wider sweep and a Pause button that stops the animation using aria-pressed. Reduced motion shows static text. Vanilla HTML, CSS and a little JavaScript.',
 css:`${CSS}
.tr-sh{font:800 34px/1.1 system-ui,sans-serif;background:linear-gradient(100deg,var(--sc-muted) 35%,var(--sc-fg) 50%,var(--sc-muted) 65%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:trSw 2.2s linear infinite}
.tr-sh.slow{font-size:20px;animation-duration:4s;background-image:linear-gradient(100deg,var(--sc-muted) 20%,var(--sc-accent) 50%,var(--sc-muted) 80%)}
.paused .tr-sh{animation-play-state:paused}
@keyframes trSw{from{background-position:150% 0}to{background-position:-50% 0}}`,
 html:`<div class="tr"><div class="tr-sh">Thinking…</div><div class="tr-sh slow">Searching your shelves</div><button class="tr-btn ghost" aria-pressed="false">Pause</button></div>`,
 js:wrap(`var b=root.querySelector('button');b.addEventListener('click',function(){var p=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(p));b.textContent=p?'Resume':'Pause';h.classList.toggle('paused',p)})`),
 thumb:{wait:700}},

{id:'s-tr-success-check',title:'Button to check',component:'Button to check',key:'tr-success-check',family,width:520,
 description:'A submit button that becomes a spinner, then morphs into a drawn check mark.',
 prompt:'Build a submit button with three states. On click it shrinks into a circle with a spinning ring (loading, aria-busy), after about 1.2 seconds the ring completes and a check mark draws itself with stroke-dashoffset, then it settles back to the original label after two seconds. The width transition must be smooth. Use real button, keyboard accessible, reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-sc{position:relative;display:grid;place-items:center;width:160px;height:48px;border:0;border-radius:99px;background:var(--sc-accent);color:var(--sc-accent-fg);font-weight:700;font-size:16px;cursor:pointer;transition:width .4s ${E}}
.tr-sc.busy,.tr-sc.done{width:48px}
.tr-sc span{transition:opacity .2s}.tr-sc.busy span,.tr-sc.done span{opacity:0;position:absolute}
.tr-sc svg{position:absolute;width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:0}
.tr-sc .ring{stroke-dasharray:44;stroke-dashoffset:30;transform-origin:50% 50%}
.tr-sc.busy .ring{opacity:1;animation:trSp .8s linear infinite}
.tr-sc .tick{stroke-dasharray:26;stroke-dashoffset:26}
.tr-sc.done .tick{opacity:1;stroke-dashoffset:0;transition:stroke-dashoffset .4s .15s ${E}}
@keyframes trSp{to{transform:rotate(360deg)}}`,
 html:`<div class="tr"><button class="tr-sc"><span>Send</span><svg viewBox="0 0 26 26"><circle class="ring" cx="13" cy="13" r="9"/></svg><svg viewBox="0 0 26 26"><path class="tick" d="M6 13.5l5 5 9-10"/></svg></button></div>`,
 js:wrap(`var b=root.querySelector('.tr-sc'),lock=false;
b.addEventListener('click',function(){if(lock)return;lock=true;b.classList.add('busy');b.setAttribute('aria-busy','true');setTimeout(function(){b.classList.remove('busy');b.removeAttribute('aria-busy');b.classList.add('done');b.setAttribute('aria-label','Sent')},1200);setTimeout(function(){b.classList.remove('done');b.removeAttribute('aria-label');lock=false},3400)})`),
 thumb:{click:'.tr-sc',wait:1900}},

{id:'s-tr-error-shake',title:'Error shake',component:'Error shake',key:'tr-error-shake',family,width:520,
 description:'A field that shakes and reddens when validation fails, then calms on correction.',
 prompt:'Build a small form with an email input and a submit button. When submitted with an invalid email the input shakes horizontally (damped keyframes over 400ms), the border turns red and an error message slides in below with role="alert" and aria-invalid on the input. Typing a valid address clears the error with a fade. Reduced motion replaces the shake with a colour change. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-fm{display:flex;flex-direction:column;gap:8px;width:min(320px,92%)}
.tr-fm input{padding:13px 14px;font:500 16px system-ui,sans-serif;color:var(--sc-fg);background:var(--sc-surface);border:2px solid var(--sc-line);border-radius:12px;transition:border-color .2s}
.tr-fm input:focus-visible{outline:2px solid var(--sc-accent);outline-offset:2px}
.tr-fm input[aria-invalid=true]{border-color:#e5484d}
.tr-fm input.shake{animation:trSk .4s}
.tr-er{color:#e5484d;font-size:13px;font-weight:600;max-height:0;opacity:0;overflow:hidden;transition:max-height .3s ${E},opacity .25s}
.tr-er.on{max-height:30px;opacity:1}
@keyframes trSk{20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}`,
 html:`<div class="tr"><form class="tr-fm" novalidate><label><span style="position:absolute;opacity:0">Email</span><input type="email" placeholder="you@example.com" style="width:100%"></label><div class="tr-er" role="alert">Enter a valid email address.</div><button class="tr-btn">Subscribe</button></form></div>`,
 js:wrap(`var f=root.querySelector('form'),i=f.querySelector('input'),er=f.querySelector('.tr-er'),ok=function(){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(i.value)};
f.addEventListener('submit',function(e){e.preventDefault();if(ok())return;i.setAttribute('aria-invalid','true');er.classList.add('on');i.classList.remove('shake');void i.offsetWidth;i.classList.add('shake')});
i.addEventListener('input',function(){if(ok()){i.removeAttribute('aria-invalid');er.classList.remove('on')}});`),
 thumb:{eval:'document.querySelector("input").value="not-an-email";document.querySelector(".tr-btn").click()',wait:260}},

{id:'s-tr-like',title:'Like pop',component:'Like pop',key:'tr-like',family,width:520,
 description:'A heart that pops with a spring and flicks sparks, with a rolling count.',
 prompt:'Build a like button (button with aria-pressed) showing a heart and a count. Pressing it fills the heart with the accent colour, scales it 0.6 to 1.3 to 1 with a spring curve, flicks six small spark lines around it, and rolls the count up by one with a vertical slide. Un-liking reverses calmly. Reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-lk{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border:1px solid var(--sc-line);border-radius:99px;background:var(--sc-surface);font-weight:700;font-size:16px;cursor:pointer}
.tr-hr{position:relative;width:26px;height:26px}
.tr-hr svg{width:100%;height:100%;fill:none;stroke:var(--sc-muted);stroke-width:2;transition:fill .2s,stroke .2s}
.tr-lk[aria-pressed=true] .tr-hr svg{fill:#ff4d6d;stroke:#ff4d6d;animation:trPop .5s cubic-bezier(.3,1.6,.5,1)}
.tr-hr i{position:absolute;left:50%;top:50%;width:2px;height:8px;border-radius:2px;background:#ff4d6d;opacity:0}
.tr-lk[aria-pressed=true] .tr-hr i{animation:trSpark .5s ease-out}
.tr-nm{position:relative;display:inline-block;height:1.4em;overflow:hidden;min-width:2ch}
.tr-nm span{display:block;transition:transform .35s ${E}}
.tr-nm.up span{transform:translateY(-100%)}
@keyframes trPop{0%{transform:scale(.6)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes trSpark{0%{opacity:1;transform:rotate(var(--r)) translateY(-12px)}100%{opacity:0;transform:rotate(var(--r)) translateY(-26px)}}`,
 html:`<div class="tr"><button class="tr-lk" aria-pressed="false" aria-label="Like"><span class="tr-hr"><svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/></svg><i style="--r:0deg"></i><i style="--r:60deg"></i><i style="--r:120deg"></i><i style="--r:180deg"></i><i style="--r:240deg"></i><i style="--r:300deg"></i></span><span class="tr-nm"><span>128</span><span>129</span></span></button></div>`,
 js:wrap(`var b=root.querySelector('.tr-lk'),nm=root.querySelector('.tr-nm');b.addEventListener('click',function(){var p=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(p));nm.classList.toggle('up',p)})`),
 thumb:{click:'.tr-lk',wait:320}},

{id:'s-tr-toggle',title:'Soft toggle',component:'Soft toggle',key:'tr-toggle',family,width:520,
 description:'A calm switch with an eased knob, a colour cross-fade and a pressed-state stretch.',
 prompt:'Build a switch (button role="switch", aria-checked) with an eased knob slide (cubic-bezier ease-out, 300ms), a smooth track colour cross-fade, a slight knob stretch while pressed and an icon swap inside the knob (moon to sun) using opacity and rotation. Keyboard operable, reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-tg{position:relative;width:68px;height:36px;padding:0;border:0;border-radius:99px;background:var(--sc-line);cursor:pointer;transition:background .3s}
.tr-tg[aria-checked=true]{background:var(--sc-accent)}
.tr-k{position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:99px;background:#fff;color:#333;display:grid;place-items:center;font-size:15px;transition:transform .3s ${E},width .15s;overflow:hidden}
.tr-tg[aria-checked=true] .tr-k{transform:translateX(32px)}
.tr-tg:active .tr-k{width:36px}.tr-tg[aria-checked=true]:active .tr-k{transform:translateX(24px)}
.tr-k i{position:absolute;font-style:normal;transition:opacity .25s,transform .35s ${E}}
.tr-k i+i{opacity:0;transform:rotate(-90deg) scale(.5)}
.tr-tg[aria-checked=true] .tr-k i:first-child{opacity:0;transform:rotate(90deg) scale(.5)}
.tr-tg[aria-checked=true] .tr-k i+i{opacity:1;transform:none}`,
 html:`<div class="tr"><button class="tr-tg" role="switch" aria-checked="false" aria-label="Theme"><span class="tr-k"><i>☾</i><i>☀</i></span></button></div>`,
 js:wrap(`var b=root.querySelector('.tr-tg');b.addEventListener('click',function(){b.setAttribute('aria-checked',String(b.getAttribute('aria-checked')!=='true'))})`),
 thumb:{click:'.tr-tg',wait:420}},

{id:'s-tr-number-pop',title:'Number pop',component:'Number pop',key:'tr-number-pop',family,width:520,
 description:'A counter whose digits roll to their new values, with a pop on the changed place.',
 prompt:'Create a counter display and a pair of buttons (Add and Remove). Each digit sits in its own clipped column; when the value changes only the changed digits slide vertically to the new number with a short stagger, and the whole value pops (scale 1.08 to 1). Keep the text exposed to assistive tech with aria-live and aria-label on the group. Reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-cn{display:flex;font:800 56px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;height:1em;overflow:hidden}
.tr-dg{display:block;height:1em;overflow:hidden;width:.62em}
.tr-dg span{display:flex;flex-direction:column;transition:transform .5s ${E};transition-delay:var(--d,0ms)}
.tr-dg b{height:1em;display:block;text-align:center}
.tr-pop{animation:trNp .4s ${E}}
.tr-row{display:flex;gap:10px}
@keyframes trNp{40%{transform:scale(1.08)}}`,
 html:`<div class="tr"><div class="tr-cn" role="status" aria-label="Count 1204"></div><div class="tr-row"><button class="tr-btn ghost" data-d="-37">Remove</button><button class="tr-btn" data-d="53">Add</button></div></div>`,
 js:wrap(`var cn=root.querySelector('.tr-cn'),v=1204,cols=[];
function digits(n){return String(Math.max(0,n)).padStart(4,'0').split('')}
function build(){digits(v).forEach(function(d,i){var c=document.createElement('span');c.className='tr-dg';var s=document.createElement('span');for(var k=0;k<10;k++){var b=document.createElement('b');b.textContent=k;s.appendChild(b)}c.appendChild(s);cn.appendChild(c);cols.push(s)})}
function paint(prev){var now=digits(v),old=prev?digits(prev):[];now.forEach(function(d,i){cols[i].style.setProperty('--d',(i*40)+'ms');cols[i].style.transform='translateY(-'+(d*10)+'%)'});cn.setAttribute('aria-label','Count '+v);if(prev&&String(prev)!==String(v)){cn.classList.remove('tr-pop');void cn.offsetWidth;cn.classList.add('tr-pop')}}
build();paint();
root.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){var p=v;v=Math.max(0,Math.min(9999,v+ +b.dataset.d));paint(p)})});`),
 thumb:{click:'.tr-btn:not(.ghost)',wait:700}},

{id:'s-tr-tabs-sliding',title:'Sliding tabs',component:'Sliding tabs',key:'tr-tabs-sliding',family,width:520,
 description:'Underline tabs whose indicator slides while panels cross-slide in the same direction.',
 prompt:'Build underline tabs (role="tablist", role="tab", aria-selected, role="tabpanel"). A 2px indicator slides to the selected tab with an ease-out curve, and the panel content slides in from the side matching the direction of travel while the old content fades out. Arrow keys switch tabs. Reduced motion honoured. Vanilla HTML, CSS and JavaScript.',
 css:`${CSS}
.tr-tl{position:relative;display:flex;gap:6px;border-bottom:1px solid var(--sc-line)}
.tr-tb{padding:10px 16px;border:0;background:none;font-weight:700;color:var(--sc-muted);cursor:pointer;transition:color .2s}
.tr-tb[aria-selected=true]{color:var(--sc-fg)}
.tr-in{position:absolute;bottom:-1px;height:2px;background:var(--sc-accent);transition:left .35s ${E},width .35s ${E}}
.tr-pn{width:min(340px,92%);min-height:56px;overflow:hidden;color:var(--sc-muted);text-align:center}
.tr-pn p{margin:0;animation:trPn .38s ${E}}
@keyframes trPn{from{opacity:0;transform:translateX(calc(var(--dir,1)*28px))}}`,
 html:`<div class="tr"><div class="tr-tl" role="tablist" aria-label="Sections"><i class="tr-in"></i><button class="tr-tb" role="tab" aria-selected="true">Overview</button><button class="tr-tb" role="tab" aria-selected="false" tabindex="-1">Activity</button><button class="tr-tb" role="tab" aria-selected="false" tabindex="-1">Settings</button></div><div class="tr-pn" role="tabpanel"><p>Overview: everything at a glance.</p></div></div>`,
 js:wrap(`var tabs=[].slice.call(root.querySelectorAll('.tr-tb')),ind=root.querySelector('.tr-in'),pn=root.querySelector('.tr-pn'),txt=['Overview: everything at a glance.','Activity: what changed and when.','Settings: tune it to taste.'],cur=0;
function move(){var t=tabs[cur];ind.style.left=t.offsetLeft+'px';ind.style.width=t.offsetWidth+'px'}
function pick(i){var d=i>cur?1:-1;cur=i;tabs.forEach(function(t,k){t.setAttribute('aria-selected',String(k===i));t.tabIndex=k===i?0:-1});pn.style.setProperty('--dir',d);var p=document.createElement('p');p.textContent=txt[i];pn.textContent='';pn.appendChild(p);move()}
tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(i)});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){var n=(i+d+tabs.length)%tabs.length;pick(n);tabs[n].focus()}})});
move();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(move);`),
 thumb:{click:'.tr-tb:nth-of-type(2)',wait:500}},
];
