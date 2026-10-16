// Original live backgrounds: industrial, mechanical and automotive. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
const hexHelper=`vec4 hexc(vec2 p){vec2 r=vec2(1.,1.7320508),h=r*.5;vec2 a=mod(p,r)-h,b=mod(p-h,r)-h;vec2 g=dot(a,a)<dot(b,b)?a:b;return vec4(g,floor((p-g)*2.+.5)*.5);}`;
export const shaders={
'gear-train':withHelpers(`vec2 gear(vec2 p,vec2 c,float R,float n,float rot){vec2 q=p-c;float r=length(q),a=atan(q.y,q.x)+rot;float t=clamp(sin(n*a)*2.6,-1.,1.);float outer=R*(1.+.1*t);
 float body=smoothstep(outer+.004,outer-.004,r);float hole=smoothstep(R*.2,R*.2+.004,r);
 float ring=smoothstep(R*.44,R*.44+.004,r)*smoothstep(R*.7,R*.7-.004,r);float spokes=smoothstep(.2,.4,abs(sin(a*2.5)));
 body*=hole*(1.-ring*(1.-spokes));return vec2(body,clamp((outer-r)/(R*.12),0.,1.));}`,
 `vec2 p=frag()*uScale*1.55;float t=uTime*.45;vec3 col=uC0+uC1*.18*(smoothstep(.02,0.,abs(fract(p.x*8.)-.5)-.48)+smoothstep(.02,0.,abs(fract(p.y*8.)-.5)-.48));
 float w=t*(.6+uAmount*.6);
 vec2 g1=gear(p,vec2(-.32,.08),.30,15.,w),g2=gear(p,vec2(.18,.08),.20,10.,-w*1.5+.314),g3=gear(p,vec2(.296,-.24),.14,7.,w*2.143+.1),g4=gear(p,vec2(-.498,-.409),.22,11.,-w*1.364+.14);
 vec3 steel=ramp(.55);
 float lightA=.5+.5*sin(atan(p.y-.08,p.x+.32)*1.+1.);
 vec3 m1=mix(uC1,uC2,g1.y*.7+.15*lightA)*(.6+.5*g1.y),m2=mix(uC1,uC3,g2.y*.6)*(.6+.5*g2.y),m3=mix(uC1,uC2,g3.y*.8)*(.6+.5*g3.y),m4=mix(uC1,uC2,g4.y*.7)*(.6+.5*g4.y);
 col=mix(col,m4,g4.x);col=mix(col,m1,g1.x);col=mix(col,m2,g2.x);col=mix(col,m3,g3.x);
 col*=1.-.35*smoothstep(.9,.2,1.-length(frag()));
 gl_FragColor=vec4(finish(col),1.);`),
'carbon-weave':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y)*(22.*uScale);vec2 id=floor(p),f=fract(p);
 float tw=mod(id.x+id.y,4.);float over=step(tw,1.5);
 float h=over>.5?sin(f.y*3.14159):sin(f.x*3.14159);float thread=over>.5?abs(f.y-.5):abs(f.x-.5);
 float shade=.35+.55*h;float diag=.5+.5*sin((uv.x*1.1+uv.y*1.6)*5.-uTime*.6);
 float spec=pow(max(0.,sin((uv.x+uv.y*.6)*2.6-uTime*.5+uSeed)),14.)*(.5+uAmount);
 vec3 col=mix(uC0,uC1,shade)*(.7+.3*diag)+uC2*spec*h*(over>.5?1.:.6)+uC3*pow(h,8.)*.05;
 col*=.9+.1*hash(id+1.);
 gl_FragColor=vec4(finish(col),1.);`),
'tach-dial':main(`vec2 p=frag()*uScale*.82;p.y+=.02;float r=length(p);float a=atan(p.x,p.y);float ang=a/6.28318;
 float start=-.375,span=.75;float fr=(ang-start)/span;float inArc=step(0.,fr)*step(fr,1.);
 float val=.5+.46*sin(uTime*.55)*sin(uTime*.23+1.)+.04*sin(uTime*3.);val=clamp(val,.02,.98);
 vec3 col=uC0*(.8+.4*smoothstep(.7,0.,r));
 float arc=smoothstep(.012,0.,abs(r-.38)-.02)*inArc;col+=uC1*arc*.25;
 float fill=arc*step(fr,val);col+=mix(uC1,uC2,smoothstep(.55,.95,fr))*fill*1.1;col+=uC1*exp(-abs(r-.38)*18.)*fill*.25;
 float tick=step(abs(fract(fr*18.+.5)-.5),.02)*step(.31,r)*step(r,.34)*inArc;float minor=step(abs(fract(fr*90.+.5)-.5),.1)*step(.325,r)*step(r,.34)*inArc;
 col+=uC3*(tick*.9+minor*.35);col+=uC2*smoothstep(.015,0.,abs(r-.42)-.002)*step(.82,fr)*inArc;
 float na=start+span*val;float nang=na*6.28318;vec2 nd=vec2(sin(nang),cos(nang));
 float nl=sdSeg(p,nd*.06,nd*.33);col+=uC2*smoothstep(.007,.003,nl)*1.4+uC2*exp(-nl*60.)*.35;
 col+=uC3*smoothstep(.045,.04,r)*.9+uC0*smoothstep(.025,.02,r);
 gl_FragColor=vec4(finish(col),1.);`),
'night-highway':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect(),hor=.44;vec3 col;
 if(uv.y>=hor){float k=(uv.y-hor)/(1.-hor);col=mix(uC2*1.6,uC0,pow(k,.45));col+=uC1*exp(-k*10.)*.55;col+=step(.9985,hash(floor(gl_FragCoord.xy/2.)))*smoothstep(.3,.8,k)*.8;
  float city=step(uv.y,hor+.03+.04*hash(vec2(floor(uv.x*asp*60.),2.)));col=mix(col,uC0*.25,city*.8);col+=uC1*step(.82,hash(vec2(floor(uv.x*asp*160.),floor((uv.y-hor)*160.))))*city*.5;}
 else{float d=hor-uv.y,z=1./(d+.02);float gx=(uv.x-.5)*asp*z*.55*uScale;
  float road=smoothstep(1.65,1.6,abs(gx));vec3 ground=uC0*.35;col=mix(ground,uC0*1.5+uC2*.12+uC1*.06*exp(-d*3.),road);
  col+=vec3(.75)*smoothstep(.04,0.,abs(abs(gx)-1.5))*road*.5;
  float lane=smoothstep(.035,0.,abs(abs(gx)-.55))*step(.5,fract(z*.4-uTime*1.4*(.6+.4*uAmount)))+smoothstep(.035,0.,abs(gx))*step(.5,fract(z*.4-uTime*1.4*(.6+.4*uAmount)));col+=vec3(.95,.85,.55)*lane*.6*road;
  for(int i=0;i<4;i++){float k=float(i);float lx=k<.5?-1.05:(k<1.5?-.28:(k<2.5?.28:1.05));float dirv=lx>0.?1.:-1.;float sp=.5+.12*k;
   float cz=fract(z*.075*(1.+k*.25)+uTime*sp*dirv*.5+hash(vec2(k,uSeed)));float car=smoothstep(.0,.01,cz)*smoothstep(.17,.01,cz);
   float lat=exp(-pow((gx-lx)/.11,2.))+exp(-pow((gx-lx-.0)/.3,2.))*.12;vec3 lc=lx>0.?vec3(1.,.16,.1):vec3(1.,.95,.8);
   col+=lc*lat*car*2.2*(.55+z*.05);col+=lc*exp(-pow((gx-lx)/.5,2.))*car*.14*exp(-d*3.);}
  col+=uC1*exp(-d*12.)*.35;}
 gl_FragColor=vec4(finish(col),1.);`),
'turbine-fan':main(`vec2 p=frag()*uScale*.85;float r=length(p),a=atan(p.y,p.x);float B=18.;vec3 acc=vec3(0.);
 for(int i=0;i<5;i++){float k=float(i)/4.-.5;float ang=a+r*(1.8+uAmount*1.2)+uTime*(2.2)+k*.16;float s=fract(ang*B/6.28318);
  float blade=smoothstep(.0,.06,s)*smoothstep(.62,.5,s);float shade=.35+.65*pow(s*1.6,.8);acc+=mix(uC1,uC2,clamp(shade,0.,1.))*blade*(.6+.4*smoothstep(.12,.45,r));}
 acc/=5.;vec3 col=uC0+acc*step(.1,r)*step(r,.46);
 float hub=smoothstep(.11,.1,r);col=mix(col,mix(uC1,uC3,.5+.5*sin(a*3.+uTime*2.))*.5,hub);col+=uC3*smoothstep(.016,0.,abs(r-.11))*.5;
 col+=uC2*smoothstep(.015,0.,abs(r-.465))*.7;col+=uC1*smoothstep(.5,.46,r)*smoothstep(.46,.5,r)*.0;col*=smoothstep(.62,.46,r)*.5+.5;col+=uC1*exp(-abs(r-.465)*30.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'piston-rhythm':main(`vec2 p=frag()*uScale*.85;vec3 col=uC0;float t=uTime*2.2;float glow=0.;vec3 acc=vec3(0.);
 col+=uC1*.1*(smoothstep(.02,0.,abs(fract(p.x*10.)-.5)-.48)+smoothstep(.02,0.,abs(fract(p.y*10.)-.5)-.48));
 for(int i=0;i<4;i++){float k=float(i);float cx=(k-1.5)*.24;float th=t+k*1.5708*1.;
  vec2 pin=vec2(cx,-.3)+.07*vec2(sin(th),cos(th));float L=.32;float py=pin.y+sqrt(L*L-(pin.x-cx)*(pin.x-cx));vec2 pp=vec2(cx,py);
  float heat=.5+.5*cos(th);
  float cyl=min(abs(abs(p.x-cx)-.065)-.0,1.)*0.;float wall=smoothstep(.004,0.,abs(abs(p.x-cx)-.068))*step(-.1,p.y)*step(p.y,.36);
  float pis=smoothstep(.004,0.,rect(p-pp-vec2(0.,.03),vec2(.06,.035)));float pisEdge=smoothstep(.006,0.,abs(rect(p-pp-vec2(0.,.03),vec2(.06,.035))));
  float rod=smoothstep(.007,.0,sdSeg(p,pin,pp));float crank=smoothstep(.006,0.,abs(length(p-vec2(cx,-.3))-.07));float pd=smoothstep(.014,.008,length(p-pin));
  col+=uC1*wall*.5+uC2*(pisEdge*.9+pis*.2)*(.6+.8*heat)+uC3*rod*.9+uC1*crank*.5+uC2*pd;
  col+=uC2*exp(-abs(p.y-(py+.07))*30.)*step(abs(p.x-cx),.065)*heat*.3*(.4+uAmount);}
 gl_FragColor=vec4(finish(col),1.);`),
'hazard-stripes':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y);float band=fract((p.x+p.y)*(5.*uScale)-uTime*.18);
 float st=smoothstep(.0,.02,band)*smoothstep(.52,.5,band);
 float wear=fbm(p*vec2(18.,18.)+uSeed)*.8+fbm(p*vec2(120.,6.))*.4;float scratch=smoothstep(.62,.8,wear)*(.4+uAmount*.6);
 vec3 yel=uC1*(.85+.15*fbm(p*30.)),blk=uC0*(.8+.4*fbm(p*20.));vec3 col=mix(blk,yel,st);col=mix(col,uC2*.6,scratch*.6);
 float bev=smoothstep(0.,.03,uv.y)*smoothstep(1.,.97,uv.y);float spec=pow(max(0.,sin((p.x*.8+p.y)*2.-uTime*.4)),20.)*.25;col+=uC3*spec;col*=.75+.25*bev;
 gl_FragColor=vec4(finish(col),1.);`),
'blueprint-grid':main(`vec2 p=frag()*uScale;vec3 col=uC0;float t=uTime;
 vec2 g1=abs(fract(p*20.)-.5),g2=abs(fract(p*4.)-.5);
 col+=uC1*((smoothstep(.46,.5,g1.x)+smoothstep(.46,.5,g1.y))*.1+(smoothstep(.485,.5,g2.x)+smoothstep(.485,.5,g2.y))*.28);
 float r=length(p);float a=atan(p.y,p.x);
 float c1=smoothstep(.004,0.,abs(r-.22)),c2=smoothstep(.004,0.,abs(r-.34));float dash=step(.5,fract((a+t*.15)*10./6.28318));
 col+=uC2*(c1+c2*dash)*.9;
 float swp=mod(t*.35,6.28318)-3.14159;float d=mod(swp-a+6.28318,6.28318);col+=uC2*smoothstep(.01,0.,abs(r-.34))*exp(-d*3.)*.8;
 col+=uC2*smoothstep(.004,0.,sdSeg(p,vec2(0.),.46*vec2(cos(swp),sin(swp))))*.7;
 col+=uC2*smoothstep(.003,0.,min(abs(p.x),abs(p.y)))*step(r,.5)*.35;
 float dimv=sdSeg(p,vec2(-.46,-.4),vec2(.46,-.4));col+=uC2*smoothstep(.003,0.,dimv)*.6;
 col+=uC2*smoothstep(.003,0.,sdSeg(p,vec2(-.46,-.43),vec2(-.46,-.36)))*.6+uC2*smoothstep(.003,0.,sdSeg(p,vec2(.46,-.43),vec2(.46,-.36)))*.6;
 col+=uC2*smoothstep(.003,0.,abs(rect(p-vec2(.05,.03),vec2(.62,.38))))*.35*(.6+.4*sin(t));
 col+=uC2*smoothstep(.003,0.,sdSeg(p,vec2(-.4,.35),vec2(-.2,.2)))*.5+uC2*smoothstep(.003,0.,sdSeg(p,vec2(.2,-.2),vec2(.4,-.35)))*.5;
 col+=uC3*smoothstep(.006,.0,abs(length(p-vec2(.34*cos(swp),.34*sin(swp)))-.012))*.9;
 gl_FragColor=vec4(finish(col),1.);`),
'tread-pattern':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 q=vec2((uv.x-.5)*aspect(),uv.y)*uScale;q.y+=uTime*.12;
 float ax=abs(q.x);float chev=fract(q.y*4.2+ax*(2.6+uAmount*2.));float rowMask=smoothstep(.0,.05,chev)*smoothstep(.72,.66,chev);
 float cg=abs(fract(ax*2.1)-.5);float colMask=smoothstep(.0,.06,.5-cg-.0)*smoothstep(.04,.1,cg*0.+abs(fract(ax*2.1+.5)-.5)+.0);
 float rib=smoothstep(.05,.09,ax);float blocks=rowMask*colMask*rib;
 vec3 rubber=mix(uC0,uC1,fbm(q*18.)*1.1);vec3 col=mix(uC0*.45,rubber*(1.05+.5*blocks),blocks);
 float edge=smoothstep(.0,.06,blocks)*(1.-smoothstep(.06,.4,blocks));col+=uC2*edge*.12*(.5+.5*sin(q.x*4.+uTime*.2));col+=uC3*pow(blocks,8.)*.05;
 col*=.7+.3*smoothstep(1.3,0.,ax);
 gl_FragColor=vec4(finish(col),1.);`),
'diamond-plate':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y)*(9.*uScale);vec2 id=floor(p),f=fract(p)-.5;float alt=mod(id.x+id.y,2.);
 vec2 r=alt>.5?vec2(f.x+f.y,f.x-f.y)*.7071:vec2(f.x-f.y,f.x+f.y)*.7071;float d=abs(r.x)*.8+abs(r.y)*2.3;float raised=smoothstep(.46,.42,d);
 float bevel=smoothstep(.22,.42,d)*raised;vec2 nl=normalize(vec2(sign(r.x)*.8,sign(r.y)*2.3));
 vec2 n2=alt>.5?vec2(nl.x+nl.y,nl.x-nl.y)*.7071:vec2(nl.x-nl.y,nl.x+nl.y)*.7071;
 vec2 L=normalize(vec2(cos(uTime*.3+uSeed),sin(uTime*.25)));float lit=clamp(.55+bevel*dot(n2,L)*(.5+uAmount*.7),0.,1.);
 vec3 col=mix(uC0*.9,uC1*(.8+.3*raised),raised)*(.7+.5*lit)+uC2*bevel*max(dot(n2,L),0.)*.4+uC3*pow(bevel*max(dot(n2,L),0.),4.)*.35;
 col*=.88+.12*fbm(uv*60.)+.04;
 gl_FragColor=vec4(finish(col),1.);`),
'weld-sparks':main(`vec2 uv=frag()*uScale;vec2 org=mix(vec2(0.,-.3),(uPointer-.5)*vec2(aspect(),1.),step(.001,length(uPointer-.5)));vec3 col=uC0*(1.-.6*length(uv));float acc=0.;vec3 sc=vec3(0.);
 for(int i=0;i<40;i++){float k=float(i);float h=hash(vec2(k,uSeed)),h2=hash(vec2(k,3.7)),h3=hash(vec2(k,8.1));
  float tau=fract(uTime*(.55+h3*.5)+h);float ang=1.5708+(h-.5)*2.2;float sp=.35+.65*h2;vec2 v=sp*vec2(cos(ang),sin(ang));
  vec2 pos=org+v*tau*(.9+uAmount)+vec2(0.,-.7)*tau*tau;vec2 pos2=org+v*(tau-.05)*(.9+uAmount)+vec2(0.,-.7)*(tau-.05)*(tau-.05);
  float d=sdSeg(uv,pos2,pos);float life=1.-tau;vec3 hc=mix(uC3,mix(uC2,uC1,tau),smoothstep(.0,.5,tau));
  sc+=hc*(smoothstep(.008,.0,d)*1.8+exp(-d*45.)*.5)*life;}
 col+=sc;col+=uC3*exp(-length(uv-org)*12.)*1.1+uC2*exp(-length(uv-org)*4.)*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'honeycomb-grille':withHelpers(hexHelper,`vec2 p=frag()*(7.+uScale*3.);vec4 h=hexc(p);vec2 g=h.xy,id=h.zw;float hd=max(abs(g.x)*.866+abs(g.y)*.5,abs(g.y));
 float wave=.5+.5*sin(length(id)*.9-uTime*2.+uSeed);wave=pow(wave,1.4+uAmount*2.);
 float hole=smoothstep(.36,.3,hd);float lip=smoothstep(.4,.36,hd)*smoothstep(.3,.36,hd);
 vec3 metal=mix(uC0,uC1,.5+.5*fbm(p*2.+id))*(.7+.4*smoothstep(.5,.3,length(g)));
 vec3 glow=ramp(.35+.65*wave)*(.5+1.1*wave);vec3 col=mix(metal,glow,hole)+uC3*lip*.35*(.4+.6*wave);col*=1.-.25*smoothstep(.0,.5,hd)*.0;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['gear-train','Gear Train','Live industrial','Neutral','Meshing steel gears turning together over an engineering grid.',['gears','mechanical','steel'],['#0a0c10','#5d6877','#aeb9c8','#e9eef5'],.9,1,.5,'Speed'],
 ['carbon-weave','Carbon Weave','Live industrial','Neutral','Twill carbon fibre with a glossy highlight sliding across it.',['carbon fibre','automotive','weave'],['#07080a','#2c3138','#aeb6c2','#ffffff'],.9,1,.5,'Gloss'],
 ['tach-dial','Tachometer','Live industrial','Orange','A tachometer sweeping through its revs with a red zone.',['tachometer','dial','gauge','automotive'],['#06080c','#2fb8ff','#ff3b2f','#f2f6fb'],1,1,.5,'Glow'],
 ['night-highway','Night Highway','Live industrial','Orange','Headlights and tail lights streaming along a night motorway.',['highway','road','night','automotive'],['#06070c','#ff8a3a','#1a1438','#ffffff'],1,1,.5,'Speed'],
 ['turbine-fan','Turbine Fan','Live industrial','Neutral','A jet turbine fan spinning inside its casing.',['turbine','fan','engine','aerospace'],['#05070a','#46515f','#bcc7d6','#ffffff'],1,1,.5,'Blade sweep'],
 ['piston-rhythm','Piston Rhythm','Live industrial','Orange','Four pistons firing in sequence on their crankshaft.',['piston','engine','crankshaft','mechanical'],['#05070b','#2a6a8f','#ff8a2a','#d6e4ee'],1,1,.5,'Heat glow'],
 ['hazard-stripes','Hazard Stripes','Live industrial','Orange','Scuffed warning stripes drifting along a steel panel.',['hazard','warning','stripes','industrial'],['#0b0b0c','#f2b50f','#8a6a14','#ffffff'],.8,1,.5,'Wear'],
 ['blueprint-grid','Blueprint Grid','Live industrial','Blue','An engineering drawing with sweeping dimension lines.',['blueprint','technical','drawing','cad'],['#0a2a5c','#7fb0ff','#cfe4ff','#ffffff'],.9,1,.5,'Line weight'],
 ['tread-pattern','Tread Pattern','Live industrial','Neutral','Tyre tread rolling past with chevron blocks and deep grooves.',['tyre','tread','rubber','automotive'],['#0a0a0b','#34363a','#9aa0a8','#ffffff'],.9,1,.5,'Tread angle'],
 ['diamond-plate','Diamond Plate','Live industrial','Neutral','Raised tread-plate diamonds catching a moving light.',['diamond plate','steel','floor','industrial'],['#101215','#555d68','#b6c0cc','#ffffff'],.9,1,.5,'Relief'],
 ['weld-sparks','Weld Sparks','Live industrial','Orange','Showers of sparks flying off a weld.',['welding','sparks','workshop'],['#060608','#c4310a','#ff9a1f','#fff2c0'],1,1,.5,'Spark spread'],
 ['honeycomb-grille','Honeycomb Grille','Live industrial','Orange','A dark metal honeycomb grille lit from behind by rolling waves.',['grille','honeycomb','automotive','led'],['#07080a','#2a2f36','#ff7a1a','#ffe3b0'],.9,1,.5,'Wave sharpness']
];
