import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),E=require('../dist/editorial.js'),B=require('../dist/browse.js'),Q=require('../dist/quality.js');
const day=86400000,now=Date.parse('2026-10-07T12:00:00Z'),ago=days=>new Date(now-days*day).toISOString();
const hex=i=>String(i).padStart(24,'0');
// A listing that passes every check, with room to age individual pieces of evidence.
const repo=(i,over={})=>{const demo='https://demo'+i+'.example.org';return {full:'team/p'+String(i).padStart(2,'0'),name:'Project '+i,description:'A visual planning tool.',category:'Design',technologies:['React'],topics:[],demo,availability:'available',stars:1000-i,forks:0,lastCheckedAt:ago(0.5),demoHealth:{url:demo,status:'working',checkedAt:ago(1)},screenshots:[{kind:'demo',src:'/previews/'+hex(i)+'.jpg',url:demo}],...over}};
const ids=rows=>rows.map(r=>r.full);

// ---- why a listing cannot be featured
assert.deepEqual(Q.featuredIssues(repo(1),now),[],'a healthy listing can be featured');
assert.deepEqual(Q.featuredIssues(undefined,now),['not_in_catalogue']);
assert.deepEqual(Q.featuredIssues(repo(1,{listingControl:'hidden'}),now),['hidden']);
assert(Q.featuredIssues(repo(1,{availability:'unavailable'}),now).includes('unavailable'));
assert.deepEqual(Q.featuredIssues(repo(1,{screenshots:[]}),now),['no_screenshot']);
assert.deepEqual(Q.featuredIssues(repo(1,{demoHealth:{url:'https://demo1.example.org',status:'review',checkedAt:ago(1)}}),now),['demo_not_working']);
const stale=repo(1,{lastCheckedAt:ago(5),demoHealth:{url:'https://demo1.example.org',status:'working',checkedAt:ago(10)}});
assert.deepEqual(Q.featuredIssues(stale,now),['repository_check_old','demo_check_old'],'strict: old checks hide a listing from automatic fill-ins');
assert.deepEqual(Q.featuredIssues(stale,now,{lenient:true}),[],'lenient: old checks alone never hide a hand-picked listing');
assert.deepEqual(Q.featuredIssues(repo(1,{demoHealth:{url:'https://demo1.example.org',status:'working',checkedAt:ago(1),error:'timeout'}}),now,{lenient:true}),[],'a failed latest check does not hide a pick');
assert.deepEqual(Q.featuredIssues(repo(1,{demoHealth:{url:'https://demo1.example.org',status:'working',checkedAt:ago(1),error:'timeout'}}),now),['demo_check_failed']);
assert.deepEqual(Q.featuredIssues(repo(1,{lastCheckedAt:ago(61)}),now,{lenient:true}),['repository_check_old'],'evidence older than 60 days hides even a pick');
assert.deepEqual(Q.featuredIssues(repo(1,{screenshots:[]}),now,{lenient:true}),['no_screenshot'],'a real problem still hides a pick');
assert.equal(Q.featuredEligible(repo(1),now),true);assert.equal(Q.featuredEligible(stale,now),false);assert.equal(Q.featuredEligible(stale,now,{lenient:true}),true);
assert(Object.keys(Q.issueText).length>=10&&Q.featuredIssues(stale,now).every(x=>Q.issueText[x]),'every reason has plain wording');

// ---- the shuffle helper
const list=Array.from({length:30},(_,i)=>repo(i));
const row={id:'row-a',mode:'popular',shuffle:'off'};
assert.deepEqual(E.arrange(list,row),list,'no shuffle keeps the ranking');
assert.deepEqual(E.arrange(list,{...row,shuffle:undefined}),list,'a row without the setting is unshuffled');
assert.deepEqual(E.arrange(list,{...row,mode:'random',shuffle:'load'}),list,'older shuffled sources are left alone');
const topTwelve=ids(list.slice(0,12));
const a=E.arrange(list,{...row,shuffle:'load'},{seed:'a',limit:12}),b=E.arrange(list,{...row,shuffle:'load'},{seed:'b',limit:12});
assert.deepEqual(ids(a).sort(),[...topTwelve].sort(),'a ranked row shuffles its own top listings and no others');
assert.notDeepEqual(ids(a),ids(b),'a different page load gives a different order');
assert.deepEqual(ids(E.arrange(list,{...row,shuffle:'load'},{seed:'a',limit:12})),ids(a),'the same page load is stable');
const d1=E.arrange(list,{...row,shuffle:'daily'},{seed:'a',limit:12,now}),d2=E.arrange(list,{...row,shuffle:'daily'},{seed:'zzz',limit:12,now}),d3=E.arrange(list,{...row,shuffle:'daily'},{limit:12,now:now+day});
assert.deepEqual(ids(d1),ids(d2),'a daily shuffle ignores the page load');assert.notDeepEqual(ids(d1),ids(d3),'a daily shuffle changes with the UTC day');assert.deepEqual(ids(d3).sort(),[...topTwelve].sort());
assert.equal(E.arrange(list,{...row,shuffle:'load'},{seed:'a',manual:true}).length,30,'hand-picked rows shuffle every pick');

// ---- the storefront
const repositories=Array.from({length:40},(_,i)=>repo(i));
const popular={id:'e-pop',builtin_key:'trending-test',title:'Popular',mode:'popular',category:'',items:[],enabled:true,shuffle:'off',position:1,revision:0};
const select=(rows,seed='s',extra={})=>B.select(repositories,{storefront:true,demos:false,seed,evidenceAt:new Date(now).toISOString(),...extra},{rows,customRows:true,builtinSetupRequired:false});
const plain=select([popular]).shelves[popular.id];
assert.equal(plain.length,12);assert.deepEqual(plain,ids(repositories.slice(0,12)),'unshuffled: best first');
const shuffledA=select([{...popular,shuffle:'load'}],'a').shelves[popular.id],shuffledB=select([{...popular,shuffle:'load'}],'b').shelves[popular.id];
assert.deepEqual([...shuffledA].sort(),[...plain].sort(),'shuffled rows show the same top listings');assert.notDeepEqual(shuffledA,shuffledB);
assert.deepEqual(select([{...popular,shuffle:'load'}],'a').shelves[popular.id],shuffledA,'stable for one page load');

// spotlight: a missed check never removes a pick; real problems do, and chosen places are refilled
const picks=repositories.slice(20,25).map(r=>r.full),hero={id:'e-hero',builtin_key:'hero',title:'In the spotlight',mode:'manual',category:'',items:picks,enabled:true,shuffle:'off',position:0,revision:0};
repositories[21]=repo(21,{lastCheckedAt:ago(9),demoHealth:{url:'https://demo21.example.org',status:'working',checkedAt:ago(20)}});
repositories[22]=repo(22,{screenshots:[]});
repositories[23]=repo(23,{listingControl:'hidden'});
const spotlight=select([hero]).shelves[hero.id];
assert(spotlight.includes('team/p21'),'a pick with old checks stays in the spotlight');
assert(!spotlight.includes('team/p22')&&!spotlight.includes('team/p23'),'picks with a real problem are hidden');
assert.equal(spotlight.length,5,'the two hidden picks are replaced, up to the five chosen');
assert.deepEqual(spotlight.slice(0,3),['team/p20','team/p21','team/p24'],'the remaining picks keep their chosen order, before any fill-ins');
assert(spotlight.slice(3).every(id=>!picks.includes(id)),'fill-ins are other listings');
assert(spotlight.slice(3).every(id=>Q.featuredEligible(repositories.find(r=>r.full===id),now)),'fill-ins pass the strict check');
const one=select([{...hero,items:['team/p20']}]).shelves[hero.id];assert.deepEqual(one,['team/p20'],'choosing one listing never adds more');
const none=select([{...hero,items:['team/p22']}]).shelves[hero.id];assert.equal(none.length,1,'one chosen listing that drops out is replaced by one, not by five');
const shuffledHero=select([{...hero,shuffle:'load'}],'q').shelves[hero.id];assert(shuffledHero.slice(0,3).every(id=>['team/p20','team/p21','team/p24'].includes(id)),'with shuffle on, picks still come before fill-ins');
// Editor's picks never fill in
const editors={...hero,id:'e-picks',builtin_key:'picks'};assert.deepEqual(select([editors]).shelves[editors.id].sort(),['team/p20','team/p21','team/p24'],"Editor's picks only ever show the picks that qualify");
// strict rules still apply to automatic rows' own pool
const community={...popular,id:'e-new',mode:'newest'};repositories[0]=repo(0,{lastCheckedAt:ago(9)});
assert.doesNotThrow(()=>select([community]));
console.log('PASS: spotlight picks survive missed checks but not real problems, hidden picks are refilled without exceeding what was chosen, and shuffle reorders only a row\'s own top listings (stable per page load, daily per UTC day).');
