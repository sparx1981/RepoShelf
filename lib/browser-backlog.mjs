export function browserBacklogState(r){
 const h=r.demoHealth?.url===r.demo?r.demoHealth:null,p=r.previewCheck?.url===r.demo?r.previewCheck:null;
 const captured=(r.screenshots||[]).some(s=>s.kind==='demo'&&(!s.url||s.url===r.demo));
 const demoComplete=Boolean(h?.checkedAt&&['working','review','unavailable'].includes(h.status));
 const demoFailures=Number(h?.consecutiveTemporaryFailures)||0,previewFailures=Number(p?.consecutiveFailures)||0;
 return {demo:demoFailures>=3?'repeated':demoComplete?'complete':h?.attemptedAt?'retry':'never',
  screenshot:captured?'complete':previewFailures>=3||demoFailures>=3?'repeated':p?.attemptedAt||(!r.previewCheck&&r.previewAttemptAt)?'retry':'never',
  demoFailures,previewFailures,reason:p?.reason||h?.error?.reason||null,nextRetryAt:p?.nextCheckAt||h?.nextCheckAt||null};
}
export function browserBacklog(entries){
 const result={demo:{never:0,retry:0,repeated:0,complete:0},screenshot:{never:0,retry:0,repeated:0,complete:0}};
 for(const r of entries){if(!r.demo||r.availability==='unavailable'||r.listingControl&&r.listingControl!=='visible')continue;const state=browserBacklogState(r);result.demo[state.demo]++;if(r.demoHealth?.url!==r.demo||r.demoHealth?.status!=='unavailable')result.screenshot[state.screenshot]++;}
 return result;
}
