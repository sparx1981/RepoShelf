import assert from 'node:assert/strict';
import {detailResponse,STOREFRONT_TAG,DETAIL_MAX_AGE} from '../lib/storefront-cache.mjs';
// A deep-link detail record is the same for everyone, so it is shared at the edge for a few minutes and purged with the shelves.
const out={};detailResponse({writeHead:(status,headers)=>Object.assign(out,{status,headers}),end:body=>{out.body=body}},{repo:{full:'a/b'}});
assert.equal(out.status,200);assert.deepEqual(JSON.parse(out.body),{repo:{full:'a/b'}});
assert.match(out.headers['Cache-Control'],/^public, max-age=0, s-maxage=\d+, stale-while-revalidate=\d+$/);
assert(DETAIL_MAX_AGE>0&&DETAIL_MAX_AGE<=600,'cached briefly');
assert.equal(out.headers['Vercel-Cache-Tag'],STOREFRONT_TAG,'purged with the storefront shelves');
console.log('PASS: project detail responses are cached briefly at the edge and carry the storefront purge tag.');
