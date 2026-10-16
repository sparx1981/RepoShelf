// Shared scroll-demo helper. Pasted into each scroll component so every one stays standalone.
// It drives a scroll box: calls fn(progress, scrollTop, maxScroll, time) every frame, ping-pongs the scroll position
// by itself until the visitor touches the box, and resumes a few seconds after they stop.
export const SB=`function ScrollDemo(box,fn,opt){
 var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,auto=!reduce,dir=1,vis=true,raf=0,last=0,resumeT=0,pause=0,SP=(opt&&opt.speed)||.075;
 function max(){return Math.max(1,box.scrollHeight-box.clientHeight)}
 function run(now){var m=max();fn(box.scrollTop/m,box.scrollTop,m,now)}
 function frame(now){raf=0;var dt=Math.min(40,now-(last||now));last=now;
  if(auto&&now>pause){var m=max();box.scrollTop+=dir*dt*SP;if(box.scrollTop>=m-1){dir=-1;pause=now+1100}else if(box.scrollTop<=0){dir=1;pause=now+1100}}
  run(now);if(vis)raf=requestAnimationFrame(frame)}
 function go(){if(!raf&&vis&&!reduce){last=0;raf=requestAnimationFrame(frame)}}
 function user(){auto=false;clearTimeout(resumeT);if(!reduce)resumeT=setTimeout(function(){auto=true},4000)}
 ['wheel','touchstart','pointerdown','keydown'].forEach(function(e){box.addEventListener(e,user,{passive:true})});
 box.addEventListener('scroll',function(){if(reduce)run(performance.now())},{passive:true});
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;go()}).observe(box);
 addEventListener('resize',function(){run(performance.now())});
 run(performance.now());go();return {run:function(){run(performance.now())}}}`;
