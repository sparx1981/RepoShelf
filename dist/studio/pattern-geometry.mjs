// Original bounded generators. Geometry references: css-doodle, Blobshape and d3-delaunay.
export function seededRandom(seed){let h=2166136261;for(const c of String(seed)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export function clipHalfPlane(poly,a,b,c){if(!poly.length)return [];const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=a*p[0]+b*p[1]-c,dq=a*q[0]+b*q[1]-c;if(dp<=1e-8)out.push(p);if((dp<0&&dq>0)||(dp>0&&dq<0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])}}return out}
export function periodicVoronoi(points,size){const sites=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)points.forEach((p,id)=>sites.push({x:p[0]+dx*size,y:p[1]+dy*size,id}));const cells=[];for(const p of sites){let poly=[[0,0],[size,0],[size,size],[0,size]];for(const q of sites){if(p===q)continue;poly=clipHalfPlane(poly,q.x-p.x,q.y-p.y,(q.x*q.x+q.y*q.y-p.x*p.x-p.y*p.y)/2);if(poly.length<3)break}if(poly.length>=3)cells.push({id:p.id,points:poly})}return cells}
export function organicPattern(s){
 const rand=seededRandom(s.seed),w=s.spacing*4,n=Math.max(2,Math.round(Math.sqrt(s.density))),cell=w/n,palette=[s.ink,s.accent,s.transparent?'none':s.background],stroke=Math.min(s.size,cell*.15),f=v=>Number(v.toFixed(3)),path=pts=>pts.map((p,i)=>(i?'L':'M')+p.map(f).join(' ')).join('')+'Z';let body='';
 if(s.kind==='voronoi'){
  const rows=Math.ceil(s.density/n),points=Array.from({length:s.density},(_,i)=>[((i%n+.5)+(rand()-.5)*s.variation*.85)*w/n,((Math.floor(i/n)+.5)+(rand()-.5)*s.variation*.85)*w/rows]);for(const poly of periodicVoronoi(points,w))body+=`<path d="${path(poly.points)}" fill="${palette[poly.id%3]}" stroke="${s.ink}" stroke-width="${stroke*.3}"/>`;
 }else if(s.kind==='triangles'){
  const shifts=Array.from({length:n*n},()=>[(rand()-.5)*cell*s.variation*.45,(rand()-.5)*cell*s.variation*.45]),vertex=(x,y)=>{const d=shifts[((y%n+n)%n)*n+(x%n+n)%n];return [x*cell+d[0],y*cell+d[1]]};
  for(let y=-1;y<=n;y++)for(let x=-1;x<=n;x++){const p=vertex(x,y),q=vertex(x+1,y),r=vertex(x+1,y+1),t=vertex(x,y+1);for(const tri of [[p,q,r],[p,r,t]])body+=`<path d="${path(tri)}" fill="${palette[((x%n+n)%n+((y%n+n)%n)*3+(tri[1]===q?0:1))%3]}" stroke="${s.ink}" stroke-width="${stroke*.2}"/>`}
 }else if(s.kind==='truchet'){
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const rotate=rand()<s.variation?90:0;body+=`<g transform="translate(${f(x*cell)} ${f(y*cell)}) rotate(${rotate} ${f(cell/2)} ${f(cell/2)})"><path d="M0 ${f(cell/2)}A${f(cell/2)} ${f(cell/2)} 0 0 0 ${f(cell/2)} 0M${f(cell/2)} ${f(cell)}A${f(cell/2)} ${f(cell/2)} 0 0 0 ${f(cell)} ${f(cell/2)}" fill="none" stroke="${(x+y)%2?s.ink:s.accent}" stroke-width="${stroke}"/></g>`}
 }else if(s.kind==='contours'){
  for(let j=0;j<n*2;j++){const phase=rand()*Math.PI*2;for(const wrap of [-w,0,w]){let d='';for(let i=0;i<=64;i++){const x=i/64*w,y=(j+.5)*cell/2+wrap+Math.sin(i/64*Math.PI*2+phase)*cell*s.variation*.6;d+=(i?'L':'M')+f(x)+' '+f(y)}body+=`<path d="${d}" fill="none" stroke="${j%2?s.ink:s.accent}" stroke-width="${stroke*.6}"/>`}}
 }else{
  for(let j=0;j<s.density;j++){const cx=rand()*w,cy=rand()*w,r=cell*(.1+s.size/100+rand()*.22),pts=Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2,rad=r*(1-s.variation*.5+rand()*s.variation);return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]}),mid=(a,b)=>[f((a[0]+b[0])/2),f((a[1]+b[1])/2)];let d='M'+mid(pts[7],pts[0]).join(' ');for(let i=0;i<8;i++)d+='Q'+pts[i].map(f).join(' ')+' '+mid(pts[i],pts[(i+1)%8]).join(' ');d+='Z';for(const dx of [-w,0,w])for(const dy of [-w,0,w])body+=`<path d="${d}" transform="translate(${dx} ${dy})" fill="${j%2?s.ink:s.accent}"/>`}
 }
 return {size:w,markup:`<g opacity="${s.opacity}">${body}</g>`}
}
