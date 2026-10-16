// Original live backgrounds: abstract and geometric. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
const hexHelper=`vec4 hexc(vec2 p){vec2 r=vec2(1.,1.7320508),h=r*.5;vec2 a=mod(p,r)-h,b=mod(p-h,r)-h;vec2 g=dot(a,a)<dot(b,b)?a:b;return vec4(g,floor((p-g)*2.+.5)*.5);}`;
export const shaders={
'voronoi-glass':withHelpers(`vec3 avoro(vec2 p,float t){vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.,id=0.;for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));vec2 h=hash22(n+g+uSeed);vec2 o=.5+.45*sin(t+6.2831*h);vec2 r=g+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=hash(n+g+uSeed);}else if(d<d2){d2=d;}}}return vec3(sqrt(d1),sqrt(d2),id);}`,
 `vec2 p=frag()*4.2*uScale;vec3 v=avoro(p,uTime*.35);
 float edge=smoothstep(0.,.1+uAmount*.12,v.y-v.x);
 vec3 cell=ramp(v.z*.8+.05)*(.5+.55*(1.-v.x*1.2));
 vec3 col=mix(uC3*.7,cell*.85,edge);col+=uC3*pow(1.-edge,3.)*.12;col*=.9+.1*fbm(p*3.);
 gl_FragColor=vec4(finish(col),1.);`),
'truchet-weave':main(`vec2 p=frag()*4.5*uScale;p+=vec2(uTime*.06,0.);vec2 id=floor(p),f=fract(p);
 if(hash(id+uSeed)>.5)f.x=1.-f.x;
 float d=min(abs(length(f)-.5),abs(length(f-1.)-.5));
 float w=.07+.08*uAmount;float line=smoothstep(w+.015,w-.005,d);
 float pulse=.5+.5*sin(uTime*1.6+hash(id)*6.28-d*8.);
 vec3 col=uC0*(.7+.3*hash(id));col=mix(col,ramp(.35+.65*pulse),line);col+=uC3*smoothstep(w*.4,0.,d)*.35;
 gl_FragColor=vec4(finish(col),1.);`),
'kaleido-bloom':main(`vec2 p=frag();float a=atan(p.y,p.x),r=length(p);float n=6.;
 a=abs(mod(a+uTime*.05,6.28318/n)-3.14159/n);
 vec2 q=r*vec2(cos(a),sin(a))*3.*uScale;float t=uTime*.15;
 float v=fbm(q*1.2+vec2(t,-t))*1.4+.35*sin(r*9.-uTime*.8+uSeed);
 vec3 col=ramp(.5+.5*sin(v*(2.5+uAmount*3.)+r*2.));col*=.4+.55*smoothstep(1.1,0.,r);
 gl_FragColor=vec4(finish(col),1.);`),
'moire-rings':main(`vec2 p=frag()*uScale;float t=uTime*.2;vec2 c1=vec2(sin(t)*.3,cos(t*1.3)*.2),c2=vec2(cos(t*.8)*.3,sin(t*1.1)*-.2);
 float f=60.+uAmount*60.;float a=sin(length(p-c1)*f),b=sin(length(p-c2)*f);
 float m=smoothstep(-.1,.1,a)*smoothstep(-.1,.1,b)+smoothstep(.1,-.1,a)*smoothstep(.1,-.1,b);
 vec3 col=mix(uC0,uC1,m);col+=uC2*pow(.5+.5*a*b,6.)*.7;col+=uC3*.1*(.5+.5*sin(length(p)*8.-uTime));
 gl_FragColor=vec4(finish(col),1.);`),
'isometric-cubes':withHelpers(hexHelper,`vec2 p=frag()*4.*uScale;vec4 h=hexc(p);vec2 g=h.xy,id=h.zw;
 float a=atan(g.y,g.x)+3.14159;float face=mod(floor((a+.5236)/2.0944),3.);
 float hgt=.5+.5*sin(uTime*.9+hash(id+uSeed)*6.28);float lift=hgt*(.25+uAmount*.5);
 float shade=face<.5?1.:face<1.5?.62:.36;
 vec3 base=ramp(.2+.7*hash(id+1.));
 vec3 col=base*(shade*(.55+.45*(1.-lift)));
 float edge=smoothstep(.5,.46,max(abs(g.x)*.866+abs(g.y)*.5,abs(g.y)))*0.;
 float fx=(a+.5236)/2.0944;float fe=min(fract(fx),1.-fract(fx))*2.0944*length(g);col*=.55+.45*smoothstep(0.,.045,fe);col+=uC3*.06*lift;
 gl_FragColor=vec4(finish(col),1.);`),
'flow-fur':withHelpers(`vec2 field(vec2 p,float t){float a=fbm(p*.9+vec2(t,-t*.7))*12.5+uSeed;return vec2(cos(a),sin(a));}`,
 `vec2 p=frag()*2.4*uScale;float t=uTime*.06,acc=0.,w=0.;vec2 q=p;
 for(int i=0;i<14;i++){q-=field(q,t)*.022;float s=hash(floor(q*70.));acc+=s;w+=1.;}
 acc/=w;float ang=atan(field(p,t).y,field(p,t).x);
 vec3 col=mix(uC0,ramp(.5+.5*sin(ang*1.5+uTime*.2)),smoothstep(.25,.8,acc));col*=.7+.7*acc*(.5+uAmount);
 gl_FragColor=vec4(finish(col),1.);`),
'julia-bloom':main(`vec2 z=frag()*1.5*uScale;float a=uTime*.08+uSeed*.1;vec2 c=.7885*vec2(cos(a),sin(a))*(.9+uAmount*.12);float n=0.;
 for(int i=0;i<56;i++){if(dot(z,z)>16.)break;z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;n+=1.;}
 float s=n-log2(max(log2(max(dot(z,z),1.0001)),.0001))+4.;float v=s/56.;
 vec3 col=n>=55.?uC0*.5:ramp(fract(v*1.8+uTime*.03));col*=.35+.9*pow(v,.6);
 gl_FragColor=vec4(finish(col),1.);`),
'hex-pulse':withHelpers(hexHelper,`vec2 p=frag()*(5.+uScale*2.);vec4 h=hexc(p);vec2 g=h.xy,id=h.zw;
 float wave=.5+.5*sin(length(id)*1.1-uTime*2.2+uSeed);wave=pow(wave,1.5+uAmount*3.);
 float hd=max(abs(g.x)*.866+abs(g.y)*.5,abs(g.y));
 float inner=smoothstep(.5,.4,hd);vec3 col=uC0+ramp(.3+.7*wave)*inner*(.35+.9*wave);
 col+=uC3*smoothstep(.5,.46,hd)*smoothstep(.4,.46,hd)*(.1+.5*wave);
 gl_FragColor=vec4(finish(col),1.);`),
'op-art-warp':main(`vec2 q=frag()*5.*uScale;float t=uTime*.5;q+=vec2(sin(q.y*.8+t),cos(q.x*.8-t))*(.4+uAmount*1.2);
 float c=mod(floor(q.x)+floor(q.y),2.);vec2 f=fract(q);float bev=smoothstep(0.,.25,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
 vec3 col=mix(uC0,uC2,c);col=mix(col,ramp(.4+.6*c)*(.7+.3*bev),.55);col*=.7+.3*bev;col+=uC3*pow(1.-bev,4.)*.2;
 gl_FragColor=vec4(finish(col),1.);`),
'guilloche':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x);vec3 col=uC0*.6;
 for(int i=0;i<22;i++){float k=float(i)/22.;
  float rr=.1+.5*k+.07*sin(a*7.+uTime*.4+k*6.)*(.5+uAmount)+.04*sin(a*13.-uTime*.3+k*9.+uSeed)+.03*sin(a*3.+uTime*.2);
  float d=abs(r-rr);col+=ramp(k)*exp(-d*(120.+uAmount*80.))*.5;}
 col*=.8+.3*smoothstep(1.1,0.,r);
 gl_FragColor=vec4(finish(col),1.);`),
'triangle-mosaic':main(`vec2 p=frag()*(6.+uScale*3.);vec2 q=vec2(p.x-p.y*.57735,p.y*1.1547);vec2 id=floor(q),f=fract(q);float up=step(1.,f.x+f.y);id+=up*.5;
 float h=hash(id+uSeed);float tw=.5+.5*sin(uTime*(.5+h)+h*30.);
 vec3 col=ramp(clamp(h*.6+tw*.4*(.4+uAmount),0.,1.));col*=.65+.5*tw;
 float edge=min(min(f.x,f.y),1.-(f.x+f.y>1.?f.x+f.y-1.:f.x+f.y))*0.+min(min(f.x,f.y),abs(1.-f.x-f.y));
 col*=.85+.15*smoothstep(0.,.06,edge);
 gl_FragColor=vec4(finish(col),1.);`),
'plexus-net':main(`vec2 uv=frag()*uScale;vec3 col=mix(uC0*.7,uC0,uv.y+.5);float t=uTime*.3;

 for(int i=0;i<7;i++){float k=float(i);float ph=k*1.9+uSeed;vec2 c=vec2(.55*sin(t*(.7+.1*k)+ph),.3*cos(t*(.9+.07*k)+ph*1.3));
  col+=uC3*exp(-length(uv-c)*30.)*1.2;
  for(int j=0;j<9;j++){if(j>i){float m=float(j);float ph2=m*1.9+uSeed;vec2 c2=vec2(.55*sin(t*(.7+.1*m)+ph2),.3*cos(t*(.9+.07*m)+ph2*1.3));
   float len=length(c-c2);float d=sdSeg(uv,c,c2);col+=ramp(.3+len)*exp(-d*160.)*smoothstep(.8,.12,len)*(.9+uAmount*.9);}}}
 gl_FragColor=vec4(finish(col),1.);`),
'spiral-arms':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x);float arms=3.;
 float sp=sin(arms*(a-log(r+.04)*(1.6+uAmount*1.4))+uTime*.35+uSeed);
 float dens=pow(.5+.5*sp,2.)*exp(-r*1.8);float cloud=fbm(vec2(a*2.,log(r+.04)*4.)+uTime*.04);
 vec3 col=mix(uC0,ramp(.3+.7*dens*1.6),clamp(dens*1.8+cloud*.25*exp(-r),0.,1.));
 col+=uC3*exp(-r*10.)*1.1;col+=uC3*step(.997,hash(floor(gl_FragCoord.xy/2.)))*.7;
 gl_FragColor=vec4(finish(col),1.);`),
'square-tunnel':main(`vec2 p=frag();p+=(uPointer-.5)*.2;float d=max(abs(p.x),abs(p.y))+.003;float z=1./d*uScale;
 float band=fract(z*.85-uTime*.5);float stripe=smoothstep(.0,.04,band)*smoothstep(.3,.24,band);
 vec3 col=mix(uC0,ramp(fract(z*.04+uSeed*.1)),stripe*(.5+uAmount*.6));col+=uC3*smoothstep(.1,0.,band)*.2*stripe;col*=smoothstep(0.,.5,d)*.8+.2;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['voronoi-glass','Voronoi Glass','Live geometric','Purple','Shifting stained-glass cells with luminous edges.',['voronoi','cells','glass'],['#14102b','#5b3fd9','#ee6fc0','#fff1d6'],.9,1,.5,'Edge softness'],
 ['truchet-weave','Truchet Weave','Live geometric','Green','Interlocking arcs with pulses of light running along them.',['truchet','tiles','arcs'],['#07140f','#0f6b4e','#3de0a3','#d7ffee'],.9,1,.5,'Line width'],
 ['kaleido-bloom','Kaleido Bloom','Live geometric','Pink','A six-fold kaleidoscope blooming from the centre.',['kaleidoscope','symmetry','bloom'],['#16081f','#7a2fa8','#ff6fb4','#ffe3a8'],.8,1,.5,'Colour range'],
 ['moire-rings','Moire Rings','Live geometric','Neutral','Two ring patterns drifting through each other.',['moire','rings','optical'],['#07090e','#1c2a44','#7fa9ff','#ffffff'],.9,1,.5,'Ring density'],
 ['isometric-cubes','Isometric Cubes','Live geometric','Blue','A field of isometric cubes rising and falling in waves.',['cubes','isometric','3d'],['#0a1030','#2a5bd7','#7fd0ff','#ffd27a'],.9,1,.5,'Lift'],
 ['flow-fur','Flow Fur','Live geometric','Purple','Fine strands combed along a drifting flow field.',['flow','strands','texture'],['#0a0716','#4a2bb0','#ff7ac8','#ffd2a8'],.9,1,.5,'Strand glow'],
 ['julia-bloom','Julia Bloom','Live geometric','Blue','A slowly morphing Julia fractal in glowing colour.',['fractal','julia','maths'],['#030614','#1b2f9c','#33d1ff','#ffe9a8'],.8,1,.5,'Morph'],
 ['hex-pulse','Hex Pulse','Live geometric','Green','A hex grid with waves of light travelling across it.',['hexagon','grid','pulse'],['#050f0c','#0f6a55','#35e0b0','#d8fff0'],.9,1,.5,'Wave sharpness'],
 ['op-art-warp','Op Art Warp','Live geometric','Neutral','A warped checkerboard that ripples like fabric.',['checker','op art','warp'],['#0b0b10','#2a2a40','#f2f0e6','#7a7aff'],.9,1,.5,'Warp'],
 ['guilloche','Guilloche','Live geometric','Blue','Banknote-style interlaced curves, finely drawn in light.',['guilloche','lines','luxe'],['#04101c','#1f6fb0','#74d6ff','#f3fbff'],.8,1,.5,'Line glow'],
 ['triangle-mosaic','Triangle Mosaic','Live geometric','Orange','A faceted triangle mosaic that glimmers cell by cell.',['triangles','mosaic','low poly'],['#2a0f1a','#b83a4b','#ff9a4d','#ffe0a8'],.9,1,.5,'Glimmer'],
 ['plexus-net','Plexus Net','Live geometric','Blue','Drifting nodes joined by fine, glowing lines.',['network','nodes','plexus'],['#050a18','#1d3f8f','#5fb0ff','#cfe9ff'],.9,1,.5,'Line strength'],
 ['spiral-arms','Spiral Arms','Live geometric','Purple','A swirling spiral galaxy with a bright core.',['galaxy','spiral','space'],['#05030f','#3b1f8a','#c05bff','#ffe0f0'],.8,1,.5,'Arm tightness'],
 ['square-tunnel','Square Tunnel','Live geometric','Purple','Nested squares rushing past as if you were flying through.',['tunnel','squares','speed'],['#07040f','#4b24b8','#ff5fa8','#ffffff'],1,1,.5,'Stripe strength']
];
