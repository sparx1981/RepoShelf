import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const port=4412,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
  let signedIn=true,enabled=false,revision=1,writes=0,scans=0;
  await page.route('**/api/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/api/auth')return route.fulfill({json:{enabled:true,user:signedIn?{id:'00000000-0000-0000-0000-000000000001',admin:true,githubConnected:true,name:'Owner'}:null}});
    if(u.pathname==='/api/editorial'&&u.searchParams.get('action')==='x-settings'){
      if(route.request().method()==='POST'){const input=route.request().postDataJSON();assert.equal(input.revision,revision);enabled=input.enabled;revision++;writes++;}
      return route.fulfill({json:{settings:{enabled,revision}}});
    }
    if(u.pathname==='/api/editorial'&&u.searchParams.get('action')==='x-scan'){assert(enabled);assert.equal(route.request().method(),'POST');scans++;return route.fulfill({status:202,json:{requested:true,reason:'Scan requested.'}});}
    if(u.pathname==='/api/editorial')return route.fulfill({json:{customRows:false,rows:[],builtinSetupRequired:false}});
    if(u.pathname==='/api/sync-log')return route.fulfill({json:{runs:[],hasMore:false}});
    return route.fulfill({json:{items:[]}});
  });
  await page.goto(base+'/admin.html?tab=sync');
  await page.waitForSelector('#x-collection-enabled');
  assert.equal(await page.isChecked('#x-collection-enabled'),false);
  await page.check('#x-collection-enabled');await page.getByRole('button',{name:'Save X.com scanning',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#x-collection-message')?.textContent.includes('enabled'));
  assert.equal(enabled,true);
  await page.getByRole('button',{name:'Scan now',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#x-collection-message')?.textContent==='Scan requested.');
  assert.equal(scans,1);assert(await page.locator('#x-scan-now').isDisabled());
  await page.uncheck('#x-collection-enabled');await page.getByRole('button',{name:'Save X.com scanning',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#x-collection-message')?.textContent.includes('disabled'));
  assert.equal(writes,2);assert.equal(await page.locator('#x-scan-now').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  signedIn=false;
  await page.evaluate(()=>RepoAccount.refresh());
  assert.equal(await page.locator('#x-collection-settings').textContent(),'');
  console.log('PASS: mobile administrator scanning toggle, immediate scan dispatch, duplicate-click protection, hiding on disable and signout clearing.');
}finally{await browser?.close();server.kill('SIGTERM');}
