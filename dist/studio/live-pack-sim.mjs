// Original live backgrounds: simulations of smoke, sand, reaction–diffusion, gas, flocks, ink and dusty light. Written for RepoShelf from
// standard techniques (fbm domain warping, jittered particle grids, banded turbulence); no third-party shader source.
import {main} from './live-prelude.mjs';
export const shaders={
'smoke-plume':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2((uv.x-.5)*aspect(),uv.y)*uScale;float t=uTime*.22;vec2 q=p-vec2(0.,t);
 vec2 w=vec2(fbm(q*2.+vec2(0.,t)),fbm(q*2.+vec2(5.2,1.3)-t));float warp=1.4+uAmount*1.6;float d=fbm(q*3.+w*warp);
 float sway=sin(p.y*2.2+t*2.+uSeed)*.1*p.y+(w.x-.5)*.35*p.y;float width=.06+.34*p.y;float mask=exp(-pow((p.x-sway)/width,2.));
 float dens=smoothstep(.36,.82,d)*mask*smoothstep(1.35,.15,p.y)*smoothstep(-.04,.1,p.y);
 float lit=clamp((d-fbm(q*3.+w*warp+vec2(.05,.07)))*7.+.6,0.,1.);
 vec3 col=mix(uC0,uC0*1.5,uv.y)+uC2*exp(-length(vec2(p.x,p.y+.04))*7.)*.3;col=mix(col,mix(uC1,uC3,lit),clamp(dens*1.7,0.,1.));
 gl_FragColor=vec4(finish(col),1.);`),
'sandstorm':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=vec2(uv.x*asp,uv.y)*uScale;float t=uTime;
 vec3 col=mix(uC2*1.05,uC3,smoothstep(.2,1.,uv.y));float h=.3+.06*sin(p.x*1.3+1.+uSeed)+.05*fbm(vec2(p.x*2.,1.));float dune=smoothstep(h+.004,h-.004,uv.y);
 float ripple=.5+.5*sin(p.x*42.+uv.y*95.+fbm(p*6.)*6.-t*.5);vec3 sand=mix(uC1,mix(uC1,uC0,.45),clamp((h-uv.y)*3.5,0.,1.))*(.8+.2*ripple);col=mix(col,sand,dune);
 float dust=fbm(vec2(p.x*1.4-t*.8,p.y*3.)+fbm(p*2.-vec2(t*.45,0.)));col=mix(col,uC2*1.08,smoothstep(.4,.9,dust)*(.3+uAmount*.45)*(1.-uv.y*.5));
 for(int L=0;L<3;L++){float fl=float(L);float sc=55.+fl*45.;vec2 g=vec2(p.x*sc*.22-t*(5.+fl*4.),uv.y*sc);vec2 id=floor(g),f=fract(g);float on=step(.88-uAmount*.08,hash(id+fl*7.+uSeed));
  float grain=smoothstep(.16,0.,abs(f.y-.5))*smoothstep(0.,.25,f.x)*smoothstep(1.,.55,f.x);col+=uC3*on*grain*(.22+.18*fl)*(1.-uv.y*.45);}
 gl_FragColor=vec4(finish(col),1.);`),
'falling-sand':main(`float cs=max(3.,floor(uRes.y/110./uScale));vec2 g=floor(gl_FragCoord.xy/cs);float cols=floor(uRes.x/cs),rows=floor(uRes.y/cs);float x=g.x/cols;
 float fill=.45+.55*fract(uTime*.035*(.6+uAmount*.8));float pile=0.;
 for(int i=0;i<3;i++){float fi=float(i);float cx=.18+.32*fi+.04*sin(uSeed+fi);float hg=(.3+.25*hash(vec2(fi,uSeed)))*fill*1.5;pile=max(pile,hg-abs(x-cx)*(1.05+.3*hash(vec2(fi,3.))));}
 float py=clamp(pile,0.,.82)*rows;float layer=floor(g.y/3.);float shade=hash(vec2(floor(g.x/2.),layer))*.32+hash(g)*.14;vec3 col=mix(uC0,uC0*1.25,g.y/rows);
 if(g.y<py)col=mix(uC1,uC2,clamp(shade+.35*fract(g.y/rows*5.+hash(vec2(layer,2.))*.25),0.,1.));
 for(int i=0;i<3;i++){float fi=float(i);float cx=.18+.32*fi+.04*sin(uSeed+fi);float ex=floor(cx*cols);
  if(abs(g.x-ex)<1.5&&g.y>=py){float grain=step(hash(vec2(g.x+fi*17.,g.y+floor(uTime*28.))),.42);col=mix(col,uC3,grain*.95);}}
 float edge=step(.14,min(fract(gl_FragCoord.x/cs),fract(gl_FragCoord.y/cs)));col*=.9+.1*edge;
 gl_FragColor=vec4(finish(col),1.);`),
'turing-spots':main(`vec2 p=frag()*uScale*3.;float t=uTime*.05;vec2 w=vec2(fbm(p*.6+t),fbm(p*.6-t+3.1));float f=noise(p*3.+w*2.)*.6+noise(p*6.1-w)*.4;
 float pattern=sin((f+t*.3)*(18.+uAmount*14.)+uSeed);float m=smoothstep(-.15,.15,pattern);float edge=1.-abs(pattern);
 vec3 col=mix(uC0,mix(uC1,uC2,f),m)+uC3*pow(max(edge,0.),8.)*.35;col*=.9+.2*(1.-length(frag())*.5);
 gl_FragColor=vec4(finish(col),1.);`),
'gas-giant':main(`vec2 p=frag()*uScale;float R=.42;vec2 d=p-vec2(.14,-.03);float r=length(d);vec3 col=uC0+uC3*step(.997,hash(floor(gl_FragCoord.xy/2.)))*.55;
 if(r<R){float z=sqrt(R*R-r*r);vec3 n=normalize(vec3(d,z));float lat=asin(clamp(n.y,-1.,1.));float lon=atan(n.x,n.z)+uTime*.04;vec2 q=vec2(lon*2.,lat*8.);
  float flow=fbm(q+vec2(uTime*.05*sign(sin(lat*7.)),0.)+vec2(fbm(q*vec2(.6,2.)+uTime*.03),0.)*2.);float bands=sin(lat*(13.+uAmount*10.)+flow*3.+uSeed);
  float spot=exp(-pow(length((vec2(lon,lat)-vec2(.7,-.28))*vec2(1.,2.3))*5.,2.));vec3 base=mix(ramp(.25+.55*(.5+.5*bands)),uC3,spot*.6);
  float light=clamp(dot(n,normalize(vec3(-.6,.35,.72))),0.,1.);col=base*(.12+1.1*light)+uC2*pow(1.-n.z,3.)*.3;col=mix(col,uC0,smoothstep(R-.004,R,r));}
 col+=uC2*exp(-abs(r-R)*45.)*.22;
 gl_FragColor=vec4(finish(col),1.);`),
'murmuration':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 p=frag()*uScale;float t=uTime*.16;vec3 col=mix(uC2,uC1,uv.y)+uC3*exp(-length(p-vec2(-.45,-.25))*2.2)*.35;
 vec2 cen=vec2(.32*sin(t*1.3+uSeed),.1*sin(t*2.1)+.06);float sc=48.;
 for(int k=0;k<2;k++){float fk=float(k);vec2 gg=p*sc+fk*.5;vec2 id=floor(gg),f=fract(gg)-.5;vec2 o=hash22(id+fk*13.)-.5;vec2 q=(id+.5)/sc-cen;q=rot(.6*sin(t*1.5+q.x*2.))*q;
  float shape=fbm(q*2.6+vec2(t,-t)*.7);vec2 e=q*vec2(1.,2.3);float dens=exp(-dot(e,e)*(3.2-uAmount*1.4))*smoothstep(.28,.6,shape);
  float bird=smoothstep(.2,.02,length((f-o*.55)*vec2(1.,1.7)))*step(hash(id+fk*3.),dens*2.6);col=mix(col,uC0,bird*.92);}
 gl_FragColor=vec4(finish(col),1.);`),
'ink-drop':main(`vec2 p=frag()*uScale;float t=uTime*.1;vec3 col=mix(uC3,uC3*.9,length(p)*.8);
 for(int i=0;i<4;i++){float fi=float(i);vec2 c=vec2(-.6+.4*fi,.18*sin(fi*2.3+uSeed));float age=.25+.75*fract(t*.4+fi*.27);vec2 q=p-c;q.y+=age*.3;
  vec2 w=vec2(fbm(q*3.+fi+t),fbm(q*3.+fi+4.-t));float r=length(q+(w-.5)*.55*age*(1.+uAmount));float R=.08+age*.3;
  float body=smoothstep(R,R*.1,r)*(1.-age*.55);float tend=smoothstep(.45,.8,fbm(q*7.+w*3.))*smoothstep(R*1.8,R*.3,r)*(1.-age*.6);
  col=mix(col,ramp(.05+.62*hash(vec2(fi,uSeed+1.))),clamp(body*1.1+tend*.8,0.,.95));}
 gl_FragColor=vec4(finish(col),1.);`),
'dust-beams':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec2 p=vec2(uv.x*asp,uv.y);float t=uTime;vec2 d=p-vec2(.18*asp,1.35);float ang=atan(d.x,-d.y),r=length(d);
 float shafts=0.;for(int i=0;i<4;i++){float fi=float(i);float a0=.12+fi*.13+.015*sin(t*.2+fi+uSeed);shafts+=smoothstep(.05+.025*hash(vec2(fi,uSeed)),0.,abs(ang-a0))*(.55+.45*hash(vec2(fi,2.)));}
 shafts*=(.5+.5*fbm(vec2(ang*8.,r*2.-t*.05)))*exp(-r*.35);vec3 col=mix(uC0,uC0*1.25,uv.y)+uC2*shafts*(.8+uAmount*.7);
 for(int L=0;L<2;L++){float fl=float(L);float sc=36.+fl*28.;vec2 g=p*sc*uScale+vec2(t*(.3+fl*.2),sin(t*.3+fl)*.6);vec2 id=floor(g),f=fract(g)-.5;vec2 o=hash22(id+fl*5.)-.5;
  float m=smoothstep(.11,.0,length(f-o*.7));float tw=.5+.5*sin(t*2.+hash(id)*30.);col+=uC3*m*tw*(.05+shafts*4.)*(.9-fl*.25);}
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['smoke-plume','Smoke Plume','Live simulations','Neutral','A column of smoke rising and curling apart in still air.',['smoke','plume','fluid','simulation'],['#07080b','#4a4f5c','#ffb070','#e8ecf2'],.9,1,.5,'Curl'],
 ['sandstorm','Sandstorm','Live simulations','Orange','Wind lifts streams of sand off rippled dunes into a dusty sky.',['sand','dust','desert','wind','simulation'],['#2a1a10','#c98a4b','#f0c48a','#fff3dc'],1,1,.5,'Wind'],
 ['falling-sand','Falling Sand','Live simulations','Orange','Pixel grains pour from above and pile into slowly growing heaps.',['sand','pixels','falling sand','simulation'],['#0d0b14','#c9963c','#f2cf7a','#fff1c4'],1,1,.5,'Pour rate'],
 ['turing-spots','Turing Spots','Live simulations','Green','Slowly shifting spots and stripes like a reaction–diffusion pattern.',['reaction diffusion','pattern','organic','simulation'],['#06120d','#1f7a55','#9fe0b0','#f2fff6'],.8,1,.5,'Detail'],
 ['gas-giant','Gas Giant','Live simulations','Orange','A banded planet whose clouds race in opposite jets around a storm.',['planet','gas','bands','space','simulation'],['#04040a','#8a4a2a','#e0a070','#fff0d8'],.8,1,.5,'Bands'],
 ['murmuration','Murmuration','Live simulations','Pink','A flock of starlings folding and stretching across a dusk sky.',['flock','birds','boids','sky','simulation'],['#140c14','#f2a0a8','#ffd6a0','#fff4e0'],.9,1,.5,'Spread'],
 ['ink-drop','Ink Drop','Live simulations','Blue','Drops of ink bloom and feather as they sink through clear water.',['ink','water','fluid','diffusion','simulation'],['#0b1a3a','#2a4fd8','#d84a8a','#f6f7fb'],.8,1,.5,'Spread'],
 ['dust-beams','Dust Beams','Live simulations','Neutral','Shafts of light through a dusty room, with motes drifting in the beams.',['light','dust','rays','volumetric','simulation'],['#0b0907','#3a2c1e','#ffcf8a','#fff6e2'],.8,1,.5,'Brightness']
];
