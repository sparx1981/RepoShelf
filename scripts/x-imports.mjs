import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require = createRequire(import.meta.url), Q = require('../dist/quality.js');
export const X_SOURCE_CATEGORY = 'As Seen On X.com';
export function xSource(source) {
  if (source?.kind !== 'x' || typeof source.url !== 'string') return false;
  try { const u = new URL(source.url); return u.protocol === 'https:' && ['x.com', 'twitter.com'].includes(u.hostname) && !u.username && !u.password && !u.port && /\/(?:[^/]+\/status|i\/web\/status)\/\d+$/.test(u.pathname); } catch { return false; }
}
export function validatedXCandidate(candidate, now = Date.now()) {
  if (!candidate || typeof candidate.full !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(candidate.full) || ['.', '..'].includes(candidate.full.split('/')[1])) return false;
  if (!Array.isArray(candidate.discoveredVia) || !candidate.discoveredVia.some(xSource) || !Q.publishedEligible(candidate, now)) return false;
  if (Date.parse(candidate.lastCheckedAt) > now || Date.parse(candidate.demoHealth.checkedAt) > now) return false;
  const image = xScreenshot(candidate);
  return Boolean(image && Number.isFinite(Date.parse(image.capturedAt)) && Date.parse(image.capturedAt) <= now);
}
export function xScreenshot(candidate) {
  const name = createHash('sha256').update(candidate.full).digest('hex').slice(0, 24);
  return (candidate.screenshots || []).find(s => s.kind === 'demo' && s.src === `previews/${name}.jpg` && s.url === candidate.demo);
}
export function mergeXProvenance(entry, candidate) {
  const sources = new Map((entry.discoveredVia || []).map(s => [s.url, s]));
  for (const source of candidate.discoveredVia.filter(xSource)) sources.set(source.url, {kind: 'x', name: X_SOURCE_CATEGORY, url: source.url, ...(typeof source.postId === 'string' ? {postId: source.postId} : {}), ...(typeof source.postedAt === 'string' ? {postedAt: source.postedAt} : {})});
  return {...entry, discoveredVia: [...sources.values()]};
}
export async function importXCandidates(manifest, catalog, {importer, capture, controls = entries => entries, now = Date.now, limit = 50, offset = 0} = {}) {
  if (manifest?.schema !== 1 || !Array.isArray(manifest.repositories) || manifest.repositories.length > 10000) throw Error('Invalid X collector manifest');
  const entries = new Map(catalog.repositories.map(r => [r.full.toLowerCase(), r]));
  const results = [], candidates = new Map();
  for (const candidate of manifest.repositories) if (validatedXCandidate(candidate, now())) candidates.set(candidate.full.toLowerCase(), candidate);
  const pool=[...candidates.values()],start=pool.length?offset%pool.length:0,rotated=[...pool.slice(start),...pool.slice(0,start)];
  for (const candidate of rotated.slice(0, limit)) {
    if (!controls([candidate]).length) { results.push({full: candidate.full, status: 'moderated'}); continue; }
    try {
      const prior = entries.get(candidate.full.toLowerCase());
      // Keep fresh repository evidence, README context and current author-provided demo extraction.
      let entry = await importer(candidate.full, candidate.discoveredVia.find(xSource), prior);
      if (!entry || entry.demo !== candidate.demo || entry.full.toLowerCase() !== candidate.full.toLowerCase()) { results.push({full: candidate.full, status: 'retry', reason: 'repository_or_demo_changed'}); continue; }
      const image = xScreenshot(candidate);
      entry = mergeXProvenance({...entry, demoHealth: candidate.demoHealth, previewCheck: candidate.previewCheck, screenshots: [image, ...(entry.screenshots || []).filter(s => s.kind !== 'demo')].slice(0, 6)}, candidate);
      const allowed = controls([entry]);
      if (!allowed.length || !Q.publishedEligible(allowed[0], now())) { results.push({full: candidate.full, status: 'moderated_or_stale'}); continue; }
      await capture(image.src);
      entries.set(entry.full.toLowerCase(), allowed[0]);
      results.push({full: entry.full, status: 'imported'});
    } catch (error) {
      results.push({full: candidate.full, status: 'retry', reason: 'temporary_error'});
      if ([403, 429].includes(error.status)) break;
    }
  }
  return {results, nextOffset:pool.length?(start+results.length)%pool.length:0, catalog: {...catalog, ...(results.some(r => r.status === 'imported') ? {updatedAt: new Date(now()).toISOString()} : {}), repositories: [...entries.values()]}};
}
