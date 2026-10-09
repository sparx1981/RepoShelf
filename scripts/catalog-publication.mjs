import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm,readdir} from 'node:fs/promises';
import {existsSync,mkdtempSync,openSync,closeSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {scheduledPublicationDue,utcDay} from '../lib/publication-policy.mjs';
import {PACKED,packedName,isPackedName,logicalName,decompress,pack,unpack} from '../lib/data-packing.mjs';
export const CHECKPOINT_BRANCH='reposhelf-checkpoints';
export const generatedPaths=[...PACKED.map(packedName).filter(p=>p.startsWith('dist/')),'dist/community.json','dist/growth.json','data','dist/previews'];
export const generated=path=>path.startsWith('data/')||path.startsWith('dist/previews/')||/^dist\/(catalog|spaces|community|growth)\.json(\.gz)?$/.test(path);
const git=(root,args,options={})=>{
 if(options.stdio)return execFileSync('git',args,{cwd:root,encoding:'utf8',...options});
 // File lists grow with the catalogue too. Capture all Git stdout on disk,
 // including diff/ls-files, so neither restore nor publication has a 1 MB cap.
 const directory=mkdtempSync(join(tmpdir(),'reposhelf-git-')),file=join(directory,'stdout'),fd=openSync(file,'w');
 try{execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe',fd,'pipe'],...options});return readFileSync(file,'utf8')}
 finally{closeSync(fd);rmSync(directory,{recursive:true,force:true})}
};
// Git blobs can exceed Node's 1 MB captured-output limit. Stream stdout to a
// temporary file rather than imposing a size ceiling on catalogue/assets.
function blobBytes(root,ref,path){
 const directory=mkdtempSync(join(tmpdir(),'reposhelf-blob-')),file=join(directory,'blob'),fd=openSync(file,'w');
 try{git(root,['show',ref+':'+path],{stdio:['ignore',fd,'pipe']});return readFileSync(file)}
 catch(error){if(error.status===128)return null;throw error}
 finally{closeSync(fd);rmSync(directory,{recursive:true,force:true})}
}
function publicJson(path,text){const value=JSON.parse(text);if(path==='dist/catalog.json'||path==='dist/spaces.json'){delete value.updatedAt;delete value.revalidation;delete value.discovery;value.repositories=(value.repositories||[]).map(r=>{const row={...r};for(const key of ['enrichmentAttemptAt','overviewAttemptAt','agentContextAttemptAt','aiOverviewAttemptAt'])delete row[key];return row}).sort((a,b)=>a.full.localeCompare(b.full))}else if(path==='dist/community.json')delete value.updatedAt;return JSON.stringify(value)}
const internalFile=raw=>{const path=logicalName(raw);return internalLogical(path)};
const internalLogical=path=>path==='data/x-intake.json'||path==='data/x-collection-run.json'||path.startsWith('data/sync-runs/')||path.startsWith('data/browse/')||path==='data/catalogue-quality.json'||path==='data/admin-summary.json'||path==='data/publication.json'||path==='data/recovery-results.json'||path==='data/discovery-search.json'||path==='data/capture-providers.json'||path==='data/browser-cycle.json'||path==='data/launch-cadence.json'||path==='data/ai-overview-usage.json'||path==='dist/growth.json';
export function publicFileChanged(path,before,after){
 if(internalFile(path))return false;
 if(/^dist\/(catalog|spaces|community)\.json$/.test(path)&&before!==null&&after!==null){try{return publicJson(path,before)!==publicJson(path,after)}catch{return true}}
 return before!==after;
}
async function stage(root){pack(root);const paths=generatedPaths.filter(p=>existsSync(join(root,p))||git(root,['ls-files','--',p]).trim());if(paths.length)git(root,['add','-A','--',...paths]);return paths}
export function changedPublicFiles(root){const paths=git(root,['diff','--cached','--name-only','-z']).split('\0').filter(Boolean);return paths.filter(path=>{if(!generated(path))throw Error('Only generated files may be published');if(internalFile(path))return false;const packed=isPackedName(path),encoding=packed||path.endsWith('.json')?'utf8':'base64',read=ref=>{const bytes=blobBytes(root,ref,path);return bytes===null?null:(packed?decompress(bytes):bytes).toString(encoding)};return publicFileChanged(logicalName(path),read('HEAD'),read(''))})}
async function report(root,publication,commit=null){const id=process.env.GITHUB_RUN_ID;if(!/^\d+$/.test(id||''))return;const path=join(root,'data/sync-runs',id+'.json');try{const row=JSON.parse(await readFile(path,'utf8'));row.publication=publication;row.publishedCommit=commit;await writeFile(path,JSON.stringify(row,null,2)+'\n')}catch(e){if(e.code!=='ENOENT')throw e}}
function remoteCheckpoint(root){try{git(root,['ls-remote','--exit-code','--heads','origin',CHECKPOINT_BRANCH])}catch(e){if(e.status===2)return null;throw e}git(root,['fetch','--quiet','origin',`refs/heads/${CHECKPOINT_BRANCH}:refs/remotes/origin/${CHECKPOINT_BRANCH}`]);return git(root,['rev-parse','refs/remotes/origin/'+CHECKPOINT_BRANCH]).trim()}
export async function saveCheckpoint(root,{base,phase='checkpoint'}={}){
 const stateFile=join(root,'data/publication.json');if(!existsSync(stateFile)){await mkdir(dirname(stateFile),{recursive:true});await writeFile(stateFile,JSON.stringify({lastPublishedAt:null,commit:null,lastScheduledDay:null})+'\n')}
 await stage(root);const tree=git(root,['write-tree']).trim(),temporary=await mkdtemp(join(tmpdir(),'reposhelf-index-'));
 let reportIds=[];try{reportIds=(await readdir(join(root,'data/sync-runs'))).filter(n=>/^\d+\.json$/.test(n)).map(n=>n.slice(0,-5)).sort((a,b)=>b.length-a.length||b.localeCompare(a)).slice(0,20)}catch(e){if(e.code!=='ENOENT')throw e}
 const manifest={schema:1,base:base||git(root,['rev-parse','HEAD']).trim(),phase,runId:process.env.GITHUB_RUN_ID||null,reportIds,at:new Date().toISOString()};
 try{const env={...process.env,GIT_INDEX_FILE:join(temporary,'index')};git(root,['read-tree',tree],{env});const blob=git(root,['hash-object','-w','--stdin'],{input:JSON.stringify(manifest)+'\n'}).trim();git(root,['update-index','--add','--cacheinfo',`100644,${blob},.sync-checkpoint.json`],{env});const snapshot=git(root,['write-tree'],{env}).trim();
 for(let attempt=1;attempt<=3;attempt++){const parent=remoteCheckpoint(root)||manifest.base;const commit=git(root,['commit-tree',snapshot,'-p',parent,'-m','Save catalogue recovery checkpoint']).trim();try{git(root,['push','--quiet','origin',`${commit}:refs/heads/${CHECKPOINT_BRANCH}`]);console.log('Recovery checkpoint saved to '+CHECKPOINT_BRANCH+' ('+phase+').');return commit}catch(e){if(attempt===3)throw e}}
 }finally{await rm(temporary,{recursive:true,force:true})}
}
export async function restoreCheckpoint(root){
 unpack(root,PACKED,{force:true});
 const commit=remoteCheckpoint(root);if(!commit){console.log('No recovery checkpoint branch yet.');return {restored:0,conflicts:0}}
 const meta=JSON.parse(git(root,['show',commit+':.sync-checkpoint.json']));if(meta.schema!==1||!/^[a-f0-9]{40}$/.test(meta.base))throw Error('Invalid checkpoint baseline');
 try{git(root,['cat-file','-e',meta.base+'^{commit}'])}catch{git(root,['fetch','--quiet','origin',meta.base])}
 const changed=git(root,['diff','--name-only','-z',meta.base,commit]).split('\0').filter(generated),current=git(root,['rev-parse','HEAD']).trim();let restored=0,conflicts=0;
 // Read identities once per tree instead of spawning three Git processes per
 // generated file. Missing/deleted paths remain null for the conflict guard.
 const trees=new Map([meta.base,commit,current].map(ref=>[ref,new Map(git(root,['ls-tree','-r','-z',ref,'--',...generatedPaths]).split('\0').filter(Boolean).map(entry=>{const tab=entry.indexOf('\t'),header=entry.slice(0,tab).split(' ');if(tab<0||header[1]!=='blob')throw Error('Invalid generated tree entry');return [entry.slice(tab+1),header[2]]}))]));
 const blob=(ref,path)=>trees.get(ref).get(path)||null;
 for(const path of changed){if(path.includes('..')||path.startsWith('/'))throw Error('Invalid checkpoint path');const before=blob(meta.base,path),after=blob(commit,path),present=blob(current,path);if(present===after)continue;if(present!==before){conflicts++;continue}const file=join(root,path);if(after===null)await rm(file,{force:true});else{await mkdir(dirname(file),{recursive:true});const bytes=blobBytes(root,commit,path);if(bytes===null)throw Error('Checkpoint blob is missing: '+path);await writeFile(file,bytes)}restored++}
 unpack(root,PACKED.filter(path=>changed.includes(packedName(path))),{force:true});
 console.log(`Checkpoint recovery: ${restored} generated files restored; ${conflicts} files kept from newer main changes.`);return {restored,conflicts};
}
export async function publishCatalog(root=process.cwd(),{checkpoint=false,completed=false,scheduled=false,now=Date.now()}={}){
 git(root,['config','user.name','github-actions[bot]']);git(root,['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
 const base=git(root,['rev-parse','HEAD']).trim();
 if(checkpoint){await report(root,completed?'awaiting_publication':'checkpoint_saved');return saveCheckpoint(root,{base,phase:completed?'complete':'checkpoint'})}
 const statePath=join(root,'data/publication.json');let state={};try{state=JSON.parse(await readFile(statePath,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 if(scheduled&&!scheduledPublicationDue(state,now)){console.log('Daily catalogue publication already handled for this UTC day.');return {published:false,alreadyHandled:true}}
 const saveState=async value=>{await mkdir(dirname(statePath),{recursive:true});await writeFile(statePath,JSON.stringify(value,null,2)+'\n')};
 await stage(root);const changes=changedPublicFiles(root);
 if(!changes.length){if(scheduled){state={...state,lastScheduledDay:utcDay(now)};await saveState(state)}await report(root,'unchanged',base);await saveCheckpoint(root,{base,phase:'complete'});git(root,['reset','--quiet','HEAD','--',...generatedPaths]);console.log('Catalog publication: no public changes; main was not pushed.');return {published:false}}
 const priorState=state;state={...state,lastPublishedAt:new Date(now).toISOString(),commit:null,...scheduled?{lastScheduledDay:utcDay(now)}:{}};
 await report(root,'pending');await saveCheckpoint(root,{base,phase:'before_publication'});await saveState(state);await stage(root);git(root,['commit','--quiet','-m','Refresh public demo catalog']);
 let publishedCommit;
 try{for(let attempt=1;attempt<=3;attempt++){git(root,['fetch','--quiet','origin','main']);try{git(root,['rebase','origin/main'])}catch(e){try{git(root,['rebase','--abort'])}catch{}throw Error('Generated data conflicts with newer main changes; no remote files were overwritten')}
 try{git(root,['push','--quiet','origin','HEAD:main']);publishedCommit=git(root,['rev-parse','HEAD']).trim();break}catch(e){if(attempt===3)throw e}}
 }catch(e){await saveState(priorState);await report(root,'failed');try{await saveCheckpoint(root,{base,phase:'publication_failed'})}catch{}throw e}
 await saveState({...state,commit:publishedCommit});await report(root,'main_saved',publishedCommit);
 // Reconcile saved sync reports now that their accumulated changes reached main.
 for(const name of await readdir(join(root,'data/sync-runs')).catch(()=>[])){
  if(!/^\d+\.json$/.test(name))continue;
  const path=join(root,'data/sync-runs',name),row=JSON.parse(await readFile(path,'utf8'));
  if(row.publication==='awaiting_publication'){row.publication='main_saved';row.publishedCommit=publishedCommit;row.publishedAt=new Date(now).toISOString();await writeFile(path,JSON.stringify(row,null,2)+'\n')}
 }
 try{await saveCheckpoint(root,{base:publishedCommit,phase:'complete'})}catch{console.warn('Main publication succeeded; the completed checkpoint report could not be saved. Recovery files remain in the workflow artifact.')}
 git(root,['reset','--quiet','HEAD','--',...generatedPaths]);console.log('Catalog publication: saved '+publishedCommit+'; one main publication.');return {published:true,commit:publishedCommit,changed:changes.length};
}
