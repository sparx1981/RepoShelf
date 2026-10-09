import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=4498,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
let browser,trafficCalls=0,fullCalls=0,overviewCalls=0,admin=true;const errors=[];
const period={visits:5,visitors:3,uniqueVisitors:2,page_views:10,listing_views:6,demo_clicks:4,fork_clicks:2,searches:3,complete:true};
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(Error('Server exited')))});
 browser=await chromium.launch();const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1050}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();const done=json=>route.fulfill({json});
  if(u.pathname==='/api/auth')return done({enabled:true,analyticsEnabled:true,user:{id:'owner',admin,githubConnected:false}});
  if(u.pathname==='/api/collection')return done({items:[],nextCursor:null});
  if(u.pathname==='/api/forks')return done({items:[],sync:{lastAttemptAt:new Date().toISOString()}});
  if(u.pathname==='/api/editorial')return done({rows:[],customRows:false,items:[],targets:[],nextOffset:null});
  if(u.pathname==='/api/sync-log')return done({runs:[],page:1,publication:{},health:null});
  if(u.pathname==='/api/analytics'){
   const action=u.searchParams.get('action');
   if(action==='overview'){overviewCalls++;return done({configured:true,checkedAt:new Date().toISOString(),users:8,publicCount:42,catalogueSummaryAt:new Date().toISOString(),periods:[1,7,30,180,365].map(days=>({days,current:period,previous:{...period,demo_clicks:2},signups:2,previousSignups:1})),catalogueGrowth:[1,7,30,180,365].map(days=>({days,current:4,previous:2})),operations:{lastSyncAt:new Date(Date.now()-3600000).toISOString(),nextSyncAt:new Date(Date.now()+600000).toISOString(),lastSyncGrowth:4,publication:{lastPublishedAt:new Date(Date.now()-7200000).toISOString()}}})}
   if(action==='traffic'){trafficCalls++;assert.equal(u.searchParams.get('refresh'),'1');return done({configured:true,checkedAt:new Date().toISOString(),current:{...period,page_views:10+trafficCalls},previous:{...period,page_views:5},daily:[{day:'2026-10-09',...period}],searchTerms:[{term:'react templates',source:'website',searches:3},{term:'dashboard',source:'mcp',searches:4}],countries:[{country:'GB',page_views:5}]})}
   fullCalls++;return done({daily:[],totalLikes:2,likesAdded:1,coverage:{availableProjects:42,withDemo:42,readmesSaved:42,supportingContextsSaved:40},growth:[],trackingEnabled:true,conversions:{configured:false},connector:{state:'not_configured'},checkedAt:new Date().toISOString()});
  }
  return route.continue();
 });
 await page.goto(base+'/admin.html');try{await page.waitForSelector('.overview-table')}catch(e){console.error({errors,overviewCalls,content:await page.locator('body').innerText()});throw e}assert(await page.locator('#overview-panel').isVisible());assert.equal(await page.locator('.admin-tabs button').first().textContent(),'Overview');assert.equal(await page.locator('.overview-table').count(),4);assert.equal(await page.locator('.overview-table tbody tr').count(),20);
 await page.screenshot({path:'admin-overview-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overview fits mobile');await page.screenshot({path:'admin-overview-mobile.png',fullPage:true});
 await page.locator('#overview-panel [data-admin-tab="analytics"]').click();await page.waitForSelector('#traffic-live .metric');assert.equal(await page.locator('#analytics-range option').count(),6);assert.match(await page.locator('#traffic-live').textContent(),/\+120%/);assert.match(await page.locator('#traffic-live').textContent(),/United Kingdom/);assert.match(await page.locator('#traffic-live').textContent(),/AI connector/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Analytics fits mobile');await page.screenshot({path:'admin-analytics-period-mobile.png',fullPage:true});
 const before=trafficCalls,details=fullCalls;await page.clock.fastForward(60000);await page.waitForFunction(()=>document.querySelector('#analytics-updated').textContent.startsWith('Traffic updated'));assert.equal(trafficCalls,before+1,'Fresh traffic requested at one minute');assert.equal(fullCalls,details,'Minute refresh does not reload heavyweight reports');
 for(const value of ['1','180','365']){await page.locator('#analytics-range').selectOption(value);await page.waitForFunction(()=>document.querySelector('#analytics-updated').textContent.startsWith('Updated'));}
 await page.locator('.admin-tabs [data-admin-tab="overview"]').click();await page.waitForFunction(()=>document.querySelector('#overview-updated').textContent.startsWith('Updated'));const calls=overviewCalls;await page.clock.fastForward(60000);await page.waitForFunction(()=>document.querySelector('#overview-updated').textContent.startsWith('Updated'));assert.equal(overviewCalls,calls+1,'Overview refreshes every minute');
 admin=false;await page.evaluate(()=>RepoAccount.refresh());assert(await page.locator('#admin-workspace').isHidden());assert.equal(await page.locator('#overview-content').textContent(),'','Private Overview is cleared on role loss');assert.equal(await page.locator('#analytics-content').textContent(),'');
 assert.deepEqual(errors,[]);console.log('PASS: Overview landing tab, 20 growth rows, date filters, preceding-period notes, country/search reports, one-minute fresh requests, cheap polling, privacy on role loss and mobile layouts.');
}finally{await browser?.close();server.kill()}
