(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoTaxonomy=factory()})(globalThis,function(){
'use strict';
// Bump this version whenever rules change. Rules operate on data, never execute it.
const version=2;
const broadCategories=['Design','Developer tools','Productivity','Business','Finance','Education','AI & machine learning','Other'];
const rules=[
 ['Architecture & building design',/\b(architectural editor|architectural design|building design|interior design|floor[ -]?plans?|building information model(?:ling|ing)?|bim viewer|ifc viewer|cad viewer|text.to.cad|urban planning|building sunlight|bim|ifc|cad)\b/i],
 ['Games & game development',/\b(games?|game engine|game development|game dev|game design|level editor|godot|unity|unreal engine|gameplay|video games?|html5 games?|2d games?|3d games?|tetris)\b/i],
 ['Animation & motion',/\b(animation|motion graphics|skeletal animation|rigging|blender|spritesheet|sprite sheet|vfx|lottie)\b/i],
 ['Simulation & physics',/\b(physics engine|digital twin|fluid dynamics|particle system|simulator|simulation|simulating)\b/i],
 ['Crypto & blockchain',/\b(blockchain|bitcoin|ethereum|web3|defi|solidity|cryptocurrency|metamask)\b/i],
 ['Food & cooking',/\b(food|cooking|meals?|nutrition|restaurant|recipe management|recipe app|recipes app|meal.prep)\b/i],
 ['Automation & workflows',/\b(automation|automate|automating|workflows?|workflow engine|workflow automation|no.code workflow|n8n|zapier|rpa|automated workflows)\b/i],
 ['Home automation',/\b(home automation|home assistant|smart home|domotics)\b/i],
 ['Maps & geospatial',/\b(geospatial|cartography|geographic information|gis viewer|maplibre|leaflet|google maps|web mapping)\b/i],
 ['Photography',/\b(photography|photo management|photo editor|photo editing|photo gallery|image gallery|photo albums?)\b/i],
 ['Health & fitness',/\b(fitness|workouts?|gym|health tracker|exercise tracker|nutrition|calorie tracker)\b/i,t=>!(/\b(openai gym|isaac gym|gymnasium|reinforcement learning|rddl)\b/i.test(t)&&!(/\b(fitness|workouts?|nutrition|calorie tracker|body weight)\b/i.test(t)))],
 ['Android',/\b(android)\b/i],
 ['Apple',/\b(ios|iphone|ipad|ipados|macos|mac os|swiftui|core ml|coreml|apple silicon|apple platforms?)\b/i],
 ['Mobile',/\b(mobile|android|ios|iphone|ipad|ipados|flutter|react native)\b/i],
 ['Streaming',/\b(streaming|livestream|live stream|video player|media server|music player|iptv|video on demand|podcast player)\b/i,t=>/\b(audio|video|music|media|iptv|livestream|live stream|podcast|personal streaming service)\b/i.test(t)],
 ['Fashion',/\b(fashion|clothing|outfits?|wardrobe|virtual try on|try on|apparel)\b/i],
 ['Science',/\b(scientific|science|chemistry|biology|astronomy|molecular|laboratory|quantum|physics)\b/i,t=>!/\b(css|game engine|game controller)\b/i.test(t)||/\b(scientific|science|chemistry|biology|astronomy|molecular|laboratory|quantum)\b/i.test(t)],
 ['Kids',/\b(kids|for children|children s|child friendly|for babies|for toddlers)\b/i],
 ['Automotive',/\b(automotive|vehicles?|cars?|driving|motorsport|obd|garage|f1 telemetry)\b/i,t=>!/\b(game|games|marketplace|olx|racing game)\b/i.test(t)||/\b(telemetry|diagnostics|automotive|obd|car mechanic)\b/i.test(t)],
 ['Travel',/\b(travel|trip planner|trip planning|itinerar\w*|tourism|tourist|flight booking|hotel booking|vacation)\b/i,t=>!/\b(time travel|debugging|boilerplate)\b/i.test(t)||/\b(trip planner|itinerar\w*|tourism|flight booking|hotel booking)\b/i.test(t)]
];
const subjects=rules.map(([name])=>name);
function names(r){return [...new Set([r.category,...(r.subjects||[])].filter(x=>typeof x==='string'&&x))]}
function matches(r,category){return !category||['All','All projects'].includes(category)||names(r).some(x=>x.toLowerCase()===String(category).toLowerCase())}
function broad(r){if(r.source==='huggingface'||String(r.full||'').startsWith('hf:'))return 'AI & machine learning';const t=[r.name,r.description,...(r.topics||[])].join(' ');return /design|canvas|draw|ui-library|whiteboard|portfolio|animation|css/i.test(t)?'Design':/budget|finance|money|expense/i.test(t)?'Finance':/crm|business|ecommerce|scheduling|commerce/i.test(t)?'Business':/learn|education|typing|quiz/i.test(t)?'Education':/notes|markdown|productivity|task|resume|todo|calendar/i.test(t)?'Productivity':/\b(ai|llm|machine learning|artificial intelligence)\b/i.test(t)?'AI & machine learning':/developer|api|database|tool|editor|framework|code/i.test(t)?'Developer tools':'Other'}
function annotate(r,{force=false}={}){
 if(!force&&r.classification?.version===version)return r;
 const normalize=text=>String(text||'').replace(/[_-]+/g,' ').replace(/[’']/g,' ');
 const metadata=normalize([r.name,r.authorDescription||r.description,...(r.topics||[])].join(' ').slice(0,16000));
 // README keywords are supporting evidence. They cannot alone allocate a subject:
 // dependencies, sample recipes and software architecture cause false positives.
 const supporting=normalize((r.overview?.paragraphs||[]).join(' ').slice(0,6000)),readme=normalize((r.readmeSnapshot?.searchTerms||[]).join(' ').slice(0,12000));
 const evidence=[],suggestedSubjects=[];
 for(const [subject,pattern,accept=()=>true]of rules){const hit=metadata.match(pattern);if(hit&&accept(metadata))evidence.push({subject,source:'metadata',match:hit[0].slice(0,80)});else if(hit&&subject==='Streaming'&&!/\b(markdown|data|tokens?|llm|events?|reconstruction)\b/i.test(metadata)||pattern.test(supporting)&&accept(supporting)||pattern.test(readme)&&accept(readme))suggestedSubjects.push(subject)}
 const platformRules=[['Android',/\bandroid\b/i],['iOS & iPadOS',/\b(ios|iphone|ipad|ipados)\b/i],['macOS',/\b(macos|mac os|apple silicon)\b/i],['Mobile web',/\b(mobile friendly|mobile web|responsive website|responsive web app)\b/i]];
 const platformEvidence=platformRules.flatMap(([platform,pattern])=>{const hit=metadata.match(pattern);return hit?[{platform,source:'metadata',match:hit[0]}]:[]});
 const category=broadCategories.includes(r.category)&&r.category!=='Other'?r.category:broad(r),assigned=evidence.map(x=>x.subject);
 return {...r,category,subjects:assigned,platforms:platformEvidence.map(x=>x.platform),classification:{version,method:'local_rules',category,subjects:assigned,evidence,platformEvidence,platformSupport:'author_metadata_not_runtime_tested',suggestedSubjects,reviewRequired:(!assigned.length&&category==='Other')||suggestedSubjects.length>0}};
}
return {version,broadCategories,subjects,rules,names,matches,annotate};
});
