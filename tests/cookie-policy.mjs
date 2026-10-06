import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url),page=await readFile(new URL('cookies.html',dist),'utf8');
// Every cookie the server can set must be listed (names carry the __Host- prefix over HTTPS).
const accounts=await readFile(new URL('../lib/accounts.mjs',import.meta.url),'utf8'),cookieNames=[...new Set([...accounts.matchAll(/cookie\(res,'([a-z]+)'/g)].map(m=>m[1]))];
assert(cookieNames.length>=5,'cookie names found in lib/accounts.mjs');
for(const name of cookieNames)assert(page.includes('__Host-reposhelf-'+name),`Cookie Policy lists the ${name} cookie`);
// Every browser storage key used by the front end must be listed.
const keys=new Set();for(const file of await readdir(dist))if(file.endsWith('.js')){const text=await readFile(new URL(file,dist),'utf8');for(const m of text.matchAll(/'(reposhelf\.[a-z0-9]+(?:\.[a-z0-9]+)*)'/g))keys.add(m[1])}
assert(keys.size>=8,'storage keys found in the front end');
for(const key of keys)assert(page.includes(key),`Cookie Policy lists the ${key} storage key`);
const sw=await readFile(new URL('sw.js',dist),'utf8'),cache=sw.match(/CACHE='([^']+)'/)[1];assert(page.includes(cache),'Cookie Policy lists the offline cache');
// The policy is reachable and honest about what it does not do.
for(const file of ['index.html','account.html','privacy.html','terms.html','legal.html'])assert((await readFile(new URL(file,dist),'utf8')).includes('/cookies.html'),`${file} links to the Cookie Policy`);
assert(page.includes('Google Fonts'),'third-party fonts are disclosed');assert(/Do Not Track|Global Privacy Control/.test(page));assert(!/\b(advertising cookies are used|we use advertising)\b/i.test(page));
console.log('PASS: Cookie Policy lists every cookie, storage key and cache the application uses, and is linked from the footer and legal pages.');
