import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {TERM_BUCKETS,loadTerms,createTermsWriter,flushRecordedTerms,withReadmeTerms,migrateReadmeTerms} from '../lib/readme-terms.mjs';
import {compactProject} from '../lib/browse-card.mjs';
import {reclassifyCatalog} from '../scripts/reclassify-catalog.mjs';
import {saveReadmeSnapshot} from '../scripts/agent-snapshots.mjs';
const T=createRequire(import.meta.url)('../dist/taxonomy.js');
const dir=await mkdtemp(join(tmpdir(),'reposhelf-terms-')),root=pathToFileURL(dir+'/');
try{
 await mkdir(join(dir,'data'));await mkdir(join(dir,'dist'));
 // Store: lower-case ids, hashed into shards, nothing rewritten when nothing changed, empty shards removed.
 const writer=createTermsWriter(join(dir,'data'));
 writer.set('Team/Alpha',['one','two']);writer.set('team/beta',['three']);writer.flush();
 const loaded=loadTerms(join(dir,'data'));
 assert.deepEqual(loaded.get('team/alpha'),['one','two']);assert.deepEqual(loaded.get('team/beta'),['three']);assert.equal(loaded.size,2);
 const files=readdirSync(join(dir,'data/readme-terms'));assert(files.length>=1&&files.length<=2);assert(files.every(f=>/^part-\d\d\.json$/.test(f)));
 assert(TERM_BUCKETS>1);
 const again=createTermsWriter(join(dir,'data'));again.set('team/alpha',['one','two']);assert.equal(again.prune(new Set(['team/alpha'])),1,'Pruning drops projects that left the catalogue');again.flush();
 const pruned=loadTerms(join(dir,'data'));assert.deepEqual([...pruned.keys()],['team/alpha']);
 createTermsWriter(join(dir,'data')).prune(new Set());const empty=createTermsWriter(join(dir,'data'));empty.prune(new Set());empty.flush();assert.equal(loadTerms(join(dir,'data')).size,0);assert.equal(readdirSync(join(dir,'data/readme-terms')).length,0,'Empty shards are removed');
 // The classifier and the browse card give the same answer from the store as from terms inside the record.
 const inline={full:'team/app',name:'Kitchen helper',description:'A small web app.',readmeSnapshot:{status:'saved',searchTerms:['recipe','cooking','ingredients','kitchen']}};
 const slim={...inline,readmeSnapshot:{status:'saved'}};
 const terms=new Map([['team/app',inline.readmeSnapshot.searchTerms]]);
 assert.deepEqual(T.annotate(withReadmeTerms(slim,terms),{force:true}).subjects,T.annotate(inline,{force:true}).subjects);
 assert.equal(withReadmeTerms(slim,null),slim);assert.equal(withReadmeTerms({full:'x/y'},terms).readmeSnapshot,undefined);
 assert.equal(compactProject(slim,Date.now(),terms).searchReadme,compactProject(inline,Date.now()).searchReadme);
 assert.equal(compactProject(slim,Date.now(),terms).searchReadme,'recipe cooking ingredients kitchen');
 // Saving a README records its words in the store, not in the snapshot that goes into the catalogue.
 process.env.REPOSHELF_SNAPSHOT_DIRECTORY=pathToFileURL(join(dir,'data')+'/').href;
 const saved=await saveReadmeSnapshot({full:'Team/Readme'},'# Widgets\nWidgets render widgets quickly with canvas.','https://example.test/readme');
 assert.equal(saved.searchTerms,undefined);flushRecordedTerms();assert(loadTerms(join(dir,'data')).get('team/readme')?.includes('widgets'));
 delete process.env.REPOSHELF_SNAPSHOT_DIRECTORY;
 // Migration: a catalogue that still carries the terms is slimmed and the terms land in the store.
 await writeFile(join(dir,'dist/catalog.json'),JSON.stringify({updatedAt:'x',repositories:[{full:'a/one',stars:1,readmeSnapshot:{status:'saved',searchTerms:['alpha','beta']}},{full:'a/two',stars:2,readmeSnapshot:{status:'empty'}},{full:'a/three',stars:3}]},null,1));
 await writeFile(join(dir,'dist/spaces.json'),JSON.stringify({repositories:[{full:'hf:b/space',readmeSnapshot:{searchTerms:['gamma']}}]}));
 assert.equal(migrateReadmeTerms(dir),2);
 const after=JSON.parse(await readFile(join(dir,'dist/catalog.json'),'utf8'));
 assert(!(await readFile(join(dir,'dist/catalog.json'),'utf8')).includes('searchTerms'));
 assert.deepEqual(after.repositories.map(r=>r.full),['a/one','a/two','a/three'],'Order and other fields are untouched');
 assert.deepEqual(after.repositories[0].readmeSnapshot,{status:'saved'});
 const stored=loadTerms(join(dir,'data'));assert.deepEqual(stored.get('a/one'),['alpha','beta']);assert.deepEqual(stored.get('hf:b/space'),['gamma']);
 assert.equal(migrateReadmeTerms(dir),0,'A second run has nothing to move');
 // Reclassification reads the terms from the store but never writes them back into the catalogue.
 await writeFile(join(dir,'dist/catalog.json'),JSON.stringify({updatedAt:'x',repositories:[{full:'team/app',name:'Kitchen helper',description:'A small web app.',demo:'https://demo.example',readmeSnapshot:{status:'saved'}}]}));
 await writeFile(join(dir,'dist/spaces.json'),JSON.stringify({repositories:[]}));
 const w2=createTermsWriter(join(dir,'data'));w2.set('team/app',['recipe','cooking','ingredients','kitchen']);w2.flush();
 await reclassifyCatalog(root);
 const written=await readFile(join(dir,'dist/catalog.json'),'utf8');assert(!written.includes('searchTerms'));assert.deepEqual(JSON.parse(written).repositories[0].readmeSnapshot,{status:'saved'});
 assert(JSON.parse(written).repositories[0].classification.version>=1);
 console.log('README search term tests passed.');
}finally{await rm(dir,{recursive:true,force:true})}
