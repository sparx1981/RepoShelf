import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Only production (the main branch) deploys. Every other branch or pull request would create a
// preview deployment, which counts against the Vercel allowance, so those builds are skipped.
// Vercel builds only the newest commit of a push, so a source change that sits earlier in the same push (or in commits that were
// never built) must still count: `paths` and `subjects` cover everything since the last successful deployment when Vercel
// tells us where that was (VERCEL_GIT_PREVIOUS_SHA), and only the newest commit otherwise.
export function shouldBuild(message, paths, branch = null, environment = null, subjects = null) {
  if (environment && environment !== 'production') return false;
  if (branch && branch !== 'main') return false;
  // CI and read-only verification changes do not change deployed application assets.
  const verificationOnly = paths.length > 0 && paths.every(path => path.startsWith('.github/workflows/') || path.startsWith('tests/') || ['scripts/deployment-policy.mjs', 'scripts/audit-discovery.mjs', 'scripts/verify-deployed-discovery.mjs'].includes(path));
  if (verificationOnly) return false;
  const checkpoint = (subjects || [message.split('\n')[0]]).every(subject => subject === 'Save catalogue recovery checkpoint');
  const generated = path => path.startsWith('data/') || path.startsWith('dist/previews/')
    || /^dist\/(?:catalog|spaces|community|growth)\.json(?:\.gz)?$/.test(path);
  return !(checkpoint && paths.length > 0 && paths.every(generated));
}
// What changed since the last successful deployment, or null when that cannot be worked out (the caller then builds).
export function changesSince(previous, run = (...args) => execFileSync('git', args, {encoding:'utf8'})) {
  if (!previous || !/^[0-9a-f]{7,40}$/i.test(previous)) return null;
  try {
    const paths = run('diff', '--name-only', previous, 'HEAD').trim().split('\n').filter(Boolean);
    const subjects = run('log', '--format=%s', previous + '..HEAD').trim().split('\n').filter(Boolean);
    return {paths, subjects};
  } catch {
    return null;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const message = execFileSync('git', ['show', '-s', '--format=%B', 'HEAD'], {encoding:'utf8'});
    const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
    const range = changesSince(previous);
    // A previous deployment that is not in this clone is treated as "something may have changed": build, never drop an update.
    const unknownRange = Boolean(previous) && !range;
    const paths = range ? range.paths : execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const build = unknownRange && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production') && (!process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF === 'main')
      ? true
      : shouldBuild(message, paths, process.env.VERCEL_GIT_COMMIT_REF, process.env.VERCEL_ENV, range ? range.subjects : null);
    console.log(build ? 'Build requested for final publication or source changes.' : 'Build skipped: preview, intermediate checkpoint or verification-only changes.');
    process.exitCode = build ? 1 : 0;
  } catch {
    // If Git metadata is unavailable, continue the build instead of dropping an update.
    process.exitCode = 1;
  }
}
