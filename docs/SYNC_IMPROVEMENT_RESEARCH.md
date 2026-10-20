# Sync research: hidden listings, slow syncs and file sizes (20 October 2026)

Scope: why so much of the catalogue is hidden, why long syncs add few listings, and what the file sizes and run times cost. Built from the repository, 225 saved sync reports (3–19 October), the GitHub run history for 18–20 October, and the job log of one full run (#283, 19–20 October). Limits taken as fixed: free GitHub Actions and Vercel Hobby, no new paid APIs. Listings that fall out of date stay visible, marked as older.

Data caveat: the per-listing numbers come from the saved catalogue of **17 October 05:18 UTC** (66,039 listings with a Hugging Face space merged in); the live catalogue is about 12% larger now. The sync-report numbers run to 19 October. Treat every figure as an order of magnitude to confirm with a live run, not a promise.

## 1. The five findings

1. **The number of public listings is set by how many repositories can be re-read in two days, not by how many good listings exist.** A listing is public only if its repository was checked in the last 48 hours (`publishedEligible` in `dist/quality.js`). The sync re-reads about 36,000 repositories in 48 hours, and about 36,000 listings are public. On 17 October, 55,428 listings had a working demo, a screenshot and a demo check under seven days old; 31,725 were public. **23,703 listings were hidden for one reason only: the repository check was more than two days old.**
2. **The queue of due repository checks can never drain.** The sync refreshes at most 750 repositories a run (`Math.min(requested,750,allowance)`), one at a time. That is about 10,500 a day against about 37,000 due a day (74,000 listings every 48 hours). The last run had 27,178 due and refreshed 750. GitHub's allowance is not the limit: the plan reported 4,731 calls available and used 750.
3. **Long syncs are mostly overhead.** In run #283 (74 minutes), about 44 minutes went on moving data (checkouts, three checkpoint saves, a 1.08 GB artifact up and down, a 9-minute diagnostics upload) and the test suite (7.4 minutes). About 30 minutes was discovery and browser work.
4. **New listings are limited by a candidate budget, not by GitHub's search.** A run reads 1,500 READMEs; the search budget (40 pages, up to 4,000 results) is unused. 29% of inspected candidates turn into a new listing (56,728 added from 194,583 inspected). The best queries are broad pools well past GitHub's 1,000-result cap per query; half of all queries (81 of 161) sit in a seven-day back-off after three empty visits.
5. **File size is a hosting risk, not just a speed one.** Making more listings public grows the public browsing index by about 70%. Measured on the 17 October data: cards 55.5 MB raw / 11.0 MB gzipped now, 95.3 MB / 18.9 MB with a seven-day window. A build and bundle check is needed before this reaches production.

## 2. How a listing becomes public today

All of this is in `dist/quality.js` and is evaluated when the browsing index is built (daily publication at 06:35 UTC), against the catalogue snapshot's time (72-hour grace).

| Test | Limit |
|---|---|
| Not hidden by an administrator, repository `available` | none |
| Repository checked | within **2 days** |
| Demo status `working`, checked | within 7 days |
| Demo screenshot captured for the current demo URL | required |

Listings failing the test are `pending`, `quarantined` (3+ temporary failures) or `unavailable`.

Why the published count plateaus (published → working demos → available, from the sync reports):

| Time (UTC) | Published | Working demos | Available |
|---|---|---|---|
| 16 Oct 13:09 | 18,639 | 53,398 | 63,312 |
| 17 Oct 07:01 | 31,222 | 54,921 | 65,823 |
| 18 Oct 04:45 | 32,804 | 58,176 | 69,298 |
| 18 Oct 22:30 | 36,688 | 60,865 | 72,012 |
| 19 Oct 07:07 | 35,614 | 61,622 | 73,625 |

Working demos grew by 8,000 in three days while published stayed near 36,000. The gap (26,000 on 19 October) is the repository-check rule.

**Why the two-day rule does not fit.** The repository check only proves the repository still exists and is public. A repository rarely vanishes within a week, and a visitor opens the demo, which has its own seven-day check. Keeping the rule means the public library can never be larger than the sync's two-day throughput, however much the sync improves.

Hidden for other reasons (17 October, not stale-only): about 6,000 listings have a demo that was never conclusively checked or has no screenshot (`demo_unknown+no_shot` 6,070; `demo_unavailable+no_shot` 3,622), 4,914 are quarantined and 3,891 unavailable. Browser reasons on 19 October included `empty_page` 1,913, `http_503` 1,259, `login_wall` 253 and `challenge` 122. That is a separate backlog (section 6, item 8).

## 3. Why long syncs add so few listings

Run #283, measured from the job log (23:45 → 00:59):

| Stage | Time | Productive? |
|---|---|---|
| `prepare` checkout of the repository tree (about 224,000 files, 8.35 GiB git packs) | 2:00 | no |
| Restore checkpoint data | 1:15 | no |
| `npm test && npm run test:mcp && npm run build` | 7:22 | no (code unchanged) |
| Cleanup recovery checkpoint save | 2:43 | no |
| Hugging Face + Hacker News/Bluesky intake | 2:00 | yes |
| Repository revalidation (750) + README candidates (1,500) | 6:05 | yes |
| Discovery checkpoint save | 2:46 | no |
| Save prepared catalogue artifact (1.08 GB, 240,181 files) | 5:06 | no |
| Browser shards (4 in parallel): checkout 2:00–2:40, artifact download 1:00–1:35, work 14–22 min | about 25 | work only |
| `refresh`: checkout 2:00, restore previews 2:47, artifact download 1:00, merge 0:15, completed-sync save 2:41, **diagnostics upload 8:41** | 18 | merge only |

Productive work is about 30 of 74 minutes. Runs are serialised by the shared `reposhelf-catalog` concurrency group, so overhead directly cuts the number of runs and checks a day (about 14, from the run history).

Discovery yield (`data/discovery-search.json`): 161 query partitions, 194,583 README inspections, 56,728 added (29%). The top partitions are broad low-star pools such as `"vercel.app" in:readme stars:1..9` (2,301 added) and `topic:github-pages stars:0` (1,435). Each can only be read to GitHub's 1,000-result limit, and the rotation averages 3.9 pages a query. The last run used 15 of its 40 search pages because the 1,500-candidate cap stops it first. Hugging Face intake inspected 346 spaces, added 34 and stopped on a rate limit; it sends no token.

## 4. File sizes

- Git: 8.35 GiB of packs; the current tree has about 224,000 tracked files: `dist/previews` 63,376 JPEGs (about 3 GB), `data/browse` 74,341 generated project files (871 MB, rebuilt by `build-browse-index`), `data/readmes` 74,230 files (442 MB), `data/context` 7,416.
- Every browser shard and the refresh job check the whole tree out again (about 2 minutes each, six times a run).
- The browser hand-off artifact is the whole `data/` folder plus catalogue JSON (1.08 GB, 240,181 files), uploaded once and downloaded by four shards. The browser shards need the catalogue and queue state, not generated browse files or README archives.
- The recovery artifact uploads `data/` and `dist/previews/` after every run for 7 days (about 9 minutes). `artifact-cleanup.yml` says the repository is private with a fixed storage allowance; it is now public (`private:false`), so confirm whether that allowance still applies.
- Serving: the browsing index covers 77,421 projects (116.6 MB of cards, 157.3 MB of search text, loaded on first query); public requests load only the published part. Cost per extra public listing is about 1.7 KB of cards (0.34 KB gzipped) plus about 2 KB of search text.

## 5. Public index size under a longer window (17 October data)

| Repository-check window | Public listings | Cards raw | Cards gzipped |
|---|---|---|---|
| 2 days (today) | 31,725 | 55.5 MB | 11.0 MB |
| 4 days | 33,941 | 68 MB (est.) | – |
| 5 days | 43,631 | 87 MB (est.) | – |
| **7 days** | **55,416** | **95.3 MB** | **18.9 MB** |
| 10–30 days | 55,428 | 111 MB (est.) | – |

Beyond seven days nothing is gained: after that, the demo check, not the repository check, is the limit. The search text grows by about 50 MB raw. Vercel Hobby's per-function size limit and the repository's bundle budgets (`npm run verify:bundles`) must be checked on a real build before the change is pushed to `main`.

## 6. Recommendations, ranked

| # | Change | Effect (estimate) | Effort / risk |
|---|---|---|---|
| 1 | **List repositories checked within 7 days; note the age when over 2 days** (built on the branch) | about +23,700 public listings on the 17 October data (31.7k → 55.4k); nothing newly shown if the demo, screenshot or repository check fails | small; policy change; bundle size to confirm |
| 2 | **Refresh more repositories per run, three at a time** (built on the branch) | 750 → 2,500 a run; about 35,000 a day (was about 10,500), plus about 10,000 a day refreshed as a by-product of reading README candidates; enough for a full 48-hour cycle of 74,000 listings | small; stays inside GitHub's per-minute limits (about 11 calls a second); stops at the first rate limit |
| 3 | **Refresh repositories through GraphQL, 100 per request** | all 74,000 listings in about 740 requests (minutes, a few hundred to about 1,500 points) instead of 74,000 REST calls | medium; needs a mapper from the GraphQL shape, rename and 404 handling, a 1,000-listing trial; GitHub's secondary limits to confirm |
| 4 | **Stop the test suite and full build on every sync** unless code changed since the last green run (`checks.yml` already runs on every push) | about 7 minutes a run | small; must keep the QA-07 stop on failed validation |
| 5 | **Upload recovery diagnostics only on failure, and only logs** (not `data/` and `dist/previews/`) | about 9 minutes a run | small |
| 6 | **Give browser shards only what they read** (catalogue JSON and queue state) and **sparse-checkout** them and the refresh job | about 5 minutes (artifact) and about 2 minutes (checkout) on the critical path | medium; test on the branch with `workflow_dispatch` |
| 7 | **Save one checkpoint, not three** (after cleanup, after discovery, after the sync) | about 3–6 minutes a run | medium; the recovery design (QA-07, checkpoint branch) depends on them |
| 8 | **Discovery**: raise the README budget from 1,500 to 3,000 a run; split the big pools by `created:` or `pushed:` windows to get beyond the 1,000-result limit; re-test back-off queries after splitting; send a free Hugging Face token | roughly +150–300 new listings a run (29% yield on 1,500 more inspections, about +2.5 minutes); steadier Spaces intake | small to medium; yield must be re-measured over five runs |
| 9 | **Stop committing generated data** (`data/browse`, 871 MB, rebuilt every build) and **keep previews out of the sync checkout** | smaller checkout and git growth | larger; do after 4–7 |
| 10 | **Browser backlog by reason**: retry `http_503`/`challenge` on a back-off, give `empty_page` a longer wait | recovers part of about 10,000 hidden-for-demo listings | medium; separate project |

Combined, items 4–7 should take a run from about 74 to about 45 minutes; with the same two-hour schedule and catch-up bursts that is roughly 14 → 20 runs a day (assumes the serialised queue is the limit, which the run history supports).

## 7. What is built on the branch

Branch `ccr-83bd8be2-e0le00`, not on `main`:

- **Listing window** (`dist/quality.js`, `dist/app.js`): `REPOSITORY_LISTING_DAYS = 7`, `REPOSITORY_FRESH_DAYS = 2`, `repositoryAgeDays`, `repositoryNote`; the detail page shows "Repository details were last refreshed N days ago" when older than 2 days. The featured and spotlight rules, the admin "Fresh repository checks" target (95% within 2 days) and X imports (`scripts/x-imports.mjs`) keep the strict two-day rule.
- **Refresh throughput** (`scripts/catalog-health.mjs`, `scripts/index-catalog.mjs`): cap 2,500 a run (`CATALOG_REVALIDATE_CAP` overrides), three checks at a time, stop at the first rate limit or 360-second budget, `checksPerDay` and `dailyCapacitySufficient` now use about 14 runs a day and the 48-hour interval.
- Tests: window and note (`catalogue-admission`), refresh plan (`catalog-health`, `popularity-growth`), evidence clock (`launch`), X freshness (`x-imports`).

Not built, because they change workflows or hosting and cannot be proven without live runs: items 3–10.

## 8. How to tell it worked (add to the sync log)

- Public listings and working-demo listings; the gap should fall from about 26,000 to a few hundred.
- Number of due repository checks and the oldest check's age; the due count should fall run on run.
- Listings by repository-check age (under 2, 2–7, over 7 days).
- Run time split: overhead against work.
- New listings per run, per 100 README inspections, per query partition.
- Public index size (gzipped) and first-query time.

## 9. Open questions

- Is the 7-day window right? Capacity after items 2–3 supports 2–3 days; seven leaves room for a three-day outage like 13–16 October. A shorter window can follow once the due queue is under control.
- Is the repository now public by choice? It changes the artifact and minutes assumptions.
- GitHub's secondary limits and GraphQL point cost should be confirmed with a trial before item 3.
