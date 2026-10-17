import {QUOTED,PAGE} from '../tests/fixtures/prompts.mjs';
import {spawn} from 'node:child_process';import {readFile} from 'node:fs/promises';import {existsSync} from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const port=4399,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
const sql=await readFile(new URL('../supabase/migrations/202610170036_text_prompts.sql',import.meta.url),'utf8'),TAG='$reposhelf_prompt$',from=sql.indexOf(TAG)+TAG.length,PROMPT=sql.slice(from,sql.indexOf(TAG,from)).replace(/\n$/,'');
const more=await readFile(new URL('../supabase/migrations/202610170037_more_fill_in_prompts.sql',import.meta.url),'utf8'),MORE=[...more.matchAll(/\$rs_([a-z_]+)\$([\s\S]*?)\n\$rs_\1\$/g)].map(m=>({id:m[1].replace(/_/g,'-'),text:m[2]})),TITLES={'landing-page-builder':'Landing page builder','app-from-spec':'App builder from a spec','brand-identity-kit':'Brand identity kit','social-content-engine':'Social content calendar','explainer-video-script':'Explainer video script and storyboard','market-research-brief':'Market research brief'};
let showMore=false,boardsMode='ok';const boardGets=[];
const BOARDS=[{id:'11111111-1111-4111-8111-111111111111',name:'Launch pages',description:'Pages to learn from',items:[{id:'owner/nice-landing',addedAt:'2026-10-01T00:00:00Z',snapshot:{name:'Nice Landing',language:'TypeScript',description:'A clean landing template.'}},{id:'ss:bg/aurora',addedAt:'2026-10-02T00:00:00Z',snapshot:{name:'Aurora background',description:'Soft gradient.'}}]},{id:'22222222-2222-4222-8222-222222222222',name:'Empty board',description:'',items:[]}];
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
  if(u.pathname==='/api/collection'&&u.searchParams.get('action')==='boards'){
   if(boardsMode==='error')return route.fulfill({status:503,json:{error:{code:'migration_required',message:'A database update is required before boards can be used.'}}});
   if(boardsMode==='none')return route.fulfill({json:{boards:[]}});
   const ref=u.searchParams.get('board');boardGets.push(ref);
   if(!ref)return route.fulfill({json:{boards:BOARDS.map(b=>({id:b.id,name:b.name,description:b.description,items:b.items.map(i=>i.id)}))}});
   const found=BOARDS.find(b=>b.id===ref);return found?route.fulfill({json:{board:found}}):route.fulfill({status:404,json:{error:{code:'not_found',message:'That board no longer exists.'}}})}
  if(u.pathname==='/api/collection')return route.fulfill({json:{items:[],nextCursor:null}});
  if(u.pathname==='/api/analytics')return route.fulfill({json:{configured:false}});
  if(u.pathname==='/api/prompts'){
   const area=u.searchParams.get('area')||'list';
   if(area==='list')return route.fulfill({json:{items:showMore?list.concat(MORE.map(m=>({source:'siteshelf',id:m.id,title:TITLES[m.id],category:'Websites & apps',description:'Fill-in prompt.',type:'free',kind:'text',thumbnail:null,credit:null}))):list}});
   if(area==='preview')return route.fulfill({json:{html:PAGE,createdAt:'2026-10-05T00:00:00Z'}});
   if(area==='bundle'){const id=u.searchParams.get('id');bundles.push(id);if(!signedIn)return route.fulfill({status:401,json:{error:{code:'sign_in_required',message:'Sign in'}}});const extra=MORE.find(m=>m.id===id);if(extra)return route.fulfill({json:{title:TITLES[id],prompt:extra.text,html:null,kind:'text'}});return route.fulfill({json:id==='motion-film-director'?{title:'Motion film director',prompt:PROMPT,html:null,kind:'text'}:{title:'Budget planner',prompt:QUOTED,html:PAGE}})}
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
 // a page prompt keeps three tabs, Live first, and gets Customise boxes built from its own text
 await page.locator('.prompt-card',{hasText:'Budget planner'}).click();assert(await page.locator('#tab-live').isVisible()&&await page.locator('#tab-code').isVisible());assert.equal(await page.locator('#tab-live').getAttribute('aria-selected'),'true');
 await page.waitForFunction(()=>/clay-loop|Clay you/.test(document.querySelector('#live-frame').srcdoc||''));
 await page.locator('#tab-prompt').click();await page.waitForSelector('#panel-prompt .prompt-customise');assert.equal(await page.locator('#panel-prompt .prompt-fields').count(),0,'the film brief boxes are only for the film prompt');
 const cz=page.locator('#panel-prompt .prompt-customise');assert.equal(await cz.evaluate(n=>n.open),false,'collapsed until asked for');assert.match(await cz.locator(':scope > summary').textContent(),/^Customise this prompt$/);
 const promptText=()=>page.locator('#panel-prompt pre.prompt-text').textContent();assert.equal(await promptText(),QUOTED,'the prompt reads as written until something changes');
 await cz.locator(':scope > summary').click();
 assert.deepEqual(await cz.locator('legend').allTextContents(),['Brand and text','Colours','Fonts','Links','Sections and rules','Output']);
 assert.equal(await cz.getByLabel('Brand name').inputValue(),'Kiln & Co');assert.equal(await cz.locator('input[type=color]').count(),7);assert.equal(await cz.locator('.prompt-group select',{hasText:'(as written)'}).count(),3,'one dropdown per font');assert.equal(await cz.locator('.prompt-toggle input').count(),4);
 assert.equal(await cz.getByLabel('Output format').inputValue(),'');assert.equal(await cz.getByLabel('Language of the on-screen copy').inputValue(),'');assert(await page.getByRole('button',{name:'Copy prompt',exact:true}).isVisible());assert(await page.getByRole('button',{name:'Reset all changes'}).isDisabled());
 // change a colour, the brand, a font, a section, the output format and the language
 await cz.locator('.prompt-swatch',{hasText:'Accent'}).locator('input[type=color]').fill('#2a9d8f');
 await cz.getByLabel('Brand name').fill('Ember Works');
 await cz.getByLabel('Heading font',{exact:true}).selectOption('Sora');
 await cz.getByLabel('Interaction and animation').uncheck();
 await cz.getByLabel('Output format').selectOption('react');await cz.getByLabel('Language of the on-screen copy').selectOption('French');
 let edited=await promptText();
 assert(edited.includes('Accent kiln orange #2a9d8f')&&edited.includes('visible focus 3px #2a9d8f'.replace('visible','Visible')),'one colour change reaches every use');assert(!edited.includes('Kiln & Co')&&edited.includes('wordmark "Ember Works"'));assert(edited.includes('"Sora" 600/700')&&!edited.includes('Fraunces'));
 assert(!edited.includes('Interaction:')&&edited.includes('Responsive:'));assert(edited.includes('Rules: Deliver a React 18 function component')&&edited.endsWith('Keep the brand name, numbers and code unchanged.'));
 assert.match(await cz.locator(':scope > summary').textContent(),/6 changed/);assert(await page.getByRole('button',{name:'Copy customised prompt'}).isVisible());
 // the copy button gives exactly what is shown
 await page.getByRole('button',{name:'Copy customised prompt'}).click();await page.waitForFunction(()=>window.__copied.length===2);assert.equal(await page.evaluate(()=>window.__copied[1]),edited);
 // the Live page follows: same colours, fonts, brand name, wherever the page uses them
 await page.locator('#tab-live').click();await page.waitForFunction(()=>/#2a9d8f/.test(document.querySelector('#live-frame').srcdoc||''));
 const live=await page.locator('#live-frame').evaluate(f=>f.srcdoc);assert(live.includes('--a:#2a9d8f')&&live.includes('family=Sora')&&live.includes('Ember Works')&&!/d9582b/i.test(live));assert.match(await page.locator('#live-status').textContent(),/Showing your colours/);
 // remembered on this device: closing and reopening keeps the choices and opens the panel
 await page.locator('#prompt-close').click();await page.locator('.prompt-card',{hasText:'Budget planner'}).click();await page.locator('#tab-prompt').click();await page.waitForSelector('#panel-prompt .prompt-customise');
 assert.equal(await page.locator('#panel-prompt .prompt-customise').evaluate(n=>n.open),true);assert.equal(await promptText(),edited);assert.equal(await page.locator('#panel-prompt .prompt-customise').getByLabel('Brand name').inputValue(),'Ember Works');
 await page.locator('#tab-live').click();await page.waitForFunction(()=>/#2a9d8f/.test(document.querySelector('#live-frame').srcdoc||''));
 // reset puts everything back, in the prompt and the Live page
 await page.locator('#tab-prompt').click();await page.getByRole('button',{name:'Reset all changes'}).click();assert.equal(await promptText(),QUOTED);assert.equal(await page.locator('#panel-prompt .prompt-customise').getByLabel('Brand name').inputValue(),'Kiln & Co');assert(await page.getByRole('button',{name:'Copy prompt',exact:true}).isVisible());
 await page.locator('#tab-live').click();await page.waitForFunction(()=>!/#2a9d8f/.test(document.querySelector('#live-frame').srcdoc||''));assert.equal(await page.locator('#live-status').textContent(),'This is a live page. It runs in a sealed frame.');
 // phone layout for the customise panel
 await page.locator('#tab-prompt').click();await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll with the panel open');await page.locator('#panel-prompt .prompt-swatch').first().scrollIntoViewIfNeeded();await page.screenshot({path:'prompt-customise-mobile.png'});await page.setViewportSize({width:1280,height:1000});
 await page.locator('#prompt-close').click();
 // signed out: the prompt and its boxes stay behind the sign-in lock
 signedIn=false;const out=await context.newPage();out.on('pageerror',noteError);await out.goto(base+'/prompts.html');await out.waitForSelector('.prompt-card');await out.waitForFunction(()=>RepoAccount.ready);
 await out.locator('.prompt-card',{hasText:'Motion film director'}).click();await out.waitForSelector('.prompt-lock');assert.equal(await out.locator('.prompt-fields').count(),0);assert.equal(await out.getByText('<brief>').count(),0);assert(!bundles.slice(-1).includes('x'));

 // the six more fill-in prompts: each opens with boxes for every brief line, dropdowns where the choices are fixed, a live preview and a copy of the finished prompt
 assert.equal(MORE.length,6);showMore=true;signedIn=true;const all=await context.newPage();all.on('pageerror',noteError);await all.goto(base+'/prompts.html');await all.waitForSelector('.prompt-card');await all.waitForFunction(()=>RepoAccount.ready&&RepoAccount.user);
 for(const m of MORE){
  await all.locator('.prompt-card',{hasText:TITLES[m.id]}).first().click();await all.locator('#prompt-dialog').waitFor();await all.waitForSelector('#panel-prompt .prompt-fields');
  const fields=await all.locator('#panel-prompt .prompt-field').count(),selects=await all.locator('#panel-prompt .prompt-field select').count();
  assert(fields>=12,m.id+' shows a box for every brief line');assert(selects>=1,m.id+' has dropdowns');
  assert.equal(await all.locator('#panel-prompt .prompt-customise').count(),0,m.id+' uses its own boxes, not the automatic customiser');
  await all.locator('#panel-prompt .prompt-field input[type=text]').first().fill('Zeta Test');
  const sel=all.locator('#panel-prompt .prompt-field select').first();const opt=await sel.locator('option').nth(1).getAttribute('value');await sel.selectOption(opt);
  await all.locator('#panel-prompt .prompt-preview summary').click();const shown=await all.locator('#panel-prompt .prompt-preview pre').textContent();
  assert(shown.includes('Zeta Test')&&shown.includes(opt),m.id+' preview reflects the boxes');assert(!/\n[a-z -]+:\s+\[/.test(shown.split('<brief>')[1].split('</brief>')[0]),m.id+' leaves no placeholders');
  await all.locator('#prompt-close').click();await all.evaluate(k=>{try{localStorage.removeItem('reposhelf.promptfields.v1')}catch{}});
 }

 // Reference board dropdown (Landing page builder and App builder only)
 for(const m of MORE){const has=['landing-page-builder','app-from-spec'].includes(m.id);
  await all.locator('.prompt-card',{hasText:TITLES[m.id]}).first().click();await all.waitForSelector('#panel-prompt .prompt-fields');
  assert.equal(await all.locator('#pf-board').count(),has?1:0,m.id+(has?' has':' has no')+' board dropdown');
  if(has){
   await all.waitForFunction(()=>!document.querySelector('#pf-board').disabled);
   assert.deepEqual(await all.locator('#pf-board option').allTextContents(),['No board','Launch pages (2 items)','Empty board (0 items)']);
   await all.locator('#pf-board').selectOption({label:'Launch pages (2 items)'});await all.locator('#panel-prompt .prompt-preview summary').click();
   await all.waitForFunction(()=>/board:\s+Launch pages/.test(document.querySelector('#panel-prompt .prompt-preview pre').textContent));
   const shown=await all.locator('#panel-prompt .prompt-preview pre').textContent();
   assert(shown.includes('- Nice Landing (GitHub, TypeScript): A clean landing template. https://github.com/owner/nice-landing'));assert(shown.includes('https://www.reposhelf.co.uk/studio.html#bg/aurora'));assert(!shown.includes('No board chosen'));assert(shown.includes('Ask me to confirm or change that list'));
   assert.match(await all.locator('#panel-prompt .prompt-field-hint').textContent(),/Added 2 items/);
   // remembered on reopening, and clearing the boxes removes it
   await all.locator('#prompt-close').click();await all.locator('.prompt-card',{hasText:TITLES[m.id]}).first().click();await all.waitForSelector('#pf-board');await all.waitForFunction(()=>document.querySelector('#pf-board').value==='11111111-1111-4111-8111-111111111111');
   await all.locator('#panel-prompt .prompt-preview summary').click();await all.waitForFunction(()=>/board:\s+Launch pages/.test(document.querySelector('#panel-prompt .prompt-preview pre').textContent));
   await all.locator('#pf-board').selectOption({label:'Empty board (0 items)'});await all.waitForFunction(()=>/has no items yet/.test(document.querySelector('#panel-prompt .prompt-preview pre').textContent));
   await all.getByRole('button',{name:'Clear all boxes'}).click();assert.equal(await all.locator('#pf-board').inputValue(),'');
   assert(!(await all.locator('#panel-prompt .prompt-preview pre').textContent()).includes('Launch pages'));
  }
  await all.locator('#prompt-close').click()}
 // no boards yet, and boards unavailable: the dropdown is disabled with a short hint
 for(const mode of ['none','error']){boardsMode=mode;
  await all.locator('.prompt-card',{hasText:'Landing page builder'}).first().click();await all.waitForSelector('#pf-board');
  await all.waitForFunction(()=>document.querySelector('#pf-board option').textContent!=='Loading your boards…');
  assert(await all.locator('#pf-board').isDisabled(),mode+': the dropdown is disabled');
  if(mode==='none'){assert.equal(await all.locator('#pf-board option').textContent(),'No boards yet');assert.equal(await all.locator('#panel-prompt .prompt-field-hint a').getAttribute('href'),'/#collection')}
  else assert.equal(await all.locator('#pf-board option').textContent(),'Boards are unavailable right now');
  await all.locator('#panel-prompt .prompt-preview summary').click();assert((await all.locator('#panel-prompt .prompt-preview pre').textContent()).includes('No board chosen'));
  await all.locator('#prompt-close').click()}
 boardsMode='ok';
 // administration: New prompt creates a text prompt
 signedIn=true;admin=true;const adm=await context.newPage();adm.on('pageerror',noteError);await adm.goto(base+'/admin.html?tab=prompts');await adm.waitForFunction(()=>RepoAccount.ready&&RepoAccount.user?.admin);
 await adm.waitForSelector('#prompts-new',{state:'visible'});await adm.waitForSelector('#prompts-rows tr');
 await adm.locator('#prompts-new').click();assert.equal(await adm.locator('#prompt-edit-title').textContent(),'New prompt');assert(await adm.locator('#pe-published').isChecked());assert.equal(await adm.locator('#pe-title').inputValue(),'');
 await adm.locator('#pe-title').fill('Launch teaser');await adm.locator('#pe-category').fill('Video & motion');await adm.locator('#pe-prompt').fill('Make a teaser.');await adm.locator('#pe-save').click();
 await adm.waitForFunction(()=>/Created "Launch teaser"/.test(document.querySelector('#prompts-message').textContent));
 assert.deepEqual(created,[{title:'Launch teaser',category:'Video & motion',description:'',prompt:'Make a teaser.',published:true}]);assert(await adm.locator('#prompts-rows tr',{hasText:'Launch teaser'}).isVisible());
 await adm.locator('#prompts-rows tr',{hasText:'Budget planner'}).getByRole('button',{name:/^Edit/}).click();assert.equal(await adm.locator('#prompt-edit-title').textContent(),'Edit prompt');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: the Reference board dropdown (choose, remember, clear, empty and unavailable states) on the two build prompts; the six more fill-in prompts open with boxes, dropdowns and a live preview; text prompt card and Prompt-only view, 14 fill-in boxes with dropdowns and hints, live preview and finished-prompt copy, remembered and clearable values, mobile layout, unchanged page prompts, sign-in lock and the admin New prompt form.');
}finally{await browser?.close();server.kill('SIGTERM')}
