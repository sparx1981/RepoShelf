import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {recordStageMetrics} from './sync-metrics.mjs';
import {pathToFileURL} from 'node:url';
const T=createRequire(import.meta.url)('../dist/taxonomy.js');
export async function reclassifyCatalog(root=new URL('../',import.meta.url),{metrics=false}={}){
 const counts={},report={version:T.version,checked:0,changed:0,reviewRequired:0,subjects:counts,platforms:{}};
 for(const name of ['catalog','spaces']){const file=new URL('dist/'+name+'.json',root);let data;try{data=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code==='ENOENT')continue;throw e}
 data.repositories=(data.repositories||[]).map(prior=>{const row=T.annotate(prior,{force:true});report.checked++;if(JSON.stringify([prior.category,prior.subjects,prior.classification])!==JSON.stringify([row.category,row.subjects,row.classification]))report.changed++;if(row.classification.reviewRequired)report.reviewRequired++;for(const platform of row.platforms)report.platforms[platform]=(report.platforms[platform]||0)+1;for(const subject of row.subjects)counts[subject]=(counts[subject]||0)+1;return row});
 // Taxonomy-only work must not claim a fresh repository/demo check.
 await writeFile(file,JSON.stringify(data,null,2)+'\n');
 }
 await mkdir(new URL('data/',root),{recursive:true});await writeFile(new URL('data/taxonomy-report.json',root),JSON.stringify(report,null,2)+'\n');
 if(metrics)await recordStageMetrics('taxonomy',{...report,attempted:report.checked,temporaryFailures:0},root);
 console.log(`Taxonomy v${T.version}: ${report.checked} listings checked, ${report.changed} classifications updated, ${report.reviewRequired} need review. No upstream API calls.`);return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await reclassifyCatalog(undefined,{metrics:true});
