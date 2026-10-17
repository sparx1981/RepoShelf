import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Other sites must not be able to frame RepoShelf pages (clickjacking). Pages of the site itself may, because the Studio
// previews its UI components and backgrounds in same-origin frames.
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
const all=Object.fromEntries((config.headers.find(h=>h.source==='/(.*)')?.headers||[]).map(h=>[h.key,h.value]));
assert.equal(all['Content-Security-Policy'],"frame-ancestors 'self'",'every response restricts who may frame it');
assert.equal(all['X-Frame-Options'],'SAMEORIGIN','older browsers get the same rule');
assert.equal(all['X-Content-Type-Options'],'nosniff');
for(const file of ['ui.js','studio.js','prompts.js']){const code=await readFile(new URL('../dist/'+file,import.meta.url),'utf8');assert.doesNotMatch(code,/<iframe[^>]+src="https?:\/\/(?!www\.reposhelf)/,file+' only frames its own pages')}
console.log("PASS: every page refuses to be framed by other sites (frame-ancestors 'self' and X-Frame-Options), while same-site previews still work.");
