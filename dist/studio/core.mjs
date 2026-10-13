// Original Studio maths and export formats. Shared by the browser and build scripts.
export const TYPES = ['linear','radial','conic','mesh','aurora','wave'];
export const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
export const xml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function random(seed=1){let n=seed>>>0;return ()=>{n+=0x6d2b79f5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296}}
export const DEFAULT = {type:'mesh',colors:['#173e39','#b2df92','#7896b2','#eee0bc'],stops:[0,33,67,100],angle:135,grain:6,seed:42,points:[{x:.15,y:.2},{x:.72,y:.18},{x:.9,y:.9},{x:.25,y:.85}],animate:false};
export function recipe(value={}){
  if(!value||typeof value!=='object')value={};
  const colors=Array.isArray(value.colors)?value.colors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,6):[];
  const palette=colors.length>=2?colors:[...DEFAULT.colors];
  const points=Array.isArray(value.points)?value.points.slice(0,9).map(p=>({x:clamp(Number(p?.x)||0,0,1),y:clamp(Number(p?.y)||0,0,1)})):DEFAULT.points.map(p=>({...p}));
  const pairs=palette.map((color,i)=>{const n=Number(value.stops?.[i]);return {color,stop:clamp(Number.isFinite(n)?n:i*100/(palette.length-1),0,100)}}).sort((a,b)=>a.stop-b.stop);
  const stops=pairs.map(p=>p.stop);
  return {type:TYPES.includes(value.type)?value.type:DEFAULT.type,colors:pairs.map(p=>p.color),stops,angle:clamp(Number(value.angle??135)||0,0,360),grain:clamp(Number(value.grain??6)||0,0,25),seed:clamp(Math.floor(Number(value.seed??42)||0),0,2147483647),points:points.length>=3?points:DEFAULT.points.map(p=>({...p})),animate:value.animate===true};
}
function gradients(r){return r.colors.map((color,i)=>`<radialGradient id="g${i}"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`).join('')}
function mesh(r){return r.points.map((p,i)=>`<ellipse cx="${p.x*1000}" cy="${p.y*562.5}" rx="${560+i%3*110}" ry="${380+i%2*100}" fill="url(#g${i%r.colors.length})"/>`).join('')}
function wave(r,aurora=false){const rnd=random(r.seed);return Array.from({length:aurora?7:12},(_,i)=>{const y=130+i*(aurora?40:35),bend=(rnd()-.5)*450;return `<path d="M-150 ${y+bend} C200 ${y-220},520 ${y+260+bend},1150 ${y-bend}" fill="none" stroke="${r.colors[i%r.colors.length]}" stroke-width="${aurora?40+rnd()*80:12+rnd()*30}" opacity="${aurora?.45:.35}"${aurora?' filter="url(#blur)"':''}/>`}).join('')}
export function svg(input,width=1920,height=1080){
  const r=recipe(input),a=r.angle*Math.PI/180,stops=r.colors.map((c,i)=>`<stop offset="${r.stops[i]}%" stop-color="${c}"/>`).join('');
  let paint='';
  if(r.type==='linear')paint='<rect width="1000" height="562.5" fill="url(#base)"/>';
  if(r.type==='radial')paint='<rect width="1000" height="562.5" fill="url(#radial)"/>';
  if(r.type==='mesh')paint=mesh(r);
  if(r.type==='wave'||r.type==='aurora')paint=wave(r,r.type==='aurora');
  if(r.type==='conic'){
    const rgb=r.colors.map(hexToRgb),mix=t=>{let i=r.stops.findIndex(s=>s>=t);if(i<0)return r.colors.at(-1);if(i===0)return r.colors[0];const u=(t-r.stops[i-1])/Math.max(.001,r.stops[i]-r.stops[i-1]);return rgbToHex(rgb[i-1].map((v,k)=>v*(1-u)+rgb[i][k]*u))};
    paint=Array.from({length:360},(_,i)=>{const a1=(i+r.angle-90)*Math.PI/180,a2=(i+1.4+r.angle-90)*Math.PI/180;return `<path d="M500 281.25 L${500+1200*Math.cos(a1)} ${281.25+1200*Math.sin(a1)} L${500+1200*Math.cos(a2)} ${281.25+1200*Math.sin(a2)}Z" fill="${mix(i/359*100)}"/>`}).join('');
  }
  const noise=r.grain?`<filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch" seed="${r.seed%1000}"/><feColorMatrix type="saturate" values="0"/></filter>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 1000 562.5" preserveAspectRatio="none"><defs>${gradients(r)}<linearGradient id="base" x1="${50-Math.sin(a)*50}%" y1="${50+Math.cos(a)*50}%" x2="${50+Math.sin(a)*50}%" y2="${50-Math.cos(a)*50}%">${stops}</linearGradient><radialGradient id="radial" cx="${r.points[0].x*100}%" cy="${r.points[0].y*100}%" r="85%">${stops}</radialGradient><filter id="blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="24"/></filter>${noise}</defs><rect width="1000" height="562.5" fill="${r.colors[0]}"/>${paint}${r.grain?`<rect width="1000" height="562.5" filter="url(#noise)" opacity="${r.grain/100}"/>`:''}</svg>`;
}
export function css(input){
  const r=recipe(input),stops=r.colors.map((c,i)=>`${c} ${r.stops[i]}%`).join(', ');
  let bg=r.type==='linear'?`linear-gradient(${r.angle}deg, ${stops})`:r.type==='conic'?`conic-gradient(from ${r.angle}deg, ${stops})`:null;
  // Mesh/aurora/wave and grain use the same original vector renderer for faithful exports.
  if(!bg||r.grain)bg=`url("data:image/svg+xml,${encodeURIComponent(svg(r))}")`;
  return `.studio-background {\n  background: ${bg};\n  background-color: ${r.colors[0]};\n  background-size: 100% 100%;\n  min-height: 20rem;\n}${r.animate?'\n@media (prefers-reduced-motion: no-preference) {\n  .studio-background { background-size: 115% 115%; animation: studio-drift 12s ease-in-out infinite alternate; }\n}\n@keyframes studio-drift { from { background-position: 0% 0%; } to { background-position: 100% 100%; } }':''}`;
}
export function snippet(input,format='css'){
  if(format==='css')return css(input);
  if(format==='react')return `export default function Background({ children }) {\n  return <>\n    <style>{${JSON.stringify(css(input))}}</style>\n    <section className="studio-background">{children}</section>\n  </>;\n}\n`;
  return `<style>\n${css(input)}\n</style>\n<section class="studio-background min-h-80 bg-cover bg-center">\n  <!-- Your content -->\n</section>\n`;
}
export const hexToRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export const rgbToHex=rgb=>'#'+rgb.map(v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,'0')).join('');
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const gamma=v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
export function luminance(hex){const [r,g,b]=hexToRgb(hex).map(linear);return .2126*r+.7152*g+.0722*b}
export function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
export function toOKLCH(hex){
  const [r,g,b]=hexToRgb(hex).map(linear),l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
  return {L,C:Math.hypot(a,B),h:Math.atan2(B,a)};
}
function oklchRGB(L,C,h){const a=C*Math.cos(h),b=C*Math.sin(h),l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]}
export function fromOKLCH(L,C,h){let low=0,high=C,rgb=oklchRGB(L,C,h);if(rgb.some(x=>x<0||x>1)){for(let i=0;i<20;i++){const mid=(low+high)/2,v=oklchRGB(L,mid,h);if(v.every(x=>x>=0&&x<=1))low=mid;else high=mid}rgb=oklchRGB(L,low,h)}return rgbToHex(rgb.map(gamma))}
export function ramp(hex){if(!/^#[a-f0-9]{6}$/i.test(hex))throw Error('Choose a six-digit hex colour.');const base=toOKLCH(hex),levels=[50,100,200,300,400,500,600,700,800,900,950];return levels.map((level,i)=>{const light=Math.max(.98,base.L),L=i<=5?light+(base.L-light)*i/5:base.L*(1-(i-5)/6),C=base.C*Math.min(1,Math.sin(Math.PI*L)/Math.max(.001,Math.sin(Math.PI*base.L))),color=i===5?hex.toLowerCase():fromOKLCH(L,C,base.h);return {level,color,white:contrast(color,'#ffffff'),black:contrast(color,'#000000'),lightness:toOKLCH(color).L}})}
export function rampExport(rows,name='brand',format='css'){const obj=Object.fromEntries(rows.map(r=>[r.level,r.color]));if(format==='json')return JSON.stringify({[name]:obj},null,2);if(format==='tailwind')return `// Tailwind theme.extend.colors\n${JSON.stringify({colors:{[name]:obj}},null,2)}`;return ':root {\n'+rows.map(r=>`  --${name}-${r.level}: ${r.color};`).join('\n')+'\n}'}
export const CHAR_RAMPS=[' .:-=+*#%@',' .,:;irsXA253hMHGS#9B&@',' ░▒▓█'];
export function ascii(pixels,width,height,{characters=CHAR_RAMPS[0],dither=false,invert=false}={}){
  const chars=Array.from(characters).slice(0,64);if(chars.length<2||width<1||height<1||width>160||height>100||pixels.length!==width*height*4)throw Error('Use 2–64 characters and an image up to 160 × 100 cells.');
  const lum=new Float32Array(width*height);for(let i=0;i<lum.length;i++){const alpha=pixels[i*4+3]/255;lum[i]=(.2126*pixels[i*4]+.7152*pixels[i*4+1]+.0722*pixels[i*4+2])*alpha+255*(1-alpha)}
  const lines=[];for(let y=0;y<height;y++){let line='';for(let x=0;x<width;x++){const k=y*width+x,v=clamp(lum[k],0,255),n=Math.round(v/255*(chars.length-1));line+=chars[invert?chars.length-1-n:n];if(dither){const err=v-n*255/(chars.length-1);if(x+1<width)lum[k+1]+=err*7/16;if(y+1<height){if(x)lum[k+width-1]+=err*3/16;lum[k+width]+=err*5/16;if(x+1<width)lum[k+width+1]+=err/16}}}lines.push(line)}return lines.join('\n');
}
export function asciiSVG(text,foreground='#d6fb79',background='#101113'){const lines=text.split('\n'),w=Math.max(...lines.map(s=>Array.from(s).length))*6+24,h=lines.length*12+24;return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${background}"/><g font-family="monospace" font-size="10" fill="${foreground}" xml:space="preserve">${lines.map((s,i)=>`<text x="12" y="${24+i*12}">${xml(s)}</text>`).join('')}</g></svg>`}
