import {mkdir,writeFile} from 'node:fs/promises';
import {auditDiscovery} from './audit-discovery.mjs';
const base='https://www.reposhelf.co.uk',attempts=Number(process.env.REPOSHELF_DISCOVERY_VERIFY_ATTEMPTS||8);if(!Number.isInteger(attempts)||attempts<1||attempts>80)throw Error('REPOSHELF_DISCOVERY_VERIFY_ATTEMPTS must be an integer from 1 to 80');let last;
for(let attempt=0;attempt<attempts;attempt++){
 try{const report=await auditDiscovery(base,{allowEmpty:true});await mkdir('artifacts',{recursive:true});await writeFile('artifacts/discovery-live.json',JSON.stringify(report,null,2)+'\n');console.log('PASS: production crawlability and public discovery HTTP audit. '+JSON.stringify(report));last=null;break}catch(error){last=error;console.log('Production discovery not ready: '+error.message);if(attempt<attempts-1)await new Promise(resolve=>setTimeout(resolve,15000))}
}
if(last)throw last;
