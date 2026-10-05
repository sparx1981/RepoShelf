import {createRequire} from 'node:module';
const D=createRequire(import.meta.url)('../dist/discovery.js');
export function alternativeDemos(markdown,homepage,current){let text=String(markdown||''),urls=[];for(let i=0;i<6;i++){const candidate=D.extractDemo(text,homepage);if(!candidate)break;if(candidate!==current&&!urls.includes(candidate))urls.push(candidate);text=text.split(candidate).join('');}return urls.slice(0,2)}
export function createDemoLinkRepair({fetcher=fetch,token,limit=80}={}){
 let checked=0,paused=false;const seen=new Set();
 return async(r,result)=>{
  if(paused||checked>=limit||r.source==='huggingface'||!/^[\w.-]+\/[\w.-]+$/.test(r.full)||result.kind==='working'||result.reason==='unsafe_target'||result.reason==='rate_limit'||seen.has(r.full))return [];
  seen.add(r.full);checked++;
  const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-demo-repair',...token?{Authorization:'Bearer '+token}:{}};
  const get=async suffix=>{const res=await fetcher('https://api.github.com/repos/'+r.full+suffix,{headers,redirect:'error',signal:AbortSignal.timeout(8000)});if([401,403,429].includes(res.status))paused=true;if(!res.ok)return null;return res.json()};
  try{const repo=await get('');if(!repo||repo.private)return [];const readme=await get('/readme');if(readme?.encoding!=='base64'||typeof readme.content!=='string'||readme.content.length>1500000)return [];const markdown=Buffer.from(readme.content,'base64').toString('utf8');return alternativeDemos(markdown,repo.homepage,r.demo)}catch{return []}
 };
}
