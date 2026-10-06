import assert from 'node:assert/strict';import {readdir,readFile} from 'node:fs/promises';
// Vercel's Hobby plan refuses a deployment with more than 12 serverless functions ("No more than 12 Serverless Functions
// can be added to a Deployment"), and the build fails only after the push. New endpoints must share an existing function
// and be exposed through a rewrite in vercel.json.
const HOBBY_LIMIT=12;
const api=(await readdir(new URL('../api/',import.meta.url))).filter(name=>/\.(mjs|js|ts)$/.test(name));
assert(api.length<=HOBBY_LIMIT,`api/ holds ${api.length} functions (${api.join(', ')}); the Hobby plan allows ${HOBBY_LIMIT}. Fold the new endpoint into an existing function and add a rewrite.`);
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
for(const {source,destination} of config.rewrites||[]){const target=destination.match(/^\/api\/([\w-]+)/);if(target)assert(api.includes(target[1]+'.mjs'),`The rewrite ${source} points at /api/${target[1]}, which is not a function`)}
const viewer=(config.rewrites||[]).find(r=>r.source==='/api/viewer');assert.equal(viewer?.destination,'/api/editorial?area=viewer','the demo viewer endpoint is served by the editorial function');
assert.match(await readFile(new URL('../api/editorial.mjs',import.meta.url),'utf8'),/params\.get\('area'\)==='viewer'\)return await viewer\(req,res\)/,'the editorial function hands area=viewer to the viewer handler');
console.log(`PASS: ${api.length} of ${HOBBY_LIMIT} serverless functions, every rewrite targets a real function, and the demo viewer endpoint shares the editorial function.`);
