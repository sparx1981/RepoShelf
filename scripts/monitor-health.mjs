import {appendFile,readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createCheckpointStore} from '../lib/checkpoint-store.mjs';
import {deploymentStatus} from '../lib/sync-diagnostics.mjs';
const repo='sparx1981/RepoShelf',base='https://reposhelf.vercel.app';
export function syncAlerts(runs,now=Date.now()){
 const alerts=[],completed=runs.filter(r=>r.status==='completed'&&r.conclusion!=='skipped'),success=completed.find(r=>r.conclusion==='success');
 const failed=completed.filter(r=>r.conclusion!=='cancelled').slice(0,2);
 if(failed.length===2&&failed.every(r=>['failure','timed_out'].includes(r.conclusion)))alerts.push({id:'repeated-sync-failure',message:'Two consecutive maintenance runs failed. Inspect the workflow logs before retrying.',url:failed[0].html_url});
 if(!success||!Number.isFinite(Date.parse(success.updated_at))||now-Date.parse(success.updated_at)>6*3600000)alerts.push({id:'sync-overdue',message:'No successful catalogue maintenance run was found in the last six hours.',url:'https://github.com/'+repo+'/actions/workflows/catalog.yml'});
 return alerts;
}
export function enrichmentAlerts(reports,now=Date.now()){
 const recent=reports.filter(r=>r.phase==='complete'&&now-Date.parse(r.recordedAt)<6*3600000).sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt)).slice(0,2);
 if(recent.length<2)return [];
 const failed=recent[0].stages?.filter(s=>s.status==='failure'&&recent[1].stages?.some(t=>t.id===s.id&&t.status==='failure'))||[];
 return failed.map(s=>({id:'stage-'+s.id,message:'The '+s.name+' stage failed in two consecutive saved maintenance reports.',url:'https://github.com/'+repo+'/actions/workflows/catalog.yml'}));
}
export function publicationAlerts(runs,now=Date.now()){
 const completed=runs.filter(r=>r.status==='completed').sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at));
 const latest=completed[0],success=completed.find(r=>r.conclusion==='success'),url='https://github.com/'+repo+'/actions/workflows/publication.yml';
 if(['failure','timed_out'].includes(latest?.conclusion))return [{id:'publication-failed',message:'The latest catalogue publication failed. Saved sync data remains on the checkpoint branch.',url:latest.html_url||url}];
 if(success&&now-Date.parse(success.updated_at)>30*3600000)return [{id:'publication-overdue',message:'No successful daily publication check has completed within 30 hours.',url}];
 return [];
}
export function storefrontAlerts(session,browse,now=Date.now()){
 const alerts=[];if(session.enabled!==true||session.launchAnalyticsEnabled!==true||session.user!==null)alerts.push({id:'account-service',message:'The public account service or launch analytics storage readiness check failed.'});
 if(!browse.catalogVersion||!Array.isArray(browse.items)||!Number.isSafeInteger(browse.indexed)||browse.indexed<1)alerts.push({id:'browse-service',message:'The compact storefront returned invalid or empty catalogue data.'});
 const at=Date.parse(browse.snapshots?.catalog);if(!Number.isFinite(at)||now-at>30*3600000)alerts.push({id:'catalogue-stale',message:'Published GitHub catalogue data has not refreshed within the 30-hour daily publication allowance.'});
 return alerts;
}
export async function monitor({fetcher=fetch,token=process.env.GITHUB_TOKEN,now=Date.now()}={}){
 const gh=async(path,options={})=>{const response=await fetcher('https://api.github.com/repos/'+repo+path,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RepoShelf-health',...token?{Authorization:'Bearer '+token}:{},...options.body?{'Content-Type':'application/json'}:{}},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('GitHub health monitor request failed ('+response.status+').');return response.status===204?null:response.json()};
 const history=await gh('/actions/workflows/catalog.yml/runs?per_page=50'),alerts=syncAlerts(history.workflow_runs||[],now);let production,deployment;
 try{const publication=await gh('/actions/workflows/publication.yml/runs?per_page=30');alerts.push(...publicationAlerts(publication.workflow_runs||[],now))}catch{console.warn('Catalogue publication history could not be checked.')}

 try{deployment=deploymentStatus(await gh('/commits/main/status'),now);if(deployment.state==='blocked')alerts.push({id:'deployment-blocked',message:'Vercel has blocked the latest main deployment: '+deployment.description+' Saved GitHub changes may not be live.',url:deployment.url})}catch{console.warn('Latest deployment status could not be checked.')}
 const directory=new URL('../data/sync-runs/',import.meta.url);let names=[];try{names=await readdir(directory)}catch(e){if(e.code!=='ENOENT')throw e}const saved=await Promise.all(names.filter(n=>/^\d+\.json$/.test(n)).map(async n=>JSON.parse(await readFile(new URL(n,directory),'utf8'))));const checkpointReports=await createCheckpointStore({fetcher}).reports(null);const reports=new Map(saved.map(r=>[r.id,r]));for(const row of checkpointReports)reports.set(row.id,row);alerts.push(...enrichmentAlerts([...reports.values()],now));
 for(let attempt=0;attempt<3;attempt++){
  try{const get=async(path,options={})=>{const response=await fetcher(base+path,{...options,signal:AbortSignal.timeout(20000),redirect:'error'});if(!response.ok)throw Error('Endpoint returned '+response.status);return response.json()};
   const [session,browse]=await Promise.all([get('/api/auth'),get('/api/editorial?action=browse',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({limit:1,demos:true})})]);
   if(browse.items?.[0]){const detail=await get('/api/editorial?action=detail&id='+encodeURIComponent(browse.items[0].full));if(detail.repo?.full!==browse.items[0].full)throw Error('Details mismatch')}
   production={session,browse};break;
  }catch{if(attempt<2)await new Promise(resolve=>setTimeout(resolve,3000))}
 }
 if(production)alerts.push(...storefrontAlerts(production.session,production.browse,now));else alerts.push({id:'production-unavailable',message:'Account, catalogue or listing-detail endpoints failed three production checks.'});
 const signature=alerts.map(a=>a.id).sort().join(','),marker='<!-- reposhelf-health-monitor -->',fingerprint='<!-- checks:'+signature+' -->';
 const issues=await gh('/issues?state=open&per_page=100'),existing=issues.find(i=>!i.pull_request&&i.user?.login==='github-actions[bot]'&&i.body?.includes(marker));
 const body=marker+'\n'+fingerprint+'\n\n'+(alerts.length?'RepoShelf needs attention.':'RepoShelf recovered; all monitored checks passed.')+'\n\n'+alerts.map(a=>'- **'+a.id+'**: '+a.message+(a.url?' [Inspect workflow]('+a.url+')':'')).join('\n')+'\n\nChecked '+new Date(now).toISOString()+'.\n\nChecks run every 30 minutes and after catalogue maintenance or publication. A watchdog requests one catch-up after three hours without a successful sync, unless a run is active or an attempt is within its retry backoff. Failed runs first retry after 30 minutes, with increasing backoff. Alerts use a six-hour allowance for a two-hour sync schedule and a 30-hour allowance for daily storefront publication; GitHub can delay scheduled workflows. Catalogue growth is intentionally paused while quality improves. This monitor checks availability and freshness, not every demo or browser journey.\n\nProduction: '+base+'\nAdmin diagnostics: '+base+'/admin.html?tab=sync';
 if(alerts.length){if(existing){if(!existing.body.includes(fingerprint))await gh('/issues/'+existing.number,{method:'PATCH',body:JSON.stringify({title:'RepoShelf operational health needs attention',body})})}else await gh('/issues',{method:'POST',body:JSON.stringify({title:'RepoShelf operational health needs attention',body})})}
 else if(existing)await gh('/issues/'+existing.number,{method:'PATCH',body:JSON.stringify({body,state:'closed',state_reason:'completed'})});
 const summary='## RepoShelf operational health\n\n'+(alerts.length?alerts.map(a=>'- '+a.message).join('\n'):'All production and maintenance checks passed.')+'\n\n'+(production?'Published projects: '+production.browse.indexed+'\n':'')+'\n';
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
 console.log(summary);return {alerts,indexed:production?.browse.indexed||null,deployment};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await monitor()}catch{console.error('Operational monitoring could not complete. Check workflow permissions, GitHub availability and whether repository Issues are enabled.');process.exitCode=1}}
