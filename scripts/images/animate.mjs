// Local video rendering from reviewed artwork; no generation API or paid service.
import {readFile,stat,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {work,json,atomic,digest,flag} from './common.mjs';
const exec=promisify(execFile),manifest=await json(new URL('manifest.json',work)),review=await json(new URL('review.json',work)),ids=flag('ids','aurora-light-01,water-liquid-01,soft-gradients-02').split(','),records=await json(new URL('animations.json',work),{});
for(const id of ids){
 if(!/^[a-z0-9-]{1,80}$/.test(id)||review[id]?.accepted!==true||review[id].hash!==manifest[id]?.hash)throw Error('Animation requires reviewed, unchanged artwork: '+id);
 const source=new URL(`raw/${id}.png`,work);if(digest(await readFile(source))!==manifest[id].hash)throw Error('Reviewed original changed: '+id);
 const folder=new URL(`animations/${id}/`,work);await mkdir(folder,{recursive:true});const target=new URL('loop.mp4',folder);
 // A full sinusoidal cycle returns to the same framing without a cut or flashes.
 const filter="scale=1320:744:force_original_aspect_ratio=increase,crop=1280:720:x='(iw-ow)/2*(1+sin(2*PI*t/8))':y='(ih-oh)/2*(1+cos(2*PI*t/8))',format=yuv420p";
 await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','24','-i',source.pathname,'-vf',filter,'-t','8','-an','-c:v','libx264','-preset','medium','-crf','23','-threads','2','-movflags','+faststart',target.pathname],{maxBuffer:1000000});
 const bytes=(await stat(target)).size;if(bytes>8000000)throw Error('Loop exceeds its 8 MB budget: '+id);
 await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',target.pathname,'-vf','fps=8,scale=320:180','-c:v','libwebp_anim','-quality','45','-loop','0',new URL('preview.webp',folder).pathname],{maxBuffer:1000000});
 records[id]={sourceHash:manifest[id].hash,hash:digest(await readFile(target)),bytes,width:1280,height:720,seconds:8,fps:24,method:'Local gentle framing loop from AI-generated still artwork',file:id+'/loop.mp4'};
 await atomic(new URL('animations.json',work),records);console.log(`${id}: reviewed-source MP4 loop, ${bytes} bytes`);
}
