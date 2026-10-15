// Renders thumbnails for Studio's live backgrounds (dist/studio/thumbs/<id>.webp) from the actual
// shaders, plus a contact sheet in artifacts/studio-live/ for review.
// Usage: node scripts/build-live-thumbs.mjs [id ...]      (needs Playwright with Chromium)
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {liveItems} from '../dist/studio/live-shaders.mjs';
const {chromium}=await import(process.env.REPOSHELF_PLAYWRIGHT_MODULE||'playwright');
const root=new URL('../dist/',import.meta.url),out=new URL('studio/thumbs/',root),sheets=new URL('../artifacts/studio-live/',import.meta.url);
const types={'.mjs':'text/javascript','.js':'text/javascript'};
const page_html=`<!doctype html><canvas id=c width=640 height=360></canvas><script type=module>
import {createRunner} from '/studio/live-runner.mjs';
import {liveFragment,PRELUDE} from '/studio/live-shaders.mjs';
window.renderShader=(id,params,time)=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const runner=createRunner(canvas,liveFragment(id),{fixed:true,keep:true,params,pointer:false});runner.draw(time);const url=canvas.toDataURL('image/png');runner.release();return url};
window.ready=true;</script>`;
const server=http.createServer(async(req,res)=>{const path=new URL(req.url,'http://x').pathname;if(path==='/__thumb'){res.setHeader('content-type','text/html');return res.end(page_html)}try{const ext=path.slice(path.lastIndexOf('.'));res.setHeader('content-type',types[ext]||'application/octet-stream');res.end(await readFile(new URL('.'+path,root)))}catch{res.statusCode=404;res.end('missing')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.REPOSHELF_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:700,height:420}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errors.push(m.text())});
 await page.goto(base+'/__thumb');await page.waitForFunction(()=>window.ready);
 const only=process.argv.slice(2),selected=liveItems.filter(i=>!only.length||only.includes(i.id));
 await mkdir(out,{recursive:true});await mkdir(sheets,{recursive:true});
 const tiles=[];
 for(const item of selected){
  const url=await page.evaluate(([id,params,time])=>window.renderShader(id,params,time),[item.id,item.defaults,item.thumbTime]);
  const png=Buffer.from(url.split(',')[1],'base64');
  let quality=78,webp;do{webp=await sharp(png).webp({quality,effort:6}).toBuffer();quality-=8}while(webp.length>19000&&quality>20);
  await writeFile(new URL(item.id+'.webp',out),webp);tiles.push({input:await sharp(png).resize(320,180).png().toBuffer()});
  console.log(item.id.padEnd(16),webp.length,'bytes');
 }
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
 const cols=4,rows=Math.ceil(tiles.length/cols);
 await sharp({create:{width:cols*320,height:rows*180,channels:3,background:'#000'}}).composite(tiles.map((t,i)=>({...t,left:(i%cols)*320,top:Math.floor(i/cols)*180}))).png().toFile(new URL('contact-sheet.png',sheets).pathname);
}finally{await browser.close();server.close()}
