import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

export async function recordStageMetrics(stage, metrics, root = new URL('../', import.meta.url)) {
  if (!/^[a-z_]+$/.test(stage)) throw Error('Invalid sync metrics stage.');
  const folder = new URL('.sync-metrics/', root);
  await mkdir(folder, {recursive: true});
  const temporary = new URL(stage + '-' + randomUUID() + '.tmp', folder);
  await writeFile(temporary, JSON.stringify(metrics, null, 2) + '\n');
  await rename(temporary, new URL(stage + '.json', folder));
}
export async function readStageMetrics(stage, root) {
  try {return JSON.parse(await readFile(new URL('.sync-metrics/' + stage + '.json', root), 'utf8'));}
  catch (error) {if (error.code === 'ENOENT') return null; throw error;}
}
export function probeMetrics({selected = 0, due = selected, limit = selected} = {}) {
  const metrics = {due, selected, limit, attempted: 0, working: 0, captured: 0,
    unavailable: 0, temporaryFailures: 0, reasons: {}, examples: []};
  return {
    metrics,
    record(project, result, captured = null) {
      metrics.attempted++;
      if (result.kind === 'working') metrics.working++;
      else if (result.kind === 'unavailable') metrics.unavailable++;
      else metrics.temporaryFailures++;
      if (captured) metrics.captured++;
      const reason = captured ? null : result.reason || (result.kind === 'working' ? (captured === false ? 'no_screenshot' : null) : 'temporary');
      if (reason) {
        const code = /^[a-z0-9_]{1,64}$/.test(reason) ? reason : 'other';
        metrics.reasons[code] = (metrics.reasons[code] || 0) + 1;
        if (metrics.examples.length < 12 && /^(hf:)?[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(project))
          metrics.examples.push({project, reason: code});
      }
    },
    summary(started, now = Date.now()) {
      return {...metrics, deferred: Math.max(0, metrics.selected - metrics.attempted),
        remainingDue: Math.max(0, metrics.due - metrics.attempted), durationMs: Math.max(0, now - started)};
    }
  };
}
