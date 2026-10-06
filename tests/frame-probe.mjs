import assert from 'node:assert/strict';import {classifyFraming,probeDemo,summarize,hostGroup,markdown} from '../scripts/frame-probe.mjs';
const h=obj=>new Headers(obj);
// header rules
assert.deepEqual(classifyFraming(h({})),{embeddable:true,reason:'no_restrictions'});
assert.equal(classifyFraming(h({'x-frame-options':'DENY'})).embeddable,false);assert.equal(classifyFraming(h({'x-frame-options':'SAMEORIGIN'})).reason,'x_frame_options_sameorigin');
assert.equal(classifyFraming(h({'x-frame-options':'ALLOW-FROM https://www.reposhelf.co.uk'})).embeddable,false,'ALLOW-FROM is obsolete and treated as blocked');
assert.equal(classifyFraming(h({'content-security-policy':"default-src 'self'; frame-ancestors 'none'"})).reason,'frame_ancestors_none');
assert.equal(classifyFraming(h({'content-security-policy':"frame-ancestors 'self'"})).reason,'frame_ancestors_self');
assert.equal(classifyFraming(h({'content-security-policy':"frame-ancestors https://example.org"})).reason,'frame_ancestors_other');
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors *'})).embeddable,true);assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors https:'})).embeddable,true);
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors https://www.reposhelf.co.uk'})).embeddable,true,'Our own origin is allowed');assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors *.reposhelf.co.uk'})).embeddable,true,'Wildcard subdomains match');
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors https://reposhelf.vercel.app'})).embeddable,false,'Allowing only the Vercel address does not allow the canonical site');
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors https://reposhelf.co.uk'})).embeddable,false,'Allowing only the bare domain does not allow www');
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors http:'})).embeddable,false,'A bare http: source is not accepted as evidence for an https page');
assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors https://*.reposhelf.co.uk'})).embeddable,true);assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors *.reposhelf.co.uk'})).embeddable,true);assert.equal(classifyFraming(h({'content-security-policy':'frame-ancestors *.co.uk'})).embeddable,true,'A parent wildcard covers www.reposhelf.co.uk');
assert.equal(classifyFraming(h({'content-security-policy':"frame-ancestors *",'x-frame-options':'DENY'})).embeddable,true,'frame-ancestors takes precedence over X-Frame-Options');
assert.equal(classifyFraming(h({'content-security-policy':"frame-ancestors *, frame-ancestors 'none'"})).embeddable,false,'Any restrictive policy blocks framing');
assert.equal(classifyFraming({'x-frame-options':'deny'}).embeddable,false,'Plain header objects work');
assert.equal(classifyFraming(h({'content-security-policy-report-only':"frame-ancestors 'none'"})).embeddable,true,'Report-only policies do not block');
// probing: redirects are followed hop by hop and every hop must be a public address
const responses={'https://a.example/':{status:302,headers:{location:'/next'}},'https://a.example/next':{status:200,headers:{'x-frame-options':'DENY'}},'https://ok.example/':{status:200,headers:{}},'https://gone.example/':{status:404,headers:{}},'https://loop.example/':{status:302,headers:{location:'https://loop.example/'}},'https://evil.example/':{status:302,headers:{location:'http://10.0.0.5/admin'}}};
const seen=[],fetcher=async(url,opts)=>{seen.push([url,opts.redirect]);const r=responses[url];if(!r)throw Object.assign(new Error('offline'),{name:'TypeError'});return new Response(null,{status:r.status===200?200:r.status,headers:r.headers})};
const guard=async url=>!/10\.0\.0\.5|localhost/.test(url);
assert.deepEqual((await probeDemo('https://a.example/',{fetcher,guard})).reason,'x_frame_options_deny');assert(seen.every(([,mode])=>mode==='manual'),'Redirects are never followed automatically');
assert.equal((await probeDemo('https://ok.example/',{fetcher,guard})).embeddable,true);
assert.equal((await probeDemo('https://gone.example/',{fetcher,guard})).reason,'http_404');assert.equal((await probeDemo('https://loop.example/',{fetcher,guard})).reason,'too_many_redirects');
assert.equal((await probeDemo('https://evil.example/',{fetcher,guard})).reason,'unsafe_target','A redirect to a private address is refused');assert.equal((await probeDemo('https://down.example/',{fetcher,guard})).reason,'network_error');
// summary
const sum=summarize([{url:'https://a.github.io/x',embeddable:true,reason:'no_restrictions'},{url:'https://b.github.io/y',embeddable:true,reason:'no_restrictions'},{url:'https://c.vercel.app/',embeddable:false,reason:'x_frame_options_deny'},{url:'https://d.example',embeddable:null,reason:'timeout'}]);
assert.equal(sum.measured,3);assert.equal(sum.embeddable,2);assert.equal(sum.unreachable,1);assert.equal(sum.embeddablePercent,66.7);assert.equal(sum.topHosts[0].host,'github.io');assert.equal(hostGroup('https://x.co.uk/a'),'x.co.uk');assert.match(markdown(sum),/66\.7% of 3 reachable demos/);
console.log('PASS: framing verdicts follow frame-ancestors and X-Frame-Options, redirects stay public, and summaries group by host.');
