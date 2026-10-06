import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const port=4421,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser,providers=['github'],confirmed=0,cancelled=0,closed=true;
try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(Error('Server exited')))});browser=await chromium.launch();
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{const u=new URL(route.request().url()),method=route.request().method();if(u.origin!==base)return route.abort();
 if(u.pathname==='/api/auth'){const action=u.searchParams.get('action');if(action==='data-state')return route.fulfill({json:{ready:true}});if(action==='legal')return route.fulfill({json:{active:false}});
  if(action==='merge-preview')return route.fulfill({json:{ok:true,provider:'google',counts:{likes:3,history:5,forks:0,submissions:1,promotions:0},keeps:'owner'}});
  if(action==='merge-confirm'){confirmed++;return route.fulfill({json:{merged:true,closed,moved:{likes:3},reconnect:'google'}})}
  if(action==='merge-cancel'){cancelled++;return route.fulfill({json:{cancelled:true}})}
  return route.fulfill({json:{enabled:true,analyticsEnabled:true,googleEnabled:true,user:{id:'1',name:'owner',githubConnected:providers.includes('github'),providers,admin:false},legal:{active:false,required:false}}})}
 if(u.pathname==='/api/collection'||u.pathname==='/api/forks')return route.fulfill({json:{items:[],nextCursor:null,sync:{}}});return route.continue()});
await page.addInitScript(()=>localStorage.setItem('reposhelf.analytics.consent.v1','no'));
// the option to merge is offered for the sign-in method this account lacks
await page.goto(base+'/account.html');await page.waitForSelector('#merge-accounts:not([hidden])');const starts=page.locator('#merge-starts a');assert.equal(await starts.count(),1);assert.match(await starts.first().textContent(),/separate Google account/);assert.equal(await starts.first().getAttribute('href'),'/api/auth?action=merge-start&provider=google');assert(await page.locator('#merge-panel').isHidden());
// a signed-in-with-both account has nothing to merge
providers=['github','google'];await page.reload();await page.waitForFunction(()=>RepoAccount.ready);await page.waitForTimeout(400);assert(await page.locator('#merge-accounts').isHidden(),'Hidden when both methods are connected');providers=['github'];
// blocked and failed outcomes explain themselves
await page.goto(base+'/account.html?merge=blocked&reason=promotions_active');await page.waitForSelector('#merge-accounts:not([hidden])');assert.match(await page.locator('#merge-status').textContent(),/promotion is reserved or running/);
await page.goto(base+'/account.html?merge=failed');await page.waitForSelector('#merge-accounts:not([hidden])');assert.match(await page.locator('#merge-status').textContent(),/could not be confirmed/);
// ready: summary, typed confirmation, cancel
await page.goto(base+'/account.html?merge=ready');await page.waitForSelector('#merge-panel:not([hidden])');const summary=await page.locator('#merge-summary').textContent();assert.match(summary,/3 liked projects, 5 recently viewed items, 1 repository submissions/);assert.match(summary,/cannot be undone/);assert(!/forks/.test(summary.split('moves')[1].split('into')[0]),'Zero counts are not listed');assert(await page.locator('#merge-starts').isHidden());assert(await page.locator('#merge-run').isDisabled());
await page.locator('#merge-confirmation').fill('merge');assert(await page.locator('#merge-run').isDisabled(),'Lower case does not unlock the button');await page.screenshot({path:'merge-mobile.png'});
await page.locator('#merge-cancel').click();await page.waitForFunction(()=>document.querySelector('#merge-panel').hidden);assert.equal(cancelled,1);assert.match(await page.locator('#merge-status').textContent(),/Nothing was changed/);
// confirm: runs once, then reconnects the merged sign-in method
await page.goto(base+'/account.html?merge=ready');await page.waitForSelector('#merge-panel:not([hidden])');await page.locator('#merge-confirmation').fill('MERGE');assert(await page.locator('#merge-run').isEnabled());
const reconnect=page.waitForRequest(r=>r.url().includes('action=link-google'),{timeout:8000});await page.locator('#merge-run').click();await page.waitForFunction(()=>/Merged\. Now reconnecting Google/.test(document.querySelector('#merge-status')?.textContent||''));assert.equal(confirmed,1);assert(await reconnect,'The merged sign-in method is reconnected afterwards');
// when the other account could not be closed, nothing redirects
closed=false;await page.goto(base+'/account.html?merge=ready');await page.waitForSelector('#merge-panel:not([hidden])');await page.locator('#merge-confirmation').fill('MERGE');await page.locator('#merge-run').click();await page.waitForFunction(()=>/could not be closed/.test(document.querySelector('#merge-status').textContent));assert(page.url().includes('/account.html'),'No reconnect redirect when closing failed');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Fits a phone screen');assert.deepEqual(errors,[]);
console.log('PASS: merge offers only the missing sign-in method, explains blocked outcomes, requires the typed word MERGE, can be cancelled, reconnects afterwards and fits mobile.');
}finally{await browser?.close();server.kill('SIGTERM')}
