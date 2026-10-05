import {createHash} from 'node:crypto';
export function shardFor(id,count){return createHash('sha256').update(id.toLowerCase()).digest().readUInt32BE(0)%count;}
export function listingShard(r,count){try{return shardFor(new URL(r.source==='huggingface'?(r.appUrl||r.demo):r.demo).hostname,count);}catch{return shardFor(r.full,count);}}
