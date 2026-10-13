import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {recipe,random,svg} from '../dist/studio/core.mjs';
const root=new URL('../',import.meta.url),out=new URL('dist/studio/',root);
const palettes=[
 ['Olive','Green',['#172d28','#6f8871','#d4dbb3','#aabf7e']],['Tide','Blue',['#102b45','#4a87a6','#a5ced1','#567a91']],
 ['Iris','Purple',['#241c3e','#786890','#c6b4cb','#585d95']],['Rose','Pink',['#442d3d','#c186a0','#e5c5bc','#925b77']],
 ['Ember','Orange',['#402a21','#b7764b','#e3bf8d','#925243']],['Linen','Neutral',['#343633','#929788','#e7dfca','#bbb29e']],
 ['Lagoon','Green',['#123c3c','#52978b','#bdc7a2','#3d7777']],['Dusk','Blue',['#182841','#465674','#9ca9c9','#ad9999']],
 ['Heather','Purple',['#302e4d','#8a7395','#bdabc6','#6d82a5']],['Peach','Orange',['#52372f','#d3a181','#ecd4b1','#a56f61']]
];
const families=[['Gradients','linear','Flow'],['Mesh','mesh','Field'],['Grain','radial','Hush'],['Aurora','aurora','Glow'],['Waves','wave','Drift']];
const candidates=[],items=[];
for(let f=0;f<families.length;f++)for(let p=0;p<palettes.length;p++){
 const [name,colour,colors]=palettes[p],[category,type,label]=families[f];const local=[];
 for(let i=0;i<30;i++){
  const seed=100000+f*30000+p*1000+i*17,rnd=random(seed),points=Array.from({length:4+Math.floor(rnd()*3)},()=>({x:Math.round(rnd()*100)/100,y:Math.round(rnd()*100)/100}));
  const r=recipe({type,colors,angle:Math.round(90+rnd()*150),grain:category==='Grain'?12:Math.floor(rnd()*5),seed,points});
  // Prefer space for a headline and well-spaced mesh points; then visually inspect contact sheets.
  const spread=points.reduce((s,a,j)=>s+points.slice(j+1).reduce((t,b)=>t+Math.hypot(a.x-b.x,a.y-b.y),0),0)/points.length;
  const score=spread-(points.filter(a=>a.x<.3&&a.y>.25&&a.y<.75).length*.25)-r.grain*.01;
  const candidate={seed,category,palette:name,recipe:r,score};candidates.push(candidate);local.push(candidate);
 }
 local.sort((a,b)=>b.score-a.score||a.seed-b.seed);
 for(let n=0;n<2;n++){
  const selected=local[n],id=`${name.toLowerCase()}-${label.toLowerCase()}-${n+1}`;
  items.push({id,title:`${name} ${label}${n?' II':''}`,category,colour,dominantColour:colors[0],colors,tags:[name.toLowerCase(),category.toLowerCase(),'hero','16:9'],description:`${category==='Grain'?'A softly grained radial surface':`An original ${category.toLowerCase()} background`} in ${name.toLowerCase()} tones.`,recipe:selected.recipe,ai:false,width:1920,height:1080});
 }
}
await mkdir(new URL('thumbs/',out),{recursive:true});await mkdir(new URL('work/studio/',root),{recursive:true});await mkdir(new URL('artifacts/studio/',root),{recursive:true});
for(const item of items){let buffer;for(const quality of [65,50,35,20]){buffer=await sharp(Buffer.from(svg(item.recipe,640,360))).webp({quality}).toBuffer();if(buffer.length<20000)break}if(buffer.length>=20000)throw Error(`Thumbnail too large: ${item.id}`);await writeFile(new URL(`thumbs/${item.id}.webp`,out),buffer)}
await writeFile(new URL('index.json',out),JSON.stringify(items)+'\n');
await writeFile(new URL('work/studio/candidates.json',root),JSON.stringify(candidates)+'\n');
for(const [category] of families){const group=items.filter(i=>i.category===category),w=1000,h=5*170;const tiles=[];for(let i=0;i<group.length;i++){const item=group[i];tiles.push({input:await sharp(new URL(`thumbs/${item.id}.webp`,out).pathname).resize(250,140).toBuffer(),left:i%4*250,top:Math.floor(i/4)*170});tiles.push({input:Buffer.from(`<svg width="250" height="30"><rect width="250" height="30" fill="#101113"/><text x="10" y="20" fill="white" font-size="12">${item.title}</text></svg>`),left:i%4*250,top:Math.floor(i/4)*170+140})}await sharp({create:{width:w,height:h,channels:3,background:'#101113'}}).composite(tiles).png().toFile(new URL(`artifacts/studio/${category.toLowerCase()}.png`,root).pathname)}
console.log(`Studio: ${candidates.length} candidates, ${items.length} selected backgrounds, five contact sheets in artifacts/studio/.`);
