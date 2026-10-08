import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createSubmissionQualifier} from '../scripts/submission-quality.mjs';
import {scanSubmissions} from '../scripts/submission-imports.mjs';
import {nextPublicationAt} from '../lib/publication-policy.mjs';
const Q=createRequire(import.meta.url)('../dist/quality.js'),at=Date.parse('2026-10-08T12:00:00Z'),row={full:'other-maker/app',name:'App',demo:'https://demo.example',availability:'available',lastCheckedAt:new Date(at).toISOString()};
const directory=await mkdtemp(tmpdir()+'/reposhelf-submission-test-'),root=pathToFileURL(directory+'/');
try{
 let probes=0;const qualify=createSubmissionQualifier({root,now:()=>at,probe:async(input,options)=>{probes++;assert.equal(input.target,row.demo);assert.equal(options.timeout,45000);await writeFile(input.screenshot,'jpeg-fixture');return {kind:'working',screenshot:true}}});
 const good=await qualify(row);assert.equal(good.details.status,'accepted');assert.equal(Q.publishedEligible(good.entry,at),true);assert.equal(await readFile(new URL('dist/'+good.entry.screenshots[0].src,root),'utf8'),'jpeg-fixture');assert.equal(row.screenshots,undefined,'Qualification does not mutate the input');
 const transient=await createSubmissionQualifier({root,now:()=>at,probe:async()=>({kind:'temporary',reason:'probe_timeout'})})(row);assert.equal(transient.details.status,'retry');assert.equal(Q.publishedEligible(transient.entry,at),false);assert.equal(transient.entry.previewCheck.status,'retry');assert(Date.parse(transient.details.nextAttemptAt)>at);
 const noImage=await createSubmissionQualifier({root,now:()=>at,probe:async()=>({kind:'working',screenshot:false})})(row);assert.equal(noImage.details.status,'retry','A demo without a captured preview is not accepted');
 const claims=[{id:'private-submission',lease:'private-lease',user_id:'never-publish',repo_name:row.full}];
 const accepted=await scanSubmissions(claims,{repositories:[]},{qualify,importer:async()=>({...row})});assert.equal(accepted.results[0].status,'imported');assert.equal(accepted.results[0].details.status,'accepted');assert(Q.publishedEligible(accepted.catalog.repositories[0],at));assert(!JSON.stringify(accepted.catalog).includes('never-publish'));assert(!JSON.stringify(accepted.catalog).includes('private-lease'));
 const retry=await scanSubmissions(claims,{repositories:[]},{qualify:async()=>transient,importer:async()=>({...row})});assert.equal(retry.results[0].status,'retry');assert.equal(retry.catalog.repositories.length,1,'Transient records remain saved for repair');
 const rejected=await scanSubmissions(claims,{repositories:[]},{qualify:async()=>({entry:row,details:{status:'rejected',reason:'http_404'}}),importer:async()=>({...row})});assert.equal(rejected.results[0].status,'unavailable');assert.equal(probes,2);
}finally{await rm(directory,{recursive:true,force:true})}
assert.equal(nextPublicationAt(Date.parse('2026-10-08T06:34:59Z')),'2026-10-08T06:35:00.000Z');assert.equal(nextPublicationAt(Date.parse('2026-10-08T06:35:00Z')),'2026-10-09T06:35:00.000Z');
console.log('PASS: dedicated demo probes, saved JPEG previews, actual publication eligibility, no-image/transient retry, definitive rejection, private identity separation and next publication boundaries.');
