import assert from 'node:assert/strict';
import {checkRepository,dueEntries,CHECK_INTERVAL_MS} from '../scripts/catalog-health.mjs';
const now=Date.parse('2026-10-03T12:00:00Z');const at=new Date(now).toISOString();
const prior={full:'owner/project',name:'project',demo:'https://app.pages.dev',availability:'available',lastCheckedAt:'2026-10-01T00:00:00Z',lastAvailableAt:'2026-10-01T00:00:00Z'};
const response=(status,data={},headers={})=>({status,ok:status>=200&&status<300,headers:new Headers(headers),json:async()=>data});
const check=(r,entry=prior)=>checkRepository(entry,{now,fetcher:async()=>r});
for(const status of [404,410]){const {entry}=await check(response(status));assert.equal(entry.availability,'unavailable');assert.equal(entry.unavailableReason,'not_found');assert.equal(entry.lastCheckedAt,at);assert.equal(entry.lastAvailableAt,prior.lastAvailableAt);assert.equal(entry.demo,prior.demo);assert.equal(entry.unavailableSince,at)}
console.log('PASS: inaccessible/deleted repositories become unavailable without losing saved data');
const privateResult=await check(response(200,{full_name:prior.full,private:true}));assert.equal(privateResult.entry.availability,'unavailable');assert.equal(privateResult.entry.unavailableReason,'not_public');
for(const status of [403,429,500,502,503,401]){const result=await check(response(status));assert.equal(result.entry.availability,'available');assert.equal(result.entry.demo,prior.demo);assert.equal(result.entry.lastCheckedAt,prior.lastCheckedAt);assert.equal(result.entry.lastAttemptAt,at);assert(result.entry.nextCheckAt)}
const limited=await check(response(403,{message:'API rate limit exceeded'},{'x-ratelimit-remaining':'0','retry-after':'60'}));assert(limited.stop);assert.equal(limited.entry.checkError.kind,'rate_limit');
const secondary=await check(response(403,{message:'secondary rate limit'}));assert(secondary.stop);
const timeout=await checkRepository(prior,{now,fetcher:async()=>{throw Error('timeout')}});assert.equal(timeout.entry.availability,'available');assert.equal(timeout.entry.checkError.kind,'temporary');
console.log('PASS: rate limits, access errors, authentication failures, server errors, and timeouts preserve entries for retry');
const unavailable={...(await check(response(404))).entry};const restored=await check(response(200,{full_name:prior.full,private:false,visibility:'public'}),unavailable);assert.equal(restored.entry.availability,'available');assert.equal(restored.entry.lastAvailableAt,at);assert(!restored.entry.unavailableSince);assert(!restored.entry.checkError);
const uncertain=await check(response(503),unavailable);assert.equal(uncertain.entry.availability,'unavailable');
console.log('PASS: confirmed public repositories are restored; temporary failures do not unhide an unavailable entry');
const fresh={...prior,lastCheckedAt:at,lastAttemptAt:at};const retry={...prior,checkError:{kind:'temporary'},nextCheckAt:new Date(now+1000).toISOString()};assert.equal(dueEntries([fresh,retry],now).length,0);assert.equal(dueEntries([prior,{full:'older/project'}],now,1)[0].full,'older/project');assert.equal(dueEntries([fresh],now+CHECK_INTERVAL_MS).length,1);
console.log('PASS: bounded oldest-first daily revalidation respects retry dates');
