import {enforceDemoOnly} from './demo-only-policy.mjs';
import {pathToFileURL} from 'node:url';
import {generateBrowseIndex} from '../lib/browse-index.mjs';
import {publishCatalog,restoreCheckpoint} from './catalog-publication.mjs';
const root=process.cwd();
if(process.argv[2]==='restore'){await restoreCheckpoint(root)}else{
 await enforceDemoOnly(pathToFileURL(root+'/'));
 await generateBrowseIndex(pathToFileURL(root+'/'));
 await publishCatalog(root,{checkpoint:process.env.SYNC_PUBLICATION_PHASE==='checkpoint'});
}
