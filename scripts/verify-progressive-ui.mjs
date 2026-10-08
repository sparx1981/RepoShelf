import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {withBrowseFixtures,settleBrowse} from './browse-fixtures.mjs';
const E=createRequire(import.meta.url)('../dist/editorial.js'),port=4404,base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});browser=await chromium.launch();
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],requests=[];
 const date=new Date().toISOString(),repos=Array.from({length:600},(_,i)=>({full:'team/app-'+i,name:'Application '+i,description:'Build interactive applications.',category:E.categories[i%E.categories.length],language:'JavaScript',demo:'https://example.org/app/'+i,availability:'available',lastCheckedAt:date,stars:1000-i}));
 let failShelves=false;
 const fixtures=withBrowseFixtures(async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(u.pathname==='/catalog.json')return route.fulfill({json:{updatedAt:date,repositories:repos}});if(u.pathname==='/spaces.json')return route.fulfill({json:{repositories:[]}});if(u.pathname==='/community.json')return route.fulfill({json:{mentions:[]}});if(u.pathname==='/api/editorial')return route.fulfill({json:{rows:E.defaults(),customRows:false,builtinSetupRequired:false}});if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:false,analyticsEnabled:false,user:null}});if(['/api/collection','/api/forks','/api/promotions'].includes(u.pathname))return route.fulfill({json:{items:[]}});return route.continue()});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/editorial'&&u.searchParams.get('action')==='storefront'){requests.push(u.search);if(failShelves&&u.searchParams.has('shelves'))return route.fulfill({status:503,json:{error:{message:'Temporary fixture failure'}}})}return fixtures(route)});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await settleBrowse(page);await page.waitForSelector('.ribbon .card');
 assert(await page.locator('[data-load-shelf]').count()>20,'Later shelves are deferred');assert(await page.locator('.ribbon .card').count()<100,'Initial DOM is bounded');assert(await page.locator('*').count()<2000,'Initial DOM meets the limit');
 const before=await page.locator('.ribbon .card').count();await page.evaluate(()=>{window.__firstCard=document.querySelector('.ribbon .card');window.__firstRow=document.querySelector('.ribbon-track');if(window.__firstRow)window.__firstRow.scrollLeft=200});
 await page.evaluate(()=>renderRibbons());assert(await page.evaluate(()=>window.__firstCard===document.querySelector('.ribbon .card')),'Unchanged cards retain their nodes');
 failShelves=true;await page.locator('[data-load-shelf]').first().scrollIntoViewIfNeeded();await page.waitForSelector('[data-retry-shelf]');failShelves=false;await page.locator('[data-retry-shelf]').first().click();await page.waitForFunction(n=>document.querySelectorAll('.ribbon .card').length>n,before);
 assert(requests.some(q=>q.includes('shelves=')),'Progressive requests fetch requested batches');assert(await page.evaluate(()=>window.__firstCard===document.querySelector('.ribbon .card')),'Adding rows preserves earlier card nodes');
 await page.locator('#search').fill('Application 599');await settleBrowse(page);await page.waitForFunction(()=>browseData?.items?.some(r=>r.full==='team/app-599'));assert.equal(await page.locator('#grid .card').count(),1,'Full catalogue search is retained');
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow');assert.deepEqual(errors,[]);
 console.log('PASS: bounded initial DOM, progressive shelf batches, retry recovery, retained card nodes, full search and mobile width.');
}finally{await browser?.close();server.kill('SIGTERM')}
