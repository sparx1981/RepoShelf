// Original RepoShelf WebGL runner for Studio's live backgrounds.
// `createRunner` is deliberately self-contained: Studio embeds its source in HTML and React
// exports, so it must not reference anything outside its own body.
export function createRunner(canvas,fragment,options){
 const o=options||{},gl=canvas.getContext('webgl',{antialias:false,alpha:false,preserveDrawingBuffer:!!o.keep});
 if(!gl)return null;
 const hex=v=>{const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(v||'');return m?[parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255]:[0,0,0]};
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'Shader failed to compile');return s};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Shader failed to link');
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 const at=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
 const u={};for(const name of ['uRes','uTime','uScale','uAmount','uSeed','uPointer','uC0','uC1','uC2','uC3'])u[name]=gl.getUniformLocation(program,name);
 let params={colors:['#000000','#444444','#aaaaaa','#ffffff'],speed:1,scale:1,amount:.5,seed:1,...(o.params||{})};
 let clock=o.time||0,last=0,frame=0,running=false,visible=true,pointer=[.5,.5],target=[.5,.5],observer=null,quality=1,slow=0,fast=0;
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)');
 function size(){const ratio=Math.min(o.maxRatio||2,window.devicePixelRatio||1)*quality,w=Math.max(2,Math.round((canvas.clientWidth||canvas.width)*ratio)),h=Math.max(2,Math.round((canvas.clientHeight||canvas.height)*ratio));if(!o.fixed&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h}gl.viewport(0,0,canvas.width,canvas.height)}
 function draw(time){
  if(typeof time==='number')clock=time;
  size();
  gl.uniform2f(u.uRes,canvas.width,canvas.height);gl.uniform1f(u.uTime,clock);
  gl.uniform1f(u.uScale,params.scale);gl.uniform1f(u.uAmount,params.amount);gl.uniform1f(u.uSeed,params.seed);
  gl.uniform2f(u.uPointer,pointer[0],pointer[1]);
  for(let i=0;i<4;i++){const c=hex(params.colors[i]||params.colors[params.colors.length-1]);gl.uniform3f(u['uC'+i],c[0],c[1],c[2])}
  gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function tick(now){
  frame=0;if(!running)return;
  const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
  if(!o.fixed&&o.adaptive!==false&&dt>0){if(dt>.028){slow++;fast=0;if(slow>=20&&quality>.45){quality=Math.max(.45,quality*.85);slow=0}}else if(dt<.02){fast++;slow=0;if(fast>=240&&quality<1){quality=Math.min(1,quality*1.1);fast=0}}else{slow=0;fast=0}}
  clock+=dt*params.speed;pointer[0]+=(target[0]-pointer[0])*Math.min(1,dt*6);pointer[1]+=(target[1]-pointer[1])*Math.min(1,dt*6);
  draw();frame=requestAnimationFrame(tick);
 }
 function schedule(){cancelAnimationFrame(frame);frame=0;last=0;if(running&&visible&&!(reduce&&reduce.matches)&&!document.hidden)frame=requestAnimationFrame(tick);else draw()}
 function move(e){const r=canvas.getBoundingClientRect();target=[Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,1-(e.clientY-r.top)/r.height))]}
 if(o.pointer!==false){canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',()=>{target=[.5,.5]})}
 if(typeof IntersectionObserver==='function'){observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);schedule()});observer.observe(canvas)}
 const onVisibility=()=>schedule();document.addEventListener('visibilitychange',onVisibility);
 if(reduce&&reduce.addEventListener)reduce.addEventListener('change',schedule);
 return {
  set(next){params={...params,...next};if(!running)draw()},
  get:()=>({...params}),
  draw,
  start(){running=true;schedule()},
  stop(){running=false;schedule()},
  time:()=>clock,
  quality:()=>quality,
  destroy(){running=false;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',onVisibility);if(observer)observer.disconnect()},
  release(){this.destroy();const lose=gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext()}
 };
}
