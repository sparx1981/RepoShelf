export async function previewWorkers(items,work,{concurrency=3,deadline=Infinity,now=Date.now}={}){
 let cursor=0;const results=await Promise.allSettled(Array.from({length:Math.max(1,Math.min(3,concurrency))},async()=>{while(cursor<items.length&&now()<deadline)await work(items[cursor++])}));
 const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
 return cursor;
}
