import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildSearchCandidates,candidateIds} from '../lib/search-candidates.mjs';
const require=createRequire(import.meta.url),Fast=require('../dist/browse.js'),Reference=require('./support/browse-reference.cjs');
// The optimised matcher must return exactly what the original did, whether records are raw or prepared (normalised text from the search file).
let seed=20261011;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296},pick=list=>list[Math.floor(rand()*list.length)];
const vocabulary=['calculator','calculators','chess','glass','class','news','kanban','todo','tasks','photo','photos','photography','picture','image','budget','finance','expense','nodejs','node.js','Next.js','three.js','React','react','js','javascript','ai','machine','learning','editor','markdown','pomodoro','timer','weather','dashboard','café','Zürich','naïve','résumé','c++','c#','self-hosted','e-commerce','3d','arcade','synth','piano','drum','notes','wiki','chat','map','maps','recipe','gallery','engine','physics','sketch','draw','paint','video','audio','player','converter','generator','tracker','planner','habits','pdf','csv','json','regex','color','colour','palette','font','icon','emoji','snake','tetris','sudoku','weather','clock','alarm','stopwatch','kalkulator','caculator'];
const sentence=(n,punctuated)=>Array.from({length:n},()=>{const w=pick(vocabulary);return punctuated?pick([w,w.toUpperCase(),w+',',w+'.','('+w+')','"'+w+'"']):w}).join(punctuated?pick([' ','  ','\n',' — ']):' ');
const records=[];
for(let i=0;i<700;i++){const name=sentence(1+Math.floor(rand()*3),false),owner=pick(vocabulary).replace(/[^a-z0-9]/gi,'')||'dev';
 records.push({full:owner+'/'+name.replace(/\s+/g,'-'),name:rand()<.1?name.toUpperCase():name,description:rand()<.1?'':sentence(Math.floor(rand()*12),true),language:pick(['Python','JavaScript','TypeScript','Rust','Go','C++','',undefined]),topics:rand()<.2?undefined:Array.from({length:Math.floor(rand()*5)},()=>pick(vocabulary).toLowerCase()),subjects:rand()<.5?[]:[pick(vocabulary)],category:pick(['Design','Games & game development','Developer tools',undefined]),technologies:rand()<.3?[pick(['React','Vue','Three.js','Node.js'])]:undefined,
  searchOverview:rand()<.4?'':sentence(Math.floor(rand()*40),true),searchReadme:rand()<.1?'':sentence(Math.floor(rand()*120),true)})}
records.push({full:'a/b',name:'Nebula'},{full:'c/d',name:'Glass',searchText:'class news'},{full:'e/f',name:'Chess',searchReadme:'photo'});
const prepared=records.map(r=>({...r,searchOverview:Fast.normalize(r.searchOverview),searchReadme:r.searchReadme===undefined?undefined:Fast.normalize(r.searchReadme),searchPrepared:true}));
const queries=['calculator','calculators','calculater','calcualtor','calc','cal','chess','chesss','glass','glasses','class','news','new','kanban','todo','to do','tasks','task','photo','photos','photography','picture','budget','ai','js','nodejs','node.js','node js','next.js','three js','react','reactjs','javascript','machine learning','markdown editor','pomodoro timer','weather','dashboard','cafe','café','zurich','Zürich','naive','resume','c++','c#','self hosted','self-hosted','e commerce','3d','arcade','synth','piano','kalkulator','caculator','nothing-matches-this','x','xy','  chess  ','CHESS','Chess!','photo gallery','image converter','video player','dark mode','zzzz qqqq',''];
let compared=0,matched=0;
for(const [label,list] of [['raw',records],['prepared',prepared]])for(const q of queries)for(let i=0;i<list.length;i++){
 const expected=Reference.searchMatch(records[i],q),actual=Fast.searchMatch(list[i],q);compared++;if(expected)matched++;
 assert.deepEqual(actual,expected,`${label} record ${list[i].full} query "${q}"`)}
// Each record remembers its last query's answer (as before), so after an edit only a fresh query is guaranteed to see it; the normalised text behind
// that answer must not be stale.
const probe={full:'x/probe',name:'Alpha',description:'beta gamma',topics:['delta'],searchReadme:'epsilon',searchPrepared:true};
assert.equal(Fast.searchMatch(probe,'alpha').reason,'Matches project name');assert.equal(Fast.searchMatch(probe,'delta').reason,'Matches tags');assert.equal(Fast.searchMatch(probe,'epsilon').reason,'Mentioned in README');assert.equal(Fast.searchMatch(probe,'omega'),null);
probe.name='Theta';assert.equal(Fast.searchMatch(probe,'theta').reason,'Matches project name');assert.equal(Fast.searchMatch(probe,'gamma').reason,'Matches description');
probe.topics=['sigma-topic'];assert.equal(Fast.searchMatch(probe,'sigma').reason,'Matches tags');
assert(matched>2000,'the corpus must produce a meaningful number of matches ('+matched+')');
console.log(`PASS: optimised search matcher equals the original on ${compared} record/query pairs (${matched} matches), raw and prepared records, and tracks edits.`);


const candidateRecords=prepared.map((r,i)=>({...r,full:r.full+'-'+i})),referenceRecords=records.map((r,i)=>({...r,full:r.full+'-'+i}));
const candidateIndex=buildSearchCandidates({version:'fixture',repositories:candidateRecords},{entries:Object.fromEntries(candidateRecords.map(r=>[r.full,[r.searchOverview||'',r.searchReadme||Fast.normalize(r.searchText)||'']]))},[]);
for(const q of queries){const found=candidateIds(candidateIndex,q);if(found===null)continue;const ids=new Set(found);for(let i=0;i<referenceRecords.length;i++)if(Reference.searchMatch(referenceRecords[i],q))assert(ids.has(i),'Candidate lookup must retain '+referenceRecords[i].full+' for '+q)}
console.log('PASS: candidate lookup retains every reference match across accents, plurals, prefixes, aliases, typos, README and non-Latin queries.');
