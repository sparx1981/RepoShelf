import {createSceneAiSync} from '../lib/sceneai-sync.mjs';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');process.exit(1)}
async function db(path,{method='GET',body}={}){
  const headers={apikey:key,'Content-Type':'application/json'};
  if(/^eyJ/.test(key))headers.Authorization=`Bearer ${key}`;
  const r=await fetch(new URL('/rest/v1/'+path,url),{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw new Error(`Database request failed (${r.status})`);
  return data;
}
const result=await createSceneAiSync({db}).run(process.env.SYNC_TRIGGER||'weekly');
console.log('SceneAI sync finished:',JSON.stringify(result));
