import {createRunner} from './live-runner.mjs';
import {liveFragment,liveParams,liveHTML,liveReact} from './live-shaders.mjs';
// Editor controller for the live (WebGL) backgrounds shown in Studio's Backgrounds tab.
export function liveTool({change,status}){
 const $=id=>document.getElementById(id),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let runner=null,item=null,params=null,playing=true;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function fresh(){const old=$('background-live'),canvas=document.createElement('canvas');canvas.id='background-live';canvas.setAttribute('aria-label',old.getAttribute('aria-label'));canvas.width=960;canvas.height=540;old.replaceWith(canvas);return canvas}
 function sync(){
  $('live-speed').value=params.speed;$('live-scale').value=params.scale;$('live-amount').value=params.amount;
  $('live-speed-value').textContent=params.speed+'×';$('live-scale-value').textContent=params.scale+'×';
  $('live-amount-label').textContent=item.amountLabel||'Detail';
  const holder=$('live-colours');holder.replaceChildren();
  params.colors.forEach((colour,i)=>{const label=document.createElement('label'),input=document.createElement('input');label.className='studio-field';label.append('Colour '+(i+1));input.type='color';input.value=colour;input.setAttribute('aria-label','Colour '+(i+1));input.oninput=()=>{params.colors[i]=input.value;apply()};label.append(input);holder.append(label)});
  $('live-play').disabled=reduce.matches;$('live-play').textContent=reduce.matches?'Reduced motion enabled':playing?'Pause animation':'Play animation';$('live-play').setAttribute('aria-pressed',String(playing&&!reduce.matches));
 }
 function apply(){if(runner)runner.set(params);change()}
 function open(next,saved){
  close();item=next;params=liveParams(next.id,saved);playing=true;
  const canvas=fresh();canvas.hidden=false;$('background-canvas').hidden=true;$('live-controls').hidden=false;
  try{runner=createRunner(canvas,liveFragment(next.id),{params})}catch(error){runner=null;status('This live background could not start: '+error.message,true)}
  if(!runner)status('Live backgrounds need WebGL, which this browser or device has turned off.',true);else runner.start();
  sync();
 }
 function close(){if(runner){runner.release?.();runner=null}item=null;params=null;$('background-live').hidden=true;$('background-canvas').hidden=false;$('live-controls').hidden=true}
 for(const key of ['speed','scale','amount'])$('live-'+key).oninput=e=>{if(!params)return;params={...params,[key]:Number(e.target.value)};params=liveParams(item.id,params);sync();apply()};
 $('live-play').onclick=()=>{if(!runner)return;playing=!playing;playing?runner.start():runner.stop();sync()};
 $('live-shuffle').onclick=()=>{if(!params)return;params={...params,seed:Math.floor(Math.random()*999)};apply();status('Pattern shuffled.')};
 $('live-reset').onclick=()=>{if(!item)return;params=liveParams(item.id);sync();apply()};
 reduce.addEventListener('change',()=>{if(item)sync()});
 function png(width=1920){
  return new Promise((resolve,reject)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*9/16);
   let frame;try{frame=createRunner(canvas,liveFragment(item.id),{fixed:true,keep:true,pointer:false,params,time:runner?runner.time():6.5})}catch(error){return reject(error)}
   if(!frame)return reject(Error('PNG export needs WebGL.'));frame.draw();canvas.toBlob(blob=>{frame.release?.();blob?resolve(blob):reject(Error('The image could not be created.'))},'image/png')});
 }
 return {open,close,png,get:()=>params&&item?{...params,colors:[...params.colors]}:null,isDefault:()=>item&&params?same(params,liveParams(item.id)):true,
  html:()=>liveHTML(item.id,params),react:()=>liveReact(item.id,params),active:()=>Boolean(item)};
}
