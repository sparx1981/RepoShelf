export function browserBacklogState(r){
 const h=r.demoHealth?.url===r.demo?r.demoHealth:null,p=r.previewCheck?.url===r.demo?r.previewCheck:null;
 const captured=(r.screenshots||[]).some(s=>s.kind==='demo'&&(!s.url||s.url===r.demo));
 const demoComplete=Boolean(h?.checkedAt&&['working','review','unavailable'].includes(h.status));
 const demoFailures=Number(h?.consecutiveTemporaryFailures)||0,previewFailures=Number(p?.consecutiveFailures)||0;
 const reason=p?.reason||h?.error?.reason||h?.reason||null,reviewRecommended=demoFailures>=3||previewFailures>=3;
 const advice=reason==='unsafe_target'?'Check that the demo uses a public HTTP/S address. Correct it upstream or exclude an unsuitable listing.':reason?.startsWith('dns_')?'Check the repository’s current demo URL and domain. DNS failures remain eligible for later retry.':reason==='access_restricted'?'Open the demo manually. Access challenges may block automated checks even when a demo works for visitors.':reason==='empty_page'?'Inspect the rendered demo and its preview; the page may require interaction or additional loading time.':'Inspect the saved failure reason and demo manually before requesting a fresh check.';
 return {demo:demoFailures>=3?'repeated':demoComplete?'complete':h?.attemptedAt?'retry':'never',
  screenshot:captured?'complete':previewFailures>=3||demoFailures>=3?'repeated':p?.attemptedAt||(!r.previewCheck&&r.previewAttemptAt)?'retry':'never',
  demoFailures,previewFailures,reason,reviewRecommended,reviewAdvice:reviewRecommended?advice:null,nextRetryAt:p?.nextCheckAt||h?.nextCheckAt||null};
}
export function browserBacklog(entries){
 const result={demo:{never:0,retry:0,repeated:0,complete:0},screenshot:{never:0,retry:0,repeated:0,complete:0},reviewCount:0,reviewReasons:{}};
 for(const r of entries){if(!r.demo||r.availability==='unavailable'||r.listingControl&&r.listingControl!=='visible')continue;const state=browserBacklogState(r);result.demo[state.demo]++;if(r.demoHealth?.url!==r.demo||r.demoHealth?.status!=='unavailable')result.screenshot[state.screenshot]++;if(state.reviewRecommended){result.reviewCount++;const reason=/^[a-z0-9_]{1,64}$/.test(state.reason||'')?state.reason:'other';result.reviewReasons[reason]=(result.reviewReasons[reason]||0)+1}}
 return result;
}
