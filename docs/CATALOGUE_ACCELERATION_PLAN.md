# Catalogue acceleration plan, revision 2 (for implementation)

Goal: **5,000+ published, validated listings** as fast as possible, on free GitHub Actions only. Stuck demos (bot-blocked, dead DNS, login walls) stay out of the public catalogue. Never bypass captchas or access controls.

Revision 2 re-reads `main` at `c4dcc831` and the live checkpoint branch (`reposhelf-checkpoints`, 2026-10-05 18:45 UTC).

## Where we are now

| | Before (16:00 UTC) | Now (18:45 UTC) |
|---|---|---|
| Records | 4,226 (flat for ~24 h) | **4,482** |
| Published | 3,429 | **3,581** |
| Pending / quarantined / unavailable | 0 / 574 / 223 | 115 / 565 / 221 |
| Gap to 5,000 published | 1,571 | **1,419** |

Discovery works again: the last three runs inspected 246–250 candidates and found 19–88 demos each (8%–35% per run). One full sync now takes 6–12 minutes (`recordedAt − startedAt`).

**Caveat on the numbers:** most of these runs were *push-triggered* (the workflow listens to many script paths), roughly one every 10–30 minutes. The cron is still every 2 hours, so unattended throughput will be much lower than what you just saw.

## Status of the first plan

| Item from revision 1 | Status | Notes |
|---|---|---|
| Turn discovery on, widen it | **Mostly done** | Batches 250/25/40/20, persisted query rotation, 15 seeds, year slices, cooldown handling, 7 curated lists. Budgets are still small (see A1–A3). |
| Retire hopeless listings | **Done differently** | Class-based backoff (7 d, then 30 d for DNS/TLS/blocked/401/402/451). Entries are stored and hidden, not deleted. Good. |
| Cheap pre-flight | **Done** | `demo-preflight.mjs`: DNS/TLS/404/410/429 skip the browser, IP pinning, per-host serialisation. |
| Shard browser stage | **Done, 2 shards** | See B1: count is hard-coded. |
| Cheaper visits | **Partial** | Screenshot retry, animations off, patient mode for slow pages. Blanket shorter timeouts were deliberately rejected; agree. |
| ETag revalidation | **Done, unproven** | `repositoryNotModified` is 0 in recent runs only because nothing was due. Verify when the 48 h cycle comes round. |
| Screenshot validity | **Partial** | Uniform/tiny image rejection added. Error-text pages not covered. |
| Burst cadence | **Not done** | See A4. |
| Skip tests on scheduled runs | **Withdrawn** | `npm test` takes 13 s. Not worth the risk. |

## Remaining recommendations, by expected impact

### A. Intake is now the limiter

**A1. Raise the GitHub candidate budget.** 250 README inspections finished in 14–16 s (`catalog.durationMs`). `raw.githubusercontent.com` has no API quota. Raise `githubBatch` to 1,000–2,000 per run. Acceptance: `candidatesChecked` ≥ 1,000 with `catalog.durationMs` still well under 5 minutes.

**A2. Raise search pages per run.** There are ~115 queries × up to 10 pages. At 12 pages per run a full rotation takes ~96 runs (about 8 days at the 2-hour cron). Go to 30–60 pages per run. At 4.5 s spacing that is 2–4.5 minutes. Keep the saved cooldown logic: earlier runs hit 403 secondary limits at 2.2 s spacing. Acceptance: no new `searchPaused` entries over 5 consecutive runs.

**A3. Import many more Hugging Face Spaces.** This is the best conversion in the catalogue: 515 of 551 Spaces have a working demo (93%) and 514 have a screenshot. They need no README parsing, and the HF API already gives runtime state. The batch is 25 per run. Raise `SPACE_IMPORT_BATCH` (`spacesBatch`) to 300–500, and filter by a minimum likes floor and `sdk` (gradio / streamlit / static / docker) so low-value test Spaces stay out. Keep the mixed-source ranking and source filter so GitHub remains the primary identity. Acceptance: ≥250 new Spaces per run; validated share stays above 85%.

**A4. Add launch cadence.** A sync takes 6–12 min but cron fires every 2 h. Either set cron to `*/30`, or add burst chaining: at the end of `refresh`, if the run found new candidates and published < 5,000, `workflow_dispatch` itself (allowed with `GITHUB_TOKEN`, needs `actions: write`), capped at ~24 chained runs. The `reposhelf-catalog` concurrency group already serialises. Stop automatically once the 5,000 milestone is reached.

**A5. Learn which searches pay.** Yield per run varied 8%–35%. Record `inspected` and `found` per query in `data/discovery-search.json`; give high-yield queries more pages and retire queries that return nothing new. Seeds worth testing: `topic:github-pages`, `topic:netlify`, `topic:vercel`, `topic:streamlit`, `topic:gradio`, and `in:readme` with hosted-app domains (`vercel.app`, `netlify.app`, `github.io`, `streamlit.app`, `pages.dev`). Also test GraphQL search, which can return metadata and README text in one request on a separate rate budget (verify the limits before relying on it).

### B. Browser stage

**B1. Make shard count a setting.** `BROWSER_SHARD_COUNT: '2'`, `matrix.shard: [0, 1]`, `shardCount: 2` in `browser-shards.mjs` and `concurrency: 8` in `finish-sharded-sync.mjs` are all hard-coded, and the worker rejects `count > 4`. Derive them from one value. Today the browser stage is not the bottleneck (45–121 attempts per run, ~100 pending); move to 4 shards once A1–A3 land and intake reaches several hundred per run. Acceptance: changing one number changes the matrix, partition and reported concurrency consistently.

**B2. Skip definitive failures earlier.** New dead candidates still cost three browser visits (2 h apart) before the 7-day backoff. Add:
- `ECONNREFUSED` and persistent 5xx on preflight to the skip list.
- Cloudflare challenge detection from the `cf-mitigated: challenge` response header (a definitive signal, not a bypass; just classify as `access_restricted`).
- Jump straight to the long backoff on the second failure for NXDOMAIN (`ENOTFOUND`), certificate errors and challenge responses. Keep `EAI_AGAIN`/timeouts transient.

### C. Valid, launch-ready quality

**C1.** Add text/title checks for error or wall pages that pass the pixel test ("Application error", "404", "Just a moment", "Access denied", login or cookie walls). Check `inspectDemo` first and add only what is missing.

**C2.** Before declaring launch, sample 100 random *published* listings and review them by eye. Record the result in `docs/`. Newly admitted Spaces and low-star GitHub entries deserve the biggest share of that sample.

**C3. Free screenshot providers: leave off for launch.** They only cover listings whose demo already passed a fresh check but have no screenshot (tens, not hundreds), each image needs manual administrator approval, and they require migration 13 plus secrets. `capture-providers.json` shows `worker_key_missing` anyway. Revisit after launch.

### D. Housekeeping

**D1.** Publication is still daily at 06:35 UTC. At the end of the burst, run **Publish now** once, then re-check the site.

**D2.** `dist/catalog.json` is ~46 MB and is rewritten at least every 10 s by each shard and committed per run. Move retired/quarantined records to a separate file so the hot file shrinks, if run time or checkpoint size becomes an issue.

**D3.** Keep `published` in growth snapshots (now present) and add per-source and per-query yield to the sync report, so the next round of tuning uses measured numbers.

## Estimate (unverified)

From 3,581 published, 1,419 more are needed. With A1–A4 in place, rough per-run yield could be ~250 new Spaces × ~90% plus ~1,000 GitHub candidates × ~25% demo × ~65% publish ≈ **350–400 published per run**. At 30-minute cadence that is **roughly 4–6 hours**, then a manual publish. Treat as an order-of-magnitude figure: search yield decays as the top results saturate, which is why A5 matters. Measure after the first burst run and adjust.

## Risks

- GitHub search secondary limits; keep spacing and saved cooldowns.
- Hugging Face API limits and low-quality Spaces; use the likes floor and watch the validated share.
- Be polite to demo hosts (per-host serialisation is already in place).
- Do not raise per-runner browser concurrency above 4; add shards instead.

