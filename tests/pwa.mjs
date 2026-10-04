import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const listeners={},requests=[],origin='https://reposhelf.example';
const context={self:{location:{origin},addEventListener:(name,handler)=>listeners[name]=handler},URL,Response,fetch:async request=>{requests.push(request);throw Error('offline')},caches:{match:async()=>new Response('Offline screen')}};
vm.runInNewContext(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),context);
async function dispatch(path,options={}){let response;listeners.fetch({request:{url:origin+path,method:'GET',mode:'navigate',...options},respondWith:value=>{response=value}});return response&&await response}
for(const path of ['/api/auth','/api/collection','/api/analytics','/api/open?url=https://github.com','/?code=private-code','/?error=access_denied'])assert.equal(await dispatch(path),undefined,'Sensitive endpoints must bypass the worker');
assert.equal(await dispatch('/',{method:'POST'}),undefined);
assert.equal(await dispatch('/',{url:'https://external.example/'}),undefined);
assert.equal(await (await dispatch('/?project=org%2Frepo')).text(),'Offline screen');
assert.equal(requests.length,1,'Public navigation tries the network before offline fallback');
const manifest=JSON.parse(await readFile(new URL('../dist/manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');assert(manifest.icons.some(icon=>icon.purpose==='maskable'));
console.log('PASS: PWA identity, maskable icons, network-first navigation and OAuth/private API bypass.');
