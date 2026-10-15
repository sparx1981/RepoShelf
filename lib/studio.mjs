import {readFile} from 'node:fs/promises';
import {fail} from './accounts.mjs';
import {svg,snippet} from '../dist/studio/core.mjs';
import {liveItems,liveHTML,liveReact} from '../dist/studio/live-shaders.mjs';
const paths={bg:new URL('../dist/studio/index.json',import.meta.url),img:new URL('../dist/studio/images/index.json',import.meta.url)};
export async function studioItem(source,id){if(!paths[source]||typeof id!=='string'||!/^[a-z0-9-]{1,80}$/.test(id))fail(400,'invalid_studio_item','Choose a valid Studio item.');const list=JSON.parse(await readFile(paths[source],'utf8'));if(source==='bg')list.push(...liveItems);const item=list.find(i=>i.id===id&&i.published!==false);if(!item)fail(404,'not_found','That Studio item is not available.');return item}
export const STUDIO_LICENCE='RepoShelf Studio licence: personal and commercial project use is allowed. Do not resell or redistribute standalone assets or include them in another asset library. No use implying endorsement. See https://www.reposhelf.co.uk/terms.html.\n';
export function backgroundDetail(item){if(item.live)return {id:item.id,title:item.title,live:true,html:liveHTML(item.id),react:liveReact(item.id),licence:STUDIO_LICENCE};return {id:item.id,title:item.title,svg:svg(item.recipe),css:'/* '+STUDIO_LICENCE.trim()+' */\n'+snippet(item.recipe,'css'),react:'// '+STUDIO_LICENCE.trim()+'\n'+snippet(item.recipe,'react'),tailwind:'<!-- '+STUDIO_LICENCE.trim()+' -->\n'+snippet(item.recipe,'tailwind'),licence:STUDIO_LICENCE}}
export async function imageDownload(accounts,item,variant){
 const extensions={web:'webp',full:'webp',original:'png',loop:'mp4'};const ext=Object.hasOwn(extensions,variant)?extensions[variant]:null;
 if(!ext)fail(400,'invalid_variant','Choose WebP, the original PNG, or an available animation.');
 const key=item.files?.[variant],expected=`${item.id}/${variant==='original'?'original.png':variant==='loop'?'loop.mp4':variant+'.webp'}`;
 if(key!==expected)fail(503,'image_not_ready','This image download is being prepared.');
 const bucket='studio-images',filename=`${item.id}-${variant}.${ext}`;
 const signed=await accounts.request(`/storage/v1/object/sign/${bucket}/${key}`,{service:true,method:'POST',body:{expiresIn:60}});
 const path=signed.signedURL||signed.signedUrl;
 if(typeof path!=='string'||!path.startsWith(`/object/sign/${bucket}/`)&&!path.startsWith(`/storage/v1/object/sign/${bucket}/`))fail(503,'storage_unavailable','The image download could not be prepared.');
 const url=new URL(path.startsWith('/storage/')?path:'/storage/v1'+path,accounts.config.url);url.searchParams.set('download',filename);
 return {url:url.href,expiresIn:60,filename};
}
