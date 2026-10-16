// Original live backgrounds: character-drawn scenes. Written for RepoShelf; no third-party shader source.
import {withHelpers} from './live-prelude.mjs';
// Shared scaffold: a glyph grid whose character density follows a field `v` (0..1), tinted by the palette ramp.
const glyphScene=(field,cells=26,extra='')=>withHelpers(extra,`float cs=max(10.,floor(uRes.y/${cells}./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 cell=floor(g),f=fract(g);vec2 cc=(cell+.5)*cs;vec2 p=(cc-.5*uRes)/uRes.y;float t=uTime;float v=0.;vec3 tint=vec3(1.);vec3 bg=uC0;
 ${field}
 v=clamp(v,0.,1.);float lv=floor(v*8.99);float m=gchar(f,lv);vec3 col=bg+ramp(.18+v*.82)*tint*m*(.55+.6*v);col+=ramp(v)*v*v*.1;
 gl_FragColor=vec4(finish(col),1.);`);
export const shaders={
'ember-glyphs':glyphScene(`float ht=p.y+.5;float n=fbm(vec2(p.x*3.2*uScale,ht*2.4-t*.8)+uSeed);float rise=fbm(vec2(p.x*7.,ht*5.-t*1.7));
 v=clamp(n*1.6+rise*.3-ht*(2.1-uAmount*.6)+.3,0.,1.);v=smoothstep(.04,1.15,v)*.9;v=max(v,smoothstep(.07,0.,ht)*(.8+.15*sin(t*3.+p.x*9.)));`,40),
'glyph-planet':glyphScene(`vec2 q=p/(.4*uScale);float r2=dot(q,q);
 if(r2<1.){float z=sqrt(1.-r2);vec3 n=vec3(q,z);float lon=atan(n.x,n.z)+t*.28,lat=asin(clamp(n.y,-1.,1.));
  float band=.5+.5*sin(lat*10.+fbm(vec2(lon*2.5,lat*4.+uSeed))*3.2);float light=max(dot(n,normalize(vec3(.75,.35,.55))),0.);
  v=light*(.4+.6*band)*1.45+.1*(1.-light)*band;bg=uC0*.7;}
 else{float ring=smoothstep(.05,0.,abs(length(vec2(p.x,p.y*3.4))-.66*uScale))*(.6+.5*uAmount);float halo=exp(-(length(q)-1.)*7.)*.35;v=max(ring*(.7+.3*sin(atan(p.y,p.x)*5.+t)),halo);
  v=max(v,step(.985,hash(cell+uSeed))*.55);}`,44),
'sonar-glyphs':glyphScene(`float pr=fract(t*.16),rad=pr*.95;float d0=length(p);float ring=exp(-pow((d0-rad)*16.,2.))*(1.-pr);
 float s=0.,glow=0.;for(int i=0;i<5;i++){float k=float(i);vec2 c=vec2(.45*sin(t*.17+k*2.1+uSeed),.26*cos(t*.13+k*2.9));float shoal=exp(-dot(p-c,p-c)*22.)*step(.2,hash(cell+k));s+=shoal;
  float dd=length(c)/.95;float since=mod(pr-dd+1.,1.);glow+=shoal*exp(-since*3.2);}
 v=.14*step(.5,hash(cell+uSeed))+ring*.95+glow*(1.5+uAmount)+s*.28;v*=smoothstep(.7,.55,d0)*.75+.25;`,36),
'tide-glyphs':glyphScene(`float x=p.x*uScale;float lvl=.12*sin(t*.4);float shore=.12*sin(x*3.1+t*.6)+.06*sin(x*7.-t*.9)+lvl;float d=p.y*uScale-shore;
 float sand=.12+.1*fbm(p*5.+uSeed);float deep=.28+.26*smoothstep(0.,-.45,d)+.1*fbm(vec2(x*6.+t,d*5.));
 v=d>0.?sand*(1.-smoothstep(0.,.3,d)*.5):deep;
 float foam=exp(-abs(d)*(16.-uAmount*6.))*(.7+.3*sin(x*40.+t*3.));v=max(v,foam*.95);
 float wet=smoothstep(.0,.06,d)*smoothstep(.12,.06,d);v+=wet*.12;`,30),
'glyph-swell':glyphScene(`vec2 q=p*uScale;float h=sin(q.x*4.5+t*.9)*.5+sin(q.y*5.+q.x*1.5-t*1.2)*.5+sin((q.x+q.y)*3.-t*.7)*.5;
 float l=.5+.5*h/1.5;float crest=pow(l,2.2);v=mix(l*.8,crest*1.3,.5+uAmount*.3);v*=.9+.15*sin(q.y*9.+t);`,38),
'glass-glyph-tiles':withHelpers('',`float cs=max(8.,floor(uRes.y/42./uScale));vec2 g=gl_FragCoord.xy/cs;vec2 tg=g/3.;vec2 tid=floor(tg),tf=fract(tg);vec2 cell=floor(g),f=fract(g);float t=uTime;
 vec2 tc=(tid+.5)*3.*cs;vec2 p=(tc-.5*uRes)/uRes.y;float w=.5+.5*sin(length(p)*7.-t*1.4+uSeed)+.25*sin(p.x*5.+t*.8);w=clamp(.5+(w-.5)*(.8+uAmount),0.,1.);
 float edge=min(min(tf.x,1.-tf.x),min(tf.y,1.-tf.y));float bev=smoothstep(.0,.09,edge);float inner=smoothstep(.04,.2,edge);
 float lv=floor(clamp(w,0.,1.)*8.99);float m=gchar(f,lv);
 vec3 glass=mix(uC1,uC2,w)*(.12+.3*w)*(.7+.5*(1.-tf.y))+uC3*pow(1.-tf.y,6.)*.06*w;
 vec3 col=uC0+glass*bev*.8+ramp(.25+.6*w)*m*inner*(.25+.65*w*w)+uC3*smoothstep(.1,0.,abs(edge-.045))*.06*bev;
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['ember-glyphs','Ember Glyphs','Live ASCII & dither','Orange','Flames licking up from a white-hot bed, drawn entirely in characters.',['ascii','fire','embers','glyphs'],['#080302','#a1230a','#ff7a1a','#fff0b8'],1,1,.5,'Flame height'],
 ['glyph-planet','Glyph Planet','Live ASCII & dither','Blue','A banded planet and its ring, turning in the light of a distant sun, drawn in characters.',['ascii','planet','space','glyphs'],['#03050c','#2a4bd6','#7fb0ff','#ffffff'],.9,1,.5,'Ring strength'],
 ['sonar-glyphs','Sonar Glyphs','Live ASCII & dither','Green','Sonar pings sweeping a field of characters and lighting up drifting shoals.',['ascii','sonar','radar','glyphs'],['#020b08','#0f8a5a','#52ffb0','#e6fff3'],1,1,.5,'Echo'],
 ['tide-glyphs','Tide Glyphs','Live ASCII & dither','Blue','A tide flooding and draining a shore, drawn in characters.',['ascii','tide','shore','glyphs'],['#041018','#1c6a9e','#7fd6ff','#ffffff'],.9,1,.5,'Foam'],
 ['glyph-swell','Glyph Swell','Live ASCII & dither','Purple','Rolling swells whose crests thicken into dense characters.',['ascii','waves','glyphs'],['#07040f','#4b2fc4','#b07aff','#ffe6ff'],.9,1,.5,'Crest sharpness'],
 ['glass-glyph-tiles','Glass Glyph Tiles','Live ASCII & dither','Pink','Glassy tiles each holding a glowing character that brightens with passing waves.',['ascii','tiles','glass','glyphs'],['#08050f','#6a3fd8','#ff5fae','#fff0f6'],.9,1,.5,'Wave contrast']
];
