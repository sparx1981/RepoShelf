// Original live backgrounds: trails, bands, rays and weather. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'orbit-trails':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;vec3 col=uC0;
 for(int L=0;L<9;L++){float fl=float(L);float R=.07+.055*fl;float dir=mod(fl,2.)<.5?1.:-1.;float om=(.5+.12*fl)*dir*(.6+uAmount*.8);
  float w=.0014+.0007*fl;float rad=exp(-pow((r-R)/w,2.));
  for(int K=0;K<4;K++){float fk=float(K);float h=hash(vec2(fl,fk+uSeed));float len=.8+3.*hash(vec2(fl,fk+7.));float s=h*6.28318;
   float ang=a*dir-t*om*dir;float dm=mod((a-s)*dir-t*om,6.28318);float trail=pow(1.-clamp(dm/len,0.,1.),2.2)*step(dm,len);float head=exp(-dm*14.);
   col+=ramp(.2+.7*h)*rad*(trail*.7+head*1.4)*(.4+.6*exp(-fl*.12));}}
 col+=uC3*exp(-r*14.)*.1;
 gl_FragColor=vec4(finish(col),1.);`),
'marbled-bands':main(`vec2 p=frag()*2.*uScale;float t=uTime*.1;vec2 q=p;
 for(int i=0;i<2;i++){float f=float(i)+1.;q+=vec2(sin(q.y*.9*f+t*f+uSeed),cos(q.x*.8*f-t*f))*.5/f;}
 float f=.5*sin(q.x*.9+q.y*.6)+.3*sin(q.x*.5-q.y*1.1+t*2.)+.25*fbm(q*.5+t);float bands=.5+.5*sin(f*(7.+uAmount*6.));float edge=pow(1.-abs(2.*bands-1.),5.)*.6;
 float e=.03;float f2=.5*sin((q.x+e)*.9+q.y*.6)+.3*sin((q.x+e)*.5-q.y*1.1+t*2.)+.25*fbm((q+vec2(e,0.))*.5+t);float lit=clamp(.5+(f-f2)*18.,0.,1.);
 vec3 col=ramp(clamp(.1+.85*bands,0.,1.))*(.45+.8*lit)+uC3*edge*.5;col*=.85+.3*(1.-length(frag())*.6);
 gl_FragColor=vec4(finish(col),1.);`),
'dotted-horizon':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float t=uTime*.6;vec3 col=mix(uC0*.6,uC0,uv.y);
 for(int j=0;j<22;j++){float fj=float(j);float zj=1.2+fj*.4;float s=1./zj;float X=(uv.x-.5)*asp/s;float sp=.05;
  float Xw=X-.22*sin(zj*1.1+t+X*.4)*(.5+uAmount);float cell=floor(Xw/sp+.5);float Xc=cell*sp;
  float H=(.14*sin(Xc*1.5+zj*.8-t*1.2)+.08*sin(Xc*3.1+zj*1.3+t))*(.5+uAmount*.6);
  float dy=uv.y-(.44+(H-.4)*s*1.3+.14*s);float dx=(Xw-Xc)*s;float d=length(vec2(dx,dy));float rad=.0026+.0046*s*1.3;
  float b=smoothstep(rad,rad*.25,d)*(.35+.65*s);col+=ramp(.25+.7*clamp(.5+H*2.,0.,1.))*b*(.8+1.2*s);}
 col+=uC2*exp(-abs(uv.y-.44)*14.)*.05;
 gl_FragColor=vec4(finish(col),1.);`),
'pixel-streaks':main(`float cs=max(5.,floor(uRes.y/70./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;float rows=uRes.y/cs;float h=hash(vec2(id.x,uSeed)),h2=hash(vec2(id.x,5.));
 float sp=.12+.34*h2;float head=fract(uTime*sp*.5+h)*(rows+30.)-10.;float age=head-id.y;float len=8.+22.*h*(.5+uAmount);
 float tail=age>=0.&&age<len?pow(1.-age/len,1.8):0.;float live=step(.32,hash(vec2(id.x,9.)));float sq=smoothstep(.5,.28,max(abs(f.x),abs(f.y)));
 float headPix=smoothstep(1.2,0.,abs(age));vec3 col=uC0+ramp(.2+.7*h2)*tail*sq*live*.9+uC3*headPix*sq*live*.9;
 gl_FragColor=vec4(finish(col),1.);`),
'rising-needles':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float N=floor(90.*uScale);float xs=uv.x*N;float id=floor(xs),fx=abs(fract(xs)-.5);float h=hash(vec2(id,uSeed)),h2=hash(vec2(id,4.));
 float sp=.08+.22*h2;float head=fract(uTime*sp+h)*(.55+.5*h2)*1.1;float len=.08+.25*h;float d=head-uv.y;
 float line=smoothstep(.12,.0,fx)*step(0.,d)*step(d,len)*pow(1.-d/len,1.3)*step(.25,hash(vec2(id,8.)));float hd=exp(-pow(d/.006,2.))*smoothstep(.2,.0,fx);
 float base=exp(-uv.y*9.)*(.55+.45*fbm(vec2(uv.x*asp*6.,uTime*.3)));
 vec3 col=uC0+ramp(.2+.7*h)*(line*(.7+uAmount*.7)+hd*1.2)*(1.-uv.y*.5)+uC2*base*.55+uC3*exp(-uv.y*40.)*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'aurora-sweep':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float x=uv.x*asp*uScale;float t=uTime*.35;
 float c=.5+.14*sin(x*1.2+t)+.07*sin(x*2.9-t*1.5+uSeed);float d=uv.y-c;float streak=fbm(vec2(x*14.,t*.6))*.7+.3;
 float body=exp(-pow(d/(.1+.05*sin(x+t)),2.))*(.5+.8*streak);float curtain=smoothstep(-.02,.05,d)*exp(-d*(3.5-uAmount*1.5))*(.4+.9*streak);
 vec3 col=uC0+ramp(.2+.6*streak)*(body*1.1+curtain*.55)+uC3*pow(body,3.)*.4;
 float n=hash(gl_FragCoord.xy+fract(uTime*5.));col*=.86+.28*n;col+=uC1*exp(-abs(d)*3.)*.06;
 gl_FragColor=vec4(finish(col),1.);`),
'beam-rise':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 o=vec2(.5,-.35);vec2 d=(uv-o)*vec2(asp,1.);float r=length(d);float a=atan(d.x,d.y);float t=uTime*.25;
 float rays=pow(fbm(vec2(a*5.+uSeed,t))*1.15,2.4)+pow(fbm(vec2(a*11.-t*1.3,t*.7+3.)),3.)*.6;float haze=fbm(vec2(a*2.,r*2.-t));
 float fall=exp(-r*(1.2-uAmount*.5))*smoothstep(.0,.3,r);vec3 col=uC0+ramp(.25+.7*rays)*rays*fall*2.6+uC2*haze*fall*.5+uC3*exp(-length(uv-vec2(.5,.0))*vec2(asp,1.).x*4.)*.35*exp(-uv.y*3.);
 gl_FragColor=vec4(finish(col),1.);`),
'wind-clouds':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y)*uScale;float t=uTime*.04;vec2 m=uPointer*vec2(aspect(),1.)*uScale;vec2 d=p-m;float k=exp(-dot(d,d)*2.2)*step(.001,length(uPointer-.5));
 vec2 q=p+rot(k*2.)*d*k*.45-d*k*.2;vec2 w=vec2(fbm(q*1.2+t),fbm(q*1.2+vec2(4.,1.)-t));float c=fbm(q*1.5+w*1.7+vec2(t*2.,0.));
 float cov=smoothstep(.38-.12*uAmount,.78,c);float lit=clamp((c-fbm(q*1.5+w*1.7+vec2(t*2.,0.)+vec2(.05,.08)))*8.+.55,0.,1.);
 vec3 sky=mix(uC0,uC1,uv.y);vec3 cl=mix(uC2,uC3,lit);vec3 col=mix(sky,cl,cov);col+=uC3*exp(-length(uv-vec2(.75,1.))*2.5)*.18;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['orbit-trails','Orbit Trails','Live light & particles','Purple','Bright points circling in concentric orbits, each leaving a fading trail.',['orbits','trails','stars','circles'],['#04030a','#5a3fe0','#c080ff','#ffffff'],.9,1,.5,'Speed'],
 ['marbled-bands','Marbled Bands','Live materials','Blue','Glossy bands of colour folding through a swirling marbled field.',['marble','bands','contour','fluid'],['#05061a','#2a3fe8','#7a60ff','#d8e0ff'],.8,1,.5,'Band count'],
 ['dotted-horizon','Dotted Horizon','Live nature','Purple','Rows of glowing dots receding towards the horizon in slow, wavy lines.',['dots','horizon','retro','perspective'],['#05030c','#6a3fe0','#ff6ad0','#ffffff'],.9,1,.5,'Wave'],
 ['pixel-streaks','Pixel Streaks','Live tech & retro','Pink','Quiet streaks of square pixels falling like a digital rain.',['pixels','rain','digital','streaks'],['#05030a','#a02a8a','#ff5fc8','#ffffff'],1,1,.5,'Streak length'],
 ['rising-needles','Rising Needles','Live light & particles','Purple','Fine needles of light rising from a glowing horizon.',['lines','needles','rising','glow'],['#05030a','#7a4fe0','#ff5fc0','#ffffff'],.9,1,.5,'Brightness'],
 ['aurora-sweep','Aurora Sweep','Live nature','Green','A grainy sweep of aurora light waving across the dark.',['aurora','grain','beam','night'],['#02060a','#18d6b0','#6aa8ff','#e8fff8'],.9,1,.5,'Curtain'],
 ['beam-rise','Beam Rise','Live light & particles','Purple','Soft rays of light rising from beyond the edge of the frame.',['rays','beams','soft','rising'],['#05030c','#5a2fd8','#c070ff','#ffe6ff'],.8,1,.5,'Reach'],
 ['wind-clouds','Wind Clouds','Live nature','Purple','Billowing dusk clouds that swirl away from your pointer like wind.',['clouds','wind','interactive','dusk'],['#120a2a','#3a2f7a','#9a80d8','#ffd8e8'],.8,1,.5,'Cloud cover']
];
