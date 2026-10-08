(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./providers.js'),require('./storefront.js'),require('./quality.js'),require('./community.js'),require('./editorial.js'));else root.RepoBrowse=factory(root.RepoProviders,root.RepoStore,root.RepoQuality,root.RepoCommunity,root.RepoEditorial)})(globalThis,function(P,S,Q,C,E){
'use strict';
function card(r){const {searchText,searchOverview,searchReadme,communityPosts,classification,previewAttemptAt,...out}=r;return out}
const searchCache=new WeakMap();
const aliases={nodejs:['nodejs'],nextjs:['nextjs'],threejs:['threejs'],reactjs:['react'],js:['javascript'],ts:['typescript'],ai:['ai','machine learning','artificial intelligence'],photo:['photo','photography','picture','image'],picture:['picture','photo','image'],budget:['budget','finance','expense'],kanban:['kanban','task board'],todo:['todo','task','to do']};
function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(node|next|three|react)\s*\.\s*js\b/g,'$1js').replace(/[^\p{L}\p{N}+#]+/gu,' ').trim()}
function stem(word){return word.length>4&&word.endsWith('s')&&!word.endsWith('ss')?word.slice(0,-1):word}
function near(a,b){if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;if(a===b)return true;if(a.length===b.length){let differences=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences.push(i);return differences.length===1||differences.length===2&&differences[1]===differences[0]+1&&a[differences[0]]===b[differences[1]]&&a[differences[1]]===b[differences[0]]}let shorter=a.length<b.length?a:b,longer=a.length<b.length?b:a,i=0,j=0,skipped=false;while(i<shorter.length){if(shorter[i]===longer[j]){i++;j++}else{if(skipped)return false;skipped=true;j++}}return true}
function searchMatch(r,query){
 const q=normalize(query);if(!q)return {score:0,group:'best',reason:''};let cached=searchCache.get(r);if(cached?.q===q)return cached.result;
 const fields=[['name',normalize(r.name),100],['repository',normalize(r.full),85],['description',normalize(r.description),70],['overview',normalize(r.searchOverview),65],['technology',normalize([r.language,...S.technologies(r)].join(' ')),55],['tag',normalize([...(r.topics||[]),...(r.subjects||[]),r.category].join(' ')),40],['README',normalize(r.searchReadme??r.searchText),12]];
 const tokens=fields.map(([,text])=>text.split(' ').filter(Boolean));const words=q.split(' ');let score=0,broader=false,reasons=new Set();
 for(const word of words){let hit=null;for(let i=0;i<fields.length;i++){const [label,text,weight]=fields[i];if(tokens[i].some(t=>t===word||stem(t)===stem(word))||i<2&&word.length>=3&&tokens[i].some(t=>t.startsWith(word))){if(!hit||weight>hit.weight)hit={label,weight,broad:i===6}}}
 if(!hit)for(const variant of aliases[stem(word)]||[]){for(let i=0;i<fields.length;i++)if((' '+fields[i][1]+' ').includes(' '+variant+' ')||!variant.includes(' ')&&tokens[i].some(t=>stem(t)===variant)){const weight=fields[i][2]*.7;if(!hit||weight>hit.weight)hit={label:'related terms',weight,broad:true}}}
 if(!hit&&word.length>=4&&word.length<=32)for(let i=0;i<6;i++)if(tokens[i].some(t=>near(word,t))){const weight=fields[i][2]*.55;if(!hit||weight>hit.weight)hit={label:'similar spelling',weight,broad:true}}
 if(!hit){const result=null;searchCache.set(r,{q,result});return result}score+=hit.weight;broader||=hit.broad;reasons.add(hit.label);
 }
 if(fields[0][1]===q)score+=500;else if(fields[0][1].startsWith(q))score+=180;else if((' '+fields[0][1]+' ').includes(' '+q+' '))score+=120;
 if(fields[1][1]===q)score+=350;for(let i=2;i<6;i++)if((' '+fields[i][1]+' ').includes(' '+q+' '))score+=fields[i][2];
 const reason=broader?(reasons.has('similar spelling')?'Similar spelling':reasons.has('related terms')?'Matches related terms':'Mentioned in README'):reasons.has('name')?'Matches project name':reasons.has('technology')?'Matches technology':reasons.has('description')?'Matches description':reasons.has('overview')?'Matches overview':reasons.has('tag')?'Matches tags':'Matches repository name';
 const result={score,group:broader?'other':'best',reason};searchCache.set(r,{q,result});return result;
}

function matches(r,o,technologies=S.technologies){return r.availability!=='unavailable'&&(!o.demos||Q.hasLiveDemo(r))&&P.matchesSource(r,o.source||'all')&&(!o.category||['All','All projects'].includes(o.category)||E.matchesCategory(r,o.category))&&(!o.technology||o.technology==='All technologies'||technologies(r).includes(o.technology))&&Boolean(searchMatch(r,o.q))}
function order(repos,sort='popular'){if(sort==='reposhelf')return repos.filter(r=>r.repoShelfClicks>0).sort((a,b)=>b.repoShelfClicks-a.repoShelfClicks||a.full.localeCompare(b.full));if(['popular','featured'].includes(sort))return P.popular(repos);if(sort==='trending')return S.sorted(repos.filter(r=>!P.isSpace(r)),'trending');if(sort==='community')return C.rank(repos);if(sort==='releases')return repos.filter(r=>S.recentRelease(r)).sort((a,b)=>Date.parse(b.latestRelease.publishedAt)-Date.parse(a.latestRelease.publishedAt)||a.full.localeCompare(b.full));const list=[...repos];list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):['stars','forks'].includes(sort)?(b[sort]??-1)-(a[sort]??-1)||a.full.localeCompare(b.full):(Date.parse(b[sort==='newest'?'created':'updated'])||0)-(Date.parse(a[sort==='newest'?'created':'updated'])||0)||a.full.localeCompare(b.full));return list}
function suggestions(repositories,o){
 const out=[],seen=new Set(),base={q:o.q||'',category:o.category||'',technology:o.technology||'',source:o.source||'all',sort:o.q?'relevance':'popular'};
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
 const exclude=new Set((o.exclude||[]).map(id=>id.toLowerCase())),technologyCache=new Map();
 const technologiesFor=r=>{if(!technologyCache.has(r))technologyCache.set(r,S.technologies(r));return technologyCache.get(r)};
 const available=repositories.filter(r=>r.availability!=='unavailable'),matched=available.filter(r=>matches(r,o,technologiesFor)&&!exclude.has(r.full.toLowerCase()));
 const searching=Boolean(String(o.q||'').trim()),relevance=searching&&(!o.sort||o.sort==='relevance');
 const popular=order(matched,'popular'),ties=new Map(popular.map((r,i)=>[r.full,i]));
 const ranked=relevance?[...matched].sort((a,b)=>{const x=searchMatch(a,o.q),y=searchMatch(b,o.q);return (x.group==='other')-(y.group==='other')||y.score-x.score||ties.get(a.full)-ties.get(b.full)}):(!o.sort||['relevance','popular','featured'].includes(o.sort)?popular:order(matched,o.sort)),offset=o.offset||0,limit=o.limit||48;
 const categories={},technologies={},sources={github:0,huggingface:0};
 // Disjunctive facets: omit just that facet's active selection, retain the others.
 const categoryFacet={...o,category:''},technologyFacet={...o,technology:''},sourceFacet={...o,source:'all'};
 for(const r of available){if(exclude.has(r.full.toLowerCase()))continue;if(matches(r,categoryFacet,technologiesFor))for(const category of E.categoryNames(r))categories[category]=(categories[category]||0)+1;if(matches(r,technologyFacet,technologiesFor))for(const t of technologiesFor(r))technologies[t]=(technologies[t]||0)+1;if(matches(r,sourceFacet,technologiesFor)){if(P.matchesSource(r,'github'))sources.github++;if(P.matchesSource(r,'huggingface'))sources.huggingface++}}
 const out={total:ranked.length,indexed:available.length,items:ranked.slice(offset,offset+limit).map(r=>({...card(r),...(searching?{searchMatch:{group:searchMatch(r,o.q).group,reason:searchMatch(r,o.q).reason}}:{})})),nextOffset:offset+limit<ranked.length?offset+limit:null,facets:{categories,technologies,sources},shelves:{},shelfItems:[]};
 if(searching)out.searchGroups={best:matched.filter(r=>searchMatch(r,o.q).group==='best').length,other:matched.filter(r=>searchMatch(r,o.q).group==='other').length};
 if(!ranked.length&&!o.storefront)out.suggestions=suggestions(available.filter(r=>!exclude.has(r.full.toLowerCase())),o);
 if(o.storefront){const rows=E.resolve(editorial.rows,editorial.builtinSetupRequired!==false).filter(row=>row.enabled&&(row.builtin_key==='hero'||(editorial.customRows?!row.builtin_key?.startsWith('category:'):Boolean(row.builtin_key))));const map=new Map(repositories.map(r=>[r.full.toLowerCase(),r])),chosen=new Map();let community;
 if(o.staged){out.shelfRows=rows;out.publicPools=o.publicPools===true;out.privateShelves=rows.filter(r=>r.mode==='random').map(r=>r.id);out.items=[]}
 const wanted=o.staged?new Set(o.shelfIds||[...rows.filter(r=>r.builtin_key==='hero'),...rows.filter(r=>r.builtin_key!=='hero').slice(0,o.shelfLimit)].map(r=>r.id)):null;
 for(const saved of rows){if(wanted&&!wanted.has(saved.id)||o.publicPools&&saved.mode==='random')continue;const row=saved.builtin_key?.startsWith('category:')&&['popular','trending'].includes(saved.mode)?{...saved,mode:o.ranks?.[saved.category]||saved.mode}:saved,featured=['hero','picks'].includes(row.builtin_key);let pool=row.mode==='manual'?row.items.map(id=>map.get(id.toLowerCase())).filter(Boolean):matched;
  // Hand-picked spotlight and Editor's picks stay unless something is really wrong with them, so a missed or failed check never empties them.
  pool=pool.filter(r=>(!featured||Q.featuredEligible(r,o.evidenceAt,{lenient:row.mode==='manual'}))&&matches(r,o,technologiesFor)&&!exclude.has(r.full.toLowerCase())&&(!row.category||E.matchesCategory(r,row.category)));
  if(row.mode==='community'){community??=C.attach(repositories,mentions);const posts=new Map(community.map(r=>[r.full.toLowerCase(),r.communityPosts]));pool=pool.map(r=>({...r,communityPosts:posts.get(r.full.toLowerCase())||[]}))}
  if(['random','daily'].includes(row.mode))pool=E.shuffle(pool,{mode:row.mode,seed:o.seed||'',row:row.id});else if(row.mode!=='manual')pool=order(pool,row.mode);
  const cap=row.builtin_key==='hero'?5:row.mode==='manual'?120:12;
  // Where chosen spotlight listings have dropped out, the best listings that pass the strict check take their places (never more than were chosen).
  let fill=[];const want=Math.min(cap,row.items.length);if(row.builtin_key==='hero'&&row.mode==='manual'&&pool.length<want){const have=new Set(pool.map(r=>r.full.toLowerCase()));fill=order(matched,'popular').filter(r=>!have.has(r.full.toLowerCase())&&Q.featuredEligible(r,o.evidenceAt)).slice(0,want-pool.length)}
  const selected=(row.mode==='manual'?[...E.arrange(pool,o.publicPools?{...row,shuffle:'off'}:row,{seed:o.seed||'',manual:true}),...fill]:E.arrange(pool.slice(0,cap),o.publicPools?{...row,shuffle:'off'}:row,{seed:o.seed||'',limit:cap})).slice(0,cap);
  if(o.publicPools&&row.mode==='manual'&&row.builtin_key==='hero'){out.publicShuffleCounts||={};out.publicShuffleCounts[row.id]=pool.length;selected.splice(0,selected.length,...[...pool,...fill])}
  out.shelves[row.id]=selected.map(r=>r.full);for(const r of selected)chosen.set(r.full.toLowerCase(),{...chosen.get(r.full.toLowerCase()),...card(r)})}
 out.shelfItems=[...chosen.values()];}
 return out;
}
return {card,matches,order,select,suggestions,searchMatch};
});
