import assert from 'node:assert/strict';
import {checkRepository,dueEntries,repositoryCheckPlan,CHECK_INTERVAL_MS,REPOSITORY_CHECK_CAP,RUNS_PER_DAY} from '../scripts/catalog-health.mjs';
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
const catalogue=Array.from({length:74000},(_,i)=>({full:'o/r'+i}));
const roomy=repositoryCheckPlan(catalogue,{remaining:4931,authenticated:true});assert.equal(roomy.limit,REPOSITORY_CHECK_CAP,'a run refreshes up to the cap when GitHub has room');assert(roomy.limit>750,'more than the old 750 a run');assert.equal(roomy.checksPerDay,roomy.limit*RUNS_PER_DAY);
assert.equal(repositoryCheckPlan(catalogue,{remaining:900,authenticated:true}).limit,700,'the allowance, less the reserve, still limits a run');
assert.equal(repositoryCheckPlan(catalogue,{remaining:100,authenticated:true}).limit,0,'nothing is checked when GitHub has only the reserve left');
assert.equal(repositoryCheckPlan(catalogue,{remaining:4931,authenticated:true,batch:'300'}).limit,300,'an explicit batch is honoured');
assert.equal(roomy.dailyCapacitySufficient,roomy.limit*RUNS_PER_DAY>=catalogue.length/2,'capacity is judged against the 48-hour interval');
console.log('PASS: the repository refresh plan uses GitHub\'s allowance up to a cap and keeps its reserve');
{// Spare allowance re-checks the oldest repositories early, so a catalogue checked all at once does not fall due (and expire) all at once.
const {revalidationQueue,EARLY_CHECK_AGE_MS,CHECK_INTERVAL_MS:interval}=await import('../scripts/catalog-health.mjs');const now=Date.parse('2026-11-23T03:17:00Z'),day=86400000;
const row=(name,ageDays,extra={})=>({full:'team/'+name,availability:'available',lastCheckedAt:new Date(now-ageDays*day).toISOString(),...extra});
const rows=[row('fresh',2),row('week',8),row('older',20),row('due',interval/day+1),row('gone',25,{availability:'unavailable'}),row('waiting',20,{nextCheckAt:new Date(now+day).toISOString()})];
assert.deepEqual(revalidationQueue(rows,now,10).map(r=>r.full),['team/due','team/older','team/week'],'due first, then the oldest checked at least a week ago');
assert.deepEqual(revalidationQueue(rows,now,1).map(r=>r.full),['team/due'],'early checks never displace due ones');
assert.equal(EARLY_CHECK_AGE_MS,7*day);}
{// Browser shard results are matched by name through a Map: a linear search over the whole catalogue took 20-25 minutes per shard.
const {browserPatch,applyBrowserPatches}=await import('../scripts/browser-shards.mjs');const n=60000;
const before=Array.from({length:n},(_,i)=>({full:'Team'+i+'/App',demo:'https://d'+i+'.example',demoHealth:{status:'working'}})),after=before.map((r,i)=>i%3?r:{...r,full:r.full.toLowerCase(),demoHealth:{status:'unavailable'}});
const started=Date.now(),patches=browserPatch(before,after),stats=applyBrowserPatches(before.map(r=>({...r})),patches);
assert.equal(patches.length,n/3);assert.deepEqual(stats,{applied:n/3,conflicts:0},'names still match case-insensitively');assert(Date.now()-started<5000,'patching a catalogue-sized shard takes seconds, not minutes');}
console.log('PASS: spare repository allowance re-checks the oldest early, and browser patches match listings in linear time');
