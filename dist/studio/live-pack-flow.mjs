// Original live backgrounds: ribbons, glass, fluid and light. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'grain-ribbon':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float x=uv.x*asp*uScale;float t=uTime*.4;
 float c=.5+.11*sin(x*1.6+t)+.06*sin(x*3.7-t*1.3+uSeed);float w=.1+.08*(.5+.5*sin(x*2.1+t*.8))*(.6+uAmount*.9);
 float d=(uv.y-c)/w;vec3 col=uC0;vec3 chan=vec3(0.);
 float n=hash(gl_FragCoord.xy+fract(uTime*7.));
 float dr=1.-smoothstep(.0,1.,abs(d-.16)),dg=1.-smoothstep(.0,1.,abs(d)),db=1.-smoothstep(.0,1.,abs(d+.16));
 dr=pow(dr,1.4);dg=pow(dg,1.4);db=pow(db,1.4);chan=vec3(smoothstep(n-.06,n+.06,dr)*step(.004,dr),smoothstep(n-.06,n+.06,dg)*step(.004,dg),smoothstep(n-.06,n+.06,db)*step(.004,db));
 col+=vec3(uC1.r*chan.r+uC3.r*chan.g*chan.g,uC2.g*chan.g+uC3.g*chan.g*chan.g*.5,uC1.b*chan.b+uC3.b*chan.g*chan.g*.5);
 col+=uC2*exp(-abs(d)*1.8)*.05;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);`),
'lone-wave':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float x=uv.x*asp*uScale;float t=uTime*.4;
 float crest=.42+.13*sin(x*1.7+t)+.05*sin(x*4.1-t*1.4+uSeed)*(.5+uAmount);float d=uv.y-crest;
 float body=smoothstep(.004,-.004,d);float depth=clamp(-d*2.4,0.,1.);
 vec3 col=uC0+ramp(.25+.55*(1.-depth))*body*(.25+.9*pow(1.-depth,1.6))+uC3*exp(-abs(d)*55.)*.85+uC2*exp(-abs(d)*9.)*.18*(d>0.?1.:.5);
 float echo=crest+.035+.01*sin(x*5.+t);col+=uC2*exp(-abs(uv.y-echo)*180.)*.22;
 col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.05*(body+.3);
 gl_FragColor=vec4(finish(col),1.);`),
'fluted-glass':withHelpers(`vec3 sceneCol(vec2 q,float t){float n=fbm(q*1.7+vec2(t,-t*.7)+uSeed);float m=.5+.5*sin(q.x*2.6+n*5.+t*.8);vec3 c=ramp(clamp(.12+.8*m,0.,1.));c+=uC3*pow(max(0.,sin(q.y*3.+n*4.-t)),8.)*.6;return c*(.55+.7*n);}`,
 `vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float N=floor(15.*uScale);float xs=uv.x*asp;float cw=asp/N;float id=floor(xs/cw),fx=(xs/cw-id)-.5;
 float cx=(id+.5)*cw;float lens=-fx*cw*(1.6+uAmount*1.4);vec2 q=vec2(cx+lens,uv.y)*vec2(1.,1.);
 vec3 col=sceneCol(q*1.2,uTime*.25);
 float edge=smoothstep(.5,.42,abs(fx));col*=.55+.45*edge;col+=uC3*pow(max(0.,1.-abs(fx+.28)*7.),3.)*.22+vec3(.1)*pow(max(0.,1.-abs(fx-.3)*9.),3.)*.15;
 col*=1.-.35*smoothstep(.4,.5,abs(fx));
 gl_FragColor=vec4(finish(col),1.);`),
'flame-tongues':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=uC0;float t=uTime;
 for(int i=0;i<7;i++){float k=float(i);float cx=(.12+.76*(k+.5*hash(vec2(k,uSeed)))/7.)*asp;float hgt=.5+.45*hash(vec2(k,3.));
  float y=uv.y;float wob=(fbm(vec2(y*3.5+k*5.,t*.6+k))-.5)*.2*smoothstep(0.,1.,y);float flick=.8+.2*sin(t*(2.+k*.5)+k*9.);
  float w=.1*pow(max(1.-y/hgt,0.),.85)*(.8+uAmount*.7);float d=abs(uv.x*asp/asp*asp-cx-wob);float shape=exp(-pow(d/(w+.002),2.))*smoothstep(hgt,hgt*.5,y)*smoothstep(-.05,.08,y);
  float core=exp(-pow(d/(w*.45+.002),2.))*smoothstep(hgt*.7,0.,y);
  vec3 fc=mix(uC1,uC2,clamp(y/hgt,0.,1.));col+=fc*shape*flick*1.7+uC3*core*flick*.9;col+=uC1*exp(-d*7.)*.05*smoothstep(hgt,0.,y);}
 gl_FragColor=vec4(finish(col),1.);`),
'glue-dots':main(`float cs=max(18.,floor(uRes.y/12./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g);float t=uTime*.5;
 vec2 a1=vec2(.5+.35*sin(t*.7),.5+.3*cos(t*.9))*uRes/cs,a2=vec2(.5+.3*cos(t*.6+2.),.5+.28*sin(t*.8+1.))*uRes/cs,a3=uPointer*uRes/cs;float field=0.;
 for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 c=id+vec2(float(i),float(j))+.5;vec2 off=vec2(0.);
  vec2 d1=a1-c,d2=a2-c,d3=a3-c;float l1=length(d1),l2=length(d2),l3=length(d3);
  off+=normalize(d1+1e-4)*min(l1,2.2)*.42*exp(-l1*.28)*(.5+uAmount)+normalize(d2+1e-4)*min(l2,2.2)*.42*exp(-l2*.28)*(.5+uAmount)+normalize(d3+1e-4)*min(l3,2.4)*.5*exp(-l3*.25)*step(.001,length(uPointer-.5));
  vec2 pos=c+off;float dd=length(g-pos);float r=.24;field+=exp(-pow(dd/r,2.)*1.4);}}
 float m=smoothstep(.55,.62,field);vec3 col=uC0+mix(uC1,uC3,smoothstep(.6,1.4,field))*m+uC2*exp(-pow(max(field,0.),.7)*0.)*smoothstep(.12,.55,field)*.35*(1.-m);
 gl_FragColor=vec4(finish(col),1.);`),
'dot-current':main(`float cs=max(8.,floor(uRes.y/46./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 id=floor(g),f=fract(g)-.5;vec2 p=((id+.5)*cs-.5*uRes)/uRes.y;float t=uTime*.4;
 float band=p.y*5.5+(fbm(vec2(p.x*1.6,t*.5)+uSeed)-.5)*(3.+uAmount*3.)+sin(p.x*2.+t)*.5;float v=.5+.5*sin(band*3.14159+t*.6);v=pow(v,1.6);
 float r=.46*sqrt(v)+.04;float dm=smoothstep(r,r-.14,length(f));vec3 col=uC0+ramp(.2+.8*v)*dm*(.6+.7*v)+uC3*dm*pow(v,6.)*.4;
 gl_FragColor=vec4(finish(col),1.);`),
'neon-stripes':main(`vec2 p=frag();vec2 m=(uPointer-.5)*vec2(aspect(),1.);m=mix(m,vec2(.4*sin(uTime*.4),.2*cos(uTime*.5)),step(length(uPointer-.5),.001));
 vec2 d=p-m;float bend=exp(-dot(d,d)*5.)*(.45+uAmount*.5);vec2 q=p+d*bend*1.1;
 float N=9.*uScale;float s=(q.x*.7071+q.y*.7071)*N;float id=floor(s),fs=fract(s)-.5;float h=hash(vec2(id,uSeed));
 float tube=exp(-pow(fs/.045,2.));float halo=exp(-pow(fs/.22,2.));vec3 tc=ramp(clamp(.15+.85*abs(sin((id+uTime*.2)*.45)),0.,1.));
 vec3 col=uC0+tc*(tube*1.3*(.6+.4*sin(uTime*1.3+id))+halo*.28)+uC3*tube*tube*.7;
 gl_FragColor=vec4(finish(col),1.);`),
'pinch-arcs':main(`vec2 p=frag()*uScale;float t=uTime;vec3 col=uC0;float ax=abs(p.x);float prof=.012+.62*pow(ax,1.7);
 for(int i=0;i<30;i++){float k=float(i)/29.;float kk=k*2.-1.;float yy=kk*prof*(1.+.08*sin(p.x*5.+t*.8+k*8.));
  float d=abs(abs(p.y)-abs(yy));float pulse=.5+.5*sin(p.x*8.-t*2.5+k*10.);float wgt=.35+.65*pulse;
  col+=ramp(.15+.8*abs(kk))*exp(-d*(240.))*wgt*(.45+uAmount*.5)*smoothstep(.95,.1,ax);}
 col+=uC3*exp(-abs(p.y)*38.)*exp(-ax*3.6)*1.1+uC2*exp(-abs(p.y)*7.)*exp(-ax*1.8)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'window-light':withHelpers(`float leaf(vec2 p,vec2 c,float a,float s){vec2 q=rot(a)*(p-c);q.x/=s*1.25;q.y/=s*.5;return smoothstep(1.,.78,length(q)*max(1.+.25*q.x,.4));}`,
 `vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=(uv-.5)*vec2(asp,1.);float t=uTime*.4;vec2 w=rot(.12)*(p-vec2(.08,.04));
 float frame=rect(w,vec2(.34,.4));float mull=min(abs(w.x),abs(w.y))-.018;float pane=smoothstep(.03,-.01,max(frame,-mull));
 float sh=0.;for(int i=0;i<12;i++){float k=float(i)/11.;float sway=sin(t*1.1+k*5.)*.03+sin(t*.5)*.02;
  vec2 c=vec2(-.42+.7*k+sway*.5,.5-.55*k*k-.12*k+sway*.3)+vec2(sin(k*30.+uSeed)*.04,cos(k*20.)*.04);
  sh=max(sh,leaf(p,c,.6+sin(t+k*4.)*.3+k*.9,.07+.03*sin(k*9.)));
  vec2 c2=c+vec2(.06,-.07);sh=max(sh,leaf(p,c2,-.5+sin(t*1.2+k*3.)*.25-k*.7,.06));}
 vec3 light=mix(uC1,uC2,.4+.6*pane)*pane;float lit=pane*(1.-sh*.9);
 vec3 col=uC0+uC1*.0+mix(uC1,uC3,.5)*lit*(1.05)+uC2*exp(-max(frame,0.)*6.)*.15*(1.-sh*.6)+uC3*pane*pow(lit,2.)*.15;
 col*=.8+.2*fbm(p*6.+uSeed);
 gl_FragColor=vec4(finish(col),1.);`),
'rubber-folds':main(`vec2 p=frag()*2.1*uScale;float t=uTime*.25;
 vec2 q=p;for(int i=0;i<3;i++){float f=float(i)+1.;q+=vec2(sin(q.y*1.4*f+t*f*.8+uSeed),cos(q.x*1.2*f-t*f*.6))*.5/f;}
 float h=.5+.5*sin(q.x*1.9+sin(q.y*1.6+t)*1.4);float h2=.5+.5*sin(q.y*2.3+sin(q.x*1.3-t)*1.2);float H=pow(h*h2,.8)*1.4+.3*fbm(q*2.);
 float e=.03;float hx=.5+.5*sin((q.x+e)*1.9+sin(q.y*1.6+t)*1.4),hy=.5+.5*sin(q.x*1.9+sin((q.y+e)*1.6+t)*1.4);
 vec3 n=normalize(vec3(-(hx-h)*8.*(.5+uAmount),-(hy-h)*8.*(.5+uAmount),1.));vec3 L=normalize(vec3(-.5,.7,.6));
 float diff=max(dot(n,L),0.),spec=pow(max(reflect(-L,n).z,0.),24.),rim=pow(1.-n.z,2.);
 vec3 col=ramp(clamp(H*.8,0.,1.))*(.35+.8*diff)+uC3*spec*1.1+uC2*rim*.6;
 gl_FragColor=vec4(finish(col),1.);`),
'silk-swirl':main(`vec2 p=frag()*uScale;float t=uTime*.3;float r=length(p);vec2 q=rot(r*(3.+uAmount*2.)-t)*p;
 for(int i=0;i<3;i++){float f=float(i)+1.;q+=vec2(sin(q.y*2.*f+t*f+uSeed),cos(q.x*2.*f-t*f))*.35/f;}
 float v=.5+.5*sin(q.x*3.+q.y*2.+t);float v2=.5+.5*sin(length(q)*4.-t*1.5);
 vec3 col=ramp(clamp(.15+.45*v+.4*v2,0.,1.));col*=.6+.5*pow(v2,2.);col+=uC3*pow(v*v2,6.)*.5;col*=1.-.25*r;
 gl_FragColor=vec4(finish(col),1.);`),
'watercolor-bleed':main(`vec2 p=frag()*2.*uScale;float t=uTime*.05;
 vec2 w=vec2(fbm(p*1.1+t+uSeed),fbm(p*1.1+vec2(4.,2.)-t));float f=fbm(p*1.3+w*2.2);float f2=fbm(p*2.6-w*1.4+t);
 float m=smoothstep(.44,.56,f);float edge=smoothstep(.1,.0,abs(f-.5))*(.25+.35*uAmount);float edge2=smoothstep(.08,.0,abs(f2-.55))*.12;
 vec3 paper=uC0;vec3 pigA=uC1,pigB=uC2;vec3 pig=mix(pigA,pigB,m);float dens=(.45+.5*fbm(p*3.+7.))*(.6+.4*smoothstep(.2,.8,f2));
 vec3 col=mix(paper,pig,dens*.85);col=mix(col,col*.72,edge+edge2);col=mix(col,uC3,smoothstep(.75,.95,fbm(p*1.7+3.))*.4);
 float grain=hash(floor(gl_FragCoord.xy/1.5)+uSeed);col*=.94+.08*grain+.05*fbm(gl_FragCoord.xy*.04);
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['grain-ribbon','Grain Ribbon','Live light & particles','Pink','A grainy ribbon of colour waving through the dark, with red and blue fringes.',['grain','ribbon','chromatic','dither'],['#050308','#ff3f6a','#ffffff','#ffd6e8'],.9,1,.5,'Ribbon width'],
 ['lone-wave','Lone Wave','Live nature','Blue','A single glowing wave rolling across the dark, with a faint echo above its crest.',['wave','glow','minimal'],['#04050d','#2a3fd8','#8a9bff','#ffffff'],.9,1,.5,'Wave size'],
 ['fluted-glass','Fluted Glass','Live materials','Purple','Colour refracted through vertical fluted glass, each flute flipping the scene behind it.',['glass','fluted','refraction','abstract'],['#0a0620','#5a2fe0','#ff4fa8','#ffe08a'],.8,1,.5,'Refraction'],
 ['flame-tongues','Flame Tongues','Live light & particles','Pink','Tall neon flames gusting and flaring against the dark.',['flames','neon','fire'],['#050206','#c4146a','#ff6a2a','#fff0d8'],1,1,.5,'Flame width'],
 ['glue-dots','Glue Dots','Live patterns','Neutral','A grid of dots that drift together, stick and stretch apart like glue.',['dots','metaballs','interactive'],['#06070a','#e8ecf4','#ffffff','#7a8aff'],.9,1,.5,'Pull'],
 ['dot-current','Dot Current','Live patterns','Purple','Currents of colour flowing through a grid of glowing dots.',['dots','current','grid','flow'],['#06040e','#4a2fc4','#c070ff','#ffe0ff'],.9,1,.5,'Wobble'],
 ['neon-stripes','Neon Stripes','Live light & particles','Pink','Diagonal neon tubes that bend away from your pointer.',['neon','stripes','tubes','interactive'],['#05030a','#3f6bff','#ff3fb4','#ffffff'],.9,1,.5,'Bend'],
 ['pinch-arcs','Pinch Arcs','Live geometric','Purple','Fine glowing lines pinching into a bright horizontal waist, like light through an hourglass.',['lines','hourglass','symmetry','glow'],['#04030a','#6a4fe0','#c8a0ff','#fff0ff'],.9,1,.5,'Line brightness'],
 ['window-light','Window Light','Live nature','Orange','Warm light through a window, broken by the shadows of swaying leaves.',['window','leaves','shadow','sunlight'],['#0a0806','#ffb45a','#ffd9a0','#fff6dc'],.8,1,.5,'Light'],
 ['rubber-folds','Rubber Folds','Live materials','Pink','Glossy rubber folds of colour drifting slowly.',['rubber','folds','gloss','soft'],['#1a0626','#c0207a','#ff7ac0','#fff0f8'],.8,1,.5,'Fold depth'],
 ['silk-swirl','Silk Swirl','Live materials','Purple','Vivid colour swirling and blending like silk.',['silk','swirl','vivid','colour'],['#12062a','#7a2fff','#ff4f9a','#ffd24a'],.8,1,.5,'Twist'],
 ['watercolor-bleed','Watercolour Bleed','Live nature','Blue','Two pigments bleeding into each other on textured paper.',['watercolour','paper','pigment','soft'],['#f4efe6','#2f7a9a','#d86a8a','#ffe6a8'],.7,1,.5,'Edge pooling']
];
