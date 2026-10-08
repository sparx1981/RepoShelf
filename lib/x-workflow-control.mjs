import {fail} from './accounts.mjs';
const root='https://api.github.com/repos/sparx1981/reposhelf-x-collector/actions/workflows/collect.yml';
export function createXWorkflowControl({fetcher=fetch,token=process.env.REPOSHELF_X_ACTIONS_TOKEN||process.env.REPOSHELF_ACTIONS_TOKEN||process.env.REPOSHELF_SUBMISSION_WORKFLOW_TOKEN}={}) {
  let requesting=false;
  async function request(suffix,options={}) {
    const response=await fetcher(root+suffix,{...options,headers:{Accept:'application/vnd.github+json','User-Agent':'RepoShelf-X-control','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,...options.headers},redirect:'error',signal:AbortSignal.timeout(5000)});
    if(!response.ok)fail(503,'x_workflow_unavailable','Collector workflow access failed (HTTP '+response.status+'). Give the server Actions token read/write access to reposhelf-x-collector.');
    return response;
  }
  async function scan() {
    if(!token)fail(503,'x_actions_token_required','Configure REPOSHELF_X_ACTIONS_TOKEN with Actions read/write access to reposhelf-x-collector, or grant that access to the existing REPOSHELF_ACTIONS_TOKEN.');
    if(requesting)return {requested:false,reason:'A scan request is already being sent. Check collector workflow history before retrying.'};
    requesting=true;
    try {
      const data=await (await request('/runs?branch=main&per_page=100')).json();
      if(!Array.isArray(data.workflow_runs))fail(503,'x_history_unavailable','Collector history is unavailable; no scan was requested.');
      const active=data.workflow_runs.find(r=>r.status!=='completed');
      if(active)return {requested:false,reason:'An X collector run is already running or queued.',activeRunId:active.id};
      try {await request('/dispatches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{search:true}})});}
      catch(error){if(!error.status)fail(503,'x_dispatch_unconfirmed','GitHub did not confirm the scan request. Check collector workflow history before retrying; it may have been accepted.');throw error;}
      return {requested:true,reason:'Scan requested. GitHub will start it as a runner becomes available. View progress and results in collector history.'};
    }finally{requesting=false;}
  }
  return {configured:Boolean(token),scan};
}
