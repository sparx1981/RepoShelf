import assert from 'node:assert/strict';
import sharp from 'sharp';
import {auditDiscovery} from '../scripts/audit-discovery.mjs';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {buildSEO,selectProjects,projectPath,siteOrigin,socialImageSVG,DEFAULT_SITE_URL} from '../scripts/build-seo.mjs';

const require=createRequire(import.meta.url),Q=require('../dist/quality.js'),E=require('../dist/editorial.js');
const now=Date.parse('2026-10-12T12:00:00Z'),at=new Date(now).toISOString(),old=new Date(now-10*86400000).toISOString();
const fixture=(id,changes={})=>({full:id,name:id.split('/')[1],description:'A public project for drawing, planning, and building.',category:'Design',technologies:['JavaScript'],stars:100,forks:20,availability:'available',lastCheckedAt:at,demo:'https://demo.example/',demoHealth:{url:'https://demo.example/',status:'working',checkedAt:at},screenshots:[{kind:'demo',src:'previews/'+ 'a'.repeat(24)+'.jpg',url:'https://demo.example/',capturedAt:at}],...changes});
const valid=fixture('Owner/Visible',{overview:{paragraphs:['Author description </script><script>alert(1)</script>'],features:['Build & share']},license:'MIT',projectInsights:{whatItDoes:{text:'Draw and share designs.'},audience:[{text:'For designers and small teams.'}],requirements:[{kind:'api_key',status:'optional',text:'An external API key is optional.'},{kind:'hosting',status:'required',text:'Self-host the application with Node.js.'}],sourceUrl:'https://github.com/Owner/Visible#readme',checkedAt:at},updated:at,internalSecret:'PRIVATE-TEST-SENTINEL'}),space=fixture('hf:Owner/Space',{spaceId:'Owner/Space',source:'huggingface',likes:42,name:'Interactive AI Space',category:'AI & machine learning'});
const excluded=[fixture('owner/hidden',{listingControl:'hidden'}),fixture('owner/excluded',{listingControl:'excluded'}),fixture('owner/stale',{lastCheckedAt:old}),fixture('owner/broken',{demoHealth:{url:'https://demo.example/',status:'unavailable',checkedAt:at}}),fixture('owner/pending',{screenshots:[]}),fixture('owner/private',{availability:'unavailable'}),fixture('owner/old-demo',{demoHealth:{url:'https://demo.example/',status:'working',checkedAt:old}}),fixture('owner/wrong-demo',{demoHealth:{url:'https://other.example/',status:'working',checkedAt:at}})];
const entries=[valid,space,...Array.from({length:55},(_,i)=>fixture(i===0?'admin/project-0':i===1?'owner/discovery':'owner/project-'+i,{stars:i+1})),...excluded,{...valid,full:'owner/visible',stars:0,forks:0}];
const index={snapshots:{catalog:at,internalSecret:'PRIVATE-SNAPSHOT-SENTINEL'},repositories:entries};
assert.equal(siteOrigin({}),DEFAULT_SITE_URL);
assert.equal(siteOrigin({REPOSHELF_SITE_URL:'https://shelf.example/'}),'https://shelf.example');
for(const url of ['http://shelf.example','https://user:pass@shelf.example','https://shelf.example/path','https://shelf.example/?token=x','https://shelf.example/#hash'])assert.throws(()=>siteOrigin({REPOSHELF_SITE_URL:url}));
assert.equal(projectPath(valid),'/projects/github/owner/visible.html');
assert.equal(projectPath(space),'/projects/huggingface/owner/space.html');
assert.equal(projectPath(fixture('../outside')),null);
assert.equal(projectPath({...space,full:'hf:other/id'}),null);
const selected=selectProjects(index,{now});
assert.equal(selected.length,57,'identity deduplication is case-insensitive');
for(const r of excluded)assert(!selected.some(p=>p.full===r.full),'unpublished project omitted: '+r.full);
assert(selectProjects(index,{now,limit:2}).some(P=>P.source==='huggingface'),'small categories have reserved coverage');
assert.deepEqual(selectProjects(index,{now}).map(r=>r.full),selectProjects({...index,repositories:[...entries].reverse()},{now}).map(r=>r.full),'ranking is stable across input order for unequal scores');
assert.match(socialImageSVG(),/width="1200" height="630"/);
const ties=[fixture('owner/z'),fixture('owner/a')];
assert.deepEqual(selectProjects({repositories:ties},{now}).map(r=>r.full),selectProjects({repositories:[...ties].reverse()},{now}).map(r=>r.full),'single-source popularity ties have deterministic URLs');
// Sharing warms a small public-page manifest when details open, preserving the user gesture for navigator.share.
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),shareSource=app.slice(app.indexOf('let listingPages='),app.indexOf('async function shareListing'));
let fetches=0;
const sharing=runInNewContext(shareSource+';({loadListingPages,listingLink})',{URL,AbortSignal,location:{origin:'https://shelf.example'},fetch:async()=>{fetches++;return {ok:true,json:async()=>({'owner/visible':projectPath(valid),'owner/unsafe':'//evil.example/'})}}});
assert.equal(sharing.listingLink(valid.full),'https://shelf.example/?project=Owner%2FVisible','legacy links work before the manifest loads');
await sharing.loadListingPages();await sharing.loadListingPages();assert.equal(fetches,1,'the manifest is loaded once');
assert.equal(sharing.listingLink(valid.full),'https://shelf.example'+projectPath(valid));assert.equal(sharing.listingLink('owner/unsafe'),'https://shelf.example/?project=owner%2Funsafe','invalid public paths cannot redirect sharing');
const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
assert(vercel.headers.some(rule=>rule.source==='/api/(.*)'&&rule.headers.some(h=>h.key==='X-Robots-Tag'&&h.value.includes('noindex'))));
assert(vercel.redirects.some(rule=>rule.source==='/index.html'&&rule.destination==='/'&&rule.permanent));
assert((await readFile(new URL('../scripts/build-browse-index.mjs',import.meta.url),'utf8')).includes('await buildSEO(undefined,{index:generated.index,projects:generated.projects})'),'the deployment build generates SEO after moderation');

const folder=await mkdtemp(tmpdir()+'/reposhelf-seo-'),root=pathToFileURL(folder+'/'),dist=new URL('dist/',root),env={REPOSHELF_SITE_URL:'https://shelf.example',VERCEL_ENV:'production',REPOSHELF_GOOGLE_SITE_VERIFICATION:'Google_public_test_token',REPOSHELF_BING_SITE_VERIFICATION:'1234567890ABCDEF1234567890ABCDEF'};
const read=path=>readFile(new URL(path,dist),'utf8');
const image=async base=>writeFile(new URL('social-preview.png',base),'image fixture');
try{
 await mkdir(dist);await mkdir(new URL('previews/',dist));await sharp(Buffer.from('<svg width="1600" height="1000"><rect width="1600" height="1000" fill="#181923"/><rect x="80" y="100" width="640" height="800" rx="30" fill="#d6fb79"/><rect x="800" y="100" width="720" height="300" fill="#515464"/></svg>')).jpeg({quality:90}).toFile(new URL('previews/'+ 'a'.repeat(24)+'.jpg',dist).pathname);await writeFile(new URL('index.html',dist),'<html><head><title>Old home</title><meta name="description" content="Old description"></head><body>Storefront<a href="/explore.html">Browse all categories</a></body></html>');
 for(const name of ['admin','admin-viewer','account','legal','offline','prompts','connect','privacy'])await writeFile(new URL(name+'.html',dist),`<html><head><title>${name} &amp; RepoShelf</title></head><body>${name}</body></html>`);
 await writeFile(new URL('admin-viewer.html',dist),'<!doctype html><meta charset="utf-8"><title>Admin viewer</title><iframe title="Preview" src="about:blank"></iframe>');
 await writeFile(new URL('agent-guide.html',dist),await readFile(new URL('../dist/agent-guide.html',import.meta.url)));
 await writeFile(new URL('openapi.json',dist),await readFile(new URL('../dist/openapi.json',import.meta.url)));
 await mkdir(new URL('docs/',root));await writeFile(new URL('docs/AGENT_API.md',root),await readFile(new URL('../docs/AGENT_API.md',import.meta.url)));
 const options={index,projects:entries,env,now,renderImage:image};
 const result=await buildSEO(root,options),sitemap=await read('sitemap.xml'),robots=await read('robots.txt'),home=await read('index.html');
 assert.match(home,/<title>RepoShelf — Discover GitHub projects and live demos<\/title>/);assert.match(home,/<link rel="canonical" href="https:\/\/shelf.example\/">/);
 assert(home.includes('name="google-site-verification" content="Google_public_test_token"'));assert(home.includes('name="msvalidate.01"'));
 assert.match(robots,/Sitemap: https:\/\/shelf.example\/sitemap.xml/);
 const map=JSON.parse(await read('project-pages.json'));assert.equal(map['owner/visible'],projectPath(valid));assert.equal(map['hf:owner/space'],projectPath(space));
 assert.equal(Object.keys(map).length,57);
 const locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(new Set(locations).size,locations.length);
 assert.equal(locations.length,result.paths.length);assert(!sitemap.includes('admin.html'));assert(!sitemap.includes('account.html'));assert(!sitemap.includes('privacy.html'));assert(!sitemap.includes('?project='));
 for(const path of result.paths){const html=await read(path==='/'?'index.html':path.slice(1));assert(html.includes(`rel="canonical" href="https://shelf.example${path}"`),path+' canonical');assert.match(html,/property="og:image" content="https:\/\/shelf.example\//);assert.match(html,/name="twitter:card" content="summary_large_image"/);assert(!html.includes('noindex'),path+' is indexable');for(const match of html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g))JSON.parse(match[1]);}
 for(const path of result.paths){const html=await read(path==='/'?'index.html':path.slice(1));assert(html.includes('rel="describedby" href="https://shelf.example/llms.txt"'));assert(html.includes('rel="service-desc" href="https://shelf.example/openapi.json"'));const alternate=html.match(/rel="alternate" href="https:\/\/shelf.example([^"]+)" type="text\/markdown"/);if(path==='/'||path==='/explore.html'||path==='/agent-guide.html'||path.startsWith('/projects/')||path.startsWith('/categories/')){assert(alternate,path+' advertises Markdown');await read(alternate[1].slice(1));}}
 const discovery=JSON.parse(await read('discovery.json'));assert.equal(discovery.totalProjects,57);assert.equal(discovery.coverage.completeCatalog,false);assert.equal(discovery.coverage.maximumProjects,5000);assert.equal(discovery.sourceSnapshots.catalog,at);assert(!JSON.stringify(discovery).includes(index.snapshots.internalSecret),'manifest uses a snapshot-field whitelist');assert.equal(discovery.pages.length,3);assert.equal(discovery.firstPage,discovery.pages[0].url);
 let chunkUrl=discovery.firstPage;const publicRecords=[];
 for(const page of discovery.pages){assert.equal(chunkUrl,page.url);const body=await read(new URL(page.url).pathname.slice(1)),chunk=JSON.parse(body);assert.equal(chunk.version,discovery.version);assert.equal(chunk.items.length,page.count);assert(chunk.items.length<=25);assert(Buffer.byteLength(body)<65536);assert(!body.includes(valid.internalSecret),'JSON uses a public-field whitelist');publicRecords.push(...chunk.items);chunkUrl=chunk.next;}
 assert.equal(chunkUrl,null);assert.equal(new Set(publicRecords.map(r=>r.id.toLowerCase())).size,57);
 for(const record of publicRecords){assert(Object.hasOwn(map,record.id.toLowerCase()));assert.equal(record.url,'https://shelf.example'+map[record.id.toLowerCase()]);await read(new URL(record.markdownUrl).pathname.slice(1));assert.equal(record.demo.scope,'public-page-load-only');assert.equal(record.availabilityCheckedAt,at);assert(!excluded.some(r=>r.full===record.id));}
 const llms=await read('llms.txt');assert.match(llms,/^# RepoShelf\n/);assert.match(llms,/5,000 published listings/);assert(llms.includes('https://shelf.example/agent-guide.html.md'));
 const publicGuide=await read('agent-guide.html.md'),guideHTML=await read('agent-guide.html');assert(publicGuide.includes('https://shelf.example/api/mcp'));assert(guideHTML.includes('https://shelf.example/api/mcp'));assert(!guideHTML.includes('https://reposhelf.vercel.app'));assert(guideHTML.includes('"@type":"DataCatalog"'));assert(publicGuide.includes('not a promise of indexing'));
 const projectMD=await read(projectPath(valid).slice(1)+'.md');assert(projectMD.includes('> Author description &lt;/script&gt;'));assert(!projectMD.includes('<script>'));assert(projectMD.includes('https://github.com/Owner/Visible'));assert(projectMD.includes('Author-written README excerpt'));
 const apiSchema=JSON.parse(await read('openapi.json'));assert.equal(apiSchema.servers[0].url,'https://shelf.example');assert.deepEqual(apiSchema.paths['/discovery.json'].get.security,[]);assert.deepEqual(apiSchema.paths['/discovery/{file}'].get.security,[]);
 for(const [path,item] of Object.entries(apiSchema.paths))if(path.startsWith('/api/v1/'))assert.deepEqual(item.get.security,[{BearerAuth:[]}],path+' retains authentication');
 assert(!(await read('agent-api.md')).includes('https://reposhelf.vercel.app'));
 for(const name of ['admin','admin-viewer','account','legal','offline'])assert.match(await read(name+'.html'),/content="noindex, nofollow"/);
 assert.match(await read('connect.html'),/<title>connect &amp; RepoShelf<\/title>/,'entities are not double-escaped');
 const project=await read(projectPath(valid).slice(1));assert.match(project,/Author-written excerpt/);assert(!project.includes('<script>alert(1)</script>'));assert.match(project,/&lt;\/script&gt;/);assert.match(project,/"@type":"SoftwareSourceCode"/);assert.match(project,/Open project in RepoShelf/);assert(!project.includes('aggregateRating'));assert(project.includes('External API key · Optional'));assert(project.includes('Self-hosting · Required'));assert(project.includes('For designers and small teams.'));assert(project.includes('type="image/webp"'));assert(projectMD.includes('An external API key is optional.'));
 const fetcher=async url=>{const path=new URL(url).pathname,file=path==='/'?'index.html':path.slice(1),type=file.endsWith('.md')?'text/markdown':file.endsWith('.json')?'application/json':file.endsWith('.xml')?'application/xml':file.endsWith('.txt')?'text/plain':'text/html';try{return new Response(await read(file),{headers:{'Content-Type':type,...(/\.md$|^discovery[/.]/.test(file)?{'X-Robots-Tag':'noindex'}:{})}})}catch{return new Response('Not found',{status:404})}};
 const audit=await auditDiscovery('https://shelf.example',{fetcher,checkAuth:false,maxChunks:250});assert.equal(audit.projects,57);assert.equal(audit.journey.project,valid.full);assert(sitemap.includes('/projects/github/admin/project-0.html'));assert(sitemap.includes('/projects/github/owner/discovery.html'));await assert.rejects(auditDiscovery('https://shelf.example',{checkAuth:false,fetcher:async url=>new URL(url).pathname==='/sitemap.xml'?new Response(sitemap.replace('</urlset>','<url><loc>https://shelf.example/admin.html</loc></url></urlset>'),{headers:{'Content-Type':'application/xml'}}):fetcher(url)}),/Private or machine copy/);assert.equal(audit.journey.citation,'https://shelf.example'+projectPath(valid));
 await assert.rejects(auditDiscovery('https://shelf.example',{checkAuth:false,fetcher:async url=>new URL(url).pathname==='/'?new Response(home.replace('index, follow','noindex, follow'),{headers:{'Content-Type':'text/html'}}):fetcher(url)}),/indexable/);
 const category=await read('categories/design.html'),next=await read('categories/design-page-2.html');assert.match(category,/rel="next"/);assert.match(next,/rel="prev"/);assert.equal((category.match(/<li><h2>/g)||[]).length,48);
 // Every generated navigation link to another SEO page resolves to an emitted file.
 for(const path of result.paths){const html=await read(path==='/'?'index.html':path.slice(1));for(const [,href] of html.matchAll(/href="(\/(?:projects|categories)\/[^"?#]+\.html)"/g))assert(result.paths.includes(href),'orphan link '+href);}
 await buildSEO(root,options);assert.equal(await read('index.html'),home,'repeated builds do not duplicate metadata');assert.equal(await read('sitemap.xml'),sitemap,'sitemap order stays deterministic');
 const retired=entries.filter(r=>r.full.toLowerCase()!=='owner/visible');await buildSEO(root,{...options,index:{...index,repositories:retired},projects:retired});assert(!JSON.parse(await read('project-pages.json'))['owner/visible']);await assert.rejects(read(projectPath(valid).slice(1)),{code:'ENOENT'});await assert.rejects(read(projectPath(valid).slice(1)+'.md'),{code:'ENOENT'});await assert.rejects(read(new URL(discovery.firstPage).pathname.slice(1)),{code:'ENOENT'});assert.equal(JSON.parse(await read('discovery.json')).totalProjects,56);
 await buildSEO(root,{...options,env:{...env,VERCEL_ENV:'preview'}});assert.equal((await read('sitemap.xml')).includes('<loc>'),false);assert.equal(await read('robots.txt'),'User-agent: *\nDisallow: /\n');assert.match(await read(projectPath(valid).slice(1)),/content="noindex, nofollow"/);assert.match(await read('index.html'),/href="https:\/\/shelf.example\/"/,'preview canonical still uses production domain');
 await buildSEO(root,{...options,env:{...env,REPOSHELF_SITE_URL:'https://new-shelf.example'}});assert((await read('agent-guide.html')).includes('https://new-shelf.example/api/mcp'));assert(!(await read('agent-guide.html')).includes('https://shelf.example/api/mcp'));assert.equal(JSON.parse(await read('openapi.json')).servers[0].url,'https://new-shelf.example');
 await buildSEO(root,{...options,index:{snapshots:{catalog:at},repositories:[]},projects:[]});assert.deepEqual(JSON.parse(await read('project-pages.json')),{});assert.equal((await readdir(new URL('categories/',dist))).length,0);assert.match(await read('explore.html'),/being refreshed/);assert.equal(JSON.parse(await read('discovery.json')).firstPage,null);assert.equal((await readdir(new URL('discovery/',dist))).length,0);
 if(process.env.REPOSHELF_SEO_KEEP){await buildSEO(root,{...options,renderImage:undefined});const output=new URL('../artifacts/seo-fixture/',import.meta.url);await mkdir(output,{recursive:true});await rm(output,{recursive:true,force:true});await cp(dist,output,{recursive:true});for(const name of ['style.css','legal.css','fonts.css','seo.css'])await cp(new URL('../dist/'+name,import.meta.url),new URL(name,output));await cp(new URL('../dist/fonts/',import.meta.url),new URL('fonts/',output),{recursive:true});console.log('Saved browser fixture to '+output.pathname)}
 console.log('PASS: SEO publication, crawlable HTML, escaping, pagination, canonical origins, sitemap integrity, retirement and preview exclusions.');
}finally{await rm(root,{recursive:true,force:true})}
