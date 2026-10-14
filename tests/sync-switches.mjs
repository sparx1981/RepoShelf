import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {syncTypes,createSyncSwitchControl,createSyncSwitchHandler} from '../lib/sync-switches.mjs';
import {createSyncRouter} from '../api/sync-log.mjs';
let state='active',writes=0;const calls=[];
const control=createSyncSwitchControl({token:'fixture-token',fetcher:async(url,options)=>{calls.push(url);assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer fixture-token');if(options.method==='PUT'){writes++;state=url.endsWith('/enable')?'active':'disabled_manually';return new Response(null,{status:204})}return Response.json(url.includes('?')?{workflows:syncTypes.map(t=>({path:'.github/workflows/'+t.id,state}))}:{state})}});
assert.equal((await control.list()).length,13);assert((await control.list()).every(r=>r.enabled&&r.available));
assert.equal((await control.set({id:'catalog.yml',enabled:false,expectedState:'active'})).enabled,false);assert.equal(writes,1);assert.equal((await control.list())[0].enabled,false);
await assert.rejects(control.set({id:'catalog.yml',enabled:true,expectedState:'active'}),e=>e.status===409);assert.equal(writes,1);
await assert.rejects(control.set({id:'../../other.yml',enabled:true,expectedState:'disabled_manually'}),e=>e.status===400);assert.equal(writes,1);
assert.equal((await control.set({id:'catalog.yml',enabled:true,expectedState:'disabled_manually'})).enabled,true);assert.equal(writes,2);
await assert.rejects(createSyncSwitchControl({token:''}).list(),e=>e.code==='actions_token_required');
const refused=createSyncSwitchControl({token:'fixture',fetcher:async()=>new Response(null,{status:403})});await assert.rejects(refused.list(),e=>e.status===503);
let confirmationReads=0;const unconfirmed=createSyncSwitchControl({token:'fixture',fetcher:async(url,options)=>options.method==='PUT'?new Response(null,{status:204}):Response.json(++confirmationReads===1?{state:'active'}:{})});await assert.rejects(unconfirmed.set({id:'catalog.yml',enabled:false,expectedState:'active'}),e=>e.code==='sync_switch_unconfirmed');
let admin=true,origins=0,updates=0;const accounts={origin(req){origins++;if(req.headers.origin!=='https://reposhelf.test')throw Object.assign(Error('Wrong origin'),{status:403})},async admin(){if(!admin)throw Object.assign(Error('Admin required'),{status:403})}};
const handler=createSyncSwitchHandler({accounts,control:{list:async()=>[{id:'catalog.yml'}],set:async body=>{updates++;return body}}});
async function call(method='GET',origin='https://reposhelf.test'){const req={url:'/api/sync-log?action=sync-settings',method,headers:{origin},body:{id:'catalog.yml',enabled:false,expectedState:'active'}},res={writeHead(n){this.status=n},end(v){this.data=JSON.parse(v)}};await handler(req,res);return res}
admin=false;assert.equal((await call()).status,403);assert.equal((await call('POST')).status,403);assert.equal(updates,0);admin=true;assert.equal((await call('POST','https://evil.test')).status,403);assert.equal(updates,0);assert.equal((await call('POST')).status,200);assert.equal(updates,1);assert.equal((await call()).status,200);assert.equal((await call('DELETE')).status,405);
let routed=false;const router=createSyncRouter({switches:async()=>{routed=true}});await router({url:'/api/sync-log?action=sync-settings'},{});assert(routed);
for(const t of syncTypes){assert(t.description.endsWith('.'));await readFile(new URL('../.github/workflows/'+t.id,import.meta.url),'utf8')}
console.log('PASS: All sync switches map to real workflows; admin/origin checks, allowlist, current-state conflicts, save verification and refused credentials.');

// Run the actual administrator controller: save feedback, failed-save rollback and sign-out clearing.
const vm=await import('node:vm');
class Element{constructor(){this.children=[];this.hidden=false;this.attrs={}}append(...nodes){this.children.push(...nodes)}replaceChildren(...nodes){this.children=nodes}setAttribute(k,v){this.attrs[k]=v}}
const elements=new Map(['sync-switches','sync-switches-refresh','sync-panel'].map(k=>[k,new Element()])),events={};let rejected=false,posts=0;
const account={user:{admin:true},request:async(url,options)=>{if(options?.method==='POST'){posts++;if(rejected)throw Error('State changed');return {saved:{enabled:false,state:'disabled_manually'}}}return {switches:[{id:'catalog.yml',label:'Catalogue sync',description:'Discovers repositories.',enabled:true,available:true,state:'active',url:'https://github.com/sparx1981/RepoShelf/actions/workflows/catalog.yml'}]}}};
const context={Date,RepoAccount:account,document:{getElementById:k=>elements.get(k),createElement:()=>new Element()},addEventListener:(k,f)=>events[k]=f};context.window=context;
vm.runInNewContext(await readFile(new URL('../dist/admin-sync-switches.js',import.meta.url),'utf8'),context);
const settle=async()=>{for(let i=0;i<5;i++)await new Promise(setImmediate)};await settle();
let wrap=elements.get('sync-switches').children[0],input=wrap.children[0].children[0];input.checked=false;await input.onchange();assert.equal(posts,1);assert.match(wrap.children[2].textContent,/Saved.*Disabled/);assert.equal(input.disabled,false);
rejected=true;input.checked=true;await input.onchange();assert.equal(input.checked,false);assert.match(wrap.children[2].textContent,/State changed/);
account.user=null;events['reposhelf-account']();assert.equal(elements.get('sync-switches').children.length,0);
