// The daily X import (x-intake.yml) is scheduled at 06:20 UTC in the same concurrency group as the catalogue sync and the daily
// publication. GitHub keeps one waiting run per group, so on a busy morning the waiting import is replaced and shows as cancelled,
// and nothing else would ever start it again. The maintenance timer uses this to start it once, later in the day.
export const CATCH_UP_AFTER_MINUTES=8*60+30; // 08:30 UTC: the scheduled run has had two hours to get its turn
export function collectorWindowStart(now){const start=new Date(now);start.setUTCHours(6,0,0,0);if(start.getTime()>now)start.setUTCDate(start.getUTCDate()-1);return start.getTime()}
// runs: x-intake.yml history (newest first), as returned by the Actions API.
export function xImportDue(runs,now){
 const date=new Date(now);if(date.getUTCHours()*60+date.getUTCMinutes()<CATCH_UP_AFTER_MINUTES)return {due:false,reason:'too_early'};
 if(!Array.isArray(runs))return {due:false,reason:'history_unavailable'};
 const since=collectorWindowStart(now),today=runs.filter(r=>Date.parse(r.created_at)>=since-5000);
 if(today.some(r=>r.status!=='completed'))return {due:false,reason:'running_or_queued'};
 // A real outcome today, success or failure (for example the collector itself failed), is not retried: that would repeat the failure all day.
 if(today.some(r=>['success','failure','timed_out','action_required'].includes(r.conclusion)))return {due:false,reason:'already_ran'};
 // One catch-up a day. If it was cancelled too, leave it to the next scheduled run and the people who read the sync log.
 if(today.some(r=>r.event==='workflow_dispatch'))return {due:false,reason:'catch_up_already_requested'};
 return {due:true,reason:today.length?'scheduled_run_was_replaced':'scheduled_run_missing',notBefore:new Date(since).toISOString()};
}
