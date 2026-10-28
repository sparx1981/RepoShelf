import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NOT_FOUND_HTML} from '../lib/not-found-page.mjs';
import {createSEORouteHandler,NOT_FOUND_CACHE} from '../lib/seo-routing.mjs';
// Unknown addresses get a branded page with a way back, not a bare "Not found". The static dist/404.html (served by Vercel for any
// unknown path) and the project-page router's 404 are the same document, and neither is indexable.
assert.equal(await readFile(new URL('../dist/404.html',import.meta.url),'utf8'),NOT_FOUND_HTML,'dist/404.html matches lib/not-found-page.mjs');
assert(/<title>[^<]+<\/title>/.test(NOT_FOUND_HTML)&&NOT_FOUND_HTML.includes('name="robots" content="noindex"')&&NOT_FOUND_HTML.includes('href="/"'),'the page has a title, is noindex and links home');
const respond=async(url,load)=>{const handler=createSEORouteHandler({load}),out={};await handler({method:'GET',url},{writeHead:(status,headers)=>Object.assign(out,{status,headers}),end:body=>{out.body=body}});return out};
for(const [label,url,load] of [['an invalid path','/api/seo?path=/nope',async()=>({redirects:{}})],['a project with no redirect','/api/seo?path=/projects/github/a/b.html',async()=>({redirects:{}})]]){
 const out=await respond(url,load);
 assert.equal(out.status,404,label+' is a 404');assert.equal(out.body,NOT_FOUND_HTML,label+' shows the branded page');
 assert(/text\/html/.test(out.headers['Content-Type'])&&out.headers['X-Robots-Tag']==='noindex'&&out.headers['Cache-Control']===NOT_FOUND_CACHE,label+' is HTML, noindex and CDN-cacheable for a short time');assert(/s-maxage=\d+/.test(out.headers['Cache-Control'])&&/max-age=0/.test(out.headers['Cache-Control']),label+' is cached by the CDN but revalidated by browsers');
}
console.log('PASS: unknown addresses show the branded, noindex 404 page, and dist/404.html stays in step with it.');
