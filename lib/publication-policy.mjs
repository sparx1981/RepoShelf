export const publicationWorkflow='https://github.com/sparx1981/RepoShelf/actions/workflows/publication.yml';
export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
// The catalogue is synced and published once a week, on Monday (UTC). Each publication is one Vercel build, so publishing weekly
// rather than daily keeps builds to about four or five a month. Sync, X imports and submissions save their changes in between
// and they all reach the site together at the next weekly publication (or sooner with "Publish now").
export const PUBLICATION_WEEKDAY=1,PUBLICATION_HOUR=6,PUBLICATION_MINUTE=35,SYNC_HOUR=3,SYNC_MINUTE=17;
// The most recent weekly slot at or before `now` (Monday at hour:minute UTC).
function latestSlot(now,hour,minute){const slot=new Date(Number(now));slot.setUTCHours(hour,minute,0,0);slot.setUTCDate(slot.getUTCDate()-((slot.getUTCDay()-PUBLICATION_WEEKDAY+7)%7));if(slot.getTime()>Number(now))slot.setUTCDate(slot.getUTCDate()-7);return slot}
function nextSlot(now,hour,minute){const slot=latestSlot(now,hour,minute);slot.setUTCDate(slot.getUTCDate()+7);return slot}
// Due once per week, from Monday 06:35 UTC. A week whose Monday run was missed is caught up by the next daily check.
export function scheduledPublicationDue(state,now=Date.now()){const slot=utcDay(latestSlot(now,PUBLICATION_HOUR,PUBLICATION_MINUTE));const last=state?.lastScheduledDay;return !(typeof last==='string'&&last>=slot)}
export function publicationSummary(state){return {dailyTimeUTC:'06:35',weekday:'Monday',schedule:'Weekly, Monday 06:35 UTC',lastPublishedAt:state?.lastPublishedAt||null,commit:state?.commit||null,lastScheduledDay:state?.lastScheduledDay||null,workflowUrl:publicationWorkflow}}

export function nextPublicationAt(now=Date.now()){return nextSlot(now,PUBLICATION_HOUR,PUBLICATION_MINUTE).toISOString()}
export function nextSyncAt(now=Date.now()){return nextSlot(now,SYNC_HOUR,SYNC_MINUTE).toISOString()}
