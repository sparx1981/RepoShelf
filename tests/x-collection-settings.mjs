import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createEditorialHandler} from '../api/editorial.mjs';
let allowed=true,missing=false,calls=[],settings={enabled:false,revision:1,updated_at:'2026-10-08T00:00:00Z'};
const accounts={config:{origin:'https://reposhelf.test'},ready:true,
  origin(req){if(req.headers.origin!==this.config.origin)throw Object.assign(Error('Wrong origin'),{status:403});},
  async admin(){if(!allowed)throw Object.assign(Error('Admin required'),{status:403});return {token:'private'};},
  async request(path,options){calls.push({path,options});if(missing)throw Object.assign(Error('Migration required'),{status:503,code:'migration_required'});
    if(path.includes('/rpc/reposhelf_x_collection_settings')){assert.equal(options.token,'private');if(options.body.expected_revision!==settings.revision)throw Object.assign(Error('Changed'),{status:409});settings={...settings,enabled:options.body.scanning_enabled,revision:settings.revision+1};return settings;}return [settings];}
};
const handler=createEditorialHandler({accounts});
async function call(action='x-settings',{method='GET',body,origin=accounts.config.origin}={}){const req=Readable.from(body?[JSON.stringify(body)]:[]);Object.assign(req,{method,url:'/api/editorial?action='+action,headers:{origin}});let result;await handler(req,{writeHead(status,headers){result={status,headers};},end(body){result.data=JSON.parse(body);}});return result;}
allowed=false;assert.equal((await call()).status,403);let r=await call('x-status');assert.deepEqual(r.data,{enabled:false,ready:true});assert.equal(calls.at(-1).options.service,true);assert(!JSON.stringify(r.data).includes('revision'));assert.equal(r.headers['Cache-Control'],'private, no-store');
assert.equal((await call('x-status',{method:'POST',body:{enabled:true}})).status,405);
allowed=true;assert.equal((await call(undefined,{method:'POST',origin:'https://evil.test',body:{enabled:true,revision:1}})).status,403);
assert.equal((await call(undefined,{method:'POST',body:{enabled:'true',revision:1}})).status,400);
r=await call(undefined,{method:'POST',body:{enabled:true,revision:1}});assert.equal(r.data.settings.enabled,true);assert.equal((await call('x-status')).data.enabled,true);
assert.equal((await call(undefined,{method:'POST',body:{enabled:false,revision:1}})).status,409);
assert.equal((await call(undefined,{method:'POST',body:{enabled:false,revision:2}})).data.settings.enabled,false);
missing=true;assert.deepEqual((await call('x-status')).data,{enabled:false,ready:false});assert.equal((await call()).status,503);
console.log('PASS: administrator-only scanning writes, origin protection, conflict checks, minimal public status, no caching and disabled missing-migration fallback.');
