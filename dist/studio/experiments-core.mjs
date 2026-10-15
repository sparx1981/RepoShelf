import {organicPattern} from './pattern-geometry.mjs';
const num=(v,a,b,d)=>Number.isFinite(Number(v))?Math.min(b,Math.max(a,Number(v))):d;
const colour=(v,d)=>/^#[a-f\d]{6}$/i.test(v||'')?v:d;
const pick=(v,values,d)=>values.includes(v)?v:d;
export function patternState(s={}){return {seed:typeof s.seed==='string'?s.seed.replace(/[^a-z0-9-]/gi,'').slice(0,32)||'studio':'studio',variation:num(s.variation,0,1,.65),density:Math.round(num(s.density,4,24,16)),accent:colour(s.accent,'#7899fa'),kind:pick(s.kind,['dots','rings','lines','grid','waves','diamonds','blobs','truchet','contours','voronoi','triangles'],'dots'),spacing:num(s.spacing,12,160,48),size:num(s.size,1,24,5),angle:num(s.angle,0,90,0)===45?45:num(s.angle,0,90,0)===90?90:0,opacity:num(s.opacity,.05,1,.75),ink:colour(s.ink,'#c7eaa0'),background:colour(s.background,'#15221e'),transparent:s.transparent===true}}
export function patternSVG(input={},tile=false){const s=patternState(input);if(['blobs','truchet','contours','voronoi','triangles'].includes(s.kind)){const art=organicPattern(s),period=s.angle===45?art.size*Math.SQRT2:art.size,w=tile?period:960,h=tile?period:540;return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><pattern id="rs-pattern" width="${art.size}" height="${art.size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${s.angle})">${art.markup}</pattern></defs>${s.transparent?'':`<rect width="100%" height="100%" fill="${s.background}"/>`}<rect width="100%" height="100%" fill="url(#rs-pattern)"/></svg>`}const n=s.spacing,h=n/2,r=Math.min(s.size,n*.4),period=s.angle===45?n*Math.SQRT2:n,w=tile?period:960,height=tile?period:540;
 let mark=s.kind==='dots'?`<circle cx="${h}" cy="${h}" r="${r}" fill="${s.ink}"/>`:s.kind==='rings'?`<circle cx="${h}" cy="${h}" r="${n*.3}"/>`:s.kind==='lines'?`<path d="M-1 ${h}H${n+1}"/>`:s.kind==='grid'?`<path d="M0 0H${n}V${n}"/>`:s.kind==='waves'?`<path d="M0 ${h}Q${n/4} 0 ${h} ${h}T${n} ${h}"/>`:`<path d="M0 ${h}L${h} 0 ${n} ${h} ${h} ${n}Z"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}"><defs><pattern id="rs-pattern" width="${n}" height="${n}" patternUnits="userSpaceOnUse" patternTransform="rotate(${s.angle})"><g fill="none" stroke="${s.ink}" stroke-width="${s.kind==='dots'?0:Math.min(r,n*.15)}" opacity="${s.opacity}">${mark}</g></pattern></defs>${s.transparent?'':`<rect width="100%" height="100%" fill="${s.background}"/>`}<rect width="100%" height="100%" fill="url(#rs-pattern)"/></svg>`
}
export function patternCSS(s){return `.pattern-background {\n  background-image: url("data:image/svg+xml,${encodeURIComponent(patternSVG(s,true))}");\n  background-repeat: repeat;\n}\n`}
export function motionState(s={}){return {seed:typeof s.seed==='string'?s.seed.replace(/[^a-z0-9-]/gi,'').slice(0,32)||'studio':'studio',turbulence:num(s.turbulence,.2,3,1),bounce:num(s.bounce,.1,.9,.4),path:pick(s.path,['circle','figure8'],'figure8'),swirl:num(s.swirl,0,50,20),dissipation:num(s.dissipation,.05,3,.5),radius:num(s.radius,.02,.2,.08),force:num(s.force,1,8,4),phase:num(s.phase,0,1,.25),kind:pick(s.kind,['waves','aurora','particles','easing','flow','plasma','spring','path','ink','lissajous','ripples','tunnel','constellation','helix','pendulums','orbits','radar','lattice','fountain','bloom','equalizer'],'waves'),speed:num(s.speed,.25,4,1),amount:Math.round(num(s.amount,8,64,32)),amplitude:num(s.amplitude,10,160,75),ink:colour(s.ink,'#b5e480'),accent:colour(s.accent,'#7899fa'),background:colour(s.background,'#101b24'),x1:num(s.x1,0,1,.22),y1:num(s.y1,0,1,0),x2:num(s.x2,0,1,.36),y2:num(s.y2,0,1,1)}}
export function bezierProgress(x,s){let lo=0,hi=1;const at=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(at(mid,s.x1,s.x2)<x)lo=mid;else hi=mid}return x<=0?0:x>=1?1:at((lo+hi)/2,s.y1,s.y2)}
// Self-contained renderer: also embedded in standalone HTML exports.
export function motionFrame(s,phase=0){
 const p=((phase%1)+1)%1,theta=p*Math.PI*2,W=960,H=540;let body='';
 let hash=0;for(const c of s.seed||'studio')hash=(hash*31+c.charCodeAt(0))>>>0;const offset=hash%628/100;
 if(s.kind==='flow'){for(let j=0;j<s.amount;j++){let d='';for(let i=0;i<=80;i++){const x=i*12,y=270+(j-s.amount/2)*7+Math.sin(i/80*Math.PI*2*s.turbulence+theta+offset+j*.12)*s.amplitude+Math.sin(i/80*Math.PI*6-theta*2+j*.17)*s.amplitude*.35;d+=(i?'L':'M')+x+' '+y.toFixed(2)}body+=`<path d="${d}" fill="none" stroke="${j%2?s.ink:s.accent}" stroke-width="2" opacity=".5"/>`}}
 else if(s.kind==='plasma'){body='<defs><filter id="plasma"><feGaussianBlur stdDeviation="40"/></filter></defs><g filter="url(#plasma)">';for(let j=0;j<Math.round(s.amount/4);j++){const a=j*2.4+offset,x=480+Math.sin(theta+a)*s.amplitude*2,y=270+Math.cos(theta*2+a)*s.amplitude;body+=`<ellipse cx="${x}" cy="${y}" rx="${60+j%3*35}" ry="${45+30*Math.sin(theta+a)**2}" fill="${j%2?s.ink:s.accent}" opacity=".45"/>`}body+='</g>'}
 else if(s.kind==='spring'){const t=(p<.5?p*2:(p-.5)*2)*2,z=1-s.bounce,w=10,wd=w*Math.sqrt(1-z*z),end=1-Math.exp(-z*w*2)*(Math.cos(wd*2)+z/Math.sqrt(1-z*z)*Math.sin(wd*2)),response=(1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z/Math.sqrt(1-z*z)*Math.sin(wd*t)))/end,x=p<.5?response:1-response;body=`<path d="M340 270H620" stroke="${s.accent}" stroke-width="3"/><rect x="${340+280*x-35}" y="235" width="70" height="70" rx="18" fill="${s.ink}"/>`}
 else if(s.kind==='path'){const rx=180+s.amplitude,ry=70+s.amplitude*.5,point=a=>[480+Math.sin(a)*rx,270+(s.path==='circle'?Math.cos(a):Math.sin(2*a))*ry];let d='';for(let i=0;i<=100;i++)d+=(i?'L':'M')+point(i/100*Math.PI*2).join(' ');const q=point(theta);body=`<path d="${d}" fill="none" stroke="${s.accent}" stroke-opacity=".5" stroke-width="3"/><circle cx="${q[0]}" cy="${q[1]}" r="22" fill="${s.ink}"/>`}

 // Each experiment is periodic, bounded by detail, and self-contained for HTML export.
 else if(['lissajous','ripples','tunnel','constellation','helix','pendulums','orbits','radar','lattice','fountain','bloom','equalizer'].includes(s.kind)){
  const n=s.amount,colour=i=>i%2?s.ink:s.accent;
  const circle=(x,y,r,fill,opacity=1)=>'<circle cx="'+x.toFixed(3)+'" cy="'+y.toFixed(3)+'" r="'+r.toFixed(3)+'" fill="'+fill+'" opacity="'+opacity+'"/>';
  const line=(x,y,x2,y2,c,opacity=.4)=>'<path d="M'+x+' '+y+'L'+x2+' '+y2+'" fill="none" stroke="'+c+'" stroke-width="2" opacity="'+opacity+'"/>';
  if(s.kind==='lissajous')for(let j=0;j<Math.ceil(n/4);j++){
   let d='';for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;d+=(i?'L':'M')+(480+Math.sin(a*3+theta+j*.1)*(180+s.amplitude))+' '+(270+Math.sin(a*2+offset+j*.1)*(60+s.amplitude*.7))}
   body+='<path d="'+d+'" fill="none" stroke="'+colour(j)+'" stroke-width="2" opacity=".55"/>';
  }
  if(s.kind==='ripples')for(let j=0;j<2;j++)for(let i=0;i<Math.ceil(n/2);i++){
   const r=12+i*14+Math.sin(theta+i*.3+j)*s.amplitude*.12;
   body+='<circle cx="'+(480+(j?1:-1)*s.amplitude)+'" cy="270" r="'+r+'" fill="none" stroke="'+colour(j)+'" stroke-width="2" opacity=".5"/>';
  }
  if(s.kind==='tunnel')for(let j=0;j<Math.ceil(n/2);j++){
   const r=20+j*24,angle=theta+Math.sin(theta+j*.2)*s.amplitude/250;let points='';
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2+angle;points+=(480+Math.cos(a)*r)+','+(270+Math.sin(a)*r)+' '}
   body+='<polygon points="'+points+'" fill="none" stroke="'+colour(j)+'" stroke-width="2" opacity="'+(.2+j/n)+'"/>';
  }
  if(s.kind==='constellation'){
   const points=Array.from({length:n},(_,i)=>[480+Math.sin(i*2.4+offset)*300+Math.cos(theta+i)*s.amplitude*.4,270+Math.cos(i*1.7+offset)*150+Math.sin(theta+i)*s.amplitude*.4]);
   for(let i=0;i<n;i++){for(let j=i+1;j<n;j++)if(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1])<105+s.amplitude*.4)body+=line(...points[i],...points[j],colour(i),.2);body+=circle(...points[i],3+i%3,colour(i))}
  }
  if(s.kind==='helix')for(let i=0;i<n;i++){
   const x=150+i/(n-1)*660,a=i/(n-1)*Math.PI*4+theta,y=Math.sin(a)*s.amplitude;
   body+=line(x,270-y,x,270+y,s.accent,.3)+circle(x,270-y,5+Math.cos(a)*2,s.ink)+circle(x,270+y,5-Math.cos(a)*2,s.accent);
  }
  if(s.kind==='pendulums')for(let i=0;i<Math.ceil(n/2);i++){
   const x=180+i/(Math.ceil(n/2)-1)*600,a=Math.sin(theta*(i%5+1))*s.amplitude/220,y=200+i%5*20,px=x+Math.sin(a)*y,py=90+Math.cos(a)*y;
   body+=line(x,90,px,py,colour(i),.5)+circle(px,py,9,colour(i));
  }
  if(s.kind==='orbits'){
   body+=circle(480,270,15,s.ink);
   for(let i=0;i<Math.ceil(n/4);i++){const rx=55+i*30,ry=rx*.5,a=theta*(i%3+1)+i+offset;body+='<ellipse cx="480" cy="270" rx="'+rx+'" ry="'+ry+'" fill="none" stroke="'+colour(i)+'" opacity=".25"/>';body+=circle(480+Math.cos(a)*rx,270+Math.sin(a)*ry,4+s.amplitude/25,colour(i))}
  }
  if(s.kind==='radar'){
   for(let i=1;i<=4;i++)body+='<circle cx="480" cy="270" r="'+i*50+'" fill="none" stroke="'+s.ink+'" opacity=".2"/>';
   body+=line(280,270,680,270,s.ink,.2)+line(480,70,480,470,s.ink,.2);
   for(let i=0;i<n;i++){const a=theta-i/n*.8;body+=line(480,270,480+Math.cos(a)*210,270+Math.sin(a)*210,s.ink,(1-i/n)*.5)}
   for(let i=0;i<8;i++){const a=i*2.4+offset,r=60+i*18;body+=circle(480+Math.cos(a)*r,270+Math.sin(a)*r,3+s.amplitude/30,s.accent,.25+.7*(.5+.5*Math.cos(theta-a)))}
  }
  if(s.kind==='lattice'){
   const cols=Math.ceil(Math.sqrt(n*2)),rows=Math.ceil(n/cols),point=(x,y)=>[160+x/(cols-1)*640+Math.sin(theta+y*.7+x*.3)*s.amplitude*.25,110+y/Math.max(1,rows-1)*320+Math.cos(theta+x*.6)*s.amplitude*.25];
   for(let i=0;i<n;i++){const x=i%cols,y=Math.floor(i/cols),q=point(x,y);if(x&&i-1<n)body+=line(...q,...point(x-1,y),s.accent);if(y)body+=line(...q,...point(x,y-1),s.accent);body+=circle(...q,4,s.ink)}
  }
  if(s.kind==='fountain')for(let i=0;i<n;i++){
   const t=(p+i/n)%1,spread=Math.sin(i*2.4+offset),x=480+spread*t*(150+s.amplitude),y=440-Math.sin(t*Math.PI)*(200+s.amplitude);
   body+=circle(x,y,3+3*Math.sin(t*Math.PI),colour(i),Math.sin(t*Math.PI));
  }
  if(s.kind==='bloom')for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2,r=105+Math.sin(theta+i/n*Math.PI*6)*s.amplitude*.5,x=480+Math.cos(a)*r,y=270+Math.sin(a)*r;
   body+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+(30+s.amplitude*.2)+'" ry="8" transform="rotate('+a*180/Math.PI+' '+x+' '+y+')" fill="'+colour(i)+'" opacity=".65"/>';
  }
  if(s.kind==='equalizer')for(let i=0;i<n;i++){
   const h=20+(1+Math.sin(theta+i*.4))*s.amplitude,step=720/n;
   body+='<rect x="'+(120+i*step)+'" y="'+(270-h/2)+'" width="'+step*.65+'" height="'+h+'" rx="'+Math.min(5,step*.3)+'" fill="'+colour(i)+'"/>';
  }
 }
 else if(s.kind==='particles')for(let i=0;i<s.amount;i++){const seed=i*2.3999632297,x=480+Math.cos(seed)*330+Math.sin(theta+seed)*s.amplitude,y=270+Math.sin(seed*1.7)*170+Math.cos(theta+seed*2)*s.amplitude*.6;body+=`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${3+(i%5)*2}" fill="${i%2?s.ink:s.accent}" opacity="${.25+(i%4)*.15}"/>`}
 else if(s.kind==='easing'){
  const at=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3,x=p<.5?p*2:2-p*2;let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(at(mid,s.x1,s.x2)<x)lo=mid;else hi=mid}const t=at((lo+hi)/2,s.y1,s.y2);
  body=`<path d="M150 350H810" stroke="${s.accent}" stroke-opacity=".35" stroke-width="2"/><circle cx="${150+660*t}" cy="350" r="22" fill="${s.ink}"/><path d="M350 220C${350+260*s.x1} ${220-160*s.y1} ${350+260*s.x2} ${220-160*s.y2} 610 60" fill="none" stroke="${s.accent}" stroke-width="4"/><path d="M350 60V220H610" fill="none" stroke="${s.ink}" stroke-opacity=".3"/><circle cx="${350+260*x}" cy="${220-160*t}" r="6" fill="${s.ink}"/>`;
 }else{const layers=s.kind==='aurora'?Math.max(6,Math.round(s.amount/3)):Math.max(2,Math.round(s.amount/8));
  for(let j=0;j<layers;j++){let d='';for(let i=0;i<=48;i++){const x=i*20,y=(s.kind==='aurora'?205+j*12:245+j*43)+Math.sin(i/48*Math.PI*2+theta+j*.55)*s.amplitude+Math.cos(i/48*Math.PI*4-theta+j)*s.amplitude*.25;d+=(i?'L':'M')+x+' '+y.toFixed(2)}
   body+=s.kind==='aurora'?`<path d="${d}" fill="none" stroke="${j%2?s.ink:s.accent}" stroke-width="${12+j%3*8}" opacity="${.08+j/layers*.16}" stroke-linecap="round"/>`:`<path d="${d}L960 540H0Z" fill="${j%2?s.ink:s.accent}" opacity="${.12+j*.06}"/>`;
  }
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${s.background}"/>${body}</svg>`
}
export function motionCSS(input){const s=motionState(input);if(s.kind!=='easing')throw Error('Choose Interface easing to copy CSS. Backgrounds export as animated HTML.');return `.motion-track { position: relative; width: min(100%, 320px); height: 48px; }\n.motion-dot { position: absolute; top: 8px; width: 32px; height: 32px; border-radius: 50%; background: ${s.ink}; left: 0; }\n@media (prefers-reduced-motion: no-preference) {\n  .motion-dot { animation: studio-travel ${4/s.speed}s cubic-bezier(${s.x1}, ${s.y1}, ${s.x2}, ${s.y2}) infinite alternate; }\n}\n@keyframes studio-travel { to { left: calc(100% - 32px); } }\n/* Markup: <div class="motion-track"><div class="motion-dot"></div></div> */\n`}
export function motionHTML(input){const s=motionState(input);return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RepoShelf motion</title><style>body{margin:0;background:${s.background};color:white;font:16px system-ui}#art svg{display:block;width:100%;height:auto}button{margin:16px;padding:12px;cursor:pointer}</style><div id="art" role="img" aria-label="${s.kind==='easing'?'Interface easing preview':'Animated abstract background'}"></div><button id="toggle" aria-pressed="false">Play animation</button><script>
const render=${motionFrame.toString()},s=${JSON.stringify(s)},art=document.getElementById('art'),button=document.getElementById('toggle'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let playing=false,phase=${s.phase},last=0,frame=0;function paint(){art.innerHTML=render(s,phase)}function tick(now){frame=0;if(!playing||document.hidden)return;if(last)phase=(phase+(now-last)/1000*s.speed/8)%1;last=now;paint();frame=requestAnimationFrame(tick)}function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(reduce.matches)playing=false;button.disabled=reduce.matches;button.textContent=reduce.matches?'Reduced motion enabled':playing?'Pause animation':'Play animation';button.setAttribute('aria-pressed',String(playing));if(playing&&!document.hidden)frame=requestAnimationFrame(tick)}button.onclick=()=>{playing=!playing;sync()};reduce.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);paint();sync();
</script></html>`}
const fonts={manrope:'Manrope, system-ui, sans-serif',dm:'"DM Sans", system-ui, sans-serif',serif:'Georgia, "Times New Roman", serif',system:'system-ui, sans-serif'};
export function typeState(s={}){return {headingColour:colour(s.headingColour,'#f4f4f5'),bodyColour:colour(s.bodyColour,'#b9bbc2'),backgroundColour:colour(s.backgroundColour,'#101113'),heading:pick(s.heading,Object.keys(fonts),'manrope'),body:pick(s.body,Object.keys(fonts),'dm'),base:num(s.base,14,24,18),ratio:num(s.ratio,1.125,1.5,1.25),leading:num(s.leading,1.2,2,1.65),tracking:num(s.tracking,-.04,.08,-.025),measure:Math.round(num(s.measure,35,80,62)),width:Math.round(num(s.width,320,960,760)),title:typeof s.title==='string'?s.title.slice(0,120):'Good type makes room for an idea.',text:typeof s.text==='string'?s.text.slice(0,600):'Typography gives a page its rhythm. A clear hierarchy helps readers find their way, while a comfortable measure makes each line easier to follow. Adjust the scale, pair your fonts and see the whole system change together.'}}
export function typeScale(input){const s=typeState(input);return ['small','body','h6','h5','h4','h3','h2','h1'].map((name,i)=>{const exponent=i-1,max=s.base*s.ratio**exponent,min=Math.min(max*.95,s.base*.9*(1+(s.ratio-1)*.65)**exponent),slope=(max-min)/1080,intercept=min-slope*360;return {name,min,max,css:`clamp(${(min/16).toFixed(4)}rem, ${(intercept/16).toFixed(4)}rem + ${(slope*100).toFixed(4)}vw, ${(max/16).toFixed(4)}rem)`}})}
export function typeCSS(input){const s=typeState(input),scale=typeScale(s);return `/* Load Manrope / DM Sans in your project when selected; system fallbacks remain usable.\n   Fluid range: 360–1440px at a 16px root; rem bounds respect browser text sizing. */\n.type-system {\n  color: ${s.bodyColour};\n  background-color: ${s.backgroundColour};\n  font-family: ${fonts[s.body]};\n  font-size: ${scale[1].css};\n  line-height: ${s.leading};\n  max-width: ${s.measure}ch;\n  overflow-wrap: anywhere;\n}\n.type-system :is(h1,h2,h3,h4,h5,h6) {\n  color: ${s.headingColour};\n  font-family: ${fonts[s.heading]};\n  font-weight: 700;\n  line-height: 1.15;\n  letter-spacing: ${s.tracking}em;\n  margin-block: 1.2em .45em;\n}\n${scale.filter(r=>r.name!=='body').map(r=>`.type-system ${r.name==='small'?'small':r.name} { font-size: ${r.css}; }`).join('\n')}\n.type-system p { margin-block: 0 1em; }\n`}
export function typeTokens(input){const s=typeState(input);return {colour:{heading:s.headingColour,body:s.bodyColour,background:s.backgroundColour},fontFamily:{heading:fonts[s.heading],body:fonts[s.body]},fontSize:Object.fromEntries(typeScale(s).map(r=>[r.name,r.css])),lineHeight:{body:s.leading,heading:1.15},letterSpacing:{heading:s.tracking+'em'},maxWidth:{prose:s.measure+'ch'}}}
export function fontFamily(key){return fonts[key]||fonts.system}
