export const publicationWorkflow='https://github.com/sparx1981/RepoShelf/actions/workflows/publication.yml';
export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function scheduledPublicationDue(state,now=Date.now()){return state?.lastScheduledDay!==utcDay(now)}
export function publicationSummary(state){return {dailyTimeUTC:'06:35',lastPublishedAt:state?.lastPublishedAt||null,commit:state?.commit||null,lastScheduledDay:state?.lastScheduledDay||null,workflowUrl:publicationWorkflow}}
