import {nodeFileTrace} from '@vercel/nft';
import {readFile,stat,writeFile,mkdir,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
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
 // Import each isolated package, so exclusion patterns cannot silently remove runtime imports.
 const packed=await mkdtemp(path.join(tmpdir(),'reposhelf-package-'));
 try{
  for(const file of files.filter(file=>!file.startsWith('data/')&&!/^(dist\/(catalog|spaces)\.json)/.test(file))){const target=path.join(packed,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(file,target)}
  execFileSync(process.execPath,['--input-type=module','-e','await import('+JSON.stringify(pathToFileURL(path.join(packed,entry)).href)+')'],{cwd:packed,env:{...process.env,NODE_ENV:'production'},stdio:'pipe',timeout:30000});
 }catch(error){throw Error(entry+' isolated package cannot start: '+(error.stderr?.toString()||error.message))}finally{await rm(packed,{recursive:true,force:true})}
 report.push({entry,bytes,files:files.length,warnings:[...warnings].map(w=>w.message)});console.log(`${entry}: ${(bytes/1048576).toFixed(2)} MiB, ${files.length} files`);
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/function-bundles.json',JSON.stringify(report,null,2));
console.log('Trace estimates include explicit files and exclusions; verify final package sizes in Vercel Resources.');
