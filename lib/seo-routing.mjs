import {readFile} from 'node:fs/promises';
import {NOT_FOUND_HTML} from './not-found-page.mjs';
// This route sits behind a rewrite for every /projects/* URL that has no static page, so crawlers
// probing project addresses reach it constantly. Responses used to be uncacheable (404: no-store,
// 301: must-revalidate), so each probe ran the function; s-maxage lets Vercel's CDN answer repeats
// without one. Browsers still revalidate (max-age=0). A 404 is held briefly so a project page that
// appears later is not hidden for long; a redirect is stable, so it is held for a day.
export const NOT_FOUND_CACHE='public, max-age=0, s-maxage=600, stale-while-revalidate=3600';
export const REDIRECT_CACHE='public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const notFound=res=>{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':NOT_FOUND_CACHE,'X-Robots-Tag':'noindex'});return res.end(NOT_FOUND_HTML)};
const valid=path=>typeof path==='string'&&/^\/projects\/(?:github|huggingface)\/[a-z0-9_.-]+\/[a-z0-9_.-]+\.html$/.test(path)&&!path.split('/').some(part=>part==='.'||part==='..');
export function createSEORouteHandler({root=new URL('../',import.meta.url),load=async()=>JSON.parse(await readFile(new URL('data/seo-redirects.json',root),'utf8'))}={}){
 let data;
 return async(req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
  const params=new URL(req.url,'https://www.reposhelf.co.uk').searchParams,requested=params.get('path'),markdown=requested?.endsWith('.html.md'),path=markdown?requested.slice(0,-3):requested;
  if(!valid(path))return notFound(res);
  try{data??=await load()}catch(error){if(error.code!=='ENOENT'){res.writeHead(503,{'Cache-Control':'no-store'});return res.end('Routes unavailable')}data={redirects:{}}}
  const target=Object.hasOwn(data.redirects||{},path)?data.redirects[path]:null;
  if(!valid(target)||target===path)return notFound(res);
  res.writeHead(301,{Location:target+(markdown?'.md':''),'Cache-Control':REDIRECT_CACHE});res.end();
 };
}
export default createSEORouteHandler();
