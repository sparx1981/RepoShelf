// Deterministic, dependency-free PNGs. The r. mark fits Android's maskable safe circle.
import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
const root=new URL('../dist/icons/',import.meta.url);await mkdir(root,{recursive:true});
function crc32(data){let crc=0xffffffff;for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function chunk(name,data){const type=Buffer.from(name),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([len,type,data,crc])}
const outline=[[.31,.34],[.395,.34],[.395,.39]];
function curve(a,b,c,d){for(let i=1;i<=24;i++){const t=i/24,u=1-t;outline.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}}
curve([.395,.39],[.431,.343],[.48,.322],[.555,.336]);outline.push([.555,.424]);
curve([.555,.424],[.455,.405],[.395,.447],[.395,.525]);outline.push([.395,.67],[.31,.67]);
function mark(x,y){if((x-.635)**2+(y-.625)**2<.046**2)return true;let inside=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [ax,ay]=outline[i],[bx,by]=outline[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside}return inside}
for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['maskable-512.png',512],['apple-touch-icon.png',180]]){
 const pixels=Buffer.alloc((size*3+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){let coverage=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++)if(mark((x+(sx+.5)/4)/size,(y+(sy+.5)/4)/size))coverage++;const offset=y*(size*3+1)+1+x*3;for(let c=0;c<3;c++)pixels[offset+c]=Math.round([214,251,121][c]*(1-coverage/16)+[11,11,13][c]*coverage/16)}
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;await writeFile(new URL(name,root),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
}
console.log('Generated Android and Apple home-screen icons.');
