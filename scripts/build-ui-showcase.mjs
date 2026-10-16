// Builds the original UI showcase: preview pages (dist/ui/s/), thumbnails (dist/ui/thumbs/) and the
// catalogue rows mixed into the front of dist/ui/index.json.
// Usage: node scripts/build-ui-showcase.mjs [--no-thumbs] [id ...]      (thumbnails need Playwright)
import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {showcase,showcaseRow,showcasePreview} from '../lib/ui-showcase/index.mjs';
const dist=new URL('../dist/',import.meta.url),pages=new URL('ui/s/',dist),thumbs=new URL('ui/thumbs/',dist);
const args=process.argv.slice(2),skipThumbs=args.includes('--no-thumbs'),only=args.filter(a=>!a.startsWith('--'));
await mkdir(pages,{recursive:true});await mkdir(thumbs,{recursive:true});
for(const item of showcase)await writeFile(new URL(item.id+'.html',pages),showcasePreview(item.id));

// Mix the showcase in at the front of the list, alternating with the existing components.
const indexUrl=new URL('ui/index.json',dist),current=JSON.parse(await readFile(indexUrl,'utf8')).filter(i=>!i.s),rows=showcase.map(showcaseRow),mixed=[];
rows.forEach((row,i)=>{mixed.push(row);if(current[i])mixed.push(current[i])});mixed.push(...current.slice(rows.length));
await writeFile(indexUrl,JSON.stringify(mixed));
console.log(`Wrote ${showcase.length} previews and mixed them into ${current.length} existing components.`);

if(!skipThumbs){
 const {chromium}=await import(process.env.REPOSHELF_PLAYWRIGHT_MODULE||'playwright');
 const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://x').pathname;res.setHeader('content-type','text/html');res.end(await readFile(new URL('.'+path,dist)))}catch{res.statusCode=404;res.end('missing')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.REPOSHELF_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:680,height:425},deviceScaleFactor:1.5}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const sheet=[];
  for(const item of showcase.filter(i=>!only.length||only.includes(i.id))){
   await page.goto(base+'/ui/s/'+item.id+'.html');await page.waitForTimeout(120);
   const t=item.thumb||{};if(t.eval)await page.evaluate(t.eval);if(t.drag){await page.mouse.move(...t.drag[0]);await page.mouse.down();await page.mouse.move(...t.drag[1],{steps:10})}if(t.path)for(const pt of t.path)await page.mouse.move(pt[0],pt[1],{steps:t.steps||12});if(t.hover)await page.hover(t.hover,t.pos?{position:t.pos}:undefined);if(t.click)await page.click(t.click,t.pos?{position:t.pos}:undefined);
   await page.waitForTimeout(t.wait??700);
   const png=await page.screenshot();let quality=80,webp;do{webp=await sharp(png).resize(520,325).webp({quality}).toBuffer();quality-=10}while(webp.length>24000&&quality>30);
   await writeFile(new URL(item.id+'.webp',thumbs),webp);sheet.push(await sharp(png).resize(346,216).png().toBuffer());console.log(item.id.padEnd(28),webp.length);
  }
  if(errors.length)throw Error('Page errors: '+errors.join('; '));
  const cols=4,rows2=Math.ceil(sheet.length/cols);await mkdir(new URL('../artifacts/ui-showcase/',import.meta.url),{recursive:true});
  await sharp({create:{width:cols*346,height:rows2*216,channels:3,background:'#888'}}).composite(sheet.map((input,i)=>({input,left:(i%cols)*346,top:Math.floor(i/cols)*216}))).png().toFile(new URL('../artifacts/ui-showcase/contact-sheet.png',import.meta.url).pathname);
 }finally{await browser.close();server.close()}
}
