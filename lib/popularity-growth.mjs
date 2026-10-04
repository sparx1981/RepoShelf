import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),S=require('../dist/storefront.js'),P=require('../dist/providers.js'),Q=require('../dist/quality.js');
const day=86400000;
export const growthSorts=['trending','stars','forks'];
// Use the storefront's measured trend score, not visitor activity or lifetime rank.
export function popularityGrowth(entries,{now=Date.now(),sort='trending',limit=20}={}){
 if(!growthSorts.includes(sort)||!Number.isInteger(limit)||limit<1||limit>50)throw new RangeError('Invalid growth ranking options');
 const candidates=entries.filter(r=>!P.isSpace(r)&&r.availability!=='unavailable'&&Q.hasLiveDemo(r));
 const coverage={eligible:candidates.length,observed24h:0,observed48h:0,missingObservation:0,stale:0,baselineMissing:0,measured:0,growing:0,retryPending:0};
 const items=[];
 for(const r of candidates){
  if(r.checkError)coverage.retryPending++;
  const at=Date.parse(r.lastCheckedAt),age=now-at;
  if(!Number.isFinite(at)||age<0||!Number.isFinite(r.stars)||!Number.isFinite(r.forks)||r.stars<0||r.forks<0){coverage.missingObservation++;continue}
  if(age<=day)coverage.observed24h++;
  if(age>2*day){coverage.stale++;continue}
  coverage.observed48h++;
  const samples=(r.metrics||[]).filter(p=>typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))&&Date.parse(p.at)>=now-35*day&&Date.parse(p.at)<=at&&Number.isFinite(p.stars)&&Number.isFinite(p.forks)&&p.stars>=0&&p.forks>=0);
  const {trendSummary,...raw}=r;const trend=S.trend({...raw,metrics:samples},now);
  if(!trend){coverage.baselineMissing++;continue}
  coverage.measured++;
  if(!(trend.score>0))continue;
  coverage.growing++;
  const history=samples.concat([{at:r.lastCheckedAt,stars:r.stars,forks:r.forks}]).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const daily=new Map();for(const p of history)daily.set(p.at.slice(0,10),{at:p.at,stars:p.stars,forks:p.forks});
  items.push({id:r.full,name:r.name||r.full,category:r.category||null,stars:r.stars,forks:r.forks,starGain:trend.stars,forkGain:trend.forks,starsPerDay:trend.stars/trend.days,forksPerDay:trend.forks/trend.days,days:trend.days,score:trend.score,from:new Date(at-trend.days*day).toISOString(),to:r.lastCheckedAt,retryPending:Boolean(r.checkError),history:[...daily.values()].slice(-35)});
 }
 const value=r=>sort==='stars'?r.starsPerDay:sort==='forks'?r.forksPerDay:r.score;
 items.sort((a,b)=>value(b)-value(a)||b.score-a.score||a.id.localeCompare(b.id));
 return {checkedAt:new Date(now).toISOString(),sort,total:items.length,limit,coverage,items:items.slice(0,limit),method:{targetDays:7,minDays:1,maxDays:9,freshnessHours:48,historyDays:35,githubOnly:true,score:'0.7 × ln(1 + stars gained per day) + 0.3 × ln(1 + forks gained per day)'}};
}
