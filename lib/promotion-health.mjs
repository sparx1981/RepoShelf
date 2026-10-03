import http from 'node:http';import https from 'node:https';import {lookup} from 'node:dns/promises';import {publicIP} from '../scripts/demo-health.mjs';
// Pin a validated public IP per request. Redirects are revalidated, never followed implicitly.
export async function demoAvailable(value,{resolver=lookup,send}={}){
try{let url=new URL(value);for(let n=0;n<4;n++){
if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port))return 'temporary';
const hostname=url.hostname.replace(/^\[|\]$/g,''),addresses=await resolver(hostname,{all:true});if(!addresses.length||addresses.some(a=>!publicIP(a.address)))return 'temporary';const ip=addresses[0];
const result=send?await send(url,ip):await new Promise((resolve,reject)=>{const req=(url.protocol==='https:'?https:http).request(url,{method:'GET',headers:{'User-Agent':'RepoShelf-promotion-check'},lookup:(_host,options,cb)=>cb(null,options?.all?[ip]:ip.address,ip.family)},res=>{resolve({status:res.statusCode,location:res.headers.location});res.destroy()});req.setTimeout(5000,()=>req.destroy(Error('Timeout')));req.on('error',reject);req.end()});
if([404,410].includes(result.status))return 'unavailable';if(result.status>=300&&result.status<400&&result.location){url=new URL(result.location,url);continue}return result.status>=200&&result.status<300?'available':'temporary';
}return 'temporary'}catch{return 'temporary'}
}
