import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recoveryDecision, recoverSync} from '../scripts/sync-watchdog.mjs';

const now = Date.parse('2026-10-04T20:00:00Z');
const ago = hours => new Date(now - hours * 3600000).toISOString();
const success = {id: 1, status: 'completed', conclusion: 'success', updated_at: ago(4)};
const failed = {id: 2, status: 'completed', conclusion: 'failure', updated_at: ago(1)};

assert.equal(recoveryDecision([success], now).action, 'dispatch');
assert.equal(recoveryDecision([{...success, updated_at: ago(3)}], now).action, 'wait');
assert.equal(recoveryDecision([{...success, updated_at: ago(2)}], now).action, 'wait');
for (const status of ['queued', 'in_progress', 'waiting', 'requested', 'pending'])
  assert.equal(recoveryDecision([success, {id: 3, status}], now).activeRunId, 3);
assert.equal(recoveryDecision([success, failed], now).action, 'dispatch');
assert.equal(recoveryDecision([failed, {...success, updated_at: ago(0.5)}], now).action, 'wait', 'History order does not change freshness');
assert.equal(recoveryDecision([{...failed, updated_at: ago(4)}], now).action, 'dispatch');
assert.equal(recoveryDecision([], now).action, 'dispatch');
assert.throws(() => recoveryDecision(null, now));

assert.equal(recoveryDecision([success, {...failed, updated_at: ago(0.49)}], now).action, 'wait');
assert.equal(recoveryDecision([success, {...failed, updated_at: ago(0.5)}], now).action, 'dispatch');
assert.equal(recoveryDecision([{...success, updated_at: ago(2)}, failed], now).action, 'dispatch', 'A newer failure is retried even after a recent success');
for (const [count, hours] of [[2, 1], [3, 2], [4, 3], [8, 3]]) {
  const failures = Array.from({length: count}, (_, index) => ({...failed, id: 20 + index, updated_at: ago(hours - 0.01 + index * 0.01)}));
  assert.equal(recoveryDecision(failures, now).action, 'wait');
  assert.equal(recoveryDecision(failures, now + 60000).action, 'dispatch');
}
assert.equal(recoveryDecision([{...failed, conclusion: 'cancelled'}], now).action, 'wait');

let reads = 0, posts = 0, runHistory = [success], secondHistory = null;
const fetcher = async (url, options = {}) => {
  assert.equal(options.redirect, 'error');
  if (options.method === 'POST') {
    posts++;
    assert(url.endsWith('/catalog.yml/dispatches'));
    assert.deepEqual(JSON.parse(options.body), {ref: 'main', inputs: {refresh_previews: false, watchdog_recovery: true}});
    return new Response(null, {status: 204});
  }
  reads++;
  return Response.json({workflow_runs: reads === 2 && secondHistory ? secondHistory : runHistory});
};
assert.equal((await recoverSync({fetcher, token: 'fixture', now})).action, 'requested');
assert.equal(posts, 1); assert.equal(reads, 2);
reads = 0; posts = 0; secondHistory = [success, {id: 3, status: 'queued'}];
assert.equal((await recoverSync({fetcher, token: 'fixture', now})).action, 'wait');
assert.equal(posts, 0, 'A run arriving between checks prevents dispatch');
reads = 0; secondHistory = null; runHistory = [success, failed];
runHistory = [success, {...failed, updated_at: ago(0.25)}];
await recoverSync({fetcher, token: 'fixture', now}); assert.equal(posts, 0);
for (const response of [new Response(null, {status: 403}), Response.json({})]) {
  await assert.rejects(recoverSync({token: 'fixture', now, fetcher: async (_url, options) => {
    assert.notEqual(options.method, 'POST'); return response;
  }}));
}
let dispatches = 0;
await assert.rejects(recoverSync({token: 'fixture', now, fetcher: async (_url, options) => {
  if (options.method === 'POST') {dispatches++; throw Error('Timeout after acceptance');}
  return Response.json({workflow_runs: [success]});
}}));
assert.equal(dispatches, 1, 'Ambiguous dispatch errors are never retried blindly');
await assert.rejects(recoverSync({token: '', now, fetcher}), /token/);
const health = await readFile(new URL('../.github/workflows/health.yml', import.meta.url), 'utf8');
const catalog = await readFile(new URL('../.github/workflows/catalog.yml', import.meta.url), 'utf8');
assert(health.includes("cron: '13,43 * * * *'"));
assert(health.includes('actions: write'));
assert(health.includes('cancel-in-progress: false'));
assert(catalog.includes('watchdog_recovery:') && catalog.includes('WATCHDOG_RECOVERY:'));
console.log('PASS: overdue recovery, grace period, queued/running guards, cooldown, race recheck, fail-closed history, single dispatch and workflow configuration.');
