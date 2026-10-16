import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {join,dirname} from 'node:path';
// The saved catalogue files are far larger than GitHub's 100 MB per-file limit allows once raw, so Git stores them
// gzip-compressed (about ten times smaller). Scripts keep reading and writing the raw JSON. `pack` writes the
// compressed (and whitespace-free) copy that Git tracks and `unpack` recreates the raw file after a checkout.
export const PACKED=['dist/catalog.json','dist/spaces.json','data/browse/index.json','data/browse/search.json','data/catalogue-quality.json'];
export const packedName=path=>path+'.gz';
export const isPackedName=path=>PACKED.some(p=>path===p+'.gz');
export const logicalName=path=>isPackedName(path)?path.slice(0,-3):path;
// Level 9 with no embedded timestamp: the same content always gives the same bytes, so unchanged files never show as changed.
export const compress=bytes=>gzipSync(bytes,{level:9});
export const decompress=bytes=>gunzipSync(bytes);
// Removes the whitespace between JSON tokens (indentation and newlines) straight from the bytes. Pretty-printing adds about
// 40% to the catalogue (490 MB against 302 MB), and Node cannot hold a string over ~537 MB, so a pretty file stops being
// parseable long before the data does. Working on bytes needs no parse and no string. Whitespace inside strings is
// untouched (a JSON string cannot contain a raw newline, and quotes are tracked), so the result equals
// JSON.stringify(JSON.parse(input)) for any valid JSON.
export function compactJson(bytes){const out=Buffer.allocUnsafe(bytes.length);let n=0,inString=false,escaped=false;for(let i=0;i<bytes.length;i++){const c=bytes[i];if(inString){out[n++]=c;if(escaped)escaped=false;else if(c===92)escaped=true;else if(c===34)inString=false;continue}if(c===34){inString=true;out[n++]=c}else if(c!==32&&c!==10&&c!==13&&c!==9)out[n++]=c}return out.subarray(0,n)}
export function pack(root,paths=PACKED){const written=[];for(const path of paths){const raw=join(root,path),target=join(root,packedName(path));if(!existsSync(raw))continue;const bytes=compactJson(readFileSync(raw)),next=compress(bytes);if(existsSync(target)&&readFileSync(target).equals(next))continue;mkdirSync(dirname(target),{recursive:true});writeFileSync(target,next);written.push(path)}return written}
// Recreates a missing raw file from its compressed copy. `force` replaces an existing raw file (used after a checkpoint restore).
export function unpack(root,paths=PACKED,{force=false}={}){const written=[];for(const path of paths){const raw=join(root,path),source=join(root,packedName(path));if(!existsSync(source)||(!force&&existsSync(raw)))continue;mkdirSync(dirname(raw),{recursive:true});writeFileSync(raw,decompress(readFileSync(source)));written.push(path)}return written}
