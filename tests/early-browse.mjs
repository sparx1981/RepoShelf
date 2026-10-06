import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
// Top-level keys of an object literal, in order.
function keys(source){const out=[];let depth=0,key='',token='';for(const ch of source){if('{[('.includes(ch))depth++;if('}])'.includes(ch))depth--;if(depth===0&&ch===','){out.push(token.trim());token=''}else token+=ch}out.push(token.trim());return out.map(t=>t.split(':')[0].trim())}
const head=html.match(/<script>\/\*[^]*?<\/script>/)?.[0];assert(head,'index.html starts the default browse request in <head>');
const sent=head.match(/JSON\.stringify\(\{([^]*?)\}\),request=/)?.[1];assert(sent,'Early request body is readable');
const live=app.match(/function browseOptions\(\)\{return \{([^]*?)\}\}\nfunction browseKey/)?.[1];assert(live,'app.js builds browse options in one place');
// app.js reuses the early request only when the serialised bodies are identical, so key order matters.
assert.deepEqual(keys(sent),keys(live),'Early request and app.js send the same keys in the same order');
// Values that must match the start-up state in app.js and the markup.
assert(/let state=\{[^}]*provider:'all',technology:'All technologies',category:'All projects',query:''/.test(app));assert(sent.includes("category:'All projects'")&&sent.includes("technology:'All technologies'")&&sent.includes("source:'all'")&&sent.includes("sort:'popular'")&&sent.includes('limit:48'));
assert(/<option value="popular" selected>/.test(html),'Popular is the selected default sort');assert(app.includes('window.__browseSeed||crypto.randomUUID()'),'app.js and the early request share one seed');
assert(app.includes('early.body===body'),'A request that does not match is never reused');
console.log('PASS: early storefront request stays identical to the request app.js would send, with a shared seed and exact-match reuse.');
