// Worker time is shared proportionally while both queues have work. An empty
// queue lends all its capacity to the other. Every project is visited once.
export async function runBrowserQueues(queues,work,{deadline,now=Date.now,concurrency=()=>4,weights={previews:3,health:2},onTick=()=>{}}={}){
 const cursors={previews:0,health:0},spent={previews:0,health:0},reserved={previews:0,health:0},visited=new Set(),active=new Set();let failure=null;
 function take(){
  const due=[];
  for(const name of ['previews','health']){while(cursors[name]<queues[name].length&&visited.has(queues[name][cursors[name]].full.toLowerCase()))cursors[name]++;if(cursors[name]<queues[name].length)due.push(name)}
  if(!due.length)return null;
  due.sort((a,b)=>(spent[a]+reserved[a]*1000)/weights[a]-(spent[b]+reserved[b]*1000)/weights[b]);
  const name=due[0],project=queues[name][cursors[name]++];visited.add(project.full.toLowerCase());reserved[name]++;return {name,project};
 }
 try{while(!failure&&now()<deadline){
  let dispatched=false;
  while(active.size<Math.max(1,concurrency())&&now()<deadline){const job=take();if(!job)break;dispatched=true;const started=now();let task;
   task=Promise.resolve().then(()=>work(job.project,job.name,deadline)).catch(e=>{failure=e}).finally(()=>{spent[job.name]+=Math.max(1,now()-started);reserved[job.name]--;active.delete(task)});active.add(task);
  }
  if(!active.size)break;
  await Promise.race([...active,new Promise(resolve=>setTimeout(resolve,1000))]);await onTick({spent,active:active.size});
 }}finally{await Promise.allSettled([...active])}
 if(failure)throw failure;
 return {attempted:visited.size,workerTimeMs:spent};
}
