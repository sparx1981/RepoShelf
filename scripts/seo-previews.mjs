import {stat,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const local=image=>image?.kind==='demo'&&typeof image.src==='string'&&/^\/?previews\/[a-f0-9]{24}(?:-provider)?\.jpg$/.test(image.src);
export async function optimizeSEOPreviews(root,entries){
 const dist=new URL('dist/',root),output=new URL('previews/seo/',dist),wanted=new Map();
 for(const entry of entries)for(const image of entry.project.screenshots||[])if(local(image)&&(!image.url||image.url===entry.project.demo)){const key=image.src.replace(/^\//,'');if(!wanted.has(key))wanted.set(key,[]);wanted.get(key).push(image);break}
 const report={images:wanted.size,optimized:0,missing:0,originalBytes:0,mobileBytes:0,desktopBytes:0};let sharp;
 const tasks=[...wanted],workers=4;let cursor=0;
 async function work(){while(cursor<tasks.length){const [src,images]=tasks[cursor++],original=new URL(src,dist);let source;try{source=await stat(original)}catch(error){if(error.code==='ENOENT'){report.missing++;continue}throw error}
  try{sharp??=(await import('sharp')).default;await mkdir(output,{recursive:true});const metadata=await sharp(fileURLToPath(original),{limitInputPixels:20000000}).metadata(),variants=[];
   for(const width of [480,960]){const name=src.split('/').pop().replace('.jpg',`-${width}.webp`),target=new URL(name,output);let current;try{current=await stat(target)}catch{}
    if(!current||current.mtimeMs<source.mtimeMs)await sharp(fileURLToPath(original),{limitInputPixels:20000000}).rotate().resize({width,withoutEnlargement:true}).webp({quality:72}).toFile(fileURLToPath(target));
    const size=await stat(target),dimensions=await sharp(fileURLToPath(target)).metadata();if(!variants.some(v=>v.width===dimensions.width))variants.push({src:'/previews/seo/'+name,width:dimensions.width,height:dimensions.height,bytes:size.size});
   }
   for(const image of images){image.seoVariants=variants;image.width=metadata.width;image.height=metadata.height}
   report.optimized++;report.originalBytes+=source.size;report.mobileBytes+=variants[0]?.bytes||0;report.desktopBytes+=variants.at(-1)?.bytes||0;
  }catch{report.missing++}
 }}await Promise.all(Array.from({length:workers},work));return report;
}
