import {createHmac,timingSafeEqual} from 'node:crypto';
import {fail,respond,readBody} from './accounts.mjs';
// Guided merge of two RepoShelf accounts, for someone who signed in with GitHub on one occasion and Google on another.
// The person must prove both accounts in one sitting: they stay signed in as the TARGET (the account that keeps
// everything) and complete a fresh sign-in as the SOURCE (the account that is emptied and closed). The proof is a short-lived
// signed cookie. Nothing moves until they type MERGE, and the source's sign-in method is then attached to the target.
const TTL=10*60;
const REASONS={same_account:'That is the account you are already signed in with.',account_missing:'One of the accounts no longer exists.',same_provider:'Both accounts use the same sign-in method, so they cannot be merged.',source_is_admin:'The other account is an administrator account. Make this account an administrator first, then try again.',promotions_active:'A promotion is reserved or running. Resolve it first, then try again.',busy:'A background check is running on one of the accounts. Try again in a few minutes.'};
export function createAccountMerge(accounts){
 const key=()=>{const k=accounts.config.serviceKey;if(!k||!accounts.ready)fail(503,'merge_unavailable','Account merging is not available yet.');return k};
 const sign=(payload,k)=>{const body=Buffer.from(JSON.stringify(payload)).toString('base64url');return body+'.'+createHmac('sha256',k).update(body).digest('base64url')};
 const verify=(token,k)=>{try{const [body,mac]=String(token||'').split('.'),expected=createHmac('sha256',k).update(body).digest('base64url');if(!mac||mac.length!==expected.length||!timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(body,'base64url').toString());return data.exp>Date.now()/1000?data:null}catch{return null}};
 const set=(res,payload)=>accounts.cookie(res,'merge',payload?sign({...payload,exp:Math.floor(Date.now()/1000)+TTL},key()):'',payload?TTL:0);
 const read=req=>verify(accounts.cookies(req)[accounts.cookiePrefix+'merge'],key());
 const providersOf=person=>person.providers||(person.githubId?['github']:[]);
 const go=(res,where)=>{res.writeHead(302,{Location:where,'Cache-Control':'private, no-store'});res.end()};
 const check=async(target,source)=>accounts.request('/rest/v1/rpc/reposhelf_merge_check',{service:true,method:'POST',body:{p_target:target,p_source:source}});
 return {
  // Step 1: the signed-in person chooses which other sign-in method to prove.
  async start(req,res){key();let person;try{person=await accounts.user(req,res)}catch(e){if(e.status===401)return go(res,'/account.html');throw e}const provider=new URL(req.url,accounts.config.origin).searchParams.get('provider');
   if(!['github','google'].includes(provider)||(provider==='google'&&!accounts.config.google))return go(res,'/account.html?merge=failed');
   if(providersOf(person).includes(provider))return go(res,'/account.html?merge=already');
   set(res,{k:'intent',a:person.id,p:provider});return accounts.start(req,res,{merge:provider,returnTo:'/account.html'})},
  // Step 2: the provider hands back. The other account's session is used once to learn who it is, then discarded.
  async callback(req,res){let person;try{key();const intent=read(req);person=await accounts.user(req,res);const flow=accounts.flowOf(req),provider=flow.slice(6);
    if(!intent||intent.k!=='intent'||intent.a!==person.id||intent.p!==provider)throw Error('state');
    const cookies=accounts.cookies(req),[verifier]=String(cookies[accounts.cookiePrefix+'verifier']||'').split('~'),code=new URL(req.url,accounts.config.origin).searchParams.get('code');accounts.cookie(res,'verifier','',0);accounts.cookie(res,'return','',0);
    if(!code||!verifier)throw Error('callback');
    const session=await accounts.request('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:code,code_verifier:verifier}}),other=await accounts.request('/auth/v1/user',{token:session.access_token});
    try{await accounts.request('/auth/v1/logout?scope=local',{token:session.access_token,method:'POST'})}catch{}
    if(!other?.id)throw Error('identity');
    if(other.id===person.id){set(res,null);return go(res,'/account.html?merge=same')}
    const verdict=await check(person.id,other.id);
    if(verdict?.ok!==true){set(res,null);return go(res,'/account.html?merge=blocked&reason='+encodeURIComponent(verdict?.reason||'unknown'))}
    set(res,{k:'ready',a:person.id,b:other.id,p:provider});return go(res,'/account.html?merge=ready')}
   catch{set(res,null);accounts.cookie(res,'verifier','',0);return go(res,'/account.html?merge=failed')}},
  // Step 3: show what would move.
  async preview(req,res){const person=await accounts.user(req,res),state=read(req);if(!state||state.k!=='ready'||state.a!==person.id)fail(409,'merge_not_ready','Start the merge again.');
   const verdict=await check(person.id,state.b);if(verdict?.ok!==true)fail(409,'merge_blocked',REASONS[verdict?.reason]||'These accounts cannot be merged.');
   return respond(res,200,{ok:true,provider:state.p,counts:verdict.counts,keeps:person.name})},
  // Step 4: the person types MERGE. Data moves, the emptied account is closed and its sign-in method is re-attached.
  async confirm(req,res){accounts.origin(req);const person=await accounts.user(req,res),body=await readBody(req),state=read(req);
   if(body?.confirm!=='MERGE')fail(400,'confirmation_required','Type MERGE to confirm.');
   if(!state||state.k!=='ready'||state.a!==person.id)fail(409,'merge_not_ready','Start the merge again.');
   if(!(Date.parse(person.signedInAt)>Date.now()-60*60*1000))fail(401,'recent_sign_in_required','Sign in again, then restart the merge.');
   const result=await accounts.request('/rest/v1/rpc/reposhelf_merge_accounts',{service:true,method:'POST',body:{p_target:person.id,p_source:state.b}});
   if(result?.ok!==true)fail(409,'merge_blocked',REASONS[result?.reason]||'These accounts cannot be merged.');
   let closed=true;try{await accounts.request('/auth/v1/admin/users/'+encodeURIComponent(state.b),{service:true,method:'DELETE',body:{should_soft_delete:false}})}catch{closed=false}
   set(res,null);return respond(res,200,{merged:true,closed,moved:result.moved,reconnect:state.p})},
  async cancel(req,res){accounts.origin(req);set(res,null);return respond(res,200,{cancelled:true})},
  reasons:REASONS};
}
