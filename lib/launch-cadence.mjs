export const launchMilestone=5000,launchExtraLimit=24;
export function launchDecision({event='schedule',published=null,state={},now=Date.now()}={}){
 const date=new Date(now),baseline=date.getUTCMinutes()===17&&date.getUTCHours()%2===0;
 const recent=(state.extraRuns||[]).filter(r=>Number.isFinite(Date.parse(r.at))&&now-Date.parse(r.at)<86400000);
 const stalled=Number(state.stalledRuns||0)>=3&&Date.parse(state.retryAt)>now;
 const accelerating=Number.isFinite(published)&&published<launchMilestone&&!stalled&&recent.length<launchExtraLimit;
 return {proceed:event!=='schedule'||baseline||accelerating,accelerating,extra:event==='schedule'&&!baseline&&accelerating,published,milestone:launchMilestone,extraRuns24h:recent.length,reason:published===null?'coverage_unknown':published>=launchMilestone?'milestone_reached':stalled?'no_progress_backoff':recent.length>=launchExtraLimit?'daily_burst_limit':'launch_acceleration'};
}
export function nextLaunchSync(state,now=Date.now()){
 const fast=launchDecision({published:state?.published??null,state,now}).accelerating;const date=new Date(now);date.setUTCSeconds(0,0);
 for(let i=1;i<=121;i++){date.setTime(date.getTime()+60000);if(fast?[17,47].includes(date.getUTCMinutes()):date.getUTCMinutes()===17&&date.getUTCHours()%2===0)return date.toISOString();}return null;
}
