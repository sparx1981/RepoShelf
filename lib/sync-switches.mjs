import {createAccounts,respond,accountFailure,only,readBody,fail} from './accounts.mjs';
export const syncTypes=[
 ['catalog.yml','Catalogue sync','Discovers repositories and refreshes saved listings, demo checks and screenshots.'],
 ['submissions.yml','Submitted repositories','Validates repositories submitted by members before adding eligible listings.'],
 ['recovery.yml','Listing recovery','Retries incomplete listings, demo checks and missing screenshots.'],
 ['sceneai-sync.yml','SceneAI prompts','Imports and refreshes prompts from the SceneAI source.'],
 ['x-intake.yml','X.com candidate imports','Validates saved X.com candidates and imports eligible repositories; the separate X scanning switch controls new searches.'],
 ['promotions.yml','Promotion checks','Checks whether listed promotions remain available.'],
 ['frame-probe.yml','Demo framing checks','Checks whether demo websites can appear inside the RepoShelf viewer.'],
 ['viewer-qualification.yml','Viewer qualification','Runs browser checks that qualify demo sites for the embedded viewer.'],
 ['viewer-diagnose.yml','Viewer diagnostics','Runs manually requested browser diagnostics for embedded demo problems.'],
 ['launch-acceleration.yml','Extra catalogue runs','Schedules bounded extra catalogue runs during launch acceleration.'],
 ['publication.yml','Catalogue publication','Publishes saved catalogue changes to the public website.'],
 ['health.yml','Health checks and catch-up','Monitors sync health and requests catch-up runs when eligible.'],
 ['artifact-cleanup.yml','Workflow artifact cleanup','Removes expired workflow artifacts to limit repository storage use.']
].map(([id,label,description])=>({id,label,description}));
const base='https://api.github.com/repos/sparx1981/RepoShelf/actions/workflows';
const known=id=>syncTypes.some(t=>t.id===id),stateEnabled=state=>state==='active';
export function createSyncSwitchControl({fetcher=fetch,token=process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN}={}){
 async function request(path,options={}){if(!token)fail(503,'actions_token_required','Sync switches need the existing repository Actions token with Actions read/write access.');const r=await fetcher(base+path,{...options,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'User-Agent':'RepoShelf-sync-switches','X-GitHub-Api-Version':'2022-11-28'},redirect:'error',signal:AbortSignal.timeout(5000)});if(!r.ok)fail(503,'sync_switch_unavailable','GitHub refused the sync setting (HTTP '+r.status+'). Check Actions read/write access.');return r}
 async function list(){const data=await (await request('?per_page=100')).json();if(!Array.isArray(data.workflows))fail(503,'invalid_workflows','GitHub returned no readable workflow settings.');return syncTypes.map(t=>{const row=data.workflows.find(w=>w.path==='.github/workflows/'+t.id);return {...t,state:row?.state||'unavailable',enabled:stateEnabled(row?.state),available:['active','disabled_manually','disabled_inactivity'].includes(row?.state),url:'https://github.com/sparx1981/RepoShelf/actions/workflows/'+t.id}})}
 async function set({id,enabled,expectedState}){if(!known(id)||typeof enabled!=='boolean'||!['active','disabled_manually','disabled_inactivity'].includes(expectedState))fail(400,'invalid_sync_switch','Choose a known sync and whether it should be enabled.');const current=await (await request('/'+id)).json();if(current.state!==expectedState)fail(409,'sync_switch_changed','This sync setting changed elsewhere. Refresh before changing it.');if(stateEnabled(current.state)===enabled)return {id,enabled,state:current.state};try{await request('/'+id+(enabled?'/enable':'/disable'),{method:'PUT'})}catch(error){if(error.status)throw error;fail(503,'sync_switch_unconfirmed','GitHub did not confirm the change. Refresh the switches before trying again.')}const row=await (await request('/'+id)).json();if(!['active','disabled_manually','disabled_inactivity'].includes(row.state)||stateEnabled(row.state)!==enabled)fail(503,'sync_switch_unconfirmed','The saved state could not be confirmed. Refresh the switches before trying again.');return {id,enabled,state:row.state}}
 return {list,set};
}
export function createSyncSwitchHandler({accounts=createAccounts(),control=createSyncSwitchControl()}={}){return async(req,res)=>{try{only(req,['GET','POST']);if(req.method==='POST')accounts.origin(req);await accounts.admin(req,res);if(req.method==='POST'){const body=await readBody(req,{limit:2048});return respond(res,200,{saved:await control.set(body||{})})}return respond(res,200,{switches:await control.list()})}catch(error){accountFailure(res,error)}}}
export default createSyncSwitchHandler();
