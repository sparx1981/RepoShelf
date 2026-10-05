import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createBrowseIndex} from '../lib/browse-index.mjs';
import {qualityPlan} from '../scripts/catalog-priority.mjs';
const Q=createRequire(import.meta.url)('../dist/quality.js'),now=Date.now(),at=new Date(now).toISOString(),demo='https://example.com';
const good={full:'team/good',name:'Good',demo,availability:'available',lastCheckedAt:at,demoHealth:{url:demo,status:'working',checkedAt:at},screenshots:[{src:'previews/012345678901234567890123.jpg',kind:'demo',url:demo}]};
assert(Q.publishedEligible(good,now));assert.equal(Q.catalogueState(good,now),'published');
assert(!Q.publishedEligible({...good,screenshots:[]},now));
assert(!Q.publishedEligible({...good,screenshots:[{...good.screenshots[0],url:'https://old.example'}]},now));
assert(!Q.publishedEligible({...good,demoHealth:{...good.demoHealth,status:'review'}},now));
assert(!Q.publishedEligible({...good,lastCheckedAt:new Date(now-3*86400000).toISOString()},now));
assert(!Q.publishedEligible({...good,demoHealth:{...good.demoHealth,checkedAt:new Date(now-8*86400000).toISOString()}},now));
const temporary={...good,demoHealth:{...good.demoHealth,error:{reason:'rate_limit'},consecutiveTemporaryFailures:3}};
assert(Q.publishedEligible(temporary,now),'Temporary errors preserve recent successful evidence');
const pending={...good,full:'team/pending',screenshots:[]},quarantine={...pending,full:'team/repair',previewCheck:{url:demo,status:'retry',consecutiveFailures:3}};
assert.equal(Q.catalogueState(pending,now),'pending');assert.equal(Q.catalogueState(quarantine,now),'quarantined');assert.equal(Q.catalogueState({...good,availability:'unavailable'},now),'unavailable');
const plan=qualityPlan([good,pending,quarantine],now);assert.equal(plan.ready,true);assert.equal(plan.githubBatch,150);assert.equal(plan.publication.published,1);assert.equal(plan.publication.quarantined,1);assert.equal(plan.workingDemos,3);
const generated=createBrowseIndex({repositories:[good,pending,quarantine]},{repositories:[]},{},now);assert(generated.projects.some(r=>r.full===pending.full),'Pending records remain stored');assert.equal(generated.index.repositories.find(r=>r.full===quarantine.full).catalogueState,'quarantined');
console.log('PASS: strict publication admission, preserved temporary evidence, repair quarantine and independent discovery.');

const {qualityOverview}=await import('../lib/catalog-quality.mjs');const report=qualityOverview([good,pending,quarantine],[],{now});assert.equal(report.coverage.publication.published,1);assert.equal(report.targets[2].actual,100);assert(report.processingTargets[2].actual<90);assert.equal(qualityOverview([pending],[],{now}).targets[2].met,false,'An empty public catalogue cannot pass launch quality');

const P=createRequire(import.meta.url)('../dist/providers.js');const linked={...good,full:'hf:team/linked',source:'huggingface',spaceId:'team/linked',githubFull:'team/good'};const merged=P.mergeCatalog([{...good,demo:null,screenshots:[]}],[linked]);assert.equal(merged.length,1);assert(Q.publishedEligible(merged[0],now),'Linked Space demo capture follows its validated fallback URL');

const {createCatalogService}=await import('../lib/catalog-service.mjs');const {fixture}=await import('./api-fixture.mjs');const {readFile,writeFile}=await import('node:fs/promises');const fixtureData=await fixture();try{const path=new URL('dist/catalog.json',fixtureData.root),catalog=JSON.parse(await readFile(path,'utf8'));catalog.repositories.push({...catalog.repositories[0],full:'team/pending',screenshots:[]});await writeFile(path,JSON.stringify(catalog));const service=createCatalogService({root:fixtureData.root});assert.equal((await service.search({demos:false})).total,2,'Agent search cannot opt out of admission');assert(!(await service.search({q:'canvas'})).items.some(r=>r.id==='team/pending'));assert.equal((await service.project({id:'team/pending'})).project.catalogueState,'pending','Saved references retain context while admission is pending');}finally{await fixtureData.cleanup()}
