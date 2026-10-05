import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function shouldBuild(message, paths, branch = null) {
  if (branch === 'reposhelf-progress') return false;
  const checkpoint = message.split('\n')[0] === 'Save catalogue recovery checkpoint';
  const generated = path => path.startsWith('data/') || path.startsWith('dist/previews/')
    || /^dist\/(?:catalog|spaces|community|growth)\.json$/.test(path);
  return !(checkpoint && paths.length > 0 && paths.every(generated));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const message = execFileSync('git', ['show', '-s', '--format=%B', 'HEAD'], {encoding:'utf8'});
    const paths = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const build = shouldBuild(message, paths, process.env.VERCEL_GIT_COMMIT_REF);
    console.log(build ? 'Build requested for final publication or source changes.' : 'Recovery checkpoint saved; skip this intermediate build.');
    process.exitCode = build ? 1 : 0;
  } catch {
    // If Git metadata is unavailable, continue the build instead of dropping an update.
    process.exitCode = 1;
  }
}
