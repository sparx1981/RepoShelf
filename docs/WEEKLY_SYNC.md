# Weekly sync and the Vercel free plan

From November 2026 the catalogue is **synced and published once a week, on Monday**, so RepoShelf fits inside Vercel's free (Hobby) plan. This page replaces [TWICE_WEEKLY_SYNC.md](TWICE_WEEKLY_SYNC.md) where they differ.

## Where the Vercel bill came from

Measured on the Vercel usage page for `reposhelf`:

| | Last cycle (18 Oct – 18 Nov) | First two days of the next cycle |
|---|---|---|
| Total | $20.85 | $1.74 |
| Build CPU minutes | most of it | 6 hours, $1.26 (72%) |
| Fluid Active CPU | — | 1 hour, $0.27 (on pace for ~15 h a month; the free plan allows 4) |
| CDN requests, data transfer, invocations | — | 28k requests, 246 MB, 3.2k invocations: far below the free limits |

- **Builds were the cost because of how often they ran, not their size.** Every push to `main` is a Vercel build. The daily publication and the daily X import each pushed whenever anything changed, so there were about 50 builds in the last cycle (31 of them "Refresh public demo catalog"), at roughly 2 CPU-hours each on the larger paid build machine.
- **Function CPU** comes from cold starts: a new instance reads about 400 MB of browse and search index before answering. The four-minute warm-up cron (removed on 18 November) paid that cost on a timer, and the search box also triggered it when focused.

## What changed

| | Before | Now |
|---|---|---|
| Catalogue sync | Monday and Thursday 03:17 UTC | **Monday 03:17 UTC** |
| Scheduled publication (one Vercel build) | daily 06:35 UTC | **weekly, Monday 06:35 UTC** (a missed Monday is caught up by the next daily check) |
| Daily X import | pushed to `main` (a build) | saved for the weekly publication, like the sync and submissions |
| A listing stays public after its last repository or demo check | 28 days | **48 days** |
| Repository and demo re-check interval | 21 days | 28 days (about 20 days, roughly three weekly syncs, of slack before anything drops) |
| "Details last refreshed" note | after 14 days | after 21 days |
| Snapshot grace before freshness uses the real clock | 6 days | 9 days |
| Repository revalidation per run | up to 3 waves of ~5,000 | up to 4 waves of ~5,000 (sync job limit 330 minutes) |
| Demo-check budget per browser shard | 60 minutes | 90 minutes |
| Watchdog recovery | after 5 days | after 8 days |
| Health alerts: sync overdue / catalogue stale | 6 days | 9 days |
| Storefront shelves and project details at the edge | 5 minutes | up to a day (shelves end at UTC midnight so the daily rotation is on time; saved edits purge immediately; every deployment starts with an empty cache) |
| Warm-up call when the search box is focused | yes | removed |
| Daily promotions check (called the live site) | daily | manual only; promotions stay off (they only ever ran in Stripe test mode for administrators) |
| Vercel build memory | Node default (~2 GB on an 8 GB machine; the index step ran out) | `--max-old-space-size=6144` |

The sync, screenshots and demo checks run on GitHub Actions, not on Vercel, so the catalogue can keep growing without adding Vercel cost. Only serving the site and building it once a week touch Vercel.

**Publish now** in the admin area still publishes immediately; each use is one extra Vercel build.

## Will the build fit the free plan?

The free plan builds on a 2-CPU, 8 GB machine with a 45-minute limit. The full build was timed on 2 CPUs with the real catalogue (110,000 listings, 89,000 published): about 5½ minutes, of which 4 min 40 s is the browse and search index. It needs more than Node's default heap, which is why `vercel.json` now sets one.

## Before switching the plan to Hobby

1. Merge this change and let one Monday sync and publication run.
2. On the Vercel usage page, check that a week shows one or two builds and that Fluid Active CPU stays under about 1 hour a week.
3. Check that **Published** in the admin Sync log holds steady over the first two or three weeks. If it falls, raise `CATALOG_REVALIDATE_WAVES` or `DEMO_CHECK_BUDGET_MS` in `catalog.yml`, or lengthen the windows in `dist/quality.js`.
4. Switch the team to Hobby in Vercel. On the free plan, exceeding a limit pauses the feature rather than charging.

## Going back

Restore `cron: '17 3 * * 1,4'` in `catalog.yml`, the daily rule in `lib/publication-policy.mjs`, the windows in `dist/quality.js`, `CHECK_INTERVAL_MS` in `scripts/catalog-health.mjs`, `DEMO_CHECK_INTERVAL` in `scripts/demo-health.mjs`, and the thresholds in `scripts/sync-watchdog.mjs` and `scripts/monitor-health.mjs`. The tests encode the current values.

## Sync efficiency fixes (20 November 2026)

Every sync from 5 November failed. The 19 November run showed why, and what was wasted:

| Problem | Effect | Fix |
|---|---|---|
| Browser shards matched results to listings with a linear search over ~110,000 listings for each listing | 20–25 minutes of post-processing per shard; shard 0 hit the 175-minute limit and lost all 6,883 demo checks | Map lookups (about 0.3 s at catalogue scale) and a 6 GB heap for the worker |
| Chromium's system packages failed to download (Ubuntu mirror 503) | Shard 1 did no work | Every browser install, in every workflow, retries three times |
| ~92,000 repositories were checked between 1 and 5 November, so nothing was due | Revalidation checked 0 repositories, and every repository would fall due (and expire) in the same week | Spare allowance re-checks the oldest repositories checked at least a week ago, after anything due |
| Validation rebuilt the whole site | About 5 minutes per run | Tests only; Vercel and the checks workflow build the site |
| The multi-GB recovery artifact was uploaded on every run | About 13 minutes per run | Full recovery bundle on failure only; logs and metrics always |

Browser budgets are now 90 minutes of screenshots plus 75 minutes of demo checks per shard, inside a 210-minute step.

## Simulation focus

Each sync starts with 16 searches from a focus list of interactive simulations: sand, dust, fluid, water, smoke, gas, clouds, light, cloth, particles, n-body, boids, cellular automata, reaction–diffusion, ray and path tracing (`FOCUS_SEEDS` in `scripts/discovery-search.mjs`, 48 queries in two star bands, so the whole list runs every three weeks). The general rotation keeps its 40 searches (`CATALOG_SEARCH_QUERIES` is 56). Searches that find nothing new three times in a row rest for a week, as before.

The "Simulation & physics" subject recognises these projects from their own name, description and topics (taxonomy version 5). On the current catalogue that raises the count from 1,195 to 1,343 before any new discovery.
