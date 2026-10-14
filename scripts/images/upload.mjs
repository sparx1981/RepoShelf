import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {root,work,json,atomic,flag,digest,prompts} from './common.mjs';
const folder=new URL('processed/',work),index=await json(new URL('index.json',folder)),sizes=await json(new URL('sizes.json',folder)),available=Number(flag('available-bytes','0')),upload=process.argv.includes('--upload');
const plan=new Map((await prompts()).map(i=>[i.id,i])),seen=new Set();
if(!index.length||index.length>120)throw Error('Publish a non-empty reviewed batch of up to 120 images.');
for(const item of index){if(seen.has(item.id)||plan.get(item.id)?.category!==item.category)throw Error('The batch contains a duplicate or unplanned image.');seen.add(item.id)}
if(process.argv.includes('--complete')&&(index.length!==120||new Set(index.map(i=>i.category)).size!==12))throw Error('The complete release requires 120 accepted images across 12 categories.');
if(!Number.isSafeInteger(available)||available<sizes.privateBytes)throw Error('Set --available-bytes to the verified remaining free storage allowance.');
if(!upload){await new Promise(resolve=>process.stdout.write(`Dry run: ${index.length} images, ${sizes.privateBytes} bytes, ${available} free bytes available. No network writes. Add --upload after applying the Studio migration.\n`,resolve));process.exit(0)}
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
if(base!=='https://jccogltqhkffuderukrj.supabase.co'||!key)throw Error('Configure the existing RepoShelf project URL and service key in the environment. Never pass the key as a command argument.');
const headers={apikey:key,Authorization:'Bearer '+key};
async function request(path,options={}){const r=await fetch(base+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(60000),redirect:'error'});if(!r.ok)throw Error('Storage request failed with status '+r.status);return r}
const bucket=await (await request('/storage/v1/bucket/studio-images')).json();if(bucket.public!==false)throw Error('The image bucket must be private.');
const uploaded=await json(new URL('uploads.json',work),{});
for(const item of index)for(const [variant,path] of Object.entries(item.files)){if(!['web','full','original','loop'].includes(variant)||path!==item.id+'/'+(variant==='original'?'original.png':variant==='loop'?'loop.mp4':variant+'.webp'))throw Error('Invalid private asset path');const buffer=await readFile(new URL(path,folder)),hash=digest(buffer);if(uploaded[path]===hash)continue;await request('/storage/v1/object/studio-images/'+path,{method:'POST',headers:{'Content-Type':variant==='original'?'image/png':variant==='loop'?'video/mp4':'image/webp','x-upsert':'true'},body:buffer});uploaded[path]=hash;await atomic(new URL('uploads.json',work),uploaded)}
// Verify every private object before making its public catalogue visible.
for(const item of index)for(const path of Object.values(item.files))await request('/storage/v1/object/info/studio-images/'+path);
const publicDir=new URL('dist/studio/images/',root);await mkdir(new URL('thumbs/',publicDir),{recursive:true});await mkdir(new URL('motion/',publicDir),{recursive:true});for(const item of index){await copyFile(new URL(`thumbs/${item.id}.webp`,folder),new URL(`thumbs/${item.id}.webp`,publicDir));if(item.animation?.preview)await copyFile(new URL(`motion/${item.id}.webp`,folder),new URL(`motion/${item.id}.webp`,publicDir));}await atomic(new URL('index.json',publicDir),index);
console.log(`${index.length} images uploaded to private storage and verified. Public thumbnails and catalogue are ready for the application deployment.`);
