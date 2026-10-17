import assert from 'node:assert/strict';
import {createOpenHandler} from '../api/open.mjs';
import {authReturn} from '../lib/accounts.mjs';
// /api/open must not work as a redirector for phishing: a link that does not come from a RepoShelf page shows where it goes first.
const accounts={config:{origin:'https://www.reposhelf.co.uk'}};
const open=createOpenHandler({accounts});
async function call(url,headers){const req={method:'GET',url,headers};const res={writeHead(status,h){this.status=status;this.headers=h},end(body){this.body=body}};await open(req,res);return res}
const target='https://evil.example/login?next=%22%3E%3Cscript%3E';
const link='/api/open?url='+encodeURIComponent(target);
// from a RepoShelf page: straight through
let r=await call(link,{'sec-fetch-site':'same-origin'});assert.equal(r.status,302);assert.equal(r.headers.Location,new URL(target).href);assert.equal(r.headers['Referrer-Policy'],'no-referrer');
// from an email, a chat, another site, a typed address, or a browser that does not say: the visitor sees the destination first
for(const headers of [{'sec-fetch-site':'cross-site'},{'sec-fetch-site':'same-site'},{'sec-fetch-site':'none'},{},{'referer':'https://www.reposhelf.co.uk/'}]){
 r=await call(link,headers);
 assert.equal(r.status,200,JSON.stringify(headers));assert.equal(r.headers.Location,undefined,'no redirect header');
 assert.match(r.headers['Content-Type'],/text\/html/);assert.equal(r.headers['Cache-Control'],'private, no-store');assert.match(r.headers['X-Robots-Tag'],/noindex/);
 assert.match(r.body,/You are leaving RepoShelf/);assert.match(r.body,/<strong>evil\.example<\/strong>/,'the real host is named');
 assert(!r.body.includes('<script>'),'the address is escaped');assert(r.body.includes('href="https://evil.example/login?next=%22%3E%3Cscript%3E"'),'the continue link is the exact address');assert.match(r.body,/rel="noopener noreferrer nofollow"/);
}
// a host that tries to look like a trusted one is shown as written
r=await call('/api/open?url='+encodeURIComponent('https://github.com.evil.example/team/app'),{});assert.match(r.body,/<strong>github\.com\.evil\.example<\/strong>/);
// unsafe addresses are still refused outright
for(const bad of ['javascript:alert(1)','https://user:pw@example.org/','data:text/html,x','https://'+'a'.repeat(2100)+'.example/']){r=await call('/api/open?url='+encodeURIComponent(bad),{'sec-fetch-site':'same-origin'});assert.equal(r.status,400,bad)}
// after sign-in only links that need an account may be returned to, so this page can never be reached through a sign-in
for(const url of ['https://evil.example/','https://github.com/team/app','https://huggingface.co/spaces/team/app'])assert.equal(authReturn('/api/open?url='+encodeURIComponent(url)),'/',url);
assert.equal(authReturn('/api/open?url='+encodeURIComponent('https://github.com/team/app/fork')),'/api/open?url='+encodeURIComponent('https://github.com/team/app/fork'));
assert.equal(authReturn('/api/open?url='+encodeURIComponent('https://huggingface.co/spaces/team/app?duplicate=true')),'/api/open?url='+encodeURIComponent('https://huggingface.co/spaces/team/app?duplicate=true'));
console.log('PASS: links from outside RepoShelf show the destination before leaving, links from its own pages go straight through, unsafe addresses are refused, and sign-in can only return to fork and duplicate links.');
