import assert from 'node:assert/strict';import {Readable} from 'node:stream';import {createAccounts} from '../lib/accounts.mjs';import {createAuthHandler} from '../api/auth.mjs';
// Sessions must survive things that are not sign-out: a cancelled or failed account link, another provider being linked, a bad
// cookie from elsewhere on the host, and a server that says the user is gone.
const base='https://reposhelf.test',supa='https://fixture.supabase.co',P='__Host-reposhelf-';
const person={id:'00000000-0000-0000-0000-0000000000a3',identities:[{provider:'github',identity_data:{sub:'88',user_name:'hubber'}}],user_metadata:{}};
let calls=[],linkReply={},tokenReply={access_token:'hubber',refresh_token:'r2',expires_in:3600};
const accounts=createAccounts({legal:{active:false},config:{url:supa,key:'public-key',serviceKey:'server-key',origin:base,google:true},fetcher:async(url,opts)=>{const u=new URL(url),token=opts.headers.Authorization?.replace('Bearer ','');calls.push(u.pathname);
 if(u.pathname==='/auth/v1/user')return token==='hubber'?Response.json(person):token==='gone'?Response.json({code:'user_not_found'},{status:403}):Response.json({},{status:401});
 if(u.pathname==='/auth/v1/token')return Response.json(tokenReply);
 if(u.pathname==='/auth/v1/user/identities/authorize')return Response.json(linkReply);
 return Response.json({})}});
async function run(url,{cookie='',headers={},method='GET'}={}){const req=Readable.from(method==='POST'?['{}']:[]);Object.assign(req,{url,method,headers:{origin:base,cookie,'content-type':'application/json',...headers}});const res={headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},getHeader(k){return this.headers[k.toLowerCase()]},writeHead(s,h={}){this.status=s;for(const [k,v] of Object.entries(h))this.headers[k.toLowerCase()]=v},end(b){if(b)try{this.data=JSON.parse(b)}catch{}}};await createAuthHandler(accounts)(req,res);return res}
const set=res=>[].concat(res.headers['set-cookie']||[]);const cleared=(res,name)=>set(res).some(c=>c.startsWith(`${P}${name}=;`)&&/Max-Age=0/.test(c));const written=(res,name)=>set(res).some(c=>c.startsWith(`${P}${name}=`)&&!c.startsWith(`${P}${name}=;`));
const signedIn=`${P}access=hubber; ${P}refresh=r1`;
// a failed or cancelled link keeps the member signed in, so the explanation can be shown
let r=await run('/api/auth?action=callback&error=access_denied',{cookie:`${signedIn}; ${P}verifier=v~link-google`});
assert.equal(r.status,302);assert.equal(r.headers.location,'/account.html?link=failed');assert(!cleared(r,'access')&&!cleared(r,'refresh'),'the session cookies are left alone');assert(cleared(r,'verifier')&&cleared(r,'return'),'the one-off cookies are cleared');
// a token exchange that fails during a link behaves the same
tokenReply={};r=await run('/api/auth?action=callback&code=abc',{cookie:`${signedIn}; ${P}verifier=v~link-google`});assert.equal(r.headers.location,'/account.html?link=failed');assert(!cleared(r,'access')&&!cleared(r,'refresh'));tokenReply={access_token:'hubber',refresh_token:'r2',expires_in:3600};
// an ordinary failed sign-in still clears everything
r=await run('/api/auth?action=callback&error=access_denied',{cookie:`${P}verifier=v~github`});assert.equal(r.headers.location,'/?signin=failed');assert(cleared(r,'access')&&cleared(r,'refresh'));
// a link that cannot be started keeps the session
linkReply={};r=await run('/api/auth?action=link-google',{cookie:signedIn});assert.equal(r.headers.location,'/account.html?link=failed');assert(!cleared(r,'access')&&!cleared(r,'refresh'));
// another site cannot start a link or a merge for the member
calls=[];for(const site of ['cross-site','same-site']){r=await run('/api/auth?action=link-google',{cookie:signedIn,headers:{'sec-fetch-site':site}});assert.equal(r.headers.location,'/account.html?link=failed');assert.equal(set(r).length,0,'no handshake cookies are set');}
assert.equal(calls.length,0,'a cross-site link start never reaches the sign-in service');
linkReply={url:supa+'/auth/v1/authorize?x=1'};r=await run('/api/auth?action=link-google',{cookie:signedIn,headers:{'sec-fetch-site':'same-origin'}});assert.equal(r.status,302);assert.match(r.headers.location,/^https:\/\/fixture\.supabase\.co\//,'the account page can still start a link');
// linking Google keeps the stored GitHub token, a fresh Google sign-in drops it
r=await run('/api/auth?action=callback&code=abc',{cookie:`${signedIn}; ${P}github=TOKEN; ${P}verifier=v~link-google`});assert.equal(r.headers.location,'/?linked=google');assert(!cleared(r,'github')&&!written(r,'github'),'the GitHub token cookie is not touched when Google is linked');
r=await run('/api/auth?action=callback&code=abc',{cookie:`${P}github=TOKEN; ${P}verifier=v~google`});assert(cleared(r,'github'),'a new Google sign-in does not keep another account\'s token');
r=await run('/api/auth?action=callback&code=abc',{cookie:`${P}verifier=v~link-github`});
// the auth service saying the user is gone (403) is an expired session, not an administrator error
r=await run('/api/auth',{cookie:`${P}access=gone`});assert.equal(r.status,200);assert.equal(r.data.user,null);assert(cleared(r,'access'),'the dead session is cleared');
r=await run('/api/auth?action=data-state',{cookie:`${P}access=gone`});assert.equal(r.status,401,'a protected route asks the member to sign in again');
// one badly encoded cookie on the host cannot break every account route
r=await run('/api/auth',{cookie:`stray=%E0%A4%A; ${signedIn}`});assert.equal(r.status,200);assert.equal(r.data.user?.name,'hubber');
r=await run('/api/auth?action=signout',{cookie:`stray=%E0%A4%A; ${signedIn}`,method:'POST'});assert.notEqual(r.status,503);assert(cleared(r,'access'),'signing out still works');
console.log('PASS: a failed link keeps the session, cross-site link starts are refused, linking Google keeps the GitHub token, a gone user is an expired session, and a bad cookie cannot break sign-in or sign-out.');
