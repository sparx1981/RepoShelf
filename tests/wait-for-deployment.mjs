import assert from 'node:assert/strict';
import {decide,observe} from '../scripts/wait-for-deployment.mjs';
// The live checks must wait for Vercel instead of failing while a correct commit is still deploying. The statuses below are the
// ones Vercel really posts: "pending" when its build starts, then "Deployment has completed" or "Canceled by Ignored Build Step".
const sha='a'.repeat(40),other='b'.repeat(40);
const PENDING={state:'pending',description:'Vercel is deploying your app'},DONE={state:'success',description:'Deployment has completed'},SKIPPED={state:'success',description:'Canceled by Ignored Build Step'};
const go=(over)=>decide({sha,headSha:sha,statuses:[],elapsedMs:0,...over});
assert.equal(go({}).action,'wait','nothing yet: keep waiting (Vercel has been seen starting 9 minutes after a push)');
assert.equal(go({statuses:[PENDING]}).action,'wait');
assert.equal(go({statuses:[DONE,PENDING]}).action,'ready');
assert.equal(go({statuses:[{state:'failure',description:'Deployment failed'},PENDING]}).action,'failed');assert.match(go({statuses:[{state:'error',description:'Build error'}]}).message,/deployment itself failed/);
assert.equal(go({statuses:[SKIPPED,PENDING]}).action,'none','a build skipped by the deploy filter: check production as it is');
assert.equal(go({elapsedMs:10*60000}).action,'wait','ten minutes of silence is not yet "no build is coming"');
assert.equal(go({elapsedMs:16*60000}).action,'none','after the grace period with no status at all, no build is coming');
assert.equal(go({statuses:[PENDING],elapsedMs:36*60000}).action,'failed','a build that never finishes is reported, not waited on forever');assert.match(go({statuses:[PENDING],elapsedMs:36*60000}).message,/last state: pending/);
assert.equal(go({headSha:other,statuses:[PENDING]}).action,'superseded','when main has moved on, the newer commit\'s run verifies production');
assert.equal(go({headSha:null,statuses:[DONE]}).action,'ready','an unreadable branch tip does not block');
// reading the GitHub API: only the Vercel context, newest first, and the tip of main
const calls=[];const call=async(path)=>{calls.push(path);if(path.endsWith('/branches/main'))return {commit:{sha}};if(path.includes('/statuses'))return [{id:1,context:'Vercel',state:'pending',description:'Vercel is deploying your app',created_at:'2026-10-17T10:03:30Z'},{id:3,context:'Vercel',state:'success',description:'Deployment has completed',created_at:'2026-10-17T10:20:27Z'},{id:2,context:'ci/other',state:'failure',description:'unrelated',created_at:'2026-10-17T10:30:00Z'}];throw Error(path)};
const seen=await observe({repo:'o/r',sha,call});assert.equal(seen.headSha,sha);assert.deepEqual(seen.statuses.map(x=>x.state),['success','pending'],'newest first, other contexts ignored');assert(calls.some(c=>c.includes(`/commits/${sha}/statuses`)));
assert.equal(decide({sha,...seen,elapsedMs:0}).action,'ready');
// the workflow runs the wait before the live checks, may read statuses, and has time for a slow build
import {readFile} from 'node:fs/promises';
const checks=await readFile(new URL('../.github/workflows/checks.yml',import.meta.url),'utf8');
assert.match(checks,/permissions:\n  contents: read\n  statuses: read\n/);
assert(checks.indexOf('node scripts/wait-for-deployment.mjs')>0&&checks.indexOf('node scripts/wait-for-deployment.mjs')<checks.indexOf('node scripts/verify-deployed-api.mjs'),'the wait comes first');
assert.match(checks,/Verify deployed agent routes\n        if: github.event_name == 'push' && steps\.deployed\.outputs\.ready == 'true'/,'the live checks run only once Vercel is done or has nothing to build');
assert(Number(/check:\n(?:.*\n)*?    timeout-minutes: (\d+)/.exec(checks)[1])>=50,'the job can wait out a slow build');
console.log('PASS: the live checks wait for the commit\'s Vercel build, stop with a clear message if it failed or never finishes, and step aside when the build was skipped or a newer commit took over.');
