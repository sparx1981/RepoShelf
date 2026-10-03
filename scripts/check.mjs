import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['dist/index.html','dist/style.css','dist/app.js'])if(!existsSync(file))throw new Error(`Missing ${file}`);
execFileSync(process.execPath,['--check','dist/app.js'],{stdio:'inherit'});
const html=readFileSync('dist/index.html','utf8');
for(const path of ['style.css','app.js'])if(!html.includes(path))throw new Error(`Missing HTML reference to ${path}`);
JSON.parse(readFileSync('vercel.json','utf8'));
console.log('RepoShelf static build validated. Output: dist/');
