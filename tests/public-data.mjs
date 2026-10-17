import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {prune} from '../scripts/prune-public-data.mjs';
// The complete catalogue holds every record, including unpublished and moderated listings and internal check fields. It is
// needed while building but must never be published.
const dir=await mkdtemp(join(tmpdir(),'public-data-'));
const secret=['catalog.json','spaces.json','catalog.part-00.json.gz','catalog.part-head.json.gz','spaces.part-31.json.gz','spaces.part-head.json.gz'];
const keep=['index.html','community.json','discovery.json','growth.json','catalog-health.json','spaces-guide.html','trendshift.json','project-pages.json'];
for(const name of [...secret,...keep])await writeFile(join(dir,name),'x');
const removed=await prune(pathToFileURL(dir+'/'));
assert.deepEqual(removed,[...secret].sort(),'every private catalogue file and shard is removed');
assert.deepEqual((await readdir(dir)).sort(),[...keep].sort(),'public files, including look-alike names, are kept');
assert.deepEqual(await prune(pathToFileURL(dir+'/')),[],'running it again is harmless');
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
assert.match(config.buildCommand,/npm run build && node scripts\/prune-public-data\.mjs$/,'the production build removes the private files last');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
assert.doesNotMatch(pkg.scripts.build,/prune-public-data/,'the CI build keeps them, because later checks read them');
console.log('PASS: the production build publishes none of the complete catalogue files, and keeps every public data file.');
