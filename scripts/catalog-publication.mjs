import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
export const CHECKPOINT_BRANCH='reposhelf-checkpoints';
export const generatedPaths=['dist/catalog.json','dist/spaces.json','dist/community.json','dist/growth.json','data','dist/previews'];
export const generated=path=>path.startsWith('data/')||path.startsWith('dist/previews/')||/^dist\/(catalog|spaces|community|growth)\.json$/.test(path);
const git=(root,args,options={})=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe'],...options});
function publicJson(path,text){const value=JSON.parse(text);if(path==='dist/catalog.json'||path==='dist/spaces.json'){delete value.updatedAt;delete value.revalidation;delete value.discovery;value.repositories=(value.repositories||[]).map(r=>{const row={...r};for(const key of ['enrichmentAttemptAt','overviewAttemptAt','agentContextAttemptAt','aiOverviewAttemptAt'])delete row[key];return row}).sort((a,b)=>a.full.localeCompare(b.full))}else if(path==='dist/community.json')delete value.updatedAt;return JSON.stringify(value)}
export function publicFileChanged(path,before,after){
 if(path.startsWith('data/sync-runs/')||path.startsWith('data/browse/')||path==='data/browser-cycle.json'||path==='data/ai-overview-usage.json'||path==='dist/growth.json')return false;
 if(/^dist\/(catalog|spaces|community)\.json$/.test(path)&&before!==null&&after!==null){try{return publicJson(path,before)!==publicJson(path,after)}catch{return true}}
 return before!==after;
}
async function stage(root){const paths=generatedPaths.filter(p=>existsSync(join(root,p))||git(root,['ls-files','--',p]).trim());if(paths.length)git(root,['add','-A','--',...paths]);return paths}
export function changedPublicFiles(root){const paths=git(root,['diff','--cached','--name-only','-z']).split('\0').filter(Boolean);return paths.filter(path=>{if(!generated(path))throw Error('Only generated files may be published');let before=null,after=null;try{before=git(root,['show','HEAD:'+path],{encoding:null}).toString(path.endsWith('.json')?'utf8':'base64')}catch{}try{after=git(root,['show',':'+path],{encoding:null}).toString(path.endsWith('.json')?'utf8':'base64')}catch{}return publicFileChanged(path,before,after)})}
async function report(root,publication,commit=null){const id=process.env.GITHUB_RUN_ID;if(!/^\d+$/.test(id||''))return;const path=join(root,'data/sync-runs',id+'.json');try{const row=JSON.parse(await readFile(path,'utf8'));row.publication=publication;row.publishedCommit=commit;await writeFile(path,JSON.stringify(row,null,2)+'\n')}catch(e){if(e.code!=='ENOENT')throw e}}
function remoteCheckpoint(root){try{git(root,['ls-remote','--exit-code','--heads','origin',CHECKPOINT_BRANCH])}catch(e){if(e.status===2)return null;throw e}git(root,['fetch','--quiet','origin',`refs/heads/${CHECKPOINT_BRANCH}:refs/remotes/origin/${CHECKPOINT_BRANCH}`]);return git(root,['rev-parse','refs/remotes/origin/'+CHECKPOINT_BRANCH]).trim()}
export async function saveCheckpoint(root,{base,phase='checkpoint'}={}){
 await stage(root);const tree=git(root,['write-tree']).trim(),temporary=await mkdtemp(join(tmpdir(),'reposhelf-index-'));
 let reportIds=[];try{reportIds=(await readdir(join(root,'data/sync-runs'))).filter(n=>/^\d+\.json$/.test(n)).map(n=>n.slice(0,-5)).sort((a,b)=>b.length-a.length||b.localeCompare(a)).slice(0,20)}catch(e){if(e.code!=='ENOENT')throw e}
 const manifest={schema:1,base:base||git(root,['rev-parse','HEAD']).trim(),phase,runId:process.env.GITHUB_RUN_ID||null,reportIds,at:new Date().toISOString()};
 try{const env={...process.env,GIT_INDEX_FILE:join(temporary,'index')};git(root,['read-tree',tree],{env});const blob=git(root,['hash-object','-w','--stdin'],{input:JSON.stringify(manifest)+'\n'}).trim();git(root,['update-index','--add','--cacheinfo',`100644,${blob},.sync-checkpoint.json`],{env});const snapshot=git(root,['write-tree'],{env}).trim();
 for(let attempt=1;attempt<=3;attempt++){const parent=remoteCheckpoint(root)||manifest.base;const commit=git(root,['commit-tree',snapshot,'-p',parent,'-m','Save catalogue recovery checkpoint']).trim();try{git(root,['push','--quiet','origin',`${commit}:refs/heads/${CHECKPOINT_BRANCH}`]);console.log('Recovery checkpoint saved to '+CHECKPOINT_BRANCH+' ('+phase+').');return commit}catch(e){if(attempt===3)throw e}}
 }finally{await rm(temporary,{recursive:true,force:true})}
}
export async function restoreCheckpoint(root){
 const commit=remoteCheckpoint(root);if(!commit){console.log('No recovery checkpoint branch yet.');return {restored:0,conflicts:0}}
 const meta=JSON.parse(git(root,['show',commit+':.sync-checkpoint.json']));if(meta.schema!==1||!/^[a-f0-9]{40}$/.test(meta.base))throw Error('Invalid checkpoint baseline');
 try{git(root,['cat-file','-e',meta.base+'^{commit}'])}catch{git(root,['fetch','--quiet','origin',meta.base])}
 const changed=git(root,['diff','--name-only','-z',meta.base,commit]).split('\0').filter(generated),current=git(root,['rev-parse','HEAD']).trim();let restored=0,conflicts=0;
 const blob=(ref,path)=>{try{return git(root,['rev-parse',ref+':'+path]).trim()}catch{return null}};
 for(const path of changed){if(path.includes('..')||path.startsWith('/'))throw Error('Invalid checkpoint path');const before=blob(meta.base,path),after=blob(commit,path),present=blob(current,path);if(present===after)continue;if(present!==before){conflicts++;continue}const file=join(root,path);if(after===null)await rm(file,{force:true});else{await mkdir(dirname(file),{recursive:true});await writeFile(file,git(root,['show',commit+':'+path],{encoding:null}))}restored++}
 console.log(`Checkpoint recovery: ${restored} generated files restored; ${conflicts} files kept from newer main changes.`);return {restored,conflicts};
}
export async function publishCatalog(root=process.cwd(),{checkpoint=false}={}){
 git(root,['config','user.name','github-actions[bot]']);git(root,['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
 const base=git(root,['rev-parse','HEAD']).trim();
 if(checkpoint){await report(root,'checkpoint_saved');return saveCheckpoint(root,{base,phase:'checkpoint'})}
 await stage(root);const changes=changedPublicFiles(root);
 if(!changes.length){await report(root,'unchanged',base);await saveCheckpoint(root,{base,phase:'complete'});git(root,['reset','--quiet','HEAD','--',...generatedPaths]);console.log('Catalog publication: no public changes; main was not pushed.');return {published:false}}
 await report(root,'pending');await saveCheckpoint(root,{base,phase:'before_publication'});await stage(root);git(root,['commit','--quiet','-m','Refresh public demo catalog']);
 let publishedCommit;
 try{for(let attempt=1;attempt<=3;attempt++){git(root,['fetch','--quiet','origin','main']);try{git(root,['rebase','origin/main'])}catch(e){try{git(root,['rebase','--abort'])}catch{}throw Error('Generated data conflicts with newer main changes; no remote files were overwritten')}
 try{git(root,['push','--quiet','origin','HEAD:main']);publishedCommit=git(root,['rev-parse','HEAD']).trim();break}catch(e){if(attempt===3)throw e}}
 }catch(e){await report(root,'failed');try{await saveCheckpoint(root,{base,phase:'publication_failed'})}catch{}throw e}
 await report(root,'main_saved',publishedCommit);
 try{await saveCheckpoint(root,{base:publishedCommit,phase:'complete'})}catch{console.warn('Main publication succeeded; the completed checkpoint report could not be saved. Recovery files remain in the workflow artifact.')}
 git(root,['reset','--quiet','HEAD','--',...generatedPaths]);console.log('Catalog publication: saved '+publishedCommit+'; one main publication.');return {published:true,commit:publishedCommit,changed:changes.length};
}
