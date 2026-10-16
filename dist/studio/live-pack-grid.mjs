// Original live backgrounds: terrain, grids and perspective scenes. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
const hexHelper=`vec4 hexc(vec2 p){vec2 r=vec2(1.,1.7320508),h=r*.5;vec2 a=mod(p,r)-h,b=mod(p-h,r)-h;vec2 g=dot(a,a)<dot(b,b)?a:b;return vec4(g,floor((p-g)*2.+.5)*.5);}`;
export const shaders={
'terrain-glide':withHelpers(`float h3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return v;}
float terr(vec2 p){return (h3(p*.42+uSeed)*1.9-.85)*(.6+uAmount*.8);}`,
 `vec2 p=frag();float t=uTime*.7*uScale;vec3 ro=vec3(0.,0.,t);ro.y=terr(vec2(0.,t))+.75;vec3 rd=normalize(vec3(p.x,p.y-.1,.95));
 float s=.12;bool hit=false;vec3 pos=ro;
 for(int i=0;i<48;i++){pos=ro+rd*s;float h=terr(pos.xz);if(pos.y<h){hit=true;break;}s+=max(.05,(pos.y-h)*.55)+s*.03;}
 vec3 sky=mix(uC2,uC3,smoothstep(-.05,.55,p.y));vec2 sp=vec2(.34,.2);float sd=length(p-sp);sky+=vec3(1.,.9,.7)*(smoothstep(.04,.025,sd)*1.1+exp(-sd*5.)*.45)*(.6+.4*uC2.r);
 vec3 col=sky;
 if(hit){float h=terr(pos.xz);float e=.06;vec3 n=normalize(vec3(terr(pos.xz-vec2(e,0.))-terr(pos.xz+vec2(e,0.)),e*2.,terr(pos.xz-vec2(0.,e))-terr(pos.xz+vec2(0.,e))));
  vec3 L=normalize(vec3(.5,.45,.7));float diff=max(dot(n,L),0.);vec3 ground=mix(uC0,uC1,clamp(h*1.2+.4,0.,1.))*(.35+.9*diff);ground=mix(ground,uC1*1.3,smoothstep(.45,.9,h)*.4);
  float fog=1.-exp(-s*.075);col=mix(ground,sky*.95,clamp(fog,0.,1.));}
 gl_FragColor=vec4(finish(col),1.);`),
'canyon-flight':withHelpers(`float cn(vec2 q,float P,vec2 sc){return mix(fbm(q*sc),fbm((q-vec2(P,0.))*sc),q.x/P);}`,
 `vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float P=8.;float z0=1./(r+.05);
 float R=.62+.07*sin(a*2.+z0*.25+t*.1)+.05*sin(a*3.-z0*.35+uSeed);float rr=r/R;float z=1./(rr+.04);float u=(a+3.14159)/6.28318*P;float v=z*.55+t*.9;
 float rock=cn(vec2(u,v),P,vec2(.8,.9))*.9+.35*cn(vec2(u,v),P,vec2(2.4,2.8));
 float strata=.5+.5*sin(v*11.+rock*6.);float lit=.25+.75*pow(.5+.5*cos(a-1.1+sin(t*.2)*.4),1.8);
 float fog=exp(-z*(.05-uAmount*.02));vec3 wall=mix(uC0,uC1,clamp(rock*1.5-.1,0.,1.))*(.2+1.15*lit)*(.6+.55*strata);wall=mix(wall,uC2,smoothstep(.65,1.,strata)*.12);
 vec3 col=mix(uC3*.25,wall,fog);col+=uC3*exp(-r*5.)*.4*(1.-fog)+uC2*exp(-r*2.2)*.1;col*=smoothstep(.0,.04,r)*.6+.4;
 gl_FragColor=vec4(finish(col),1.);`),
'particle-sea':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float t=uTime*.7;vec3 col=mix(uC0*.6,uC0,uv.y);float acc=0.;vec3 tint=vec3(0.);
 for(int j=0;j<34;j++){float fj=float(j);float zj=1.2+fj*.34;float s=1./zj;float sp=.09;float X=(uv.x-.5)*asp/s;float cell=floor(X/sp+.5);float Xc=cell*sp;
  float H=(.32*sin(Xc*1.2+zj*.9+t)+.16*sin(Xc*2.7-zj*1.5+t*1.4)+.1*sin(Xc*.6+zj*.4-t*.7))*(.5+uAmount*.9);
  vec2 dp=vec2(.5+Xc*s/asp,.3+(H-.4)*s*1.05+.14*s);float d=length((uv-dp)*vec2(asp,1.));float rad=.0022+.0042*s*1.4;
  float depthFade=smoothstep(1.,.0,fj/34.)*.9+.1;float b=smoothstep(rad,rad*.3,d)*depthFade;acc+=b;tint+=ramp(.25+.75*clamp(.5+H*2.2,0.,1.))*b*(.55+.9*s);}
 col+=tint*1.3+uC3*0.;col+=uC2*exp(-abs(uv.y-.62)*12.)*.06;
 gl_FragColor=vec4(finish(col),1.);`),
'dust-rings':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float N=22.;float q=r*N-t*.9;float k=floor(q),fk=fract(q)-.5;
 float cnt=floor(20.+abs(k)*9.);float sa=(a+3.14159)/6.28318*cnt;float id=floor(sa),fa=fract(sa)-.5;
 float h=hash(vec2(id,k+uSeed));vec2 o=(hash22(vec2(id,k))-.5)*.6;float arc=(fa-o.x)*6.28318*r/cnt;float rad=(fk-o.y*.5)/N;float d=length(vec2(arc,rad));
 float wave=.5+.5*sin(k*.45-t*1.1+sin(a*3.+t*.4)*1.3);float dm=smoothstep(.0075,.0012,d)*step(.12,h)*(.3+.7*wave);
 vec3 col=uC0+ramp(.2+.7*wave)*dm*(1.2+uAmount)+uC3*dm*dm*.5;col*=smoothstep(.05,.3,r)*smoothstep(1.2,.5,r);col+=uC1*exp(-r*5.)*.05;
 gl_FragColor=vec4(finish(col),1.);`),
'voxel-sea':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float t=uTime*.6;vec3 col=mix(uC0*.6,uC0,smoothstep(.2,.8,uv.y))+uC1*.06*(1.-uv.y);col+=uC2*exp(-abs(uv.y-.5)*8.)*.12;
 for(int j=0;j<26;j++){float zj=1.1+float(25-j)*.3;float s=1./zj;float sp=.2;float X=(uv.x-.5)*asp/s;float cell=floor(X/sp+.5);float Xc=cell*sp;float fx=X/sp-cell;
  float curve=-.14*Xc*Xc*s;float H=.22+.18*sin(Xc*1.4+zj*1.1+t)*(.5+uAmount*.9)+.1*sin(Xc*3.1-zj*.9+t*1.3);
  float topY=.5+(H-.3)*s*.9+curve+.05,botY=.5+(-.3)*s*.9+curve+.05-0.12*s;float inX=step(abs(fx),.44);
  float inTop=step(botY,uv.y)*step(uv.y,topY)*inX;
  if(inTop>.5){float fy=(uv.y-botY)/max(topY-botY,.001);float shade=.4+.6*smoothstep(0.,1.,fy);vec3 c=ramp(clamp(.2+H*2.1,0.,1.))*shade;c=mix(c,uC3,smoothstep(.9,1.,fy)*.6);c=mix(c,sqrt(uC2*uC3)*.6,smoothstep(.0,5.,zj-1.)*.5);col=c;}}
 gl_FragColor=vec4(finish(col),1.);`),
'hex-lantern':withHelpers(hexHelper,`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=frag()*(6.+uScale*3.);vec4 h=hexc(p);vec2 g=h.xy,id=h.zw;
 vec2 lp=(uPointer-.5)*vec2(asp,1.)*(6.+uScale*3.);lp=mix(lp,vec2(sin(uTime*.4)*3.,cos(uTime*.33)*1.6),step(length(uPointer-.5),.001));
 vec2 cp=p-g;float dl=length(cp-lp);float lit=exp(-dl*dl*.06*(1.2-uAmount*.5));
 float hd=max(abs(g.x)*.866+abs(g.y)*.5,abs(g.y));float inner=smoothstep(.5,.44,hd);float rim=smoothstep(.5,.46,hd)*smoothstep(.36,.5,hd);
 vec2 toL=normalize(lp-cp+1e-4);vec2 nrm=normalize(g+1e-4);float edgeLit=max(dot(nrm,toL),0.);
 vec3 col=uC0+ramp(.2+.7*lit)*inner*(.1+1.1*lit)+uC3*rim*(.15+.9*edgeLit*lit)+uC1*inner*.05;
 gl_FragColor=vec4(finish(col),1.);`),
'squircle-shift':main(`float cs=max(18.,floor(uRes.y/10./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;vec2 p=((id+.5)*cs-.5*uRes)/uRes.y;float t=uTime*.6;
 float w=.5+.5*sin(length(p)*5.-t*1.3+sin(p.x*3.+t)*.8+uSeed);float nexp=2.+6.*(1.-w)*(.5+uAmount);float sz=.2+.27*w;
 float sq=pow(pow(abs(f.x),nexp)+pow(abs(f.y),nexp),1./nexp);float m=smoothstep(sz,sz-.07,sq);float rim=smoothstep(sz,sz-.02,sq)*smoothstep(sz-.07,sz-.03,sq);
 vec3 col=uC0+ramp(.15+.8*w)*m*(.35+.8*w)+uC3*rim*.5*w+ramp(w)*exp(-sq*5.)*.06;
 gl_FragColor=vec4(finish(col),1.);`),
'tech-wall':main(`float cs=max(20.,floor(uRes.y/9./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g);float t=uTime;float h=hash(id+uSeed);
 float bx=min(min(f.x,1.-f.x),min(f.y,1.-f.y));float bevel=smoothstep(.02,.1,bx);float panel=smoothstep(.0,.04,bx);
 float sw=exp(-pow((id.x/ (uRes.x/cs)-fract(t*.07+.1))*5.,2.))+exp(-pow((id.y/(uRes.y/cs)-fract(t*.05+.3))*6.,2.))*.7;
 float strips=step(.5,fract(f.y*5.+h*3.))*step(.2,f.x)*step(f.x,.8)*step(.1,f.y)*step(f.y,.9)*step(.45,h);
 float lit=sw*(.35+.65*step(.3,h))+.12*step(.8,hash(id+floor(t*.5)));
 vec3 metal=mix(uC0,uC1,.3+.5*(1.-f.y))*(.55+.4*bevel)*(.8+.2*h);
 vec3 col=metal*panel+ramp(.3+.7*lit)*(strips*lit*1.6+smoothstep(.15,.0,abs(bx-.07))*lit*.9)+uC3*step(.97,h)*(.4+.4*sin(t*3.+h*50.))*bevel*.3;
 gl_FragColor=vec4(finish(col),1.);`),
'mosaic-waves':main(`float cs=max(14.,floor(uRes.y/22./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;vec2 p=((id+.5)*cs-.5*uRes)/uRes.y;float t=uTime*.5;
 float w=.5+.25*sin(p.x*4.2+t)+.25*sin(p.y*5.-t*1.2+p.x*2.)+.15*sin(length(p)*8.-t*1.7);float tw=hash(id+uSeed)*.12;float q=clamp(floor((w+tw)*5.)/5.,0.,1.);
 float edge=max(abs(f.x),abs(f.y));float tile=smoothstep(.5,.44,edge);float bev=smoothstep(.44,.3,edge);
 vec3 col=uC0+ramp(.1+.9*q)*tile*(.55+.45*bev)+uC3*smoothstep(.44,.5,edge)*tile*.1*q;col*=.92+.08*hash(id+3.);
 gl_FragColor=vec4(finish(col),1.);`),
'louvre-roll':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float N=floor(24.*uScale);float xs=uv.x*N;float id=floor(xs),fx=fract(xs)-.5;float t=uTime*.7;
 float th=t+id*.35+sin(id*.5+t*.5)*.8;float cs=cos(th),sn=sin(th);float face=abs(fx)<.46?1.:0.;
 float lit=max(cs,0.)*.8+.22*abs(cs)+.08;vec3 base=ramp(clamp(.1+.85*(.5+.5*sin(id*.28+t*.4)),0.,1.));
 float shade=.45+.55*smoothstep(-.5,.5,fx*sn*1.2+cs*.2);vec3 col=uC0*.4+base*lit*shade*face*(.35+.8*uv.y*.5+.6*(1.-uv.y));
 col+=uC3*pow(max(cs,0.),12.)*face*.5*(1.-abs(fx)*1.6);col*=.65+.35*smoothstep(.5,.35,abs(fx));
 gl_FragColor=vec4(finish(col),1.);`),
'horizon-lines':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float hor=.18;vec3 col=mix(uC0,uC1*.3,exp(-abs(uv.y-hor)*5.));float t=uTime;
 if(uv.y>hor){float d=uv.y-hor;float z=1./(d+.03);float ln=smoothstep(.06,0.,abs(fract(z*.55*uScale-t*.5)-.5)-.44);float fadeUp=smoothstep(1.,.15,d);col+=ramp(.3+.6*fadeUp)*ln*fadeUp*(.4+uAmount*.8)*(.5+.5*exp(-d*4.));
  float vx=abs(fract((uv.x-.5)*asp*z*.16)-.5);col+=uC1*smoothstep(.02,0.,vx-.47)*.0;}
 col+=uC3*exp(-abs(uv.y-hor)*60.)*1.0*exp(-pow((uv.x-.5)*1.3,2.))+uC2*exp(-abs(uv.y-hor)*10.)*.4*exp(-pow((uv.x-.5)*1.6,2.));
 col+=step(.9985,hash(floor(gl_FragCoord.xy/2.)+uSeed))*smoothstep(.4,.9,uv.y)*.6;
 gl_FragColor=vec4(finish(col),1.);`),
'ridgeline-stack':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float x=(uv.x-.5)*asp;vec3 col=uC0;float t=uTime*.25;
 for(int i=0;i<28;i++){float k=float(i)/27.;float base=.88-k*.8;float env=exp(-pow(x*(1.6-.5*k),2.)*1.4);
  float n=fbm(vec2(x*3.2*uScale+uSeed,k*4.+t))*1.3+.5*fbm(vec2(x*9.,k*7.-t*1.4));float h=(.02+.26*env*pow(n,1.6))*(.5+uAmount);float y0=base+h*(.6+.8*k);
  float fill=step(uv.y,y0);float edge=smoothstep(.004,0.,abs(uv.y-y0));
  col=mix(col,uC0*.8,fill*step(base-.1,uv.y+.08));col+=ramp(.25+.7*k)*edge*(.5+.7*k)*step(base-.04,uv.y);}
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['terrain-glide','Terrain Glide','Live nature','Orange','Gliding low over rolling terrain towards a sinking sun.',['terrain','landscape','flight','sunset'],['#2a1a3a','#7a4a5a','#ff9a62','#3a4a8a'],.8,1,.5,'Relief'],
 ['canyon-flight','Cavern Flight','Live nature','Orange','An endless flight down a winding cavern of layered rock.',['cavern','flight','rock','tunnel'],['#1a0a08','#8a3a1a','#ffb36a','#ffe2b8'],.9,1,.5,'Haze'],
 ['particle-sea','Particle Sea','Live nature','Blue','A calm sea made of glowing particles rolling in long swells.',['particles','sea','waves','dots'],['#03050c','#2a5fd8','#6ab8ff','#d8f0ff'],.9,1,.5,'Swell'],
 ['dust-rings','Dust Rings','Live geometric','Purple','Wavy rings of fine dust drifting outward from a dark centre.',['rings','dust','radial','particles'],['#04030a','#5a3fd0','#c090ff','#ffffff'],.9,1,.5,'Brightness'],
 ['voxel-sea','Voxel Sea','Live nature','Blue','A curved horizon of square columns rolling like a calm sea.',['voxel','columns','sea','blocks'],['#05080f','#1f6fd0','#7fd0ff','#ffd2b0'],.9,1,.5,'Swell'],
 ['hex-lantern','Hex Lantern','Live geometric','Purple','A hexagon grid lit by a soft lantern that follows your pointer.',['hexagon','light','interactive','grid'],['#050410','#5a3fd8','#9a7aff','#e8e0ff'],.9,1,.5,'Light spread'],
 ['squircle-shift','Squircle Shift','Live geometric','Green','A glowing grid of squircles that morph between circle and square.',['squircle','grid','morph','shape'],['#030a08','#0d6b4a','#33e0a0','#d8fff0'],.9,1,.5,'Morph'],
 ['tech-wall','Tech Wall','Live tech & retro','Blue','A wall of metal panels swept by moving bars of light.',['panels','wall','sci-fi','led'],['#05080e','#2a3a52','#4ac8ff','#ffffff'],.9,1,.5,'Glow'],
 ['mosaic-waves','Mosaic Waves','Live geometric','Orange','Waves rolling through a mosaic of shifting square tiles.',['mosaic','tiles','waves','pixel'],['#0a0504','#8a2a10','#ff7a2a','#ffe0a8'],.9,1,.5,'Wave'],
 ['louvre-roll','Louvre Roll','Live geometric','Purple','Vertical louvres of light tilting and rolling across the frame.',['louvre','blinds','slats','light'],['#06040f','#5a3fe0','#ff5fa8','#ffe8a8'],.9,1,.5,'Colour range'],
 ['horizon-lines','Horizon Lines','Live light & particles','Pink','Lines of light rising from a glowing horizon into the sky.',['horizon','lines','rising','glow'],['#05030c','#ff4fa8','#8a5cff','#ffe0f0'],.9,1,.5,'Line strength'],
 ['ridgeline-stack','Ridgeline Stack','Live geometric','Neutral','Stacked ridgelines in the style of a classic pulsar plot.',['ridgeline','lines','plot','minimal'],['#070709','#6a7088','#e8eaf4','#ffffff'],.7,1,.5,'Height']
];
