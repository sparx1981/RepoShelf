// Shared GLSL prelude for Studio's live backgrounds: uniforms, noise, Voronoi, SDF helpers and palette ramp.
export const PRELUDE=`precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uScale;uniform float uAmount;uniform float uSeed;uniform vec2 uPointer;
uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return v;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 ramp(float t){t=clamp(t,0.,1.)*3.;if(t<1.)return mix(uC0,uC1,t);if(t<2.)return mix(uC1,uC2,t-1.);return mix(uC2,uC3,t-2.);}
vec2 frag(){return (gl_FragCoord.xy-.5*uRes)/uRes.y;}
float aspect(){return uRes.x/uRes.y;}
vec3 finish(vec3 c){return clamp(c+(hash(gl_FragCoord.xy+fract(uTime))-.5)/180.,0.,1.);}
vec2 hash22(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
vec3 voronoi(vec2 p){vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.,id=0.;for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));vec2 r=g+hash22(n+g)-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=hash(n+g);}else if(d<d2){d2=d;}}}return vec3(sqrt(d1),sqrt(d2),id);}
float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
float rect(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
`;
export const main=body=>PRELUDE+'void main(){'+body+'}';
export const withHelpers=(helpers,body)=>PRELUDE+helpers+'\nvoid main(){'+body+'}';
