import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createEditorialHandler} from '../api/editorial.mjs';
import {xRibbon,ensureXRibbon,sourceRibbonRows} from '../lib/editorial-source-ribbon.mjs';
import {invalidateStorefront} from '../lib/storefront-cache.mjs';
const E=createRequire(import.meta.url)('../dist/editorial.js');
const legacy=E.defaults().filter(r=>r.builtin_key!==E.xRibbonKey).map((r,i)=>({...r,position:i+1,revision:2}));
const resolved=E.resolve(legacy,false);assert.equal(resolved.length,48);assert.equal(resolved[1].builtin_key,E.xRibbonKey);assert(E.visible(resolved[1],true));assert(!E.visible({...resolved[1],enabled:false},false));
const disabled={...xRibbon,enabled:false,position:500};assert.equal(E.resolve([...legacy,disabled],false).find(r=>r.id===xRibbon.id).position,500);assert.equal(E.resolve([...legacy,disabled],false).find(r=>r.id===xRibbon.id).enabled,false);
assert.equal(E.resolve([],false).length,0);
let rows=structuredClone(legacy),inserts=0,reorders=0,admin=true,purges=0;
const accounts={config:{origin:'https://example.org'},ready:true,origin:()=>{},admin:async()=>{if(!admin)throw Object.assign(Error('Admin required'),{status:403,code:'forbidden'});return {token:'admin-test'}},request:async(path,options={})=>{
 assert.equal(options.token,'admin-test');
 if(path.startsWith('/rest/v1/editorial_ribbons?'))return path.includes('builtin_key=')?rows.filter(r=>r.builtin_key===E.xRibbonKey):structuredClone(rows);
 if(path==='/rest/v1/editorial_ribbons'&&options.method==='POST'){inserts++;rows.push(structuredClone(options.body));return null}
 if(path.endsWith('reposhelf_reorder_ribbons')){assert.equal(options.body.ordered_ids.length,rows.length);assert.deepEqual(new Set(options.body.ordered_ids),new Set(rows.map(r=>r.id)));reorders++;return null}
 if(path.endsWith('reposhelf_save_ribbon')){const row=rows.find(r=>r.id===options.body.row_id);if(row.revision!==options.body.expected_revision)throw Object.assign(Error('Changed'),{status:409,code:'edit_conflict'});row.revision++;row.enabled=options.body.row_enabled;return row}
 throw Error('Unexpected database request '+path);
}};
const savedEnv=process.env.VERCEL,contextSymbol=Symbol.for('@vercel/request-context'),previousContext=globalThis[contextSymbol];
process.env.VERCEL='1';globalThis[contextSymbol]={get:()=>({purge:{dangerouslyDeleteByTag:async()=>{purges++;throw Error('Cache unavailable')}}})};
const server=createServer(createEditorialHandler({accounts,browse:{}}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{const base='http://127.0.0.1:'+server.address().port;const post=body=>fetch(base+'/api/editorial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const ids=resolved.map(r=>r.id);[ids[1],ids[2]]=[ids[2],ids[1]];
 const response=await post({action:'reorder',ids});assert.equal(response.status,200);assert.deepEqual(await response.json(),{reordered:true});assert.equal(inserts,1);assert.equal(reorders,1);assert.equal(purges,1);
 assert.equal((await post({action:'reorder',ids})).status,200);assert.equal(inserts,1);
 assert.equal((await post({action:'reorder',ids:[ids[0],ids[0]]})).status,400);
 admin=false;assert.equal((await post({action:'reorder',ids})).status,403);assert.equal(reorders,2);
 admin=true;rows=structuredClone(legacy);assert.equal((await post({row:{...xRibbon,enabled:false}})).status,200);assert.equal(rows.find(r=>r.id===xRibbon.id).enabled,false);assert.equal((await post({row:{...xRibbon,enabled:true}})).status,409);assert.equal(rows.find(r=>r.id===xRibbon.id).enabled,false);
 let warnings=0;await invalidateStorefront({enabled:true,purge:async()=>{throw Error('Failure')},warn:()=>warnings++});assert.equal(warnings,1);
}finally{server.close();if(savedEnv===undefined)delete process.env.VERCEL;else process.env.VERCEL=savedEnv;if(previousContext===undefined)delete globalThis[contextSymbol];else globalThis[contextSymbol]=previousContext;}
// A simultaneous administrator insertion is recovered without duplicate rows.
let raceReads=0;const race={request:async(path,{method}={})=>{if(method==='POST')throw Error('Unique conflict');raceReads++;return raceReads===1?legacy:[{...xRibbon,revision:1}]}};
const raced=await ensureXRibbon(race,'admin-test');assert.equal(raced.created,false);assert.equal(raced.row.id,xRibbon.id);
const hidden=await sourceRibbonRows({request:async(path,options)=>{assert(options.service);assert(path.includes('select=id,enabled,position'));return [{id:xRibbon.id,enabled:false,position:42,items:['private-selection'],title:'Private title'}]}},legacy);
const publicHidden=E.resolve(hidden,false).find(r=>r.id===xRibbon.id);assert.equal(publicHidden.enabled,false);assert.deepEqual(publicHidden.items,[]);assert.equal(publicHidden.title,xRibbon.title);
const unavailable=await sourceRibbonRows({request:async()=>{throw Error('Unavailable')}},legacy);assert.equal(E.resolve(unavailable,false).find(r=>r.id===xRibbon.id).enabled,false);
console.log('PASS: missing X ribbon, custom/default visibility, preserved drafts/order, authenticated idempotent seeding, reorder after cache failure, duplicate validation and concurrent insertion.');
