// Original live backgrounds: nature and atmosphere. Written for RepoShelf; no third-party shader source.
import {main,withHelpers} from './live-prelude.mjs';
const ridgeShader=(fog)=>withHelpers(`float ridge(float x,float k){return fbm(vec2(x*1.1+k*9.7+uSeed,k*3.1))*.55+.12*sin(x*2.3+k*4.)+.03*fbm(vec2(x*6.,k));}`,
`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect(),t=uTime*.012;
 vec3 col=mix(uC2,uC3,pow(smoothstep(.2,1.,uv.y),.8));
 vec2 sun=vec2(.5+(uPointer.x-.5)*.05,.46);float sd=length((uv-sun)*vec2(asp,1.));
 col+=uC2*exp(-sd*3.2)*${fog>0.?'.6':'.8'}+vec3(1.,.95,.85)*smoothstep(.07,.05,sd)*.9;
 for(int i=0;i<5;i++){float d=1.-float(i)/4.;
  float x=uv.x*asp*uScale*(1.+d*.3)+t*(1.-d)*8.;
  float h=.16+d*.3+ridge(x,float(i))*(.5-d*.18)*(.8+uAmount*.5);
  vec3 lc=mix(uC0,uC1,d*.9);lc=mix(lc,uC2,d*d*${fog>0.?'.85':'.55'});
  float edge=smoothstep(h+.003,h-.003,uv.y);
  float mist=exp(-max(h-uv.y,0.)*${fog>0.?'7.':'14.'})*(${fog>0.?'.55':'.25'}*d+.1);
  col=mix(col,lc,edge);col=mix(col,uC2,mist*edge);}
 gl_FragColor=vec4(finish(col),1.);`);
export const shaders={
'ocean-swell':withHelpers(`float swell(vec2 q,float t){return sin(q.x*.9+q.y*1.3-t*1.2)*.5+sin(q.x*1.7-q.y*.7+t*.8)*.3+sin(q.x*3.1+q.y*2.3-t*1.7)*.12;}`,
 `vec2 uv=gl_FragCoord.xy/uRes;float hor=.54,asp=aspect();vec3 col;
 vec2 sun=vec2(.5+(uPointer.x-.5)*.1,hor+.06);
 if(uv.y>=hor){float k=(uv.y-hor)/(1.-hor);col=mix(uC2,uC3,pow(k,.6));float sd=length((uv-sun)*vec2(asp,1.));col+=vec3(1.,.9,.7)*(smoothstep(.05,.03,sd)+exp(-sd*4.)*.45);}
 else{float d=hor-uv.y,z=1./(d+.03);vec2 q=vec2((uv.x-.5)*asp*z*uScale*1.4,z*1.2);
  float h=swell(q,uTime*.6)*(.5+uAmount*.8);float e=.02;
  float sl=swell(q+vec2(e,0.),uTime*.6)-swell(q-vec2(e,0.),uTime*.6);
  float li=clamp(.5+sl*7.,0.,1.);
  vec3 water=mix(uC1,uC0,smoothstep(0.,.5,d));water=mix(water,uC2,exp(-d*8.)*.75);
  water*=.55+.9*li;
  float sx=(uv.x-sun.x)*asp;float path=exp(-pow(sx/(.03+d*.55),2.));
  float glint=path*pow(max(0.,li-.5)*2.,2.)*(.5+exp(-d*5.));
  col=water+vec3(1.,.88,.65)*glint*1.5+uC2*path*exp(-d*6.)*.35;}
 gl_FragColor=vec4(finish(col),1.);`),
'cloud-drift':withHelpers(`float cloud(vec2 p,float t){vec2 w=vec2(fbm(p*.7+t),fbm(p*.7+vec2(4.,1.)-t));return fbm(p+w*1.4+vec2(t,0.));}`,
 `vec2 uv=gl_FragCoord.xy/uRes;vec2 p=vec2(uv.x*aspect(),uv.y)*vec2(1.8,2.6)*uScale;float t=uTime*.03;
 float c=cloud(p,t),c2=cloud(p+vec2(.06,.1),t);
 float cov=smoothstep(.42-.14*uAmount,.8,c);float lit=clamp((c-c2)*7.+.55,0.,1.);
 vec3 sky=mix(uC1,uC0,pow(uv.y,.8));
 vec3 cl=mix(uC2,uC3,lit);cl=mix(cl,uC2*.75,smoothstep(.55,1.,c)*(1.-lit)*.5);
 vec3 col=mix(sky,cl,cov);col+=uC3*exp(-length((uv-vec2(.2,.9))*vec2(aspect(),1.))*2.5)*.18;
 gl_FragColor=vec4(finish(col),1.);`),
'sunset-haze':ridgeShader(0.),
'misty-ridges':ridgeShader(1.),
'caustic-pool':main(`vec2 p=frag()*3.2*uScale;float t=uTime*.35,c=0.;
 for(int i=0;i<4;i++){float k=float(i);p=rot(1.1)*p*1.35+vec2(t*.6,-t*.4);
  c+=pow(1.-abs(sin(p.x+sin(p.y*1.3+t+k)*1.2)),3.5+uAmount*5.)*.5;}
 vec3 col=mix(uC0,uC1,.5+.5*sin(frag().x*2.+uTime*.1))+uC3*c*(.6+.5*uAmount)+uC2*c*c*.3;
 col*=.75+.35*fbm(frag()*2.5+t*.2);
 gl_FragColor=vec4(finish(col),1.);`),
'rain-glass':withHelpers(`vec3 city(vec2 uv){vec3 c=mix(uC0*.4,uC0,uv.y);for(int i=0;i<3;i++){float k=float(i);vec2 g=uv*vec2(aspect(),1.)*(5.+k*4.5)+vec2(k*7.3,uSeed);vec2 id=floor(g),f=fract(g)-.5;vec2 o=(hash22(id)-.5)*.6;float r=.2+.16*hash(id+3.);float m=smoothstep(r,r*.55,length(f-o))*step(.42,hash(id+9.));c+=ramp(hash(id+5.))*m*.8/(k*.5+1.);}return c;}`,
 `vec2 uv=gl_FragCoord.xy/uRes;vec2 duv=uv;float dr=0.;
 for(int i=0;i<3;i++){float k=float(i);float sc=7.+k*6.;vec2 g=vec2(uv.x*aspect(),uv.y)*sc+vec2(k*3.7,0.);
  float slide=uTime*(.05+hash(vec2(floor(g.x),k))*.12)*(.4+uAmount);g.y+=slide;
  vec2 id=floor(g),f=fract(g)-.5;vec2 o=(hash22(id+k)-.5)*.5;vec2 d=f-o;d.y*=.8;float r=.12+.18*hash(id+7.+k);float m=step(.64,hash(id+k*2.));
  float len=length(d);if(m>.5&&len<r){vec2 n=d/r;duv+=n*.16*(1.-len/r)*vec2(1.,1.2);dr+=smoothstep(.55,1.,len/r)*.5+.35;}}
 vec3 col=city(duv)*(.75+.7*clamp(dr,0.,1.));col+=uC3*clamp(dr-.4,0.,1.)*.3;col+=uC3*.03*fbm(uv*40.);
 gl_FragColor=vec4(finish(col),1.);`),
'snowfall':main(`vec2 uv=gl_FragCoord.xy/uRes;vec3 col=mix(uC1,uC0,uv.y);
 for(int i=0;i<5;i++){float k=float(i);float sc=(6.+k*6.)*uScale;vec2 p=vec2(uv.x*aspect(),uv.y)*sc;p.y+=uTime*(.4+k*.18);p.x+=sin(uTime*.5+k*2.+p.y*.6)*.35;
  vec2 id=floor(p),f=fract(p)-.5;vec2 o=(hash22(id+k*11.)-.5)*.55;float r=.1+.12*hash(id+3.);float m=smoothstep(r,r*.2,length(f-o))*step(.3-uAmount*.2,hash(id+k));
  col+=uC3*m*(1.-k*.15);}
 col+=uC2*exp(-abs(uv.y-.1)*6.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'pond-ripples':main(`vec2 p=frag()*2.6*uScale;float h=0.;
 for(int i=0;i<3;i++){float k=float(i);vec2 g=p*(1.+k*.6)+k*5.3+uSeed;vec2 id=floor(g),f=fract(g)-.5;
  float cyc=fract(uTime*(.18+.05*k)+hash(id));vec2 o=(hash22(id)-.5)*.5;float d=length(f-o),r=cyc*.55;
  h+=sin((d-r)*(44.-k*6.))*exp(-abs(d-r)*16.)*(1.-cyc)*step(.35,hash(id+2.));}
 h*=.5+uAmount;vec3 col=mix(uC0,uC1,.5+.5*frag().y)+uC2*max(h,0.)*.9-uC0*max(-h,0.)*.4+uC3*pow(max(h,0.),3.)*.8;
 gl_FragColor=vec4(finish(col),1.);`),
'meteor-night':main(`vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=mix(uC0,uC1,pow(1.-uv.y,2.5));
 vec2 cell=floor(gl_FragCoord.xy/2.);float st=step(.996,hash(cell+uSeed));col+=st*(.5+.5*sin(uTime*3.+hash(cell)*50.))*.8;
 float band=exp(-pow((uv.y-uv.x*.55-.12)*3.2,2.));col+=uC1*band*(.15+.5*fbm(vec2(uv.x*asp*3.,uv.y*3.)+8.));col+=uC2*band*.05;
 for(int i=0;i<4;i++){float k=float(i);float rate=.22+.04*k,tt=uTime*rate+k*.37;float cyc=floor(tt),ph=fract(tt);
  vec2 start=vec2(.45+hash(vec2(cyc+.37,k+.11))*.8,.8+hash(vec2(cyc+.71,k+9.3))*.25);vec2 dir=normalize(vec2(-.8,-.5));
  float travel=ph*1.3;vec2 head=start+dir*travel;
  vec2 a=(uv-head)*vec2(asp,1.),b=normalize(dir*vec2(asp,1.));float along=dot(a,b);float dist=length(a-b*clamp(along,-.3,0.));
  float tail=smoothstep(-.3,0.,along)*step(along,.006);float fade=sin(ph*3.14159);
  col+=mix(uC2,uC3,tail)*exp(-dist*110.)*tail*fade*2.6*(.5+uAmount);}
 gl_FragColor=vec4(finish(col),1.);`),
'dappled-light':main(`vec2 p=frag()*2.4*uScale;float t=uTime*.07;
 float n=fbm(p+vec2(t,-t*.7))+.6*fbm(p*2.1-vec2(t*1.3,t));
 float leaf=smoothstep(.78-uAmount*.15,1.12,n);
 vec3 shade=mix(uC0,uC1,fbm(p*3.+t));
 vec3 sun=mix(uC2,uC3,smoothstep(.85,1.25,n));
 vec3 col=mix(shade,sun,leaf);col+=uC2*pow(leaf,3.)*.18;col*=.75+.3*fbm(p*9.);
 gl_FragColor=vec4(finish(col),1.);`),
'lava-crust':main(`vec2 p=frag()*3.*uScale;float t=uTime*.1;p+=vec2(fbm(p+t),fbm(p+5.-t))*.5;
 vec3 v=voronoi(p+uSeed);float edge=v.y-v.x;
 float crack=1.-smoothstep(0.,.09+uAmount*.12,edge);
 float pulse=.75+.25*sin(uTime*.8+v.z*20.);
 vec3 crust=mix(uC0,uC1,fbm(p*4.)*1.2);
 vec3 heat=ramp(.45+crack*.55)*pulse;
 vec3 col=mix(crust,heat,crack);col+=uC3*crack*crack*.7;col+=uC2*exp(-edge*5.)*.12;
 gl_FragColor=vec4(finish(col),1.);`),
'dune-sea':withHelpers(`float dune(float x,float k){return .12+k*.13+.07*sin(x*1.5+k)+.035*sin(x*3.9+1.+k*2.)+.03*fbm(vec2(x*2.,k*5.+uSeed));}`,
 `vec2 uv=gl_FragCoord.xy/uRes;float asp=aspect();vec3 col=mix(uC3,uC2,pow(1.-uv.y,1.6));
 col+=vec3(1.,.9,.7)*smoothstep(.08,.05,length((uv-vec2(.78,.8))*vec2(asp,1.)))*.7;
 for(int i=0;i<5;i++){float d=1.-float(i)/4.;float k=4.-float(i);
  float x=uv.x*asp*uScale*(1.+d*.2)+uTime*.01*(1.-d)+k*2.3;
  float h=dune(x,d*4.),h2=dune(x+.03,d*4.);float slope=(h2-h)*30.;
  vec3 lc=mix(uC0,uC1,d);float lit=clamp(.5-slope*(.5+uAmount),0.,1.);lc=mix(lc*.55,mix(lc,uC2,.45),lit);
  lc=mix(lc,uC2,d*d*.45);col=mix(col,lc,smoothstep(h+.004,h-.004,uv.y));}
 gl_FragColor=vec4(finish(col),1.);`)
};
export const entries=[
 ['ocean-swell','Ocean Swell','Live nature','Blue','Open sea at golden hour, swells rolling towards you under a low sun.',['ocean','sea','sunset','waves'],['#071d33','#14577a','#ffb470','#4b87c4'],.9,1,.5,'Wave height'],
 ['cloud-drift','Cloud Drift','Live nature','Blue','Soft, lit cumulus drifting across a clear sky.',['clouds','sky','day'],['#3b86d6','#9ccbf2','#e9f4ff','#ffffff'],.8,1,.5,'Cloud cover'],
 ['sunset-haze','Sunset Haze','Live nature','Orange','Layered hills melting into a warm, hazy sunset.',['sunset','hills','landscape'],['#1b1226','#6a2f55','#ff9a62','#3d3a7a'],.8,1,.5,'Ruggedness'],
 ['misty-ridges','Misty Ridges','Live nature','Neutral','Quiet blue ridgelines fading into morning mist.',['mist','mountains','calm'],['#1f2f42','#51708d','#d6e1ec','#8fa9c0'],.8,1,.5,'Ruggedness'],
 ['caustic-pool','Caustic Pool','Live nature','Blue','Sunlight rippling on the floor of a clear pool.',['water','caustics','light'],['#05283d','#0c6a8e','#7fe3ff','#d4fbff'],1,1,.5,'Sharpness'],
 ['rain-glass','Rain on Glass','Live nature','Purple','City lights blurred behind a rain-streaked window.',['rain','glass','bokeh','night'],['#0c0a1e','#1b1f5c','#ff6fa8','#6fc8ff'],.9,1,.5,'Rain'],
 ['snowfall','Snowfall','Live nature','Neutral','Layers of snow drifting down through a blue dusk.',['snow','winter','calm'],['#0a1628','#1d3b63','#7fa8d6','#ffffff'],.9,1,.5,'Snow amount'],
 ['pond-ripples','Pond Ripples','Live nature','Green','Raindrops spreading slow rings across a still pond.',['ripples','water','calm'],['#06211f','#12625a','#7de8d0','#e8fff8'],.9,1,.5,'Ripple strength'],
 ['meteor-night','Meteor Night','Live nature','Blue','A clear night sky with twinkling stars and passing meteors.',['stars','meteor','night'],['#02030a','#0d1b44','#9fd0ff','#ffffff'],1,1,.5,'Meteor glow',1.82],
 ['dappled-light','Dappled Light','Live nature','Green','Sunlight filtering through moving leaves.',['leaves','forest','sunlight'],['#06190f','#14402a','#d8e87a','#fff6b8'],.8,1,.5,'Light gaps'],
 ['lava-crust','Lava Crust','Live nature','Orange','A cooling crust cracked open by glowing lava.',['lava','volcano','heat'],['#120805','#3a1a10','#ff5a14','#ffd060'],.8,1,.5,'Crack width'],
 ['dune-sea','Dune Sea','Live nature','Orange','Layered desert dunes lit from the side.',['desert','dunes','warm'],['#3a1d12','#a8582c','#f2b66b','#ffe1b0'],.8,1,.5,'Light contrast']
];
