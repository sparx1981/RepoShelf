import {readFile} from 'node:fs/promises';
import {cleanSyncProgress,progressBranch} from '../lib/sync-progress.mjs';

// A small non-deploying branch carries public aggregate diagnostics only.
export function liveSyncPublisher({token=process.env.GITHUB_TOKEN,fetcher=fetch,now=Date.now,interval=60000,configFile=new URL('../vercel.json',import.meta.url)}={}){
 let sha=null,last=-Infinity,pending=null,warnings=0;
 async function request(path,method='GET',body){const response=await fetcher('https://api.github.com/repos/sparx1981/RepoShelf/'+path,{method,headers:{Accept:'application/vnd.github+json','User-Agent':'RepoShelf',Authorization:'Bearer '+token,...body?{'Content-Type':'application/json'}:{}},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(5000)});if(response.status===404&&method==='GET')return null;if(!response.ok)throw Error('Progress write unavailable');return response.json()}
 async function write(value){try{
  const content=JSON.stringify(cleanSyncProgress(value))+'\n';
  if(!sha){const saved=await request('contents/data/sync-progress.json?ref='+progressBranch);sha=saved?.sha||null;
   if(!saved){const branch=await request('git/ref/heads/'+progressBranch);
    if(!branch){const config=JSON.parse(await readFile(configFile,'utf8'));if(config.git?.deploymentEnabled?.[progressBranch]!==false)throw Error('Progress branch must not deploy');
     const tree=await request('git/trees','POST',{tree:[{path:'data/sync-progress.json',mode:'100644',type:'blob',content},{path:'vercel.json',mode:'100644',type:'blob',content:JSON.stringify(config)}]});
     const commit=await request('git/commits','POST',{message:'Sync progress [skip ci]',tree:tree.sha,parents:[]});await request('git/refs','POST',{ref:'refs/heads/'+progressBranch,sha:commit.sha});return true;
    }
   }
  }
  const result=await request('contents/data/sync-progress.json','PUT',{message:'Sync progress [skip ci]',content:Buffer.from(content).toString('base64'),branch:progressBranch,...sha?{sha}:{}});sha=result.content.sha;return true;
 }catch{sha=null;warnings++;if(warnings<=3)console.warn('Live progress write unavailable; local metrics and final checkpoints are retained.');return false}}
 function publish(value,{force=false}={}){
  if(!token||!cleanSyncProgress(value))return Promise.resolve(false);
  if(pending)return force?pending.then(()=>publish(value,{force:true})):pending;
  if(!force&&now()-last<interval)return Promise.resolve(false);last=now();
  pending=write(value).finally(()=>{pending=null});return pending;
 }
 return {publish,get warnings(){return warnings}};
}
