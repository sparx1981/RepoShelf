// Reads Trendshift's public daily, weekly and monthly trending lists and GitHub's daily trending list.
// Trendshift has no free API, so its public pages are read the way a browser would and parsed defensively:
// any change that stops a list from parsing is reported in the saved snapshot instead of being guessed at.
const RESERVED=new Set(['features','topics','collections','marketplace','settings','login','signup','search','orgs','users','sponsors','explore','events','notifications','new','about','pricing','security','site','trending','apps','enterprise','readme','customer-stories','resources','solutions','contact','github','trendshift','repositories','signal','developers','languages']);
export const LIST_SIZE=30;
// Several likely addresses per range are tried in order; a range is only accepted when it differs from the daily list.
export const TRENDSHIFT_LISTS={
 daily:['https://trendshift.io/'],
 weekly:['https://trendshift.io/?trending-range=7','https://trendshift.io/?range=weekly','https://trendshift.io/weekly'],
 monthly:['https://trendshift.io/?trending-range=30','https://trendshift.io/?range=monthly','https://trendshift.io/monthly']
};
export const GITHUB_TRENDING_URL='https://github.com/trending?since=daily';
function decode(text){return String(text||'').replace(/&amp;/g,'&').replace(/&#x2F;|&#47;/gi,'/').replace(/\\u002F/gi,'/').replace(/\\\//g,'/')}
function candidate(owner,name){name=String(name||'').replace(/\.git$/i,'');return /^[A-Za-z0-9_.-]{1,39}$/.test(owner)&&/^[A-Za-z0-9_.-]{1,100}$/.test(name)&&!RESERVED.has(owner.toLowerCase())&&!/^\.+$/.test(name)?owner+'/'+name:null}
// Repository identifiers in page order, from GitHub links, "owner/name" JSON fields, and "owner/name" link text next to a
// Trendshift repository link. Order is the list rank, so it is preserved and duplicates keep their first position.
export function trendshiftRepositories(html,limit=LIST_SIZE){
 const text=decode(html),found=[];
 const add=(index,owner,name)=>{const full=candidate(owner,name);if(full)found.push({index,full})};
 for(const m of text.matchAll(/https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?=[\s"'<>)?#/\\]|$)/gi))add(m.index,m[1],m[2]);
 for(const m of text.matchAll(/"(?:full_?[nN]ame|repo(?:sitory)?(?:_?[fF]ull_?[nN]ame)?)"\s*:\s*"([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)"/g))add(m.index,m[1],m[2]);
 for(const m of text.matchAll(/<a\b[^>]*href="[^"]*\/repositories\/\d+[^"]*"[^>]*>(?:\s|<[^>]*>)*([A-Za-z0-9_.-]+)\s*\/\s*([A-Za-z0-9_.-]+)\s*(?:<|$)/g))add(m.index,m[1],m[2]);
 const seen=new Set(),out=[];for(const item of found.sort((a,b)=>a.index-b.index)){const key=item.full.toLowerCase();if(seen.has(key))continue;seen.add(key);out.push(item.full);if(out.length>=limit)break}
 return out;
}
export function githubTrendingRepositories(html,limit=LIST_SIZE){
 const seen=new Set(),out=[];
 for(const m of decode(html).matchAll(/<h2\b[^>]*>\s*<a\b[^>]*href="\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)"/g)){const full=candidate(m[1],m[2]);if(!full||seen.has(full.toLowerCase()))continue;seen.add(full.toLowerCase());out.push(full);if(out.length>=limit)break}
 return out;
}
async function page(url,fetcher){const response=await fetcher(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; RepoShelf-catalog; +https://github.com/sparx1981/reposhelf)',Accept:'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(20000),redirect:'follow'});if(!response.ok)throw Object.assign(new Error(`HTTP ${response.status}`),{status:response.status});return response.text()}
const MINIMUM=5;
// Returns {lists:{daily:[full…],…}, sources:{daily:{status,…},…}}. A list that cannot be read is simply absent, so
// a temporary outage never erases a previous snapshot's entries (the caller keeps those until they expire).
export async function collectTrendshift({fetcher=fetch,now=Date.now()}={}){
 const lists={},sources={},at=new Date(now).toISOString();
 for(const [name,urls]of Object.entries(TRENDSHIFT_LISTS)){
  let reason='no address returned a usable list';
  for(const url of urls){
   try{
    const repos=trendshiftRepositories(await page(url,fetcher));
    if(repos.length<MINIMUM){reason=`${url} listed only ${repos.length} repositories`;continue}
    if(name!=='daily'&&lists.daily&&repos.slice(0,10).join()===lists.daily.slice(0,10).join()){reason=`${url} repeated the daily list`;continue}
    lists[name]=repos;sources[name]={status:'ok',checkedAt:at,url,mentionsFound:repos.length};reason=null;break;
   }catch(error){reason=`${url}: ${error.status?'HTTP '+error.status:error.name==='TimeoutError'?'timed out':'network error'}`}
  }
  if(reason)sources[name]={status:'retry',attemptedAt:at,reason,mentionsFound:0};
 }
 try{
  const repos=githubTrendingRepositories(await page(GITHUB_TRENDING_URL,fetcher));
  if(repos.length<MINIMUM)throw Object.assign(new Error('too few repositories'),{});
  lists.githubDaily=repos;sources.githubDaily={status:'ok',checkedAt:at,url:GITHUB_TRENDING_URL,mentionsFound:repos.length};
 }catch(error){sources.githubDaily={status:'retry',attemptedAt:at,reason:error.status?'HTTP '+error.status:error.message==='too few repositories'?'fewer than 5 repositories found':'network error',mentionsFound:0}}
 return {lists,sources};
}
export const SIGNAL_WINDOW=3*86400000;
// Rebuilds the saved entries from this run's lists. A repository seen in a successfully read list takes that run's ranks and
// time; one not seen keeps its previous entry until it is older than the three-day signal window, so a failed or partial read
// never blanks the ribbon and a repository that has really dropped off stops counting.
export function mergeTrendshift(prior={},lists={},now=Date.now()){
 const at=new Date(now).toISOString(),entries={};
 for(const [key,entry]of Object.entries(prior||{})){const seen=Date.parse(entry?.seenAt);if(entry&&Number.isFinite(seen)&&now-seen<=SIGNAL_WINDOW&&entry.ranks&&typeof entry.full==='string')entries[key]=entry}
 const fresh={};
 for(const [list,repos]of Object.entries(lists))repos.forEach((full,i)=>{const key=full.toLowerCase();fresh[key]??={full,seenAt:at,ranks:{}};fresh[key].ranks[list]=i+1});
 return {...entries,...fresh};
}
