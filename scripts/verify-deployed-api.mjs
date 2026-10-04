const base='https://reposhelf.vercel.app';
let last='Deployment not ready';
for(let attempt=0;attempt<24;attempt++){
try{
const editorialModule=await fetch(base+'/editorial.js',{signal:AbortSignal.timeout(10000)});if(!editorialModule.ok||!(await editorialModule.text()).includes('Daily shuffle (UTC)'))throw Error('Storefront update is not deployed yet');
const editorialResponse=await fetch(base+'/api/editorial',{signal:AbortSignal.timeout(10000)}),editorial=await editorialResponse.json();if(!editorialResponse.ok||editorial.builtinSetupRequired!==false)throw Error('Production migration 8 is not visible');console.log('Production migration 8 is visible; '+editorial.rows.filter(r=>r.builtin_key).length+' built-in rows are published.');
const guide=await fetch(base+'/agent-guide.html',{signal:AbortSignal.timeout(10000)});
const response=await fetch(base+'/api/v1/catalog',{signal:AbortSignal.timeout(10000)});
const body=await response.json();
if(guide.ok&&[401,503].includes(response.status)&&body.error?.code&&/private/.test(response.headers.get('cache-control')||'')){
const mcp=await fetch(base+'/api/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
const mcpBody=await mcp.json();
if([401,503].includes(mcp.status)&&mcpBody.error?.code){const session=await fetch(base+'/api/auth',{signal:AbortSignal.timeout(10000)}),person=await session.json();if(!session.ok||person.user!==null||typeof person.enabled!=='boolean')throw Error('Account session route is not ready');for(const path of ['/api/sync-log','/api/forks','/api/collection','/api/collection?action=discovery','/api/promotions','/api/promotions?action=manage','/api/editorial?manage=1','/api/analytics','/api/admin-users','/api/admin-users?action=setup']){const privateResponse=await fetch(base+path,{signal:AbortSignal.timeout(10000)});if(![401,503].includes(privateResponse.status))throw Error('Unauthenticated access to '+path)}const link=await fetch(base+'/api/open?url=https%3A%2F%2Fgithub.com',{redirect:'manual',signal:AbortSignal.timeout(10000)});if(![302,503].includes(link.status))throw Error('Project links require login');const admin=await fetch(base+'/admin.html',{signal:AbortSignal.timeout(10000)});if(!admin.ok)throw Error('Administration page is not ready');for(const path of ['/terms.html','/privacy.html','/legal.html','/legal.js','/legal.css','/promotions.html','/promotions.js','/promotions.css']){const legalPage=await fetch(base+path,{signal:AbortSignal.timeout(10000)});if(!legalPage.ok)throw Error('Legal page is not deployed: '+path)}const legalResponse=await fetch(base+'/api/auth?action=legal',{signal:AbortSignal.timeout(10000)}),legal=await legalResponse.json();if(!legalResponse.ok||legal.version!=='2026-10-03-v1'||typeof legal.active!=='boolean')throw Error('Legal configuration endpoint is not deployed');console.log('Live agent/account/admin routes are deployed and private data rejects unauthenticated access.');process.exit(0)}
}
last='REST status '+response.status;
}catch(e){last=e.message}
await new Promise(resolve=>setTimeout(resolve,5000));
}
throw new Error('Live agent route verification failed: '+last);
