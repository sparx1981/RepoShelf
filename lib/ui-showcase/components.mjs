// Original expressive components. Plain HTML, CSS and a little JavaScript; no libraries.
const family='Expressive components';
export const components=[
{id:'s-spotlight-cards',title:'Spotlight cards',component:'Spotlight card',key:'spotlight-card',family,width:820,
 description:'A card grid where a soft spotlight follows the pointer across every card at once.',
 prompt:'Build a responsive three-column grid of cards with a title and one line of text each. When the pointer moves over the grid, a soft radial spotlight in the accent colour appears inside every card, centred on the pointer position relative to that card, and fades out when the pointer leaves. Use CSS variables --x and --y set from JavaScript. Respect reduced motion and keep the cards readable without a pointer. Vanilla HTML, CSS and JavaScript only.',
 css:`.spc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.spc-card{position:relative;overflow:hidden;padding:24px;border:1px solid var(--sc-line);border-radius:18px;background:var(--sc-surface)}
.spc-card::before{content:"";position:absolute;inset:0;background:radial-gradient(260px circle at var(--x,50%) var(--y,50%),var(--sc-ring),transparent 70%);opacity:0;transition:opacity .25s}
.spc-grid:hover .spc-card::before{opacity:1}
.spc-card h3{position:relative;margin:0 0 6px;font-size:17px}
.spc-card p{position:relative;margin:0;color:var(--sc-muted);font-size:14px}
.spc-dot{position:relative;display:block;width:34px;height:34px;margin-bottom:16px;border-radius:10px;background:var(--sc-accent)}`,
 html:`<div class="spc-grid"><article class="spc-card"><span class="spc-dot"></span><h3>Live sync</h3><p>Every change reaches your team in under a second.</p></article><article class="spc-card"><span class="spc-dot" style="opacity:.75"></span><h3>Smart search</h3><p>Find any file, note or message with one shortcut.</p></article><article class="spc-card"><span class="spc-dot" style="opacity:.5"></span><h3>Private by default</h3><p>Nothing is shared until you decide it should be.</p></article></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,grid=root.querySelector('.spc-grid');
grid.addEventListener('pointermove',function(e){grid.querySelectorAll('.spc-card').forEach(function(card){var r=card.getBoundingClientRect();card.style.setProperty('--x',(e.clientX-r.left)+'px');card.style.setProperty('--y',(e.clientY-r.top)+'px')})});})();`},

{id:'s-tilt-card',title:'Tilt card',component:'Tilt card',key:'tilt-card',family,width:520,
 description:'A card that tilts in 3D towards the pointer, with a moving glare.',
 prompt:'Create a single card with a gradient artwork area, a title and a short description. On pointer move, rotate the card up to 10 degrees on both axes towards the pointer using perspective and transform, and move a white glare gradient with the pointer. Ease back to flat when the pointer leaves. Disable the tilt for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.tc-wrap{perspective:900px;display:grid;place-items:center}
.tc{position:relative;width:min(100%,340px);border-radius:22px;border:1px solid var(--sc-line);background:var(--sc-surface);overflow:hidden;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .35s cubic-bezier(.2,.8,.2,1);will-change:transform;box-shadow:0 18px 40px -22px rgba(0,0,0,.45)}
.tc.is-active{transition:transform .08s linear}
.tc-art{height:170px;background:linear-gradient(135deg,var(--sc-accent),#22d3ee 60%,#f472b6)}
.tc-body{padding:18px 20px 22px}.tc-body h3{margin:0 0 4px;font-size:18px}.tc-body p{margin:0;color:var(--sc-muted);font-size:14px}
.tc-glare{position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.55),transparent 55%);opacity:0;transition:opacity .25s;mix-blend-mode:soft-light;pointer-events:none}
.tc.is-active .tc-glare{opacity:1}`,
 html:`<div class="tc-wrap"><article class="tc"><div class="tc-art"></div><div class="tc-body"><h3>Northern lights</h3><p>Move your pointer across the card.</p></div><div class="tc-glare"></div></article></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,card=root.querySelector('.tc'),calm=matchMedia('(prefers-reduced-motion: reduce)');
card.addEventListener('pointermove',function(e){if(calm.matches)return;var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.classList.add('is-active');card.style.setProperty('--ry',((x-.5)*20)+'deg');card.style.setProperty('--rx',((.5-y)*20)+'deg');card.style.setProperty('--gx',(x*100)+'%');card.style.setProperty('--gy',(y*100)+'%')});
card.addEventListener('pointerleave',function(){card.classList.remove('is-active');card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')});})();`},

{id:'s-glow-bento',title:'Glow bento grid',component:'Bento grid',key:'bento-grid',family,width:860,
 description:'A bento layout whose card borders light up as the pointer nears them.',
 prompt:'Build a bento grid of six cards of different sizes (CSS grid with spans). Each card has a 1px border that glows in the accent colour near the pointer: draw the glow with a ::after layer that uses a radial gradient centred on the pointer and is masked so only the border shows (mask-composite exclude). Set --mx and --my on each card from pointermove on the grid. Vanilla HTML, CSS and JavaScript.',
 css:`.gb{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:120px;gap:12px}
.gb-card{position:relative;padding:18px;border-radius:18px;background:var(--sc-surface);border:1px solid var(--sc-line);overflow:hidden}
.gb-card::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;background:radial-gradient(220px circle at var(--mx,-200px) var(--my,-200px),var(--sc-accent),transparent 65%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);pointer-events:none}
.gb-card strong{display:block;font-size:15px}.gb-card span{color:var(--sc-muted);font-size:13px}
.gb-a{grid-column:span 2;grid-row:span 2}.gb-b{grid-column:span 2}.gb-c{grid-row:span 2}.gb-big{display:block;margin-top:10px;font-size:44px;font-weight:700;letter-spacing:-.03em;color:var(--sc-fg)}
@media (max-width:640px){.gb{grid-template-columns:repeat(2,1fr)}}`,
 html:`<div class="gb"><div class="gb-card gb-a"><strong>Weekly active teams</strong><span>Compared with last month</span><b class="gb-big">12,480</b></div><div class="gb-card gb-b"><strong>Deploys</strong><span>214 this week</span></div><div class="gb-card gb-c"><strong>Uptime</strong><span>Last 90 days</span><b class="gb-big" style="font-size:30px">99.98%</b></div><div class="gb-card"><strong>Latency</strong><span>p95 · 184ms</span></div><div class="gb-card"><strong>Errors</strong><span>0.02%</span></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,grid=root.querySelector('.gb');
grid.addEventListener('pointermove',function(e){grid.querySelectorAll('.gb-card').forEach(function(c){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});
grid.addEventListener('pointerleave',function(){grid.querySelectorAll('.gb-card').forEach(function(c){c.style.setProperty('--mx','-200px');c.style.setProperty('--my','-200px')})});})();`},

{id:'s-magnify-dock',title:'Magnifying dock',component:'Dock',key:'dock',family,width:560,
 description:'A floating dock whose icons swell smoothly as the pointer moves along it.',
 prompt:'Create a floating dock with five icon buttons (home, search, mail, music, settings) drawn as inline SVG. As the pointer moves horizontally along the dock, each icon scales between 1 and about 1.9 using a gaussian falloff based on its distance from the pointer, and rises slightly. Labels appear above the hovered icon. Icons return to normal when the pointer leaves. Buttons are real buttons with aria-labels and focus styles. Vanilla HTML, CSS and JavaScript.',
 css:`.dk{display:flex;justify-content:center;padding-top:34px}
.dk-bar{display:flex;align-items:flex-end;gap:10px;padding:10px 14px;border-radius:24px;background:color-mix(in srgb,var(--sc-surface) 85%,transparent);border:1px solid var(--sc-line);box-shadow:0 16px 36px -18px rgba(0,0,0,.5);backdrop-filter:blur(12px)}
.dk-item{position:relative;display:grid;place-items:center;width:52px;height:52px;border:0;border-radius:14px;background:var(--sc-bg);color:var(--sc-fg);cursor:pointer;transform-origin:50% 100%;transform:scale(var(--s,1));transition:transform .12s ease-out;border:1px solid var(--sc-line)}
.dk-item svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dk-item::after{content:attr(data-label);position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%) scale(calc(1/var(--s,1)));padding:3px 9px;border-radius:8px;background:var(--sc-fg);color:var(--sc-bg);font-size:12px;white-space:nowrap;opacity:0;transition:opacity .15s;pointer-events:none}
.dk-item:hover::after,.dk-item:focus-visible::after{opacity:1}`,
 html:`<div class="dk"><div class="dk-bar" role="toolbar" aria-label="Dock"><button class="dk-item" data-label="Home" aria-label="Home"><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></button><button class="dk-item" data-label="Search" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button><button class="dk-item" data-label="Mail" aria-label="Mail"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></button><button class="dk-item" data-label="Music" aria-label="Music"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></button><button class="dk-item" data-label="Settings" aria-label="Settings"><svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg></button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,bar=root.querySelector('.dk-bar'),items=[].slice.call(bar.querySelectorAll('.dk-item')),calm=matchMedia('(prefers-reduced-motion: reduce)');
function reset(){items.forEach(function(i){i.style.setProperty('--s',1)})}
bar.addEventListener('pointermove',function(e){if(calm.matches)return;items.forEach(function(item){var r=item.getBoundingClientRect(),d=e.clientX-(r.left+r.width/2);item.style.setProperty('--s',(1+.9*Math.exp(-(d*d)/(2*60*60))).toFixed(3))})});
bar.addEventListener('pointerleave',reset);})();`},

{id:'s-gooey-nav',title:'Gooey navigation',component:'Gooey navigation',key:'gooey-nav',family,width:620,
 description:'A tab bar whose highlight stretches and snaps like liquid when you change tabs.',
 prompt:'Build a horizontal navigation with four tabs. Behind the text, draw two rounded highlight blobs inside a container that has an SVG gooey filter (feGaussianBlur then feColorMatrix with high alpha contrast). When a tab is selected, move both blobs to it, the second with a slightly longer transition, so they stretch and merge. Text sits above the filtered layer, the selected tab has aria-current, and arrow keys move between tabs. Vanilla HTML, CSS and JavaScript.',
 css:`.gn{position:relative;display:inline-flex;padding:6px;border-radius:999px;background:var(--sc-surface);border:1px solid var(--sc-line)}
.gn-goo{position:absolute;inset:6px;filter:url(#sc-goo);pointer-events:none}
.gn-blob{position:absolute;top:0;bottom:0;left:0;width:0;border-radius:999px;background:var(--sc-accent);transition:left .45s cubic-bezier(.3,1.3,.5,1),width .45s cubic-bezier(.3,1.3,.5,1)}
.gn-blob+.gn-blob{transition-duration:.65s}
.gn-tab{position:relative;z-index:1;padding:9px 20px;border:0;border-radius:999px;background:none;cursor:pointer;color:var(--sc-muted);transition:color .25s}
.gn-tab[aria-current=true]{color:var(--sc-accent-fg)}`,
 html:`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="sc-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></defs></svg><nav class="gn" aria-label="Sections"><div class="gn-goo"><i class="gn-blob"></i><i class="gn-blob"></i></div><button class="gn-tab" aria-current="true">Overview</button><button class="gn-tab">Activity</button><button class="gn-tab">Reports</button><button class="gn-tab">Settings</button></nav>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,nav=root.querySelector('.gn'),tabs=[].slice.call(nav.querySelectorAll('.gn-tab')),blobs=nav.querySelectorAll('.gn-blob');
function go(tab){tabs.forEach(function(t){t.setAttribute('aria-current',String(t===tab))});var x=tab.offsetLeft-6,w=tab.offsetWidth;blobs.forEach(function(b){b.style.left=x+'px';b.style.width=w+'px'})}
tabs.forEach(function(t,i){t.addEventListener('click',function(){go(t)});t.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(n>=0&&n<tabs.length){e.preventDefault();tabs[n].focus();go(tabs[n])}})});
go(tabs[0]);addEventListener('resize',function(){go(nav.querySelector('[aria-current=true]'))});})();`},

{id:'s-slide-pill-nav',title:'Sliding pill navigation',component:'Pill navigation',key:'pill-nav',family,width:640,
 description:'A compact nav with a pill that glides to the hovered or selected item.',
 prompt:'Create a pill-shaped navigation bar with five links. A single highlight pill follows the pointer to the hovered link and returns to the selected link when the pointer leaves, using transform and width transitions. The selected link has aria-current="page". Fully keyboard accessible: focus moves the pill as well. Vanilla HTML, CSS and JavaScript.',
 css:`.pn{position:relative;display:inline-flex;gap:2px;padding:5px;border-radius:999px;border:1px solid var(--sc-line);background:var(--sc-surface)}
.pn-pill{position:absolute;top:5px;bottom:5px;left:0;width:0;border-radius:999px;background:var(--sc-bg);box-shadow:0 1px 3px rgba(0,0,0,.18),0 0 0 1px var(--sc-line);transition:transform .3s cubic-bezier(.3,.9,.3,1),width .3s cubic-bezier(.3,.9,.3,1)}
.pn a{position:relative;padding:8px 16px;border-radius:999px;color:var(--sc-muted);text-decoration:none;font-size:14px;transition:color .2s}
.pn a:hover,.pn a:focus-visible,.pn a[aria-current=page]{color:var(--sc-fg)}`,
 html:`<nav class="pn" aria-label="Main"><span class="pn-pill"></span><a href="#" aria-current="page">Home</a><a href="#">Products</a><a href="#">Pricing</a><a href="#">Docs</a><a href="#">Contact</a></nav>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,nav=root.querySelector('.pn'),pill=nav.querySelector('.pn-pill'),links=[].slice.call(nav.querySelectorAll('a'));
function to(a){pill.style.width=a.offsetWidth+'px';pill.style.transform='translateX('+(a.offsetLeft-5)+'px)'}
function current(){return nav.querySelector('[aria-current=page]')}
links.forEach(function(a){a.addEventListener('mouseenter',function(){to(a)});a.addEventListener('focus',function(){to(a)});a.addEventListener('click',function(e){e.preventDefault();links.forEach(function(l){l.removeAttribute('aria-current')});a.setAttribute('aria-current','page')})});
nav.addEventListener('mouseleave',function(){to(current())});nav.addEventListener('focusout',function(){to(current())});
pill.style.transition='none';to(current());requestAnimationFrame(function(){pill.style.transition=''});})();`},

{id:'s-flowing-menu',title:'Flowing menu',component:'Flowing menu',key:'flowing-menu',family,width:760,
 description:'Oversized menu rows that slide a scrolling marquee in from the side the pointer entered.',
 prompt:'Make a full-width menu of four large rows (uppercase, 40px). On hover, a marquee panel in the accent colour slides into the row from the top or bottom edge, depending on which edge the pointer entered, and shows the row label repeated and scrolling horizontally. It slides out towards the edge the pointer leaves from. Provide a visible focus state for keyboard users and a static fallback for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.fm{border-top:1px solid var(--sc-line)}
.fm a{position:relative;display:block;height:84px;overflow:hidden;border-bottom:1px solid var(--sc-line);color:var(--sc-fg);text-decoration:none;text-transform:uppercase;font-weight:700;font-size:38px;letter-spacing:-.02em}
.fm a>span{position:absolute;inset:0;display:grid;align-items:center;padding:0 20px}
.fm-pane{position:absolute;inset:0;background:var(--sc-accent);color:var(--sc-accent-fg);transform:translateY(101%);transition:transform .45s cubic-bezier(.25,.8,.25,1);overflow:hidden;display:flex;align-items:center}
.fm a.in-top .fm-pane{transform:translateY(-101%);transition:none}.fm a.in-bottom .fm-pane{transform:translateY(101%);transition:none}
.fm a.is-open .fm-pane{transform:translateY(0);transition:transform .45s cubic-bezier(.25,.8,.25,1)}
.fm-track{display:flex;white-space:nowrap;animation:fm-run 9s linear infinite}
.fm-track em{font-style:normal;padding:0 20px}
@keyframes fm-run{to{transform:translateX(-50%)}}
.fm a:focus-visible .fm-pane{transform:translateY(0)}`,
 html:`<nav class="fm" aria-label="Menu"><a href="#"><span>Projects</span><div class="fm-pane" aria-hidden="true"><div class="fm-track"><em>Projects</em><em>Projects</em><em>Projects</em><em>Projects</em><em>Projects</em><em>Projects</em><em>Projects</em><em>Projects</em></div></div></a><a href="#"><span>Studio</span><div class="fm-pane" aria-hidden="true"><div class="fm-track"><em>Studio</em><em>Studio</em><em>Studio</em><em>Studio</em><em>Studio</em><em>Studio</em><em>Studio</em><em>Studio</em></div></div></a><a href="#"><span>Journal</span><div class="fm-pane" aria-hidden="true"><div class="fm-track"><em>Journal</em><em>Journal</em><em>Journal</em><em>Journal</em><em>Journal</em><em>Journal</em><em>Journal</em><em>Journal</em></div></div></a><a href="#"><span>Contact</span><div class="fm-pane" aria-hidden="true"><div class="fm-track"><em>Contact</em><em>Contact</em><em>Contact</em><em>Contact</em><em>Contact</em><em>Contact</em><em>Contact</em><em>Contact</em></div></div></a></nav>`,
 js:`(function(){var root=document.currentScript.previousElementSibling;
root.querySelectorAll('.fm a').forEach(function(a){
function edge(e){var r=a.getBoundingClientRect();return e.clientY-r.top<r.height/2?'top':'bottom'}
a.addEventListener('click',function(e){e.preventDefault()});
a.addEventListener('pointerenter',function(e){var side=edge(e);a.classList.remove('is-open','in-top','in-bottom');a.classList.add('in-'+side);void a.offsetWidth;a.classList.add('is-open')});
a.addEventListener('pointerleave',function(e){var side=edge(e);a.classList.remove('is-open');a.querySelector('.fm-pane').style.transform='translateY('+(side==='top'?'-101%':'101%')+')';setTimeout(function(){a.querySelector('.fm-pane').style.transform='';a.classList.remove('in-top','in-bottom')},470)});});})();`},

{id:'s-card-stack',title:'Card stack',component:'Card stack',key:'card-stack',family,width:520,
 description:'A stack of cards where the top card flicks away and drops to the back.',
 prompt:'Build a stack of four cards (each a different gradient with a title). Cards are positioned with scale and translateY offsets so the stack reads as depth. A Next button sends the top card up and away, then moves it to the back of the stack while the others shift forward; a Previous button reverses it. Use data-pos attributes and CSS transitions. Keep a text live region announcing the current card. Vanilla HTML, CSS and JavaScript.',
 css:`.cs{display:grid;gap:22px;justify-items:center}
.cs-stack{position:relative;width:min(100%,300px);height:200px}
.cs-card{position:absolute;inset:0;display:flex;align-items:flex-end;padding:20px;border-radius:20px;color:#fff;font-weight:700;font-size:22px;box-shadow:0 18px 36px -20px rgba(0,0,0,.55);transition:transform .5s cubic-bezier(.3,1.2,.4,1),opacity .4s;transform-origin:50% 100%}
.cs-card[data-pos="0"]{transform:translateY(0) scale(1);z-index:4}.cs-card[data-pos="1"]{transform:translateY(-16px) scale(.94);z-index:3}.cs-card[data-pos="2"]{transform:translateY(-32px) scale(.88);z-index:2}.cs-card[data-pos="3"]{transform:translateY(-48px) scale(.82);z-index:1}
.cs-card[data-pos="out"]{transform:translateY(-120%) rotate(-8deg) scale(1);opacity:0;z-index:5}
.cs-actions{display:flex;gap:10px}.cs-actions button{padding:9px 18px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-surface);cursor:pointer}.cs-actions button:hover{border-color:var(--sc-accent)}
.cs-stack{margin-top:48px}`,
 html:`<div class="cs"><div class="cs-stack"><article class="cs-card" data-pos="0" style="background:linear-gradient(135deg,#6d5ef5,#22d3ee)">Aurora</article><article class="cs-card" data-pos="1" style="background:linear-gradient(135deg,#f97316,#f43f5e)">Ember</article><article class="cs-card" data-pos="2" style="background:linear-gradient(135deg,#10b981,#3b82f6)">Lagoon</article><article class="cs-card" data-pos="3" style="background:linear-gradient(135deg,#a855f7,#ec4899)">Orchid</article></div><div class="cs-actions"><button data-act="prev">Previous</button><button data-act="next">Next card</button></div><p class="cs-live" role="status" aria-live="polite" style="margin:0;color:var(--sc-muted);font-size:13px">Showing Aurora</p></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,cards=[].slice.call(root.querySelectorAll('.cs-card')),order=cards.slice(),live=root.querySelector('.cs-live'),busy=false;
function paint(){order.forEach(function(c,i){c.dataset.pos=i});live.textContent='Showing '+order[0].textContent}
root.querySelector('[data-act=next]').addEventListener('click',function(){if(busy)return;busy=true;var top=order[0];top.dataset.pos='out';setTimeout(function(){order.push(order.shift());paint();busy=false},330)});
root.querySelector('[data-act=prev]').addEventListener('click',function(){if(busy)return;busy=true;var last=order[order.length-1];last.dataset.pos='out';setTimeout(function(){order.unshift(order.pop());paint();busy=false},330)});})();`},

{id:'s-glass-panel',title:'Frosted glass panel',component:'Glass surface',key:'glass-surface',family,width:700,
 description:'A frosted glass card over slowly drifting colour, with a bright specular edge.',
 prompt:'Create a hero area with three large blurred colour blobs that drift slowly using CSS keyframes. On top, place a centred glass panel with backdrop-filter blur and saturate, a translucent white background, a 1px light border, an inner top highlight, and a soft shadow. The panel contains a heading, a sentence and a button. Provide a fallback background for browsers without backdrop-filter. Vanilla HTML and CSS only.',
 css:`.gl{position:relative;display:grid;place-items:center;min-height:340px;overflow:hidden;border-radius:26px;background:#0f1020}
.gl i{position:absolute;width:260px;height:260px;border-radius:50%;filter:blur(40px);opacity:.9;animation:gl-drift 14s ease-in-out infinite alternate}
.gl i:nth-child(1){background:#6d5ef5;left:6%;top:-8%}.gl i:nth-child(2){background:#22d3ee;right:4%;bottom:-10%;animation-delay:-5s}.gl i:nth-child(3){background:#f472b6;left:38%;top:30%;width:200px;height:200px;animation-delay:-9s}
@keyframes gl-drift{to{transform:translate(50px,-30px) scale(1.15)}}
.gl-panel{position:relative;width:min(88%,360px);padding:26px;border-radius:22px;color:#fff;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 24px 48px -20px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
@supports not (backdrop-filter:blur(1px)){.gl-panel{background:rgba(30,30,50,.75)}}
.gl-panel h3{margin:0 0 6px;font-size:22px}.gl-panel p{margin:0 0 18px;color:rgba(255,255,255,.82);font-size:14px}
.gl-panel button{padding:10px 18px;border:1px solid rgba(255,255,255,.5);border-radius:999px;background:rgba(255,255,255,.22);color:#fff;cursor:pointer}.gl-panel button:hover{background:rgba(255,255,255,.34)}`,
 html:`<div class="gl"><i></i><i></i><i></i><section class="gl-panel"><h3>Clear as glass</h3><p>Content stays readable while colour moves softly behind it.</p><button>Get started</button></section></div>`,
 js:`/* Pure CSS component: no script required. */`},

{id:'s-logo-loop',title:'Logo loop',component:'Logo loop',key:'logo-loop',family,width:760,
 description:'A seamless, edge-faded marquee of logos that slows to a stop on hover.',
 prompt:'Build an infinite horizontal logo marquee. Render the list of six text-and-shape logos twice inside one flex track and animate translateX from 0 to -50% linearly so the loop is seamless. Fade the left and right edges with a mask-image. Pause the animation on hover and focus-within, and for reduced motion show a static wrapped row instead. Vanilla HTML and CSS.',
 css:`.ll{overflow:hidden;padding:18px 0;-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}
.ll-track{display:flex;width:max-content;gap:48px;animation:ll-run 24s linear infinite}
.ll:hover .ll-track,.ll:focus-within .ll-track{animation-play-state:paused}
.ll-logo{display:inline-flex;align-items:center;gap:10px;color:var(--sc-muted);font-weight:700;font-size:20px;letter-spacing:-.02em;white-space:nowrap;transition:color .2s}.ll-logo:hover{color:var(--sc-fg)}
.ll-logo svg{width:26px;height:26px;fill:currentColor}
@keyframes ll-run{to{transform:translateX(calc(-50% - 24px))}}
@media (prefers-reduced-motion:reduce){.ll-track{animation:none;flex-wrap:wrap;width:auto;justify-content:center}.ll-track [aria-hidden=true]{display:none}.ll{-webkit-mask-image:none;mask-image:none}}`,
 html:`<div class="ll" role="group" aria-label="Trusted by"><div class="ll-track"><span class="ll-logo"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>Orbit</span><span class="ll-logo"><svg viewBox="0 0 24 24"><path d="M12 2l10 20H2z"/></svg>Summit</span><span class="ll-logo"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/></svg>Cubic</span><span class="ll-logo"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.3L12 17.8 5.6 21.5l1.7-7.3L2 9.6 9 9z"/></svg>Starling</span><span class="ll-logo"><svg viewBox="0 0 24 24"><path d="M3 12c4-8 14-8 18 0-4 8-14 8-18 0z"/></svg>Lumen</span><span class="ll-logo"><svg viewBox="0 0 24 24"><path d="M4 4h16v6H4zM4 14h10v6H4z"/></svg>Stackly</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>Orbit</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l10 20H2z"/></svg>Summit</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/></svg>Cubic</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.3L12 17.8 5.6 21.5l1.7-7.3L2 9.6 9 9z"/></svg>Starling</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12c4-8 14-8 18 0-4 8-14 8-18 0z"/></svg>Lumen</span><span class="ll-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h16v6H4zM4 14h10v6H4z"/></svg>Stackly</span></div></div>`,
 js:`/* Pure CSS component: no script required. */`},

{id:'s-orbit-border-button',title:'Orbiting border button',component:'Animated border',key:'animated-border',family,width:520,
 description:'A button and a card whose border is traced by a travelling beam of colour.',
 prompt:'Make a primary button and a feature card that each have a 2px animated border: a conic-gradient light that rotates around the element. Register a CSS custom property --angle with @property (syntax <angle>) and animate it from 0 to 360 degrees; paint the gradient on a border layer using mask-composite so only the ring shows. Pause or remove the animation for reduced motion. Vanilla HTML and CSS.',
 css:`@property --sc-angle{syntax:"<angle>";initial-value:0deg;inherits:false}
.ob{display:grid;gap:22px;justify-items:center}
.ob-ring{position:relative;border-radius:16px;isolation:isolate}
.ob-ring::before{content:"";position:absolute;inset:0;padding:2px;border-radius:inherit;background:conic-gradient(from var(--sc-angle),transparent 0 70%,var(--sc-accent) 85%,#22d3ee 95%,transparent);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:ob-spin 3.2s linear infinite;z-index:1}
.ob-ring::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid var(--sc-line);z-index:0}
@keyframes ob-spin{to{--sc-angle:360deg}}
.ob-btn{position:relative;z-index:2;display:block;padding:14px 30px;border:0;border-radius:inherit;background:var(--sc-surface);cursor:pointer;font-weight:600}
.ob-card{position:relative;z-index:2;padding:22px 26px;border-radius:inherit;background:var(--sc-surface);max-width:320px}.ob-card h3{margin:0 0 4px;font-size:17px}.ob-card p{margin:0;color:var(--sc-muted);font-size:14px}`,
 html:`<div class="ob"><div class="ob-ring"><button class="ob-btn">Start free trial</button></div><div class="ob-ring" style="border-radius:20px"><div class="ob-card"><h3>Pro plan</h3><p>Everything in Free, plus unlimited projects and priority support.</p></div></div></div>`,
 js:`/* Pure CSS component: no script required. */`},

{id:'s-progress-stepper',title:'Progress stepper',component:'Stepper',key:'stepper',family,width:700,
 description:'A multi-step indicator with an animated progress line and checkmarks.',
 prompt:'Build a four-step stepper (Account, Profile, Plan, Done). A track line fills smoothly to the current step; completed steps show an animated checkmark drawn with stroke-dashoffset, the current step is outlined in the accent colour, and upcoming steps are muted. Back and Continue buttons change the step; Back is disabled on the first step and Continue becomes Finish on the last. Use aria-current="step" and a polite live region. Vanilla HTML, CSS and JavaScript.',
 css:`.st{display:grid;gap:26px}
.st-track{position:relative;display:flex;justify-content:space-between}
.st-line{position:absolute;left:18px;right:18px;top:17px;height:3px;border-radius:2px;background:var(--sc-line)}
.st-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:var(--sc-accent);transition:width .5s cubic-bezier(.3,.9,.3,1)}
.st-step{position:relative;display:grid;justify-items:center;gap:8px;width:76px;font-size:13px;color:var(--sc-muted)}
.st-dot{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--sc-bg);border:2px solid var(--sc-line);font-weight:600;transition:all .35s}
.st-dot svg{width:18px;height:18px;fill:none;stroke:var(--sc-accent-fg);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .4s .15s}
.st-step.is-done .st-dot{background:var(--sc-accent);border-color:var(--sc-accent)}.st-step.is-done .st-dot span{display:none}.st-step.is-done .st-dot svg{stroke-dashoffset:0}
.st-step.is-current .st-dot{border-color:var(--sc-accent);box-shadow:0 0 0 5px var(--sc-ring);color:var(--sc-fg)}.st-step.is-current{color:var(--sc-fg)}
.st-actions{display:flex;justify-content:space-between}.st-actions button{padding:9px 20px;border-radius:999px;border:1px solid var(--sc-line);background:var(--sc-surface);cursor:pointer}.st-actions button:last-child{background:var(--sc-accent);color:var(--sc-accent-fg);border-color:var(--sc-accent)}.st-actions button:disabled{opacity:.4;cursor:not-allowed}`,
 html:`<div class="st"><div class="st-track"><div class="st-line"><div class="st-fill"></div></div><div class="st-step"><div class="st-dot"><span>1</span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>Account</div><div class="st-step"><div class="st-dot"><span>2</span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>Profile</div><div class="st-step"><div class="st-dot"><span>3</span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>Plan</div><div class="st-step"><div class="st-dot"><span>4</span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>Done</div></div><p class="st-live" role="status" aria-live="polite" style="margin:0;text-align:center;color:var(--sc-muted);font-size:14px"></p><div class="st-actions"><button data-act="back">Back</button><button data-act="next">Continue</button></div></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,steps=[].slice.call(root.querySelectorAll('.st-step')),fill=root.querySelector('.st-fill'),live=root.querySelector('.st-live'),back=root.querySelector('[data-act=back]'),next=root.querySelector('[data-act=next]'),i=1;
function paint(){steps.forEach(function(s,n){s.classList.toggle('is-done',n<i);s.classList.toggle('is-current',n===i);if(n===i)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current')});fill.style.width=(i/(steps.length-1)*100)+'%';back.disabled=i===0;next.textContent=i===steps.length-1?'Finish':'Continue';live.textContent='Step '+(i+1)+' of '+steps.length+': '+steps[i].textContent.replace(/[0-9]/g,'').trim()}
back.addEventListener('click',function(){if(i>0){i--;paint()}});next.addEventListener('click',function(){if(i<steps.length-1){i++;paint()}else{i=0;paint()}});paint();})();`},

{id:'s-holo-profile-card',title:'Holographic profile card',component:'Profile card',key:'profile-card',family,width:520,
 description:'A profile card with a rainbow foil sheen that shifts as you move across it.',
 prompt:'Design a trading-card style profile card (avatar made from initials on a gradient, name, role, three stats). Overlay a holographic layer: a repeating rainbow linear gradient with mix-blend-mode color-dodge whose background-position follows the pointer, plus a soft radial highlight. Tilt the card slightly with the pointer, and settle back flat when it leaves. Disable the effect for reduced motion. Vanilla HTML, CSS and JavaScript.',
 css:`.hp-wrap{perspective:900px;display:grid;place-items:center}
.hp{position:relative;width:min(100%,300px);padding:24px;border-radius:22px;overflow:hidden;background:linear-gradient(160deg,#1e1b4b,#0f172a);color:#fff;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .35s cubic-bezier(.2,.8,.2,1);box-shadow:0 22px 44px -22px rgba(0,0,0,.7)}
.hp.is-active{transition:transform .08s linear}
.hp-avatar{display:grid;place-items:center;width:84px;height:84px;margin:0 auto 14px;border-radius:50%;background:conic-gradient(from 200deg,#6d5ef5,#22d3ee,#f472b6,#6d5ef5);font-size:30px;font-weight:700}
.hp h3{margin:0;text-align:center;font-size:20px}.hp p{margin:2px 0 18px;text-align:center;color:rgba(255,255,255,.65);font-size:14px}
.hp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}.hp-stats b{display:block;font-size:18px}.hp-stats span{font-size:11px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.06em}
.hp-foil{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:repeating-linear-gradient(115deg,#ff7ab8 0%,#ffd86b 12%,#7dffb2 24%,#6ad6ff 36%,#b58cff 48%,#ff7ab8 60%);background-size:260% 260%;background-position:var(--bx,50%) var(--by,50%);mix-blend-mode:color-dodge;filter:saturate(1.4) brightness(.8)}
.hp.is-active .hp-foil{opacity:.5}
.hp-glow{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.35),transparent 55%)}.hp.is-active .hp-glow{opacity:1}`,
 html:`<div class="hp-wrap"><article class="hp"><div class="hp-avatar">AR</div><h3>Ada Reyes</h3><p>Design engineer</p><div class="hp-stats"><div><b>128</b><span>Projects</span></div><div><b>4.9</b><span>Rating</span></div><div><b>12k</b><span>Fans</span></div></div><div class="hp-foil"></div><div class="hp-glow"></div></article></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,card=root.querySelector('.hp'),calm=matchMedia('(prefers-reduced-motion: reduce)');
card.addEventListener('pointermove',function(e){if(calm.matches)return;var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.classList.add('is-active');card.style.setProperty('--ry',((x-.5)*16)+'deg');card.style.setProperty('--rx',((.5-y)*16)+'deg');card.style.setProperty('--bx',(x*100)+'%');card.style.setProperty('--by',(y*100)+'%');card.style.setProperty('--gx',(x*100)+'%');card.style.setProperty('--gy',(y*100)+'%')});
card.addEventListener('pointerleave',function(){card.classList.remove('is-active');card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')});})();`},

{id:'s-expanding-gallery',title:'Expanding panel gallery',component:'Accordion gallery',key:'accordion-gallery',family,width:820,
 description:'Tall panels that stretch open on hover or focus, revealing their caption.',
 prompt:'Create a row of five tall panels (gradient backgrounds) that behave as a horizontal accordion. The active panel takes about five times the flex-grow of the others and reveals a title and caption; inactive panels show a vertical label. Activate on hover and keyboard focus and on click for touch. Use buttons with aria-expanded. Vanilla HTML, CSS and JavaScript; stack vertically on narrow screens.',
 css:`.ag{display:flex;gap:10px;height:320px}
.ag-panel{position:relative;flex:1;min-width:0;border:0;border-radius:20px;padding:0;overflow:hidden;cursor:pointer;color:#fff;text-align:left;transition:flex .55s cubic-bezier(.3,.9,.3,1)}
.ag-panel[aria-expanded=true]{flex:5}
.ag-panel::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.55),transparent 55%)}
.ag-body{position:absolute;left:20px;right:20px;bottom:18px;z-index:1}.ag-body b{display:block;font-size:20px;white-space:nowrap}.ag-body span{display:block;max-height:0;opacity:0;overflow:hidden;font-size:14px;transition:all .4s .1s}
.ag-panel[aria-expanded=true] .ag-body span{max-height:60px;opacity:.9}
.ag-panel:not([aria-expanded=true]) .ag-body b{writing-mode:vertical-rl;transform:rotate(180deg);font-size:16px}
.ag-panel:not([aria-expanded=true]) .ag-body{left:50%;right:auto;transform:translateX(-50%)}
@media (max-width:560px){.ag{flex-direction:column;height:420px}.ag-panel:not([aria-expanded=true]) .ag-body b{writing-mode:horizontal-tb;transform:none}.ag-panel:not([aria-expanded=true]) .ag-body{left:20px;transform:none;bottom:12px}}`,
 html:`<div class="ag"><button class="ag-panel" aria-expanded="true" style="background:linear-gradient(160deg,#6d5ef5,#22d3ee)"><div class="ag-body"><b>Aurora</b><span>Soft ribbons of light over a cold horizon.</span></div></button><button class="ag-panel" aria-expanded="false" style="background:linear-gradient(160deg,#f97316,#f43f5e)"><div class="ag-body"><b>Ember</b><span>Warm glow from a slow dying fire.</span></div></button><button class="ag-panel" aria-expanded="false" style="background:linear-gradient(160deg,#10b981,#0ea5e9)"><div class="ag-body"><b>Lagoon</b><span>Clear shallows and deep teal water.</span></div></button><button class="ag-panel" aria-expanded="false" style="background:linear-gradient(160deg,#a855f7,#ec4899)"><div class="ag-body"><b>Orchid</b><span>Dusk petals fading into magenta.</span></div></button><button class="ag-panel" aria-expanded="false" style="background:linear-gradient(160deg,#334155,#0f172a)"><div class="ag-body"><b>Slate</b><span>Quiet stone for calmer layouts.</span></div></button></div>`,
 js:`(function(){var root=document.currentScript.previousElementSibling,panels=[].slice.call(root.querySelectorAll('.ag-panel'));
function open(p){panels.forEach(function(x){x.setAttribute('aria-expanded',String(x===p))})}
panels.forEach(function(p){p.addEventListener('mouseenter',function(){open(p)});p.addEventListener('focus',function(){open(p)});p.addEventListener('click',function(){open(p)})});})();`}
];
