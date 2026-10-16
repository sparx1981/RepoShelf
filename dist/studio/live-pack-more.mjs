// Original live backgrounds, round two: light effects, threads and webs, and automotive. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'magic-rings':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x);float t=uTime;vec3 col=uC0*(.6+.4*exp(-r*3.));
 for(int i=0;i<6;i++){float k=float(i);float R=.1+.075*k+.012*sin(t*.8+k);float dir=mod(k,2.)<.5?1.:-1.;
  float seg=smoothstep(.25,.4,fract((a+t*dir*(.25+.08*k))*(2.+k)/6.28318));seg=max(seg*step(fract((a+t*dir*(.25+.08*k))*(2.+k)/6.28318),.8),.18+uAmount*.2);
  float d=abs(r-R);col+=ramp(k/5.)*(smoothstep(.004,0.,d)*seg*1.3+exp(-d*55.)*.28*seg);
  float sp=pow(max(0.,sin(a*(30.+k*7.)+t*dir*2.)),40.);col+=uC3*sp*exp(-d*90.)*.8;}
 col+=uC3*exp(-r*18.)*.35;
 gl_FragColor=vec4(finish(col),1.);`),
'light-pillars':main(`vec2 uv=gl_FragCoord.xy/uRes;vec3 col=mix(uC0,uC0*.5,uv.y);
 for(int L=0;L<2;L++){float fl=float(L);float x=uv.x*aspect()*(7.+fl*5.)*uScale+uTime*.05*(1.+fl)+fl*3.1;float id=floor(x),f=fract(x)-.5;float h=hash(vec2(id,fl+uSeed));
  float w=.07+.18*h;float pil=exp(-pow(f/w,2.));float top=.35+.65*hash(vec2(id,9.+fl));float fade=smoothstep(top,0.,uv.y*.0+abs(uv.y-.0)-top*0.)*0.+smoothstep(top+.15,.0,uv.y)*(.5+.5*uv.y*0.);
  float flick=.65+.35*sin(uTime*(.6+h*1.5)+h*30.);float on=step(.25,hash(vec2(id,4.+fl)));
  col+=ramp(.25+.75*h)*pil*smoothstep(top,0.,uv.y)*flick*on*(.8+uAmount)*(1.-fl*.35)+uC3*pow(pil,6.)*smoothstep(top*.5,0.,uv.y)*flick*on*.25;}
 col+=uC1*exp(-uv.y*6.)*.2;
 gl_FragColor=vec4(finish(col),1.);`),
'shimmer-veil':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=uC0*(.5+.5*uv.y);float t=uTime*.12;
 for(int i=0;i<3;i++){float k=float(i);float x=uv.x*asp*(1.2+k*.5)*uScale;float w=fbm(vec2(x*.9+t*(1.+k*.3),uv.y*.9+k*4.));
  float folds=pow(.5+.5*sin(x*5.+w*(5.+uAmount*4.)+t*3.+k*2.),2.5);float vert=smoothstep(.0,.6,uv.y)*smoothstep(1.1,.35,uv.y);
  col+=ramp(.25+.3*k+.45*w)*folds*vert*(.95-k*.2);}
 col+=uC3*pow(fbm(vec2(uv.x*asp*3.,uv.y*2.+t*2.)),4.)*.18;
 gl_FragColor=vec4(finish(col),1.);`),
'electric-arcs':main(`vec2 p=frag()*uScale;vec3 col=uC0*(1.-.4*length(p));float tq=floor(uTime*14.);
 for(int i=0;i<4;i++){float k=float(i);vec2 A=vec2(-.5,.0)+.2*vec2(sin(uTime*.5+k*1.7),cos(uTime*.4+k*2.3));vec2 B=vec2(.5,0.)+.2*vec2(cos(uTime*.45+k*2.9),sin(uTime*.55+k*1.1));
  A.y+=(k-1.5)*.16;B.y+=(1.5-k)*.1;vec2 ab=B-A;float L=length(ab);vec2 dir=ab/L,nrm=vec2(-dir.y,dir.x);float s=clamp(dot(p-A,dir)/L,0.,1.);
  float off=(noise(vec2(s*9.,tq+k*7.))-.5)*.28*sin(s*3.14159)*(.6+uAmount)+(noise(vec2(s*30.,tq*1.3+k))-.5)*.06*sin(s*3.14159);
  float q=dot(p-A,nrm)-off;float d=abs(q);float flick=.6+.4*hash(vec2(tq,k));
  col+=uC2*(exp(-d*170.)*1.1+exp(-d*22.)*.14)*flick*step(0.,dot(p-A,dir))*step(dot(p-A,dir),L);col+=uC3*exp(-d*520.)*flick*step(0.,dot(p-A,dir))*step(dot(p-A,dir),L);
  col+=uC1*(exp(-length(p-A)*30.)+exp(-length(p-B)*30.))*.5;}
 gl_FragColor=vec4(finish(col),1.);`),
'scanner-beam':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float bx=fract(uTime*.1*uScale)*1.5-.25;float d=uv.x-bx;
 vec2 g=abs(fract(vec2(uv.x*asp,uv.y)*vec2(14.,14.))-.5);float grid=smoothstep(.46,.5,max(g.x,g.y))*0.+(smoothstep(.47,.5,g.x)+smoothstep(.47,.5,g.y));
 float trail=d<0.?exp(d*(4.-uAmount*2.5)):0.;float beam=exp(-abs(d)*160.);
 vec3 col=uC0+uC1*grid*(.08+1.4*trail)+uC2*beam*1.4*(.6+.4*sin(uv.y*60.))+uC1*trail*.2+uC3*beam*beam*.6;
 col+=uC2*exp(-abs(d)*8.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'pixel-bloom':main(`float cs=max(10.,floor(uRes.y/36./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;vec2 p=(id*cs-.5*uRes)/uRes.y;float t=uTime;
 float v=0.;for(int i=0;i<3;i++){float k=float(i);vec2 c=vec2(.55*sin(k*2.1+uSeed+t*.07),.28*cos(k*1.7+t*.09));float d=length(p-c);v+=sin(d*(16.+uAmount*10.)-t*(1.6+.3*k))*exp(-d*1.4);}
 v=clamp(.5+v*.6,0.,1.);float sq=smoothstep(.46,.4,max(abs(f.x),abs(f.y)));vec3 col=uC0+ramp(v)*sq*(.25+.9*v*v);col+=uC3*pow(v,8.)*sq*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'orb-halo':main(`vec2 p=frag()*uScale;p+=(uPointer-.5)*.05;float r=length(p),a=atan(p.y,p.x);float R=.23;float t=uTime*.5;vec3 col=uC0;
 if(r<R){float z=sqrt(max(0.,1.-(r/R)*(r/R)));vec2 q=vec2(a*1.2+t,acos(z)*3.);float sw=fbm(q*vec2(1.,1.)+vec2(0.,-t*1.4));float sw2=fbm(q*2.2+sw*2.+t);
  vec3 c=ramp(.2+.8*sw2)*(.6+.8*sw);float fres=pow(1.-z,2.5);col=mix(c,uC3,fres*.85)+uC2*fres*.5;col*=.55+.6*z;}
 else{float d=r-R;col+=uC2*exp(-d*9.)*.8+uC1*exp(-d*3.)*.35;float ten=pow(fbm(vec2(a*4.+t*2.,uTime*.6)),2.)*3.;col+=uC3*pow(max(0.,ten),2.)*exp(-d*(14.-uAmount*6.))*.6;col+=ramp(.7)*exp(-d*60.)*.9;}
 gl_FragColor=vec4(finish(col),1.);`),
'grid-warp':main(`vec2 p=frag()*uScale;vec2 m=(uPointer-.5)*vec2(aspect(),1.)*.9;m=mix(m,vec2(.35*sin(uTime*.4),.2*cos(uTime*.5)),step(length(uPointer-.5),.001));
 vec2 d=p-m;float l=dot(d,d);vec2 q=p+d*(.12+uAmount*.12)/(l+.03)+vec2(sin(p.y*4.+uTime),cos(p.x*4.-uTime))*.02;
 vec2 g=abs(fract(q*9.)-.5);float line=max(smoothstep(.465,.5,g.x),smoothstep(.465,.5,g.y));float major=max(smoothstep(.49,.5,abs(fract(q*1.8)-.5).x*1.),0.);
 float glow=exp(-sqrt(l)*3.5);vec3 col=uC0+ramp(.3+.5*glow)*line*(.5+.9*glow)+uC3*exp(-length(d)*20.)*.6;
 gl_FragColor=vec4(finish(col),1.);`),
'halftone-vortex':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x);float t=uTime*.5;vec2 q=rot(.7854)*p*(26.);vec2 id=floor(q),f=fract(q)-.5;
 vec2 cp=rot(-.7854)*((id+.5)/26.);float cr=length(cp),ca=atan(cp.y,cp.x);float val=.5+.5*sin(ca*3.+cr*(11.+uAmount*8.)-t*2.);val*=smoothstep(.95,.1,cr);
 float rad=.52*sqrt(val);float dot_=smoothstep(rad,rad-.12,length(f));vec3 col=uC0+ramp(.15+.85*val)*dot_;
 gl_FragColor=vec4(finish(col),1.);`),
'thread-flow':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float x=uv.x*asp*uScale;vec3 col=uC0*(.6+.4*uv.y);float t=uTime*.2;
 for(int i=0;i<48;i++){float f=float(i)/47.;float y=.5+(f-.5)*(.7+.3*sin(x*.9+t))+.09*sin(x*2.4+t*1.3+f*5.)*(.4+uAmount)+.05*sin(x*5.1-t+f*9.+uSeed)+.03*sin(x*9.+f*20.);
  float d=abs(uv.y-y);float line=smoothstep(.0028,0.,d);float br=.35+.65*pow(.5+.5*sin(x*1.5+f*12.-t*2.),2.);
  col+=ramp(f)*(line*br*.8+exp(-d*120.)*br*.08);}
 gl_FragColor=vec4(finish(col),1.);`),
'spider-web':main(`vec2 p=frag()*uScale;p+=(uPointer-.5)*.03;float r=length(p);float a=atan(p.y,p.x);float N=14.;a+=sin(r*10.-uTime*1.4)*.012*(.5+uAmount)+sin(uTime*.4+r*3.)*.01;
 float sa=a/6.28318*N;float seg=fract(sa)-.5;float rp=r*(1.+.1*(1.-4.*seg*seg));float rv=rp*15.;
 float spoke=smoothstep(.006,0.,abs(seg)*r*6.28318/N*.9)*step(.03,r);float ring=smoothstep(.0045,0.,abs(fract(rv)-.5)-.48)*step(.04,r);
 vec2 cell=vec2(floor(sa),floor(rv+.5));float tw=.5+.5*sin(uTime*2.+hash(cell)*20.);
 float node=smoothstep(.1,.0,abs(seg)*r*6.28318/N*6.)*smoothstep(.1,0.,abs(fract(rv)-.5)-.4)*step(.7,hash(cell+uSeed));
 float fade=smoothstep(.78,.2,r);vec3 col=uC0+uC1*(spoke*.7+ring*.55)*fade+uC3*node*tw*1.2*fade;col+=uC2*exp(-r*3.)*.14;
 gl_FragColor=vec4(finish(col),1.);`),
'liquid-bars':main(`vec2 uv=gl_FragCoord.xy/uRes;float n=floor(26.*uScale);float x=uv.x*n;float id=floor(x),f=fract(x)-.5;float t=uTime*.8;
 float h=.35+.3*sin(id*.4+t)+.2*sin(id*.9-t*1.3+uSeed)+.12*sin(id*2.1+t*2.)*(.4+uAmount);h=clamp(h,.05,.95);float w=.4;
 float top=h;float body=smoothstep(w,w-.06,abs(f))*smoothstep(top+.004,top-.004,uv.y);float cap=smoothstep(.03,0.,abs(uv.y-top))*smoothstep(w,w-.06,abs(f));
 vec3 col=uC0+ramp(.15+.85*uv.y/top)*body*(.55+.6*uv.y/top)+uC3*cap*.9;float refl=smoothstep(w,w-.06,abs(f))*smoothstep(.0,top*.4,top*.4-(uv.y-.0))*0.;
 col+=uC1*exp(-abs(uv.y-top)*14.)*smoothstep(w,0.,abs(f))*.15;
 gl_FragColor=vec4(finish(col),1.);`),
'brake-disc':main(`vec2 p=frag()*uScale*.95;float r=length(p),a=atan(p.y,p.x);float rot=uTime*.9*(.5+uAmount);vec3 col=uC0;
 float disc=smoothstep(.47,.465,r)*smoothstep(.13,.135,r);
 float holes=0.;float ang=a+rot;float hs=fract(ang*24./6.28318)-.5;float hr=r-.33;holes=smoothstep(.034,.028,length(vec2(hs*r*6.28318/24.,hr)));
 float holes2=smoothstep(.034,.028,length(vec2((fract(ang*24./6.28318+.5)-.5)*r*6.28318/24.,r-.4)));
 float slots=smoothstep(.01,.0,abs(fract((ang+r*1.2)*12./6.28318)-.5)-.45)*step(.17,r)*step(r,.46)*0.;
 float ring=smoothstep(.01,0.,abs(r-.255)-.004)*.5;float lit=.5+.5*sin(a*1.+1.2);
 vec3 steel=mix(uC1,uC2,.35+.35*lit+.25*fbm(vec2(a*3.+rot*2.,r*30.)));steel*=.85+.3*sin(r*180.)*.12;
 col=mix(col,steel,disc*(1.-holes*.97)*(1.-holes2*.97));col+=uC3*smoothstep(.006,0.,abs(r-.465))*.6;
 float hub=smoothstep(.13,.125,r);col=mix(col,mix(uC1,uC2,.4)*.7,hub);
 float bolt=0.;for(int i=0;i<5;i++){float bb=float(i)/5.*6.28318+rot*0.;bolt=max(bolt,smoothstep(.016,.011,length(p-.075*vec2(cos(bb+rot),sin(bb+rot)))));}col=mix(col,uC3*.8,bolt);
 float cal=smoothstep(.0,.02,.75-abs(a-.0))*smoothstep(.54,.5,r)*smoothstep(.4,.44,r)*step(abs(a),.6);col=mix(col,uC3*.0+vec3(.8,.12,.08)*(.7+.3*lit),cal*.9);
 col*=1.-.3*smoothstep(.5,.9,r);
 gl_FragColor=vec4(finish(col),1.);`),
'alloy-wheel':main(`vec2 p=frag()*uScale*.95;float r=length(p),a=atan(p.y,p.x);vec3 col=uC0*.6;float acc=0.;float sh=0.;
 for(int i=0;i<5;i++){float k=float(i)/4.-.5;float rot=uTime*(.8+uAmount*1.6)+k*.1;float ang=fract((a+rot)*5./6.28318)-.5;float arc=ang*r*6.28318/5.;
  float w=.03+.05*smoothstep(.1,.38,r);float m=smoothstep(w,w-.008,abs(arc))*step(.11,r)*step(r,.4);acc+=m;sh+=m*(.55+.45*sin(ang*6.28+1.));}
 acc/=5.;sh/=5.;
 vec3 metal=mix(uC1,uC2,clamp(sh*1.8,0.,1.));col=mix(col,metal,clamp(acc*1.4,0.,1.));
 float rim=smoothstep(.43,.425,r)*smoothstep(.385,.39,r);col=mix(col,mix(uC1,uC3,.5+.5*sin(a*2.+.5))*.9,rim);
 float tyre=smoothstep(.5,.495,r)*smoothstep(.43,.435,r);col=mix(col,uC0*.35+uC1*.05*step(.5,fract((a+uTime*.8)*72./6.28318)),tyre);
 float hub=smoothstep(.115,.11,r);col=mix(col,mix(uC1,uC3,.5)*.85,hub);float lug=0.;for(int i=0;i<5;i++){float b=float(i)/5.*6.28318;lug=max(lug,smoothstep(.016,.011,length(p-.065*vec2(cos(b),sin(b)))));}col=mix(col,uC3,lug);
 col+=uC3*smoothstep(.01,0.,abs(r-.43))*.3;
 gl_FragColor=vec4(finish(col),1.);`),
'rev-bar':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=uC0;float n=22.;float val=.5+.5*sin(uTime*.7)*sin(uTime*.31+1.)+.03*sin(uTime*4.);val=clamp(val,0.,1.);
 vec2 q=vec2((uv.x-.5)*asp,(uv.y-.5));float bw=.074*uScale;float x=(q.x/bw)+n*.5;float id=floor(x),f=fract(x)-.5;
 float inside=step(0.,id)*step(id,n-1.);float lit=step((id+.5)/n,val)*inside;float fr=(id+.5)/n;
 vec3 lc=fr<.5?uC1:(fr<.8?uC2:uC3);float led=smoothstep(.42,.34,abs(f))*smoothstep(1.,.85,abs(q.y/(bw*1.6)));
 col+=lc*led*(lit*1.4+inside*.07);col+=lc*lit*exp(-pow(q.y/(.16),2.))*smoothstep(.6,.0,abs(f))*.3;
 col+=lc*lit*exp(-abs(q.y)*8.)*.18*inside;
 float refl=led*lit*exp(-abs(q.y+.13)*20.)*.0;
 gl_FragColor=vec4(finish(col),1.);`),
'headlight-beams':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=mix(uC0*.3,uC0,uv.y)+uC2*.04*fbm(uv*vec2(asp,1.)*3.+uTime*.03);
 float sweep=.12*sin(uTime*.35+uSeed)*(.5+uAmount);
 for(int i=0;i<2;i++){float k=float(i);vec2 src=vec2(.5+(k-.5)*.28*(1./asp+.55),.1)*vec2(1.,1.);vec2 d=(uv-src)*vec2(asp,1.);float ang=atan(d.x,d.y)-sweep;float len=length(d);
  float cone=smoothstep(.42,.04,abs(ang));float core=exp(-pow(ang/.16,2.));float fall=exp(-len*1.15);float dust=.55+.45*fbm(vec2(ang*6.+uTime*.1*k,len*3.-uTime*.2));
  col+=mix(uC3,uC1,smoothstep(0.,1.,len))*(cone*.4+core*1.05)*fall*dust*step(0.,d.y+.02);col+=uC3*exp(-length(uv-src)*vec2(asp,1.).x*26.)*.7;}
 col+=uC1*pow(exp(-abs(uv.y-.12)*18.),1.)*.06;
 gl_FragColor=vec4(finish(col),1.);`),
'speed-lines':main(`vec2 p=frag()*uScale;float r=length(p),a=atan(p.y,p.x);float N=90.;float s=floor(a/6.28318*N),fs=fract(a/6.28318*N)-.5;float h=hash(vec2(s,uSeed)),h2=hash(vec2(s,7.));
 float t=fract(uTime*(.5+h2*.9)+h);float start=.18+.5*h,len=.1+.5*h2*(.5+uAmount);float rr=start+t*1.2;float tt=(rr-r)/len;float inside=step(0.,tt)*step(tt,1.);
 float w=.0015+.01*h*r*.2;float core=exp(-pow(fs*r*6.28318/N/(w+.004),2.))*(1.-tt)*inside*step(.3,h);
 vec3 col=mix(uC0*.6,uC0,smoothstep(0.,.8,r))+mix(uC1,uC3,h2)*core*1.5+uC2*exp(-r*2.5)*.18;
 gl_FragColor=vec4(finish(col),1.);`),
'heat-haze':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float t=uTime*.4;
 vec2 p=vec2(uv.x*asp*2.2*uScale,uv.y*2.);float w=fbm(p+vec2(0.,-t*1.4));vec2 q=p+vec2(w*.7,-t)+vec2(fbm(p*2.+vec2(3.,-t*2.))*.4,0.);
 float f=fbm(q*vec2(1.,1.2));float base=pow(1.-uv.y,1.8)*(.7+uAmount*.5);float heat=clamp(f*1.3*base+base*.22,0.,.92);
 vec3 col=uC0+ramp(heat)*smoothstep(.04,.9,heat)*1.1+uC3*pow(heat,6.)*.25;col+=uC1*pow(1.-uv.y,5.)*.2;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['magic-rings','Magic Rings','Live light & particles','Purple','Concentric rings of light turning in opposite directions with glinting sparks.',['rings','magic','portal','glow'],['#05030c','#6a3bff','#ff5fd8','#fff0ff'],.9,1,.5,'Ring brightness'],
 ['light-pillars','Light Pillars','Live light & particles','Blue','Columns of light rising and flickering like a distant skyline.',['pillars','beams','light','stage'],['#02040c','#2f6bff','#8a5cff','#c8e4ff'],.9,1,.5,'Brightness'],
 ['shimmer-veil','Shimmer Veil','Live light & particles','Purple','Translucent veils of colour drifting in a dark room.',['veil','curtain','soft','dark'],['#04030a','#3a1f9a','#b04fff','#59d6ff'],.8,1,.5,'Fold depth'],
 ['electric-arcs','Electric Arcs','Live light & particles','Blue','Crackling arcs of electricity jumping between moving points.',['electric','lightning','arc','energy'],['#03050f','#2a5bff','#6fb6ff','#ffffff'],1,1,.5,'Arc wildness'],
 ['scanner-beam','Scanner Beam','Live tech & retro','Green','A scanning beam revealing a glowing grid as it passes.',['scanner','beam','grid','scan'],['#020a08','#12b886','#6dffd0','#ffffff'],.9,1,.5,'Trail length'],
 ['pixel-bloom','Pixel Bloom','Live tech & retro','Pink','Square pixels blooming in waves of colour.',['pixel','bloom','retro','wave'],['#0a0614','#7a2fd8','#ff5fae','#ffe9a8'],.9,1,.5,'Wave density'],
 ['orb-halo','Orb Halo','Live light & particles','Blue','A swirling energy orb ringed by a bright halo and crackling tendrils.',['orb','energy','halo','plasma'],['#03040b','#2a3cff','#69a9ff','#e8f4ff'],.9,1,.5,'Tendrils'],
 ['grid-warp','Grid Warp','Live geometric','Blue','A glowing grid bending around a moving lens.',['grid','warp','lens','interactive'],['#03060f','#1d4ed8','#6ea8ff','#ffffff'],.9,1,.5,'Lens strength'],
 ['halftone-vortex','Halftone Vortex','Live geometric','Pink','Halftone dots swelling and shrinking in a spiral.',['halftone','dots','vortex','print'],['#0c0714','#8b2fd8','#ff5fb0','#ffe0a8'],.9,1,.5,'Spiral tightness'],
 ['thread-flow','Thread Flow','Live geometric','Purple','Fine threads of light flowing and weaving across the screen.',['threads','lines','flow','silk'],['#06040f','#4b2fe0','#ff4fb8','#ffd6a8'],.8,1,.5,'Wave'],
 ['spider-web','Spider Web','Live geometric','Neutral','A dew-beaded spider web trembling in the wind.',['web','spider','dew','delicate'],['#06080c','#9fb2c8','#5a7090','#ffffff'],.9,1,.5,'Sway'],
 ['liquid-bars','Liquid Bars','Live geometric','Green','Rounded bars rising and falling like a spectrum.',['bars','equalizer','audio','wave'],['#030a07','#0d6b4a','#33e0a0','#d8fff0'],.9,1,.5,'Detail'],
 ['brake-disc','Brake Disc','Live industrial','Neutral','A drilled brake disc turning behind a bright red caliper.',['brake','disc','automotive','caliper'],['#07080a','#4a525d','#b6c0cc','#ffffff'],.9,1,.5,'Speed'],
 ['alloy-wheel','Alloy Wheel','Live industrial','Neutral','A five-spoke alloy wheel spinning with motion blur.',['wheel','alloy','rim','automotive'],['#06070a','#5a626e','#c4ced9','#ffffff'],.9,1,.5,'Spin'],
 ['rev-bar','Shift Lights','Live industrial','Green','A shift-light bar climbing from green through amber to red.',['rev','led','shift light','automotive'],['#050607','#25d366','#ffb020','#ff2a2a'],1,1,.5,'Size'],
 ['headlight-beams','Headlight Beams','Live industrial','Neutral','Headlights cutting through fog and dust.',['headlights','fog','beam','automotive'],['#05060a','#8fa8c8','#2a3a52','#fff2d0'],.8,1,.5,'Sweep'],
 ['speed-lines','Speed Lines','Live industrial','Blue','Long streaks of speed rushing past from the edges.',['speed','streaks','racing','motion'],['#04060d','#2f7bff','#a8d8ff','#ffffff'],1,1,.5,'Streak length'],
 ['heat-haze','Heat Haze','Live industrial','Orange','Rising exhaust heat with a molten glow at the base.',['heat','exhaust','haze','fire'],['#060403','#8a2a06','#ff7a1a','#ffd98a'],.9,1,.5,'Heat']
];
