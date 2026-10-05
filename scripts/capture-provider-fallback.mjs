import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
import {publicUrlGuard} from './demo-health.mjs';import {inspectPreview,compressedPreview} from './preview-quality.mjs';import {recordStageMetrics} from './sync-metrics.mjs';
export const providerIds=['screenshotone','thumio','cloudflare'];
export function providerReadiness(env){return {screenshotone:Boolean(env.SCREENSHOTONE_ACCESS_KEY),thumio:true,cloudflare:Boolean(env.CLOUDFLARE_BROWSER_TOKEN&&/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID||''))}}
export function providerCandidate(r,now=Date.now()){return r.availability!=='unavailable'&&r.demo&&r.demoHealth?.url===r.demo&&r.demoHealth.status==='working'&&!r.demoHealth.error&&now-Date.parse(r.demoHealth.checkedAt)<=7*86400000&&!(r.screenshots||[]).some(s=>s.kind==='demo'&&s.url===r.demo)&&(!r.previewCandidate||r.previewCandidate.url!==r.demo)&&(!r.providerAttemptAt||now-Date.parse(r.providerAttemptAt)>=30*86400000)}
async function boundedBytes(response,max=8000000){if(!response.ok||!/^image\/(png|jpeg|webp)/.test(response.headers.get('content-type')||''))throw Error('provider_response');const chunks=[];let size=0;for await(const part of response.body){size+=part.length;if(size>max)throw Error('provider_image_too_large');chunks.push(part)}return Buffer.concat(chunks)}
export async function providerImage(id,target,{env=process.env,fetcher=fetch}={}){
 const options={signal:AbortSignal.timeout(45000),redirect:'error'};let url,headers={},body,method='GET';
 if(id==='screenshotone'){url=new URL('https://api.screenshotone.com/take');url.search=new URLSearchParams({url:target,format:'jpg',viewport_width:'1280',viewport_height:'800',image_quality:'60',delay:'3',timeout:'35',cache:'false',fail_if_request_failed:'true'}).toString();headers={'X-Access-Key':env.SCREENSHOTONE_ACCESS_KEY}}
 else if(id==='thumio')url='https://image.thum.io/get/noanimate/width/1200/crop/800/'+target;
 else if(id==='cloudflare'){if(!providerReadiness(env).cloudflare)throw Error('provider_not_configured');url='https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/browser-run/screenshot';method='POST';headers={Authorization:'Bearer '+env.CLOUDFLARE_BROWSER_TOKEN,'Content-Type':'application/json'};body=JSON.stringify({url:target,viewport:{width:1280,height:800},gotoOptions:{waitUntil:'networkidle2',timeout:30000},screenshotOptions:{type:'jpeg',quality:60,fullPage:false}})}
 else throw Error('invalid_provider');return boundedBytes(await fetcher(url,{...options,method,headers,body}));
}
export async function runProviderFallback(root=new URL('../',import.meta.url),env=process.env,{fetcher=fetch,guard=publicUrlGuard(),image=providerImage,inspect=inspectPreview,compress=compressedPreview}={}){
 const origin=env.REPOSHELF_PUBLIC_URL||'https://reposhelf.vercel.app',ready=providerReadiness(env),receipt={schema:1,at:new Date().toISOString(),ready,attempted:0,candidates:0,reasons:{},providers:{}};await mkdir(new URL('data/',root),{recursive:true});
 async function api(action,body={}){const res=await fetcher(origin+'/api/editorial?action='+action,{method:'POST',headers:{Authorization:'Bearer '+env.REPOSHELF_SUBMISSION_SYNC_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});if(!res.ok)throw Error('capture_configuration_unavailable');return res.json()}
 try{
  if(!env.REPOSHELF_SUBMISSION_SYNC_KEY){receipt.reason='worker_key_missing';return receipt}
  const settings=await api('capture-sync'),enabled=providerIds.filter(id=>settings.settings?.providers?.[id]&&ready[id]);receipt.enabled=enabled;
  if(!enabled.length){receipt.reason='providers_disabled_or_unconfigured';return receipt}
  const files=['catalog','spaces'].map(n=>new URL('dist/'+n+'.json',root)),snapshots=await Promise.all(files.map(async f=>JSON.parse(await readFile(f,'utf8')))),entries=snapshots.flatMap(s=>s.repositories).filter(r=>providerCandidate(r)).sort((a,b)=>Number(Boolean(b.qualityPriority))-Number(Boolean(a.qualityPriority))||(b.stars||b.likes||0)-(a.stars||a.likes||0));
  const deadline=Date.now()+180000;await mkdir(new URL('dist/previews/',root),{recursive:true});
  for(const r of entries){if(receipt.attempted>=10||Date.now()+45000>deadline)break;const target=r.source==='huggingface'?(r.appUrl||r.demo):r.demo;if(!await guard(target)){receipt.reasons.unsafe_target=(receipt.reasons.unsafe_target||0)+1;continue}
   for(const id of enabled){if(receipt.attempted>=10||Date.now()+45000>deadline)break;const reserved=await api('capture-reserve',{provider:id});if(!reserved.allowed){receipt.providers[id]={...reserved};continue}receipt.attempted++;receipt.providers[id]={...reserved};r.providerAttemptAt=new Date().toISOString();
    try{const bytes=await image(id,target,{env,fetcher}),quality=await inspect(bytes);if(!quality.usable){receipt.reasons[quality.reason]=(receipt.reasons[quality.reason]||0)+1;continue}const filename=createHash('sha256').update(r.full).digest('hex').slice(0,24)+'-provider.jpg';await writeFile(new URL('dist/previews/'+filename,root),await compress(bytes));r.previewCandidate={src:'previews/'+filename,kind:'demo',provider:id,capturedAt:r.providerAttemptAt,url:r.demo,reviewRequired:true};receipt.candidates++;break}catch{receipt.reasons.provider_failure=(receipt.reasons.provider_failure||0)+1}
   }
   // Persist after each listing, never wait until a batch's last request.
   for(let i=0;i<files.length;i++)await writeFile(files[i],JSON.stringify(snapshots[i],null,2)+'\n');
  }
 }catch{receipt.reason='capture_configuration_unavailable'}
 finally{await writeFile(new URL('data/capture-providers.json',root),JSON.stringify(receipt,null,2)+'\n');await recordStageMetrics('capture_providers',receipt,root);console.log(`Optional providers: ${receipt.attempted} requests, ${receipt.candidates} images awaiting administrator review. ${receipt.reason||''}`)}return receipt;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await runProviderFallback();
