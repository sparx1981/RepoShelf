import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {trendshiftRepositories,githubTrendingRepositories,collectTrendshift,mergeTrendshift,derivedSignal,SIGNAL_WINDOW} from '../scripts/trendshift-sources.mjs';
import {createBrowseIndex} from '../lib/browse-index.mjs';
const require=createRequire(import.meta.url),S=require('../dist/storefront.js'),E=require('../dist/editorial.js'),B=require('../dist/browse.js');
const now=Date.parse('2026-10-11T12:00:00Z'),ago=ms=>new Date(now-ms).toISOString();
// Page parsing: GitHub links, JSON fields and Trendshift link text, in page order, without duplicates or site paths.
const html='<a href="/repositories/1">alpha/one</a> <a href="https://github.com/Beta/two">x</a> {"full_name":"gamma/three"} <a href="https://github.com/features/copilot">no</a> <a href="https://github.com/beta/TWO">again</a> <a href="https://github.com/delta/four.git">d</a>';
assert.deepEqual(trendshiftRepositories(html),['alpha/one','Beta/two','gamma/three','delta/four']);
assert.deepEqual(trendshiftRepositories(html,2),['alpha/one','Beta/two']);
assert.deepEqual(trendshiftRepositories('<p>nothing</p>'),[]);
assert.deepEqual(githubTrendingRepositories('<h2 class="h3"><a data-x="1" href="/o/r">o / r</a></h2><h2><a href="/sponsors/x">s</a></h2><h2 class="h3"><a href="/o/r">dup</a></h2><h2><a href="/p/q">p</a></h2>'),['o/r','p/q']);
// Collection: ranges that repeat the daily list or fail are reported, never mislabelled; a failed list does not stop the others.
const names=n=>Array.from({length:8},(_,i)=>`<a href="https://github.com/${n}/repo${i}">x</a>`).join('');
const pages={'https://trendshift.io/':names('daily'),'https://trendshift.io/?trending-range=7':names('daily'),'https://trendshift.io/?range=weekly':names('weekly'),'https://trendshift.io/?trending-range=30':null,'https://github.com/trending?since=daily':Array.from({length:6},(_,i)=>`<h2><a href="/gh/r${i}">x</a></h2>`).join('')};
const fetcher=async url=>{if(!(url in pages))return {ok:false,status:404,text:async()=>''};if(pages[url]===null)throw Object.assign(new Error('boom'),{name:'TimeoutError'});return {ok:true,status:200,text:async()=>pages[url]}};
const result=await collectTrendshift({fetcher,now});
assert.deepEqual(Object.keys(result.lists).sort(),['daily','githubDaily','weekly']);
assert.equal(result.lists.daily[0],'daily/repo0');assert.equal(result.lists.weekly[0],'weekly/repo0');assert.equal(result.sources.weekly.url,'https://trendshift.io/?range=weekly');
assert.equal(result.sources.monthly.status,'retry');assert.match(result.sources.monthly.reason,/timed out|HTTP 404/);assert.equal(result.sources.githubDaily.status,'ok');
const offline=await collectTrendshift({fetcher:async()=>{throw new Error('offline')},now});assert.deepEqual(offline.lists,{});assert(Object.values(offline.sources).every(s=>s.status==='retry'));
// Derived score: better positions and more lists give more; unknown lists and bad positions give nothing.
assert(derivedSignal({daily:1})>derivedSignal({daily:25}));assert(derivedSignal({daily:1,githubDaily:3})>derivedSignal({daily:1}));assert.equal(derivedSignal({daily:0,weekly:'1',other:1}),0);assert.equal(derivedSignal({}),0);
// Merge: fresh reads replace, unread entries survive until the three-day window ends, and only a score is stored (no positions or list names).
const merged=mergeTrendshift({'old/keep':{full:'old/keep',seenAt:ago(86400000),signal:.2},'old/gone':{full:'old/gone',seenAt:ago(SIGNAL_WINDOW+1000),signal:.5},'old/moved':{full:'Old/Moved',seenAt:ago(86400000),signal:.1},'old/legacy':{full:'old/legacy',seenAt:ago(1000),ranks:{daily:1}}},{daily:['Old/Moved','new/one']},now);
assert.deepEqual(Object.keys(merged).sort(),['new/one','old/keep','old/moved']);assert.deepEqual(Object.keys(merged['new/one']).sort(),['full','seenAt','signal']);assert.equal(merged['old/moved'].signal,derivedSignal({daily:1}));assert(merged['new/one'].signal<merged['old/moved'].signal);assert.equal(merged['old/keep'].signal,.2);assert.equal(merged['new/one'].seenAt,ago(0));
assert(!JSON.stringify(merged).match(/rank|daily|weekly|monthly/i));
// Ranking signal: better positions and more lists score higher, it fades, then expires; Spaces and unlisted repositories get none.
const repo=(full,positions,age=0,extra={})=>({full,name:full.split('/')[1],stars:100,forks:10,...extra,trendshift:positions&&{seenAt:ago(age),signal:derivedSignal(positions)}});
const top=repo('a/top',{daily:1}),low=repo('a/low',{daily:25}),both=repo('a/both',{daily:1,githubDaily:3}),old=repo('a/old',{daily:1},2*86400000),expired=repo('a/expired',{daily:1},SIGNAL_WINDOW+1000),bad={...repo('a/bad',{daily:1}),trendshift:{seenAt:ago(0),signal:-1}},plain=repo('a/plain',null),space={...repo('hf:a/space',{daily:1}),source:'huggingface'};
assert(S.trendshift(top,now).score>S.trendshift(low,now).score);assert(S.trendshift(both,now).score>S.trendshift(top,now).score);assert(S.trendshift(old,now).score<S.trendshift(top,now).score);
for(const r of [expired,bad,plain])assert.equal(S.trendshift(r,now),null);assert.equal(S.trendshiftBoost(plain,now),0);
assert.deepEqual(S.trendshiftRanked([low,plain,top,expired,space,both],now).map(r=>r.full),['a/both','a/top','a/low']);
// Trending now: the boost lifts a listed repository without history; measured growth still counts; unlisted ones without growth stay out.
const measured={...plain,full:'a/measured',trendSummary:{stars:50,forks:5,days:7,score:2},lastCheckedAt:ago(1000)};
assert.deepEqual(S.sorted([plain,top,measured,low],'trending',now).map(r=>r.full).sort(),['a/low','a/measured','a/top']);
assert.equal(S.sorted([plain,measured],'trending',now).length,1);assert.equal(S.sorted([measured,{...measured,full:'a/boosted',trendshift:{seenAt:ago(0),signal:derivedSignal({daily:1,weekly:1})}}],'trending',now)[0].full,'a/boosted');
const live=(full,positions)=>({...plain,full,trendshift:{seenAt:new Date().toISOString(),signal:derivedSignal(positions)}});assert.deepEqual(B.order([plain,live('a/top',{daily:1}),live('a/both',{daily:1,githubDaily:3})],'trendshift').map(r=>r.full),['a/both','a/top']);
// Ribbon: built-in, appended without disturbing existing identifiers, placed after Trending now, with a mode label.
const defaults=E.defaults(),ribbon=defaults.find(r=>r.builtin_key==='trendshift');
assert.equal(defaults.length,49);assert.equal(ribbon.mode,'trendshift');assert.equal(ribbon.id,'e0000000-0000-4000-8000-000000000049');assert.equal(E.modes.trendshift,'Trending on Trendshift');
assert.equal(defaults.find(r=>r.builtin_key==='reposhelf').id,'e0000000-0000-4000-8000-000000000014');
const order=E.resolve([]).map(r=>r.builtin_key);assert(order.indexOf('trendshift')===order.indexOf('trending')+1);
// Index: signals attach to catalogue repositories only, carry the derived score only, and change the index version.
const catalog={updatedAt:'2026-10-11T00:00:00Z',repositories:[{full:'a/listed',name:'listed',stars:5,forks:1,demo:'https://listed.example',availability:'available'},{full:'a/unlisted',name:'unlisted',stars:5,forks:1,demo:'https://u.example',availability:'available'}]};
const snapshot={updatedAt:'2026-10-11T01:00:00Z',entries:{'a/listed':{full:'a/listed',seenAt:ago(0),signal:.31,ranks:{daily:2},lists:['daily']},'a/missing':{full:'a/missing',seenAt:ago(0),signal:.5}}};
const withSignal=createBrowseIndex(catalog,{repositories:[]},{},now,[],snapshot),without=createBrowseIndex(catalog,{repositories:[]},{},now,[]);
const listed=withSignal.index.repositories.find(r=>r.full==='a/listed');assert.deepEqual(listed.trendshift,{seenAt:ago(0),signal:.31});assert.equal(withSignal.index.repositories.find(r=>r.full==='a/unlisted').trendshift,undefined);
assert(!withSignal.index.repositories.some(r=>r.full==='a/missing'));assert.notEqual(withSignal.index.version,without.index.version);assert.equal(withSignal.index.snapshots.trendshift,snapshot.updatedAt);
console.log('PASS: Trendshift and GitHub list parsing, partial-failure collection, merge/expiry, ranking boost, Trending now lift, ribbon default and index attachment.');
