import http from 'node:http';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
// The Sea Glass components (a port of the open-source Sea Glass playground) in the UI showcase: every glass piece draws, the controls work,
// the pages run without errors, and the playground fits a phone screen.
const dist=new URL('../dist/',import.meta.url),types={'.html':'text/html; charset=utf-8','.json':'application/json','.webp':'image/webp','.js':'text/javascript','.css':'text/css'};
// The pages are plain files, so a static server over dist/ is all they need.
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://x').pathname,file=path==='/'?'/index.html':path;if(file.includes('..'))throw Error('no');const body=await readFile(new URL('.'+file,dist));res.setHeader('content-type',types[file.slice(file.lastIndexOf('.'))]||'application/octet-stream');res.end(body)}catch{res.statusCode=404;res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let browser;
const IDS=['s-sea-glass-buttons','s-sea-glass-toolbar','s-sea-glass-pebbles','s-sea-glass-shapes','s-sea-glass-playground'];
try{
 browser=await chromium.launch();const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon/.test(m.text()))errors.push(m.text())});
 // pixels of a glass piece's canvas, as a short fingerprint
 const painted=selector=>page.locator(selector).first().evaluate(el=>{const c=el.querySelector('canvas');if(!c||!c.width)return null;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,sum=0;for(let i=3;i<d.length;i+=4){if(d[i]>8){n++;sum+=d[i-3]+d[i-2]*3+d[i-1]*7}}return {n,sum}});
 const open=async id=>{await page.goto(`${base}/ui/s/${id}.html`);await page.waitForFunction(()=>[...document.querySelectorAll('[data-glass]')].every(el=>el.querySelector('canvas')?.width>0));await page.waitForTimeout(350)};

 // 1. every page draws all of its glass, with a visible shape and no errors
 for(const id of IDS){
  await open(id);
  const visible=page.locator('[data-glass]:visible'),count=await visible.count();assert(count>=2,id+' has glass pieces');
  for(let i=0;i<count;i++){const info=await visible.nth(i).evaluate(el=>{const c=el.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let k=3;k<d.length;k+=4)if(d[k]>8)n++;return n});assert(info>200,`${id}: glass piece ${i} is drawn (${info} pixels)`)}
  assert.equal(await page.locator('script[type=module], script[src]').count(),0,id+' is one self-contained page');
 }

 // 2. buttons: the save toggle
 await open('s-sea-glass-buttons');
 assert.equal(await page.locator('#sgb-save').getAttribute('aria-pressed'),'false');await page.locator('#sgb-save').click();
 assert.equal(await page.locator('#sgb-save').getAttribute('aria-pressed'),'true');assert.equal((await page.locator('#sgb-save-text').textContent()).trim(),'Moment saved');
 assert.match(await page.locator('#sgb-status').textContent(),/Saved for later/);

 // 3. toolbar: actions are announced and the view switch keeps one choice
 await open('s-sea-glass-toolbar');
 await page.getByRole('button',{name:'Comments'}).click();assert.match(await page.locator('#sgt-status').textContent(),/Comments opened/);
 await page.getByRole('button',{name:'List'}).click();assert.equal(await page.getByRole('button',{name:'List'}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'Grid'}).getAttribute('aria-pressed'),'false');

 // 4. pebbles: choosing a colour repaints the button without moving it
 await open('s-sea-glass-pebbles');
 const before=await painted('#sgk-target'),box=await page.locator('#sgk-target').boundingBox();
 await page.getByRole('button',{name:'Choose lilac glass'}).click();await page.waitForTimeout(200);
 const after=await painted('#sgk-target');assert.notEqual(after.sum,before.sum,'the button changed colour');assert.equal(after.n,before.n,'the outline stayed the same');
 assert.deepEqual(await page.locator('#sgk-target').boundingBox(),box);assert.equal(await page.getByRole('button',{name:'Choose lilac glass'}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'Choose lagoon glass'}).getAttribute('aria-pressed'),'false');

 // 5. shapes: tumble changes the outlines
 await open('s-sea-glass-shapes');
 const flat=await painted('.sgs [data-glass]');await page.locator('#sgs-tumble').fill('60');await page.waitForTimeout(250);
 assert.notEqual((await painted('.sgs [data-glass]')).n,flat.n,'tumble changed the outline');assert.equal(await page.locator('#sgs-tumble-value').textContent(),'6.0%');

 // 6. playground
 await open('s-sea-glass-playground');
 assert.equal(await page.locator('#panel-components [data-glass]').count()>=5,true,'components view');
 const first=await painted('.compose-button');
 await page.locator('#frost').fill('5');await page.waitForTimeout(300);assert.equal(await page.locator('#frost-value').textContent(),'5%','the control reads out its value');assert.notEqual((await painted('.compose-button')).sum,first.sum,'frost changed the glass');
 await page.locator('[data-palette-choice="rose"]').click();await page.waitForTimeout(250);assert.equal(await page.locator('#palette-name').textContent(),'Rose');assert.equal(await page.locator('[data-palette-choice="rose"]').getAttribute('aria-pressed'),'true');
 await page.locator('#tab-shapes').click();assert.equal(await page.locator('#panel-shapes').isVisible(),true);assert.equal(await page.locator('#shape-grid [data-glass]').count(),6,'six pieces on the shape view');
 await page.locator('#tab-context').click();assert.equal(await page.locator('#panel-context').isVisible(),true);
 await page.locator('#tab-components').click();
 assert.equal(await page.locator('#compare').isDisabled(),true,'nothing to compare before pinning');
 await page.locator('#pin').click();assert.equal(await page.locator('#compare').isDisabled(),false);await page.locator('#compare').click();
 await page.locator('#comparison[open]').waitFor();assert.equal(await page.locator('.comparison-card').count(),2,'two directions side by side');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#comparison').open);
 await page.locator('#reset').click();await page.waitForFunction(()=>document.querySelector('#frost-value').textContent==='55%');assert.equal(await page.locator('#frost-value').textContent(),'55%','reset restores the original feel');
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).length),0,'nothing is stored in the browser');

 // 7. the playground fits a phone
 await page.setViewportSize({width:390,height:844});await open('s-sea-glass-playground');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'no sideways scrolling at 390px');

 // 8. they are in the UI catalogue, with their thumbnails, credited
 const index=JSON.parse(await readFile(new URL('../dist/ui/index.json',import.meta.url),'utf8'));
 for(const id of IDS){const row=index.find(r=>r.id===id);assert(row&&row.s===1&&row.f==='Sea Glass',id+' is listed');assert.equal((await fetch(`${base}/ui/thumbs/${id}.webp`)).status,200,id+' has a thumbnail')}
 const licences=await (await fetch(`${base}/licences.html`)).text();assert(/Sea Glass by mttmcknn/.test(licences)&&/Apache License, Version 2\.0/.test(licences)&&/Changes made by RepoShelf/.test(licences),'the licences page credits Sea Glass and carries the licence');
 assert.deepEqual(errors,[]);
 console.log('PASS: the five Sea Glass components draw every glass piece, their controls and the playground work (frost, palette, views, pin and compare, reset), nothing is saved in the browser, the playground fits a phone, and they are listed, credited and licensed under the Apache License.');
}finally{await browser?.close();server.close()}
