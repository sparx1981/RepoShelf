(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoTaxonomy=factory()})(globalThis,function(){
'use strict';
// Bump this version whenever rules change. Rules operate on data, never execute it.
const version=1;
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
 ['Health & fitness',/\b(fitness|workout|gym|health tracker|exercise tracker|nutrition|calorie tracker)\b/i]
];
const subjects=rules.map(([name])=>name);
function names(r){return [...new Set([r.category,...(r.subjects||[])].filter(x=>typeof x==='string'&&x))]}
function matches(r,category){return !category||['All','All projects'].includes(category)||names(r).some(x=>x.toLowerCase()===String(category).toLowerCase())}
function broad(r){if(r.source==='huggingface'||String(r.full||'').startsWith('hf:'))return 'AI & machine learning';const t=[r.name,r.description,...(r.topics||[])].join(' ');return /design|canvas|draw|ui-library|whiteboard|portfolio|animation|css/i.test(t)?'Design':/budget|finance|money|expense/i.test(t)?'Finance':/crm|business|ecommerce|scheduling|commerce/i.test(t)?'Business':/learn|education|typing|quiz/i.test(t)?'Education':/notes|markdown|productivity|task|resume|todo|calendar/i.test(t)?'Productivity':/\b(ai|llm|machine learning|artificial intelligence)\b/i.test(t)?'AI & machine learning':/developer|api|database|tool|editor|framework|code/i.test(t)?'Developer tools':'Other'}
function annotate(r,{force=false}={}){
 if(!force&&r.classification?.version===version)return r;
 const metadata=[r.name,r.authorDescription||r.description,...(r.topics||[])].join(' ').slice(0,16000);
 // README keywords are supporting evidence. They cannot alone allocate a subject:
 // dependencies, sample recipes and software architecture cause false positives.
 const supporting=(r.overview?.paragraphs||[]).join(' ').slice(0,6000),readme=(r.readmeSnapshot?.searchTerms||[]).join(' ').slice(0,12000);
 const evidence=[],suggestedSubjects=[];
 for(const [subject,pattern]of rules){const hit=metadata.match(pattern);if(hit)evidence.push({subject,source:'metadata',match:hit[0].slice(0,80)});else if(pattern.test(supporting)||pattern.test(readme))suggestedSubjects.push(subject)}
 const category=broadCategories.includes(r.category)&&r.category!=='Other'?r.category:broad(r),assigned=evidence.map(x=>x.subject);
 return {...r,category,subjects:assigned,classification:{version,method:'local_rules',category,subjects:assigned,evidence,suggestedSubjects,reviewRequired:(!assigned.length&&category==='Other')||suggestedSubjects.length>0}};
}
return {version,broadCategories,subjects,rules,names,matches,annotate};
});
