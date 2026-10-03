import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {extractOverview,withOverview,readOverviewReadme} from '../scripts/readme-overviews.mjs';

const intro='Canvas helps people turn their ideas into clear diagrams and share them with a team.';
const second='Draw together in your browser, organise plans visually, and export your finished work.';
const markdown=`---\ntitle: Canvas\nsdk: gradio\n---\n# Canvas\n\n[![Build](https://shields.io/badge/build)](https://github.com/org/app)\n\n${intro}\n\n${second}\n\n## ✨ Features\n- **Real-time collaboration** with people across your team.\n- Export your diagrams as images to use in presentations.\n\n## 🚀 Installation\nFollow these installation instructions to set up the development environment on your computer.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## License\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software.\n`;
const extracted=extractOverview(markdown);assert.deepEqual(extracted.paragraphs,[intro,second]);assert.equal(extracted.features.length,2);assert(!JSON.stringify(extracted).includes('npm'));assert(!JSON.stringify(extracted).includes('Permission'));
assert.deepEqual(extractOverview('---\ntitle: Demo\n---\n![badge](https://badge.io)\n## Installation\n\nRun npm install to install all packages, and then start the development server.\n\n```sh\ngit clone https://github.com/org/app\n```'),{paragraphs:[],features:[]});
const html=extractOverview(`<h1>Canvas</h1><p>${intro}</p><script>alert('bad');</script><p>${second}</p>`);assert.deepEqual(html.paragraphs,[intro,second]);
const wrapped=extractOverview('# Canvas\n\nCanvas helps people turn their ideas\ninto clear diagrams and share them with a team.');assert.equal(wrapped.paragraphs[0],intro);
const duplicate=extractOverview(`# Canvas\n\n${intro}\n\n## About\n${intro}`);assert.equal(duplicate.paragraphs.length,1);
const long=extractOverview('# Canvas\n\n'+'A useful visual planning application for sharing ideas with teams. '.repeat(50));assert(long.paragraphs[0].length<=601);assert(long.paragraphs[0].endsWith('…'));
const url='https://github.com/org/app/blob/main/README.md';const first=withOverview({},markdown,url,1000),same=withOverview(first,markdown,url,2000);assert.equal(first.overview.extractedAt,same.overview.extractedAt);assert.notEqual(first.overviewCheckedAt,same.overviewCheckedAt);assert.equal(withOverview(first,'# Canvas\n\nNo details.',url).overview,null);assert.notEqual(withOverview(first,markdown+'\nnew source text',url,3000).overview.fingerprint,first.overview.fingerprint);
const requests=[];const result=await readOverviewReadme({full:'org/app',branch:'feature/readme'},{fetcher:async(url,opts)=>{requests.push({url,headers:opts.headers});return url.endsWith('/README.md')?new Response('{}',{status:404}):new Response(markdown)}});assert.equal(result.sourceUrl,'https://github.com/org/app/blob/feature%2Freadme/readme.md');assert.equal(requests.length,2);assert.equal(requests[0].headers,undefined);

const root=await mkdtemp(path.join(tmpdir(),'reposhelf-overviews-'));const originalFetch=globalThis.fetch;const env={OVERVIEW_GITHUB_BATCH:process.env.OVERVIEW_GITHUB_BATCH,OVERVIEW_SPACE_BATCH:process.env.OVERVIEW_SPACE_BATCH};
try{
  await mkdir(path.join(root,'dist'));await mkdir(path.join(root,'scripts'));
  for(const file of ['dist/providers.js','scripts/enrich-overviews.mjs','scripts/readme-overviews.mjs','scripts/project-insights.mjs'])await copyFile(new URL('../'+file,import.meta.url),path.join(root,file));
  const saved={full:'org/temporary',name:'Temporary',updated:'2026-01-01',...first};
  await writeFile(path.join(root,'dist/catalog.json'),JSON.stringify({repositories:[saved,{full:'org/new',name:'New',stars:10,updated:'2026-02-01'},{full:'org/gone',availability:'unavailable'}]}));
  await writeFile(path.join(root,'dist/spaces.json'),JSON.stringify({repositories:[{full:'hf:org/demo',spaceId:'org/demo',source:'huggingface',name:'Demo',likes:2,updated:'2026-02-01'}]}));
  const calls=[];globalThis.fetch=async url=>{calls.push(url);assert(!url.includes('org/gone'));return url.includes('/org/temporary/')?new Response('{}',{status:503}):new Response(markdown)};
  process.env.OVERVIEW_GITHUB_BATCH='5';process.env.OVERVIEW_SPACE_BATCH='5';await import(pathToFileURL(path.join(root,'scripts/enrich-overviews.mjs')));
  const github=JSON.parse(await readFile(path.join(root,'dist/catalog.json'),'utf8')).repositories;
  assert.deepEqual(github[0].overview,saved.overview);assert.equal(github[0].overviewError.kind,'temporary');assert(github[0].overviewAttemptAt);assert.equal(github[1].overview.paragraphs.length,2);assert.equal(github[1].overviewRepoUpdated,'2026-02-01');
  const space=JSON.parse(await readFile(path.join(root,'dist/spaces.json'),'utf8')).repositories[0];assert.equal(space.overview.sourceUrl,'https://huggingface.co/spaces/org/demo/blob/main/README.md');assert.equal(space.overview.kind,'readme');assert.equal(calls.length,3);
}finally{globalThis.fetch=originalFetch;for(const [key,value]of Object.entries(env)){if(value===undefined)delete process.env[key];else process.env[key]=value}await rm(root,{recursive:true,force:true})}
console.log('PASS: author overviews exclude setup, badges and code; preserve wording, provenance and fingerprints; enrich both providers and retain saved text on temporary failures.');

const actualLike=extractOverview('## Getting Started\n\nActual is a local-first personal finance tool, keeping budgets in sync between your devices.\n\nIf you are interested in contributing, please see our guide.\n\n## Contributing\n\n### Feature Requests\nCurrent feature requests can be seen here and voted on by our community.\n\n### Translation\nMake the project accessible by helping to translate it into many languages.');assert.deepEqual(actualLike.paragraphs,['Actual is a local-first personal finance tool, keeping budgets in sync between your devices.']);assert.equal(actualLike.features.length,0);
const htmlHeading=extractOverview('<h4>Editor | Blog | Documentation | Product news | Social accounts</h4>\n<h2>An open source virtual hand-drawn style whiteboard. Collaborative and end-to-end encrypted.</h2>\n<p>Create beautiful diagrams, wireframes, or whatever you like in your web browser.</p>');assert.equal(htmlHeading.paragraphs.length,2);assert(!JSON.stringify(htmlHeading).includes('Product news'));
