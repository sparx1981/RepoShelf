// Original live backgrounds: filaments, tunnels and beams. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'neural-filaments':main(`vec2 p=frag()*2.1*uScale;float t=uTime*.12;vec2 w=vec2(fbm(p+t+uSeed),fbm(p+vec2(5.,2.)-t));
 float n=fbm(p*1.1+w*1.9);float ridge=1.-abs(n*2.-1.);float fil=pow(ridge,9.+uAmount*7.);
 float n2=fbm(p*2.4+w*2.6-t);float r2=1.-abs(n2*2.-1.);float fil2=pow(r2,12.);
 float pulse=.5+.5*sin(n*40.-uTime*2.2);float pulse2=.5+.5*sin(n2*55.-uTime*3.);
 vec3 col=uC0+ramp(.25+.6*fil)*fil*(.5+1.2*pulse)+uC2*fil2*(.3+.9*pulse2)+uC1*pow(ridge,3.)*.18;col+=uC3*pow(fil,3.)*pulse*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'synapse-burst':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float flash=pow(.5+.5*sin(t*1.1),5.);
 float u=a*2.6;float n=fbm(vec2(u+t*.2,r*5.-t*.6+uSeed))+.4*fbm(vec2(u*2.3,r*11.+t*.4));float ridge=1.-abs(n*2.-1.);float fil=pow(ridge,10.-uAmount*3.);
 float fade=exp(-r*2.4)*smoothstep(.02,.12,r);float travel=.5+.5*sin(r*26.-t*3.+n*9.);
 vec3 col=uC0+ramp(.2+.7*fil)*fil*fade*(.6+1.6*travel)*(.55+.9*flash)+uC1*exp(-r*5.)*(.25+.9*flash)+uC3*exp(-r*18.)*(.5+1.2*flash);
 col+=uC2*pow(ridge,3.)*exp(-r*3.)*.1;
 gl_FragColor=vec4(finish(col),1.);`),
'neural-tunnel':withHelpers(`float sf(vec2 uv,float P,vec2 sc){return mix(fbm(uv*sc),fbm((uv-vec2(P,0.))*sc),uv.x/P);}`,`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float z=1./(r+.04);float P=6.;vec2 uv=vec2((a+3.14159)/6.28318*P,0.);uv.x+=z*.18;uv.y=z*.9-t*.9;uv.x=uv.x;
 float u0=(a+3.14159)/6.28318*P;float sh=z*.18;
 float n=mix(fbm(vec2(u0+sh,uv.y)*vec2(1.6,1.1)+uSeed),fbm(vec2(u0+sh-P,uv.y)*vec2(1.6,1.1)+uSeed),u0/P)+.35*mix(fbm(vec2(u0+sh,uv.y)*vec2(3.5,2.4)-t*.3),fbm(vec2(u0+sh-P,uv.y)*vec2(3.5,2.4)-t*.3),u0/P);float ridge=1.-abs(n*2.-1.);float fil=pow(ridge,7.+uAmount*6.);
 float fog=smoothstep(.0,.55,r)*smoothstep(2.2,.35,z*.12);
 vec3 col=uC0+ramp(.2+.75*fil)*fil*(.8+1.2*fog)*smoothstep(.02,.4,r)+uC1*pow(ridge,2.)*.12*smoothstep(.0,.5,r);col+=uC3*exp(-r*14.)*.25;
 gl_FragColor=vec4(finish(col),1.);`),
'fibre-fan':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 o=vec2(.5,-.12);vec2 d=(uv-o)*vec2(asp,1.);float r=length(d);float a=atan(d.x,d.y);float N=floor(44.*uScale);
 float lane=floor(a/.0+0.)*0.;float sa=a*N/1.2;float id=floor(sa),fa=fract(sa)-.5;float h=hash(vec2(id,uSeed)),h2=hash(vec2(id,4.));
 float wander=(fbm(vec2(r*3.+id*.7,uTime*.15+id))-.5)*.9;float da=(fa+wander*.9)*1.2/N*r;
 float w=.0014+.0016*h2;float line=exp(-pow(da/w,2.))*step(.15,h)*smoothstep(.0,.2,r);
 float tr=.5+.5*sin(r*(8.+h*8.)-uTime*(1.2+h*1.8)+h*20.);float taper=smoothstep(1.35,.5,r)*smoothstep(.0,.12,r);
 vec3 col=mix(uC0,uC0*1.8,uv.y)+ramp(.2+.7*h2)*line*(.35+1.2*pow(tr,3.))*taper*(.7+uAmount*.7)+uC3*exp(-length(d)*6.)*.28*exp(-abs(a)*2.);col+=uC1*exp(-r*3.2)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'trail-bends':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=mix(uC0,uC0*.5,uv.y);float t=uTime*.25;float y=1.-uv.y;
 for(int i=0;i<14;i++){float k=float(i);float h=hash(vec2(k,uSeed));float spread=(h*2.-1.)*1.1;float bend=sin(y*3.1*(1.+h*.6)+t*(.6+h*.5)+k*1.7)*.18*(.5+uAmount);
  float xc=.5+spread*pow(y,1.15)*.62*(1.+.2*sin(t+k))+bend*pow(y,.8);float d=abs(uv.x-xc)*asp;
  float w=.0012+.0035*y;float line=exp(-pow(d/w,2.));float glow=exp(-d*(30.-y*10.));float fl=.55+.45*sin(y*9.-t*5.*(.5+h)+k*2.);
  vec3 lc=mix(ramp(h*.7+.1),uC3,.4*smoothstep(.5,1.,fl));col+=lc*(line*1.2+glow*.1)*fl*smoothstep(0.,.06,y)*(.35+.9*y);}
 col+=uC1*exp(-y*6.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'nexus-rays':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;vec3 col=uC0;
 for(int L=0;L<2;L++){float fl=float(L);float N=24.+fl*16.;float sa=(a+t*(.07+.05*fl)*(fl>.5?-1.:1.))/6.28318*N;float id=floor(sa),fs=fract(sa)-.5;float h=hash(vec2(id,fl+uSeed));
  float da=fs*6.28318/N*r;float w=.0016+.0022*h;float ray=exp(-pow(da/w,2.));float len=.35+.9*hash(vec2(id,7.+fl));float vis=smoothstep(len,len*.4,r)*step(.25,h);
  float pulse=.55+.45*sin(r*14.-t*(2.+h*3.)+h*30.);col+=ramp(.15+.75*h)*ray*vis*pulse*(.9+uAmount*.9)*(1.-fl*.3)+uC3*pow(ray,6.)*vis*.4;}
 col+=uC2*exp(-r*5.)*.5+uC3*exp(-r*22.)*1.2+uC1*exp(-r*2.2)*.09*fbm(vec2(a*2.+t*.3,r*3.));
 gl_FragColor=vec4(finish(col),1.);`),
'spiral-threads':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime*.4;float lr=log(r+.02);
 vec3 col=uC0;for(int L=0;L<3;L++){float fl=float(L);float K=14.+fl*8.;float s=(a/6.28318*K+lr*(2.4+fl*.6)*(1.+uAmount*.4)-t*(1.+fl*.4));float id=floor(s),fs=fract(s)-.5;float h=hash(vec2(id,fl+uSeed));
  float w=(.045+.03*h)/(1.+r*0.);float line=exp(-pow(fs/w,2.));float br=smoothstep(1.1,.05,r)*(.4+.6*pow(.5+.5*sin(lr*5.-t*3.+h*20.),2.));col+=ramp(.2+.7*h)*line*br*(.9-fl*.2)*step(.15,h);}
 col+=uC3*exp(-r*18.)*.8+uC2*exp(-r*4.)*.2;
 gl_FragColor=vec4(finish(col),1.);`),
'twist-tunnel':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;float z=1./(r+.03);float tw=z*(.35+uAmount*.25);float P=8.;
 float u0=(a+3.14159)/6.28318*P;float vv=z*.7-t*.7;vec2 qa=vec2(u0+tw,vv),qb=vec2(u0+tw-P,vv);
 float haze=mix(fbm(qa*vec2(.7,.8)+uSeed),fbm(qb*vec2(.7,.8)+uSeed),u0/P)*.9+.3*mix(fbm(qa*vec2(2.1,3.)-t*.2),fbm(qb*vec2(2.1,3.)-t*.2),u0/P);
 vec2 dq=vec2(u0*6.,vv*5.);vec2 cell=floor(dq);cell.x=mod(cell.x,P*6.);float dust=step(.93,hash(cell+uSeed))*smoothstep(.5,0.,length(fract(dq)-.5)*1.3);
 float fade=smoothstep(.02,.5,r);vec3 col=uC0+ramp(.2+.7*haze)*pow(haze,1.8)*fade*1.5+uC3*dust*fade*(.6+.4*sin(t*3.+hash(cell)*20.));
 col+=uC1*exp(-r*7.)*.2;col*=smoothstep(.0,.15,r)*.7+.3;
 gl_FragColor=vec4(finish(col),1.);`),
'particle-tunnel':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x),t=uTime;vec3 col=uC0;
 for(int L=0;L<3;L++){float fl=float(L);float z=1./(r+.05)*(.8+fl*.35);float v=z*2.-t*(1.4+fl*.4);float u=(a+fl*1.3+z*.12)/6.28318*(36.+fl*14.);vec2 id=floor(vec2(u,v)),f=fract(vec2(u,v))-.5;
  vec2 o=(hash22(id+fl*9.+uSeed)-.5)*.6;float d=length(f-o);float rad=.12+.12*hash(id+3.);float dm=smoothstep(rad,rad*.2,d)*step(.35,hash(id+5.));
  float fade=smoothstep(.0,.35,r)*smoothstep(1.4,.3,r*(1.-fl*.2));col+=ramp(.2+.8*hash(id+8.))*dm*fade*(1.-fl*.25)*(.7+uAmount*.7);}
 col+=uC2*exp(-r*5.)*.22+uC3*exp(-r*20.)*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'radial-liquid':main(`vec2 p=frag()*uScale;float r=length(p),t=uTime;float h=0.,dh=0.;
 for(int i=0;i<3;i++){float k=float(i);float ph=t*(1.2+.3*k)+k*2.1+uSeed;float f=14.+k*7.;h+=sin(r*f-ph)*exp(-r*(2.+k*.5))*(1./(1.+k));dh+=cos(r*f-ph)*f*exp(-r*(2.+k*.5))*(1./(1.+k))-sin(r*f-ph)*(2.+k*.5)*exp(-r*(2.+k*.5))*(1./(1.+k));}
 vec2 dir=p/max(r,.001);vec3 n=normalize(vec3(-dir*dh*(.025+uAmount*.04),1.));vec3 L=normalize(vec3(-.4,.6,.7));
 float diff=max(dot(n,L),0.),spec=pow(max(reflect(-L,n).z,0.),30.);float env=.5+.5*dot(n.xy,vec2(.7,.7))*3.;
 vec3 col=ramp(clamp(.2+.5*env+.3*h,0.,1.))*(.35+.8*diff)+uC3*spec*1.2;col*=1.-.4*smoothstep(.2,1.,r);col+=uC2*exp(-r*6.)*.15;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['neural-filaments','Neural Filaments','Live light & particles','Purple','Fine glowing filaments branching through the dark with pulses of light along them.',['neural','filaments','network','glow'],['#04030a','#3a2fc8','#c860ff','#ffe6ff'],.9,1,.5,'Filament sharpness'],
 ['synapse-burst','Synapse Burst','Live light & particles','Blue','Filaments firing outward from a core in a flash, then fading to calm.',['neural','burst','synapse','flash'],['#02030a','#2a4fd8','#7ab8ff','#ffffff'],1,1,.5,'Sharpness'],
 ['neural-tunnel','Neural Tunnel','Live light & particles','Pink','An endless tunnel of pulsing strands rushing toward you.',['neural','tunnel','strands','speed'],['#050209','#7a2fe0','#ff4fb0','#ffe8f4'],1,1,.5,'Strand sharpness'],
 ['fibre-fan','Fibre Fan','Live light & particles','Pink','Glowing fibres fanning out from a bright point with pulses of light running along them.',['fibre','optic','fan','glow'],['#07040e','#a855ff','#ff6ad5','#fff0ff'],.9,1,.5,'Pulse'],
 ['trail-bends','Trail Bends','Live light & particles','Blue','Long-exposure light trails sweeping around bends in the dark.',['trails','long exposure','road','light'],['#04060d','#3a7bff','#9fd0ff','#ffffff'],.9,1,.5,'Bend'],
 ['nexus-rays','Nexus Rays','Live light & particles','Green','Laser beams radiating from a glowing core in two counter-rotating layers.',['lasers','rays','core','radial'],['#02050a','#18d6a0','#5ab8ff','#ffffff'],.9,1,.5,'Beam brightness'],
 ['spiral-threads','Spiral Threads','Live geometric','Purple','Fine threads of light spiralling into a turning vortex.',['spiral','threads','vortex','lines'],['#05030c','#6a3bff','#ff5fd0','#fff0ff'],.9,1,.5,'Tightness'],
 ['twist-tunnel','Twist Tunnel','Live light & particles','Blue','A tube of haze and drifting dust that twists as you fly down it.',['tunnel','haze','dust','twist'],['#03040c','#2a3fc4','#8ab8ff','#ffffff'],.9,1,.5,'Twist'],
 ['particle-tunnel','Particle Tunnel','Live light & particles','Pink','An endless spinning tunnel of glowing particles.',['tunnel','particles','vortex','speed'],['#05030a','#6a3bff','#ff4fb8','#ffffff'],1,1,.5,'Density'],
 ['radial-liquid','Radial Liquid','Live materials','Blue','Liquid ripples spreading from a centre, lit like polished chrome.',['liquid','ripples','chrome','radial'],['#06080f','#3a5a9a','#a8c4f0','#ffffff'],.9,1,.5,'Ripple depth']
];
