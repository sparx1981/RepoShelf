import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recoveryDecision, recoverSync, graceMs, cooldownMs, failedRetryMs, maxConsecutiveFailures} from '../scripts/sync-watchdog.mjs';

const now = Date.parse('2026-10-08T20:00:00Z');
const ago = hours => new Date(now - hours * 3600000).toISOString();
const DAY = 24;
const success = {id: 1, status: 'completed', conclusion: 'success', updated_at: ago(2 * DAY)};
const failed = {id: 2, status: 'completed', conclusion: 'failure', updated_at: ago(1)};

assert.equal(graceMs, 5 * 86400000); assert.equal(cooldownMs, 86400000); assert.equal(failedRetryMs, 6 * 3600000); assert.equal(maxConsecutiveFailures, 3);
assert.equal(recoveryDecision([success], now).action, 'wait', 'A sync two days ago is on schedule for a twice-weekly rhythm');
assert.equal(recoveryDecision([{...success, updated_at: ago(4 * DAY)}], now).action, 'wait', 'The longest scheduled gap (Thursday to Monday) is not overdue');
assert.equal(recoveryDecision([{...success, updated_at: ago(5 * DAY + 0.01)}], now).action, 'dispatch', 'A sync that started over five days ago is due');
assert.equal(recoveryDecision([{...success, updated_at: ago(5 * DAY)}], now).action, 'wait');
assert.equal(recoveryDecision([{...success, run_started_at: ago(5 * DAY + 3), updated_at: ago(5 * DAY - 2)}], now).action, 'dispatch', 'The rhythm counts from the start of the last run, not its finish');
assert.equal(recoveryDecision([{...success, run_started_at: ago(4.9 * DAY), updated_at: ago(4.8 * DAY)}], now).action, 'wait');
for (const status of ['queued', 'in_progress', 'waiting', 'requested', 'pending'])
  assert.equal(recoveryDecision([success, {id: 3, status}], now).activeRunId, 3);
assert.equal(recoveryDecision([{...success, updated_at: ago(2 * DAY)}, {...failed, updated_at: ago(7)}], now).action, 'dispatch', 'A failed run is retried once its backoff has passed');
assert.equal(recoveryDecision([failed, {...success, updated_at: ago(0.5)}], now).action, 'wait', 'History order does not change freshness');
assert.equal(recoveryDecision([{...failed, updated_at: ago(7)}], now).action, 'dispatch');
assert.equal(recoveryDecision([], now).action, 'dispatch');
assert.throws(() => recoveryDecision(null, now));

assert.equal(recoveryDecision([success, {...failed, updated_at: ago(5.9)}], now).action, 'wait', 'The first retry waits six hours');
assert.equal(recoveryDecision([success, {...failed, updated_at: ago(6)}], now).action, 'dispatch');
assert.equal(recoveryDecision([{...success, updated_at: ago(2 * DAY)}, failed], now).action, 'wait', 'A failure an hour ago is within its backoff even after a recent success');
// Backoff doubles (6h, 12h) and is capped at the one-day cooldown; the third failure in a row stops automatic recovery.
for (const [count, hours] of [[2, 12]]) {
  const failures = Array.from({length: count}, (_, index) => ({...failed, id: 20 + index, updated_at: ago(hours - 0.01 + index * 0.01)}));
  assert.equal(recoveryDecision(failures, now).action, 'wait');
  assert.equal(recoveryDecision(failures, now + 60000).action, 'dispatch');
}
for (const count of [3, 4, 8]) {
  const failures = Array.from({length: count}, (_, index) => ({...failed, id: 40 + index, updated_at: ago(30 + index)}));
  const decision = recoveryDecision(failures, now);
  assert.equal(decision.action, 'wait', 'Retries stop after three failures in a row');
  assert.equal(decision.consecutiveFailures, count); assert.match(decision.reason, /retries are used up/);
}
assert.equal(recoveryDecision([{...failed, conclusion: 'cancelled'}], now).action, 'wait');

const overdue = {...success, updated_at: ago(6 * DAY)};
let reads = 0, posts = 0, runHistory = [overdue], secondHistory = null;
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
reads = 0; posts = 0; secondHistory = [overdue, {id: 3, status: 'queued'}];
assert.equal((await recoverSync({fetcher, token: 'fixture', now})).action, 'wait');
assert.equal(posts, 0, 'A run arriving between checks prevents dispatch');
reads = 0; secondHistory = null; runHistory = [overdue, {...failed, updated_at: ago(0.25)}];
await recoverSync({fetcher, token: 'fixture', now}); assert.equal(posts, 0);
for (const response of [new Response(null, {status: 403}), Response.json({})]) {
  await assert.rejects(recoverSync({token: 'fixture', now, fetcher: async (_url, options) => {
    assert.notEqual(options.method, 'POST'); return response;
  }}));
}
let dispatches = 0;
await assert.rejects(recoverSync({token: 'fixture', now, fetcher: async (_url, options) => {
  if (options.method === 'POST') {dispatches++; throw Error('Timeout after acceptance');}
  return Response.json({workflow_runs: [overdue]});
}}));
assert.equal(dispatches, 1, 'Ambiguous dispatch errors are never retried blindly');
await assert.rejects(recoverSync({token: '', now, fetcher}), /token/);
const health = await readFile(new URL('../.github/workflows/health.yml', import.meta.url), 'utf8');
const catalog = await readFile(new URL('../.github/workflows/catalog.yml', import.meta.url), 'utf8');
assert(health.includes("cron: '13 */3 * * *'"));
assert(health.includes('actions: write'));
assert(health.includes('cancel-in-progress: false'));
assert(catalog.includes('watchdog_recovery:') && catalog.includes('WATCHDOG_RECOVERY:'));
console.log('PASS: overdue recovery, grace period, queued/running guards, cooldown, race recheck, fail-closed history, single dispatch and workflow configuration.');
