// Original live backgrounds: light, particles and materials. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'glow-glyphs':withHelpers(`float seg(vec2 f,vec2 a,vec2 b,float w){return smoothstep(w,w*.4,sdSeg(f,a,b));}
float glyph(vec2 f,float lv){vec2 c=f-.5;float w=.075;float m=0.;
 if(lv>=1.&&lv<2.)m=smoothstep(.11,.06,length(f-vec2(.5,.22)));
 else if(lv>=2.&&lv<3.)m=max(smoothstep(.1,.06,length(f-vec2(.5,.3))),smoothstep(.1,.06,length(f-vec2(.5,.7))));
 else if(lv>=3.&&lv<4.)m=seg(f,vec2(.2,.5),vec2(.8,.5),w);
 else if(lv>=4.&&lv<5.)m=max(seg(f,vec2(.2,.36),vec2(.8,.36),w),seg(f,vec2(.2,.64),vec2(.8,.64),w));
 else if(lv>=5.&&lv<6.)m=max(seg(f,vec2(.2,.5),vec2(.8,.5),w),seg(f,vec2(.5,.2),vec2(.5,.8),w));
 else if(lv>=6.&&lv<7.)m=max(max(seg(f,vec2(.2,.5),vec2(.8,.5),w),seg(f,vec2(.5,.2),vec2(.5,.8),w)),max(seg(f,vec2(.28,.28),vec2(.72,.72),w),seg(f,vec2(.28,.72),vec2(.72,.28),w)));
 else if(lv>=7.&&lv<8.)m=max(max(seg(f,vec2(.36,.18),vec2(.36,.82),w),seg(f,vec2(.64,.18),vec2(.64,.82),w)),max(seg(f,vec2(.18,.36),vec2(.82,.36),w),seg(f,vec2(.18,.64),vec2(.82,.64),w)));
 else if(lv>=8.)m=max(smoothstep(w,w*.4,abs(length(c)-.3)),smoothstep(.1,.06,length(c)));
 return m;}`,
 `float cs=max(12.,floor(uRes.y/24./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 cell=floor(g),f=fract(g);
 vec2 cc=(cell+.5)*cs;vec2 p=(cc-.5*uRes)/uRes.y;float t=uTime*.4,v=0.;
 for(int i=0;i<3;i++){float k=float(i);vec2 c=vec2(.5*sin(t*(.3+.11*k)+k*2.1+uSeed),.24*cos(t*(.27+.09*k)+k*1.7));v+=exp(-dot(p-c,p-c)*(6.-k*1.4));}
 v=1.-exp(-v*(.9+uAmount*.9));
 float near=smoothstep(1.,0.,length(cc-uPointer*uRes)/(uRes.y*.2));float tick=floor(uTime*10.);
 float scr=hash(cell+tick*1.7)*near;float L=clamp(v+(scr-.35*near)*.9*near+.0,0.,1.);
 float lv=floor(L*8.99);float m=glyph(f,lv);
 vec3 col=uC0+ramp(.2+L*.8)*m*(.7+near*.9)+ramp(L)*v*.16;
 gl_FragColor=vec4(finish(col),1.);`),
'gloss-tiles':withHelpers(`float hgt(vec2 c,float t){return sin(c.x*.7+t)+sin(c.y*.9-t*1.2)+.6*sin((c.x+c.y)*.5+t*.7);}`,
 `vec2 uv=frag();float t=uTime*.6;vec2 q=uv;q.y=(q.y+.15)*1.5;q.x*=1.+(.5-uv.y)*.55;q*=5.*uScale;
 vec2 id=floor(q),f=fract(q);vec2 c=id+.5;float k=.35*(.5+uAmount*1.3);
 float nx=hgt(c+vec2(1.,0.),t)-hgt(c-vec2(1.,0.),t),ny=hgt(c+vec2(0.,1.),t)-hgt(c-vec2(0.,1.),t);
 vec3 n=normalize(vec3(-nx*k-(f.x-.5)*.5,-ny*k-(f.y-.5)*.5,1.));
 vec3 l1=normalize(vec3(cos(t*.5)*1.2,sin(t*.4)*.9,.7)),l2=normalize(vec3(-cos(t*.45+1.)*1.2,-sin(t*.6)*.9,.7));
 float s1=pow(max(reflect(-l1,n).z,0.),30.),s2=pow(max(reflect(-l2,n).z,0.),30.);
 float d1=max(dot(n,l1),0.),d2=max(dot(n,l2),0.);
 vec3 col=uC0*(.5+.5*hash(id))+uC1*(d1*.35)+uC2*(d2*.35)+uC1*s1*1.5+uC2*s2*1.5+uC3*(s1*s2)*3.;
 float e=min(min(f.x,1.-f.x),min(f.y,1.-f.y));col*=smoothstep(0.,.07,e);col+=(hash(gl_FragCoord.xy)-.5)*.05;
 gl_FragColor=vec4(finish(col*(1.-.3*length(uv))),1.);`),
'wire-ribbons':main(`vec2 p=rot(-.4)*frag()*uScale*.78;float t=uTime*.22;float x=p.x*1.5;
 float cen=.2*sin(x*.9+t*.8+uSeed)+.09*sin(x*2.3-t*1.1);
 float W=.06+.26*pow(.5+.5*sin(x*1.05+t*.9),1.4)*(.6+uAmount*.8);vec3 col=uC0;
 for(int i=0;i<44;i++){float f=float(i)/43.;float ph=f*6.28318;float off=W*sin(ph+x*1.1+t*.8)*(.8+.2*sin(x*3.+f*9.));
  float d=abs(p.y-(cen+off));vec3 wc=ramp(.2+.8*(.5+.5*sin(ph+x*.7)));
  col+=wc*exp(-d*260.)*.42+uC2*exp(-d*26.)*.016;}
 col+=uC3*exp(-abs(p.y-cen)*12.)*(W*.8)*.5;
 gl_FragColor=vec4(finish(col),1.);`),
'starfield-warp':main(`vec2 p=frag();float r=length(p),a=atan(p.y,p.x)+3.14159;vec3 col=uC0*(.6+.5*exp(-r*2.));
 for(int L=0;L<3;L++){float fl=float(L);float N=48.+fl*30.;float sa=a/6.28318*N;float sidx=floor(sa),fa=fract(sa);
  float h=hash(vec2(sidx,fl+uSeed)),h2=hash(vec2(sidx,fl+9.));float off=.2+.6*hash(vec2(sidx,fl+4.));
  float z=fract(uTime*(.16+.08*fl)*uScale+h);float rr=z*z*1.05,len=(.05+.35*z)*(.4+uAmount*1.2);
  float da=(fa-off)*(6.28318/N)*r;float tt=(rr-r)/len;float inside=step(0.,tt)*step(tt,1.);
  float w=.0012+.0035*z;float core=exp(-pow(da/w,2.))*(1.-tt)*inside;
  col+=mix(uC2,uC3,h2)*core*(.5+z*2.2)*step(.15,h)*smoothstep(.02,.12,r);}
 gl_FragColor=vec4(finish(col),1.);`),
'fireflies':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y);vec3 col=mix(uC0,uC1*.5,pow(1.-uv.y,2.));
 for(int i=0;i<3;i++){float k=float(i);float sc=(4.+k*3.)*uScale;vec2 g=p*sc+k*7.7;vec2 id=floor(g),f=fract(g);
  vec2 h=hash22(id+uSeed);vec2 c=.5+.3*vec2(sin(uTime*(.4+h.x*.6)+h.y*30.),cos(uTime*(.35+h.y*.6)+h.x*30.));
  float d=length(f-c);float blink=pow(.5+.5*sin(uTime*(.8+h.x*1.5)+h.y*40.),3.);float on=step(.35-uAmount*.15,h.x);
  float core=smoothstep(.06,.0,d),glow=exp(-d*(14.-k*2.));col+=ramp(.5+h.y*.5)*(core*1.1+glow*.55)*blink*on*(1.-k*.2);}
 gl_FragColor=vec4(finish(col),1.);`),
'embers-rise':main(`vec2 uv=gl_FragCoord.xy/uRes;vec3 col=mix(uC0,uC1*.7,pow(1.-uv.y,4.)*1.2);
 for(int i=0;i<4;i++){float k=float(i);float sc=(5.+k*5.)*uScale;vec2 p=vec2(uv.x*aspect(),uv.y)*sc;p.y-=uTime*(.5+k*.22);
  p.x+=sin(p.y*.8+uTime*.6+k*3.)*.5*(1.+k*.3);vec2 id=floor(p),f=fract(p)-.5;vec2 o=(hash22(id+k*5.+uSeed)-.5)*.6;
  float d=length(f-o);float fl=.6+.4*sin(uTime*7.+hash(id)*40.);float alive=step(.4-uAmount*.15,hash(id+2.));
  float r=.04+.05*hash(id+3.);col+=mix(uC2,uC3,hash(id+4.))*(smoothstep(r,0.,d)*1.3+exp(-d*18.)*.35)*fl*alive*(1.-.18*k)*(.5+.7*uv.y);}
 col+=uC1*exp(-uv.y*5.)*.25;
 gl_FragColor=vec4(finish(col),1.);`),
'bokeh-lights':main(`vec2 uv=gl_FragCoord.xy/uRes;vec3 col=mix(uC0*.6,uC0,uv.y);
 for(int i=0;i<4;i++){float k=float(i);float sc=(3.+k*2.6)*uScale;vec2 g=vec2(uv.x*aspect(),uv.y)*sc+vec2(k*5.1+uTime*.03*(k+1.),k*2.3);vec2 id=floor(g),f=fract(g)-.5;
  vec2 o=(hash22(id+uSeed)-.5)*.5+.04*vec2(sin(uTime*.4+hash(id)*20.),cos(uTime*.35+hash(id)*17.));float d=length(f-o);
  float r=.16+.2*hash(id+3.);float soft=.05+.12*(1.-k*.2)*(.4+uAmount);float disc=smoothstep(r,r-soft,d);float ring=smoothstep(r-soft*2.,r-soft,d)*smoothstep(r,r-soft*.6,d);
  float on=step(.45,hash(id+9.));col+=ramp(hash(id+5.))*(disc*.32+ring*.3)*on*(1.-k*.15);}
 gl_FragColor=vec4(finish(col),1.);`),
'lens-flare':main(`vec2 uv=frag();vec2 sun=(uPointer-.5)*vec2(aspect(),1.)*.9;sun=mix(sun,vec2(.35*sin(uTime*.25),.18*cos(uTime*.31)),step(length(uPointer-.5),.001));
 vec2 d=uv-sun;float r=length(d);vec3 col=mix(uC0,uC0*1.8,smoothstep(.8,0.,length(uv)));
 col+=uC2*exp(-r*7.)*.9+uC3*exp(-r*38.)*1.4;
 float streak=exp(-abs(d.y)*(60.-uAmount*30.))*exp(-abs(d.x)*1.8);col+=uC1*streak*.8+uC3*streak*streak*.5;
 for(int i=0;i<5;i++){float k=float(i)+1.;vec2 gp=sun-sun*(k*.55-.1)*vec2(1.,1.);float gr=.05+.03*k;float gd=length(uv-gp);
  col+=ramp(k*.2)*(smoothstep(gr,gr*.7,gd)*.14+smoothstep(gr*1.05,gr*.92,gd)*smoothstep(gr*.8,gr*1.05,gd)*.1);}
 col+=uC1*smoothstep(.012,0.,abs(r-.32))*.25;
 gl_FragColor=vec4(finish(col),1.);`),
'dust-motes':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y);vec2 q=rot(.55)*(uv-vec2(.2,1.05));
 float shaft=exp(-pow((q.x+.0)*3.4,2.))*smoothstep(-.1,.5,-q.y+.9)*(.7+.3*fbm(vec2(q.x*5.,q.y*2.-uTime*.05)));
 vec3 col=mix(uC0*.7,uC0,uv.y)+uC1*shaft*.85*(.6+uAmount);
 for(int i=0;i<3;i++){float k=float(i);float sc=(10.+k*8.)*uScale;vec2 g=p*sc+vec2(uTime*.05*(k+1.),-uTime*.04*(k+1.))+k*3.3;vec2 id=floor(g),f=fract(g)-.5;
  vec2 o=(hash22(id+uSeed)-.5)*.6+.1*vec2(sin(uTime*.6+hash(id)*20.),cos(uTime*.5+hash(id)*20.));float d=length(f-o);
  float tw=.4+.6*pow(.5+.5*sin(uTime*(.7+hash(id)*1.6)+hash(id+1.)*30.),2.);float lightHere=exp(-pow(q.x*3.2,2.))*.9+.12;
  col+=uC3*smoothstep(.06,0.,d)*tw*lightHere*step(.4,hash(id+4.))*(1.-k*.2);}
 gl_FragColor=vec4(finish(col),1.);`),
'glitter-sparkle':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 c=gl_FragCoord.xy/max(2.,floor(uRes.y/320.)*1.);vec2 id=floor(c);float h=hash(id+uSeed);
 vec2 lp=vec2(.5+.4*sin(uTime*.2),.5+.25*cos(uTime*.27))+(uPointer-.5)*.3;float lit=exp(-length((uv-lp)*vec2(aspect(),1.))*2.2);
 float flake=step(.82-uAmount*.1,h)*pow(max(0.,sin(uTime*(1.5+h*3.)+h*80.)),14.);
 vec3 base=mix(uC0*.6,uC1*.7,uv.y*.6+.2*fbm(uv*4.));vec3 col=base+uC2*lit*.18+uC3*flake*(.35+lit*1.8)*(.6+.4*hash(id+5.));
 gl_FragColor=vec4(finish(col),1.);`),
'confetti-fall':main(`vec2 uv=gl_FragCoord.xy/uRes;vec3 col=mix(uC0,uC0*1.6,uv.y);
 for(int i=0;i<3;i++){float k=float(i);float sc=(6.+k*5.)*uScale;vec2 p=vec2(uv.x*aspect(),uv.y)*sc;p.y+=uTime*(.6+k*.25)+k*3.;
  vec2 id=floor(p),f=fract(p)-.5;vec2 o=(hash22(id+k*9.+uSeed)-.5)*.4;f-=o;
  float ang=hash(id)*6.28+uTime*(1.5+hash(id+1.)*3.);f=rot(ang)*f;f.y*=1./max(.15,abs(cos(uTime*(1.+hash(id+2.)*2.)+hash(id)*20.)));
  float m=smoothstep(.01,0.,rect(f,vec2(.17,.09)));float on=step(.4-uAmount*.15,hash(id+3.));
  col=mix(col,ramp(hash(id+7.))*(.8+.4*hash(id+8.)),m*on*(1.-k*.12));}
 gl_FragColor=vec4(finish(col),1.);`),
'neon-ribbons':main(`vec2 p=frag()*uScale;float t=uTime*.4;vec3 col=uC0;
 for(int i=0;i<4;i++){float k=float(i);float x=p.x*(1.4+.25*k);float y=.2*sin(x*1.2+t*(.8+.2*k)+k*1.7+uSeed)+.12*sin(x*2.6-t*1.1+k*2.)+(k-1.5)*.1;
  float d=abs(p.y-y);float taper=.6+.4*sin(x*1.5+k*2.+t);vec3 c=ramp(k/3.);
  col+=c*exp(-d*(20.-uAmount*8.))*.22*taper+c*exp(-d*95.)*.7*taper+vec3(1.)*exp(-d*340.)*.55*taper;}
 gl_FragColor=vec4(finish(col),1.);`),
'marble-veins':main(`vec2 p=frag()*2.2*uScale;float t=uTime*.03;
 float w=fbm(p*1.1+vec2(t,-t))*3.2+fbm(p*2.4-t)*1.2;float vein=1.-abs(sin((p.x*.9+p.y*.6+w*(1.4+uAmount))*2.));
 float thin=pow(max(vein,0.),11.),soft=pow(max(vein,0.),3.);
 vec3 base=mix(uC0,uC1,fbm(p*3.)*1.2);vec3 col=base*(.88+.2*fbm(p*7.))+uC2*soft*.28+uC3*thin*.6;
 col+=(.5-hash(gl_FragCoord.xy))*.012;
 gl_FragColor=vec4(finish(col),1.);`),
'liquid-gold':withHelpers(`float gh(vec2 p,float t){p+=vec2(sin(p.y*1.3+t),cos(p.x*1.1-t*.8))*.6;p+=vec2(sin(p.y*2.1-t*.7),cos(p.x*1.9+t))*.3;return .5+.5*(sin(p.x*1.6)+sin(p.y*1.9+p.x*.7)+sin((p.x-p.y)*1.1))/3.;}`,
 `vec2 p=frag()*2.6*uScale;float t=uTime*.3;float e=.015;float h=gh(p,t);
 vec2 gr=vec2(gh(p+vec2(e,0.),t)-gh(p-vec2(e,0.),t),gh(p+vec2(0.,e),t)-gh(p-vec2(0.,e),t))/(2.*e);
 vec3 n=normalize(vec3(-gr*(.6+uAmount*1.1),1.));vec3 l=normalize(vec3(-.4,.6,.7));
 float diff=max(dot(n,l),0.);float spec=pow(max(reflect(-l,n).z,0.),28.);float env=.5+.5*n.x*1.6+.2*n.y;
 vec3 col=ramp(clamp(env*.7+diff*.5-.12,0.,1.))*(.25+.9*diff)+uC3*spec*.8+uC2*pow(1.-n.z,2.)*.5;col=pow(col,vec3(1.15));
 gl_FragColor=vec4(finish(col),1.);`),
'holo-foil':main(`vec2 p=frag()*1.6*uScale;float t=uTime*.12;float w=fbm(p*.9+vec2(t,-t*.8));
 float ph=w*(1.6+uAmount*2.)+p.x*.45+p.y*.3+t*.8;vec3 rain=.5+.5*cos(6.28318*(ph+vec3(0.,.33,.67)));
 vec3 base=mix(uC0,uC1,.5+.5*sin(p.x*1.6+t));float band=.5+.5*sin(ph*9.);
 vec3 col=mix(base,rain,.5)*(.65+.35*band)+uC3*pow(.5+.5*sin(ph*5.),10.)*.35;
 col*=.8+.25*fbm(p*3.);
 gl_FragColor=vec4(finish(col),1.);`),
 'pearl-sheen':main(`vec2 p=frag()*1.8*uScale;float t=uTime*.1;
 vec2 q=p+vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t))*(.9+uAmount*.7);float v=fbm(q*1.3+t);
 vec3 col=ramp(.15+.85*smoothstep(.2,.85,v));float sheen=pow(.5+.5*sin(v*14.+p.x*2.),3.);col=mix(col,uC3,sheen*.22);
 col*=.92;
 gl_FragColor=vec4(finish(col),1.);`),
'brushed-metal':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();
 float grain=noise(vec2(uv.x*asp*3.,uv.y*(380.*uScale)))*.6+noise(vec2(uv.x*asp*14.,uv.y*(900.*uScale)))*.4;
 float hx=.5+.45*sin(uTime*.25)+(uPointer.x-.5)*.3;float beam=exp(-pow((uv.x-hx)*asp*2.3,2.));float beam2=exp(-pow((uv.x-(1.-hx))*asp*3.4,2.))*.5;
 float base=.45+.2*sin(uv.x*3.+uSeed)*.5+.15*uv.y;
 vec3 col=mix(uC0,uC1,base)*(.8+.35*grain)+uC2*beam*(.55+.6*grain)*(.5+uAmount)+uC3*beam2*.35*grain;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['glow-glyphs','Glow Glyphs','Live light & particles','Purple','Soft gradient glows drawn in characters that scramble under your pointer.',['ascii','glyphs','glow','interactive'],['#05030c','#4a2bd9','#b56bff','#ffe6ff'],.9,1,.55,'Glow strength'],
 ['gloss-tiles','Gloss Tiles','Live light & particles','Blue','A rolling field of glossy tiles rippling under two drifting coloured lights.',['tiles','gloss','lights','3d'],['#090a14','#2f5bff','#ff3fa4','#ffffff'],.9,1,.5,'Ripple depth'],
 ['wire-ribbons','Wire Ribbons','Live light & particles','Purple','A twisting ribbon of fine glowing wires that pinch and fan out.',['ribbon','wires','lines','glow'],['#05030b','#7a3fff','#a855ff','#ffd8ff'],.9,1,.5,'Ribbon width'],
 ['starfield-warp','Starfield Warp','Live light & particles','Blue','Stars streaking past as you fly through space.',['stars','warp','space','speed'],['#02030a','#0e1a4a','#8fc3ff','#ffffff'],1,1,.5,'Streak length'],
 ['fireflies','Fireflies','Live light & particles','Green','Fireflies blinking and drifting over a summer night.',['fireflies','night','glow','nature'],['#030a08','#0b2a1f','#c8ff5a','#fff9a8'],.9,1,.5,'Number'],
 ['embers-rise','Embers Rise','Live light & particles','Orange','Glowing embers lifting off a fire into the dark.',['embers','fire','sparks'],['#080302','#7a1f06','#ff7a1a','#ffd37a'],1,1,.5,'Number'],
 ['bokeh-lights','Bokeh Lights','Live light & particles','Pink','Out-of-focus lights in layers, softly drifting.',['bokeh','lights','night','blur'],['#0c0716','#ff4fa8','#7a6bff','#ffcf5a'],.8,1,.5,'Softness'],
 ['lens-flare','Lens Flare','Live light & particles','Blue','An anamorphic lens flare that follows your pointer.',['flare','light','anamorphic','interactive'],['#02040c','#3a7bff','#7fc8ff','#ffffff'],.9,1,.5,'Streak'],
 ['dust-motes','Dust Motes','Live light & particles','Neutral','Dust turning in a shaft of window light.',['dust','light shaft','calm'],['#0a0b0f','#ffd9a0','#2a3240','#fff3d6'],.8,1,.5,'Light strength'],
 ['glitter-sparkle','Glitter Sparkle','Live light & particles','Purple','Fine glitter catching a moving light.',['glitter','sparkle','luxe'],['#0b0618','#3a1f7a','#9a6bff','#ffffff'],1,1,.5,'Sparkle'],
 ['confetti-fall','Confetti Fall','Live light & particles','Pink','Tumbling confetti falling in layers.',['confetti','party','celebration'],['#150c2c','#ff4f8a','#ffd84a','#3fe0ff'],.9,1,.5,'Amount'],
 ['neon-ribbons','Neon Ribbons','Live light & particles','Pink','Glowing neon ribbons weaving across the screen.',['neon','ribbons','glow'],['#040208','#ff2fa4','#2fe0ff','#a855ff'],.9,1,.5,'Glow'],
 ['marble-veins','Marble Veins','Live materials','Neutral','Polished marble with fine gold veins that slowly shift.',['marble','stone','luxe','gold'],['#f2efe8','#cdc6b8','#8a8374','#c9a24a'],.7,1,.5,'Vein flow'],
 ['liquid-gold','Liquid Gold','Live materials','Orange','Molten gold flowing in slow, glossy folds.',['gold','metal','liquid','luxe'],['#2a1704','#8a5a12','#e8b84a','#fff2c0'],.8,1,.5,'Relief'],
 ['holo-foil','Holo Foil','Live materials','Purple','Holographic foil shimmering through the spectrum.',['holographic','foil','rainbow'],['#14102a','#6a5ad8','#a8e0ff','#ffffff'],.8,1,.5,'Rainbow spread'],
 ['pearl-sheen','Pearl Sheen','Live materials','Pink','Soft pearlescent swirls in pastel light.',['pearl','pastel','soft'],['#e3b6ee','#a9bdf5','#ffcdb8','#fff7ff'],.7,1,.5,'Swirl'],
 ['brushed-metal','Brushed Metal','Live materials','Neutral','Fine brushed steel catching a moving highlight.',['metal','steel','brushed','industrial'],['#15171b','#3b4048','#aeb6c2','#ffffff'],.8,1,.5,'Highlight']
];
