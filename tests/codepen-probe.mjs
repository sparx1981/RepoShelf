import assert from 'node:assert/strict';
import {robotsRules,robotsAllows,penLinks,pageShape,framingPolicy,probeCodepen,PAGES} from '../scripts/codepen-probe.mjs';
// robots.txt: own agent beats "*", longest rule wins, Allow beats Disallow on a tie, wildcards and end anchors work.
const robots='User-agent: *\nDisallow: /api/\nDisallow: /*/pen/private\nAllow: /api/public\nDisallow: /secret$\n\nUser-agent: BadBot\nDisallow: /\n';
const rules=robotsRules(robots);
assert.equal(robotsAllows(rules,'/picks/pens'),true);assert.equal(robotsAllows(rules,'/api/x'),false);assert.equal(robotsAllows(rules,'/api/public/x'),true);assert.equal(robotsAllows(rules,'/a/pen/private1'),false);assert.equal(robotsAllows(rules,'/secret'),false);assert.equal(robotsAllows(rules,'/secret/more'),true);
assert.equal(robotsAllows(robotsRules('User-agent: RepoShelf-catalog\nDisallow: /\nUser-agent: *\nAllow: /'),'/popular'),false);assert.equal(robotsAllows([],'/anything'),true);
// Links: pen, full, details and embed forms, absolute and relative, site paths and duplicates ignored, order kept.
const html='<a href="/alice/pen/AbCd12">a</a> <a href="https://codepen.io/bob/full/xYz789">b</a> <a href="//codepen.io/carol/details/QwErTy">c</a> <iframe src="/dave/embed/ZxCvBn?x=1"></iframe> <a href="/alice/pen/AbCd12">dup</a> <a href="/trending/pen/abcd1234">site</a>';
assert.deepEqual(penLinks(html).map(p=>p.user+'/'+p.slug),['alice/AbCd12','bob/xYz789','carol/QwErTy','dave/ZxCvBn']);assert.deepEqual(penLinks('<p>none</p>'),[]);
assert.equal(pageShape('<title>Just a moment...</title><div>cf-chl</div>').challenge,true);assert.equal(pageShape(html+'<title>Popular</title>').penLinks,4);
assert.equal(framingPolicy({'x-frame-options':'DENY'}).framingBlocked,true);assert.equal(framingPolicy({}).framingBlocked,false);assert.equal(framingPolicy({'content-security-policy':"frame-ancestors 'none'"}).framingBlocked,true);assert.equal(framingPolicy({'content-security-policy':"frame-ancestors 'self' https://reposhelf.app"}).framingBlocked,false);
// Probe: respects robots, reports without throwing, stops on blocking, never requests a disallowed path.
const requested=[];const make=pages=>async url=>{requested.push(url);const path=new URL(url).pathname;if(path==='/robots.txt')return {status:200,headers:new Headers(),text:async()=>'User-agent: *\nDisallow: /trending'};if(path in pages)return {status:pages[path].status??200,headers:new Headers(pages[path].headers||{}),text:async()=>pages[path].body||'',url};return {status:404,headers:new Headers(),text:async()=>''}};
const report=await probeCodepen({fetcher:make({'/picks/pens':{body:html},'/popular/pens':{body:'<p>x</p>'},'/alice/pen/AbCd12':{body:'<title>Todo app by Alice</title> MIT License'},'/alice/full/AbCd12':{headers:{'x-frame-options':'SAMEORIGIN'}}}),pause:async()=>{},now:Date.parse('2026-10-11T00:00:00Z')});
assert.equal(report.robots.rules,1);assert.equal(report.pages.find(p=>p.url.endsWith('/trending')).allowed,false);assert(!requested.some(u=>new URL(u).pathname==='/trending'||new URL(u).pathname.startsWith('/trending/')));assert.equal(report.distinctPens,4);
const alice=report.sample.find(s=>s.pen==='alice/AbCd12');assert.equal(alice.looksLikeApp,true);assert.equal(alice.mentionsMit,true);assert.equal(alice.fullPage.framingBlocked,true);assert.deepEqual(report.appLike,{checked:1,matching:1});
const blocked=await probeCodepen({fetcher:async url=>new URL(url).pathname==='/robots.txt'?{status:403,headers:new Headers(),text:async()=>''}:assert.fail('requested after robots refusal'),pause:async()=>{}});assert.match(blocked.stopped,/403/);
const offline=await probeCodepen({fetcher:async()=>{throw new Error('offline')},pause:async()=>{}});assert.match(offline.stopped,/robots\.txt could not be read/);assert.equal(offline.pages.length,0);
const limited=await probeCodepen({fetcher:make({'/picks/pens':{status:429,body:''}}),pause:async()=>{}});assert.match(limited.stopped,/429/);assert.equal(PAGES.length,4);
console.log('PASS: CodePen probe honours robots.txt, finds Pen links in every URL form, reports framing and licence signals, and stops on refusal or errors.');
