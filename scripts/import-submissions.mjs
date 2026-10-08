import {readFile,writeFile} from 'node:fs/promises';
import {scanSubmissions} from './submission-imports.mjs';
import {createSubmissionQualifier} from './submission-quality.mjs';
const key=process.env.REPOSHELF_SUBMISSION_SYNC_KEY,origin=process.env.REPOSHELF_PUBLIC_URL||'https://reposhelf.vercel.app',receipt=new URL('../.submission-results.json',import.meta.url);
async function api(action,body){const response=await fetch(origin+'/api/submissions?action='+action,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});const data=await response.json();if(!response.ok)throw Error(data.error?.message||'Submission worker failed');return data}
if(!key||key.length<32){console.log('Submission scan awaits configuration.');process.exit(0)}
if(process.argv[2]==='finish'){const results=JSON.parse(await readFile(receipt,'utf8'));for(const result of results){const confirmation=await api('complete',{...result,commit:process.env.SUBMISSION_COMMIT});if(!confirmation.updated)throw Error('The submission claim expired before confirmation. A later scan will retry.');}console.log(`Submission status: ${results.length} scan results saved.`)}else{
 const {items}=await api('claim',{id:process.env.SUBMISSION_ID||null,requireVersion:2}),catalogPath=new URL('../dist/catalog.json',import.meta.url),catalog=JSON.parse(await readFile(catalogPath,'utf8')),results=[];const headers={Accept:'application/vnd.github+json','User-Agent':'RepoShelf-submissions'};if(process.env.GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_TOKEN;
 const scanned=await scanSubmissions(items,catalog,{headers,qualify:createSubmissionQualifier()});results.push(...scanned.results);
 if(items.length)await writeFile(catalogPath,JSON.stringify(scanned.catalog,null,2)+'\n');await writeFile(receipt,JSON.stringify(results));console.log(`Submissions: ${results.filter(r=>r.status==='imported').length} imported, ${results.filter(r=>r.status==='retry').length} retries, ${results.filter(r=>r.status==='unavailable').length} unavailable.`)
}
