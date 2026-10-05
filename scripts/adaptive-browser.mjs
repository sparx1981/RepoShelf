import {readFile} from 'node:fs/promises';
import {freemem,totalmem,availableParallelism,loadavg} from 'node:os';

export async function browserResources(){
 let available=freemem(),ratio=1-available/totalmem(),source='host';
 try{const [limit,current]=await Promise.all(['memory.max','memory.current'].map(name=>readFile('/sys/fs/cgroup/'+name,'utf8')));const max=Number(limit),used=Number(current);if(Number.isFinite(max)&&max>0&&Number.isFinite(used)){available=Math.min(available,Math.max(0,max-used));ratio=Math.max(ratio,used/max);source='cgroup'}}catch{}
 return {availableMB:Math.floor(available/1048576),memoryRatio:ratio,cpuRatio:loadavg()[0]/Math.max(1,availableParallelism()),source};
}
export function adaptiveBrowsers({max=4,initial=2}={}){
 let limit=Math.min(max,initial),recent=[],since=0;const changes=[];
 function observe(result,resources={}){
  recent.push(['probe_timeout','probe_failed','probe_start_failed','probe_error'].includes(result.reason));if(recent.length>20)recent.shift();since++;
  const timeoutRate=recent.filter(Boolean).length/recent.length,previous=limit;
  if(resources.memoryRatio>=.9||resources.availableMB<384)limit=1;
  else if(resources.memoryRatio>=.8||resources.cpuRatio>1.5||recent.length>=10&&timeoutRate>=.25)limit=Math.max(1,limit-1);
  else if(since>=10&&timeoutRate<.1&&resources.availableMB>=768&&resources.cpuRatio<=1.2)limit=Math.min(max,limit+1);
  if(limit!==previous){since=0;changes.push({from:previous,to:limit,reason:limit<previous?'pressure_or_timeouts':'healthy_throughput'});if(changes.length>20)changes.shift()}
  return limit;
 }
 return {observe,get limit(){return limit},summary:()=>({limit,max,changes:[...changes]})};
}
