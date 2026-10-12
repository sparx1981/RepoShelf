import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Only production (the main branch) deploys. Every other branch or pull request would create a
// preview deployment, which counts against the Vercel allowance, so those builds are skipped.
export function shouldBuild(message, paths, branch = null, environment = null) {
  if (environment && environment !== 'production') return false;
  if (branch && branch !== 'main') return false;
  // CI and read-only verification changes do not change deployed application assets.
  const verificationOnly = paths.length > 0 && paths.every(path => path.startsWith('.github/workflows/') || path.startsWith('tests/') || ['scripts/deployment-policy.mjs', 'scripts/audit-discovery.mjs', 'scripts/verify-deployed-discovery.mjs'].includes(path));
  if (verificationOnly) return false;
  const checkpoint = message.split('\n')[0] === 'Save catalogue recovery checkpoint';
  const generated = path => path.startsWith('data/') || path.startsWith('dist/previews/')
    || /^dist\/(?:catalog|spaces|community|growth)\.json(?:\.gz)?$/.test(path);
  return !(checkpoint && paths.length > 0 && paths.every(generated));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const message = execFileSync('git', ['show', '-s', '--format=%B', 'HEAD'], {encoding:'utf8'});
    const paths = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const build = shouldBuild(message, paths, process.env.VERCEL_GIT_COMMIT_REF, process.env.VERCEL_ENV);
    console.log(build ? 'Build requested for final publication or source changes.' : 'Build skipped: preview, intermediate checkpoint or verification-only changes.');
    process.exitCode = build ? 1 : 0;
  } catch {
    // If Git metadata is unavailable, continue the build instead of dropping an update.
    process.exitCode = 1;
  }
}
