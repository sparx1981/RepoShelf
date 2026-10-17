import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
// The live checks compare production with this commit, so they must wait for Vercel to finish deploying it. Vercel reports each
// build to GitHub as a commit status; this waits for the one for the commit, stops early with a clear message if it failed, and steps aside
// when a newer commit has taken over or when Vercel skipped the build.
export const FINAL_FAILURE=new Set(['failure','error']);
const short=sha=>String(sha).slice(0,10);
// statuses: the commit's statuses from the "Vercel" context, newest first: {state, description, created_at}.
// Vercel posts "pending" (Vercel is deploying your app) when its build starts, then "success" (Deployment has completed), or
// "success" with "Canceled by Ignored Build Step" when the deploy filter skipped the build, or a failure.
// A build can start many minutes after the push, and runs for a quarter of an hour or more.
export function decide({sha,headSha,statuses,elapsedMs,graceMs=900000,limitMs=2100000}){
 if(headSha&&headSha!==sha)return {action:'superseded',message:`main has moved on to ${short(headSha)}; the run for that commit verifies production.`};
 const latest=(statuses||[])[0];
 if(latest){
  if(FINAL_FAILURE.has(latest.state))return {action:'failed',message:`Vercel reported ${latest.state} for ${short(sha)} ("${latest.description||''}"): the deployment itself failed, so the live checks cannot pass. Open the Vercel build log.`};
  if(latest.state==='success'){
   if(/ignored build step|canceled|cancelled/i.test(latest.description||''))return {action:'none',message:`Vercel skipped the build for ${short(sha)} ("${latest.description}"). Checking production as it is.`};
   return {action:'ready',message:`Vercel finished deploying ${short(sha)}.`};
  }
 }
 if(elapsedMs>=limitMs)return {action:'failed',message:`Vercel had not finished deploying ${short(sha)} after ${Math.round(limitMs/60000)} minutes${latest?` (last state: ${latest.state}, "${latest.description||''}")`:' and reported nothing'}.`};
 if(!latest&&elapsedMs>=graceMs)return {action:'none',message:`Vercel reported nothing for ${short(sha)} within ${Math.round(graceMs/60000)} minutes, so no build is coming. Checking production as it is.`};
 return {action:'wait',message:latest?`Vercel: ${latest.description||latest.state} (${short(sha)}).`:`Waiting for Vercel to start on ${short(sha)}.`};
}
async function api(path,token){
 const response=await fetch('https://api.github.com'+path,{headers:{'User-Agent':'reposhelf-ci',Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...token?{Authorization:'Bearer '+token}:{}},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Object.assign(Error(`GitHub answered ${response.status} for ${path}`),{status:response.status});return response.json();
}
export async function observe({repo,sha,branch='main',token,call=api}){
 const [head,list]=await Promise.all([call(`/repos/${repo}/branches/${branch}`,token),call(`/repos/${repo}/commits/${sha}/statuses?per_page=30`,token)]);
 const statuses=list.filter(x=>x.context==='Vercel').sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)||b.id-a.id).map(x=>({state:x.state,description:x.description,created_at:x.created_at}));
 return {headSha:head.commit?.sha,statuses};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {GITHUB_REPOSITORY:repo,GITHUB_SHA:sha,GITHUB_TOKEN:token,GITHUB_OUTPUT:out}=process.env,every=Number(process.env.WAIT_POLL_SECONDS||15)*1000,limitMs=Number(process.env.WAIT_LIMIT_MINUTES||35)*60000,started=Date.now();
 if(!repo||!sha)throw Error('GITHUB_REPOSITORY and GITHUB_SHA are required');
 let result,lastMessage='';
 for(;;){
  let seen={headSha:null,statuses:[]};
  try{seen=await observe({repo,sha,token})}catch(e){if([401,403].includes(e.status)){console.error('::error::The workflow token cannot read commit statuses ('+e.message+'). Give the job `statuses: read`.');if(out)appendFileSync(out,'ready=false\nresult=failed\n');process.exit(1)}console.log('Could not read the Vercel status yet: '+e.message)}
  result=decide({sha,...seen,elapsedMs:Date.now()-started,limitMs});
  if(result.message!==lastMessage){console.log(result.message);lastMessage=result.message}
  if(result.action!=='wait')break;
  await new Promise(resolve=>setTimeout(resolve,every));
 }
 const ready=['ready','none'].includes(result.action);
 if(out)appendFileSync(out,`ready=${ready}\nresult=${result.action}\n`);
 if(result.action==='failed'){console.error('::error::'+result.message);process.exitCode=1}
}
