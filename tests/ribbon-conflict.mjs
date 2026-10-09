import assert from 'node:assert/strict';
import {createAccounts} from '../lib/accounts.mjs';
// Ribbon edit conflicts are raised as PT409 (HTTP 409) so Postgres and PostgREST never treat them as retryable
// serialization failures. They must still read as an edit conflict, not as a protected-administrator error.
let code='PT409';
const accounts=createAccounts({legal:{active:false},config:{origin:'https://reposhelf.test',url:'https://fixture.supabase.co',key:'public-test-key',serviceKey:'private-service-secret'},fetcher:async()=>Response.json({code,message:'Ribbon changed'},{status:409})});
for(const fn of ['reposhelf_save_ribbon','reposhelf_delete_ribbon','reposhelf_reorder_ribbons'])
 await assert.rejects(accounts.request('/rest/v1/rpc/'+fn,{token:'admin',method:'POST',body:{}}),{status:409,code:'edit_conflict'});
await assert.rejects(accounts.request('/rest/v1/rpc/reposhelf_set_admin',{token:'admin',method:'POST',body:{}}),{status:409,code:'protected_admin'});
code='40001';
await assert.rejects(accounts.request('/rest/v1/rpc/reposhelf_save_ribbon',{token:'admin',method:'POST',body:{}}),{status:409,code:'edit_conflict'});
console.log('PASS: ribbon conflicts map to edit_conflict for PT409 and 40001; PT409 stays protected_admin elsewhere.');
