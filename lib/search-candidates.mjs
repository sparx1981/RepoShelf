import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),S=require('../dist/storefront.js');
// Delta-varints keep postings compact on disk and avoid parsing millions of
// JSON numbers during the first search. Only queried lists are decoded.
function encode(values){const bytes=[];let previous=0;for(const value of values){let delta=value-previous;previous=value;while(delta>=128){bytes.push((delta&127)|128);delta>>>=7}bytes.push(delta)}return Buffer.from(bytes).toString('base64')}
function decode(value){if(Array.isArray(value))return value;if(!value)return [];const bytes=Buffer.from(value,'base64'),out=[];let previous=0,delta=0,shift=0;for(const byte of bytes){delta|=(byte&127)<<shift;if(byte&128)shift+=7;else{previous+=delta;out.push(previous);delta=0;shift=0}}return out}
// Postings identify a superset of matches. The existing matcher still supplies
// the scores and reasons; aliases/typos never remove legitimate README matches.
export function buildSearchCandidates(index,search,controls){
 const postings=new Map(),metadata=new Set(),names=new Set(),ids=index.repositories.map(r=>r.full);
 index.repositories.forEach((r,i)=>{
  const entry=search.entries[r.full]||['',''];
  const name=B.normalize([r.name,r.full].join(' ')).split(' ').filter(Boolean);
  const light=B.normalize([r.name,r.full,r.description,r.language,...S.technologies(r),...(r.topics||[]),...(r.subjects||[]),r.category].join(' '));
  const meta=(light+' '+entry[0]).split(' ').filter(Boolean),all=new Set([...meta,...entry[1].split(' ').filter(Boolean)]);
  name.forEach(word=>names.add(word));meta.forEach(word=>metadata.add(word));
  for(const word of all){if(!postings.has(word))postings.set(word,[]);postings.get(word).push(i)}
 });
 return {schema:2,version:index.version,controls:JSON.stringify(controls),ids,postings:Object.fromEntries([...postings].map(([word,positions])=>[word,encode(positions)])),metadata:[...metadata],names:[...names],shardSize:256};
}
export function candidateIds(index,query){
 const words=B.normalize(query).split(' ').filter(Boolean);if(!words.length)return null;
 let result;
 for(const word of words){
  const found=new Set(),add=term=>{for(const i of decode(index.postings[term]))found.add(i)},forms=term=>{const root=B.stem(term);add(term);add(root);add(root+'s')};
  forms(word);
  if(word.length>=3)for(const token of index.names)if(token.startsWith(word))add(token);
  for(const alias of B.aliases[B.stem(word)]||[])forms(alias.split(' ')[0]);
  if(word.length>=4&&word.length<=32)for(const token of index.metadata)if(B.near(word,token))add(token);
  result=result===undefined?found:new Set([...result].filter(i=>found.has(i)));
  if(!result.size)break;
 }
 return [...result].sort((a,b)=>a-b);
}
