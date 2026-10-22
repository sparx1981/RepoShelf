(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./taxonomy.js'));else root.RepoEditorial=factory(root.RepoTaxonomy)})(globalThis,function(T){
'use strict';
const categories=[...T.broadCategories,...T.subjects];
const picks=['excalidraw/excalidraw','tldraw/tldraw','hoppscotch/hoppscotch','CorentinTh/it-tools','actualbudget/actual','twentyhq/twenty','drawdb-io/drawdb','AmruthPillai/Reactive-Resume','monkeytypegame/monkeytype','benweet/stackedit','AppFlowy-IO/AppFlowy','calcom/cal.com'];
const modes={reposhelf:'Popular on RepoShelf',manual:'My selection',popular:'Popular',trending:'Trending',newest:'Newest',random:'Random each page load',daily:'Daily shuffle (UTC)',community:'Community interest',trendshift:'Trending on Trendshift',releases:'Recent releases'};
function defaults(){const base=[['hero','In the spotlight','Featured projects to explore.','manual','',picks],['picks','Editor’s picks','','manual','',picks],['community','Community discoveries','Recent repository discussions on Hacker News and Bluesky. Ranked by community interest and recency.','community','',[]],['releases','Popular recent releases','Published GitHub releases from the last 30 days.','releases','',[]],['trending','Trending now','Measured growth in stars and forks, with a lift for repositories on Trendshift or GitHub trending lists.','trending','',[]],...T.broadCategories.map(category=>['category:'+category.toLowerCase().replace(/[^a-z0-9]+/g,'-'),category,'','popular',category,[]])];base.push(['reposhelf','Popular on RepoShelf','Most opened listings on RepoShelf in the last 30 days.','reposhelf','',[]]);base.push(...T.subjects.map(subject=>['category:'+subject.toLowerCase().replace(/[^a-z0-9]+/g,'-'),subject,'','popular',subject,[]]));
// Appended last so every earlier built-in ribbon keeps its identifier; its position places it straight after Trending now.
base.push(['trendshift','Trending on Trendshift','Repositories on Trendshift’s daily, weekly and monthly lists or GitHub’s daily trending list in the last few days. Ranked by list position and recency.','trendshift','',[]]);return base.map(([builtin_key,title,description,mode,category,items],i)=>({id:'e0000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),builtin_key,title,description,mode,category,items:[...items],enabled:true,shuffle:'off',position:builtin_key==='trendshift'?-96:i-100,revision:0}))}
const xRibbonKey='category:as-seen-on-x-com';
function visible(row,customRows=false){return row.enabled&&(row.builtin_key===xRibbonKey||(customRows?!row.builtin_key?.startsWith('category:'):Boolean(row.builtin_key)))}
function resolve(rows=[],fill=true){const keys=new Set(rows.map(r=>r.builtin_key).filter(Boolean)),missing=defaults().filter(r=>!keys.has(r.builtin_key)&&(fill||r.builtin_key===xRibbonKey&&keys.size));const result=[...missing,...rows];const added=missing.find(r=>r.builtin_key===xRibbonKey);if(added){const positions=result.filter(r=>r.builtin_key!=='hero'&&r!==added).map(r=>r.position||0);added.position=(positions.length?Math.min(...positions):0)-1}return result.map(r=>({...r,shuffle:['load','daily'].includes(r.shuffle)?r.shuffle:'off',description:String(r.description||'').replace('Popularity within each source: GitHub stars and forks, or Space likes.','').replace('Each card shows its observation window.','').replace('A small selection chosen for what you can build.','').trim()})).sort((a,b)=>(a.position||0)-(b.position||0)||a.id.localeCompare(b.id))}
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return h>>>0}
function shuffle(items,{mode='random',seed='',row='',now=Date.now()}={}){const salt=row+':'+(mode==='daily'?new Date(now).toISOString().slice(0,10):seed);return [...items].sort((a,b)=>hash(salt+':'+a.full.toLowerCase())-hash(salt+':'+b.full.toLowerCase())||a.full.localeCompare(b.full))}
const shuffles={off:'No shuffle',load:'Random each page load',daily:'Daily shuffle (UTC)'};
// Shuffling only changes the ORDER of a row's listings, never which ones it shows. A ranked row first takes its top
// listings (what the row's ranking picks), then shuffles those same listings. A row of hand-picked listings shuffles all
// its picks. Rows set to the older "random" or "daily" sources already draw from every listing and are left alone.
function arrange(items,row,{seed='',now=Date.now(),limit=12,manual=false}={}){
 if(!['load','daily'].includes(row.shuffle)||['random','daily'].includes(row.mode))return items;
 return shuffle(manual?items:items.slice(0,limit),{mode:row.shuffle==='daily'?'daily':'random',seed,row:row.id,now});
}
// The spotlight shows five projects a day (UTC): two from the hand-picked list, two of the best established listings and one rising newcomer.
// Each list steps through in its own shuffled order and only starts repeating once it has been used up, so neighbouring days differ.
function spotlight(items,[pinned,best,rising]=[items.length,0,0],{now=Date.now(),slots=[2,2,1]}={}){
 const day=Math.floor(now/86400000),lists=[items.slice(0,pinned),items.slice(pinned,pinned+best),items.slice(pinned+best,pinned+best+rising)],seen=new Set(),picks=lists.map(()=>[]);
 let spare=0;
 lists.forEach((list,k)=>{const want=slots[k];let got=0;
  for(let t=0,tries=0;got<want&&list.length&&tries<list.length*2+want;t++,tries++){
   const index=day*slots[k]+t,cycle=Math.floor(index/list.length),order=[...list].sort((a,b)=>hash(k+':'+cycle+':'+a.full.toLowerCase())-hash(k+':'+cycle+':'+b.full.toLowerCase())),item=order[index%list.length];
   if(seen.has(item.full))continue;seen.add(item.full);picks[k].push(item);got++}
  spare+=want-got});
 // A short list hands its unused places to the next list that still has listings.
 for(let k=0;spare>0&&k<3;k++)for(const item of lists[k]){if(spare<=0)break;if(!seen.has(item.full)){seen.add(item.full);picks[k].push(item);spare--}}
 const [a,b,c]=picks;return [a[0],c[0],b[0],a[1],b[1],...a.slice(2),...b.slice(2),...c.slice(1)].filter(Boolean);
}
return {categories,subjects:T.subjects,categoryNames:T.names,matchesCategory:T.matches,picks,modes,shuffles,defaults,resolve,visible,xRibbonKey,shuffle,arrange,spotlight};
});
