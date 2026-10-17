import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {generateBrowseIndex} from '../lib/browse-index.mjs';
import {createBrowseService} from '../lib/browse-service.mjs';
// /?project=owner/repo opens any saved listing, including ones that have not passed the publication checks. Those must not offer
// the "Try demo" link or evidence a published listing earns.
const now=Date.now(),iso=new Date(now).toISOString();
const repo=(name,extra={})=>({full:'team/'+name,name,description:'A visual planning tool for teams.',category:'Design',topics:['react'],technologies:['React'],stars:50,forks:3,availability:'available',demo:'https://demo.example.org/'+name,screenshots:[{src:'https://example.org/'+name+'.jpg',kind:'demo',url:'https://demo.example.org/'+name,capturedAt:iso}],overview:{kind:'readme',paragraphs:['Context.'],sourceUrl:'https://github.com/team/'+name+'/README.md'},lastCheckedAt:iso,demoHealth:{url:'https://demo.example.org/'+name,status:'working',checkedAt:iso},...extra});
const repos=[repo('verified'),repo('unchecked',{demoHealth:undefined,lastCheckedAt:undefined,screenshots:[]}),repo('failing',{demoHealth:{url:'https://demo.example.org/failing',status:'failing',checkedAt:iso,consecutiveFailures:3},screenshots:[]})];
const dir=await mkdtemp(tmpdir()+'/reposhelf-detail-'),root=pathToFileURL(dir+'/');
try{
 await mkdir(new URL('dist/',root));await mkdir(new URL('data/',root));
 for(const [name,data] of Object.entries({'catalog.json':{updatedAt:iso,repositories:repos},'spaces.json':{updatedAt:iso,repositories:[]},'community.json':{mentions:[]}}))await writeFile(new URL('dist/'+name,root),JSON.stringify(data));
 await generateBrowseIndex(root);const service=createBrowseService({root});
 const listed=(await service.search({demos:false,limit:48})).items.map(r=>r.full);
 const good=await service.detail('team/verified');
 assert.equal(good.repo.demo,'https://demo.example.org/verified');assert.equal(good.repo.unverified,undefined);assert.equal(good.repo.screenshots.length,1,'a published listing keeps its demo, evidence and screenshots');
 for(const name of ['unchecked','failing']){
  const shown=await service.detail('team/'+name);
  assert.equal(shown.repo.unverified,true,name+' is marked as not verified');assert.equal(shown.repo.demo,null,name+' offers no demo link');assert.deepEqual(shown.repo.screenshots,[],name+' shows no screenshots');
  assert.equal(shown.repo.name,name,'its public details are still shown');assert.equal(shown.repo.overview.paragraphs[0],'Context.');
  assert(!listed.includes('team/'+name)||false,name+' is not in the public list either');
 }
 console.log('PASS: a deep link to a listing that has not passed the publication checks shows its details without a demo link, demo evidence or screenshots and says it is unverified; published listings are unchanged.');
}finally{await rm(dir,{recursive:true,force:true})}
