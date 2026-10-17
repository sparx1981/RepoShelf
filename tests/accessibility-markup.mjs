import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
// Scrollable regions must be reachable by keyboard and named, and each page has one top-level heading.
const connect=await read('connect.html'),cookies=await read('cookies.html'),studio=await read('studio.html');
for(const tag of connect.match(/<pre\b[^>]*>/g)||[])assert(/tabindex="0"/.test(tag),'every code block on the connect page is focusable: '+tag);
const wrappers=cookies.match(/<div class="legal-table-wrap"[^>]*>/g)||[];
assert(wrappers.length>=3,'the cookie tables are wrapped');
for(const tag of wrappers)assert(/tabindex="0"/.test(tag)&&/role="region"/.test(tag)&&/aria-label="[^"]+"/.test(tag),'scrollable table wrapper is a named, focusable region: '+tag);
assert.equal((studio.match(/<h1\b(?![^>]*role="presentation")/g)||[]).length,1,'studio.html has a single h1 (the animated headline is presentational)');
console.log('PASS: scrollable code blocks and tables are keyboard reachable and named, and Studio has one top-level heading.');
