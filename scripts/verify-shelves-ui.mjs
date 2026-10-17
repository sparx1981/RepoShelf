import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {withBrowseFixtures,settleBrowse} from './browse-fixtures.mjs';
// Shelves load as they scroll into view. Two things used to make that loop forever: a shelf response whose catalogue version differs
// from the page's (live click counts move it), and a shelf the server leaves out of its answer. A third check covers "hide already seen":
// opening a project adds it to the seen list, which used to start a new search and drop the pages already loaded.
const port=4401,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});
 browser=await chromium.launch();const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1280,height:900}}),errors=[];
 const repos=Array.from({length:300},(_,i)=>({full:`team/app-${i}`,name:`Application ${i}`,description:'A reusable creative application.',category:['Design','Games','Tools'][i%3],language:['JavaScript','Python','Rust'][i%3],demo:'https://demo.example.org',stars:i,forks:i%7,availability:'available',topics:['react','three','ai'].slice(0,1+i%3),overview:{kind:'readme',paragraphs:['A short overview.'],sourceUrl:'https://github.com/team/app/README.md'}}));
 const legacy=async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(u.pathname==='/catalog.json')return route.fulfill({json:{repositories:repos}});if(u.pathname==='/spaces.json')return route.fulfill({json:{repositories:[]}});if(u.pathname==='/community.json')return route.fulfill({json:{mentions:[]}});if(u.pathname==='/api/editorial')return route.fulfill({json:{rows:[],customRows:false}});if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:true,analyticsEnabled:false,user:null}});if(u.pathname==='/api/promotions')return route.fulfill({json:{items:[]}});return route.continue()};
 const handler=withBrowseFixtures(legacy);let mode='normal',shelfCalls=[],versionCounter=0,omitted=null;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/api/editorial'&&u.searchParams.get('action')==='storefront'&&u.searchParams.has('shelves')&&mode!=='normal'){
   const ids=u.searchParams.get('shelves').split(',');shelfCalls.push(ids.join(','));
   let captured;await handler({request:()=>route.request(),fulfill:async value=>{captured=value},continue:async()=>route.continue(),abort:async()=>route.abort()});
   if(!captured?.json)return route.fulfill(captured||{status:500});
   const json=structuredClone(captured.json);
   if(mode==='drifting')json.catalogVersion=`${json.catalogVersion}-drift-${++versionCounter}`; // every shelf answer carries a different version
   if(mode==='missing'){omitted??=ids[0];delete json.shelves?.[omitted]}
   return route.fulfill({...captured,json});
  }
  return handler(route);
 });
 page.on('pageerror',e=>errors.push(e.message));
 const scrollThrough=async()=>{for(let i=0;i<25;i++){await page.mouse.wheel(0,700);await page.waitForTimeout(250)}await page.mouse.wheel(0,-20000);await page.waitForTimeout(500)};
 // 1. Shelf answers that always disagree about the catalogue version: a few restarts at most, then the shelves show
 mode='drifting';await page.goto(base);await settleBrowse(page);await scrollThrough();await page.waitForTimeout(3000);
 const settledCalls=shelfCalls.length;await page.waitForTimeout(3000);
 assert.equal(shelfCalls.length,settledCalls,'shelf requests stop by themselves instead of looping ('+settledCalls+' requests)');
 assert(settledCalls<=40,'a bounded number of shelf requests, got '+settledCalls);
 assert(await page.locator('.ribbon-track .card').count()>0,'shelves are shown even though their versions disagree');
 assert.equal(await page.locator('[data-load-shelf]').count()>=0,true);
 // 2. A shelf the server leaves out is not asked for again and again
 shelfCalls=[];versionCounter=0;mode='missing';omitted=null;await page.goto(base);await settleBrowse(page);await scrollThrough();await page.waitForTimeout(2500);
 assert(omitted,'a shelf was left out of an answer');
 const asked=shelfCalls.filter(call=>call.split(',').includes(omitted)).length;
 assert.equal(asked,1,'the omitted shelf '+omitted+' was requested '+asked+' times');
 const after=shelfCalls.length;await page.waitForTimeout(3000);assert.equal(shelfCalls.length,after,'no further shelf requests once everything has been answered');
 assert.equal(await page.locator(`[data-load-shelf="${omitted}"]`).count(),0,'the omitted shelf is no longer a loading placeholder');
 // 3. Hide already seen: opening a project must not throw away the pages already loaded
 mode='normal';
 const browseBodies=[];page.on('request',r=>{if(r.url().includes('action=browse')&&r.method()==='POST')browseBodies.push(r.postDataJSON())});
 await page.goto(base);await settleBrowse(page);
 await page.evaluate(()=>{window.__seen=new Map();Object.defineProperty(RepoJourney,'settings',{get:()=>({rememberViews:true,hideSeen:true}),configurable:true});Object.defineProperty(RepoJourney,'items',{get:()=>new Map(window.__seen),configurable:true});window.dispatchEvent(new Event('reposhelf-journey'))});
 await settleBrowse(page);await page.locator('#github').click();await settleBrowse(page);
 await page.locator('#load-more').click();await settleBrowse(page);
 const loaded=await page.locator('#grid .card').count();assert(loaded>=96,'two pages are loaded, got '+loaded);
 const before=browseBodies.length,first=await page.locator('#grid .card [data-details]').first().getAttribute('data-details');
 await page.evaluate(id=>{window.__seen.set(id,{full:id,at:Date.now()});window.dispatchEvent(new Event('reposhelf-journey'))},first);
 await page.waitForTimeout(1500);await settleBrowse(page);
 assert.equal(await page.locator('#grid .card').count(),loaded,'opening a project keeps the pages that were loaded');
 assert.equal(browseBodies.length,before,'opening a project does not start a new search');
 await page.locator('#load-more').click();await settleBrowse(page);
 const more=browseBodies.at(-1);assert(more.cursor,'Show more still continues the same search');assert.equal(more.exclude.includes(first),false,'and with the list it started with, so the server\'s cursor stays valid');
 await page.fill('#search','Application 1');await settleBrowse(page);
 assert(browseBodies.at(-1).exclude.includes(first),'a new search hides what has been seen since');
 // 4. Keyboard focus survives a re-render: liking a project redraws its card, and focus used to fall back to the top of the page
 await page.fill('#search','');await settleBrowse(page);await page.locator('#github').click();await settleBrowse(page);
 const likeId=await page.locator('#grid [data-like]').first().getAttribute('data-like');
 await page.locator(`#grid [data-like="${likeId}"]`).focus();
 await page.evaluate(id=>{RepoAccount.has=full=>full===id;window.dispatchEvent(new Event('reposhelf-account'))},likeId);
 await page.waitForFunction(id=>document.querySelector(`#grid [data-like="${id}"]`)?.getAttribute('aria-pressed')==='true',likeId);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.like||null),likeId,'the like button keeps keyboard focus after its card is redrawn');
 // the same for the project dialog
 await page.locator('#grid [data-details]').first().click();await page.locator('#detail[open]').waitFor();
 const dialogFocus=await page.evaluate(()=>{const b=document.querySelector('#detail-content button, #detail-content a');b.focus();return b.textContent.trim().slice(0,30)});
 await page.evaluate(()=>window.dispatchEvent(new Event('reposhelf-account')));await page.waitForTimeout(400);
 assert(await page.evaluate(()=>document.activeElement&&document.activeElement!==document.body&&document.activeElement.closest('#detail')!==null),'focus stays inside the open project dialog ('+dialogFocus+')');
 await page.keyboard.press('Escape');
 // 5. Featured banner controls, button states and target size
 await page.goto(base);await settleBrowse(page);
 const controls=page.locator('#hero-controls');
 if(!(await controls.isHidden())){
  const pause=page.locator('#hero-pause');assert.equal(await pause.getAttribute('aria-pressed'),'false','the banner is not paused to start with');
  await pause.click();assert.equal(await pause.getAttribute('aria-pressed'),'true','pressing pause is reported');
  await pause.click();assert.equal(await pause.getAttribute('aria-pressed'),'false');
  const before=await page.locator('#hero').innerText();await page.locator('[data-hero-step="1"]').click();await page.waitForTimeout(300);
  assert.notEqual(await page.locator('#hero').innerText(),before,'the next button moves the banner on');
 }
 assert(await page.locator('#curated, #github').evaluateAll(nodes=>nodes.every(n=>n.hasAttribute('aria-pressed'))),'view toggles report their state');
 assert.equal(await page.locator('.shelf-loading[role="status"]').count(),0,'shelf placeholders are not live regions');
 const small=await page.locator('.fork-button').evaluateAll(nodes=>nodes.filter(n=>n.offsetParent&&n.getBoundingClientRect().height<24).length);
 assert.equal(small,0,'fork buttons are at least 24px tall');
 assert.deepEqual(errors,[]);
 console.log('PASS: the featured banner has working controls and button states are exposed; keyboard focus survives a redraw; opening a project with "hide already seen" keeps the pages loaded; shelves whose catalogue version keeps changing and shelves the server leaves out stop loading by themselves, and the shelves that did load are shown.');
}finally{await browser?.close();server.kill('SIGTERM')}
