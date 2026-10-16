import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,statSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {PACKED,SHARDED,BUCKETS,bucketFor,pack,unpack,compress,decompress,compactJson,isPackedName,logicalName,packedName} from '../lib/data-packing.mjs';
const root=mkdtempSync(join(tmpdir(),'reposhelf-pack-'));
try{
 const body=JSON.stringify({repositories:Array.from({length:500},(_,i)=>({full:'team/p'+i,text:'word '.repeat(60)}))});
 const PLAIN=PACKED.filter(path=>!SHARDED.includes(path));
 for(const path of PACKED){mkdirSync(join(root,path,'..'),{recursive:true});writeFileSync(join(root,path),body)}
 // packing is small, lossless and deterministic
 assert.deepEqual(pack(root),PACKED);for(const path of PLAIN){const gz=readFileSync(join(root,packedName(path)));assert(gz.length<readFileSync(join(root,path)).length/5,'much smaller');assert.equal(decompress(gz).toString(),body)}
 assert.deepEqual(compress(Buffer.from(body)),compress(Buffer.from(body)),'same input, same bytes');assert.deepEqual(pack(root),[],'unchanged files are not rewritten');
 // pretty-printed input is stored compact, exactly as JSON.stringify would write it, and strings keep their spaces and escapes
 const tricky={a:' spaced  text ',b:'line\nbreak "quoted" \\ back\\',c:[1,{d:null,e:'x y'}],f:'\u00e9 \ud83d\ude00',g:'ends with backslash\\'};const pretty=Buffer.from(JSON.stringify(tricky,null,2)+'\n');
 assert.equal(compactJson(pretty).toString(),JSON.stringify(tricky),'indentation is removed and string contents are untouched');assert.equal(compactJson(Buffer.from(JSON.stringify(tricky))).toString(),JSON.stringify(tricky),'compact input is unchanged');
 const big=JSON.stringify({repositories:Array.from({length:300},(_,i)=>({full:'team/p'+i,text:'a  b\tc '.repeat(20)}))},null,2);writeFileSync(join(root,PLAIN[0]),big);pack(root,[PLAIN[0]]);assert.equal(decompress(readFileSync(join(root,packedName(PLAIN[0])))).toString(),JSON.stringify(JSON.parse(big)),'a pretty file is packed compact');
 writeFileSync(join(root,PLAIN[0]),body);pack(root,[PLAIN[0]]);
 // unpacking restores a missing raw file but never overwrites newer raw work unless forced
 rmSync(join(root,PLAIN[0]));writeFileSync(join(root,PLAIN[1]),'newer local work');
 assert.deepEqual(unpack(root,PLAIN),[PLAIN[0]]);assert.equal(readFileSync(join(root,PLAIN[0]),'utf8'),body);assert.equal(readFileSync(join(root,PLAIN[1]),'utf8'),'newer local work');
 assert.deepEqual(unpack(root,[PLAIN[1]],{force:true}),[PLAIN[1]]);assert.equal(readFileSync(join(root,PLAIN[1]),'utf8'),body);
 assert.deepEqual(unpack(mkdtempSync(join(tmpdir(),'reposhelf-empty-'))),[],'nothing to unpack is fine');
 assert(isPackedName('dist/catalog.json.gz'));assert(!isPackedName('dist/community.json.gz'));assert.equal(logicalName('data/browse/index.json.gz'),'data/browse/index.json');
 // the project catalogues are stored as parts: a stable hash of the id picks the part, a head part keeps everything else
 const catalog='dist/catalog.json',rows=Array.from({length:400},(_,i)=>({full:'org'+(i%23)+'/proj'+i,stars:(i*37)%211,name:'Name "'+i+'" \\ x',note:'a  b\nc'})),doc={schema:2,updatedAt:'t0',revalidation:{checked:3},repositories:rows,policy:'demo-only'};
 rmSync(join(root,catalog));for(const name of readdirSync(join(root,'dist')).filter(n=>/\.part-/.test(n)||n==='catalog.json.gz'))rmSync(join(root,'dist',name));
 writeFileSync(join(root,catalog),JSON.stringify(doc,null,2)+'\n');assert.deepEqual(pack(root,[catalog]),[catalog]);
 const parts=readdirSync(join(root,'dist')).filter(n=>/^catalog\.part-/.test(n));assert(parts.includes('catalog.part-head.json.gz'),'the head part is written');assert(parts.length>8&&parts.length<=BUCKETS+1,'projects spread over many parts ('+parts.length+')');
 assert(!existsSync(join(root,'dist/catalog.json.gz')),'no single-file copy is kept next to the parts');
 const head=JSON.parse(decompress(readFileSync(join(root,'dist/catalog.part-head.json.gz'))).toString());assert.deepEqual(head,{schema:2,updatedAt:'t0',revalidation:{checked:3},repositories:[],policy:'demo-only'},'the head holds every other member in place');
 const spread=new Set(rows.map(r=>bucketFor(r.full)));assert(spread.size>16,'ids spread across buckets');assert.equal(bucketFor('Org/Proj'),bucketFor('org/proj'),'bucket ignores case');assert.equal(bucketFor('a/b'),bucketFor('a/b'),'bucket is stable');
 let seen=0;for(const name of parts.filter(n=>!n.includes('head'))){const part=JSON.parse(decompress(readFileSync(join(root,'dist',name))).toString()),index=Number(name.match(/part-(\d+)/)[1]);assert(part.repositories.every(r=>bucketFor(r.full)===index),name+' holds only its own bucket');assert.deepEqual(part.repositories.map(r=>r.full),[...part.repositories.map(r=>r.full)].sort(),'ordered by id inside a part');seen+=part.repositories.length}assert.equal(seen,rows.length,'every project is stored once');
 assert.deepEqual(pack(root,[catalog]),[],'repacking unchanged data changes nothing');
 // unpacking joins the parts into the same document, most-starred first, key order kept
 const first=readFileSync(join(root,catalog));rmSync(join(root,catalog));assert.deepEqual(unpack(root,[catalog]),[catalog]);const joined=JSON.parse(readFileSync(join(root,catalog),'utf8'));
 assert.deepEqual(Object.keys(joined),Object.keys(doc),'member order is kept');assert.deepEqual(joined.repositories,[...rows].sort((a,z)=>z.stars-a.stars||(a.full<z.full?-1:1)),'same projects, most-starred first');assert.equal(joined.policy,'demo-only');
 assert.deepEqual(pack(root,[catalog]),[],'the unpacked file packs back to identical parts');
 // a change to one project rewrites only its part, and a removed project leaves no stale part behind
 const changed={...doc,repositories:rows.map((r,i)=>i===5?{...r,stars:9999}:r)};writeFileSync(join(root,catalog),JSON.stringify(changed));const before=new Map(parts.map(n=>[n,readFileSync(join(root,'dist',n))]));pack(root,[catalog]);
 const rewritten=parts.filter(n=>!readFileSync(join(root,'dist',n)).equals(before.get(n)));assert.deepEqual(rewritten,['catalog.part-'+String(bucketFor(rows[5].full)).padStart(2,'0')+'.json.gz'],'only the affected part changes');
 writeFileSync(join(root,catalog),JSON.stringify({...doc,repositories:rows.slice(0,3)}));pack(root,[catalog]);assert(readdirSync(join(root,'dist')).filter(n=>/^catalog\.part-\d/.test(n)).length<=3,'parts for empty buckets are removed');
 // a catalogue saved as one compressed file by an earlier run is still unpacked, then replaced by parts on the next pack
 for(const name of readdirSync(join(root,'dist')).filter(n=>/\.part-/.test(n)))rmSync(join(root,'dist',name));rmSync(join(root,catalog));const legacy=JSON.stringify({...doc,repositories:rows.slice(0,10)});writeFileSync(join(root,'dist/catalog.json.gz'),compress(Buffer.from(legacy)));
 assert.deepEqual(unpack(root,[catalog]),[catalog]);assert.equal(readFileSync(join(root,catalog),'utf8'),legacy,'legacy single file is read');assert.deepEqual(pack(root,[catalog]),[catalog]);assert(!existsSync(join(root,'dist/catalog.json.gz')),'the legacy file is removed once parts exist');assert(existsSync(join(root,'dist/catalog.part-head.json.gz')));
 for(const [file,logical] of [['dist/catalog.part-07.json.gz','dist/catalog.json'],['dist/spaces.part-head.json.gz','dist/spaces.json'],['dist/spaces.json.gz','dist/spaces.json']]){assert(isPackedName(file),file+' is a packed name');assert.equal(logicalName(file),logical)}assert(!isPackedName('dist/community.part-01.json.gz'),'only the catalogues are split');
}finally{rmSync(root,{recursive:true,force:true})}
// the repository itself: raw files stay out of Git, workflows unpack after checkout, and nothing tracked nears GitHub's 100 MB limit
const ignore=readFileSync(new URL('../.gitignore',import.meta.url),'utf8');for(const path of PACKED)assert(ignore.split('\n').includes('/'+path),path+' is ignored in raw form');
const workflows=new URL('../.github/workflows/',import.meta.url);for(const name of readdirSync(workflows).filter(n=>n.endsWith('.yml'))){const lines=readFileSync(new URL(name,workflows),'utf8').split('\n');lines.forEach((line,i)=>{if(/uses: actions\/checkout@/.test(line)){let j=i+1;while(j<lines.length&&/^\s{8,}\S/.test(lines[j])&&!/^\s+- /.test(lines[j]))j++;assert(/Unpack saved catalogue data/.test(lines[j]||''),`${name}: checkout at line ${i+1} is followed by an unpack step`)}})}
assert(JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts.build.startsWith('node scripts/data-packing.mjs unpack'),'the Vercel build unpacks first');
try{const tracked=execFileSync('git',['ls-files','-z'],{cwd:new URL('..',import.meta.url),encoding:'utf8',maxBuffer:64*1024*1024}).split('\0').filter(Boolean);for(const path of tracked){if(!existsSync(new URL('../'+path,import.meta.url)))continue;const size=statSync(new URL('../'+path,import.meta.url)).size;assert(size<90*1024*1024,`${path} is ${(size/1048576).toFixed(1)} MB; GitHub rejects files over 100 MB`)}}catch(e){if(e.code==='EPERM'||e.code==='ENOENT')console.log('Git is unavailable here; the size guard runs in Actions.');else throw e}
console.log('PASS: large catalogue files are stored compressed, unpacked after checkout, never overwrite newer work and no tracked file nears the 100 MB limit.');
