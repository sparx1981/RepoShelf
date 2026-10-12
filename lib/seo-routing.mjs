import {readFile} from 'node:fs/promises';
const valid=path=>typeof path==='string'&&/^\/projects\/(?:github|huggingface)\/[a-z0-9_.-]+\/[a-z0-9_.-]+\.html$/.test(path)&&!path.split('/').some(part=>part==='.'||part==='..');
export function createSEORouteHandler({root=new URL('../',import.meta.url),load=async()=>JSON.parse(await readFile(new URL('data/seo-redirects.json',root),'utf8'))}={}){
 let data;
 return async(req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
  const params=new URL(req.url,'https://www.reposhelf.co.uk').searchParams,requested=params.get('path'),markdown=requested?.endsWith('.html.md'),path=markdown?requested.slice(0,-3):requested;
  if(!valid(path)){res.writeHead(404);return res.end('Not found')}
  try{data??=await load()}catch(error){if(error.code!=='ENOENT'){res.writeHead(503,{'Cache-Control':'no-store'});return res.end('Routes unavailable')}data={redirects:{}}}
  const target=Object.hasOwn(data.redirects||{},path)?data.redirects[path]:null;
  if(!valid(target)||target===path){res.writeHead(404,{'Cache-Control':'no-store'});return res.end('Not found')}
  res.writeHead(301,{Location:target+(markdown?'.md':''),'Cache-Control':'public, max-age=0, must-revalidate'});res.end();
 };
}
export default createSEORouteHandler();
