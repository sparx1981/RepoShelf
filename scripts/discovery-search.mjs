const DAY=86400000;
export function discoveryQueries(now=Date.now()){
 const seeds=['demo in:readme','playground in:readme','"live preview" in:readme','"try online" in:readme','topic:live-demo','topic:demo','topic:webapp','topic:pwa','"live demo" in:readme','"demo" topic:react','"demo" topic:threejs','"demo" topic:nextjs','"demo" topic:svelte','"demo" topic:vue','"demo" topic:python','topic:github-pages','topic:netlify','topic:vercel','topic:streamlit','topic:gradio','"vercel.app" in:readme','"netlify.app" in:readme','"github.io" in:readme','"streamlit.app" in:readme','"pages.dev" in:readme'];
 const ranges=['stars:>=1000','stars:100..999','stars:10..99','stars:1..9','stars:0'];
 const year=new Date(now).getUTCFullYear(),queries=seeds.flatMap(seed=>ranges.map(range=>`${seed} ${range}`));
 // Low-star and recent projects get independent partitions instead of always
 // falling behind GitHub's first 1,000 high-star matches.
 for(let y=2020;y<=year;y++)for(const seed of seeds.slice(0,5))queries.push(`${seed} stars:<100 created:${y}-01-01..${y}-12-31`);
 queries.push(...seeds.slice(0,5).map(seed=>`${seed} created:>=${new Date(now-90*DAY).toISOString().slice(0,10)}`));
 return queries.map(q=>q+' is:public archived:false fork:false');
}
// Focus searches for subjects RepoShelf wants more of: interactive simulations of sand, dust, fluid, water, smoke, gas, clouds, light and
// other physical systems. The general rotation (165 queries, 40 a run) reaches any one query only about every four weeks, so focus queries
// have their own cursor and the first FOCUS_PER_RUN searches of every sync. Each seed is split into two star bands; low-yield queries are
// rested for a week by the same rule as the general rotation, so a seed that finds nothing new stops costing searches.
export const FOCUS_SEEDS=['topic:fluid-simulation','topic:physics-simulation','topic:falling-sand','topic:cellular-automata','topic:particle-system','topic:smoke-simulation','topic:cloth-simulation','topic:n-body','topic:boids','topic:raytracing','topic:path-tracing','topic:reaction-diffusion','"falling sand" in:readme','"fluid simulation" demo','"water simulation" demo','"smoke simulation" demo','"sand simulation" demo','"particle simulation" demo','"gas simulation" in:readme','"volumetric clouds" in:readme','"cloud simulation" in:readme','"light simulation" in:readme','"ocean simulation" demo','"physics sandbox" demo'];
export const FOCUS_PER_RUN=16;
export function focusQueries(){return FOCUS_SEEDS.flatMap(seed=>['stars:>=10','stars:<10'].map(range=>`${seed} ${range} is:public archived:false fork:false`))}
export function searchRotation(saved={},now=Date.now(),maxPages=10,{focusPerRun=FOCUS_PER_RUN}={}){
 const queries=discoveryQueries(now),focus=focusQueries();
 const state={schema:1,cursor:Number.isSafeInteger(saved.cursor)?saved.cursor%queries.length:0,focusCursor:Number.isSafeInteger(saved.focusCursor)?saved.focusCursor%focus.length:0,pages:{...saved.pages},yield:{...saved.yield},nextAllowedAt:saved.nextAllowedAt||null,cooldown:saved.cooldown||null};
 const used=new Set(),resting=q=>Date.parse(state.yield[q]?.nextExploreAt)>now;let visited=0,focusServed=0;
 const task=q=>({q,page:Math.max(1,Math.min(maxPages,Number(state.pages[q])||1)),sort:Math.floor(now/(2*3600000))%2?'updated':'stars'});
 // Advances a cursor past used or resting queries; returns the first usable query, or null after one full lap.
 function take(list,key){for(let i=0;i<list.length;i++){const q=list[state[key]];state[key]=(state[key]+1)%list.length;if(!used.has(q)&&!resting(q))return q}return null}
 return {state,
  next(){if(visited++>=queries.length+focus.length)return null;
   if(focusServed<focusPerRun){const q=take(focus,'focusCursor');if(q){focusServed++;used.add(q);return task(q)}focusServed=focusPerRun}
   const q=take(queries,'cursor');if(!q)return null;used.add(q);return task(q)},
  complete(task,data){state.pages[task.q]=(data.items||[]).length===100&&task.page<maxPages&&task.page*100<Math.min(data.total_count||0,1000)?task.page+1:1},
  observe(task,result){const previous=state.yield[task.q]||{},inspected=Number(result.inspected)||0,added=Number(result.added)||0;const empty=added===0?(previous.emptyRuns||0)+1:0;state.yield[task.q]={inspected:(previous.inspected||0)+inspected,found:(previous.found||0)+(result.found||0),added:(previous.added||0)+added,runs:(previous.runs||0)+1,emptyRuns:empty,lastRunAt:new Date(now).toISOString(),nextExploreAt:empty>=3?new Date(now+7*DAY).toISOString():null};
   // A productive query with more pages runs again straight away.
   if(added>=10&&task.page<maxPages&&state.pages[task.q]>1){const f=focus.indexOf(task.q);if(f>=0){state.focusCursor=f;focusServed--}else state.cursor=queries.indexOf(task.q);used.delete(task.q)}},
  retry(task){used.delete(task.q);const f=focus.indexOf(task.q);if(f>=0){state.focusCursor=f;focusServed--}else state.cursor=queries.indexOf(task.q)},
  finish(){const keep=new Set([...queries,...focus]);for(const q of Object.keys(state.pages))if(!keep.has(q))delete state.pages[q];for(const q of Object.keys(state.yield))if(!keep.has(q))delete state.yield[q];return state}};
}
export function searchCooldown(error,now=Date.now()){
 const remaining=Number(error.rateRemaining),reset=Number(error.rateReset)*1000,after=Number(error.retryAfter)*1000;
 const primary=error.rateRemaining!==null&&error.rateRemaining!==undefined&&remaining===0;
 const delay=Number.isFinite(after)&&after>0?after:primary&&Number.isFinite(reset)&&reset>now?reset-now:5*60000;
 return {reason:error.status===401?'authentication':primary?'primary_rate_limit':'secondary_rate_limit',nextAllowedAt:new Date(now+Math.max(60000,delay)+1000).toISOString(),remaining:error.rateRemaining??null};
}
