import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['dist/index.html','dist/style.css','dist/app.js','dist/discovery.js','dist/catalog.json'])if(!existsSync(file))throw new Error(`Missing ${file}`);
for(const file of ['dist/app.js','dist/discovery.js','scripts/index-catalog.mjs','scripts/catalog-health.mjs','scripts/serve.mjs'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
JSON.parse(readFileSync('dist/catalog.json','utf8'));
const html=readFileSync('dist/index.html','utf8');
for(const path of ['style.css','discovery.js','app.js'])if(!html.includes(path))throw new Error(`Missing HTML reference to ${path}`);
JSON.parse(readFileSync('vercel.json','utf8'));
console.log('RepoShelf static build validated. Output: dist/');
