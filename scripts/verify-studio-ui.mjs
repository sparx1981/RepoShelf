import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPromptsHandler} from '../api/prompts.mjs';
const {chromium}=await import(process.env.REPOSHELF_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.REPOSHELF_STUDIO_TEST_URL||'http://127.0.0.1:3000';
const out=new URL('../.impeccable/review/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium',executablePath:process.env.REPOSHELF_CHROMIUM_PATH,args:['--no-sandbox']}),errors=[],metrics={};
const member={id:'00000000-0000-0000-0000-000000000002',name:'Studio tester',githubConnected:true,providers:['github']};let signedIn=false,legalRequired=false;
const handler=createPromptsHandler({accounts:{config:{origin:base},legal:{active:true,acceptance:true,version:'fixture'},async user(){if(!signedIn)throw Object.assign(Error('Sign in.'),{status:401});return member},async request(path){if(path.startsWith('/rest/v1/legal_acceptances'))return legalRequired?[]:[{accepted_at:'2026-10-13'}];throw Error('Unexpected fixture request '+path)}}});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block',acceptDownloads:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:true,analyticsEnabled:false,user:signedIn?member:null,legal:{active:true,required:legalRequired}}});if(u.pathname==='/api/collection')return route.fulfill({json:route.request().method()==='GET'?{items:[],nextCursor:null}:{liked:true}});if(u.pathname==='/api/forks')return route.fulfill({json:{items:[],sync:{lastAttemptAt:new Date().toISOString()}}});if(u.pathname==='/api/prompts'){const result={headers:{},getHeader(){},setHeader(){},writeHead(s,h){this.status=s;this.headers=h},end(b){this.body=b}};await handler({method:route.request().method(),url:u.pathname+u.search,headers:{}},result);return route.fulfill({status:result.status,headers:result.headers,body:result.body})}return route.continue()});
 await page.addInitScript(()=>localStorage.setItem('reposhelf.analytics.consent.v2','no'));
 await page.goto(base+'/studio.html');await page.waitForFunction(()=>document.querySelector('#background-count').textContent.includes('100 backgrounds'));
 await page.locator('#gradient-canvas').screenshot({path:new URL('gradient-canvas.png',out).pathname});
 await page.screenshot({path:new URL('desktop.png',out).pathname,fullPage:true});
 assert.equal(await page.locator('#gradient-colours input[type=color]').count(),4);
 await page.locator('#gradient-type').selectOption('conic');await page.locator('#gradient-add-colour').click();assert.equal(await page.locator('#gradient-colours input[type=color]').count(),5);
 await page.locator('#gradient-type').selectOption('mesh');const before=await page.locator('#gradient-point-controls input').count();await page.locator('#gradient-add-point').click();assert.equal(await page.locator('#gradient-point-controls input').count(),before+2);
 await page.locator('[data-export="gradient:png"]').click();await page.locator('#account').waitFor({state:'visible'});assert.match(await page.locator('#account a[href^="/api/auth?action=start"]').first().getAttribute('href'),/return=%2Fstudio.html/);await page.locator('#account .close').click();
 await page.locator('#studio-tab-ramps').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#studio-tab-ascii').getAttribute('aria-selected'),'true');
 await page.locator('#ascii-text').fill('HELLO');assert.match(await page.locator('#ascii-dimensions').textContent(),/100 columns/);await page.locator('#ascii-dither').check();
 await page.locator('#studio-tab-ramps').click();assert.equal(await page.locator('#ramp-contrast tr').count(),11);await page.locator('#ramp-hex').fill('#3578ff');assert.equal(await page.locator('#ramp-colour').inputValue(),'#3578ff');
 await page.locator('#studio-tab-backgrounds').click();assert.equal(await page.locator('#background-grid li').count(),24);await page.locator('#background-category').selectOption('Mesh');assert.equal(await page.locator('#background-grid li').count(),20);await page.locator('#background-grid .studio-item-open').first().click();await page.locator('#background-editor').waitFor({state:'visible'});await page.locator('#background-edit').click();assert.equal(await page.locator('#gradient-type').inputValue(),'mesh');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL('mobile.png',out).pathname,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Studio fits the mobile viewport');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#gradient-animate').check();await page.waitForTimeout(250);assert.equal(await page.locator('#gradient-canvas').evaluate(e=>getComputedStyle(e).animationName),'none');
 signedIn=true;await page.reload();await page.waitForFunction(()=>window.RepoAccount.user?.id);await page.locator('#studio-tab-gradient').click();
 const start=Date.now(),download=page.waitForEvent('download');await page.locator('[data-export="gradient:png"]').click();const png=await download;assert.equal(png.suggestedFilename(),'reposhelf-background.png');metrics.pngMs=Date.now()-start;await png.saveAs(new URL('export.png',out).pathname);
 await page.locator('#studio-tab-ramps').click();const json=page.waitForEvent('download');await page.locator('[data-export="ramps:json"]').click();assert.equal((await json).suggestedFilename(),'reposhelf-colours.json');
 await page.locator('#studio-tab-ascii').click();const text=page.waitForEvent('download');await page.locator('[data-export="ascii:txt"]').click();assert.equal((await text).suggestedFilename(),'reposhelf-ascii.txt');
 // Tool edits continue with the network unavailable; exports still need server authorisation.
 await context.setOffline(true);await page.locator('#ascii-text').fill('LOCAL');assert.ok((await page.locator('#ascii-preview').textContent()).length>100);await page.locator('#studio-tab-ramps').click();await page.locator('#ramp-hex').fill('#abcdef');assert.equal(await page.locator('#ramp-colour').inputValue(),'#abcdef');await context.setOffline(false);
 assert.deepEqual(errors,[]);await writeFile(new URL('verification.json',out),JSON.stringify({errors,metrics,verified:['gradient and mesh controls','keyboard tabs','guest sign-in return','colour ramps','ASCII and dithering','background filters and editing','mobile overflow','reduced motion','member PNG/JSON/text downloads','local editing offline']},null,2));
 console.log(`PASS: Studio browser flows on desktop and mobile; member PNG export ${metrics.pngMs} ms; no console errors.`);
 await context.close();
}finally{await browser.close()}
