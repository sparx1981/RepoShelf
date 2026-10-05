# Catalogue acceleration plan (for implementation)

Goal: a full, valid, launch-ready catalogue of **5,000+ published listings** as fast as possible, using **free GitHub Actions only**. Stuck demos (bot-blocked, dead DNS, login walls) are **dropped from the public catalogue**, not shown with substitute images.

## What the data says (as of 2026-10-05 ~16:00 UTC)

| Fact | Evidence |
|---|---|
| Published listings: 3,429. Quarantined: 574. Unavailable: 223. Total records: 4,226. | `Q.catalogueState` over `dist/catalog.json` + `dist/spaces.json` |
| **Total records have been flat at 4,226 since 2026-10-04 17:16.** Discovery has effectively been off. | `dist/growth.json` snapshots; `candidateLimit: 0`, `candidatesChecked: 0`, `searchQueries: 0` in the last six `data/sync-runs/*.json` |
| Screenshot backlog is *not* the bottleneck any more. It went 674 → 3,507 in ~22 h. The remaining ~795 without a screenshot are almost entirely the 574 quarantined + 223 unavailable. | `growth.json`; counts above |
| Recovery passes are ~99% waste. Pass 1: 567 attempted, 2 captured. Pass 2: 562 attempted, 15 captured. Each burned ~11 min of the 25 min budget. | `data/recovery-results.json` |
| Failure mix of the stuck tail: access_restricted 178, dns_unresolved ~122, network_or_timeout ~95, empty_page ~80, http_5xx ~35, http_4xx ~25, unsafe_target 12, other ~25. | same file, `reviewReasons` |
| 553 listings have 3+ consecutive failures yet are retried every 24 h forever. | `previewCheck.consecutiveFailures` distribution; `failures>=3?86400000` in `capture-previews.mjs` and `run-browser-queues.mjs` |
| One runner, concurrency hard-capped at 4 (`Math.min(4,…)` in `preview-workers.mjs` and `run-browser-queues.mjs`); adaptive limiter repeatedly dropped 4→3→2→1 under pressure. Raising the per-runner cap will not help; add runners. | `adaptive.changes` in recovery results |
| Per-run intake is tiny: Spaces/curated/community batches are **10 each**, GitHub batch 150. | `scripts/catalog-priority.mjs` |
| Revalidation is sequential REST, one call per listing, ~415–500 per run. | `scripts/index-catalog.mjs` (`for (const prior of due)`), sync-run `repositoryChecks` |

**Conclusion:** the pipeline is good at validating what it already has and has stopped finding new things. To reach 5k+ we need roughly +1,600 published. Assuming ~70% of new candidates validate (historical publish rate is ~81%, new long-tail candidates will be lower), that means ~2,300 new demo-bearing candidates.

## Work items, in priority order

### 1. Turn discovery back on and widen it  (biggest gain)
- Confirm the next scheduled run actually searches. Older run reports show `githubBatch: 0` (coverage gate); `catalog-priority.mjs` now returns 150 and `ready: true`. Verify with a run, and make coverage targets **never** gate discovery.
- Add a launch/burst setting: `CATALOG_BATCH_SIZE` 1,500+ and raise `spacesBatch`, `curatedBatch`, `communityBatch` from 10 to a few hundred each.
- Search recall in `index-catalog.mjs`: 6 seeds × 5 star bands, and the stars/updated sort alternates, so the same top results recur and are absorbed by `cacheHits`. Add **date-window partitioning** (`created:A..B` or `pushed:A..B`) to split any query into disjoint slices under the 1,000-result cap, and add seeds: `topic:webapp`, `topic:pwa`, `topic:playground`, `topic:demo`, `"live demo"`.
- Prioritise candidates whose `homepage` is on a hosting domain (github.io, vercel.app, netlify.app, pages.dev, onrender.com, fly.dev, streamlit.app, hf.space). They are high-yield and can go straight to the browser queue.
- Hugging Face Spaces: the HF API reports runtime stage, so RUNNING Spaces can be pre-qualified cheaply. Import hundreds per run, not 10.
- More curated lists in `sources.config.json` (only 3 today), focused on web apps with live demos.
- Acceptance: a burst run adds ≥500 new candidates; sync report shows non-zero `candidatesChecked`.

### 2. Stop re-trying hopeless listings  (frees the browser budget)
Replace "3+ failures → retry daily forever" with class-based retirement:
- **Permanent** (dns_unresolved, unsafe_target, http_404/410/451, 52x TLS/origin): retire after 2 failures ≥24 h apart.
- **Blocked** (access_restricted, http_401/402/412): retire after 2 failures. **Do not add evasion** (no stealth plugins, proxies or challenge solving).
- **Transient** (network_or_timeout, empty_page, 5xx, probe_timeout): back off 1 d → 3 d → 7 d, retire at 4 consecutive.
- Retired = hidden, kept in the record, re-probed once after 30 days or when the README demo URL changes. Applies to quarantined entries too; the recovery workflow should skip retired ones.
- Acceptance: the recovery/normal queue contains no entry in a retired class; per-run attempted count falls from ~565 to a few dozen; `workerTimeMs` per captured screenshot drops sharply.

### 3. Cheap pre-flight before Chromium
- A Node-only stage (DNS + TLS + GET, following redirects through `publicUrlGuard`, 50–100 concurrent) classifies every candidate in seconds. Only 2xx/3xx HTML responses enter the browser queue.
- Dead DNS, 4xx/5xx and most hard timeouts (roughly 280 of the 574 stuck listings by the table above) never cost a 35–45 s browser slot.
- Add per-host serialisation (one visit per hostname at a time) to avoid self-inflicted `rate_limit` failures.
- Acceptance: pre-flight rejects are recorded with the same reason codes so retirement rules in item 2 apply unchanged.

### 4. Shard the browser stage across free parallel runners
Today: one job, 25 min budget (15 previews + 10 health), ≤4 concurrent browsers.
- `plan` job: select queue (same selectors as now), write shard manifests.
- `shard` matrix, N = 6 to start (public repos allow 20 concurrent free jobs; **confirm the repository is public**, otherwise limits are lower). Each shard takes `hash(full) % N`, runs `run-browser-queues.mjs` on its slice, uploads a **patch artifact**: per-listing `demo`, `demoHealth`, `previewCheck`, `screenshots`, plus the JPGs. Shards must not write `dist/catalog.json` directly.
- `merge` job: same `reposhelf-catalog` concurrency group, applies patches to the restored checkpoint, runs compression, records metrics, saves the checkpoint.
- Expected: ~6× throughput. 2,300 candidates takes roughly 15–20 min instead of 100+ min (estimate; measure with `workerTimeMs/attempted`).
- Acceptance: merged result equals what a single runner would produce for the same inputs (add a test with fixtures); a failed shard loses only its slice.

### 5. Make each visit cheaper
- Replace the fixed 2.5 s delay and 8 s blank-page retry with `load` + DOM/network-quiet (≈500 ms, cap ~4 s).
- Block media and known tracker hosts during the probe. Keep fonts so screenshots look right.
- First attempt timeout ~25 s; slow sites get one later retry instead of holding a worker for 45 s.
- Profile first (`workerTimeMs` per success vs per failure) so the gain is measured, not assumed.

### 6. Cut GitHub API cost of revalidation
- Use conditional requests (`If-None-Match` ETag; a 304 does not count against the primary rate limit) or GraphQL aliasing (~50 repos per query) in place of one sequential REST call per listing.
- Keep the 48 h repository-check freshness required for publication; the savings go to discovery headroom instead.

### 7. Launch cadence and CI overhead
- Burst mode: at the end of `catalog.yml`, if backlog or pending candidates remain and a `burst` input is set, re-dispatch the workflow (`workflow_dispatch` via `GITHUB_TOKEN` is permitted; needs `actions: write`). The existing concurrency group serialises runs. Switch cron to hourly while launching.
- Cache the Playwright download and skip `npm test` / `test:mcp` on scheduled data runs (`checks.yml` already covers pushes). Estimated saving 3–6 min of every 55 min job.
- Publish once at the end of the burst with **Publish now** (`publication.yml`), instead of waiting for 06:35 UTC.

### 8. "Valid" means the screenshot is actually valid
- Reject near-uniform images (use `sharp` stats; it is already a dependency), and pages whose title/body match error or challenge text ("404", "Application error", "Just a moment", "Access denied", cookie/login walls). Check `inspectDemo` in `demo-health.mjs` first; add only what is missing.
- Before launch: sample 100 random published listings and review them by eye; record the pass rate in `docs/`.
- Later, non-blocking: at 5k+ the 140 MB `dist/` is redeployed on each publish. Serve small WebP card thumbnails and keep full images for the detail view.

## Launch definition
- ≥5,000 published; no published entry with expired evidence (repo ≤48 h, demo ≤7 d, screenshot matching current demo URL).
- Retired/quarantined entries invisible publicly.
- Visual sample of 100 passes (target ≥97% good).
- Sync report shows **net new published per run**, success rate by failure class, and queue depth, so progress is visible.

## Risks / things not to do
- Search API is ~30 requests/min; keep the existing 2.2 s spacing. Secondary rate limits can still trip on bursts.
- Be polite to demo hosts (per-host serialisation, no retry storms).
- Do not raise per-runner concurrency above 4; the adaptive limiter shows the runner is already memory/CPU constrained.
- Yield (~70%) and speedups (~6×) are estimates; the first burst run should be used to measure real numbers before committing to the 5k target date.
