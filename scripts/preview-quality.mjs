import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
// Reject only almost uniform captures. Low-text canvas/image demos remain valid.
export async function inspectPreview(bytes,{sharpFactory}={}){
 try{const sharp=sharpFactory||require('sharp');
 const source=sharp(bytes,{limitInputPixels:16000000,animated:false}),meta=await source.metadata();
 if((meta.width||0)<240||(meta.height||0)<120)return {usable:false,reason:'image_too_small'};
 const {data}=await source.resize(64,40,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const min=[255,255,255],max=[0,0,0];for(let i=0;i<data.length;i++){const channel=i%3;min[channel]=Math.min(min[channel],data[i]);max[channel]=Math.max(max[channel],data[i])}
 if(Math.max(...max.map((n,i)=>n-min[i]))<8)return {usable:false,reason:'uniform_image'};
 return {usable:true,width:meta.width,height:meta.height};
 }catch{return {usable:false,reason:'invalid_image'}}
}
export async function compressedPreview(bytes){const sharp=require('sharp');return sharp(bytes,{limitInputPixels:16000000,animated:false}).resize({width:1280,withoutEnlargement:true}).jpeg({quality:60,mozjpeg:true}).toBuffer()}
