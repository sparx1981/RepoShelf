import {existsSync,readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync,openSync,writeSync,closeSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {join,dirname,basename} from 'node:path';
// The saved catalogue files are far larger than GitHub's 100 MB per-file limit allows once raw, so Git stores them
// gzip-compressed (about ten times smaller). Scripts keep reading and writing the raw JSON. `pack` writes the
// compressed (and whitespace-free) copy that Git tracks and `unpack` recreates the raw file after a checkout.
export const PACKED=['dist/catalog.json','dist/spaces.json','data/browse/index.json','data/browse/search.json','data/catalogue-quality.json'];
// The two project catalogues keep growing, so Git does not store each as one file. They are split into BUCKETS parts by a
// stable hash of the project id (dist/catalog.part-07.json.gz ...) plus a small head part holding everything that is not
// the project list. No part can approach GitHub's file limit, a change touches only the parts it affects, and publication
// compares one part at a time. Raw files stay whole for the scripts; `unpack` joins the parts again.
export const SHARDED=['dist/catalog.json','dist/spaces.json'];
export const BUCKETS=32;
const PART=/^(.*)\.part-(?:\d{2}|head)\.json\.gz$/;
export const partName=(path,part)=>path.slice(0,-5)+'.part-'+(part==='head'?'head':String(part).padStart(2,'0'))+'.json.gz';
export const partGlob=path=>path.slice(0,-5)+'.part-*.json.gz';
// Every path Git tracks for the packed files: the plain compressed copy, the parts, and the single file older runs saved.
export const packedPathspecs=PACKED.flatMap(p=>SHARDED.includes(p)?[partGlob(p),p+'.gz']:[p+'.gz']);
export const packedName=path=>path+'.gz';
const partOf=path=>{const m=PART.exec(path);return m&&SHARDED.includes(m[1]+'.json')?m[1]+'.json':null};
export const isPackedName=path=>PACKED.some(p=>path===p+'.gz')||partOf(path)!==null;
export const logicalName=path=>partOf(path)||(isPackedName(path)?path.slice(0,-3):path);
// Level 9 with no embedded timestamp: the same content always gives the same bytes, so unchanged files never show as changed.
export const compress=bytes=>gzipSync(bytes,{level:9});
export const decompress=bytes=>gunzipSync(bytes);
// Removes the whitespace between JSON tokens (indentation and newlines) straight from the bytes. Pretty-printing adds about
// 40% to the catalogue (490 MB against 302 MB), and Node cannot hold a string over ~537 MB, so a pretty file stops being
// parseable long before the data does. Working on bytes needs no parse and no string. Whitespace inside strings is
// untouched (a JSON string cannot contain a raw newline, and quotes are tracked), so the result equals
// JSON.stringify(JSON.parse(input)) for any valid JSON.
export function compactJson(bytes){const out=Buffer.allocUnsafe(bytes.length);let n=0,inString=false,escaped=false;for(let i=0;i<bytes.length;i++){const c=bytes[i];if(inString){out[n++]=c;if(escaped)escaped=false;else if(c===92)escaped=true;else if(c===34)inString=false;continue}if(c===34){inString=true;out[n++]=c}else if(c!==32&&c!==10&&c!==13&&c!==9)out[n++]=c}return out.subarray(0,n)}
// Splitting compact JSON by bytes: the end of the value that starts at `i` (the index of the `,` or closing bracket after it).
function endOfValue(b,i){let depth=0,inString=false,escaped=false;for(;i<b.length;i++){const c=b[i];if(inString){if(escaped)escaped=false;else if(c===92)escaped=true;else if(c===34)inString=false;continue}if(c===34)inString=true;else if(c===123||c===91)depth++;else if(c===125||c===93){if(depth===0)return i;depth--}else if(c===44&&depth===0)return i}return i}
// The members of a compact top-level object: key text (with quotes), its decoded name and where its value starts and ends.
function members(b){if(b[0]!==123)throw Error('Expected a JSON object');const out=[];let i=1;while(b[i]!==125){const ks=i;i++;while(b[i]!==34){if(b[i]===92)i++;i++}i++;const ke=i;if(b[i]!==58)throw Error('Malformed JSON object');i++;const vs=i,ve=endOfValue(b,i);out.push({key:JSON.parse(b.toString('utf8',ks,ke)),ks,ke,vs,ve});i=ve;if(b[i]===44)i++}return out}
// The elements of a compact array whose `[` is at `start` (value ends at `end`).
function elements(b,start,end){if(b[start]!==91)throw Error('Expected a JSON array');const out=[];let i=start+1;while(b[i]!==93&&i<end){const e=endOfValue(b,i);out.push([i,e]);i=e;if(b[i]===44)i++}return out}
// FNV-1a over the lower-cased project id: stable, well spread and the same on every machine.
export function bucketFor(full,buckets=BUCKETS){let h=0x811c9dc5;for(const byte of Buffer.from(String(full).toLowerCase())){h^=byte;h=Math.imul(h,0x01000193)>>>0}return h%buckets}
const existingParts=(root,path)=>{const directory=join(root,dirname(path)),prefix=basename(path).slice(0,-5)+'.part-';try{return readdirSync(directory).filter(n=>n.startsWith(prefix)&&PART.test(join(dirname(path),n).replace(/\\/g,'/'))).map(n=>join(dirname(path),n).replace(/\\/g,'/'))}catch(e){if(e.code==='ENOENT')return [];throw e}};
function writeIfChanged(file,bytes){if(existsSync(file)&&readFileSync(file).equals(bytes))return false;mkdirSync(dirname(file),{recursive:true});writeFileSync(file,bytes);return true}
function packSharded(root,path){
 const raw=join(root,path);if(!existsSync(raw))return false;
 const b=compactJson(readFileSync(raw)),all=members(b),list=all.find(m=>m.key==='repositories');
 const wanted=new Map();let changed=false;
 // The head keeps every other member in order, with an empty list where the projects were.
 const headParts=all.map(m=>b.subarray(m.ks,m.ke).toString('utf8')+':'+(m===list?'[]':b.subarray(m.vs,m.ve).toString('utf8')));
 wanted.set(partName(path,'head'),compress(Buffer.from('{'+headParts.join(',')+'}')));
 if(list){const buckets=Array.from({length:BUCKETS},()=>[]);for(const [s,e] of elements(b,list.vs,list.ve)){const row=JSON.parse(b.toString('utf8',s,e));buckets[bucketFor(row.full)].push({full:String(row.full),bytes:b.subarray(s,e)})}
  // Inside a part the projects are ordered by id, so the stored bytes do not depend on how the raw file happened to be sorted.
  buckets.forEach((rows,index)=>{if(rows.length){rows.sort((a,z)=>a.full<z.full?-1:a.full>z.full?1:0);wanted.set(partName(path,index),compress(Buffer.concat([Buffer.from('{"repositories":['),...rows.flatMap((r,i)=>i?[Buffer.from(','),r.bytes]:[r.bytes]),Buffer.from(']}')])))}})}
 for(const [name,bytes] of wanted)if(writeIfChanged(join(root,name),bytes))changed=true;
 // Parts for buckets that are now empty, and the single file older runs saved, are removed so Git records the deletion.
 for(const name of existingParts(root,path))if(!wanted.has(name)){rmSync(join(root,name),{force:true});changed=true}
 if(existsSync(join(root,packedName(path)))){rmSync(join(root,packedName(path)),{force:true});changed=true}
 return changed;
}
export function pack(root,paths=PACKED){const written=[];for(const path of paths){if(SHARDED.includes(path)){if(packSharded(root,path))written.push(path);continue}const raw=join(root,path),target=join(root,packedName(path));if(!existsSync(raw))continue;const bytes=compactJson(readFileSync(raw)),next=compress(bytes);if(existsSync(target)&&readFileSync(target).equals(next))continue;mkdirSync(dirname(target),{recursive:true});writeFileSync(target,next);written.push(path)}return written}
function unpackSharded(root,path,force){
 const raw=join(root,path),head=join(root,partName(path,'head'));
 if(!existsSync(head)){
  // Nothing sharded yet: a catalogue saved as one compressed file by an earlier run is still read as before.
  const source=join(root,packedName(path));if(!existsSync(source)||(!force&&existsSync(raw)))return false;mkdirSync(dirname(raw),{recursive:true});writeFileSync(raw,decompress(readFileSync(source)));return true}
 if(!force&&existsSync(raw))return false;
 const headBytes=decompress(readFileSync(head)),headMembers=members(headBytes),rows=[];
 for(const name of existingParts(root,path).filter(n=>!n.endsWith('part-head.json.gz')).sort()){const b=decompress(readFileSync(join(root,name))),list=members(b).find(m=>m.key==='repositories');if(!list)continue;for(const [s,e] of elements(b,list.vs,list.ve)){const row=JSON.parse(b.toString('utf8',s,e));rows.push({bytes:b.subarray(s,e),stars:row.stars||0,full:String(row.full)})}}
 // The catalogue is kept most-starred first; ties fall back to the id so the order is the same on every run.
 rows.sort((a,z)=>z.stars-a.stars||(a.full<z.full?-1:a.full>z.full?1:0));
 mkdirSync(dirname(raw),{recursive:true});const fd=openSync(raw,'w');
 try{let pending=[],size=0;const flush=()=>{if(pending.length){writeSync(fd,Buffer.concat(pending));pending=[];size=0}},put=buffer=>{pending.push(buffer);size+=buffer.length;if(size>=8*1024*1024)flush()};
  put(Buffer.from('{'));headMembers.forEach((m,i)=>{if(i)put(Buffer.from(','));put(headBytes.subarray(m.ks,m.ke));put(Buffer.from(':'));if(m.key==='repositories'){put(Buffer.from('['));rows.forEach((r,j)=>{if(j)put(Buffer.from(','));put(r.bytes)});put(Buffer.from(']'))}else put(headBytes.subarray(m.vs,m.ve))});put(Buffer.from('}'));flush()}
 finally{closeSync(fd)}
 return true;
}
// Recreates a missing raw file from its compressed copy. `force` replaces an existing raw file (used after a checkpoint restore).
export function unpack(root,paths=PACKED,{force=false}={}){const written=[];for(const path of paths){if(SHARDED.includes(path)){if(unpackSharded(root,path,force))written.push(path);continue}const raw=join(root,path),source=join(root,packedName(path));if(!existsSync(source)||(!force&&existsSync(raw)))continue;mkdirSync(dirname(raw),{recursive:true});writeFileSync(raw,decompress(readFileSync(source)));written.push(path)}return written}
