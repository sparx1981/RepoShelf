import {respond,readBody,only,fail} from './accounts.mjs';
export async function accountData(req,res,{accounts,action}){
 only(req,action==='delete-account'?['DELETE']:['GET']);
 // Every action uses a verified session; mutating actions also require the site origin.
 if(req.method!=='GET')accounts.origin(req);
 const person=await accounts.user(req,res);
 if(action==='data-state'){
  try{const ready=await accounts.request('/rest/v1/rpc/reposhelf_account_data_ready',{token:person.token,method:'POST',body:{}});return respond(res,200,{ready:ready===true&&Boolean(accounts.config.serviceKey)})}
  catch(e){if(e.code==='migration_required')return respond(res,200,{ready:false});throw e}
 }
 if(action==='export-account'){
  const data=await accounts.request('/rest/v1/rpc/reposhelf_export_account',{token:person.token,method:'POST',body:{}});
  res.setHeader('Content-Disposition','attachment; filename="reposhelf-account.json"');
  return respond(res,200,data);
 }
 const body=await readBody(req);
 if(body?.confirm!=='DELETE')fail(400,'confirmation_required','Type DELETE to confirm account deletion.');
 const signedIn=Date.parse(person.signedInAt);
 if(!Number.isFinite(signedIn)||Date.now()-signedIn>15*60000||signedIn>Date.now()+60000)fail(401,'recent_sign_in_required','Sign in again before deleting your account.');
 // A database trigger protects admin access and paid records atomically, including
 // deletion attempted through Supabase rather than this API.
 await accounts.request('/rest/v1/rpc/reposhelf_account_data_ready',{token:person.token,method:'POST',body:{}});
 const permission=await accounts.request('/rest/v1/rpc/reposhelf_account_deletion_status',{token:person.token,method:'POST',body:{}});if(permission?.allowed!==true)fail(409,'deletion_blocked',permission?.reason||'Account deletion is unavailable. Please try again later.');
 await accounts.request('/auth/v1/admin/users/'+encodeURIComponent(person.id),{service:true,method:'DELETE',body:{should_soft_delete:false}});
 accounts.clear(res);
 return respond(res,200,{deleted:true});
}
