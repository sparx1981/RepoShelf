import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
// Workflows run third-party install scripts and sometimes hold a write token, so they install exactly what the lockfile says,
// do not leave the token on disk when they never push, and never paste free-text inputs into a shell command.
const dir=new URL('../.github/workflows/',import.meta.url),files=(await readdir(dir)).filter(n=>n.endsWith('.yml'));
const PUSHERS=['catalog.yml','publication.yml','recovery.yml','submissions.yml','x-intake.yml']; // these call scripts/publish-catalog.mjs, which pushes
for(const name of files){
 const text=await readFile(new URL(name,dir),'utf8');
 assert.doesNotMatch(text,/--package-lock=false\s*$|npm install --package-lock=false/m,name+' installs from the lockfile (npm ci)');
 for(const m of text.matchAll(/npm (?:ci|install)[^\n]*/g))if(/\bci\b|--no-save/.test(m[0]))assert.match(m[0],/--ignore-scripts/,name+': '+m[0]+' must not run install scripts');
 assert.doesNotMatch(text,/run:[^\n]*\$\{\{\s*inputs\./,name+' pastes a workflow input into a command line; pass it through env: instead');
 const readOnly=/permissions:\s*\n\s*contents: read/.test(text)&&!PUSHERS.includes(name);
 if(readOnly)for(const m of text.matchAll(/- uses: actions\/checkout@v4\n((?:\s+(?:with|[a-z-]+):[^\n]*\n)*)/g))assert.match(m[0],/persist-credentials: false/,name+': a read-only workflow keeps no token on disk');
}
assert(files.length>=10,'the workflows were found');
const catalog=await readFile(new URL('catalog.yml',dir),'utf8');
const browser=catalog.slice(catalog.indexOf('  browser:'),catalog.indexOf('  refresh:'));assert.match(browser,/persist-credentials: false/,'the browser shards never push, so they keep no token');
// When the catalogue tests or build fail, nothing may change or hand off data; the failure itself is still recorded.
const prepare=catalog.slice(catalog.indexOf('  prepare:'),catalog.indexOf('  browser:')),stepsOf=prepare.split(/\n(?=      - )/);
const step=id=>stepsOf.find(t=>new RegExp('\\n        id: '+id+'(\\n|$)').test(t))||assert.fail('step '+id+' exists');
for(const id of ['taxonomy','growth_checkpoint','browser_cycle','handoff'])assert.match(step(id),/if: always\(\) && steps\.baseline\.outcome == 'success' && steps\.validate\.outcome == 'success'/,id+' needs the catalogue tests to have passed');
assert.doesNotMatch(step('checkpoint_report'),/steps\.validate/,'the failure is still written to the sync report');
for(const name of PUSHERS){const text=await readFile(new URL(name,dir),'utf8');assert.match(text,/publish-catalog\.mjs/,name+' is a pushing workflow')}
console.log(`PASS: ${files.length} workflows install from the lockfile without install scripts, read-only jobs keep no token, and no free-text input reaches a shell command.`);
