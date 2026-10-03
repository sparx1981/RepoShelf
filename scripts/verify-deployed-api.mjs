const base='https://reposhelf.vercel.app';
let last='Deployment not ready';
for(let attempt=0;attempt<24;attempt++){
try{
const guide=await fetch(base+'/agent-guide.html',{signal:AbortSignal.timeout(10000)});
const response=await fetch(base+'/api/v1/catalog',{signal:AbortSignal.timeout(10000)});
const body=await response.json();
if(guide.ok&&[401,503].includes(response.status)&&body.error?.code&&/private/.test(response.headers.get('cache-control')||'')){
const mcp=await fetch(base+'/api/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
const mcpBody=await mcp.json();
if([401,503].includes(mcp.status)&&mcpBody.error?.code){const session=await fetch(base+'/api/auth',{signal:AbortSignal.timeout(10000)}),person=await session.json();if(!session.ok||person.user!==null||typeof person.enabled!=='boolean')throw Error('Account session route is not ready');for(const path of ['/api/forks','/api/collection','/api/editorial?manage=1','/api/analytics','/api/admin-users','/api/admin-users?action=setup']){const privateResponse=await fetch(base+path,{signal:AbortSignal.timeout(10000)});if(![401,503].includes(privateResponse.status))throw Error('Unauthenticated access to '+path)}const admin=await fetch(base+'/admin.html',{signal:AbortSignal.timeout(10000)});if(!admin.ok)throw Error('Administration page is not ready');console.log('Live agent/account/admin routes are deployed and private data rejects unauthenticated access.');process.exit(0)}
}
last='REST status '+response.status;
}catch(e){last=e.message}
await new Promise(resolve=>setTimeout(resolve,5000));
}
throw new Error('Live agent route verification failed: '+last);
