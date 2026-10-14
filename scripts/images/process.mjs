import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import sharp from 'sharp';
import {root,work,json,atomic,prompts,digest,flag} from './common.mjs';
const rows=await prompts(),manifest=await json(new URL('manifest.json',work),{}),review=await json(new URL('review.json',work),{}),out=new URL('processed/',work),max=Number(flag('max-bytes','800000000')),index=[];
if(!Number.isSafeInteger(max)||max<1)throw Error('Set a positive --max-bytes budget.');
let total=0,thumbBytes=0;
await mkdir(new URL('thumbs/',out),{recursive:true});
const hashes=new Set();
const animations=await json(new URL('animations.json',work),{});
for(const row of rows){const item=manifest[row.id];if(!item||review[row.id]?.accepted!==true||review[row.id]?.hash!==item.hash)continue;if(hashes.has(item.hash))throw Error('Duplicate accepted original: '+row.id);hashes.add(item.hash);const source=new URL(`raw/${row.id}.png`,work),buffer=await readFile(source);if(digest(buffer)!==item.hash)throw Error('Original changed after review: '+row.id);const folder=new URL(row.id+'/',out);await mkdir(folder,{recursive:true});
 // Preserve the original PNG bytes and their embedded provenance metadata.
 await copyFile(source,new URL('original.png',folder));
 const meta=await sharp(buffer,{limitInputPixels:20000000}).metadata();
 const ratio=row.orientation==='square'?1:9/16;
 for(const [name,width] of [['web',1600],['full',2560]])await sharp(buffer,{limitInputPixels:20000000}).rotate().resize(width,Math.round(width*ratio),{fit:'cover'}).webp({quality:name==='web'?82:88}).toFile(new URL(name+'.webp',folder).pathname);
 let thumb;for(const quality of [65,50,35,20]){thumb=await sharp(buffer,{limitInputPixels:20000000}).resize(640,Math.round(640*ratio),{fit:'cover'}).webp({quality}).toBuffer();if(thumb.length<=30000)break}await writeFile(new URL(`thumbs/${row.id}.webp`,out),thumb);thumbBytes+=thumb.length;
 for(const file of ['original.png','web.webp','full.webp'])total+=(await stat(new URL(file,folder))).size;if(total>max)throw Error(`Assets exceed the ${max}-byte budget. Nothing has been uploaded or published.`);
const colors=row.colors||[],entry={id:row.id,title:row.title,description:row.description,category:row.category,colour:row.colour,colors,dominantColour:colors[0]||null,tags:row.tags,orientation:row.orientation,ai:true,provider:item.provider,model:item.model,date:item.date,width:meta.width,height:meta.height,upscaled:meta.width<2560||meta.height<Math.round(2560*ratio),originalHash:item.hash,files:{web:row.id+'/web.webp',full:row.id+'/full.webp',original:row.id+'/original.png'}};
const motion=animations[row.id];
if(motion?.sourceHash===item.hash&&motion.accepted===true){const loop=await readFile(new URL(`animations/${row.id}/loop.mp4`,work)),preview=await readFile(new URL(`animations/${row.id}/preview.webp`,work));if(digest(loop)!==motion.hash||digest(preview)!==motion.previewHash)throw Error('Animation changed after review: '+row.id);if(loop.length>8000000||preview.length>350000)throw Error('Animation exceeds size budget');await writeFile(new URL('loop.mp4',folder),loop);await mkdir(new URL('motion/',out),{recursive:true});await writeFile(new URL(`motion/${row.id}.webp`,out),preview);thumbBytes+=preview.length;total+=loop.length;entry.files.loop=row.id+'/loop.mp4';entry.animation={width:1280,height:720,seconds:8,method:motion.method,preview:'/studio/images/motion/'+row.id+'.webp'};if(total>max)throw Error('Animations exceed private storage budget.');}
index.push(entry);
}
if(thumbBytes>10000000)throw Error('Thumbnails exceed the 10 MB budget.');
await atomic(new URL('index.json',out),index);await atomic(new URL('sizes.json',out),{images:index.length,privateBytes:total,thumbnailBytes:thumbBytes,maxBytes:max});
console.log(`Processed ${index.length} reviewed images: ${total} private bytes, ${thumbBytes} thumbnail bytes. Files are staged under work/images/processed/.`);
