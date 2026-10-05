const DAY=86400000;
export function discoveryQueries(now=Date.now()){
 const seeds=['demo in:readme','playground in:readme','"live preview" in:readme','"try online" in:readme','topic:live-demo','topic:demo','"demo" topic:react','"demo" topic:threejs','"demo" topic:nextjs','"demo" topic:svelte','"demo" topic:vue','"demo" topic:python'];
 const ranges=['stars:>=1000','stars:100..999','stars:10..99','stars:1..9','stars:0'];
 const year=new Date(now).getUTCFullYear(),queries=seeds.flatMap(seed=>ranges.map(range=>`${seed} ${range}`));
 // Low-star and recent projects get independent partitions instead of always
 // falling behind GitHub's first 1,000 high-star matches.
 for(let y=2020;y<=year;y++)for(const seed of seeds.slice(0,5))queries.push(`${seed} stars:<100 created:${y}-01-01..${y}-12-31`);
 queries.push(...seeds.slice(0,5).map(seed=>`${seed} created:>=${new Date(now-90*DAY).toISOString().slice(0,10)}`));
 return queries.map(q=>q+' is:public archived:false fork:false');
}
export function searchRotation(saved={},now=Date.now(),maxPages=10){
 const queries=discoveryQueries(now),state={schema:1,cursor:Number.isSafeInteger(saved.cursor)?saved.cursor%queries.length:0,pages:{...saved.pages},nextAllowedAt:saved.nextAllowedAt||null,cooldown:saved.cooldown||null};
 let visited=0;
 return {state,next(){if(visited++>=queries.length)return null;const q=queries[state.cursor];state.cursor=(state.cursor+1)%queries.length;return {q,page:Math.max(1,Math.min(maxPages,Number(state.pages[q])||1)),sort:Math.floor(now/(2*3600000))%2?'updated':'stars'}},complete(task,data){state.pages[task.q]=(data.items||[]).length===100&&task.page<maxPages&&task.page*100<Math.min(data.total_count||0,1000)?task.page+1:1;},retry(task){state.cursor=(state.cursor+queries.length-1)%queries.length;},finish(){const keep=new Set(queries);for(const q of Object.keys(state.pages))if(!keep.has(q))delete state.pages[q];return state;}};
}
export function searchCooldown(error,now=Date.now()){
 const remaining=Number(error.rateRemaining),reset=Number(error.rateReset)*1000,after=Number(error.retryAfter)*1000;
 const primary=error.rateRemaining!==null&&error.rateRemaining!==undefined&&remaining===0;
 const delay=Number.isFinite(after)&&after>0?after:primary&&Number.isFinite(reset)&&reset>now?reset-now:5*60000;
 return {reason:error.status===401?'authentication':primary?'primary_rate_limit':'secondary_rate_limit',nextAllowedAt:new Date(now+Math.max(60000,delay)+1000).toISOString(),remaining:error.rateRemaining??null};
}
