import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createEditorialHandler} from '../api/editorial.mjs';
// GET /api/editorial?action=warm prepares search candidate lookup ahead of a person's first query. It answers 204, is never cached, and cannot fail the page.
let warmed=0,fail=false;
const browse={warm:async()=>{warmed++;if(fail)throw Error('Catalogue unavailable')}},accounts={config:{origin:'https://example.org'},ready:false,origin(){}};
const server=createServer(createEditorialHandler({accounts,browse,checkpoint:{json:async()=>null}}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{const base='http://127.0.0.1:'+server.address().port;
 let response=await fetch(base+'/api/editorial?action=warm');assert.equal(response.status,204);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(warmed,1);
 fail=true;response=await fetch(base+'/api/editorial?action=warm');assert.equal(response.status,204,'a failed warm-up is not an error for the visitor');assert.equal(warmed,2);
 response=await fetch(base+'/api/editorial?action=warm',{method:'POST',headers:{Origin:'https://example.org'}});assert.notEqual(response.status,204,'only GET may warm');
}finally{server.close()}
const quiet=createServer(createEditorialHandler({accounts,browse:{},checkpoint:{json:async()=>null}}));await new Promise(resolve=>quiet.listen(0,'127.0.0.1',resolve));
try{assert.equal((await fetch('http://127.0.0.1:'+quiet.address().port+'/api/editorial?action=warm')).status,204,'a service without warm-up still answers')}finally{quiet.close()}
// The warm-up endpoint stays available for manual use, but is NOT scheduled. A cron every four minutes paid the cold-start CPU cost
// (reading the browse index) on a timer, and on the Hobby plan that exhausted the 4-hour Fluid Active CPU allowance (Nov 2026).
const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
assert(!(vercel.crons||[]).some(job=>job.path.startsWith('/api/editorial?action=warm')),'vercel.json must not schedule the warm-up: it burns Active CPU on the Hobby plan');
assert(!(vercel.crons||[]).some(job=>!/^\S+ \S+ \* \* \*$/.test(job.schedule)||/^[*]\/\d+ /.test(job.schedule)||/^\* /.test(job.schedule)||/^\S+ [*]/.test(job.schedule)),'no sub-daily crons on the Hobby plan');
console.log('PASS: search warm-up answers 204 with no caching, tolerates failures and missing support, accepts GET only, and is deliberately not scheduled.');
