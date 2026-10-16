import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {bucketFor} from './data-packing.mjs';
// README search terms (the 600 most frequent words of a project's README, see searchTerms in scripts/agent-snapshots.mjs) are
// about 115 MB for 63,000 projects, so they do not live inside the catalogue files any more. They are derived data: the README
// itself is saved in data/readmes. They are kept here, in TERM_BUCKETS gzip files chosen by a stable hash of the project id
// (data/readme-terms/part-07.json.gz), each holding { "owner/name": ["term", ...] } with lower-case ids. Only the places that
// use the words read them: the category/subject classifier, the browse search index and the agent search.
export const TERM_BUCKETS=32;
const directory=data=>fileURLToPath(new URL('readme-terms/',typeof data==='string'?pathToFileURL(data.endsWith('/')?data:data+'/'):data));
const shardFile=(dir,i)=>join(dir,'part-'+String(i).padStart(2,'0')+'.json.gz');
export function readTermsShard(dir,i){try{return JSON.parse(gunzipSync(readFileSync(shardFile(dir,i))).toString())}catch(e){if(e.code==='ENOENT')return {};throw e}}
// Every project's terms as a Map keyed by lower-case id.
export function loadTerms(data){const dir=directory(data),map=new Map();for(let i=0;i<TERM_BUCKETS;i++)for(const [id,terms] of Object.entries(readTermsShard(dir,i)))map.set(id,terms);return map}
// Reads and writes whole shards in memory and writes back only the shards that changed (sorted by id, so the bytes depend only on the data).
export function createTermsWriter(data){
 const dir=directory(data),shards=new Map(),dirty=new Set(),shard=i=>{if(!shards.has(i))shards.set(i,readTermsShard(dir,i));return shards.get(i)};
 return {
  set(full,terms){const id=full.toLowerCase(),i=bucketFor(id,TERM_BUCKETS),s=shard(i);if(JSON.stringify(s[id])!==JSON.stringify(terms)){s[id]=terms;dirty.add(i)}},
  // Drops terms for projects that are no longer in the catalogue; `keep` is a Set of lower-case ids.
  prune(keep){let removed=0;for(let i=0;i<TERM_BUCKETS;i++){const s=shard(i);for(const id of Object.keys(s))if(!keep.has(id)){delete s[id];removed++;dirty.add(i)}}return removed},
  flush(){for(const i of dirty){const s=shards.get(i),ids=Object.keys(s).sort(),file=shardFile(dir,i);if(!ids.length){rmSync(file,{force:true});continue}mkdirSync(dir,{recursive:true});writeFileSync(file,gzipSync(JSON.stringify(Object.fromEntries(ids.map(id=>[id,s[id]]))),{level:9}))}dirty.clear()}
 };
}
// One shared writer per data directory for scripts that save many READMEs, flushed when the process ends (and every 500 changes).
const shared=new Map();
export function recordTerms(data,full,terms){const dir=directory(data);let entry=shared.get(dir);if(!entry){entry={writer:createTermsWriter(data),count:0};shared.set(dir,entry);process.once('exit',()=>entry.writer.flush())}entry.writer.set(full,terms);if(++entry.count%500===0)entry.writer.flush()}
export function flushRecordedTerms(){for(const entry of shared.values())entry.writer.flush()}
// A copy of the record with its terms attached, for code that reads r.readmeSnapshot.searchTerms (the classifier).
export function withReadmeTerms(r,terms){const found=terms?.get(String(r.full).toLowerCase());return found&&r.readmeSnapshot&&!r.readmeSnapshot.searchTerms?{...r,readmeSnapshot:{...r.readmeSnapshot,searchTerms:found}}:r}
// Moves search terms that older catalogues carry inside each record into the shards and rewrites the catalogue files without them.
// Cheap when there is nothing to move (one byte search of each file), so it runs after every unpack. `root` is the project root path.
export function migrateReadmeTerms(root){
 const writer=createTermsWriter(join(root,'data')),markers=[Buffer.from('"searchTerms":['),Buffer.from('"searchTerms": [')];let moved=0;
 for(const name of ['dist/catalog.json','dist/spaces.json']){const path=join(root,name);if(!existsSync(path))continue;const raw=readFileSync(path);if(markers.every(m=>raw.indexOf(m)<0))continue;
  const doc=JSON.parse(raw.toString('utf8'));let changed=false;
  for(const r of doc.repositories||[]){const snapshot=r.readmeSnapshot;if(snapshot&&Array.isArray(snapshot.searchTerms)){writer.set(r.full,snapshot.searchTerms);delete snapshot.searchTerms;moved++;changed=true}}
  if(changed)writeFileSync(path,JSON.stringify(doc)+'\n')}
 writer.flush();return moved;
}
