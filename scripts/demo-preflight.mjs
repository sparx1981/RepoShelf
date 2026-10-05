import http from 'node:http';import https from 'node:https';import {lookup} from 'node:dns/promises';
import {publicIP} from './demo-health.mjs';
// Pin the validated DNS address to the connection, including every redirect.
// GET headers suffice. A timeout/403 is inconclusive and still gets a browser.
export async function demoPreflight(target,{resolver=lookup,requester=(url,opts,done)=>(url.protocol==='https:'?https:http).request(url,opts,done),timeout=5000}={}){
 const deadline=Date.now()+timeout;
 try{for(let hop=0;hop<5;hop++){
  const u=new URL(target);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return {kind:'temporary',reason:'unsafe_target',skip:true};
  let dnsTimer,addresses;try{addresses=await Promise.race([resolver(u.hostname.replace(/^\[|\]$/g,''),{all:true}),new Promise((_,reject)=>{dnsTimer=setTimeout(()=>reject(Error('dns_timeout')),Math.max(1,deadline-Date.now()));})])}finally{clearTimeout(dnsTimer)};
  if(!addresses.length||addresses.some(a=>!publicIP(a.address)))return {kind:'temporary',reason:addresses.length?'unsafe_target':'dns_unresolved',skip:true};
  const address=addresses[0],response=await new Promise((resolve,reject)=>{
   let requestTimer;const req=requester(u,{method:'GET',headers:{'User-Agent':'RepoShelf demo validator','Accept':'text/html'},lookup:(_host,options,cb)=>options?.all?cb(null,[address]):cb(null,address.address,address.family||4)},res=>{clearTimeout(requestTimer);const result={status:res.statusCode,location:res.headers.location};res.destroy();resolve(result)});
   requestTimer=setTimeout(()=>req.destroy(Error('preflight_timeout')),Math.max(1,deadline-Date.now()));req.on('error',error=>{clearTimeout(requestTimer);reject(error)});req.end();
  });
  if([301,302,303,307,308].includes(response.status)&&response.location){target=new URL(response.location,u).href;continue}
  if([404,410].includes(response.status))return {kind:'unavailable',reason:'http_'+response.status,skip:true};
  if(response.status===429)return {kind:'temporary',reason:'rate_limit',skip:true};
  return {skip:false,status:response.status};
 }}catch(e){if(['ENOTFOUND','EAI_AGAIN'].includes(e.code)||e.message==='dns_timeout')return {kind:'temporary',reason:e.message==='dns_timeout'?'dns_timeout':'dns_unresolved',skip:true};if(/^CERT_|^ERR_TLS_|SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(e.code||''))return {kind:'temporary',reason:'tls_error',skip:true};}
 return {skip:false};
}
// Different hosts proceed concurrently; visits to one host are serialised.
export function hostGate(){const tails=new Map();return async(target,work)=>{let host;try{host=new URL(target).hostname}catch{return work()}const previous=tails.get(host)||Promise.resolve();let release;const next=new Promise(resolve=>{release=resolve});tails.set(host,next);await previous;try{return await work()}finally{release();if(tails.get(host)===next)tails.delete(host)}}}
