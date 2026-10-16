// Shared stage helper for the cursor-effect demos. It is pasted into every component so each one stays standalone.
export const BOOT=`var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function Stage(root,cv,draw,resize){
 var s={W:0,H:0,dpr:1,x:0,y:0,vx:0,vy:0,px:0,py:0,inside:false,down:false,t:0,dt:16,ctx:cv.getContext('2d'),click:null,first:true},raf=0,visible=true,last=0,until=0;
 function size(){s.dpr=Math.min(2,window.devicePixelRatio||1);s.W=cv.clientWidth;s.H=cv.clientHeight;cv.width=Math.round(s.W*s.dpr);cv.height=Math.round(s.H*s.dpr);s.ctx.setTransform(s.dpr,0,0,s.dpr,0,0);if(resize)resize(s);s.first=true}
 function frame(now){raf=0;s.dt=Math.min(48,now-(last||now-16));last=now;s.t=now;var tx,ty;
  if(s.inside){tx=s.px;ty=s.py}else{tx=s.W*(.5+.34*Math.sin(now*.00071)+.1*Math.sin(now*.0023));ty=s.H*(.5+.3*Math.sin(now*.00097+1)+.08*Math.cos(now*.0021))}
  if(s.first){s.x=tx;s.y=ty;s.first=false}
  s.vx=tx-s.x;s.vy=ty-s.y;s.x=tx;s.y=ty;draw(s);
  if(visible&&(!reduce||now<until))raf=requestAnimationFrame(frame)}
 function go(){if(!raf&&visible){last=0;raf=requestAnimationFrame(frame)}}
 function poke(){until=performance.now()+900;go()}
 function at(e){var r=cv.getBoundingClientRect();s.px=e.clientX-r.left;s.py=e.clientY-r.top;s.inside=true}
 root.addEventListener('pointermove',function(e){at(e);if(reduce)poke()});
 root.addEventListener('pointerleave',function(){s.inside=false;s.down=false});
 root.addEventListener('pointerdown',function(e){at(e);s.down=true;if(s.click)s.click(s.px,s.py);if(reduce)poke()});
 root.addEventListener('pointerup',function(){s.down=false});
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)go()}).observe(root);
 if('ResizeObserver' in window){var lw=0;new ResizeObserver(function(){if(cv.clientWidth&&cv.clientWidth!==lw){lw=cv.clientWidth;size();go()}}).observe(cv)}else{size();go()}
 if(!reduce)go();else poke();
 return s}`;
