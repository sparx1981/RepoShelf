// Original live backgrounds: cosmic and volumetric. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'gravity-well':main(`vec2 p=frag()*uScale*1.15;float r=length(p),t=uTime;vec3 col=uC0;
 vec2 q=p/(1.+.07/(r*r+.015));vec2 sq=q*80.;vec2 sc=floor(sq);float st=step(.982,hash(sc+uSeed))*smoothstep(.5,.0,length(fract(sq)-.5)*(1.2+hash(sc+8.)));col+=vec3(.8,.85,1.)*st*(.45+.55*hash(sc+3.))*smoothstep(.17,.3,r);
 col+=uC2*.05*fbm(q*3.+t*.02);
 vec2 dp=vec2(p.x,p.y*3.4);float rd=length(dp);float ang=atan(dp.y,dp.x);
 float disc=smoothstep(.66,.46,rd)*smoothstep(.21,.27,rd);
 float swirl=fbm(vec2(ang*3.+t*.7+rd*6.,rd*9.-t*.9));float dop=.55+.45*smoothstep(.3,-.3,p.x);
 float front=step(0.,-p.y)+step(.19,r)*step(0.,p.y);vec3 dc=ramp(clamp(1.-rd*1.3+swirl*.5,0.,1.))*(.6+1.8*swirl)*dop*disc*(.9+uAmount*.8);
 col+=dc*front;
 float lens=smoothstep(.05,0.,abs(r-(.275+.02*sin(ang*3.+t))))*smoothstep(-.12,.2,p.y)*.8+smoothstep(.03,0.,abs(r-.235))*smoothstep(.1,-.2,p.y)*.35;
 col+=ramp(.6+.4*swirl)*lens*(.8+.4*dop);
 col+=uC3*smoothstep(.007,0.,abs(r-.195))*.9+uC2*exp(-abs(r-.2)*28.)*.35;
 col*=smoothstep(.178,.19,r);
 gl_FragColor=vec4(finish(col),1.);`),
'star-globe':withHelpers(`vec3 gp(float i,float N,float t){float y=1.-2.*(i+.5)/N;float rr=sqrt(max(0.,1.-y*y));float th=i*2.39996+t;vec3 P=vec3(rr*cos(th),y,rr*sin(th));float c=cos(.45),s=sin(.45);P=vec3(P.x,P.y*c-P.z*s,P.y*s+P.z*c);return P;}
vec3 proj(vec3 P){float k=1.7/(2.4-P.z);return vec3(P.xy*.4*k*1.1,P.z);}`,
 `vec2 p=frag()*uScale;float t=uTime*.25;vec3 col=uC0;float r=length(p);col+=uC1*exp(-r*3.)*.18;
 col+=uC1*smoothstep(.012,0.,abs(r-.42))*.12;
 for(int i=0;i<24;i++){float fi=float(i);vec3 a=proj(gp(fi,24.,t));
  vec3 b1=proj(gp(mod(fi+1.,24.),24.,t)),b2=proj(gp(mod(fi+5.,24.),24.,t));
  float f=.35+.65*smoothstep(-.6,.9,a.z);
  float d1=sdSeg(p,a.xy,b1.xy),d2=sdSeg(p,a.xy,b2.xy);float fb1=.35+.65*smoothstep(-.6,.9,.5*(a.z+b1.z)),fb2=.35+.65*smoothstep(-.6,.9,.5*(a.z+b2.z));
  col+=ramp(.3+.5*fb1)*smoothstep(.0035,0.,d1)*fb1*.8+ramp(.3+.5*fb2)*smoothstep(.003,0.,d2)*fb2*.5;
  float dd=length(p-a.xy);col+=uC3*(smoothstep(.012+.01*f,0.,dd)*1.2+exp(-dd*40.)*.35)*f;}
 gl_FragColor=vec4(finish(col),1.);`),
'tilted-galaxy':main(`vec2 p=frag()*uScale;vec2 q=rot(.35)*p;q.y*=2.7;float r=length(q),a=atan(q.y,q.x),t=uTime;float fr=r*.9;
 float arms=sin(2.*(a-log(fr+.05)*(1.8+uAmount))+t*.12+uSeed);float disc=exp(-fr*2.2);
 float dens=pow(.5+.5*arms,1.6)*disc;float dust=smoothstep(.45,.9,fbm(q*5.+uSeed))*.55;dens*=(1.-dust*.6);
 vec3 col=uC0+ramp(.2+.7*dens*1.5)*dens*1.6+uC3*exp(-r*7.)*1.3*(1.-.3*dust)+uC2*exp(-r*2.5)*.08;
 vec2 sc=floor(gl_FragCoord.xy/2.);float stars=step(.9945,hash(sc+uSeed))*(.3+.7*dens+.2);col+=vec3(.85,.9,1.)*stars*.8;
 float sw=a+r*6.-t*.8;col+=ramp(.5)*step(.996,hash(floor(vec2(sw*14.,r*80.))))*disc*1.4;
 gl_FragColor=vec4(finish(col),1.);`),
'corona-eclipse':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float R=.19;vec3 col=uC0;
 float str=fbm(vec2(a*4.+t*.25,r*2.5-t*.1));float str2=fbm(vec2(a*9.-t*.3,r*5.));float d=max(r-R,0.);
 float cor=exp(-d*(9.-uAmount*3.))*(.45+1.2*str)+exp(-d*3.2)*.35*str2;
 vec3 spec=.5+.5*cos(6.28318*(a/6.28318*2.+t*.05+vec3(0.,.33,.67)));
 col+=mix(ramp(.3+.7*str),spec,.45)*cor*(.9+.4*sin(a*3.+t));
 col+=uC3*smoothstep(.006,0.,abs(r-R-.002))*1.4+uC3*exp(-abs(r-R)*60.)*.35;
 float fa=t*.2;vec2 fp=(R+.012)*vec2(cos(fa),sin(fa));col+=uC3*exp(-length(p-fp)*38.)*1.2+uC3*exp(-abs(p.y-fp.y)*90.)*exp(-abs(p.x-fp.x)*3.)*.15;
 col*=smoothstep(R-.002,R+.002,r)*.9+.1*smoothstep(R,R+.05,r);col=mix(vec3(0.),col,smoothstep(R-.004,R,r));
 gl_FragColor=vec4(finish(col),1.);`),
'planet-limb':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=(uv-.5)*vec2(asp,1.);float t=uTime*.06;
 vec2 pc=vec2(0.,-1.55);float R=1.25;float dp=length(p-pc);float surf=dp-R;
 vec2 sun=vec2(.3+(uPointer.x-.5)*.15,-.5*0.+(-.3+R*0.)+.0);sun=vec2(.34,-.31+.05*sin(t*3.));
 vec3 col=mix(uC0,uC0*.4,uv.y);col+=vec3(.9,.95,1.)*step(.9975,hash(floor(gl_FragCoord.xy/2.)+uSeed))*smoothstep(-.35,.3,p.y)*.8;
 float sd=length(p-sun);col+=uC2*exp(-sd*5.5)*.7+uC3*exp(-sd*18.)*1.4+uC3*smoothstep(.02,.0,sd)*1.3;
 col+=uC3*exp(-abs(p.y-sun.y)*70.)*exp(-abs(p.x-sun.x)*2.2)*.5;
 float atm=exp(-max(surf,0.)*(22.-uAmount*8.));float near=exp(-pow((p.x-sun.x)*1.8,2.));
 vec3 ac=mix(uC1,uC2,near);col+=ac*atm*(.55+1.2*near)*(surf>0.?1.:0.);col+=uC3*smoothstep(.006,0.,abs(surf))*(.4+.9*near);
 float inside=smoothstep(.002,-.002,surf);vec3 ground=mix(vec3(.01,.012,.02),uC1*.15,exp(surf*7.)+0.)*(.6+.4*near);
 ground+=uC2*pow(exp(surf*4.),2.)*.15*near;ground+=vec3(1.,.8,.5)*step(.988,hash(floor(gl_FragCoord.xy/3.)))*.35*(1.-near)*step(surf,-.05)*step(-.55,surf);
 col=mix(col,ground,inside);
 gl_FragColor=vec4(finish(col),1.);`),
'fog-sphere':main(`vec2 p=frag()*uScale;float R=.34,r=length(p),t=uTime*.18;vec3 col=uC0;float acc=0.;
 for(int i=0;i<7;i++){float z=float(i)/6.*2.-1.;float rr=sqrt(max(0.,1.-z*z))*R;float edge=smoothstep(rr,rr*.55,r);
  float dn=fbm(p*3.4+vec2(t*(1.+.2*float(i)),float(i)*7.3+uSeed))*1.4+fbm(p*7.-vec2(t*1.3,float(i)));acc+=edge*dn*(.28-.1*abs(z));}
 float rim=smoothstep(R*.6,R,r)*smoothstep(R*1.2,R,r);float lightFall=.55+.45*dot(normalize(p+vec2(.0001)),vec2(.6,.8))*smoothstep(0.,R,r);
 float v=clamp(acc*(.8+uAmount*.9),0.,1.2);col+=ramp(.12+.7*v)*v*lightFall*.8+uC3*rim*v*.18;col+=uC1*exp(-max(r-R,0.)*8.)*.2*(.5+acc);
 gl_FragColor=vec4(finish(col),1.);`),
'specter-orb':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime*.4;float R=.2;vec3 col=uC0;
 float core=smoothstep(R+.02,R-.02,r);float z=sqrt(max(0.,1.-(r/R)*(r/R)));float sw=fbm(vec2(a*1.5+t*1.5+z*3.,z*4.-t));float body=(.55+.5*sw)*(.45+.6*z);
 col+=mix(uC2,uC3*.75,z*z)*body*core*.8;
 float d=max(r-R,0.);float smoke=fbm(vec2(a*2.2+t*.6,r*4.5-t*.9))*fbm(vec2(a*4.+t,r*8.+t*.5));
 float wisp=pow(smoke*2.,2.)*exp(-d*(5.5-uAmount*2.))*step(R,r);col+=ramp(.25+.6*smoke)*wisp*1.25;
 col+=uC1*exp(-d*10.)*.5+uC3*exp(-d*36.)*.4;
 float ey=exp(-pow((p.x-.045)/.022,2.)-pow((p.y-.015)/.05,2.))+exp(-pow((p.x+.045)/.022,2.)-pow((p.y-.015)/.05,2.));col-=uC0*ey*core*.8;
 gl_FragColor=vec4(finish(col),1.);`),
'light-knot':withHelpers(`vec3 knot(float s,float t){vec3 P=vec3(sin(s)+2.*sin(2.*s),cos(s)-2.*cos(2.*s),-sin(3.*s))*.17;
 float c=cos(t),sn=sin(t);P=vec3(P.x*c+P.z*sn,P.y,-P.x*sn+P.z*c);float c2=cos(.5),s2=sin(.5);P=vec3(P.x,P.y*c2-P.z*s2,P.y*s2+P.z*c2);return P;}
vec3 kp(float s,float t){vec3 P=knot(s,t);float k=1.3/(1.8-P.z*1.4);return vec3(P.xy*k,P.z);}`,
 `vec2 p=frag()*uScale;float t=uTime*.3;vec3 col=uC0;vec3 prev=kp(0.,t);float acc=0.;
 for(int i=1;i<=80;i++){float s=float(i)/80.*6.28318;vec3 cur=kp(s,t);float d=sdSeg(p,prev.xy,cur.xy);float depth=.5+.5*(prev.z+cur.z)/.6;
  float w=.012+.012*(depth);vec3 cc=ramp(.15+.85*fract(s/6.28318*1.+t*.1))*(.5+.8*depth);
  col=max(col,cc*(smoothstep(w,0.,d)*.75+exp(-d*(46.-uAmount*16.))*.22));prev=cur;}
 col+=uC2*exp(-length(p)*3.5)*.08;
 gl_FragColor=vec4(finish(col),1.);`),
'wire-sphere':main(`vec2 p=frag()*uScale;float R=.38,r=length(p);float t=uTime*.3;vec3 col=uC0+uC1*exp(-r*3.)*.1;
 if(r<R){float z=sqrt(R*R-r*r);for(int side=0;side<2;side++){float zz=side==0?z:-z;vec3 v=vec3(p,zz)/R;float c=cos(t),s=sin(t);v=vec3(v.x*c+v.z*s,v.y,-v.x*s+v.z*c);float c2=cos(.45),s2=sin(.45);v=vec3(v.x,v.y*c2-v.z*s2,v.y*s2+v.z*c2);
  float lon=atan(v.x,v.z),lat=asin(clamp(v.y,-1.,1.));float N=12.,M=8.;
  float gl=abs(fract(lon*N/6.28318+.5)-.5)*6.28318/N*R*cos(lat),gt=abs(fract(lat*M/3.14159+.5)-.5)*3.14159/M*R;
  float w=.0035+.0015*uAmount*3.;float line=max(smoothstep(w,0.,gl),smoothstep(w,0.,gt));float fr=side==0?1.:.28;
  col+=ramp(.3+.6*(v.z*.5+.5))*line*fr*(side==0?1.:.7)*(.6+.5*(.5+.5*v.y));}}
 col+=uC3*smoothstep(.004,0.,abs(r-R))*.4+uC1*exp(-abs(r-R)*30.)*.2;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['gravity-well','Gravity Well','Live light & particles','Orange','A black hole bending starlight around a glowing accretion disc and its photon ring.',['black hole','space','accretion','lensing'],['#020308','#ff7a1a','#7a5cff','#fff3d6'],.9,1,.5,'Disc brightness'],
 ['star-globe','Star Globe','Live geometric','Blue','A slowly turning globe of stars joined by fine constellation lines.',['globe','stars','constellation','network'],['#03050e','#2f66ff','#8fb8ff','#ffffff'],.9,1,.5,'Line glow'],
 ['tilted-galaxy','Tilted Galaxy','Live light & particles','Blue','A spiral galaxy seen at an angle, with a bright core, dust lanes and streaming stars.',['galaxy','space','spiral','stars'],['#02030a','#2a3fb8','#ff9a5a','#fff0d0'],.8,1,.5,'Arm tightness'],
 ['corona-eclipse','Corona Eclipse','Live light & particles','Purple','A dark disc eclipsing a colour-shifting corona, with a flare on its edge.',['eclipse','corona','sun','space'],['#030208','#7a3bff','#ff9a3a','#ffffff'],.8,1,.5,'Corona reach'],
 ['planet-limb','Planet Limb','Live nature','Orange','A sunrise breaking over the glowing edge of a dark planet.',['planet','sunrise','orbit','atmosphere'],['#020308','#2f6bff','#ff8a3a','#ffffff'],.8,1,.5,'Atmosphere'],
 ['fog-sphere','Fog Sphere','Live light & particles','Purple','A soft, swirling sphere of luminous fog.',['fog','sphere','volumetric','soft'],['#050309','#5a2fc4','#c08aff','#ffe9ff'],.8,1,.5,'Density'],
 ['specter-orb','Specter Orb','Live light & particles','Blue','A ghostly orb wrapped in drifting smoke.',['ghost','orb','smoke','spooky'],['#02050a','#1a3a6a','#4aa0ff','#e8f6ff'],.8,1,.5,'Smoke'],
 ['light-knot','Light Knot','Live geometric','Pink','A ribbon of light tied into a slowly turning knot.',['knot','ribbon','3d','light'],['#05030a','#ff4fa8','#6a5cff','#4ae0ff'],.8,1,.5,'Glow'],
 ['wire-sphere','Wire Sphere','Live geometric','Green','A rotating wireframe sphere you can see straight through.',['wireframe','sphere','3d','globe'],['#020a07','#0d6b4a','#3de0a0','#d8fff0'],.8,1,.5,'Line weight']
];
