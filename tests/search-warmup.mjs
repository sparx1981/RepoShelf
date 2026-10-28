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
// A new function instance spends seconds of CPU reading the browsing index, so a scheduled call keeps one loaded between visits.
// Vercel only allows sub-daily crons on paid plans; if the project returns to the Hobby plan this entry has to be removed first.
const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8')),keepWarm=(vercel.crons||[]).find(job=>job.path==='/api/editorial?action=warm');
assert(keepWarm,'vercel.json schedules the warm-up so instances are not left to go cold');
const [minute,...rest]=keepWarm.schedule.split(' '),every=/^\*\/(\d+)$/.exec(minute);assert(every&&Number(every[1])<=5&&rest.every(field=>field==='*'),'the warm-up runs at least every five minutes, all day');
console.log('PASS: search warm-up answers 204 with no caching, tolerates failures and missing support, accepts GET only, and is scheduled to keep an instance loaded.');
