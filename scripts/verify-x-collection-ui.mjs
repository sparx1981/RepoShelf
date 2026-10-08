import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const port=4412,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let browser;
try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'/admin.html');
  await page.evaluate(()=>{
    document.querySelector('#admin-workspace').hidden=false;
    window.xTest={enabled:false,revision:1,writes:0};
    RepoAccount.user={admin:true};
    RepoAccount.request=async (url,options)=>{if(!url.includes('x-settings'))return {};if(options?.method==='POST'){const input=JSON.parse(options.body);if(input.revision!==xTest.revision)throw Error('Changed');xTest.enabled=input.enabled;xTest.revision++;xTest.writes++;}return {settings:{enabled:xTest.enabled,revision:xTest.revision}};};
    window.dispatchEvent(new Event('reposhelf-account'));
  });
  await page.waitForSelector('#x-collection-enabled');
  assert.equal(await page.isChecked('#x-collection-enabled'),false);
  await page.check('#x-collection-enabled');await page.getByRole('button',{name:'Save X.com scanning',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#x-collection-message')?.textContent.includes('enabled'));
  assert.equal(await page.evaluate(()=>xTest.enabled),true);
  await page.uncheck('#x-collection-enabled');await page.getByRole('button',{name:'Save X.com scanning',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#x-collection-message')?.textContent.includes('disabled'));
  assert.equal(await page.evaluate(()=>xTest.writes),2);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>{RepoAccount.user=null;window.dispatchEvent(new Event('reposhelf-account'));});
  assert.equal(await page.locator('#x-collection-settings').textContent(),'');
  console.log('PASS: mobile administrator scanning toggle, enable/disable saves, schedule explanation and signout clearing.');
}finally{await browser?.close();server.kill('SIGTERM');}
