import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {importListCandidate} from './source-imports.mjs';
import {applyListingControls, savedListingControls} from '../lib/listing-policy.mjs';
import {importXCandidates} from './x-imports.mjs';

const source = 'sparx1981/reposhelf-x-collector';
const headers = {Accept: 'application/vnd.github+json', 'User-Agent': 'RepoShelf-X-Intake', ...(process.env.GITHUB_TOKEN ? {Authorization: 'Bearer ' + process.env.GITHUB_TOKEN} : {})};
const ref = await fetch(`https://api.github.com/repos/${source}/git/ref/heads/collector-state`, {headers, redirect: 'error', signal: AbortSignal.timeout(15000)});
if (ref.status === 404) { console.log('X collector has no saved candidates yet.'); process.exit(0); }
if (!ref.ok) throw Error('X collector checkpoint unavailable');
const revision = (await ref.json()).object?.sha;
if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Invalid X collector revision');
const base = `https://raw.githubusercontent.com/${source}/${revision}/`;
async function resource(path, limit) {
  const response = await fetch(base + path, {redirect: 'error', signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('Collector resource unavailable');
  if (Number(response.headers.get('content-length')) > limit) throw Error('Collector resource too large');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try { while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > limit) throw Error('Collector resource too large'); chunks.push(value); } } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}
const manifest = JSON.parse((await resource('approved.json', 20 * 1024 * 1024)).toString());
const catalogFile = new URL('../dist/catalog.json', import.meta.url);
const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
const moderation = await savedListingControls();
let offset=0;
try{const prior=JSON.parse(await readFile(new URL('../data/x-intake.json',import.meta.url),'utf8'));if(Number.isSafeInteger(prior.nextOffset)&&prior.nextOffset>=0)offset=prior.nextOffset}catch(e){if(e.code!=='ENOENT')throw e}
const result = await importXCandidates(manifest, catalog, {
  offset,
  controls: entries => applyListingControls(entries, moderation),
  importer: (full, provenance, prior) => importListCandidate(full, provenance, prior, {headers, requireDemo: true}),
  capture: async path => {
    if (!/^previews\/[a-f0-9]{24}\.jpg$/.test(path)) throw Error('Invalid collector screenshot path');
    const bytes = await resource(path, 2 * 1024 * 1024);
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) throw Error('Invalid JPEG screenshot');
    await mkdir(new URL('../dist/previews/', import.meta.url), {recursive: true});
    await writeFile(new URL('../dist/' + path, import.meta.url), bytes);
  }
});
await writeFile(catalogFile, JSON.stringify(result.catalog, null, 2) + '\n');
await mkdir(new URL('../data/', import.meta.url), {recursive: true});
await writeFile(new URL('../data/x-intake.json', import.meta.url), JSON.stringify({revision, nextOffset:result.nextOffset, checkedAt: new Date().toISOString(), results: result.results}) + '\n');
console.log(`X intake: ${result.results.filter(r => r.status === 'imported').length} imported or updated; ${result.results.filter(r => r.status !== 'imported').length} held.`);
