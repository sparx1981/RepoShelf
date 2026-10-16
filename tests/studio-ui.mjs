import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),html=await readFile(new URL('.asset-html/studio.html',root),'utf8').catch(()=>readFile(new URL('studio.html',root),'utf8'));
const ui=await readFile(new URL('ui.js',root),'utf8'),studio=(await readFile(new URL('studio.js',root),'utf8')).replace(/^import .*;\n/gm,'');
// Execute the actual routing and catalogue controllers together. Rendering and
// external services are fixtures; this does not replace a browser visual check.
async function environment(hash=''){
 const nodes=new Map(),listeners=new Map(),storage=new Map(),timers=new Map(),requests=[];let serial=0;
 class Node{
  constructor(){this.children=[];this.attrs={};this.dataset={};this.value='';this.hidden=false;this.style={setProperty(){}};this.classList={toggle(){}};this.events={}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v}getAttribute(k){return this.attrs[k]??null}
  append(...n){this.children.push(...n)}replaceChildren(...n){this.children=n}
  addEventListener(k,f){this.events[k]=f}querySelector(s){return this.children.flatMap(n=>n.children||[]).find(n=>n.attrs?.href)||new Node()}
  querySelectorAll(){return []}showModal(){this.open=true}close(){this.open=false;this.events.close?.()}
  focus(){this.focused=true}scrollIntoView(){}
 }
 for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){assert.ok(!nodes.has(m[1]),'unique DOM id '+m[1]);const n=new Node();n.id=m[1];for(const a of m[0].matchAll(/([\w-]+)="([^"]*)"/g))n.setAttribute(a[1],a[2]);n.hidden=/\shidden(?:\s|>)/.test(m[0]);nodes.set(m[1],n)}
 const exports=['patterns','motion','typography'].map(tool=>{const n=new Node();n.dataset.export=tool+':css';return n});
 const tabs=[...nodes.values()].filter(n=>n.id.startsWith('studio-tab-'));
 const location={pathname:'/studio.html',hash,href:'https://test/studio.html'+hash};
 const dispatchEvent=e=>{for(const f of listeners.get(e.type)||[])f(e)};
 const ctx={console,Event,URL,Blob,TextEncoder,Uint8Array,Uint32Array,DataView,ArrayBuffer,location,
  history:{replaceState(a,b,u){location.hash=u.includes('#')?u.slice(u.indexOf('#')):''}},
  document:{getElementById:id=>nodes.get(id),querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:s=>s==='[data-export]'?exports:s.startsWith('.studio-tabs')?tabs.filter(n=>!s.includes(':not')||!n.hidden):[],createElement:()=>new Node(),createDocumentFragment:()=>new Node()},
  sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  setTimeout:f=>{const id=++serial;timers.set(id,f);return id},clearTimeout:id=>timers.delete(id),
  addEventListener:(k,f)=>listeners.set(k,[...(listeners.get(k)||[]),f]),dispatchEvent,
  RepoAccount:{ready:true,user:null,track(){}},RepoProfileMenu:{install(){},open(){ctx.signInOpened=true}},
  patternTool:()=>({get:()=>({}),set(){}}),motionTool:()=>({get:()=>({}),set(){},activate(){}}),typographyTool:()=>({get:()=>({}),set(){},colours(fg,bg){ctx.transferredColours=[fg,bg]}}),gradientTool:()=>({get:()=>({}),set(){}}),rampTool:()=>({get:()=>({foreground:'#112233',background:'#fafafa'}),set(){}}),asciiTool:()=>({get:()=>({}),set(){}}),liveTool:()=>({get:()=>undefined,open(){},close(){},isDefault:()=>true}),liveItems:[],motionLab:()=>({open(){},close(){}}),
  fetch:async url=>{requests.push(url);return {ok:true,json:async()=>url==='/ui/index.json'?[{id:'c-badge-4',t:'Badge',f:'General',k:'badge',c:'Badge'}]:[]}}
 };
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(ui,ctx);vm.runInContext(studio,ctx);
 const settle=async()=>{for(let n=0;n<8;n++)await new Promise(setImmediate)};await settle();
 return {ctx,nodes,requests,storage,exports,settle,flush(){const all=[...timers.values()];timers.clear();all.forEach(f=>f())}};
}
let e=await environment();assert.ok(!e.requests.includes('/ui/index.json'),'UI catalogue is lazy');
e.nodes.get('studio-tab-ui').onclick();await e.settle();e.flush();
assert.equal(e.nodes.get('studio-ui').hidden,false);assert.equal(e.ctx.location.hash,'#ui');assert.equal(e.requests.filter(u=>u==='/ui/index.json').length,1);
e.ctx.location.hash='#ui/c-badge-4';e.ctx.dispatchEvent(new Event('hashchange'));await e.settle();e.flush();
assert.equal(e.nodes.get('prompt-dialog').open,true);assert.equal(e.ctx.location.hash,'#ui/c-badge-4','Studio share timer retains component link');
e.nodes.get('tab-code').onclick();const lock=e.nodes.get('panel-code').children[0];const signIn=lock.children.find(n=>n.attrs?.href);assert.ok(signIn.attrs.href.endsWith('%2Fstudio.html'));signIn.onclick();assert.equal(JSON.parse(e.storage.get('reposhelf.ui.open')).tab,'code');
e.nodes.get('prompt-close').onclick();assert.equal(e.ctx.location.hash,'#ui');assert.equal(e.nodes.get('live-frame').src,'about:blank');
e.nodes.get('studio-tab-ui').onkeydown({key:'Home',preventDefault(){}});e.flush();assert.equal(e.nodes.get('studio-gradient').hidden,false);assert.equal(JSON.parse(decodeURIComponent(e.ctx.location.hash.slice(3))).tool,'gradient');
e=await environment('#ui/c-badge-4');e.flush();assert.equal(e.nodes.get('studio-tab-ui').getAttribute('aria-selected'),'true');assert.equal(e.nodes.get('prompt-dialog').open,true);
for(const tool of ['patterns','motion','typography']){e=await environment('#'+tool);assert.equal(e.nodes.get('studio-'+tool).hidden,false);e.nodes.get('studio-tab-'+tool).onclick();e.flush();assert.equal(JSON.parse(decodeURIComponent(e.ctx.location.hash.slice(3))).tool,tool);const button=e.exports.find(n=>n.dataset.export===tool+':css');await button.onclick();assert.equal(e.ctx.signInOpened,true,'guest exports use shared sign-in gate');assert.equal(button.disabled,false);assert.equal(JSON.parse(e.storage.get('reposhelf.studio.resume.v1')).state.tool,tool);e.ctx.RepoAccount.user={id:'member'};let authorised=false;e.ctx.RepoAccount.request=async()=>{authorised=true;throw Object.assign(Error('Accept terms'),{status:428})};await button.onclick();assert.equal(authorised,true);assert.equal(e.ctx.location.href,'/legal.html?return=studio','member exports require current legal acceptance')}
const redirect=await readFile(new URL('ui-redirect.js',root),'utf8');for(const hash of ['#ui/c-badge-4','','#other']){let url;vm.runInNewContext(redirect,{location:{hash,replace:u=>url=u}});assert.equal(url,'/studio.html'+(hash.startsWith('#ui/')?hash:'#ui'))}
console.log('PASS: Studio/UI controllers lazy-load once, retain deep links and auth return, clear previews on close, and support keyboard tab navigation; legacy UI links redirect.');

e=await environment('#s='+encodeURIComponent(JSON.stringify({v:1,tool:'typography',typography:{view:'effects'}})));assert.equal(e.nodes.get('studio-typography').hidden,false);assert.equal(e.nodes.get('studio-status').textContent,undefined);e=await environment('#s=%broken');assert.equal(e.ctx.location.hash,'');

e=await environment();e.nodes.get('ramp-to-type').onclick();assert.deepEqual(Array.from(e.ctx.transferredColours),['#112233','#fafafa']);assert.equal(e.nodes.get('studio-typography').hidden,false);assert.equal(e.nodes.get('type-view').focused,true);
