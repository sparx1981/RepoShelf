// Procedural artwork shared by the gallery and card demos, so no component needs an external image.
// Pasted into each component so every one stays standalone. Eight landscape scenes, drawn once to a canvas.
export const ART=`var SCENES=[
{s:['#2b1055','#d6457f','#ffb36b'],u:[.68,.6,.11,'#fff1c0'],h:['#8a2f78','#56206a','#2f1450','#170b2c'],st:0},
{s:['#0b1b3a','#2b6cb0','#a6dcff'],u:[.28,.3,.06,'#ffffff'],h:['#7fb0d4','#4a7ba3','#274b6b','#12273d'],st:0},
{s:['#ffd9a0','#ff9a5a','#d24a43'],u:[.5,.56,.14,'#fff6d8'],h:['#bd4b33','#8c3029','#5c1d29','#300f21'],st:0},
{s:['#06122a','#12305a','#40306f'],u:[.78,.22,.05,'#f5f1ff'],h:['#21405f','#14304a','#0c1f36','#050e1c'],st:1},
{s:['#c4f6dc','#82e2b8','#2fa583'],u:[.3,.28,.09,'#ffffff'],h:['#41b98d','#2b9370','#17664d','#0b402f'],st:0},
{s:['#1a0b2e','#6a1b9a','#ff4fa8'],u:[.5,.5,.12,'#ffe0f3'],h:['#44186e','#2a1250','#170a34','#0a061a'],st:1},
{s:['#0c2429','#1a5a56','#7adcc8'],u:[.72,.34,.07,'#eafff9'],h:['#318e84','#1d625c','#103c40','#06202a'],st:1},
{s:['#fbe6ff','#d8abff','#8d7cff'],u:[.24,.4,.1,'#fffbe8'],h:['#a284ff','#6f58db','#4535a6','#271c63'],st:0}];
var ARTCACHE={};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function art(i,w,h){var key=i+'/'+w+'/'+h;if(ARTCACHE[key])return ARTCACHE[key];var sc=SCENES[((i%8)+8)%8],c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d'),rnd=mulberry(i*7919+13);
 var g=x.createLinearGradient(0,0,0,h*.8);g.addColorStop(0,sc.s[0]);g.addColorStop(.55,sc.s[1]);g.addColorStop(1,sc.s[2]);x.fillStyle=g;x.fillRect(0,0,w,h);
 if(sc.st){for(var k=0;k<90;k++){x.fillStyle='rgba(255,255,255,'+(.25+rnd()*.6)+')';var r=rnd()*1.4+.3;x.beginPath();x.arc(rnd()*w,rnd()*h*.55,r,0,6.283);x.fill()}}
 var ux=sc.u[0]*w,uy=sc.u[1]*h,ur=sc.u[2]*Math.min(w,h),gl=x.createRadialGradient(ux,uy,ur*.2,ux,uy,ur*4.2);gl.addColorStop(0,sc.u[3]+'cc');gl.addColorStop(1,sc.u[3]+'00');x.fillStyle=gl;x.fillRect(0,0,w,h);x.fillStyle=sc.u[3];x.beginPath();x.arc(ux,uy,ur,0,6.283);x.fill();
 for(var L=0;L<4;L++){var y0=h*(.5+L*.11),amp=h*(.07-L*.008),p1=rnd()*6,p2=rnd()*6,p3=rnd()*6,f1=2.2+rnd()*1.4,f2=5+rnd()*3,f3=11+rnd()*5;x.beginPath();x.moveTo(0,h);for(var px=0;px<=w+3;px+=3){var t=px/w;x.lineTo(px,y0+Math.sin(t*f1+p1)*amp+Math.sin(t*f2+p2)*amp*.45+Math.sin(t*f3+p3)*amp*.18)}x.lineTo(w,h);x.closePath();
  var hg=x.createLinearGradient(0,y0-amp,0,h);hg.addColorStop(0,sc.h[L]);hg.addColorStop(1,L<3?sc.h[L+1]:'#000');x.fillStyle=hg;x.fill();
  if(L<3){var fg=x.createLinearGradient(0,y0-amp,0,y0+h*.12);fg.addColorStop(0,'rgba(255,255,255,.13)');fg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=fg;x.fill()}}
 for(var n=0;n<Math.round(w*h/90);n++){x.fillStyle=rnd()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.05)';x.fillRect(rnd()*w,rnd()*h,1,1)}
 ARTCACHE[key]=c;return c}
function artURL(i,w,h){var c=art(i,w,h);if(!c.u)c.u=c.toDataURL('image/jpeg',.88);return c.u}`;
