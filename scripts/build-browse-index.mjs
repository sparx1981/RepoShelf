import {generateBrowseIndex} from '../lib/browse-index.mjs';
const generated=await generateBrowseIndex();
const {generateRuntimeData}=await import('./build-runtime-data.mjs');
await generateRuntimeData(undefined,generated);
