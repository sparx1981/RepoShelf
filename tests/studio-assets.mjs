import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build,transform} from 'esbuild';

const dist=new URL('../dist/',import.meta.url);
const html=await readFile(new URL('studio.html',dist),'utf8');
const entry=process.argv.includes('--built')?html.match(/src=["']([^"']*studio\.[a-f0-9]{16}\.js)["']/)?.[1]:'/studio.js';
assert.ok(entry,'Built Studio HTML must load its fingerprinted script.');
const source=await readFile(new URL('.'+entry,dist),'utf8');
// Production relocates root scripts to /assets/. Resolve the emitted imports
// from that location, rather than testing only the unbuilt source page.
const {code}=await transform(source,{loader:'js',minify:true,target:'es2020',legalComments:'inline'});
await build({stdin:{contents:code,resolveDir:fileURLToPath(new URL('assets/',dist)),sourcefile:'studio.production.js'},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent',plugins:[{
 name:'browser-root-imports',setup(builder){builder.onResolve({filter:/^\//},args=>({path:fileURLToPath(new URL('.'+args.path,dist))}))}
}]});
console.log('PASS: Fingerprinted Studio script and every imported module resolve from their production URLs.');
