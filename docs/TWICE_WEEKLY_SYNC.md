# Twice-weekly sync

The catalogue sync used to run every two hours. It now runs **twice a week, Monday and Thursday at 03:17 UTC**, with much larger runs. This page is the source of truth where older documents still describe the two-hour schedule.

## Why

- Every sync failed from 5 November 2026: GitHub's `ubuntu-latest` image became Ubuntu 26.04, and Playwright 1.56.1 cannot install a browser on it. Every browser shard failed, the whole run was reported as failed after moving several GB of artifacts, and the watchdog kept requesting catch-up runs that failed the same way. All workflows are now pinned to `ubuntu-24.04`.
- Frequent runs multiplied failures, runner time, artifact storage and calls to the Vercel site (the health monitor, the submissions scan and the promotions check all hit it).

## What changed

| | Before | Now |
|---|---|---|
| Catalogue sync | every 2 hours | Monday and Thursday 03:17 UTC |
| A listing stays public after its last repository check | 7 days (note shown after 2) | 28 days (note shown after 14) |
| A listing stays public after its last demo check | 7 days | 28 days |
| Editor's picks / spotlight fill-ins (repository, demo) | 2 days, 7 days | 14 days, 14 days |
| Repository re-check interval | 48 hours | 21 days |
| Demo re-check interval | 7 days | 21 days |
| Healthy screenshot refresh | 7 days | 28 days |
| Snapshot grace before freshness falls back to the real clock | 72 hours | 6 days |
| Viewer qualification evidence | 48 hours | 10 days (the workflow runs weekly) |
| Repository revalidation per run | one 6-minute wave, up to 2,500 | up to three waves of about 5,000, waiting for GitHub's hourly allowance to reset between them |
| Demo-check budget per browser shard | 10 minutes | 60 minutes |
| Screenshot budget per browser shard | 15 minutes | 90 minutes |
| Health monitor | every 30 minutes | every 3 hours (and after each sync or publication) |
| Watchdog recovery | after 2 hours | after 5 days; failed runs retry after 6 h, 12 h, then daily; stops after three failures in a row |
| Submissions scan | every 15 minutes | hourly |
| Promotions check | hourly | daily |
| Artifact cleanup | every 3 hours | daily |
| Application checks, viewer qualification | daily | weekly (Monday) |
| Launch acceleration | hourly | removed (milestone reached; still runnable by hand) |

Publication stays daily at 06:35 UTC. It does nothing when no sync has produced new data.

## Why the budgets grew

Each listing must be re-checked inside its window or it drops out of the public catalogue. With about 90,000 listings and a re-check every 21 days, one sync (there are about six per window) has to revalidate around 15,000 repositories and check around 15,000 demos. The old per-run limits (2,500 repositories in six minutes, a few thousand demos) would have let the public catalogue shrink to roughly a fifth. GitHub allows about 5,000 requests an hour, so repository revalidation now runs in waves and waits for the allowance to reset (`CATALOG_REVALIDATE_*` in `catalog.yml`).

These figures are estimates; the first full runs will show the real throughput. Watch the **Published** count and the "pending" demo and repository checks in the Sync log after the first two syncs. If published listings fall, raise `PREVIEW_BUDGET_MS`, `DEMO_CHECK_BUDGET_MS` or `CATALOG_REVALIDATE_WAVES`, or lengthen the windows in `dist/quality.js`.

## Going back

Restore `cron: '17 */2 * * *'` in `catalog.yml`, the 7-day and 2-day constants in `dist/quality.js`, `CHECK_INTERVAL_MS` in `scripts/catalog-health.mjs`, and the thresholds in `scripts/sync-watchdog.mjs` and `scripts/monitor-health.mjs`. The tests encode the current values.

## Vercel

The Vercel cron that calls `/api/editorial?action=warm` every four minutes (see `vercel.json`) needs a paid plan. Remove it before returning to the Hobby plan.
