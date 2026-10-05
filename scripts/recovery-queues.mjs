import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Q=require('../dist/quality.js');
export function recoveryQueues(entries,now=Date.now()){
 const queues={previews:[],health:[]};
 for(const r of entries){
  if(!r.demo||r.availability==='unavailable')continue;
  const h=Q.demoState(r),p=r.previewCheck?.url===r.demo?r.previewCheck:null;
  if(h?.status==='unavailable')continue;
  const reason=p?.reason||h?.error?.reason;
  // Recovery never overrides an explicit server rate limit or an unsafe URL.
  if(reason==='unsafe_target'||reason==='rate_limit'&&Date.parse(p?.nextCheckAt||h?.nextCheckAt)>now)continue;
  const screenshot=(r.screenshots||[]).some(s=>s.kind==='demo'&&s.src&&(!s.url||s.url===r.demo));
  const validated=h?.checkedAt&&!h.error&&['working','review'].includes(h.status)&&now-Date.parse(h.checkedAt)<=7*86400000;
  if(!screenshot)queues.previews.push(r);else if(!validated)queues.health.push(r);
 }
 for(const queue of Object.values(queues))queue.sort((a,b)=>Number(Boolean(b.qualityPriority))-Number(Boolean(a.qualityPriority))||(b.stars||b.likes||0)-(a.stars||a.likes||0));
 return queues;
}
