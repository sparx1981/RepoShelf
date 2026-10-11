// Read-only reconnaissance of CodePen's public pages. It changes nothing on the site: it reports, in the sync log, whether
// robots.txt allows automated reads, what the popular/trending pages contain, whether Pens may be framed in the viewer, and how
// many look like working apps or tools. The result decides whether a CodePen source is worth building.
import {readFile,writeFile} from 'node:fs/promises';
const AGENT='RepoShelf-catalog';
export const PAGES=['https://codepen.io/picks/pens','https://codepen.io/popular/pens','https://codepen.io/trending','https://codepen.io/trending/pens'];
const APP_WORDS=/\b(app|tool|calculator|generator|editor|converter|tracker|dashboard|planner|timer|maker|builder|quiz|todo|to-do|game|player|playground|simulator|visuali[sz]er|manager|scheduler|notes?|chat|clock|stopwatch|counter|picker|formatter|validator|compressor|reader|viewer|studio|kit)\b/i;
// Minimal robots.txt reading: the rules for "*" and for our own agent name; the longest matching rule wins, Allow beats Disallow on a tie.
export function robotsRules(text){
 const groups=[];let current=null,sawRule=false;
 for(const raw of String(text||'').split(/\r?\n/)){const line=raw.replace(/#.*/,'').trim();if(!line)continue;const m=line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);if(!m)continue;const key=m[1].toLowerCase(),value=m[2].trim();
  if(key==='user-agent'){if(!current||sawRule){current={agents:[],rules:[]};groups.push(current);sawRule=false}current.agents.push(value.toLowerCase())}
  else if(current&&(key==='allow'||key==='disallow')){sawRule=true;if(value)current.rules.push({allow:key==='allow',path:value})}}
 const own=groups.filter(g=>g.agents.some(a=>a!=='*'&&AGENT.toLowerCase().includes(a))),star=groups.filter(g=>g.agents.includes('*'));
 return (own.length?own:star).flatMap(g=>g.rules);
}
export function robotsAllows(rules,path){
 let best=null;for(const rule of rules){const pattern=rule.path.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\\\$$/,'$');if(!new RegExp('^'+pattern).test(path))continue;if(!best||rule.path.length>best.path.length||rule.path.length===best.path.length&&rule.allow)best=rule}
 return !best||best.allow;
}
// Pen addresses in page order: /user/pen/slug, /user/full/slug, /user/details/slug, /user/embed/slug.
export function penLinks(html,limit=60){
 const seen=new Set(),out=[];
 for(const m of String(html||'').matchAll(/(?:https?:)?(?:\/\/codepen\.io)?\/([A-Za-z0-9_-]{1,40})\/(?:pen|full|details|embed|pen\/embed)\/([A-Za-z0-9]{4,12})(?=["'\s?#/<\\]|$)/g)){
  const key=m[1].toLowerCase()+'/'+m[2];if(['assets','cpe','login','signup','tag','trending','popular','picks'].includes(m[1].toLowerCase())||seen.has(key))continue;seen.add(key);out.push({user:m[1],slug:m[2]});if(out.length>=limit)break}
 return out;
}
export function pageShape(html,headers={}){
 const text=String(html||'');
 return {bytes:text.length,challenge:/just a moment|cf-chl|attention required|enable javascript and cookies/i.test(text),nextData:/__NEXT_DATA__/.test(text),jsonLd:/application\/ld\+json/.test(text),
  embeddedJson:(text.match(/<script[^>]*type="application\/json"/g)||[]).length,penLinks:penLinks(text).length,hearts:/data-(?:hearts|loves|likes)|"(?:hearts|loves|likes)"\s*:/i.test(text),views:/data-views|"views"\s*:/i.test(text),
  titleTag:(text.match(/<title[^>]*>([^<]{0,120})/i)||[])[1]?.trim()||null,contentType:headers['content-type']||null};
}
export function framingPolicy(headers={}){
 const xfo=headers['x-frame-options']||null,csp=headers['content-security-policy']||'',ancestors=(csp.match(/frame-ancestors([^;]*)/i)||[])[1]?.trim()||null;
 // Blocked for other sites when X-Frame-Options says so, or frame-ancestors lists nothing but 'none' / 'self'.
 const byHeader=Boolean(xfo&&/deny|sameorigin/i.test(xfo)),byPolicy=ancestors!==null&&ancestors.split(/\s+/).every(token=>["'none'","'self'"].includes(token.toLowerCase()));
 return {xFrameOptions:xfo,frameAncestors:ancestors,framingBlocked:byHeader||byPolicy};
}
const headerObject=response=>Object.fromEntries([...(response.headers?.entries?.()||[])].map(([k,v])=>[k.toLowerCase(),v]));
async function get(url,fetcher,pause){await pause();const response=await fetcher(url,{headers:{'User-Agent':`Mozilla/5.0 (compatible; ${AGENT}; +https://github.com/sparx1981/reposhelf)`,Accept:'text/html,application/xhtml+xml,text/plain'},signal:AbortSignal.timeout(20000),redirect:'follow'});return {status:response.status,headers:headerObject(response),text:await response.text().catch(()=>''),url:response.url||url}}
export async function probeCodepen({fetcher=fetch,pause=()=>new Promise(r=>setTimeout(r,1500)),now=Date.now()}={}){
 const report={at:new Date(now).toISOString(),robots:null,pages:[],sample:[],stopped:null};
 let rules=[];
 try{const robots=await get('https://codepen.io/robots.txt',fetcher,pause);report.robots={status:robots.status,bytes:robots.text.length,rules:robotsRules(robots.text).length,text:robots.text.split('\n').slice(0,80).join('\n')};if(robots.status===200)rules=robotsRules(robots.text);else if([401,403,429].includes(robots.status)){report.stopped='robots.txt returned HTTP '+robots.status;return report}}
 catch(error){report.robots={error:error.name==='TimeoutError'?'timed out':'network error'};report.stopped='robots.txt could not be read; nothing else was requested';return report}
 let found=[];
 for(const url of PAGES){
  const path=new URL(url).pathname;
  if(!robotsAllows(rules,path)){report.pages.push({url,allowed:false});continue}
  try{const page=await get(url,fetcher,pause);const links=penLinks(page.text);report.pages.push({url,allowed:true,status:page.status,finalUrl:page.url,...pageShape(page.text,page.headers),sampleTitles:links.slice(0,0)});
   if(page.status===200&&!pageShape(page.text).challenge)found.push(...links);if([403,429].includes(page.status)){report.stopped=`${url} returned HTTP ${page.status}`;break}}
  catch(error){report.pages.push({url,allowed:true,error:error.name==='TimeoutError'?'timed out':'network error'})}
 }
 const unique=[...new Map(found.map(p=>[p.user.toLowerCase()+'/'+p.slug,p])).values()];
 report.distinctPens=unique.length;
 // A few individual Pens: licence wording, frameability of the full-page view, and whether the title reads like an app or tool.
 for(const pen of unique.slice(0,4)){
  const path=`/${pen.user}/pen/${pen.slug}`,full=`/${pen.user}/full/${pen.slug}`;
  const entry={pen:`${pen.user}/${pen.slug}`};
  try{if(robotsAllows(rules,path)){const page=await get('https://codepen.io'+path,fetcher,pause);const title=(page.text.match(/<title[^>]*>([^<]{0,140})/i)||[])[1]?.trim()||null;entry.status=page.status;entry.title=title;entry.looksLikeApp=title?APP_WORDS.test(title):null;entry.mentionsMit=/\bMIT\b/.test(page.text);entry.mentionsLicense=/licen[sc]e/i.test(page.text);if([403,429].includes(page.status)){report.stopped=`${path} returned HTTP ${page.status}`;report.sample.push(entry);break}}
   if(robotsAllows(rules,full)){const view=await get('https://codepen.io'+full,fetcher,pause);entry.fullPage={status:view.status,...framingPolicy(view.headers)}}}
  catch(error){entry.error=error.name==='TimeoutError'?'timed out':'network error'}
  report.sample.push(entry);
 }
 report.appLike={checked:report.sample.filter(s=>s.looksLikeApp!==undefined&&s.looksLikeApp!==null).length,matching:report.sample.filter(s=>s.looksLikeApp).length};
 return report;
}
if(import.meta.url===`file://${process.argv[1]}`){
 const root=new URL('../',import.meta.url),statePath=new URL('.codepen-probe.json',root),state=await readFile(statePath,'utf8').then(JSON.parse,()=>({runs:0}));
 const maxRuns=Number(process.env.CODEPEN_PROBE_MAX_RUNS||3);
 if(process.env.CODEPEN_PROBE_FORCE!=='1'&&(state.runs>=maxRuns||Date.now()-Date.parse(state.lastRun||0)<20*3600000)){console.log(`CodePen probe: ${state.runs>=maxRuns?'already ran '+state.runs+' times':'ran within the last 20 hours'}; skipped.`);process.exit(0)}
 const report=await probeCodepen();
 console.log('CodePen probe report:\n'+JSON.stringify(report,null,1));
 // A run only counts when CodePen actually answered, so an outage does not use up the three probes.
if(report.robots?.status)await writeFile(statePath,JSON.stringify({runs:state.runs+1,lastRun:report.at})+'\n');
}
