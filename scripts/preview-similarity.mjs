import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
// A recapture that looks the same as the saved screenshot is not saved again. Every rewritten JPEG is a new 50 KB object in Git for good, and
// about half of the screenshots rewritten in one day were visually identical (carousel frames, ads and compression noise change the bytes, not
// the picture). Compared at 96 by 60 pixels: the average difference per colour channel must stay under 2 of 255 and almost no pixel may move by
// more than 40, so a new banner, a changed layout or an error page still replaces the old picture.
export const MAX_MEAN_DIFFERENCE=2,MAX_CHANGED_SHARE=0.01,CHANGED_BY=40;
async function thumbnail(bytes,sharpFactory){const sharp=sharpFactory||require('sharp');const {data}=await sharp(bytes,{limitInputPixels:20000000,animated:false}).resize(96,60,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});return data}
export async function similarPreview(saved,captured,{sharpFactory}={}){
 if(!saved||!captured||!saved.length||!captured.length)return false;
 try{const [a,b]=await Promise.all([thumbnail(saved,sharpFactory),thumbnail(captured,sharpFactory)]);if(a.length!==b.length)return false;
  let total=0,changed=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);total+=d;if(d>CHANGED_BY)changed++}
  return total/a.length<=MAX_MEAN_DIFFERENCE&&changed/a.length<=MAX_CHANGED_SHARE}
 catch{return false}
}
