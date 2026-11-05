import {appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const repository = 'sparx1981/RepoShelf';
const workflow = 'catalog.yml';
// The catalogue sync runs twice a week (Monday and Thursday, so up to four days apart). The rhythm is measured from when runs start,
// not when they finish, so a long run does not stretch the cycle. A missed schedule is recovered once five days have passed.
export const graceMs = 5 * 86400000;
// No more than one automatic recovery a day, and a failed run is retried after 6 hours, then 12, then daily. After three failures in a
// row the watchdog stops: a run that keeps failing needs a person (the health monitor raises an alert) and each attempt moves gigabytes
// of artifacts, so repeating it all week would only burn runner time. The next scheduled run or a manual run starts it again.
export const cooldownMs = 24 * 3600000;
export const failedRetryMs = 6 * 3600000;
export const maxConsecutiveFailures = 3;

export function recoveryDecision(runs, now = Date.now()) {
  if (!Array.isArray(runs)) throw Error('Invalid maintenance run history.');
  const active = runs.find(run => run.status !== 'completed');
  const started = run => Date.parse(run.run_started_at || run.created_at || run.updated_at);
  const successful = runs.filter(run => run.status === 'completed' && run.conclusion === 'success')
    .map(started).filter(Number.isFinite);
  const lastSuccess = successful.length ? Math.max(...successful) : null;
  const attempts = runs.map(run => Date.parse(run.updated_at || run.run_started_at || run.created_at))
    .filter(Number.isFinite);
  const lastAttempt = attempts.length ? Math.max(...attempts) : null;
  const starts = runs.map(started).filter(Number.isFinite);
  const lastStart = starts.length ? Math.max(...starts) : null;
  const details = {
    checkedAt: new Date(now).toISOString(),
    lastSuccessAt: lastSuccess === null ? null : new Date(lastSuccess).toISOString(),
    lastAttemptAt: lastAttempt === null ? null : new Date(lastAttempt).toISOString()
  };
  if (active) return {...details, action: 'wait', reason: 'A catalogue run is running or queued.', activeRunId: active.id};
  const completed = runs.filter(run => run.status === 'completed' && Number.isFinite(Date.parse(run.updated_at)))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  let consecutiveFailures = 0;
  for (const run of completed) {
    if (!['failure', 'timed_out'].includes(run.conclusion)) break;
    consecutiveFailures++;
  }
  if (consecutiveFailures >= maxConsecutiveFailures)
    return {...details, action: 'wait', consecutiveFailures,
      reason: 'Automatic retries are used up after ' + consecutiveFailures + ' failed runs in a row; the next scheduled or manual sync will try again.'};
  if (consecutiveFailures) {
    const retryMs = Math.min(cooldownMs, failedRetryMs * 2 ** Math.min(consecutiveFailures - 1, 3));
    if (now - lastAttempt < retryMs) return {...details, action: 'wait',
      reason: 'A failed sync is within its retry backoff.', consecutiveFailures,
      retryAfter: new Date(lastAttempt + retryMs).toISOString()};
    return {...details, action: 'dispatch', consecutiveFailures,
      reason: 'The latest sync failed, its retry backoff elapsed, and no catalogue run is active.'};
  }
  if (lastSuccess !== null && now - lastSuccess <= graceMs)
    return {...details, action: 'wait', reason: 'A successful sync started within the last five days.'};
  if (lastStart !== null && now - lastStart < cooldownMs)
    return {...details, action: 'wait', reason: 'A recent attempt is within the one-day retry cooldown.',
      retryAfter: new Date(lastStart + cooldownMs).toISOString()};
  return {...details, action: 'dispatch', reason: 'No successful sync started within five days and no active or recent attempt.'};
}

export async function recoverSync({fetcher = fetch, token = process.env.GITHUB_TOKEN, now = Date.now()} = {}) {
  if (!token) throw Error('A GitHub Actions token is required for automatic recovery.');
  const endpoint = 'https://api.github.com/repos/' + repository + '/actions/workflows/' + workflow;
  const headers = {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoShelf-sync-watchdog', Authorization: 'Bearer ' + token};
  const history = async () => {
    const response = await fetcher(endpoint + '/runs?branch=main&per_page=50', {
      headers, redirect: 'error', signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw Error('Cannot check maintenance history (' + response.status + '); no recovery was requested.');
    const data = await response.json();
    if (!Array.isArray(data.workflow_runs)) throw Error('Invalid maintenance history; no recovery was requested.');
    return data.workflow_runs;
  };
  let decision = recoveryDecision(await history(), now);
  if (decision.action === 'dispatch') {
    // Recheck immediately before dispatch in case a scheduled/manual run just arrived.
    decision = recoveryDecision(await history(), now);
    if (decision.action === 'dispatch') {
      const response = await fetcher(endpoint + '/dispatches', {
        method: 'POST', headers: {...headers, 'Content-Type': 'application/json'},
        body: JSON.stringify({ref: 'main', inputs: {refresh_previews: false, watchdog_recovery: true}}),
        redirect: 'error', signal: AbortSignal.timeout(15000)
      });
      // Never retry this POST blindly: a timeout can occur after GitHub accepts it.
      if (response.status !== 204) throw Error('Automatic recovery request failed (' + response.status + ').');
      decision = {...decision, action: 'requested', reason: 'One automatic catch-up sync was requested.'};
    }
  }
  const summary = '## Catalogue sync watchdog\n\n' + decision.reason + '\n\n'
    + 'Last success: ' + (decision.lastSuccessAt || 'none recorded') + '\n'
    + (decision.retryAfter ? '\nRetry permitted after: ' + decision.retryAfter + '\n' : '')
    + '\nMissed schedules recover after five days. Failed runs retry after 6 hours, then 12, then daily, and stop after three failures in a row. Active or queued catalogue runs prevent recovery.\n';
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(JSON.stringify(decision));
  return decision;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {await recoverSync();}
  catch (error) {console.error(error.message); process.exitCode = 1;}
}
