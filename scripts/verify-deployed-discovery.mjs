import {mkdir,writeFile} from 'node:fs/promises';
import {auditDiscovery} from './audit-discovery.mjs';
const base='https://www.reposhelf.co.uk';let last;
for(let attempt=0;attempt<8;attempt++){
 try{const report=await auditDiscovery(base,{allowEmpty:true});await mkdir('artifacts',{recursive:true});await writeFile('artifacts/discovery-live.json',JSON.stringify(report,null,2)+'\n');console.log('PASS: production crawlability and public discovery HTTP audit. '+JSON.stringify(report));last=null;break}catch(error){last=error;console.log('Production discovery not ready: '+error.message);if(attempt<7)await new Promise(resolve=>setTimeout(resolve,15000))}
}
if(last)throw last;
