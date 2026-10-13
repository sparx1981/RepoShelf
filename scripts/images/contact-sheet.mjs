import {mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {root,work,json,prompts} from './common.mjs';
import {xml} from '../../dist/studio/core.mjs';
const rows=await prompts(),manifest=await json(new URL('manifest.json',work),{}),out=new URL('artifacts/images/',root);await mkdir(out,{recursive:true});
for(const category of [...new Set(rows.map(r=>r.category))]){const group=rows.filter(r=>r.category===category&&manifest[r.id]);if(!group.length)continue;const layers=[],height=Math.ceil(group.length/4)*170;for(let i=0;i<group.length;i++){const row=group[i],left=i%4*250,top=Math.floor(i/4)*170;layers.push({input:await sharp(new URL(`raw/${row.id}.png`,work).pathname,{limitInputPixels:20000000}).resize(250,140,{fit:'cover'}).png().toBuffer(),left,top});layers.push({input:Buffer.from(`<svg width="250" height="30"><rect width="250" height="30" fill="#101113"/><text x="8" y="20" font-size="11" fill="white">${xml(row.id)}</text></svg>`),left,top:top+140})}await sharp({create:{width:1000,height,channels:3,background:'#101113'}}).composite(layers).png().toFile(new URL(category.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.png',out).pathname)}
console.log('Contact sheets saved to artifacts/images/.');
