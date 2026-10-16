import {withBrowseFixtures,settleBrowse} from './browse-fixtures.mjs';
import {spawn} from 'node:child_process';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from 'playwright';import {createRequire} from 'node:module';
const E=createRequire(import.meta.url)('../dist/editorial.js'),port=4397,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(Error('Server exited')))});
 browser=await chromium.launch();
 const repos=[{full:'team/one',name:'One',category:'Design',description:'Create something.',demo:'https://example.org/one',availability:'available',stars:20},{full:'team/two',name:'Two',category:'Design',description:'Build something.',demo:'https://example.org/two',availability:'available',stars:10}],boards=[],writes=[],errors=[];let seq=0,signedIn=true,failNext=null;
 const uuid=()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`;
 const routeFor=async route=>{
  const u=new URL(route.request().url()),method=route.request().method();
  if(u.origin!==base)return route.abort();
  // The unbuilt dev server does not list these two files; a production build serves them as hashed /assets files.
  const source=u.pathname.match(/^\/(collection-boards\.(?:js|css))$/);
  if(source)return route.fulfill({body:await readFile(new URL('../dist/'+source[1],import.meta.url)),contentType:source[1].endsWith('.css')?'text/css':'text/javascript'});
  if(u.pathname==='/catalog.json')return route.fulfill({json:{repositories:repos}});
  if(u.pathname==='/spaces.json')return route.fulfill({json:{repositories:[]}});
  if(u.pathname==='/community.json')return route.fulfill({json:{mentions:[]}});
  if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:true,analyticsEnabled:false,user:signedIn?{id:'owner',githubConnected:true,name:'owner'}:null}});
  if(u.pathname==='/api/forks')return route.fulfill({json:{items:[],sync:{lastAttemptAt:new Date().toISOString()}}});
  if(u.pathname==='/api/promotions')return route.fulfill({json:{items:[]}});
  if(u.pathname==='/api/editorial')return route.fulfill({json:{builtinSetupRequired:false,customRows:false,rows:E.defaults()}});
  if(u.pathname==='/api/collection'){
   const action=u.searchParams.get('action');
   if(!action)return route.fulfill({json:{items:repos.map(r=>({id:r.full,repo:r}))}});
   if(action==='boards'&&failNext){const status=failNext;failNext=null;return route.fulfill({status,json:{error:{code:'duplicate_name',message:'You already have a board with that name.'}}})}
   if(action==='boards'){
    if(method==='GET'){const ref=u.searchParams.get('board');if(!ref)return route.fulfill({json:{boards:boards.map(b=>({...b,items:[...b.items]}))}});const b=boards.find(x=>x.id===ref);return b?route.fulfill({json:{board:{...b,items:b.items.map(id=>({id,addedAt:'2026-10-16T00:00:00Z',snapshot:{name:repos.find(r=>r.full===id).name,category:'Design'}}))}}}):route.fulfill({status:404,json:{error:{message:'gone'}}})}
    const body=route.request().postDataJSON();writes.push({method,body});
    if(method==='DELETE'){boards.splice(boards.findIndex(b=>b.id===body.id),1);return route.fulfill({json:{deleted:true}})}
    if(body.id){const b=boards.find(x=>x.id===body.id);b.name=body.name;if(body.description!==undefined)b.description=body.description;return route.fulfill({json:{id:b.id,saved:true}})}
    const b={id:uuid(),name:body.name,description:body.description||'',items:[]};boards.push(b);return route.fulfill({json:{id:b.id,saved:true}})}
   if(action==='board-items'){const body=route.request().postDataJSON();writes.push({method,body});const b=boards.find(x=>x.id===body.board);b.items=body.present?[body.id,...b.items.filter(x=>x!==body.id)]:b.items.filter(x=>x!==body.id);return route.fulfill({json:{...body}})}}
  return route.continue()};
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:1000}});await context.route('**/*',withBrowseFixtures(routeFor));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text())});
 await page.goto(base);await page.waitForFunction(()=>RepoAccount.ready&&RepoAccount.user);await settleBrowse(page);
 await page.locator('[data-view="collection"]').click();await page.waitForSelector('#collection-tabs [data-collection-mode]');
 assert.equal(await page.locator('[data-collection-mode="boards"]').textContent(),'Boards','the Boards tab sits with the other collection tabs');
 // add to board from a card: create a board inline, tick it
 await page.waitForSelector('#grid [data-board-add="team/one"]');
 assert.equal((await page.locator('#grid [data-board-add="team/one"]').textContent()).trim(),'＋ Board');
 await page.locator('#grid [data-board-add="team/one"]').click();
 const picker=page.locator('#board-picker');assert(await picker.isVisible());assert(await picker.getByText('You have no boards yet').isVisible());
 await picker.getByLabel('New board name').fill('Landing page');await picker.getByRole('button',{name:'Create and add'}).click();
 await page.waitForFunction(()=>document.querySelector('#board-picker input[type=checkbox]:checked'));
 assert.equal(await picker.locator('input[type=checkbox]').count(),1);
 await picker.getByLabel('New board name').fill('Dashboard');await picker.getByLabel('New board name').press('Enter');
 await page.waitForFunction(()=>document.querySelectorAll('#board-picker input[type=checkbox]').length===2);
 await picker.getByRole('button',{name:'Done'}).click();
 assert.equal((await page.locator('#grid [data-board-add="team/one"]').textContent()).trim(),'On 2 boards','the card shows how many boards it is on');
 assert.equal((await page.locator('#grid [data-board-add="team/two"]').textContent()).trim(),'＋ Board');
 // an item can be on several boards, and a tick can be undone
 await page.locator('#grid [data-board-add="team/two"]').click();await picker.getByLabel('Landing page').check();await picker.getByLabel('Dashboard').check();await page.waitForFunction(()=>document.querySelector('#grid [data-board-add="team/two"]')?.textContent.trim()==='On 2 boards');
 await picker.getByLabel('Dashboard').uncheck();await picker.getByRole('button',{name:'Done'}).click();
 assert.equal((await page.locator('#grid [data-board-add="team/two"]').textContent()).trim(),'On 1 board');
 assert.deepEqual(boards.map(b=>[b.name,b.items.length]),[['Landing page',2],['Dashboard',1]],'membership is saved per board');
 // the Boards tab replaces the grid
 await page.locator('[data-collection-mode="boards"]').click();
 assert(await page.locator('#boards-panel').isVisible());assert(!(await page.locator('#grid').isVisible()),'the project grid steps aside');
 assert.equal(await page.locator('.board-card').count(),2);assert.match(await page.locator('.board-card').first().textContent(),/Landing page.*2 items/);
 // open a board, read its items, remove one
 await page.locator('.board-card',{hasText:'Landing page'}).click();
 assert.equal(await page.locator('.board-items li').count(),2);assert(await page.locator('.board-assist code').textContent().then(t=>t.includes('Landing page')&&t.includes('get_board')));
 await page.getByRole('button',{name:'Remove Two from this board'}).click();await page.waitForFunction(()=>document.querySelectorAll('.board-items li').length===1);
 // edit with a description, and a refused duplicate name is explained in the dialog
 await page.getByRole('button',{name:'Edit',exact:true}).click();const form=page.locator('#board-dialog');await form.getByLabel('Name').fill('Landing site');await form.getByLabel(/What is this board for/).fill('Marketing site starter');await form.getByRole('button',{name:'Save'}).click();
 await page.waitForFunction(()=>document.querySelector('.board-title')?.textContent==='Landing site');assert.equal(await page.locator('.board-description').textContent(),'Marketing site starter');
 await page.getByRole('button',{name:'Edit',exact:true}).click();failNext=409;await form.getByRole('button',{name:'Save'}).click();await page.waitForFunction(()=>/already have a board/.test(document.querySelector('#board-dialog .boards-status')?.textContent||''));assert(await form.isVisible(),'the dialog stays open on an error');await form.getByRole('button',{name:'Cancel'}).click();
 // copy the assistant prompt
 await page.evaluate(()=>{window.__copied=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copied=t}},configurable:true})});
 await page.getByRole('button',{name:'Copy',exact:true}).click();await page.waitForFunction(()=>window.__copied);assert.match(await page.evaluate(()=>window.__copied),/"Landing site".*get_board/s);
 // back to the list, then delete: the projects stay in the collection
 await page.getByRole('button',{name:'← All boards'}).click();assert.equal(await page.locator('.board-card').count(),2);
 await page.locator('.board-card',{hasText:'Dashboard'}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.board-card').length===1);
 await page.locator('[data-collection-mode="all"]').click();assert(await page.locator('#grid').isVisible());assert.equal(await page.locator('#grid .card').count(),2,'deleting a board never removes projects');
 assert(!(await page.locator('#boards-panel').isVisible()));
 // mobile layout
 await page.setViewportSize({width:390,height:844});await page.locator('[data-collection-mode="boards"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll on mobile');await page.screenshot({path:'boards-mobile.png'});
 await page.locator('[data-collection-mode="all"]').click();await page.locator('#grid [data-board-add="team/one"]').click();assert(await page.evaluate(()=>{const r=document.querySelector('#board-picker').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}),'the picker fits a phone');await page.locator('#board-picker').getByRole('button',{name:'Done'}).click();
 // signed out: a prompt to sign in, no board requests, no card buttons
 signedIn=false;const before=writes.length;const out=await context.newPage();out.on('pageerror',e=>errors.push(e.message));await out.goto(base);await out.waitForFunction(()=>RepoAccount.ready);await settleBrowse(out);await out.locator('[data-view="collection"]').click();await out.locator('[data-collection-mode="boards"]').click();
 assert(await out.getByRole('heading',{name:'Sign in to use boards'}).isVisible());assert.equal(await out.locator('[data-board-add]').count(),0);assert.equal(writes.length,before);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: Boards tab, add-to-board from cards (many boards per item), open/edit/remove/delete, error messages, assistant prompt copy, signed-out state and mobile layout.');
}finally{await browser?.close();server.kill('SIGTERM')}
