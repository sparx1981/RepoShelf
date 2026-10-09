import {respond, readBody, only, fail} from './accounts.mjs';
import {createXWorkflowControl} from './x-workflow-control.mjs';
import {createXPipelineStatus} from './x-pipeline-status.mjs';
const defaultControl=createXWorkflowControl();
const defaultPipeline=createXPipelineStatus();
export async function xCollectionSettings(req,res,{accounts,action,control=defaultControl,pipeline=defaultPipeline}) {
  only(req,action==='x-status'||action==='x-progress'?['GET']:action==='x-scan'?['POST']:['GET','POST']);
  let person;
  if(action!=='x-status') {
    if(req.method==='POST')accounts.origin(req);
    person=await accounts.admin(req,res);
  }
  if(action==='x-progress')return respond(res,200,await pipeline());
  if(req.method==='POST'&&action!=='x-scan') {
    const input=await readBody(req);
    if(typeof input?.enabled!=='boolean'||!Number.isSafeInteger(input.revision)||input.revision<1)fail(400,'invalid_settings','Choose whether to enable X.com scanning.');
    const settings=await accounts.request('/rest/v1/rpc/reposhelf_x_collection_settings',{token:person.token,method:'POST',body:{expected_revision:input.revision,scanning_enabled:input.enabled}});
    return respond(res,200,{settings});
  }
  let rows;
  try {
    rows=await accounts.request('/rest/v1/x_collection_settings?select=enabled,revision,updated_at&id=eq.true',action==='x-status'?{service:true}:{token:person.token});
  }catch(error) {
    if(action==='x-status'&&error.code==='migration_required')return respond(res,200,{enabled:false,ready:false});
    throw error;
  }
  const settings=rows?.[0];
  if(typeof settings?.enabled!=='boolean'||!Number.isSafeInteger(settings.revision))fail(503,'migration_required','Apply migration 27 to enable X.com scanning settings.');
  if(action==='x-scan') {
    await readBody(req);
    if(!settings.enabled)fail(409,'x_scanning_disabled','Enable and save X.com scanning before starting a scan.');
    const result=await control.scan();
    return respond(res,result.requested?202:200,result);
  }
  return respond(res,200,action==='x-status'?{enabled:settings.enabled,ready:true}:{settings,scanConfigured:control.configured});
}
