import {publicUrlGuard,inspectDemo} from './demo-health.mjs';

// A worker owns one browser. Cookies, storage, routes and pages are per listing.
export function createDemoSession({launch,guardFactory=publicUrlGuard,inspect=inspectDemo,recycleAfter=50}={}){
 let browser=null,uses=0,browserLaunches=0,contexts=0;
 async function close(){const old=browser;browser=null;uses=0;if(old)await old.close()}
 async function probe(input){
  const allowed=guardFactory(),assessment=await allowed.assess(input.target);
  if(!assessment.allowed)return {kind:'temporary',reason:assessment.reason||'unsafe_target'};
  let context,result={kind:'temporary',reason:'probe_error'};
  try{
   if(browser&&(uses>=recycleAfter||browser.isConnected&&!browser.isConnected()))await close();
   if(!browser){browser=await launch();browserLaunches++}uses++;
   context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
   contexts++;
   await context.route('**/*',async route=>{try{if(await allowed(route.request().url()))await route.continue();else await route.abort()}catch{await route.abort().catch(()=>{})}});
   // WebSocket traffic must not bypass HTTP request interception.
   if(context.routeWebSocket)await context.routeWebSocket('**/*',async socket=>{try{await socket.close()}catch{}});
   const page=await context.newPage();result=await inspect(page,input.target,{space:input.space===true,delay:input.screenshot?2500:1800});
   if(result.kind==='working'&&input.screenshot){try{await page.screenshot({path:input.screenshot,type:'jpeg',quality:60,timeout:10000});result.screenshot=true}catch{result.screenshot=false;result.reason='screenshot_error'}}
  }catch{result={kind:'temporary',reason:'probe_error'};try{await close()}catch{}}
  finally{if(context)try{await context.close()}catch{await close()}}
  return result;
 }
 return {probe,close,stats:()=>({browserLaunches,contexts})};
}
