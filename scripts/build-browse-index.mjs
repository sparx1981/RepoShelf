import {generateBrowseIndex} from '../lib/browse-index.mjs';
const generated=await generateBrowseIndex();
const {buildSEO}=await import('./build-seo.mjs');
await buildSEO(undefined,{index:generated.index,projects:generated.projects});
const {generateRuntimeData}=await import('./build-runtime-data.mjs');
await generateRuntimeData(undefined,generated);

