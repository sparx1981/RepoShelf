import assert from 'node:assert/strict';
import {createMaintenanceHandler,retryReads} from '../lib/maintenance-handler.mjs';

const KEY = 'k'.repeat(40), hour = 3600000;
const at = iso => () => Date.parse(iso);
const call = async (handler, {method = 'POST', auth = 'Bearer ' + KEY} = {}) => {
  const res = {writeHead(status) {this.status = status}, end(body) {this.data = JSON.parse(body)}};
  await handler({method, headers: {authorization: auth}, url: '/api/maintenance'}, res);
  return res;
};
const noon = '2026-10-07T03:00:00Z', later = '2026-10-07T07:00:00Z';
const oldSuccess = (time) => ({id: 1, status: 'completed', conclusion: 'success', run_started_at: new Date(Date.parse(time) - 3 * hour).toISOString(), created_at: new Date(Date.parse(time) - 3 * hour).toISOString(), updated_at: new Date(Date.parse(time) - 2 * hour).toISOString()});

function github({time, failFirstReads = 0, state = {}} = {}) {
  const log = {reads: 0, posts: 0, failures: 0};
  const fetcher = retryReads(async (url, options = {}) => {
    if (options.method === 'POST') {log.posts++; return new Response(null, {status: 204})}
    log.reads++;
    if (log.failures < failFirstReads) {log.failures++; return new Response('', {status: 502})}
    return Response.json({workflow_runs: /catalog\.yml/.test(url) ? [oldSuccess(time)] : []});
  });
  return {log, fetcher};
}
const build = (extra, time = noon, checkpointState = {lastPublishedDate: '2026-10-06'}, checkpointCalls = []) => createMaintenanceHandler({key: KEY, token: 'fixture-token', now: at(time), checkpoint: {json: async (path, timeout) => {checkpointCalls.push(timeout); return typeof checkpointState === 'function' ? checkpointState(checkpointCalls.length) : checkpointState}}, ...extra});

// Configuration and authentication still fail closed.
assert.equal((await call(createMaintenanceHandler({key: '', token: 'x', now: at(noon)}))).data.error.code, 'scheduler_not_configured');
assert.equal((await call(build({fetcher: github({time: noon}).fetcher}), {auth: 'Bearer wrong'})).status, 401);
assert.equal((await call(build({fetcher: github({time: noon}).fetcher}), {method: 'GET'})).status, 405);

// A sync older than two hours is requested.
{const {log, fetcher} = github({time: noon}); const r = await call(build({fetcher})); assert.equal(r.status, 202); assert.equal(log.posts, 1)}

// A briefly failing GitHub read no longer turns the whole check into a 503.
{const {log, fetcher} = github({time: noon, failFirstReads: 1}); const r = await call(build({fetcher})); assert.equal(r.status, 202, 'One 502 on a read is retried'); assert.equal(log.posts, 1)}

// Unavailable publication state does not block catch-up before the daily window...
{const {fetcher} = github({time: noon}); const calls = []; const r = await call(build({fetcher}, noon, null, calls)); assert.equal(r.status, 202); assert.equal(calls.length, 2, 'The state read is attempted twice'); assert(calls.every(t => t === 4000))}
// ...but still fails closed once publication could be due.
{const {log, fetcher} = github({time: later}); const r = await call(build({fetcher}, later, null)); assert.equal(r.status, 503); assert.equal(r.data.error.code, 'publication_state_unavailable'); assert.equal(log.posts, 0)}
// A state read that fails once is retried.
{const {fetcher} = github({time: noon}); const r = await call(build({fetcher}, noon, n => n === 1 ? null : {lastPublishedDate: '2026-10-06'})); assert.equal(r.status, 202)}

// Writes are never retried.
{let posts = 0; const post = retryReads(async (_url, options = {}) => {posts++; throw Error('timeout after acceptance')}); await assert.rejects(post('https://x', {method: 'POST'})); assert.equal(posts, 1)}
// A retried read gets a fresh deadline.
{const signals = []; const flaky = retryReads(async (_url, options) => {signals.push(options.signal); if (signals.length === 1) throw Error('timeout'); return new Response('{}')}); await flaky('https://x', {signal: AbortSignal.timeout(4000)}); assert.notEqual(signals[0], signals[1])}
console.log('PASS: maintenance endpoint retries reads, never retries writes, and only requires publication state inside the daily window.');
