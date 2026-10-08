import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),P=require('../dist/providers.js');
// Prior ranking is the compatibility oracle: source normalization and ties must remain unchanged.
function prior(repos){const groups=new Map(),raw=r=>P.isSpace(r)?Math.log1p(r.likes||0):.7*Math.log1p(r.stars||0)+.3*Math.log1p(r.forks||0);for(const r of repos){const k=P.isSpace(r)?'hf':'gh';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}if(groups.size<2)return [...repos].sort((a,b)=>raw(b)-raw(a));const ranks=new Map();for(const group of groups.values()){const scores=group.map(raw).sort((a,b)=>a-b);for(const r of group)ranks.set(r,(scores.indexOf(raw(r))+scores.lastIndexOf(raw(r))+1)/(2*scores.length))}return [...repos].sort((a,b)=>ranks.get(b)-ranks.get(a)||a.full.localeCompare(b.full))}
let seed=12345;const random=()=>((seed=(seed*1664525+1013904223)>>>0)%21);
const rows=Array.from({length:1800},(_,i)=>i%4?{full:'org/'+i,stars:random(),forks:random()}:{source:'huggingface',full:'hf:org/'+i,likes:random()});
for(const list of [[],rows,rows.filter(r=>!P.isSpace(r)),rows.filter(P.isSpace),rows.slice(0,20).map(r=>({...r,stars:0,forks:0,likes:0})),[...rows.slice(0,40),{full:'org/invalid',stars:-2}]]){const copy=JSON.stringify(list);assert.deepEqual(P.popular(list),prior(list));assert.equal(JSON.stringify(list),copy,'Ranking must not mutate saved data');}
console.log('PASS: ranking parity across mixed/single sources, tied/zero/invalid scores; all records preserved without mutation.');
