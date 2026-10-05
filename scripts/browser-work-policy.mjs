const HOUR=3600000,DAY=24*HOUR;
export function retryDelay(reason,failures){
 if(reason==='rate_limit')return Math.max(6*HOUR,failures>=3?DAY:0);
 if(failures>=2&&['dns_not_found','tls_error','challenge'].includes(reason))return 30*DAY;
 if(failures<3)return 2*HOUR;
 if(failures>=4&&['dns_unresolved','tls_error','access_restricted','http_401','http_402','http_451'].includes(reason))return 30*DAY;
 if(['access_restricted','unsafe_target','dns_unresolved','http_401','http_402','http_451'].includes(reason))return 7*DAY;
 return failures>=6?3*DAY:DAY;
}
export function browserLane(r){
 const h=r.demoHealth?.url===r.demo?r.demoHealth:null,p=r.previewCheck?.url===r.demo?r.previewCheck:null;
 if(r.demoReport?.id&&r.demoReport.id!==h?.reportId||r.adminRefreshAppliedAt&&!h?.attemptedAt)return 'admission';
 if((h?.consecutiveTemporaryFailures||0)>=3||(p?.consecutiveFailures||0)>=3)return 'repair';
 const image=(r.screenshots||[]).some(i=>i.kind==='demo'&&(!i.url||i.url===r.demo));
 return image&&h?.checkedAt?'maintenance':'admission';
}
export function balancedBrowserWork(previews,health){
 const queues={admission:[],maintenance:[],repair:[]},original=new Map();
 for(const [name,rows] of Object.entries({previews,health}))for(const r of rows){const id=r.full.toLowerCase();if(original.has(id))continue;original.set(id,name);queues[browserLane(r)].push(r);}
 return {queues,original,weights:{admission:6,maintenance:3,repair:1}};
}
