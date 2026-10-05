import {enforceDemoOnly} from './demo-only-policy.mjs';
import {pathToFileURL} from 'node:url';
import {generateBrowseIndex} from '../lib/browse-index.mjs';
import {publishCatalog,restoreCheckpoint} from './catalog-publication.mjs';
const root=process.cwd();
if(process.argv[2]==='restore'){await restoreCheckpoint(root)}else{
 await enforceDemoOnly(pathToFileURL(root+'/'));
 await generateBrowseIndex(pathToFileURL(root+'/'));
 const phase=process.env.SYNC_PUBLICATION_PHASE;
 const result=await publishCatalog(root,{checkpoint:['checkpoint','deferred'].includes(phase),completed:phase==='deferred',scheduled:process.argv.includes('--scheduled')});
 if(process.env.GITHUB_ENV&&typeof result==='string'){const {appendFile}=await import('node:fs/promises');await appendFile(process.env.GITHUB_ENV,'SUBMISSION_COMMIT='+result+'\n')} 
}
