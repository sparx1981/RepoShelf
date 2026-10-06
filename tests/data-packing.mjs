import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,statSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {PACKED,pack,unpack,compress,decompress,isPackedName,logicalName,packedName} from '../lib/data-packing.mjs';
const root=mkdtempSync(join(tmpdir(),'reposhelf-pack-'));
try{
 const body=JSON.stringify({repositories:Array.from({length:500},(_,i)=>({full:'team/p'+i,text:'word '.repeat(60)}))});
 for(const path of PACKED){mkdirSync(join(root,path,'..'),{recursive:true});writeFileSync(join(root,path),body)}
 // packing is small, lossless and deterministic
 assert.deepEqual(pack(root),PACKED);for(const path of PACKED){const gz=readFileSync(join(root,packedName(path)));assert(gz.length<readFileSync(join(root,path)).length/5,'much smaller');assert.equal(decompress(gz).toString(),body)}
 assert.deepEqual(compress(Buffer.from(body)),compress(Buffer.from(body)),'same input, same bytes');assert.deepEqual(pack(root),[],'unchanged files are not rewritten');
 // unpacking restores a missing raw file but never overwrites newer raw work unless forced
 rmSync(join(root,PACKED[0]));writeFileSync(join(root,PACKED[1]),'newer local work');
 assert.deepEqual(unpack(root),[PACKED[0]]);assert.equal(readFileSync(join(root,PACKED[0]),'utf8'),body);assert.equal(readFileSync(join(root,PACKED[1]),'utf8'),'newer local work');
 assert.deepEqual(unpack(root,[PACKED[1]],{force:true}),[PACKED[1]]);assert.equal(readFileSync(join(root,PACKED[1]),'utf8'),body);
 assert.deepEqual(unpack(mkdtempSync(join(tmpdir(),'reposhelf-empty-'))),[],'nothing to unpack is fine');
 assert(isPackedName('dist/catalog.json.gz'));assert(!isPackedName('dist/community.json.gz'));assert.equal(logicalName('data/browse/index.json.gz'),'data/browse/index.json');
}finally{rmSync(root,{recursive:true,force:true})}
// the repository itself: raw files stay out of Git, workflows unpack after checkout, and nothing tracked nears GitHub's 100 MB limit
const ignore=readFileSync(new URL('../.gitignore',import.meta.url),'utf8');for(const path of PACKED)assert(ignore.split('\n').includes('/'+path),path+' is ignored in raw form');
const workflows=new URL('../.github/workflows/',import.meta.url);for(const name of readdirSync(workflows).filter(n=>n.endsWith('.yml'))){const lines=readFileSync(new URL(name,workflows),'utf8').split('\n');lines.forEach((line,i)=>{if(/uses: actions\/checkout@/.test(line)){let j=i+1;while(j<lines.length&&/^\s{8,}\S/.test(lines[j])&&!/^\s+- /.test(lines[j]))j++;assert(/Unpack saved catalogue data/.test(lines[j]||''),`${name}: checkout at line ${i+1} is followed by an unpack step`)}})}
assert(JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts.build.startsWith('node scripts/data-packing.mjs unpack'),'the Vercel build unpacks first');
try{const tracked=execFileSync('git',['ls-files','-z'],{cwd:new URL('..',import.meta.url),encoding:'utf8',maxBuffer:64*1024*1024}).split('\0').filter(Boolean);for(const path of tracked){if(!existsSync(new URL('../'+path,import.meta.url)))continue;const size=statSync(new URL('../'+path,import.meta.url)).size;assert(size<90*1024*1024,`${path} is ${(size/1048576).toFixed(1)} MB; GitHub rejects files over 100 MB`)}}catch(e){if(e.code==='EPERM'||e.code==='ENOENT')console.log('Git is unavailable here; the size guard runs in Actions.');else throw e}
console.log('PASS: large catalogue files are stored compressed, unpacked after checkout, never overwrite newer work and no tracked file nears the 100 MB limit.');
