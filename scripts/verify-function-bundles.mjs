import {nodeFileTrace} from '@vercel/nft';
import {readFile,stat,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),nftRequire=createRequire(require.resolve('@vercel/nft')), {glob}=nftRequire('glob'),picomatch=nftRequire('picomatch');
const config=JSON.parse(await readFile('vercel.json','utf8')),report=[];
for(const [entry,options] of Object.entries(config.functions)){
 for(const field of ['includeFiles','excludeFiles'])if((options[field]||'').length>256)throw Error(entry+' '+field+' exceeds Vercel schema limit');
 const excluded=picomatch(options.excludeFiles||'__nothing__',{dot:true});
 const {fileList,warnings}=await nodeFileTrace([entry],{base:process.cwd(),ignore:path=>excluded(path.replaceAll('\\','/'))});
 const included=await glob(options.includeFiles,{nodir:true,dot:true});const files=[...new Set([...fileList,...included])].filter(path=>!excluded(path));let bytes=0;
 for(const file of files)bytes+=(await stat(file)).size;
 const light=!['api/editorial.mjs','api/agent.mjs','api/mcp.mjs'].includes(entry);
 if(light&&files.some(p=>/^dist\/(catalog|spaces)\.json$|^data\/(browse|readmes|context)\//.test(p)))throw Error(entry+' includes complete catalogue or document data');
 if(light&&bytes>30*1024*1024)throw Error(entry+' exceeds the 30 MB lightweight function budget');
 report.push({entry,bytes,files:files.length,warnings:[...warnings].map(w=>w.message)});console.log(`${entry}: ${(bytes/1048576).toFixed(2)} MiB, ${files.length} files`);
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/function-bundles.json',JSON.stringify(report,null,2));
console.log('Trace estimates include explicit files and exclusions; verify final package sizes in Vercel Resources.');
