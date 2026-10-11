import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
// Fonts are served from this site, so no page contacts a font provider and nothing blocks first paint on a third party.
const dist=new URL('../dist/',import.meta.url),pages=(await readdir(dist)).filter(n=>n.endsWith('.html')),css=await readFile(new URL('fonts.css',dist),'utf8');
let linked=0;
for(const name of pages){const html=await readFile(new URL(name,dist),'utf8');assert(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html),name+' must not contact a font provider');
 if(html.includes('/fonts.css')){linked++;for(const m of html.matchAll(/<link rel="preload" href="(\/fonts\/[^"]+)" as="font" type="font\/woff2" crossorigin>/g))await readFile(new URL('.'+m[1],dist))}}
assert(linked>=11,'every page that sets text in DM Sans or Manrope links the self-hosted stylesheet ('+linked+')');
const faces=[...css.matchAll(/@font-face\{font-family:'([^']+)'[^}]*font-display:swap;src:url\((\/fonts\/[^)]+\.woff2)\) format\('woff2'\);unicode-range:([^}]+)\}/g)];
assert(faces.length>=8,'DM Sans and Manrope subsets are declared ('+faces.length+')');assert(new Set(faces.map(f=>f[1])).size===2);
for(const [,family,src,range] of faces){assert(range.includes('U+'));const bytes=await readFile(new URL('.'+src,dist));assert.equal(bytes.subarray(0,4).toString(),'wOF2',src+' is a woff2 file');assert(bytes.length>1000)}
assert(!/fonts\.googleapis|fonts\.gstatic/.test(css));
const license=await readFile(new URL('fonts/LICENSE.txt',dist),'utf8');assert(/SIL Open Font License/.test(license)&&/DM Sans/.test(license)&&/Manrope/.test(license));
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8')),rule=config.headers.find(h=>h.source==='/fonts/(.*)');assert.equal(rule?.headers.find(h=>h.key==='Cache-Control')?.value,'public, max-age=31536000, immutable','font files are cached for a year; their names carry the version');
console.log(`PASS: ${linked} pages use ${faces.length} self-hosted font subsets with valid woff2 files, licences and long caching, and none contacts a font provider.`);
