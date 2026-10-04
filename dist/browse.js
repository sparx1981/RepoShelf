(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./providers.js'),require('./storefront.js'),require('./quality.js'),require('./community.js'),require('./editorial.js'));else root.RepoBrowse=factory(root.RepoProviders,root.RepoStore,root.RepoQuality,root.RepoCommunity,root.RepoEditorial)})(globalThis,function(P,S,Q,C,E){
'use strict';
function card(r){const {searchText,communityPosts,...out}=r;return out}
function matches(r,o){const words=String(o.q||'').toLowerCase().trim().split(/\s+/).filter(Boolean);return r.availability!=='unavailable'&&(!o.demos||Q.hasLiveDemo(r))&&P.matchesSource(r,o.source||'all')&&(!o.category||['All','All projects'].includes(o.category)||r.category===o.category)&&(!o.technology||o.technology==='All technologies'||S.technologies(r).includes(o.technology))&&words.every(w=>String(r.searchText||[r.full,r.name,r.description,r.language,...S.technologies(r),...(r.topics||[])].join(' ')).toLowerCase().includes(w))}
function order(repos,sort='popular'){if(['popular','featured'].includes(sort))return P.popular(repos);if(sort==='trending')return S.sorted(repos.filter(r=>!P.isSpace(r)),'trending');if(sort==='community')return C.rank(repos);if(sort==='releases')return repos.filter(r=>S.recentRelease(r)).sort((a,b)=>Date.parse(b.latestRelease.publishedAt)-Date.parse(a.latestRelease.publishedAt)||a.full.localeCompare(b.full));const list=[...repos];list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):['stars','forks'].includes(sort)?(b[sort]??-1)-(a[sort]??-1)||a.full.localeCompare(b.full):(Date.parse(b[sort==='newest'?'created':'updated'])||0)-(Date.parse(a[sort==='newest'?'created':'updated'])||0)||a.full.localeCompare(b.full));return list}
function suggestions(repositories,o){
 const out=[],seen=new Set(),base={q:o.q||'',category:o.category||'',technology:o.technology||'',source:o.source||'all',sort:'popular'};
 const add=(label,change)=>{const options={...base,...change},key=JSON.stringify(options);if(seen.has(key))return;seen.add(key);const count=repositories.filter(r=>matches(r,{...o,...options})).length;if(count)out.push({label,options,count})};
 if(['trending','releases'].includes(o.sort))add('Switch to Popular',{});
 if(o.technology&&o.technology!=='All technologies')add('Search all technologies',{technology:''});
 if(o.category&&!['All','All projects'].includes(o.category))add('Search all categories',{category:''});
 if(o.source&&o.source!=='all')add('Search all sources',{source:'all'});
 const q=String(o.q||'').trim(),words=q.split(/\s+/),all={category:'',technology:'',source:'all'};
 if(q)add('Search “'+q+'” across All',all);
 if(words.length>1)add('Try “'+words[0]+'”',{...all,q:words[0]});
 const aliases={'nodejs':'Node.js','nextjs':'Next.js','threejs':'Three.js','ai':'machine learning','js':'JavaScript','reactjs':'React'};
 if(aliases[q.toLowerCase()])add('Try “'+aliases[q.toLowerCase()]+'”',{...all,q:aliases[q.toLowerCase()]});
 // Bounded edit distance over card metadata, never the full saved README.
 if(q.length>=3&&q.length<=32&&words.length===1&&out.length<4){const vocabulary=new Set();for(const r of repositories)for(const term of [r.name,r.language,r.category,...S.technologies(r)].join(' ').toLowerCase().split(/[^a-z0-9.+-]+/)){if(term.length>=3&&Math.abs(term.length-q.length)<=1)vocabulary.add(term);if(vocabulary.size>=500)break}const distance=(a,b)=>{if(a.length===b.length)for(let i=0;i<a.length-1;i++)if(a.slice(0,i)+a[i+1]+a[i]+a.slice(i+2)===b)return 1;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));prev=next}return prev[b.length]};for(const word of [...vocabulary].slice(0,500).sort())if(word!==q.toLowerCase()&&distance(q.toLowerCase(),word)<=1){add('Did you mean “'+word+'”?',{...all,q:word});if(out.length>=4)break}}
 return out.slice(0,4);
}
function select(repositories,o={},editorial={rows:[]},mentions=[]){
 const exclude=new Set((o.exclude||[]).map(id=>id.toLowerCase()));
 const available=repositories.filter(r=>r.availability!=='unavailable'),matched=available.filter(r=>matches(r,o)&&!exclude.has(r.full.toLowerCase()));
 const ranked=order(matched,o.sort),offset=o.offset||0,limit=o.limit||48;
 const categories={},technologies={},sources={github:0,huggingface:0};
 // Disjunctive facets: omit just that facet's active selection, retain the others.
 for(const r of available){if(exclude.has(r.full.toLowerCase()))continue;if(matches(r,{...o,category:''}))categories[r.category]=(categories[r.category]||0)+1;if(matches(r,{...o,technology:''}))for(const t of S.technologies(r))technologies[t]=(technologies[t]||0)+1;if(matches(r,{...o,source:'all'})){if(P.matchesSource(r,'github'))sources.github++;if(P.matchesSource(r,'huggingface'))sources.huggingface++}}
 const out={total:ranked.length,indexed:available.length,items:ranked.slice(offset,offset+limit).map(card),nextOffset:offset+limit<ranked.length?offset+limit:null,facets:{categories,technologies,sources},shelves:{},shelfItems:[]};
 if(!ranked.length&&!o.storefront)out.suggestions=suggestions(available.filter(r=>!exclude.has(r.full.toLowerCase())),o);
 if(o.storefront){const rows=E.resolve(editorial.rows,editorial.builtinSetupRequired!==false).filter(row=>row.enabled&&(row.builtin_key==='hero'||(editorial.customRows?!row.builtin_key?.startsWith('category:'):Boolean(row.builtin_key))));const map=new Map(repositories.map(r=>[r.full.toLowerCase(),r])),chosen=new Map();let community;
 for(const saved of rows){const row=saved.builtin_key?.startsWith('category:')&&['popular','trending'].includes(saved.mode)?{...saved,mode:o.ranks?.[saved.category]||saved.mode}:saved;let pool=row.mode==='manual'?row.items.map(id=>map.get(id.toLowerCase())).filter(Boolean):matched;pool=pool.filter(r=>(!['hero','picks'].includes(row.builtin_key)||Q.featuredEligible(r))&&matches(r,o)&&!exclude.has(r.full.toLowerCase())&&(!row.category||r.category===row.category));if(row.mode==='community'){community??=C.attach(repositories,mentions);const posts=new Map(community.map(r=>[r.full.toLowerCase(),r.communityPosts]));pool=pool.map(r=>({...r,communityPosts:posts.get(r.full.toLowerCase())||[]}))}if(['random','daily'].includes(row.mode))pool=E.shuffle(pool,{mode:row.mode,seed:o.seed||'',row:row.id});else if(row.mode!=='manual')pool=order(pool,row.mode);const selected=pool.slice(0,row.builtin_key==='hero'?5:row.mode==='manual'?120:12);out.shelves[row.id]=selected.map(r=>r.full);for(const r of selected)chosen.set(r.full.toLowerCase(),{...chosen.get(r.full.toLowerCase()),...card(r)})}
 out.shelfItems=[...chosen.values()];}
 return out;
}
return {card,matches,order,select,suggestions};
});
