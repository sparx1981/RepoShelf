// Original live backgrounds: five feature effects. Written for RepoShelf from visual study of public demos; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
export const shaders={
'light-slices':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float n=floor(30.*uScale);float xs=uv.x*n;float id=floor(xs),fx=fract(xs)-.5;float u=(id+.5)/n;float t=uTime*.45;
 float px=uPointer.x;float focus=abs(u-px);
 float depth=.5+.5*sin(u*4.2+t*.9+uSeed);float hgt=(.09+.24*(.5+.5*sin(u*5.+t*1.3)))*(.55+uAmount*.9)*(.35+.85*depth);
 float m=.46+.07*sin(u*3.+t*.8)+.04*sin(u*8.-t*1.7);float gap=.03;
 float cell=asp/n;float w=cell*.1;float soft=.003+focus*.03;
 float dx=abs(fx)*cell;
 float topLo=m+gap,topHi=m+gap+hgt,botHi=m-gap,botLo=m-gap-hgt*.85;
 float dyT=max(max(topLo-uv.y,uv.y-topHi),0.),dyB=max(max(botLo-uv.y,uv.y-botHi),0.);
 float dT=length(vec2(max(dx-w,0.),dyT)),dB=length(vec2(max(dx-w,0.),dyB));
 float barT=smoothstep(soft+.004,0.,dT),barB=smoothstep(soft+.004,0.,dB);
 float vT=clamp((uv.y-topLo)/max(hgt,.001),0.,1.),vB=clamp((botHi-uv.y)/max(hgt*.85,.001),0.,1.);
 vec3 cT=mix(uC1,uC3,pow(1.-vT,1.6)*.9+.05)*(.9+.5*depth);vec3 cB=mix(uC2,uC3*.9,pow(vB,1.4)*.55)*(.8+.4*depth);
 vec3 col=uC0+cT*barT*1.25+cB*barB*1.05;
 col+=uC1*exp(-dT*(26.-focus*14.))*.32+uC2*exp(-dB*(26.-focus*14.))*.28;
 col+=uC3*exp(-abs(uv.y-m)*40.)*smoothstep(0.,.5,hgt)*.03;
 col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.05;
 gl_FragColor=vec4(finish(col),1.);`),
'glossy-squares':withHelpers(`float hgt(vec2 c,float t){return sin(c.x*.5+t)*.9+sin(c.y*.6-t*1.2)*.7+sin((c.x+c.y)*.35+t*.7)*.5;}`,
 `vec2 q=frag();float t=uTime*.55;float z=1.5/(.6+(q.y+.5)*.8);vec2 g=vec2(q.x*z*2.6,z*2.6)*uScale;
 g+=vec2(sin(g.y*.55+t)+.5*sin(g.y*1.1-t*.7),cos(g.x*.45-t*1.1)+.5*cos(g.x*.9+t*.6))*.55*(.5+uAmount);
 vec2 id=floor(g),f=fract(g)-.5;vec2 c=id+.5;float k=(.2+uAmount*.5);
 float hx=hgt(c+vec2(1.,0.),t)-hgt(c-vec2(1.,0.),t),hy=hgt(c+vec2(0.,1.),t)-hgt(c-vec2(0.,1.),t);
 float e=.5-max(abs(f.x),abs(f.y));float bev=smoothstep(.16,.0,e);vec2 dirn=abs(f.x)>abs(f.y)?vec2(sign(f.x),0.):vec2(0.,sign(f.y));
 vec3 n=normalize(vec3(-hx*k*.35+dirn.x*bev*1.1+f.x*.35,-hy*k*.35+dirn.y*bev*1.1+f.y*.35,1.));
 vec3 L1=normalize(vec3(-.9+.5*sin(t*.5),-.35,.6)),L2=normalize(vec3(.9-.5*cos(t*.45),.55,.6));vec3 V=vec3(0.,0.,1.);
 float d1=max(dot(n,L1),0.),d2=max(dot(n,L2),0.);float s1=pow(max(dot(reflect(-L1,n),V),0.),18.),s2=pow(max(dot(reflect(-L2,n),V),0.),18.);
 float rim1=pow(max(dot(normalize(L1+V),n),0.),6.),rim2=pow(max(dot(normalize(L2+V),n),0.),6.);
 vec3 col=uC0*(.5+.3*hash(id))+uC1*(d1*.55+rim1*.35+s1*.8)+uC2*(d2*.55+rim2*.35+s2*.8);
 col*=smoothstep(.0,.05,e);col*=.4+.45*smoothstep(.0,.9,.5+q.y);col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.07;
 gl_FragColor=vec4(finish(col),1.);`),
'scan-lines':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);float t=uTime*.5;
 vec2 m=(uPointer-.5)*vec2(asp,1.);m=mix(m,vec2(.5*sin(t*.4),.15*cos(t*.33)),step(length(uPointer-.5),.001));
 vec2 d=p-m;p+=d*.22*exp(-dot(d,d)*7.);
 float N=13.*uScale;vec3 chan=vec3(0.);
 for(int c=0;c<3;c++){float off=(float(c)-1.)*.0045;float l=(p.y+off)*N+(sin(p.x*2.3+t*.8)*1.8+sin(p.x*4.9-t*1.3)*.7+sin(p.x*1.1+p.y*2.+t*.5)*1.3)*(.55+uAmount*.8);
  float fl=abs(fract(l)-.5)*2.;float line=pow(1.-fl,5.)+.42*pow(1.-fl,1.6);
  float br=.25+.75*pow(.5+.5*sin(p.x*2.6+l*.5-t),2.);float bx=fract(t*.16)*3.-1.5;float boost=1.+2.6*exp(-pow((p.x-bx)*2.4,2.));
  float v=line*br*(.7+.3*boost);if(c==0)chan.r=v;else if(c==1)chan.g=v;else chan.b=v;}
 vec3 col=uC0+vec3(uC1.r*chan.r+uC3.r*chan.r*chan.r*.3,uC1.g*chan.g+uC3.g*chan.g*chan.g*.3,uC1.b*chan.b+uC3.b*chan.b*chan.b*.3)*.85;
 col+=uC2*exp(-pow((p.x-(fract(t*.16)*3.-1.5))*1.6,2.))*.06;
 float scan=.9+.1*sin(gl_FragCoord.y*3.14159);col*=scan;col*=1.-.7*dot(uv-.5,uv-.5)*2.;col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.04;
 gl_FragColor=vec4(finish(col),1.);`),
'falling-light':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float y=uv.y;float t=uTime;
 float px=(uPointer.x-.5);float bend=px*.5*exp(-pow((uv.y-uPointer.y)*2.2,2.));
 float g=.04+1.2*pow(y,.42);float u=((uv.x-.5)*asp-bend)/(g*asp*.62);
 float N=floor(46.*uScale);float lane=floor(u*N+N*.0),fu=fract(u*N)-.5;float h=hash(vec2(lane,uSeed)),h2=hash(vec2(lane,5.));
 float sp=.3+.6*h2;float L=.8+1.3*h;float s=fract(y*.0+(1.-y)*L*.5+t*sp*.5+h*5.);
 float dscr=fu/N*g*asp*.62;float wd=.0016+.0008*h2;float line=smoothstep(wd,0.,abs(dscr))*step(.08,hash(vec2(lane,9.)));
 float tail=pow(1.-s,1.3)*step(s,.98);float head=smoothstep(.03,0.,s)*smoothstep(wd*3.,0.,abs(dscr))*3.;
 float fog=smoothstep(.0,.15,y)*(.5+.5*y);
 vec3 col=mix(uC0*.9,uC0*1.7,y)+uC1*exp(-pow((y-1.1)*2.2,2.))*.22;
 col+=mix(uC2,uC3,h2)*(line*tail*(.7+uAmount)*1.15+head*line)*fog;col+=uC3*smoothstep(.01,0.,abs(dscr))*.015;
 col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.03;
 gl_FragColor=vec4(finish(col),1.);`),
'spectral-prism':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();float y=uv.y;float t=uTime*.25*uScale;vec3 col=uC0*(.8+.5*y);vec3 beams=vec3(0.);
 for(int c=0;c<3;c++){float disp=(float(c)-1.)*.016;float acc=0.;
  for(int k=0;k<3;k++){float ang=t+float(k)*2.0944+uSeed*.1;float ex=.5+.43*sin(ang)*(1.+.5*y);float face=.5+.5*cos(ang);
   float w=(.07+.2*y)*(.8+.5*face);float xo=ex+disp*(1.+2.*y);float b=exp(-pow((uv.x-xo)*asp/(w*asp),2.));
   float vis=smoothstep(.0,.3,y+.1)*smoothstep(1.2,.2,y)*(.35+.9*face);acc+=b*vis*(.7+uAmount*.8);}
  if(c==0)beams.r=acc;else if(c==1)beams.g=acc;else beams.b=acc;}
 vec3 tint=mix(uC1,uC2,smoothstep(.3,.7,uv.x));col+=beams*tint*.62+beams*uC3*.06;
 float floorG=exp(-pow((y-.045)/.026,2.))*1.25+exp(-y*8.)*.42;col+=mix(uC1,uC3,.55)*floorG*(.6+.5*exp(-pow((uv.x-.5)*1.4,2.)));
 col+=uC2*exp(-pow((uv.x-.5)*2.,2.))*exp(-y*3.)*.08;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['light-slices','Light Slices','Live light & particles','Pink','A wave of glowing vertical bars with a mirrored reflection, focusing where your pointer is.',['bars','wave','slices','reflection','interactive'],['#0a0716','#4f6bff','#ff3f8a','#fff0dc'],.9,1,.5,'Wave height'],
 ['glossy-squares','Glossy Squares','Live geometric','Purple','A tilted field of glossy bevelled squares rippling under two coloured lights.',['squares','tiles','gloss','perspective'],['#0b0714','#3d63ff','#ff3fb4','#ffffff'],.9,1,.5,'Ripple depth'],
 ['scan-lines','Scan Lines','Live tech & retro','Purple','Glowing interference lines swept by a scan beam, with a CRT finish and a lens at your pointer.',['scanner','lines','crt','interference','interactive'],['#0a0612','#8a4fc8','#4a2a7a','#ffffff'],.9,1,.5,'Line wobble'],
 ['falling-light','Falling Light','Live light & particles','Neutral','Streaks of light falling down a curved tunnel and bending around your pointer.',['streaks','tunnel','rain','interactive'],['#171925','#aab4c8','#d8e0f0','#ffffff'],.9,1,.5,'Trail length'],
 ['spectral-prism','Spectral Prism','Live light & particles','Blue','Prism light fanning up from a glowing floor, splitting into spectral edges as it turns.',['prism','beams','spectrum','light'],['#0a0910','#3fb8ff','#ffd24a','#ffffff'],.9,1,.5,'Beam strength',6.28]
];
