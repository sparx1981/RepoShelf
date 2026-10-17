import {spawn} from 'node:child_process';import {readFile} from 'node:fs/promises';import {existsSync} from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const port=4399,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
const sql=await readFile(new URL('../supabase/migrations/202610170036_text_prompts.sql',import.meta.url),'utf8'),TAG='$reposhelf_prompt$',from=sql.indexOf(TAG)+TAG.length,PROMPT=sql.slice(from,sql.indexOf(TAG,from)).replace(/\n$/,'');
const list=[
 {source:'siteshelf',id:'motion-film-director',title:'Motion film director',category:'Video & motion',description:'A brief-to-MP4 prompt.',type:'free',kind:'text',thumbnail:null,credit:null},
 {source:'siteshelf',id:'budget-planner',title:'Budget planner',category:'Tools',description:'Plan a month.',type:'free',kind:'page',thumbnail:null,credit:null}];
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(Error('Server exited')))});
 browser=await chromium.launch();const errors=[],created=[],bundles=[];let signedIn=true,admin=false,adminRows=list.map(i=>({source:i.source,source_id:i.id,title:i.title,category:i.category,type:'free',kind:i.kind,published:true,is_new:false,created_at:'2026-10-01T00:00:00Z'}));
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
 const routeFor=async route=>{
  const u=new URL(route.request().url()),method=route.request().method();
  if(u.origin!==base)return route.abort();
  // The unbuilt dev server does not list every page; a production build serves hashed /assets files instead.
  const file=/^\/([a-z0-9.-]+\.(?:html|js|css))$/.exec(u.pathname);if(file&&existsSync(new URL('../dist/'+file[1],import.meta.url)))return route.fulfill({body:await readFile(new URL('../dist/'+file[1],import.meta.url)),contentType:types[file[1].slice(file[1].lastIndexOf('.'))]});
  if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:true,analyticsEnabled:false,user:signedIn?{id:'owner',name:'owner',githubConnected:true,admin}:null}});
  if(u.pathname==='/api/collection')return route.fulfill({json:{items:[],nextCursor:null}});
  if(u.pathname==='/api/analytics')return route.fulfill({json:{configured:false}});
  if(u.pathname==='/api/prompts'){
   const area=u.searchParams.get('area')||'list';
   if(area==='list')return route.fulfill({json:{items:list}});
   if(area==='preview')return route.fulfill({json:{html:'<!doctype html><title>Live</title><p>live page</p>',createdAt:'2026-10-05T00:00:00Z'}});
   if(area==='bundle'){const id=u.searchParams.get('id');bundles.push(id);if(!signedIn)return route.fulfill({status:401,json:{error:{code:'sign_in_required',message:'Sign in'}}});return route.fulfill({json:id==='motion-film-director'?{title:'Motion film director',prompt:PROMPT,html:null,kind:'text'}:{title:'Budget planner',prompt:'Plain prompt text',html:'<p>code</p>'}})}
   if(area==='admin-list')return route.fulfill({json:{items:adminRows,runs:[]}});
   if(area==='admin-create'){const body=route.request().postDataJSON();created.push(body);const id=body.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');adminRows.unshift({source:'siteshelf',source_id:id,title:body.title,category:body.category||null,type:'free',kind:'text',published:body.published,is_new:false,created_at:new Date().toISOString()});return route.fulfill({json:{ok:true,source:'siteshelf',id}})}
  }
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});
  return route.continue()};
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:1000}});await context.route('**/*',routeFor);
 await context.addInitScript(()=>{window.__copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copied.push(t)}},configurable:true})});
 const noteError=e=>{if(!/Service worker is disabled because the context is sandboxed/.test(e.message))errors.push(e.message)},page=await context.newPage();page.on('pageerror',noteError);page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|Service worker is disabled because the context is sandboxed/.test(m.text()))errors.push(m.text())});
 await page.goto(base+'/prompts.html');await page.waitForSelector('.prompt-card');await page.waitForFunction(()=>RepoAccount.ready&&RepoAccount.user);
 // the card for a text prompt: no image, a "Fill-in prompt" label; page prompts are unchanged
 const cards=page.locator('.prompt-item');assert.equal(await cards.count(),2);
 const filmCard=page.locator('.prompt-card',{hasText:'Motion film director'});assert.equal(await filmCard.locator('img').count(),0);assert.equal((await filmCard.locator('.no-thumb.text').textContent()).trim(),'Fill-in prompt');
 await filmCard.click();const dialog=page.locator('#prompt-dialog');await dialog.waitFor();
 assert(!(await page.locator('#tab-live').isVisible())&&!(await page.locator('#tab-code').isVisible()),'a text prompt has only the Prompt view');
 assert.equal(await page.locator('#tab-prompt').getAttribute('aria-selected'),'true');
 await page.waitForSelector('.prompt-fields');
 const labels=await page.locator('.prompt-field label').allTextContents();assert.deepEqual(labels,['Mode','Subject','Viewer','End state','Length and formats','Frame rate','Brand','Facts','Assets','Style','Sound','Autonomy','Toolchain','Sign-off']);
 assert.equal(await page.locator('.prompt-field select').count(),3,'mode, sound and autonomy are dropdowns');
 assert.deepEqual(await page.locator('#pf-mode option').allTextContents(),['Let the AI decide','showreel','product','launch-story','explainer']);
 assert.equal(await page.locator('#pf-frame-rate').getAttribute('placeholder'),'blank = 60 for UI/product, 30 for character, 24 for handmade looks','the prompt hint is the placeholder');
 // fill some boxes: the preview and the copied prompt follow
 await page.locator('#pf-mode').selectOption('product');await page.locator('#pf-subject').fill('https://example.org');await page.locator('#pf-viewer').fill('Busy founders\nwho skim feeds');await page.locator('#pf-sound').selectOption('silent');
 await page.locator('.prompt-preview summary').click();const preview=await page.locator('.prompt-preview pre').textContent();
 assert(preview.includes('\nmode:        product\n')&&preview.includes('\nsubject:     https://example.org\n')&&preview.includes('\nviewer:      Busy founders who skim feeds\n')&&preview.includes('\nsound:       silent\n')&&preview.includes('\nautonomy:\n'));
 await page.getByRole('button',{name:'Copy finished prompt'}).click();await page.waitForFunction(()=>window.__copied.length===1);
 assert.equal(await page.evaluate(()=>window.__copied[0]),preview,'the copied prompt is the previewed prompt');
 assert.equal(await page.locator('.prompt-actions a[href*="claude.ai"]').count(),1);
 // values are remembered on this device, and can be cleared
 await page.locator('#prompt-close').click();await filmCard.click();await page.waitForSelector('#pf-mode');
 assert.equal(await page.locator('#pf-mode').inputValue(),'product');assert.equal(await page.locator('#pf-subject').inputValue(),'https://example.org');
 await page.getByRole('button',{name:'Clear all boxes'}).click();assert.equal(await page.locator('#pf-mode').inputValue(),'');assert.equal(await page.locator('#pf-subject').inputValue(),'');
 assert(await page.getByRole('button',{name:'Clear all boxes'}).isDisabled());
 assert((await page.locator('.prompt-preview pre').textContent()).includes('\nmode:\n'),'cleared boxes leave blank lines');
 // keyboard: the single visible tab does not wrap onto hidden ones
 await page.locator('#tab-prompt').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-prompt').getAttribute('aria-selected'),'true');
 // phone layout: one column, no sideways scroll
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
 const columns=await page.evaluate(()=>getComputedStyle(document.querySelector('.prompt-field-grid')).gridTemplateColumns.split(' ').length);assert.equal(columns,1);await page.screenshot({path:'prompt-fields-mobile.png'});
 await page.setViewportSize({width:1280,height:1000});await page.locator('#prompt-close').click();
 // a page prompt is unchanged: three tabs, Live first, plain prompt text
 await page.locator('.prompt-card',{hasText:'Budget planner'}).click();assert(await page.locator('#tab-live').isVisible()&&await page.locator('#tab-code').isVisible());assert.equal(await page.locator('#tab-live').getAttribute('aria-selected'),'true');
 await page.locator('#tab-prompt').click();await page.waitForSelector('#panel-prompt pre.prompt-text');assert.equal(await page.locator('#panel-prompt .prompt-fields').count(),0);assert.equal(await page.locator('#panel-prompt pre').textContent(),'Plain prompt text');assert(await page.getByRole('button',{name:'Copy prompt',exact:true}).isVisible());
 await page.locator('#prompt-close').click();
 // signed out: the prompt and its boxes stay behind the sign-in lock
 signedIn=false;const out=await context.newPage();out.on('pageerror',noteError);await out.goto(base+'/prompts.html');await out.waitForSelector('.prompt-card');await out.waitForFunction(()=>RepoAccount.ready);
 await out.locator('.prompt-card',{hasText:'Motion film director'}).click();await out.waitForSelector('.prompt-lock');assert.equal(await out.locator('.prompt-fields').count(),0);assert.equal(await out.getByText('<brief>').count(),0);assert(!bundles.slice(-1).includes('x'));
 // administration: New prompt creates a text prompt
 signedIn=true;admin=true;const adm=await context.newPage();adm.on('pageerror',noteError);await adm.goto(base+'/admin.html?tab=prompts');await adm.waitForFunction(()=>RepoAccount.ready&&RepoAccount.user?.admin);
 await adm.waitForSelector('#prompts-new',{state:'visible'});await adm.waitForSelector('#prompts-rows tr');
 await adm.locator('#prompts-new').click();assert.equal(await adm.locator('#prompt-edit-title').textContent(),'New prompt');assert(await adm.locator('#pe-published').isChecked());assert.equal(await adm.locator('#pe-title').inputValue(),'');
 await adm.locator('#pe-title').fill('Launch teaser');await adm.locator('#pe-category').fill('Video & motion');await adm.locator('#pe-prompt').fill('Make a teaser.');await adm.locator('#pe-save').click();
 await adm.waitForFunction(()=>/Created "Launch teaser"/.test(document.querySelector('#prompts-message').textContent));
 assert.deepEqual(created,[{title:'Launch teaser',category:'Video & motion',description:'',prompt:'Make a teaser.',published:true}]);assert(await adm.locator('#prompts-rows tr',{hasText:'Launch teaser'}).isVisible());
 await adm.locator('#prompts-rows tr',{hasText:'Budget planner'}).getByRole('button',{name:/^Edit/}).click();assert.equal(await adm.locator('#prompt-edit-title').textContent(),'Edit prompt');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: text prompt card and Prompt-only view, 14 fill-in boxes with dropdowns and hints, live preview and finished-prompt copy, remembered and clearable values, mobile layout, unchanged page prompts, sign-in lock and the admin New prompt form.');
}finally{await browser?.close();server.kill('SIGTERM')}
