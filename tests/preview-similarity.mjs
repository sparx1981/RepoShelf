import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {similarPreview} from '../scripts/preview-similarity.mjs';
const sharp=createRequire(import.meta.url)('sharp');
// A page-like picture: a dark sidebar, a heading bar and a grid of cards, so the 96 by 60 comparison has real structure to see.
async function page({banner=false,shift=0,quality=60,noise=0}={}){
 const layers=[{input:{create:{width:200,height:600,channels:3,background:'#1f2937'}},left:0,top:0},{input:{create:{width:700,height:70,channels:3,background:'#e5e7eb'}},left:230,top:20}];
 for(let r=0;r<2;r++)for(let c=0;c<3;c++)layers.push({input:{create:{width:210,height:200,channels:3,background:{r:80+c*50+shift,g:120+r*40,b:200-c*30}}},left:230+c*232,top:130+r*230});
 if(banner)layers.push({input:{create:{width:960,height:60,channels:3,background:'#000000'}},left:0,top:0});
 const base=await sharp({create:{width:960,height:600,channels:3,background:'#ffffff'}}).composite(layers).jpeg({quality}).toBuffer();
 if(!noise)return base;
 const {data,info}=await sharp(base).raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=97)data[i]=Math.min(255,data[i]+noise);
 return sharp(data,{raw:info}).jpeg({quality}).toBuffer();
}
const saved=await page();
assert.equal(await similarPreview(saved,await page({quality:75})),true,'the same page saved with a different JPEG quality is the same picture');
assert.equal(await similarPreview(saved,await page({noise:6})),true,'scattered compression noise is not a change');
assert.equal(await similarPreview(saved,await page({shift:1})),true,'a one-level colour wobble is not a change');
assert.equal(await similarPreview(saved,await page({banner:true})),false,'a new banner across the top replaces the picture');
assert.equal(await similarPreview(saved,await page({shift:90})),false,'a different colour scheme replaces the picture');
assert.equal(await similarPreview(saved,await sharp({create:{width:960,height:600,channels:3,background:'#c00000'}}).jpeg().toBuffer()),false,'an error page replaces the picture');
assert.equal(await similarPreview(null,saved),false,'with no saved picture the capture is saved');
assert.equal(await similarPreview(saved,Buffer.from('not an image')),false,'unreadable bytes are never treated as the same');
assert.equal(await similarPreview(Buffer.from('not an image'),saved),false,'an unreadable saved picture is replaced');
console.log('PASS: a recapture that looks the same keeps the saved screenshot; banners, new layouts, error pages and unreadable files replace it.');
