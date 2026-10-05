import {writeFile,rename} from 'node:fs/promises';
// Serialize snapshots so concurrent workers cannot overwrite newer progress.
export function checkpointWriter(files,snapshots,{interval=10000,now=Date.now}={}){
 let pending=Promise.resolve(),savedAt=-Infinity;
 return (force=false)=>{if(!force&&now()-savedAt<interval)return pending;savedAt=now();const contents=snapshots.map(s=>JSON.stringify(s,null,2)+'\n');
  const next=pending.then(async()=>{for(let i=0;i<files.length;i++){const temporary=new URL(files[i]);temporary.pathname+='.browser-tmp';await writeFile(temporary,contents[i]);await rename(temporary,files[i])}});
  pending=next.catch(()=>{});return next;
 };
}
