// Original live backgrounds: tech and retro. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'digital-rain':main(`float cs=max(12.,floor(uRes.y/34./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 cell=floor(g);vec2 f=fract(g);
 float col=cell.x,rowsTotal=uRes.y/cs;float speed=.35+.55*hash(vec2(col,1.+uSeed)),off=hash(vec2(col,7.));
 float head=fract(uTime*speed*.35+off)*(rowsTotal+14.)-6.;float age=(head-cell.y);
 float trail=age>=0.?exp(-age*(.16-uAmount*.1)):0.;float isHead=smoothstep(1.2,0.,abs(age));
 vec2 sub=floor(f*vec2(3.,5.));float on=step(.45,hash(cell*7.+sub+floor(uTime*(2.+hash(vec2(col,3.))*3.))*13.));
 float inside=step(.12,f.x)*step(f.x,.88)*step(.1,f.y)*step(f.y,.9);
 float m=on*inside;vec3 c=uC0+uC1*m*trail*1.3+uC2*m*trail*trail*.7+uC3*m*isHead*1.4;
 c+=uC1*trail*.05;
 gl_FragColor=vec4(finish(c),1.);`),
'synthwave-grid':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect(),hor=.46;vec3 col;
 if(uv.y>=hor){float k=(uv.y-hor)/(1.-hor);col=mix(uC2,uC0,pow(k,.55));
  vec2 sp=(uv-vec2(.5,hor+.17))*vec2(asp,1.);float sd=length(sp);
  float bars=smoothstep(.0,.02,fract((uv.y-hor)*22.-uTime*.15)-.3+max(0.,(.17-(uv.y-hor))*2.));
  float sun=smoothstep(.2,.195,sd)*(sp.y>0.?1.:bars);col=mix(col,mix(uC1,uC3,clamp(sp.y*3.+.5,0.,1.)),sun);
  col+=uC1*exp(-sd*4.)*.25;col+=step(.9985,hash(floor(gl_FragCoord.xy/2.)))*smoothstep(.4,.9,k)*.7;}
 else{float d=hor-uv.y,z=1./(d+.015);float x=(uv.x-.5)*asp*z*uScale;
  float gx=abs(fract(x*.5)-.5),gz=abs(fract(z*.9+uTime*.5)-.5);
  float w=.035*(1.+d*5.)*(1.-uAmount*.3);float line=smoothstep(w,0.,min(gx*1.,gz*.9*(.4+d)));
  col=mix(uC0*.55,uC2*.35,exp(-d*6.));col+=uC1*line*(.55+.9*exp(-d*3.));col+=uC2*exp(-d*14.)*.5;}
 gl_FragColor=vec4(finish(col),1.);`),
'crt-bars':withHelpers(`vec3 signal(vec2 uv,float t){float x=uv.x+.012*sin(uv.y*20.+t*3.)*(.3+.7*step(.97,fract(uv.y*3.-t*.2)));float bar=floor(x*7.);vec3 c=ramp(fract(bar/7.*.95+.04));float lowband=smoothstep(.3,.28,uv.y);vec3 grey=vec3(.5+.5*sin(x*6.2831*2.));c=mix(c,mix(uC0,uC3,x),lowband);c=mix(c,uC3*(.3+.7*step(.5,fract(x*14.))),smoothstep(.1,.09,uv.y)*lowband);return c*(.7+.3*smoothstep(.0,.04,fract(x*7.)));}`,
 `vec2 uv=gl_FragCoord.xy/uRes;float t=uTime*.6;vec2 c=uv-.5;vec2 cv=uv+c*dot(c,c)*.22;
 float sh=.002+uAmount*.007;vec3 col=vec3(signal(cv+vec2(sh,0.),t).r,signal(cv,t).g,signal(cv-vec2(sh,0.),t).b);
 float scan=.76+.24*sin(gl_FragCoord.y*3.14159);float mask=.9+.1*sin(gl_FragCoord.x*2.094);
 col*=scan*mask;col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.08;
 float roll=smoothstep(.06,.0,abs(fract(uv.y*.6-uTime*.08)-.5)-.44);col+=roll*.09;
 col*=1.-dot(c,c)*1.5;col*=step(abs(cv.x-.5),.5)*step(abs(cv.y-.5),.5);
 gl_FragColor=vec4(clamp(col,0.,1.),1.);`),
'circuit-maze':main(`vec2 p=frag()*(6.+uScale*2.5);vec2 id=floor(p),f=fract(p);
 float flip=step(.5,hash(id+uSeed));vec2 q=flip>.5?vec2(1.-f.x,f.y):f;
 float d=abs(q.x-q.y)*.7071;float w=.045+uAmount*.03;
 float along=q.x;float pulse=pow(.5+.5*sin(along*5.-uTime*3.2+hash(id)*20.),10.);
 float tr=smoothstep(w,w*.5,d);vec2 pad=min(f,1.-f);float node=smoothstep(.12,.07,length(pad));
 vec3 col=uC0*(.8+.2*hash(id+3.))+uC1*tr*.55+uC2*tr*pulse*1.2+uC3*node*(.3+.6*pulse);
 col+=uC1*exp(-d*28.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'radar-sweep':main(`vec2 p=frag()*uScale*.82;float r=length(p),a=atan(p.y,p.x);float t=uTime*.7;
 float sweepA=mod(t,6.28318)-3.14159;float diff=mod(sweepA-a+6.28318,6.28318);
 float wedge=exp(-diff*(1.6-uAmount))*step(r,.52);
 float rings=smoothstep(.006,0.,abs(fract(r*9.)-.5)-.49)*step(r,.52)*.5;float spokes=smoothstep(.004,0.,abs(sin(a*6.))*r*.2-.0006)*step(r,.52)*.0;
 vec3 col=uC0+uC1*(rings*.45+wedge*.5)+uC1*smoothstep(.012,.0,abs(r-.52))*.9;
 for(int i=0;i<9;i++){float k=float(i);float ba=hash(vec2(k,uSeed))*6.28318-3.14159,br=.1+.38*hash(vec2(k,3.));
  vec2 bp=br*vec2(cos(ba),sin(ba));float bd=length(p-bp);float since=mod(sweepA-ba+6.28318,6.28318);
  col+=uC3*exp(-bd*90.)*exp(-since*1.1)*1.6;}
 col+=uC2*smoothstep(.012,.0,abs(a-sweepA)*r)*step(r,.52)*.6;
 gl_FragColor=vec4(finish(col),1.);`),
'oscilloscope':main(`vec2 uv=frag()*uScale;float t=uTime;
 vec2 grid=abs(fract(uv*vec2(8.,5.)+.5)-.5);vec3 col=uC0+uC1*(smoothstep(.02,0.,grid.x)+smoothstep(.02,0.,grid.y))*.18+uC1*smoothstep(.012,0.,abs(uv.y))*.3;
 for(int i=0;i<3;i++){float k=float(i);float x=uv.x*(2.2+k*.9);
  float y=.22*sin(x*3.+t*(1.2+k*.5)+k)+.12*sin(x*7.-t*.8+k*2.+uSeed)*(.4+uAmount)+.05*sin(x*17.+t*2.);
  float slope=.22*3.*cos(x*3.+t*(1.2+k*.5)+k);float d=abs(uv.y-y*.8+(k-1.)*.14)/sqrt(1.+slope*slope*.4);
  vec3 tc=k<.5?uC2:(k<1.5?uC3:uC1);col+=tc*(exp(-d*180.)*1.1+exp(-d*28.)*.22);}
 col*=1.-dot(uv,uv)*.55;
 gl_FragColor=vec4(finish(col),1.);`),
'data-streams':main(`vec2 uv=gl_FragCoord.xy/uRes;float lanes=14.*uScale;float lane=floor(uv.y*lanes);float fy=fract(uv.y*lanes);
 float h=hash(vec2(lane,uSeed)),h2=hash(vec2(lane,9.));float speed=(.2+h*.9)*(h2>.5?1.:-1.);
 float x=uv.x*aspect()*(6.+h2*12.)-uTime*speed*3.;float dash=smoothstep(.02,.06,fract(x))*smoothstep(.02+.5*(.3+h),.0+.5*(.3+h),fract(x));
 float bar=smoothstep(.12,.2,fy)*smoothstep(.88,.8,fy);float head=smoothstep(.0,.35,fract(x))*.0;
 vec3 col=uC0+ramp(h)*dash*bar*(.5+.9*uAmount)+uC3*pow(dash,6.)*bar*.4;
 col+=ramp(h)*.05*smoothstep(.3,.0,abs(fy-.5));
 gl_FragColor=vec4(finish(col),1.);`),
'glitch-blocks':main(`vec2 uv=gl_FragCoord.xy/uRes;float tq=floor(uTime*7.);vec2 bid=floor(uv*vec2(10.,26.)*uScale);
 float g=hash(bid+tq*1.7+uSeed),g2=hash(vec2(bid.y,tq));float on=step(.86-uAmount*.12,g2);
 vec2 off=vec2((g-.5)*.18,0.)*on;vec2 u2=uv+off;
 float base=u2.x*.7+u2.y*.5+.1*sin(uTime*.4+u2.y*6.);
 float sh=.01*on;vec3 col=vec3(ramp(.5+.5*sin((base+sh*3.)*5.)).r,ramp(.5+.5*sin(base*5.)).g,ramp(.5+.5*sin((base-sh*3.)*5.)).b);
 col*=.85+.15*step(.5,hash(vec2(bid.y,floor(uTime*20.))))*on+.15;
 col+=uC3*step(.97,hash(bid*3.+tq))*on*.7;col*=.8+.2*sin(gl_FragCoord.y*1.5);
 gl_FragColor=vec4(finish(col),1.);`),
'led-matrix':main(`float cs=max(8.,floor(uRes.y/36./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;vec2 p=(id*cs-.5*uRes)/uRes.y;
 float t=uTime*.6;float v=.5+.5*sin(p.x*4.2-t*1.4+sin(p.y*3.+t)*1.4);
 v=clamp(.5+(v-.5)*(.9+uAmount*.9),0.,1.);float lit=smoothstep(.0,.25,v);float r=.36;float d=length(f);
 float led=smoothstep(r,r-.08,d)*(.12+.88*lit);vec3 c=uC0+ramp(v)*led+ramp(v)*exp(-d*3.)*lit*.22;
 gl_FragColor=vec4(finish(c),1.);`),
'hud-rings':main(`vec2 p=frag()*uScale*.95;float r=length(p),a=atan(p.y,p.x);float t=uTime;vec3 col=uC0;
 float ring1=smoothstep(.004,0.,abs(r-.42));float seg=step(fract((a+t*.3)*5./6.28318),.7);col+=uC1*ring1*seg*.9;
 float ring2=smoothstep(.012,0.,abs(r-.36));float seg2=step(fract((a-t*.5)*3./6.28318),.45);col+=uC2*ring2*seg2*.9;
 float tick=step(fract((a+t*.1)*60./6.28318),.12);col+=uC1*tick*smoothstep(.006,0.,abs(r-.46)-.015)*.8;
 float ring3=smoothstep(.003,0.,abs(r-.25));col+=uC1*ring3*.5;float dash=step(fract((a-t*.7)*24./6.28318),.5);col+=uC3*smoothstep(.01,0.,abs(r-.29))*dash*.8;
 float arc=smoothstep(.01,0.,abs(r-.17));float ang=mod(a-t*.9,6.28318);col+=uC2*arc*smoothstep(2.4,0.,ang)*1.4*(.6+uAmount);
 col+=uC3*smoothstep(.02,0.,abs(r-.05))*.8+uC1*exp(-r*5.)*.18;
 col+=uC1*(smoothstep(.002,0.,abs(p.x))+smoothstep(.002,0.,abs(p.y)))*.1*smoothstep(.55,.3,r);
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['digital-rain','Digital Rain','Live tech & retro','Green','Cascading glyph columns with glowing heads.',['matrix','code','rain','terminal'],['#010503','#0f9a45','#7dff9b','#e8fff0'],1,1,.5,'Trail length'],
 ['synthwave-grid','Synthwave Grid','Live tech & retro','Pink','A neon grid racing towards a striped retro sun.',['synthwave','retro','neon','80s'],['#12052a','#ff4fa8','#6a1fb0','#ffd45a'],1,1,.5,'Grid sharpness'],
 ['crt-bars','CRT Bars','Live tech & retro','Purple','Drifting colour on a curved CRT with scanlines and fringing.',['crt','scanlines','retro','tv'],['#1a0f5c','#ff2f62','#12c9f0','#ffd84a'],.9,1,.5,'Colour fringe'],
 ['circuit-maze','Circuit Maze','Live tech & retro','Green','Diagonal circuit traces with pulses of current.',['circuit','pcb','maze','electronics'],['#04100c','#0f6b4a','#3dffc0','#d8fff4'],1,1,.5,'Trace width'],
 ['radar-sweep','Radar Sweep','Live tech & retro','Green','A radar sweep lighting up blips as it passes.',['radar','sonar','scan'],['#02100a','#16a35a','#7dffb0','#ffffff'],1,1,.5,'Sweep trail'],
 ['oscilloscope','Oscilloscope','Live tech & retro','Green','Phosphor traces dancing across an instrument grid.',['scope','waveform','lab'],['#020a06','#14803d','#6aff9a','#ffd24a'],1,1,.5,'Wave detail'],
 ['data-streams','Data Streams','Live tech & retro','Blue','Lanes of dashed light streaming past at different speeds.',['data','network','streams'],['#030813','#1d52c4','#57b2ff','#ffffff'],1,1,.5,'Brightness'],
 ['glitch-blocks','Glitch Blocks','Live tech & retro','Pink','A gradient broken into jumpy, colour-split blocks.',['glitch','digital','distortion'],['#14062e','#ff3f8e','#3fe0ff','#fff2a8'],1,1,.5,'Glitch rate'],
 ['led-matrix','LED Matrix','Live tech & retro','Orange','A panel of glowing LEDs showing flowing colour.',['led','matrix','display'],['#080505','#c2421a','#ff9a1f','#fff0b0'],1,1,.5,'Contrast'],
 ['hud-rings','HUD Rings','Live tech & retro','Blue','Rotating sci-fi interface rings with ticks and sweeping arcs.',['hud','sci-fi','interface'],['#02060e','#2a8fe0','#7fe3ff','#ffffff'],1,1,.5,'Arc glow']
];
