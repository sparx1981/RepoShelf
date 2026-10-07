// The job time limits used by the workflows. GitHub shows a job that reaches its limit as 'cancelled'.
const TIME_LIMITS=[3,15,25,30,40,45,55,65,75];
export function diagnoseSync(run,jobs,report,browserProgress=null){
const steps=jobs?.flatMap(job=>job.steps||[])||[],publication=steps.some(s=>/Publish (?:refreshed catalog|discoveries before browser checks)/.test(s.name)&&s.conclusion==='success'),published=report?.publication==='awaiting_publication'?null:['unchanged','failed'].includes(report?.publication)?false:publication||['main_saved','discovery_saved'].includes(report?.publication)?true:steps.some(s=>/Publish /.test(s.name)&&s.conclusion==='failure')?false:null;
const interrupted=steps.find(s=>['failure','cancelled','timed_out'].includes(s.conclusion)),active=steps.find(s=>s.status==='in_progress'),job=jobs?.find(j=>['failure','cancelled','timed_out'].includes(j.conclusion)),durationMinutes=job?.completed_at&&job?.started_at?Math.round((Date.parse(job.completed_at)-Date.parse(job.started_at))/60000):null;
let kind='complete',message=run.name&&!/catalogue|catalog/i.test(run.name)?'Workflow completed.':'Sync completed.',stage=interrupted?.name||active?.name||null;
if(run.conclusion==='cancelled'&&jobs?.length===0){kind='cancelled_before_start';message='Cancelled before a runner started. No scan ran. GitHub can replace a pending run when a newer request is queued.'}
else if(interrupted||['failure','cancelled','timed_out'].includes(run.conclusion)){kind='interrupted';const timedOut=job?.conclusion==='timed_out'||run.conclusion==='timed_out';const limit=TIME_LIMITS.find(m=>Math.abs((durationMinutes??-99)-m)<=1);message=timedOut?'The workflow time limit was reached.':run.conclusion==='cancelled'&&limit?'The run was stopped at the time limit for its job (about '+limit+' minutes), not by a person.':run.conclusion==='cancelled'?'The run was cancelled. GitHub does not identify the cancellation reason in this response.':'A workflow step failed.';if(stage)message+=' Stage: '+stage+'.'}
else if(run.status!=='completed'){kind='running';if(browserProgress&&!browserProgress.stale){stage=browserProgress.stage;message=browserProgress.status==='complete'?'Browser work completed; the workflow is saving and finishing.':'Running browser checks. Live counters are shown below.'}else message=stage?'Running: '+stage+'.':'Waiting for a runner or starting the sync.'}
else if(report?.stages?.some(s=>s.status==='failure')){kind='partial';message='Sync finished with an optional stage failure. Failed checks will be retried on a later run.'}
if(run.status==='completed'&&kind==='complete'&&report?.phase&&report.phase!=='complete'){kind='checkpoint';message='Only a '+report.phase+' checkpoint was saved; final work totals are unavailable.'}
else if(run.status==='completed'&&kind==='complete'&&report?.counts?.added===0&&report?.counts?.updated===0){kind='no_changes';message='Sync completed without listing changes.'}
if(report?.work?.discovery?.ready===false)message+=' New discovery was paused while existing catalogue quality improves.';
if(report?.work?.browser?.due===false)message+=report.work.browser.eligibilityBased?' Demo and screenshot checks were skipped because no listings are currently eligible; cooldowns and retry dates are respected.':' Demo and screenshot checks were skipped because this browser window already completed.';
if(run.status!=='completed'&&report?.phase)message+=' Counts are from the '+report.phase+' checkpoint, not the finished run.';
const deferred=report?.publication==='awaiting_publication';
const finalFailed=steps.some(s=>s.name==='Publish refreshed catalog'&&s.conclusion==='failure');if(deferred)message+=' Changes were saved for daily publication at 06:35 UTC, or an administrator can publish them now.';else if(published===true)message+=finalFailed?' Discoveries were saved, but final demo and preview changes were not confirmed published.':' Catalogue changes were saved.';else if(report?.publication==='unchanged')message+=' No public content changed; the report was saved to the checkpoint branch without requesting a deployment.';else if(published===false)message+=' Publication failed; these scan counts are not confirmed in the live catalogue.';else if(report&&kind!=='cancelled_before_start')message+=report.publication==='checkpoint_saved'?' Recovery data was saved to the checkpoint branch; main publication is not confirmed.':' Saved scan counts are available; publication could not be confirmed.';
return {kind,message,stage,durationMinutes,published,publication:deferred?'awaiting_publication':report?.publication==='unchanged'?'unchanged':published===true?(finalFailed?'discovery_only':'saved'):published===false?'failed':'unknown'};
}

export function syncFreshness(runs,now=Date.now()){const successful=runs.filter(r=>r.status==='success'&&r.finishedAt).sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt))[0];const lastSuccessAt=successful?.finishedAt||null;const age=now-Date.parse(lastSuccessAt);return {discoveryHours:2,browserHours:2,lastSuccessAt,lastSuccessId:successful?.id||null,overdue:Number.isFinite(age)&&age>3*3600000,nextExpectedAt:lastSuccessAt?new Date(Date.parse(lastSuccessAt)+2*3600000).toISOString():null}}

export function syncHealth(runs,{now=Date.now(),live=true}={}){const ordered=[...runs].sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)),freshness=syncFreshness(ordered,now),alerts=[],latest=ordered[0],workflowUrl='https://github.com/sparx1981/RepoShelf/actions/workflows/catalog.yml';const add=(id,level,title,message,url=workflowUrl)=>alerts.push({id,level,title,message,url});
if(!live)add('history-unavailable','warning','Live workflow status is unavailable','Saved reports are shown. Refresh before retrying: a sync may already be running.');
if(live&&freshness.overdue)add('overdue','warning','A successful sync is overdue','More than three hours have passed since the last successful run. GitHub can delay scheduled triggers. Check for an active run before starting a manual sync.');
if(live&&!freshness.lastSuccessAt&&ordered.length)add('no-success','warning','No recent successful sync was found','The current workflow page does not show a successful run. Check the publication steps and earlier history.');
const terminal=ordered.find(r=>!['in_progress','queued','waiting','pending','requested'].includes(r.status));if(live&&terminal&&['failure','timed_out','cancelled'].includes(terminal.status)&&terminal.diagnostics?.kind!=='cancelled_before_start'){const partial=terminal.diagnostics?.published===true;add('latest-failure',partial?'warning':'error',partial?'The latest sync was interrupted':'The latest sync did not complete',terminal.diagnostics?.message||'Open the workflow log to identify the failed stage. Saved listings remain available.',terminal.url||workflowUrl)}
if(live&&latest&&['in_progress','queued','waiting','pending','requested'].includes(latest.status)&&now-Date.parse(latest.startedAt)>40*60000)add('slow-run','warning','A sync is taking longer than usual','Open the current run to see its active stage. Allow it to finish before starting another sync.',latest.url||workflowUrl);
if(live&&terminal?.status==='success'&&terminal.stages?.some(s=>s.status==='failure'))add('optional-failure','warning','Some enrichment work needs a retry','The sync completed, but an optional stage failed. Existing data was retained; due checks will retry automatically.',terminal.url||workflowUrl);
return {state:alerts.some(a=>a.level==='error')?'error':alerts.length?'attention':live&&freshness.lastSuccessAt?'healthy':'unknown',alerts,freshness,latestRunId:latest?.id||null,workflowUrl,checkedAt:new Date(now).toISOString()};}

// Whether the live website is running the newest saved version. Vercel's own status is used when GitHub can show it.
// Without it (a private repository needs a token with commit-status access), the running site's own commit is compared
// with the newest commit on main, which needs nothing from Vercel.
export function deploymentStatus(data,now=Date.now(),{liveSha=null,head=null}={}){
const vercel='https://vercel.com/sparx1981/reposhelf',checkedAt=new Date(now).toISOString(),sha=value=>/^[a-f0-9]{40}$/.test(value||'')?value:null;
const status=(data?.statuses||[]).filter(s=>s.context==='Vercel').sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
if(status){
 let url=vercel;try{const target=new URL(status.target_url);if(target.protocol==='https:'&&['vercel.com','github.com'].includes(target.hostname)&&!target.username&&!target.password)url=target.href}catch{}
 return {state:status.state==='success'?'ready':status.state==='failure'||status.state==='error'?'blocked':'pending',description:String(status.description||'').slice(0,400),url,commit:sha(data.sha),checkedAt};
}
const live=sha(liveSha),newest=sha(head?.sha);
if(live&&newest){
 if(live===newest)return {state:'ready',description:'The live website is running the newest saved version.',url:vercel,commit:newest,checkedAt};
 const age=Date.parse(head.at),minutes=Number.isFinite(age)?Math.max(0,Math.round((now-age)/60000)):null;
 if(minutes!==null&&minutes<20)return {state:'pending',description:'A newer version was saved '+(minutes<2?'a moment':minutes+' minutes')+' ago and is being published.',url:vercel,commit:newest,checkedAt};
 return {state:'delayed',description:'A newer version was saved'+(minutes===null?'':minutes<120?' '+minutes+' minutes ago':' '+Math.round(minutes/60)+' hours ago')+', but the live website is still running an older one.',url:vercel,commit:newest,checkedAt};
}
return {state:'unknown',description:'RepoShelf could not check whether the live website is up to date.',url:vercel,checkedAt};
}

// ---- Plain-language run descriptions for the Sync log
const KINDS={'catalog.yml':'catalogue','publication.yml':'publish','submissions.yml':'submissions','launch-acceleration.yml':'launch','recovery.yml':'recovery'};
const KIND_TEXT={
 catalogue:{label:'Catalogue sync',what:'Looks for new listings, re-checks existing ones and saves the results. This is the run that adds and updates listings.',counts:true},
 publish:{label:'Website publication',what:'Sends the saved listings to the live website so visitors can see them.'},
 submissions:{label:'Submitted repositories check',what:'Looks at repositories people have submitted to the store and queues them for the next sync.'},
 launch:{label:'Launch pacing check',what:'A short check that decides whether an extra catalogue sync is needed during launch.'},
 recovery:{label:'Listing repair',what:'Re-checks listings that were left incomplete by an earlier run.',counts:true}
};
const NAME_KINDS=[[/^Publish saved catalogue/i,'publish'],[/^Scan submitted repositories/i,'submissions'],[/^Bounded launch acceleration/i,'launch'],[/^Recover incomplete catalogue/i,'recovery']];
export function runKind(run){return KINDS[String(run?.path||'').split('/').pop()]||NAME_KINDS.find(([re])=>re.test(String(run?.name||'')))?.[1]||'catalogue'}
// How the run started, in words an administrator would use.
function startedBy(run){
 const login=run.triggering_actor?.login||run.actor?.login||'',bot=/\[bot\]$/.test(login),event=run.event;
 if(event==='schedule')return 'on its schedule';
 if(event==='push')return 'after a change to the website code';
 if(event==='workflow_run')return 'after another run finished';
 if(run.display_title==='Automatic catch-up sync'||bot&&event==='workflow_dispatch')return 'automatically';
 if(event==='workflow_dispatch')return 'by an administrator';
 return String(event||'').replaceAll('_',' ');
}
const STEP_TEXT=[[/^Restore (?:unpublished generated checkpoint data|existing preview files|accumulated generated changes)/,'Restoring saved catalogue data (takes about 12 minutes)'],[/^Unpack saved/,'Unpacking saved data'],[/^Validate catalog logic/,'Checking the application'],[/^Refresh public moderation/,'Applying moderation settings'],[/^Remove saved projects without demo/,'Removing listings without demo links'],[/^Compress/,'Compressing screenshots'],[/^Prioritise existing catalogue quality/,'Checking catalogue quality'],[/^Import Hugging Face/,'Importing Hugging Face Spaces and curated lists'],[/^Discover repositories discussed/,'Finding listings discussed on Hacker News and Bluesky'],[/^Find public repository demos/,'Finding GitHub repositories with demos'],[/^Enrich releases/,'Adding release and technology details'],[/^Extract author-written/,'Reading project overviews'],[/^Save supporting agent/,'Saving supporting documents'],[/^Generate optional AI/,'Writing AI overviews'],[/^Refresh all saved category/,'Sorting listings into categories'],[/^Record growth/,'Recording growth'],[/^Save discovery/,'Saving discovery results'],[/^Check eligible demo/,'Checking which demos are due'],[/^Prepare parallel browser/,'Preparing browser checks'],[/^Save prepared catalogue/,'Handing results to the browser runners'],[/^Validate demos and capture previews/,'Checking demos and capturing screenshots'],[/^Install screenshot browser/,'Setting up the browser'],[/^Download all completed browser/,'Collecting browser results'],[/^Merge parallel browser/,'Merging browser results'],[/^Save sync report/,'Saving the sync report'],[/^Save completed sync/,'Saving the completed sync'],[/^Retain sync diagnostics/,'Saving diagnostics'],[/^Publish the latest saved catalogue/,'Publishing the saved listings']];
export const friendlyStep=name=>STEP_TEXT.find(([re])=>re.test(String(name||'')))?.[1]||String(name||'').replace(/^Run (actions\/[\w-]+)@v\d+$/,'Setting up ($1)');
const PHASES=[[/^prepare$/,1,'Finding and saving listings'],[/^browser/,2,'Checking demos and capturing screenshots'],[/^refresh$/,3,'Merging and saving results']];
// Where a running catalogue sync is, from the job and step list GitHub reports: which of its three phases, and how far through it.
export function runProgress(jobs){
 if(!Array.isArray(jobs)||!jobs.length)return null;
 const counted=job=>(job.steps||[]).filter(st=>!/^(Post Run|Complete job|Set up job)/.test(st.name)),running=jobs.filter(j=>j.status==='in_progress');
 const browsers=jobs.filter(j=>/^browser/.test(j.name));
 const current=running[running.length-1]||jobs[jobs.length-1],phase=PHASES.find(([re])=>re.test(current.name));
 if(!phase)return null;
 if(phase[1]===2&&browsers.length){const done=browsers.filter(j=>j.status==='completed').length;return {phase:2,phases:3,title:phase[2],detail:done+' of '+browsers.length+' browser runners finished'}}
 const steps=counted(current),done=steps.filter(st=>st.status==='completed').length,active=steps.find(st=>st.status==='in_progress');
 return {phase:phase[1],phases:3,title:phase[2],detail:'Step '+Math.min(steps.length,done+(active?1:0)||1)+' of '+steps.length+(active?': '+friendlyStep(active.name):'')};
}
// Label, explanation and how the run started, so each row says what kind of run it is without GitHub's workflow names.
export function describeRun(run,jobs){
 const kind=runKind(run),text=KIND_TEXT[kind],catchup=run.display_title==='Automatic catch-up sync';
 return {kind,label:catchup?'Catch-up sync':text.label,what:text.what,startedBy:startedBy(run),hasCounts:Boolean(text.counts),progress:kind==='catalogue'&&run.status!=='completed'?runProgress(jobs):null};
}
