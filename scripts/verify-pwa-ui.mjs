import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const port=4397,base=`http://127.0.0.1:${port}`;
const launchServer=()=>spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});let server=launchServer(),browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 // Public offline page shares the real registration and install UI without account fixtures.
 await page.goto(base+'/offline.html');
 const manifest=await (await page.request.get(base+'/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/');
 for(const icon of [...manifest.icons,{src:'/icons/apple-touch-icon.png',sizes:'180x180'}]){const response=await page.request.get(base+icon.src);assert(response.ok());assert.match(response.headers()['content-type'],/image\/png/);const data=await response.body();assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(data.readUInt32BE(20),Number(icon.sizes.split('x')[1]))}
 const swResponse=await page.request.get(base+'/sw.js');assert.match(swResponse.headers()['cache-control'],/no-cache/);
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL),base+'/sw.js');
 await page.evaluate(()=>fetch('/api/auth').then(r=>r.text()));
 const paths=await page.evaluate(async()=>{const cache=await caches.open('reposhelf-install-v1');return (await cache.keys()).map(r=>new URL(r.url).pathname)});assert.deepEqual(paths.sort(),['/offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png'].sort());
 // Chromium's emulated offline mode does not reliably affect a worker's network target.
 // Stop the real origin to prove the fallback works on an actual failed fetch.
 await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});await page.goto(base+'/?project=team%2Fexample');assert.match(await page.locator('h1').textContent(),/Your library/);assert.equal(await page.locator('a').getAttribute('href'),'');server=launchServer();await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});await page.goto(base+'/offline.html');
 // Use the real storefront markup and install script in isolation for platform UI checks.
 const html=await (await page.request.get(base+'/')).text();assert.match(html,/apple-touch-icon/);assert.match(html,/rel="manifest"/);
 await page.setContent(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));await page.addScriptTag({url:base+'/pwa.js'});
 await page.locator('#install-app-button').click();assert.match(await page.locator('#install-instructions').textContent(),/Chrome/);await page.locator('#install-app .close').click();
 await page.evaluate(()=>{const event=new Event('beforeinstallprompt');event.prompt=async()=>{window.__promptCount=(window.__promptCount||0)+1};event.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(event)});await page.locator('#install-app-button').click();assert(await page.locator('#install-native').isVisible());await page.locator('#install-native').click();assert.equal(await page.evaluate(()=>window.__promptCount),1);assert(await page.locator('#install-native').isHidden());await page.locator('#install-app .close').click();
 await page.evaluate(()=>{Object.defineProperty(navigator,'userAgent',{value:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',configurable:true})});await page.locator('#install-app-button').click();assert.match(await page.locator('#install-instructions').textContent(),/Safari/);assert.match(await page.locator('#install-instructions').textContent(),/Add to Home Screen/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#install-app .close').click();
 await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));assert(await page.locator('#install-app-button').isHidden());await context.close();
 console.log('PASS: install manifest, Android and Apple PNG sizes, root service worker, offline retry, no private/API caches, Android install gesture/dismissal, iOS guidance and installed-state UI.');
}finally{await browser?.close();server.kill('SIGTERM')}
