import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['dist/index.html','dist/style.css','dist/app.js','dist/discovery.js','dist/storefront.js','dist/catalog.json','dist/spaces.json','dist/providers.js','dist/quality.js','dist/community.js'])if(!existsSync(file))throw new Error(`Missing ${file}`);
for(const file of ['dist/app.js','dist/discovery.js','scripts/index-catalog.mjs','scripts/catalog-health.mjs','scripts/serve.mjs','dist/storefront.js','scripts/enrich-catalog.mjs','scripts/capture-previews.mjs','scripts/verify-ui.mjs','dist/providers.js','scripts/source-imports.mjs','scripts/import-sources.mjs','scripts/readme-overviews.mjs','scripts/enrich-overviews.mjs','dist/quality.js','scripts/demo-health.mjs','scripts/check-demo-health.mjs','scripts/project-insights.mjs','scripts/ai-overviews.mjs','scripts/generate-ai-overviews.mjs','scripts/community-sources.mjs','scripts/import-community.mjs','dist/community.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
JSON.parse(readFileSync('dist/catalog.json','utf8'));
const html=readFileSync('dist/index.html','utf8');
for(const path of ['style.css','discovery.js','storefront.js','providers.js','quality.js','community.js','app.js'])if(!html.includes(path))throw new Error(`Missing HTML reference to ${path}`);
JSON.parse(readFileSync('vercel.json','utf8'));
console.log('RepoShelf static build validated. Output: dist/');
