// Original live backgrounds that play transitions and screen effects over a generated landscape. Written for RepoShelf; no third-party shader source.
import {withHelpers} from './live-prelude.mjs';
const SCN=`vec3 scn(vec2 uv,float k){
 vec3 a0=mix(uC0,uC1,k),a1=mix(uC1,uC2,k),a2=mix(uC2,uC3,k*.6);
 vec3 col=mix(a0,a1,smoothstep(0.,.8,uv.y));
 vec2 sp=vec2(.5+.22*(k*2.-1.),.6);float d=length((uv-sp)*vec2(1.6,1.));
 col+=uC3*exp(-d*4.5)*.5;col=mix(col,uC3*1.08,smoothstep(.075,.07,d));
 for(int L=0;L<4;L++){float fl=float(L);float y0=.44-fl*.1;
  float h=y0+.06*sin(uv.x*(3.+fl*1.4)+fl*2.1+k*3.)+.07*(fbm(vec2(uv.x*(3.+fl*1.5),fl*5.+k*9.))-.5);
  vec3 hc=mix(a2,uC0*.5,fl/3.);col=mix(col,hc,smoothstep(.004,-.004,uv.y-h));
  col=mix(col,a1,.14*exp(-abs(uv.y-h)*12.));}
 return col;}`;
export const shaders={
'fog-bank':withHelpers(SCN,`vec2 uv=gl_FragCoord.xy/uRes;float T=12.;float tt=uTime/T;float cyc=floor(tt);float ph=fract(tt);float a=mod(cyc,2.);
 float tri=1.-abs(2.*ph-1.);float front=smoothstep(0.,.8,tri)*1.5-.1;
 float fn=fbm(vec2(uv.x*3.+uTime*.07,uv.y*2.-uTime*.03))-.5;float dens=smoothstep(0.,1.,(front-uv.y)*(2.4+uAmount*2.)+fn*1.6);
 vec3 col=ph<.5?scn(uv,a):scn(uv,1.-a);
 float g=lum(col);col=mix(col,vec3(g),clamp(dens*1.2,0.,.85));col=mix(col,uC3*(.92+.08*fn),pow(dens,1.4));
 col+=uC3*.07*fbm(uv*5.+uTime*.05)*dens;
 gl_FragColor=vec4(finish(col),1.);`),
'paper-tear':withHelpers(SCN,`vec2 uv=gl_FragCoord.xy/uRes;float T=14.;float tt=uTime/T;float cyc=floor(tt);float ph=fract(tt);float a=mod(cyc,2.);
 float p1=smoothstep(.04,.38,ph),p2=smoothstep(.5,.86,ph);
 float r=.5+uAmount*.9;
 float e1=p1*1.3-.12+(.06*(fbm(vec2(uv.x*8.,1.7))-.5)+.014*(noise(vec2(uv.x*90.,2.))-.5))*r;
 float e2=p2*1.3-.12+(.06*(fbm(vec2(uv.x*8.,6.3))-.5)+.014*(noise(vec2(uv.x*90.,9.))-.5))*r;
 vec3 A=scn(uv,a),B=scn(uv,1.-a);
 float fib=fbm(uv*vec2(60.,60.)+3.)*.12+noise(uv*400.)*.05;vec3 paper=uC3*(.93+fib)*(1.-.06*smoothstep(0.,1.,uv.y));
 float d1=uv.y-e1,d2=uv.y-e2;float below1=smoothstep(.002,-.002,d1),below2=smoothstep(.002,-.002,d2);
 vec3 col=A*(1.-.55*exp(-max(d1,0.)*55.)*step(.001,p1));
 vec3 pp=paper*(1.-.5*exp(-max(d2,0.)*50.)*step(.001,p2));
 col=mix(col,pp,below1);
 col+=uC3*.9*smoothstep(.007,0.,abs(d1+.003))*step(.001,p1)*(.5+noise(vec2(uv.x*200.,4.)));
 col=mix(col,B,below2);
 col+=uC3*.9*smoothstep(.007,0.,abs(d2+.003))*step(.001,p2)*(.5+noise(vec2(uv.x*200.,8.)));
 gl_FragColor=vec4(finish(col),1.);`),
'ink-crown':withHelpers('',`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float t=uTime*.12;vec2 m=uPointer;
 vec2 q=vec2(uv.x*asp,uv.y);vec2 pm=vec2(m.x*asp,m.y);vec2 dd=q-pm;float near=exp(-dot(dd,dd)*5.);
 float hang=1.-uv.y;
 vec2 w=vec2(fbm(q*1.6+t),fbm(q*1.6+vec2(5.,2.)-t));
 float H=.2+.22*fbm(vec2(uv.x*2.4+t,3.))+.5*near*(.5+.5*uAmount);
 float edge=hang+(w.y-.5)*.22-.35*near*smoothstep(.0,.6,m.y);
 float dens=smoothstep(H,0.,edge+ (w.x-.5)*.12);
 float thin=smoothstep(.0,H,H-edge);
 vec3 col=uC0*(.4+.6*uv.y*0.+.6)+ramp(.15+.8*(1.-dens))*dens*(.55+.7*dens);
 col+=uC3*pow(dens,3.)*.18*fbm(q*5.+t*2.);
 gl_FragColor=vec4(finish(col),1.);`),
'crt-signal':withHelpers(SCN,`vec2 uv=gl_FragCoord.xy/uRes;vec2 c=uv*2.-1.;float asp=aspect();c.x*=1.;float r2=dot(c,c);vec2 d=c*(1.+.1*r2*r2*0.+.07*r2);vec2 s=d*.5+.5;
 float inside=step(0.,s.x)*step(s.x,1.)*step(0.,s.y)*step(s.y,1.);
 vec2 pm=uPointer;float near=exp(-pow((s.y-pm.y)*6.,2.));float act=step(.001,length(pm-.5));near*=act*(.4+.6*uAmount);
 float band=smoothstep(.0,.03,fract(uTime*.12-s.y*.5)-.88)*.0;
 float tear=near*(noise(vec2(s.y*60.,uTime*20.))-.5)*.12;float roll=sin(s.y*3.+uTime*.6)*.0015;
 vec2 sx=vec2(s.x+tear+roll,s.y);float ab=.003+near*.012+.0015*sin(uTime*2.);
 vec3 col=vec3(scn(sx+vec2(ab,0.),0.).r,scn(sx,0.).g,scn(sx-vec2(ab,0.),0.).b);
 float lines=.82+.18*sin(gl_FragCoord.y*3.14159/max(1.,floor(uRes.y/240.)));col*=lines;
 float tri=mod(gl_FragCoord.x,3.);vec3 mask=vec3(tri<1.?1.:.78,tri>=1.&&tri<2.?1.:.78,tri>=2.?1.:.78);col*=mask*1.12;
 float stat=noise(gl_FragCoord.xy*.5+uTime*40.);col=mix(col,vec3(stat)*uC3,near*.55);
 float rb=smoothstep(.04,0.,abs(fract(uTime*.07)-s.y))*.1;col+=uC2*rb;
 col*=1.-smoothstep(.55,1.55,r2)*.9;col*=inside;col+=uC1*.04;
 gl_FragColor=vec4(finish(col),1.);`),
'stir-mesh':withHelpers('',`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=vec2(uv.x*asp,uv.y);float t=uTime*.2;vec2 m=vec2(uPointer.x*asp,uPointer.y);
 vec2 d=p-m;float r=length(d);float fall=exp(-r*r*7.);float ang=fall*(2.4+uAmount*2.)*sin(t*3.+0.);p=m+rot(ang)*d;
 p+=vec2(fbm(p*1.3+t),fbm(p*1.3+vec2(4.,7.)-t))*.35-.17;
 vec2 a=vec2(.25+.2*sin(t*1.1),.3+.2*cos(t*.9))*vec2(asp,1.),b=vec2(.75+.2*cos(t*.8),.3+.2*sin(t*1.3))*vec2(asp,1.),c=vec2(.3+.2*sin(t*.7+2.),.8+.15*cos(t*1.2))*vec2(asp,1.),e=vec2(.8+.15*sin(t*1.4),.78+.15*cos(t*.6))*vec2(asp,1.);
 float wa=1./(.04+pow(length(p-a),2.8)),wb=1./(.04+pow(length(p-b),2.8)),wc=1./(.04+pow(length(p-c),2.8)),we=1./(.04+pow(length(p-e),2.8));
 vec3 col=(uC0*wa+uC1*wb+uC2*wc+uC3*we)/(wa+wb+wc+we);col=pow(col,vec3(.95));col+=(hash(gl_FragCoord.xy)-.5)*.035;
 col+=uC3*exp(-r*r*40.)*.12*step(.001,length(uPointer-.5));
 gl_FragColor=vec4(finish(col),1.);`),
'dither-lens':withHelpers(SCN+`float b2(vec2 p){p=mod(p,2.);return mod(p.x*2.+p.y*3.,4.);}`,`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float cell=max(2.,floor(uRes.y/150./uScale));vec2 g=floor(gl_FragCoord.xy/cell);vec2 cuv=(g+.5)*cell/uRes;
 vec3 sc=scn(cuv+vec2(.012*sin(uTime*.3),0.),0.);float l=lum(sc);
 float b4=(b2(g)*4.+b2(floor(g*.5)))/16.;
 float on=step(b4,clamp(l*1.15,0.,1.));vec3 dith=mix(uC0,uC3,on);
 vec2 pm=uPointer;if(length(pm-.5)<.001)pm=vec2(.5+.3*sin(uTime*.5),.5+.2*cos(uTime*.7));
 vec2 dd=(uv-pm)*vec2(asp,1.);float r=length(dd);float R=.2+.04*uAmount;float inlens=smoothstep(R,R-.012,r);
 vec3 real=scn(uv,0.);vec3 col=mix(dith,real,inlens);col+=uC2*smoothstep(.01,0.,abs(r-R))*.8;
 gl_FragColor=vec4(finish(col),1.);`),
'dissolve-edge':withHelpers(SCN,`vec2 uv=gl_FragCoord.xy/uRes;float T=11.;float tt=uTime/T;float cyc=floor(tt);float ph=fract(tt);float a=mod(cyc,2.);
 vec3 A=scn(uv,a),B=scn(uv,1.-a);float n=fbm(uv*vec2(6.,5.)+3.)*.62+fbm(uv*vec2(16.,12.))*.18+(1.-uv.y)*.5-.05;
 float front=smoothstep(.12,.82,ph)*1.2-.1;float d=front-n;float m=smoothstep(0.,.012,d);
 float edge=exp(-abs(d)*(40.-uAmount*14.))*step(.001,front)*step(front,1.05);
 vec3 col=mix(A,B,m);col+=(uC3*1.2+uC2*.4)*edge*.9;col*=1.-.3*smoothstep(0.,.1,-d)*smoothstep(.12,0.,-d)*0.;
 float cool=smoothstep(.0,.08,-d)*smoothstep(.2,.0,-d);col*=1.-cool*.35;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['fog-bank','Fog Bank','Live nature','Blue','A cool white fog bank rolls up the frame, swallowing a landscape and clearing onto a different scene.',['fog','whiteout','transition','landscape'],['#0e2433','#3a7ca5','#9fd0e8','#f3fbff'],.9,1,.5,'Fog depth',1.5],
 ['paper-tear','Paper Tear','Live materials','Orange','A landscape tears away from the bottom up, leaving a sheet of paper that then tears onto the next scene.',['paper','tear','transition','editorial'],['#2a1a3a','#c0456b','#f0a05a','#fff1d6'],.9,1,.5,'Roughness',3.7],
 ['ink-crown','Ink Crown','Live fluid & light','Purple','A soft cloud of colour hangs from the top edge and reaches towards your pointer, dragging behind it.',['ink','cloud','interactive','hero'],['#06050c','#4a2fd0','#9a6bff','#ffe1f5'],.8,1,.5,'Reach'],
 ['crt-signal','CRT Signal','Live tech & retro','Green','A landscape behind curved CRT glass with scanlines and phosphor, glitching into static near your pointer.',['crt','scanlines','glitch','retro'],['#050a08','#0e5a3a','#38e08a','#d6ffe8'],1,1,.5,'Interference'],
 ['stir-mesh','Stir Mesh','Live shaders','Pink','A drifting mesh gradient that your pointer stirs into a swirl like paint in water.',['mesh','gradient','fluid','interactive'],['#1b0f4a','#ff3d81','#ffb347','#3ee0ff'],1,1,.5,'Swirl'],
 ['dither-lens','Dither Lens','Live ASCII & dither','Purple','A landscape drawn in two-colour ordered dither with a round lens that fills it back in with true colour.',['dither','lens','1-bit','retro'],['#10091f','#5a2fb0','#d44fd0','#ffd6f2'],1,1,.5,'Lens size'],
 ['dissolve-edge','Dissolve Edge','Live materials','Orange','A picture breaks into organic patches with a glowing edge as it dissolves into the next scene.',['dissolve','burn','transition','glow'],['#1a0b2e','#ff4f8a','#ffb36b','#fff4c8'],1,1,.5,'Edge glow',5.6]
];
