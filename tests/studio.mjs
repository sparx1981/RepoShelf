import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {recipe,random,svg,css,ramp,contrast,ascii,asciiSVG} from '../dist/studio/core.mjs';
import {dimensions} from '../dist/studio/ascii.mjs';
import {createAccounts,authReturn} from '../lib/accounts.mjs';
import {createPromptsHandler} from '../api/prompts.mjs';
import {createCollectionHandler} from '../api/collection.mjs';
const index=JSON.parse(await readFile(new URL('../dist/studio/index.json',import.meta.url),'utf8'));
assert.equal(index.length,100);assert.equal(new Set(index.map(i=>i.id)).size,100);
assert.equal(new Set(index.map(i=>JSON.stringify(i.recipe))).size,100);
const thumbs=await readdir(new URL('../dist/studio/thumbs/',import.meta.url));const {liveItems}=await import('../dist/studio/live-shaders.mjs');assert.equal(thumbs.length,100+liveItems.length);for(const item of liveItems)assert.ok(thumbs.includes(item.id+'.webp'),'Live thumbnail exists: '+item.id);
for(const item of index){assert.match(item.id,/^[a-z0-9-]{1,80}$/);assert.ok(item.title&&item.category&&item.recipe);assert.ok((await stat(new URL(`../dist/studio/thumbs/${item.id}.webp`,import.meta.url))).size<20000);const source=svg(item.recipe);assert.ok(!source.includes('NaN'));assert.ok(source.startsWith('<svg'))}
const a=random(123),b=random(123);for(let i=0;i<20;i++)assert.equal(a(),b());
assert.ok(!svg(recipe({stops:['bad',Infinity]})).includes('NaN'));
assert.ok(!svg(recipe({colors:['javascript:alert(1)']})).includes('javascript'));
assert.match(css({type:'linear',grain:0,colors:['#000000','#ffffff']}),/linear-gradient/);
assert.match(css({animate:true}),/prefers-reduced-motion/);
const crossed=recipe({colors:['#ff0000','#0000ff'],stops:[80,20]});assert.deepEqual(crossed.colors,['#0000ff','#ff0000']);assert.deepEqual(crossed.stops,[20,80]);
const radial=recipe({type:'radial',grain:0,points:[{x:.1,y:.2},{x:.4,y:.8},{x:.8,y:.2}]});assert.ok(css(radial).includes(encodeURIComponent(svg(radial))),'radial CSS uses the exact preview renderer');
assert.equal(contrast('#000000','#ffffff'),21);
for(const color of ['#709f48','#ff0000','#3578ff','#f0d040','#000000','#ffffff']){const rows=ramp(color);assert.equal(rows.length,11);assert.equal(rows[5].color,color);for(let i=1;i<11;i++)assert.ok(rows[i].lightness<=rows[i-1].lightness+.004,'lightness decreases '+color);for(const row of rows)assert.ok(Math.max(row.white,row.black)>=4.5)}
const pixels=new Uint8ClampedArray([0,0,0,255,255,255,255,255]);assert.equal(ascii(pixels,2,1,{characters:' .#'}),' #');assert.equal(ascii(pixels,2,1,{characters:' .#',invert:true}),'# ');
assert.match(asciiSVG('<script>&'),/&lt;script&gt;&amp;/);
const header=new ArrayBuffer(24),v=new DataView(header);new Uint8Array(header).set([137,80,78,71]);v.setUint32(16,20000);v.setUint32(20,20000);assert.deepEqual(dimensions(header),[20000,20000]);assert.throws(()=>dimensions(new ArrayBuffer(10)));
assert.equal(authReturn('/studio.html'),'/studio.html');assert.equal(authReturn('https://evil.test/studio.html'),'/');
const config={url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'server-test-secret',origin:'https://reposhelf.test'},calls=[];
let accepted=false;
const accounts=createAccounts({config,legal:{active:true,acceptance:true,version:'studio-test'},fetcher:async(url,opts)=>{const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ',''),body=opts.body?JSON.parse(opts.body):null;calls.push({path:u.pathname,body,token});const json=(d,status=200)=>new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json'}});if(u.pathname==='/auth/v1/user')return token==='member'?json({id:'00000000-0000-0000-0000-000000000002',identities:[],user_metadata:{}}):json({},401);if(u.pathname==='/rest/v1/legal_acceptances')return json(accepted?[{accepted_at:'2026-10-13'}]:[]);if(u.pathname.endsWith('reposhelf_save_bookmark')||u.pathname.endsWith('reposhelf_set_like'))return new Response(null,{status:204});return json({},404)}});
const handler=createPromptsHandler({accounts}),collection=createCollectionHandler({accounts,catalog:{project:async()=>{throw Object.assign(Error('not found'),{status:404})}}});
async function run(handler,url,{token,method='GET',body}={}){const req={url,method,body,headers:{origin:config.origin,...token?{cookie:'__Host-reposhelf-access='+token}:{}}},res={headers:{},getHeader(){},setHeader(){},writeHead(s,h){this.status=s;this.headers=h},end(b){this.text=String(b||'');this.data=JSON.parse(this.text)}};await handler(req,res);return res}
for(const area of ['studio-access','studio-background']){let r=await run(handler,`/api/prompts?area=${area}&id=${index[0].id}`);assert.equal(r.status,401);r=await run(handler,`/api/prompts?area=${area}&id=${index[0].id}`,{token:'member'});assert.equal(r.status,428,'current legal acceptance is required')}
accepted=true;let r=await run(handler,'/api/prompts?area=studio-background&id='+index[0].id,{token:'member'});assert.equal(r.status,200);assert.ok(r.data.svg&&r.data.css&&r.data.react&&r.data.tailwind);assert.equal(r.headers['Cache-Control'],'private, no-store');assert.equal((await run(handler,'/api/prompts?area=studio-background&id=../../bad',{token:'member'})).status,400);assert.equal((await run(handler,'/api/prompts?area=studio-background&id=missing-one',{token:'member'})).status,404);
r=await run(collection,'/api/collection',{token:'member',method:'PUT',body:{id:'ss:bg/'+index[0].id,repo:{name:'forged'}}});assert.equal(r.status,200);const saved=calls.find(c=>c.path.endsWith('reposhelf_save_bookmark'));assert.equal(saved.body.snapshot.name,index[0].title);assert.equal(saved.token,'member');assert.ok(!JSON.stringify(saved.body).includes('forged'));
assert.equal((await run(collection,'/api/collection',{token:'member',method:'PUT',body:{id:'ss:bg/does-not-exist'}})).status,404);
console.log('PASS: 100 original backgrounds, bounded previews, colour and ASCII maths, signed-in exports, current legal acceptance, safe collection snapshots and auth return.');
