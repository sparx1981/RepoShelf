import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function createDemoPool({max=4,script=new URL('./demo-worker.mjs',import.meta.url),spawnWorker=spawn,killWorker=child=>process.kill(process.platform==='win32'?child.pid:-child.pid,'SIGKILL')}={}){
 const workers=new Set();let sequence=0,closed=false,starts=0,restarts=0,browserLaunches=0,contexts=0;
 const env=Object.fromEntries(['PATH','HOME','USER','LANG','TMPDIR','PLAYWRIGHT_BROWSERS_PATH','CI'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
 function retire(worker,reason='probe_failed'){
  if(!workers.delete(worker))return;
  try{killWorker(worker.child)}catch{}
  if(worker.pending){restarts++;worker.pending.finish({kind:'temporary',reason})}
 }
 function start(){
  const child=spawnWorker(process.execPath,[fileURLToPath(script)],{env,stdio:['pipe','pipe','ignore'],detached:process.platform!=='win32'}),worker={child,pending:null,buffer:''};workers.add(worker);starts++;
  child.stdout.on('data',chunk=>{
   worker.buffer+=chunk;if(worker.buffer.length>32768)return retire(worker,'probe_invalid_output');
   let index;while((index=worker.buffer.indexOf('\n'))>=0){const line=worker.buffer.slice(0,index);worker.buffer=worker.buffer.slice(index+1);try{const message=JSON.parse(line);if(!worker.pending||message.id!==worker.pending.id||!['working','unavailable','temporary'].includes(message.result?.kind))throw Error('Invalid result');if(Number.isSafeInteger(message.stats?.browserLaunches)&&message.stats.browserLaunches>=0){browserLaunches+=Math.max(0,message.stats.browserLaunches-(worker.launches||0));worker.launches=message.stats.browserLaunches}if(Number.isSafeInteger(message.stats?.contexts)&&message.stats.contexts>=0){contexts+=Math.max(0,message.stats.contexts-(worker.contexts||0));worker.contexts=message.stats.contexts}worker.pending.finish(message.result)}catch{return retire(worker,'probe_invalid_output')}}
  });
  child.on('error',()=>retire(worker,'probe_start_failed'));child.on('close',()=>retire(worker,'probe_failed'));child.stdin.on('error',()=>retire(worker,'probe_failed'));return worker;
 }
 async function probe(input,{timeout=35000}={}){
  if(closed)throw Error('Browser pool closed');
  const worker=[...workers].find(w=>!w.pending)||(workers.size<max?start():null);if(!worker)throw Error('Browser pool capacity exceeded');
  return new Promise(resolve=>{const id=++sequence,timer=setTimeout(()=>retire(worker,'probe_timeout'),Math.max(1,timeout));worker.pending={id,finish(result){if(worker.pending?.id!==id)return;clearTimeout(timer);worker.pending=null;resolve(result)}};
   try{worker.child.stdin.write(JSON.stringify({id,input})+'\n')}catch{retire(worker,'probe_failed')}
  });
 }
 function trim(limit){for(const w of workers){if(workers.size<=limit)break;if(!w.pending)retire(w)}}
 function close(){closed=true;for(const w of [...workers])retire(w,'probe_cancelled')}
 return {probe,trim,close,stats:()=>({workers:workers.size,workerStarts:starts,workerRestarts:restarts,browserLaunches,contexts})};
}
