import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.REPOSHELF_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...process.env.REPOSHELF_CHROMIUM_PATH?{executablePath:process.env.REPOSHELF_CHROMIUM_PATH}:{}});
const base='https://layout.test',out=new URL('../work/layout-review/',import.meta.url);await mkdir(out,{recursive:true});
const newKinds=['lissajous','ripples','tunnel','constellation','helix','pendulums','orbits','radar','lattice','fountain','bloom','equalizer'];
try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'}),errors=[];let enabled=false,revision=1,scans=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());assert.equal(u.origin,base,'Verification never calls production');
  const json=data=>route.fulfill({json:data});
  if(u.pathname==='/api/auth')return json({enabled:true,user:{id:'00000000-0000-0000-0000-000000000001',admin:true,githubConnected:true,name:'Owner'}});
  if(u.pathname==='/api/editorial'){
   if(u.searchParams.get('action')==='x-settings'){if(route.request().method()==='POST'){enabled=route.request().postDataJSON().enabled;revision++}return json({settings:{enabled,revision}})}
   if(u.searchParams.get('action')==='x-scan'){assert(enabled);scans++;return json({requested:true,requestedAt:new Date().toISOString(),reason:'X scan requested.'})}
   if(u.searchParams.get('action')==='x-progress')return json({publication:{status:'not_needed'}});
   return json({customRows:false,rows:[],items:[],coverage:{},builtinSetupRequired:false});
  }
  if(u.pathname==='/api/sync-log'){
   if(u.searchParams.get('action')==='sync-settings')return json({switches:[]});
   const page=Number(u.searchParams.get('page')||1);
   return json({runs:Array.from({length:page===1?12:3},(_,i)=>({id:String(100-(page-1)*12-i),attempt:1,startedAt:new Date(Date.UTC(2026,9,15,12-i)).toISOString(),finishedAt:new Date(Date.UTC(2026,9,15,12-i,5)).toISOString(),status:'success',trigger:'schedule',hasCounts:false,stages:[]})),hasMore:page===1,publication:{controlConfigured:true}});
  }
  if(u.pathname.startsWith('/api/'))return json({items:[]});
  if(u.pathname.endsWith('/index.json'))return json([]);
  try{const body=await readFile(new URL('../dist'+u.pathname,import.meta.url));return route.fulfill({body,contentType:({html:'text/html',css:'text/css',js:'application/javascript',mjs:'application/javascript',woff2:'font/woff2'})[u.pathname.split('.').pop()]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:'Not found'})}
 });
 await page.goto(base+'/admin.html?tab=sync');await page.waitForSelector('#catalogue-sync-now');
 const disclosures=page.locator('.sync-disclosure');assert.equal(await disclosures.count(),3);
 assert.deepEqual(await disclosures.evaluateAll(nodes=>nodes.map(n=>n.open)),[false,false,false]);
 assert.equal(await page.locator('.sync-run').count(),5);
 assert.equal(await page.locator('#x-collection-status').textContent(),'Disabled');assert(await page.locator('#catalogue-x-scan-now').isDisabled());
 assert(await page.locator('#sync-actions').evaluate(n=>!!(n.compareDocumentPosition(document.querySelector('#x-collection-status'))&Node.DOCUMENT_POSITION_FOLLOWING)));
 await page.getByRole('button',{name:'See more',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.sync-run').length===10);
 await page.getByRole('button',{name:'See more',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.sync-run').length===12);
 await page.getByRole('button',{name:'See more',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.sync-run').length===3);
 assert(await page.getByRole('button',{name:'See more',exact:true}).isHidden());
 await page.getByRole('button',{name:'Newer runs',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.sync-run').length===5);
 const x=page.locator('details').filter({has:page.locator('#x-collection-settings')});await x.locator('summary').focus();await page.keyboard.press('Enter');assert(await x.evaluate(n=>n.open));
 await page.check('#x-collection-enabled');await page.getByRole('button',{name:'Save X.com scanning',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#x-collection-status').textContent==='Enabled');
 assert(await x.evaluate(n=>n.open));await x.locator('summary').click();
 await page.getByRole('button',{name:'Scan X.com Now',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#x-scan-action-status').textContent==='X scan requested.');assert.equal(scans,1);assert(await page.locator('#catalogue-x-scan-now').isDisabled());assert.equal(await x.evaluate(n=>n.open),false);
 await page.locator('.catalogue-publication summary').click();await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#refresh-sync').disabled);assert(await page.locator('.catalogue-publication').evaluate(n=>n.open));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:new URL('sync-'+width+'.png',out).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 await page.goto(base+'/studio.html#motion');await page.waitForSelector('#studio-motion:not([hidden])');
 for(const kind of newKinds){await page.selectOption('#motion-kind',kind);assert(await page.locator('#motion-preview svg').count());assert.equal(await page.locator('#motion-kind').inputValue(),kind)}
 await page.selectOption('#motion-kind','helix');await page.screenshot({path:new URL('studio-'+width+'.png',out).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 await page.goto(base+'/studio.html#typography');await page.waitForSelector('#studio-typography:not([hidden])');await page.selectOption('#type-view','effects');await page.fill('#effect-text','BIG TYPE');await page.locator('#effect-text').dispatchEvent('input');await page.uncheck('#effect-fit');assert.equal(await page.locator('#effect-size').getAttribute('max'),'512');await page.locator('#effect-size').fill('512');
 for(const layout of ['straight','arc','circle','wave']){await page.selectOption('#effect-layout',layout);assert.equal(await page.locator('#effect-size').inputValue(),'512');assert(await page.locator('#effect-preview svg').count())}
 await page.screenshot({path:new URL('large-type-'+width+'.png',out).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await page.close();console.log('PASS: '+width+'px sync disclosures, status saving, keyboard, five-run reveal, pagination, refresh preservation and all 12 experiment previews.');
}}finally{await browser.close()}
