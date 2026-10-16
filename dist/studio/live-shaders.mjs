// Original RepoShelf fragment shaders for Studio's live backgrounds (WebGL 1, no dependencies).
// Every shader is written from standard techniques (value-noise fbm, domain warping, Bayer
// dithering, metaball fields, polar coordinates). No third-party shader source is included.
import {PRELUDE,main,withHelpers} from './live-prelude.mjs';
export {PRELUDE};
const baseShaders={
'aurora-veil':withHelpers(`float ribbon(vec2 uv,float k,float t){
 float x=uv.x*aspect()*uScale;
 float y0=.3+k*.07+.12*sin(x*1.4+t+k*2.)+.16*(fbm(vec2(x*.8+k*7.+uSeed,t*.5))-.5);
 float d=uv.y-y0;
 float glow=exp(-max(d,0.)*(7.-uAmount*4.5))*smoothstep(-.06,0.,d);
 float streak=.5+.5*noise(vec2(x*22.,t*.7+k*3.));
 return glow*mix(.6,1.,streak);
}`,`vec2 uv=gl_FragCoord.xy/uRes;float t=uTime*.35;
 vec3 col=mix(uC0*.45,uC0,uv.y);
 col+=step(.9985,hash(floor(gl_FragCoord.xy/2.)+uSeed))*smoothstep(.45,.85,uv.y)*.7;
 for(int i=0;i<3;i++){float k=float(i);col+=ribbon(uv,k,t)*mix(uC1,mix(uC2,uC3,k*.5),k/2.)*(.8-k*.12);}
 gl_FragColor=vec4(finish(col),1.);`),

'mercury-pool':main(`vec2 p=frag()*2.2*uScale;float t=uTime*.2;
 for(int i=0;i<4;i++){float f=float(i)+1.;p+=(.35+uAmount*.5)/f*vec2(sin(p.y*f*1.7+t+uSeed),cos(p.x*f*1.3-t*1.1));}
 float v=sin(p.x*1.3)+sin(p.y*1.7)+sin((p.x+p.y)*.9);
 float m=pow(.5+.5*v/3.,1.5);
 float spec=pow(abs(sin(v*1.6)),10.);
 gl_FragColor=vec4(finish(ramp(m)+spec*.3),1.);`),

'oil-slick':main(`vec2 p=frag()*1.8*uScale;float t=uTime*.12;
 float w=fbm(p*1.3+vec2(t,-t)+uSeed);
 float h=w*(2.+uAmount*3.)+p.x*.35+p.y*.2+t;
 float band=abs(fract(h)*2.-1.);
 vec3 col=ramp(band)*(.7+.5*fbm(p*3.-t));
 gl_FragColor=vec4(finish(col),1.);`),

'satin-folds':main(`vec2 p=frag()*uScale;float t=uTime*.22;vec2 q=rot(.6)*p*1.6;float v=0.;
 for(int i=0;i<5;i++){float f=float(i)+1.;v+=sin(q.x*f*1.8+sin(q.y*f*.9+t*f*.7+uSeed)*(1.1+uAmount*1.3)+t)/f;}
 float shade=.5+.5*v/1.6;
 float lit=.5+.5*sin(v*3.+t);
 gl_FragColor=vec4(finish(ramp(shade)*(.5+.65*lit*lit)),1.);`),

'plasma-bloom':main(`vec2 p=frag()*3.*uScale;float t=uTime*.4;
 float v=sin(p.x+t)+sin((p.y+t)*.7)+sin((p.x+p.y+t)*.5)+sin(length(p+vec2(sin(t*.3)*2.,cos(t*.4)*2.))*1.2+uSeed);
 gl_FragColor=vec4(finish(ramp(.5+.5*sin(v*(.8+uAmount*1.4)))),1.);`),

'nebula-drift':main(`vec2 p=frag()*2.*uScale;float t=uTime*.05;
 vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
 float f=fbm(p+3.*q+uSeed);
 vec3 col=mix(uC0,ramp(smoothstep(.2,.95,f)),smoothstep(.12,.75,f)*(.55+uAmount*.7));
 float star=step(.9965,hash(floor(gl_FragCoord.xy/2.)+uSeed))*(.5+.5*sin(uTime*2.+hash(floor(gl_FragCoord.xy/2.))*40.));
 col+=star*(1.-f)*.9;
 gl_FragColor=vec4(finish(col),1.);`),

'sunburst-rays':main(`vec2 uv=gl_FragCoord.xy/uRes;vec2 src=vec2(.5+(uPointer.x-.5)*.3,1.18);
 vec2 d=uv-src;d.x*=aspect();float ang=atan(d.x,-d.y);float len=length(d);
 float rays=0.;
 for(int i=0;i<3;i++){float k=float(i);rays+=pow(.5+.5*sin(ang*(10.+k*8.)*uScale+uTime*(.25+.15*k)+k*2.+uSeed),2.+uAmount*5.)*(1.-k*.25);}
 float fade=exp(-len*1.45);
 vec3 col=mix(uC0,ramp(rays*.45),clamp(rays*.4*fade*(1.4+uAmount),0.,1.));
 col+=uC3*exp(-len*3.2)*.55;
 gl_FragColor=vec4(finish(col),1.);`),

'soft-orb':main(`vec2 p=frag()*1.4/uScale+(uPointer-.5)*.08;float a=atan(p.y,p.x),r=length(p);
 float edge=.38+.03*sin(a*3.+uTime*.8)+.025*sin(a*5.-uTime*1.1+uSeed)*(.4+uAmount*1.4);
 float body=smoothstep(edge+.012,edge-.02,r);
 float n=fbm(p*3.+vec2(uTime*.15,-uTime*.1));
 vec3 inner=ramp(.15+.8*n*(1.1-r/edge*.5));
 vec3 col=uC0+uC3*exp(-max(r-edge,0.)*6.5)*.55;
 col=mix(col,inner,body);
 col+=body*pow(max(0.,1.-length(p-vec2(-.1,.12))/edge),3.)*.25;
 gl_FragColor=vec4(finish(col),1.);`),

'contour-field':main(`vec2 p=frag()*1.7*uScale;
 float h=fbm(p+vec2(uTime*.03,uSeed))+.2*sin(p.x*.5+uTime*.1);
 float f=fract(h*(5.+uAmount*9.));
 float line=smoothstep(0.,.045,f)*smoothstep(0.,.045,1.-f);
 vec3 base=mix(uC0,uC1,smoothstep(.2,.8,h));
 gl_FragColor=vec4(finish(mix(ramp(.45+h*.8),base,line)),1.);`),

'slat-gradient':main(`vec2 uv=gl_FragCoord.xy/uRes;float cols=floor(10.*uScale+.5);float x=uv.x*cols;float n=floor(x),cell=fract(x);
 float off=hash(vec2(n,uSeed));
 float g=uv.y*.65+off*(.15+uAmount*.4)+.12*sin(uTime*.4+n*.55);
 float bevel=smoothstep(0.,.18,cell)*smoothstep(1.,.82,cell);
 float lit=1.-smoothstep(0.,.9,abs((n+.5)/cols-uPointer.x))*.45;
 gl_FragColor=vec4(finish(ramp(g)*mix(.4,1.,bevel)*lit),1.);`),

'grain-mesh':withHelpers(`vec2 anchor(float i,float t){return vec2(.5+.4*sin(t*(.31+i*.07)+i*2.1+uSeed),.5+.38*cos(t*(.27+i*.05)+i*1.7));}`,
 `vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y);float t=uTime*.5;vec3 acc=vec3(0.);float wsum=0.;
 for(int i=0;i<4;i++){float k=float(i);vec2 c=anchor(k,t)*vec2(aspect(),1.);float d=distance(p,c);float w=1./(pow(d*uScale,3.)+.02);vec3 colour=k<1.?uC0:k<2.?uC1:k<3.?uC2:uC3;acc+=colour*w;wsum+=w;}
 vec3 col=acc/wsum;
 float g=hash(gl_FragCoord.xy*.7+fract(uTime*3.))-.5;
 col+=g*(.04+uAmount*.2);
 gl_FragColor=vec4(clamp(col,0.,1.),1.);`),

'prism-beams':main(`vec2 p=frag();float a=uTime*.12+uSeed*.1;p=rot(a)*p*uScale;vec3 c=vec3(0.);
 for(int k=0;k<3;k++){float fk=float(k);vec2 q=rot(fk*1.05)*p;
  float split=.02+uAmount*.07;
  c.r+=exp(-abs(q.x+split)*(12.-fk*1.5));c.g+=exp(-abs(q.x)*(12.-fk*1.5));c.b+=exp(-abs(q.x-split)*(12.-fk*1.5));}
 c*=.4;
 vec3 col=uC0*.5+c.r*uC1+c.g*uC2+c.b*uC3;
 gl_FragColor=vec4(finish(col),1.);`),

'dither-waves':withHelpers(`float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float bayer4(vec2 a){return b2(.5*a)*.25+b2(a);}`,
 `float px=max(2.,floor(uRes.y/220.));vec2 cell=floor(gl_FragCoord.xy/px);vec2 p=(cell*px-.5*uRes)/uRes.y*uScale;float t=uTime*.3;
 float v=.5+.22*sin(p.x*4.+t)+.2*sin(p.y*5.-t*1.3+sin(p.x*3.+uSeed))+.12*sin(length(p)*8.-t*2.);
 v=clamp(.5+(v-.5)*(.8+uAmount*1.2),0.,1.);
 float lvl=floor(v*3.+bayer4(cell)-.5+.5)/3.;
 gl_FragColor=vec4(ramp(clamp(lvl,0.,1.)),1.);`),

'glyph-field':main(`float cs=max(10.,floor(uRes.y/26./uScale));vec2 cell=floor(gl_FragCoord.xy/cs);vec2 f=fract(gl_FragCoord.xy/cs)-.5;
 vec2 p=(cell*cs-.5*uRes)/uRes.y;float t=uTime*.35;
 float v=.5+.3*sin(p.x*5.+t)+.25*sin(p.y*6.-t*1.2+uSeed)+.2*sin(length(p-vec2(sin(t*.5)*.3,cos(t*.4)*.2))*9.-t*2.);
 v=clamp(.5+(v-.5)*(.9+uAmount),0.,1.);
 float lvl=floor(v*5.);float m=0.;
 float ax=abs(f.x),ay=abs(f.y);
 if(lvl==1.)m=step(length(f),.1);
 else if(lvl==2.)m=step(ay,.06)*step(ax,.26);
 else if(lvl==3.)m=max(step(ay,.06)*step(ax,.28),step(ax,.06)*step(ay,.28));
 else if(lvl==4.)m=step(max(ax,ay),.3)*(1.-step(max(ax,ay),.17));
 else if(lvl>=5.)m=step(max(ax,ay),.34);
 gl_FragColor=vec4(mix(uC0,ramp(.3+v*.7),m),1.);`),

'dot-ripples':main(`float cs=max(10.,floor(uRes.y/30./uScale));vec2 c=(floor(gl_FragCoord.xy/cs)+.5)*cs;
 vec2 src=(uPointer*uRes-.5*uRes)/uRes.y,cp=(c-.5*uRes)/uRes.y;
 float d=length(cp-src);float d2=length(cp-vec2(sin(uTime*.3)*.4,cos(uTime*.23)*.2));
 float amp=.5+.5*sin(d*16.-uTime*2.2+uSeed);amp*=exp(-d*1.2);
 amp=max(amp,(.5+.5*sin(d2*14.-uTime*1.6))*exp(-d2*1.6)*.7);
 float r=cs*(.1+.38*amp*(.5+uAmount));
 float m=smoothstep(r,r-1.5,length(gl_FragCoord.xy-c));
 gl_FragColor=vec4(finish(mix(uC0,ramp(.25+amp*.9),m)),1.);`),

'magnet-lines':main(`float cs=max(12.,floor(uRes.y/22./uScale));vec2 c=(floor(gl_FragCoord.xy/cs)+.5)*cs;
 vec2 target=mix(uPointer*uRes,uRes*(.5+.3*vec2(sin(uTime*.4+uSeed),cos(uTime*.31))),.5*(1.-step(.001,length(uPointer-vec2(.5)))));
 vec2 to=target-c;float ang=atan(to.y,to.x);
 vec2 l=rot(-ang)*(gl_FragCoord.xy-c);
 float near=exp(-length(to)/(uRes.y*.55));
 float len=cs*(.3+.5*near*(.4+uAmount));float w=cs*.07;
 float m=smoothstep(w,w-1.2,abs(l.y))*smoothstep(len,len-1.5,abs(l.x));
 gl_FragColor=vec4(finish(mix(uC0,ramp(.45+near*.55),m)),1.);`),

'ferro-blobs':withHelpers(`float field(vec2 p){float f=0.;
 for(int i=0;i<6;i++){float k=float(i);vec2 c=vec2(.55*sin(uTime*.35*(.7+k*.13)+k*2.1+uSeed),.32*cos(uTime*.3*(.8+k*.11)+k*1.7));float r=.085+.03*sin(k*1.3);f+=r*r/(dot(p-c,p-c)+.0008);}
 vec2 pc=(uPointer-.5)*vec2(aspect(),1.);f+=.011/(dot(p-pc,p-pc)+.0008)*.6;return f;}`,
 `vec2 p=frag()/uScale;float f=field(p);float e=.006;
 vec2 n=vec2(field(p+vec2(e,0.))-field(p-vec2(e,0.)),field(p+vec2(0.,e))-field(p-vec2(0.,e)));
 float iso=smoothstep(.96,1.06,f);
 vec3 normal=normalize(vec3(-n*(.5+uAmount),1.2));
 float diff=clamp(dot(normal,normalize(vec3(-.4,.6,.7))),0.,1.);
 float rim=pow(1.-clamp(normal.z,0.,1.),2.);
 vec3 body=ramp(.25+.55*diff)+rim*uC3*.5;
 vec3 col=mix(uC0*(.8+.2*hash(floor(gl_FragCoord.xy/3.))),body,iso);
 col+=uC2*exp(-abs(f-1.)*4.)*.18*(1.-iso);
 gl_FragColor=vec4(finish(col),1.);`),

'storm-bolt':main(`vec2 uv=gl_FragCoord.xy/uRes;float rate=.7;float cyc=floor(uTime*rate+uSeed),ph=fract(uTime*rate+uSeed);
 float x0=.2+.6*hash(vec2(cyc,3.));float y=uv.y;
 float wob=(fbm(vec2(y*5.,cyc*3.1))-.5)*.5+(fbm(vec2(y*14.,cyc*1.7))-.5)*.12;
 float d=abs((uv.x-x0)*aspect()-wob*(1.-y*.3));
 float life=exp(-ph*(5.-uAmount*2.5));
 float bolt=.007/(d+.003)*life*smoothstep(1.02,.6,y+(1.-hash(vec2(cyc,9.)))*.2);
 float flash=exp(-ph*9.)*(.45+.35*uAmount);
 vec3 sky=mix(uC0*.6,uC0*1.5+uC1*.25,uv.y)+(fbm(vec2(uv.x*aspect()*2.5*uScale,uv.y*3.+uTime*.05))-.4)*uC1*.3;
 vec3 col=sky+flash*uC2*(.4+uv.y)+bolt*mix(uC2,uC3,.6);
 gl_FragColor=vec4(finish(col),1.);`),

'light-tunnel':main(`vec2 p=frag()*uScale;p+= (uPointer-.5)*.15;float r=length(p),a=atan(p.y,p.x);
 float z=1./(r+.03);float rings=.5+.5*sin(z*(2.+uAmount*2.)-uTime*3.);
 float spokes=.5+.5*sin(a*12.+z*.4+uSeed);
 float v=pow(rings,3.)*(.35+.65*spokes);
 vec3 col=uC0+ramp(.2+v)*v*smoothstep(0.,.5,r)+uC3*exp(-r*5.)*.7;
 gl_FragColor=vec4(finish(col),1.);`),

'line-waves':main(`vec2 uv=gl_FragCoord.xy/uRes;float x=uv.x*aspect()*uScale;float t=uTime*.4;vec3 col=uC0;float glow=0.;
 for(int i=0;i<14;i++){float k=float(i)/13.;
  float y=.12+.76*k+(.05+uAmount*.07)*sin(x*(2.2+k*1.6)+t+k*6.+uSeed)*(.5+k)+.02*sin(x*7.-t*1.4+k*3.);
  float d=abs(uv.y-y);
  col=mix(col,ramp(k),smoothstep(.006,.0015,d)*.9);
  glow+=exp(-d*70.)*.07;}
 col+=uC2*glow;
 gl_FragColor=vec4(finish(col),1.);`)
};

const baseEntries=[
 ['aurora-veil','Aurora Veil','Live shaders','Green','Curtains of northern light drifting above a starry night.',['aurora','night','glow'],['#06141a','#2fe39a','#4fa8ff','#b88cff'],.9,1,.55,'Glow reach'],
 ['mercury-pool','Mercury Pool','Live shaders','Neutral','Slow-moving liquid metal with soft specular ripples.',['chrome','metal','liquid'],['#0c0d12','#59606e','#c6ccd8','#ffffff'],.8,1,.5,'Warp'],
 ['oil-slick','Oil Slick','Live shaders','Purple','Thin-film colour bands rolling across a dark surface.',['iridescent','film','rainbow'],['#120b25','#6a3df0','#18c5c9','#f4a7d8'],.8,1,.5,'Band density'],
 ['satin-folds','Satin Folds','Live shaders','Pink','Folded fabric with a gentle moving sheen.',['silk','fabric','soft'],['#2a0f1e','#9d2f66','#f06f9a','#ffd1dc'],.9,1,.45,'Fold depth'],
 ['plasma-bloom','Plasma Bloom','Live shaders','Orange','Blended waves of heat that swell and fold.',['plasma','warm','retro'],['#14070a','#d12a3f','#ff7a1a','#ffd23f'],1,1,.5,'Contrast'],
 ['nebula-drift','Nebula Drift','Live shaders','Blue','Clouds of space dust with twinkling stars.',['space','nebula','stars'],['#04060f','#2a3b9a','#6a7bff','#f5a4ff'],.8,1,.6,'Density'],
 ['sunburst-rays','Sunburst Rays','Live shaders','Orange','Shafts of light fanning out from above; the pointer steers them.',['rays','light','hero'],['#0d0b14','#ff9d3d','#ffd27a','#fff3d6'],.9,1,.5,'Sharpness'],
 ['soft-orb','Soft Orb','Live shaders','Blue','A glowing, gently wobbling sphere of colour.',['orb','glow','centre'],['#07091a','#2b5cff','#7aa7ff','#c9d9ff'],.9,1,.5,'Wobble'],
 ['contour-field','Contour Field','Live shaders','Green','Topographic lines that slowly reshape the terrain.',['topography','lines','map'],['#08130e','#1f5a3b','#7fcf9a','#d9ffe6'],.7,1,.5,'Line density'],
 ['slat-gradient','Slat Gradient','Live shaders','Purple','Vertical glass slats, each with its own gradient offset.',['blinds','glass','lines'],['#1a0b2e','#7b3fe4','#e06fd0','#ffd0f2'],.8,1,.5,'Variation'],
 ['grain-mesh','Grain Mesh','Live shaders','Pink','A drifting four-colour mesh with film grain.',['mesh','grain','gradient'],['#f06292','#ffb347','#5ac8fa','#7b61ff'],.8,1,.5,'Grain'],
 ['prism-beams','Prism Beams','Live shaders','Blue','Crossing beams of light that split into colour.',['prism','beams','dispersion'],['#05060d','#ff3d6e','#3dffb0','#3d8bff'],.8,1,.5,'Dispersion'],
 ['dither-waves','Dither Waves','Live ASCII & dither','Neutral','Ordered-dither waves in four tones, like a retro screen.',['dither','pixel','retro'],['#101214','#3a5a40','#a3b18a','#e9f5db'],.8,1,.5,'Contrast'],
 ['glyph-field','Glyph Field','Live ASCII & dither','Green','A character-grid field whose symbols follow a moving signal.',['ascii','terminal','characters'],['#04100a','#1a7f3c','#58d68d','#d6ffe5'],.8,1,.5,'Contrast'],
 ['dot-ripples','Dot Ripples','Live patterns','Blue','A dot grid that swells with ripples from your pointer.',['dots','grid','interactive'],['#0a0e1a','#2a4bd7','#7aa0ff','#e1ebff'],.9,1,.5,'Dot size'],
 ['magnet-lines','Magnet Lines','Live patterns','Orange','A field of short lines that turn towards a moving magnet.',['lines','magnet','interactive'],['#0e0b08','#a24a1a','#f09a3e','#ffe7c2'],1,1,.5,'Reach'],
 ['ferro-blobs','Ferro Blobs','Live fluid & light','Neutral','Glossy metaballs that merge and split.',['blobs','ferrofluid','liquid'],['#08090c','#2b2f3a','#8d95a8','#e6ebf5'],.9,1,.5,'Relief'],
 ['storm-bolt','Storm Bolt','Live fluid & light','Blue','A night sky with periodic forking lightning.',['lightning','storm','dramatic'],['#050813','#243a7a','#9db8ff','#ffffff'],1,1,.5,'Intensity',7.2],
 ['light-tunnel','Light Tunnel','Live fluid & light','Purple','Rings of light rushing towards the viewer.',['tunnel','speed','hyperspace'],['#050310','#4a2cc8','#b05cff','#ffffff'],1,1,.5,'Ring density'],
 ['line-waves','Line Waves','Live fluid & light','Green','Stacked flowing lines with a soft glow.',['lines','waves','minimal'],['#050b09','#0f6b4a','#33d69f','#c8ffe9'],.9,1,.45,'Wave height']
];
import * as nature from './live-pack-nature.mjs';
import * as geometric from './live-pack-geometric.mjs';
import * as tech from './live-pack-tech.mjs';
import * as light from './live-pack-light.mjs';
import * as industrial from './live-pack-industrial.mjs';
import * as more from './live-pack-more.mjs';
import * as feature from './live-pack-feature.mjs';
import * as glyph from './live-pack-glyph.mjs';
import * as cosmic from './live-pack-cosmic.mjs';
import * as flow from './live-pack-flow.mjs';
import * as deep from './live-pack-deep.mjs';
import * as grid from './live-pack-grid.mjs';
import * as sky from './live-pack-sky.mjs';
import * as scenes from './live-pack-scenes.mjs';
const packs=[nature,geometric,tech,light,industrial,more,feature,glyph,cosmic,flow,deep,grid,sky,scenes];
const shaders=Object.assign({},baseShaders,...packs.map(p=>p.shaders));
const entries=[...baseEntries,...packs.flatMap(p=>p.entries)];
const built=entries.map(([id,title,category,colour,description,tags,colors,speed,scale,amount,amountLabel,thumbTime=6.5])=>({id,title,category,colour,dominantColour:colors[1],colors,tags:['live',...tags],description,live:true,ai:false,width:1920,height:1080,amountLabel,thumbTime,defaults:{colors,speed,scale,amount,seed:7}}));
// Curated gallery order: the strongest and most varied backgrounds come first; everything else follows in pack order.
const ORDER=['aurora-veil','fog-bank','light-slices','glow-glyphs','paper-tear','glossy-squares','gloss-tiles','orb-halo','spectral-prism','neural-filaments','scan-lines','ink-crown','falling-light','gravity-well','wire-ribbons','synthwave-grid','stir-mesh','fluted-glass','ocean-swell','mercury-pool','digital-rain','crt-signal','light-knot','magic-rings','lens-flare','tilted-galaxy','sunset-haze','dissolve-edge','spiral-arms','terrain-glide','night-highway','dither-lens','brake-disc','oil-slick','gear-train','fog-sphere','nebula-drift','electric-arcs','silk-swirl','lava-crust','holo-foil','liquid-gold','twist-tunnel','thread-flow','starfield-warp','voronoi-glass','glyph-planet','tach-dial','halftone-vortex','particle-tunnel','caustic-pool','hex-lantern','ember-glyphs','flame-tongues','planet-limb','pinch-arcs','spiral-threads','watercolor-bleed','dotted-horizon','aurora-sweep','beam-rise','neon-ribbons','carbon-weave','kaleido-bloom','rain-glass','light-pillars','hex-pulse','marble-veins','turbine-fan','meteor-night','grid-warp','plasma-bloom','isometric-cubes','bokeh-lights','radar-sweep','alloy-wheel','satin-folds','hazard-stripes','truchet-weave','fireflies','prism-beams','honeycomb-grille','speed-lines'];
const rank=item=>{const i=ORDER.indexOf(item.id);return i<0?ORDER.length:i};
export const liveItems=built.map((item,i)=>({item,i})).sort((a,b)=>rank(a.item)-rank(b.item)||a.i-b.i).map(x=>x.item);
export function liveFragment(id){const source=shaders[id];if(!source)throw Error('Unknown live background');return source}
export function liveItem(id){return liveItems.find(i=>i.id===id)}
export const LIVE_IDS=liveItems.map(i=>i.id);
export function liveParams(id,input={}){
 const base=liveItem(id)?.defaults;if(!base)throw Error('Unknown live background');
 const num=(v,min,max,d)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):d;
 const colours=Array.isArray(input.colors)?input.colors.slice(0,4).map((c,i)=>/^#[a-f\d]{6}$/i.test(c)?c:base.colors[i]):base.colors;
 while(colours.length<4)colours.push(base.colors[colours.length]);
 return {colors:colours,speed:num(input.speed,.1,4,base.speed),scale:num(input.scale,.5,2,base.scale),amount:num(input.amount,0,1,base.amount),seed:Math.round(num(input.seed,0,999,base.seed))};
}
// Standalone exports ------------------------------------------------------------------------
import {createRunner} from './live-runner.mjs';
const runnerSource=createRunner.toString();
const LICENCE='RepoShelf Studio licence: personal and commercial project use is allowed. Do not resell or redistribute standalone assets or include them in another asset library. See https://www.reposhelf.co.uk/terms.html.';
export function liveHTML(id,input){
 const item=liveItem(id),params=liveParams(id,input),json=JSON.stringify(params).replace(/</g,'\\u003c'),frag=JSON.stringify(liveFragment(id)).replace(/</g,'\\u003c');
 return `<!doctype html>\n<!-- ${LICENCE} -->\n<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${item.title}</title>\n<style>html,body{margin:0;height:100%;background:${params.colors[0]}}canvas{display:block;width:100%;height:100%}</style>\n<canvas id="bg" aria-hidden="true"></canvas>\n<script>\nconst createRunner=${runnerSource};\nconst runner=createRunner(document.getElementById('bg'),${frag},{params:${json}});\nif(runner)runner.start();\n</script></html>\n`;
}
export function liveReact(id,input){
 const item=liveItem(id),params=liveParams(id,input),name=item.title.replace(/[^a-z0-9]+/gi,' ').trim().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join('');
 return `// ${LICENCE}\nimport {useEffect, useRef} from 'react';\n\nconst createRunner = ${runnerSource};\nconst fragment = ${JSON.stringify(liveFragment(id))};\nconst defaults = ${JSON.stringify(params)};\n\nexport function ${name}Background({params, className, style}) {\n  const ref = useRef(null);\n  useEffect(() => {\n    const runner = createRunner(ref.current, fragment, {params: {...defaults, ...params}});\n    if (runner) runner.start();\n    return () => runner && runner.destroy();\n  }, [params]);\n  return <canvas ref={ref} aria-hidden="true" className={className} style={{display: 'block', width: '100%', height: '100%', ...style}} />;\n}\n`;
}
