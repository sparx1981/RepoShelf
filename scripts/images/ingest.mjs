// No generation API: accepts PNGs generated with the existing image tool.
import {readdir,readFile,copyFile,mkdir,stat} from 'node:fs/promises';
import sharp from 'sharp';
import {root,work,json,atomic,prompts,digest,flag} from './common.mjs';
const rows=await prompts(),manifest=await json(new URL('manifest.json',work),{}),incoming=new URL('incoming/',work);
await mkdir(incoming,{recursive:true});await mkdir(new URL('raw/',work),{recursive:true});
const one=flag('id'),source=flag('source');
const files=one&&source?[{id:one,path:source}]:(await readdir(incoming)).filter(f=>f.endsWith('.png')).map(f=>({id:f.slice(0,-4),path:new URL(f,incoming)}));
let added=0;
for(const file of files){const prompt=rows.find(r=>r.id===file.id);if(!prompt)throw Error('Unknown image id: '+file.id);if((await stat(file.path)).size>16777216)throw Error('Original exceeds the 16 MB bucket limit: '+file.id);const buffer=await readFile(file.path),meta=await sharp(buffer,{limitInputPixels:20000000}).metadata();if(meta.format!=='png'||meta.width<640||meta.height<360)throw Error('Use a PNG at least 640 × 360: '+file.id);const hash=digest(buffer);if(manifest[file.id]?.hash===hash)continue;await copyFile(file.path,new URL(`raw/${file.id}.png`,work));manifest[file.id]={id:file.id,hash,width:meta.width,height:meta.height,provider:'OpenAI',model:flag('model',null),date:new Date().toISOString(),method:'chat-image-tool',status:'pending-review'};added++}
await atomic(new URL('manifest.json',work),manifest);console.log(`Registered ${added} originals. Review them before processing.`);
