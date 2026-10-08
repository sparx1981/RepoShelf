(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RepoTaxonomy=factory()})(globalThis,function(){
'use strict';
// Bump this version whenever rules change. Rules operate on data, never execute it.
const version=3;
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
 ['Travel',/\b(travel|trip planner|trip planning|itinerar\w*|tourism|tourist|flight booking|hotel booking|vacation)\b/i,t=>!/\b(time travel|debugging|boilerplate)\b/i.test(t)||/\b(trip planner|itinerar\w*|tourism|flight booking|hotel booking)\b/i.test(t)],
 ['MCP servers & agents',/\b(mcp|model context protocol|ai agents?|agentic|llm agents?|autonomous agents?|multi agents?|coding agents?|langgraph|crewai|autogen|agents?)\b/i,(t,r)=>{const own=String([r?.name,r?.authorDescription||r?.description].join(' ')).replace(/[_-]+/g,' ');const hf=r?.source==='huggingface'||String(r?.full||'').startsWith('hf:');return (/\b(mcp|model context protocol)\b/i.test(t)||/\b(ai|llm|gpt|openai|claude|anthropic|gemini|langchain|llama|ollama)\b/i.test(t))&&(!hf||/\b(mcp|model context protocol|agents?|agentic)\b/i.test(own))}],
 ['Image, audio & video AI',/\b(text to image|image generation|image generator|ai image|stable diffusion|diffusion models?|image to image|text to speech|tts|speech to text|speech recognition|voice clon(?:e|ing)|text to video|video generation|ai video|ai music|music generation|audio generation|upscal(?:e|er|ing)|background removal|remove background|face swap|image editing|image enhancement|inpainting|lora)\b/i,t=>/\b(ai|models?|generat\w*|diffusion|neural|gradio|huggingface|hugging face|deep learning)\b/i.test(t)],
 ['Chatbots & assistants',/\b(chatbots?|chat bots?|conversational ai|ai assistants?|virtual assistants?|voice assistants?|chat with (?:your |a |the )?(?:pdf|documents?|data|files?|website|docs)|llm chat|chat ui|chatgpt (?:clone|ui))\b/i],
 ['Templates & UI components',/\b(starter kits?|starter templates?|boilerplates?|ui kits?|ui components?|component librar(?:y|ies)|design systems?|admin (?:templates?|panels?|dashboards?)|templates?|themes?)\b/i,t=>/\b(react|next ?js|vue|nuxt|svelte|angular|tailwind|bootstrap|html|css|website|web|frontend|landing|dashboard|ui|jekyll|hugo|wordpress)\b/i.test(t)&&!/\b(machine learning|prompt templates?|jinja|templating engine|cookiecutter)\b/i.test(t)],
 ['Portfolios & personal sites',/\b(portfolios?|personal (?:web ?)?sites?|personal homepage|personal blog|digital gardens?|resume (?:site|website)|cv (?:site|website)|online resume|developer blog)\b/i,t=>!/\b(investment|wealth|trading|stocks?|crypto|exchange|marketplace|asset management|portfolio optimi\w*|portfolio management|net worth)\b/i.test(t)||/\b(personal sites?|personal websites?|developer portfolio|my portfolio)\b/i.test(t)],
 ['Browser extensions & PWAs',/\b(browser extensions?|chrome extensions?|firefox (?:add ?ons?|extensions?)|web extensions?|pwa|progressive web apps?|userscripts?|bookmarklets?)\b/i],
 ['Maths & algorithms',/\b(operations research|graph theory|linear programming|integer programming|algorithm visuali\w*|data structures? and algorithms|sorting algorithms?|pathfinding|mathematics|mathematical|math|calculus|linear algebra|combinatorics|number theory|geometry|probability|mathematik|graphentheorie|lineare optimierung)\b/i],
 ['Data & dashboards',/\b(dashboards?|data visuali[sz]ations?|data viz|data analytics|business intelligence|bi tools?|charts|charting|chart librar\w+|chartjs|chart js|echarts|d3 js|d3|plotting|plotly|grafana|metabase|apache superset)\b/i,t=>!/\bhelm charts?\b/i.test(t)],
 ['3D & graphics',/\b(threejs|three js|webgl|webgpu|3d|babylon ?js|shaders?|glsl|ray ?tracing|path tracing|gaussian splatting|point clouds?|gltf)\b/i],
 ['Music & audio',/\b(music|audio (?:players?|editors?|editing|recorders?|recording|visuali\w*|spectrum|processing|transcri\w*|synth\w*|mixers?|plugins?|effects?|upsampl\w*|super resolution|generation|production|waveforms?|to midi)|text to audio|synthesi[sz]ers?|synth|midi|sound (?:design|effects?|board)|podcasts?|sampler|beat (?:maker|machine)|drum machine|spotify|soundcloud)\b/i],
 ['Writing & documents',/\b(note ?taking|notes? apps?|markdown editors?|markdown notes?|text editors?|word processors?|document (?:editor|viewer|converter|management|scanner)|pdf (?:editor|viewer|tools?|converter|reader)|ocr|writing (?:app|tool|assistant)|wiki (?:software|engine|platform|app)|wikis|knowledge base|second brain|zettelkasten|obsidian)\b/i],
 ['Self-hosted apps',/\b(self hosted|selfhosted|self host|homelab|home lab)\b/i],
 ['Privacy & security',/\b(password managers?|encrypt\w*|vpn|cyber ?security|pentest\w*|penetration testing|malware|vulnerabilit\w*|privacy (?:focused|first|friendly|preserving)|2fa|two factor|secrets? manager|zero knowledge|osint|ctf)\b/i]
];
const xCategory='As Seen On X.com';
const subjects=[...rules.map(([name])=>name),xCategory];
function seenOnX(r){return (r.discoveredVia||[]).some(s=>s.kind==='x'&&typeof s.url==='string'&&/^https:\/\/(?:x\.com|twitter\.com)\/(?:[^/?#]+\/status|i\/web\/status)\/\d+(?:[?#].*)?$/.test(s.url))}
function names(r){return [...new Set([r.category,...(r.subjects||[]),...(seenOnX(r)?[xCategory]:[])].filter(x=>typeof x==='string'&&x))]}
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
 for(const [subject,pattern,accept=()=>true]of rules){const hit=metadata.match(pattern);if(hit&&accept(metadata,r))evidence.push({subject,source:'metadata',match:hit[0].slice(0,80)});else if(hit&&subject==='Streaming'&&!/\b(markdown|data|tokens?|llm|events?|reconstruction)\b/i.test(metadata)||pattern.test(supporting)&&accept(supporting,r)||pattern.test(readme)&&accept(readme,r))suggestedSubjects.push(subject)}
 const platformRules=[['Android',/\bandroid\b/i],['iOS & iPadOS',/\b(ios|iphone|ipad|ipados)\b/i],['macOS',/\b(macos|mac os|apple silicon)\b/i],['Mobile web',/\b(mobile friendly|mobile web|responsive website|responsive web app)\b/i]];
 const platformEvidence=platformRules.flatMap(([platform,pattern])=>{const hit=metadata.match(pattern);return hit?[{platform,source:'metadata',match:hit[0]}]:[]});
 const category=broadCategories.includes(r.category)&&r.category!=='Other'?r.category:broad(r),assigned=evidence.map(x=>x.subject);
 return {...r,category,subjects:assigned,platforms:platformEvidence.map(x=>x.platform),classification:{version,method:'local_rules',category,subjects:assigned,evidence,platformEvidence,platformSupport:'author_metadata_not_runtime_tested',suggestedSubjects,reviewRequired:(!assigned.length&&category==='Other')||suggestedSubjects.length>0}};
}
return {version,broadCategories,subjects,rules,names,matches,annotate};
});
