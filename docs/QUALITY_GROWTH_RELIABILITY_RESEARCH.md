# Research: catalogue quality, growth and reliability (20 October 2026)

Follows `docs/SYNC_IMPROVEMENT_RESEARCH.md`. Questions: what is wrong with the listings visitors see, why nobody is finding them, and what is fragile or costly to run. Limits as before: free GitHub Actions and Vercel Hobby, no new paid APIs.

Sources: the saved catalogue of **17 October 05:18 UTC** (66,039 listings; production now has 78,189), saved sync reports to 19 October, 526 GitHub Actions runs for 14–20 October, the production build log of the latest deployment, the production database (aggregate queries only, no personal data) and live HTTP checks.

## 0. Confirmed in production

The listing-window change from the last report is live. The 20 October production build says **"78,189 projects (65,544 published)"**, against about 36,000 published before. `verify-deployed-api` passes against production. The change worked and the build still fits (section 3).

## 1. Catalogue quality

Figures are for the 55,003 listings that were public on the 17 October snapshot unless stated.

| # | Finding | Size | Evidence |
|---|---|---|---|
| Q1 | **The same demo URL is shared by several listings.** 3,659 public listings share a demo with another, across 1,041 URLs. Largest groups: 62 listings point at the VS Code "Live Server" extension page, 57 at one Nuxt template demo, 49 at one personal site, 47 at one blog theme demo, 44 at Google's OAuth playground, 43 at Payload's docs. These are clones and forks of a template, or repositories whose "demo" is a tool or a documentation page. | 2,618 redundant listings if one per URL (4.8% of the library); 1,245 if three are allowed | duplicate count on the snapshot |
| Q2 | **About a fifth of the library is one source.** 10,936 public listings (20%) are Hugging Face Spaces. | – | host count |
| Q3 | **Weak text.** 11,392 (21%) have no author overview. 4,579 descriptions are under 30 characters. 9,645 (18%) have neither an overview nor a description of 60 characters. 26,910 (49%) have no licence detected. 937 overviews are rows of badge-link leftovers such as `[]( [](#contributors) [![…]`. 345 descriptions show raw emoji codes (`:books: Freely available…`). | see left | saved records |
| Q4 | **Categories are thin.** 27.2% are "Other", 62.7% are flagged for review, 61.5% have no subject. | 14,946 "Other" | `classification.method` is `local_rules` |
| Q5 | **The library is mostly small and idle repositories.** 44% have zero stars; only 2,468 (4.5%) have 1,000+. 35% (18,999) were last updated over a year ago and 12,400 over two years ago. Only 26,606 (48%) saw activity in 90 days. 8,189 have no stars and no update in a year. | – | `stars`, `updated` |
| Q6 | **About 10,000 listings are hidden because their demo could not be shown.** 3,575 return HTTP 404 (dead links; they should stay hidden and be checked rarely). The other 6,111 are "unknown": `empty_page` 1,691, `dns_not_found` 1,029, `http_503` 896, `challenge` 698, `network_or_timeout` 381, `login_wall` 199, `access_restricted` 199. | 4,914 quarantined (3+ failures) | `demoHealth`, `previewCheck` |
| Q7 | **Hosts that block our browser are counted as broken.** CodeSandbox (147) and CodePen (72) all fail with `challenge`; they work for people. 212 listings from one theme author's GitHub Pages site are 404. | ~220 | host breakdown |
| Q8 | **Hugging Face Spaces that are asleep or errored keep being retried.** I probed four failing Spaces with the free Space API: two are `SLEEPING` (the app host times out waking), one is `RUNTIME_ERROR` (HTTP 503), one is `RUNNING`. The API reports this stage for free; the sync only reads it when it re-checks a Space (100 a run, about eight days per cycle). 919 Space listings are hidden, 1,117 are quarantined. | up to ~1,100 | API probe, host breakdown |
| Q9 | **Retries are not bounded by evidence.** 4,496 of the 6,111 unknown listings already have 3+ failed attempts and are still scheduled again (3,946 due within 7 days). Each retry holds a browser slot for up to its timeout. | – | `previewCheck.consecutiveFailures`, `nextCheckAt` |

What is already good: every public listing has exactly one demo screenshot, 98% under seven days old, none from an outside provider.

## 2. Growth and visibility

| # | Finding | Evidence |
|---|---|---|
| G1 | **Almost nobody visits.** Production analytics for 3–20 October: 1–17 visits a day, about 51 distinct visitors in total, 4 demo clicks, 9 searches, 8 registered accounts. At this size nothing about the catalogue changes outcomes; being found does. | `analytics_daily`, `analytics_visitors`, `users` |
| G2 | **Google and Bing do not know the site.** No verification tag is served on the home page, `docs/INDEXING_SETUP.md` records that Search Console and Bing Webmaster Tools are not set up, and a web search for the site returns nothing from it (that search cannot use `site:`, so it is indicative, not proof). | live HTML, doc, search |
| G3 | **Only 5,000 pages can be found by a crawler.** The sitemap has 5,197 URLs: 5,000 project pages (7.6% of 65,544 public listings), 42 categories and the main pages. It has no `lastmod`. Generating them takes about 7 minutes of every deployment. | live `sitemap.xml`, build log |
| G4 | **X gives few listings for its cost and fragility.** 163 listings in total (0.3% of the library; 96% of them are public). The collector spends up to $0.50 a day, and the import has to queue behind the 70-minute catalogue sync: this week 13 import runs gave 1 success, 1 failure, 6 cancellations and 6 other. | `discoveredVia`, run history |
| G5 | **Curated lists convert best.** 736 listings from curated lists are 86% public, X 96%, Spaces 89%, GitHub search 82%. Search is the bulk (53,494) and the easiest to automate; curated lists and submissions are the highest quality. | source breakdown |

## 3. Reliability and running cost

| # | Finding | Evidence |
|---|---|---|
| R1 | **The sync is stable now.** Catalogue runs per day (success / failure): 14 Oct 0/11, 15 Oct 8/4, 16 Oct 11/4, 17 Oct 12/1, 18 Oct 13/0, 19 Oct 12/1, 20 Oct 9/0. The one failure since 17 October was the stalled-repository error fixed on 20 October. CI on `main` failed 32 of 43 runs, all between 14 and 17 October; the last five all passed. | run history |
| R2 | **A deployment takes 18–24 minutes; the Hobby limit is 45.** Latest build: clone 3:04, SEO pages 7:07, browse index 1:42, runtime metadata 1:06, output upload 1:54, build cache 2:13. Earlier builds took 17.7, 21.4 and 23.5 minutes. The clone and the SEO step are the largest parts and both grow with the repository and the catalogue. | build log, deployment times |
| R3 | **Git history grows 0.2–0.5 GB a day.** Each daily publication adds 194–457 MB of compressed objects (20 October: 457 MB; 18 October: 194 MB). Per publication: new previews 20–217 MB, `data/browse` 65–83 MB, `data/readme-terms` 46–52 MB (32 files rewritten each time), `data/catalogue-quality.json.gz` 13–15 MB, `data/readmes` 4–37 MB. Packs are 8.35 GiB after 17 days. GitHub recommends staying under 5 GB; at this rate that is 6–15 GB a month more. | `git diff-tree` on two publication commits |
| R4 | **The database is tiny and healthy.** Largest table 18 MB (UI thumbnails), 8 users, 184 retained analytics events. Nothing to optimise; leaked-password protection is still off (your action). | `pg_stat_user_tables` |
| R5 | **Actions use about 6,600 runner-minutes a week for the catalogue alone.** Free for a public repository; the `artifact-cleanup` workflow still says the repository is private. | run history, repository metadata |

## 4. Recommendations, ranked

| # | Change | Why / effect | Effort, risk |
|---|---|---|---|
| 1 | **Set up Google Search Console and Bing Webmaster Tools** (steps in `docs/INDEXING_SETUP.md`: add the property, copy one token into `REPOSHELF_GOOGLE_SITE_VERIFICATION` in Vercel, submit the sitemap) | Nothing else here helps while nobody can find the site. Free; needs your account. | 20 minutes; you |
| 2 | **Cap listings per demo URL** (e.g. three, keeping the most-starred and most recently updated) and list tool/documentation pages as non-demos | Removes 1,245–2,618 near-duplicates, better first impressions | small–medium; changes public count by about 2–4% |
| 3 | **Stop retrying listings after three failures except on a long back-off (30 days), and use the Hugging Face Space API's `runtime.stage` before opening a browser** (`RUNNING` → check; `SLEEPING` → one wake attempt; `RUNTIME_ERROR`/`BUILD_ERROR`/`PAUSED` → unavailable) | Frees browser time, separates "asleep" from "broken", fixes up to ~1,100 Spaces | medium |
| 4 | **Treat CodeSandbox, CodePen, JSFiddle and similar as platform hosts**: accept the demo on a working HTTP response and capture the screenshot with the optional provider | About 220 listings | small–medium |
| 5 | **Recency in ranking and a "recently active" filter**; boost listings with a licence, an overview and a recent update | 35% of the library is over a year idle; helps first impressions without hiding anything | medium |
| 6 | **Better categories**: use repository topics and language before "Other" | 27% "Other"; 62.7% flagged for review | medium |
| 7 | **Sitemap `lastmod`; grow the page count only after indexing is confirmed** (step 1); cache the generated social images between builds | The SEO step is 7 of 19 deployment minutes | small |
| 8 | **Stop committing files that can be rebuilt** (`data/browse`, about 65–83 MB a day; check `readme-terms` and `catalogue-quality` first, since the build reads them) and plan a history reset or move for previews | About 140 MB a day of avoidable growth; faster clone and deployments | larger; needs a staged trial |
| 9 | **Decouple the X import from the shared queue**, or pause the X collector until Search Console is live | 0.3% of listings for the most fragile chain | small |
| 10 | Items 3–7 from the sync report: GraphQL repository refresh, skip the test suite on unchanged code, trim artifacts | Faster runs | see that report |

## 5. Built on the branch

Both are display-only or sync-internal and tested; nothing hides or shows a listing differently.

- **Emoji codes in descriptions** (`dist/discovery.js`, `cleanDescription`): `:books: Freely available programming books` becomes `Freely available programming books`. Applied each time a repository is refreshed, so the 345 saved descriptions clear over one refresh cycle. Only standalone codes are removed (`10:30:45` and `key:value:` are untouched).
- **Badge-link leftovers in overviews** (`scripts/readme-overviews.mjs`, `scripts/enrich-overviews.mjs`): the extractor no longer keeps the empty link left behind when a badge image is removed, and listings whose overview already shows those leftovers are redone first (up to 100 GitHub and 40 Space overviews a run). I re-extracted all 935 affected saved READMEs with the fix: **893 now read as normal text, 30 have no usable overview, 12 are still imperfect**.
- Tests: `tests/discovery.cjs` (shortcodes) and `tests/overviews.mjs` (badge rows and image links). The full suite passes.

## 6. Caveats

- The listing-quality numbers are from the 17 October snapshot (66,039 listings); production is 78,189 and the shares will have moved a little.
- Traffic figures come from a small sample (51 visitors); they show "nearly none", not a rate.
- The search-engine check could not use `site:`; confirm with Search Console.
- Recommendations 2–9 change what is public or how the sync runs and have not been built. Nothing was pushed to `main` for this report.

## 7. Git growth in detail (follow-up, 20 October)

Measured on the nine publication commits of 13–20 October (3.6 GB of new compressed objects in eight days, about 0.4 GB a day):

| What | Share | Per day | Why it grows |
|---|---|---|---|
| Screenshots (`dist/previews`) | 50% | 100–300 MB | A new JPEG every time a demo is recaptured (about 3,300 existing images rewritten and 2,100 new ones a day; about 35 KB each). Once the backlog drains, every public listing is recaptured weekly: 65,000 × 35 KB ÷ 7 is about **330 MB a day**. |
| Browse index (`data/browse`, 78,000 files) | 19% | 65–85 MB | Output of `build-browse-index`, which the Vercel build runs again anyway. |
| Packed catalogue (`dist/catalog.part-*`, `spaces.part-*`) | 14% | 30–85 MB | 32 gzip files rewritten daily. |
| Search terms (`data/readme-terms`, 32 files) | 6.5% | 43–52 MB | gzip files rewritten daily. |
| Saved READMEs (`data/readmes`) | 7% | 4–52 MB | New and changed READMEs; needed. |
| Quality snapshot (`catalogue-quality.json.gz`) | 3% | 10–15 MB | One 15 MB gzip file rewritten daily. |

**The gzip packing is the main avoidable cost.** Git compresses and also stores a changed file as a small difference from its previous version, but a gzip file changes almost completely when any content changes, so no difference can be found. I stored two consecutive days of real files both ways in a scratch repository:

| File | Day-2 cost as gzip (today) | Day-2 cost uncompressed |
|---|---|---|
| `dist/catalog.part-05` | 1,484 KB | 132 KB (-91%) |
| `data/readme-terms/part-08` | 1,804 KB | 116 KB (-94%) |
| `data/catalogue-quality` | 14,860 KB | 2,156 KB (-85%) |

The first version costs the same either way. `lib/data-packing.mjs` uses gzip because the whole catalogue exceeded GitHub's 100 MB file limit; the catalogue is already split into 32 parts of about 7.7 MB raw, so parts can be stored uncompressed. The quality snapshot (114 MB raw) needs splitting into parts first.

Current checkout (what a fresh clone fetches): 3.6 GB in 235,000 files, 77% of it screenshots.

**Combined effect of the options, per day:** today about 400 MB, heading for about 650 MB as screenshots reach their weekly cycle. Stored uncompressed: -85 MB. Not committing the browse index and admin summary: -70 to -90 MB. Skipping recaptures that look the same: -100 to -250 MB. Together about 50-100 MB a day.

Not free: storing screenshots outside git. Supabase Storage (1 GB), Vercel Blob (1 GB) and similar free tiers are smaller than the 2.8 GB already held, and Cloudflare R2's free tier needs a payment method on file.

### Built on the branch (git-growth fixes)

1. **Packed catalogue and search terms are plain JSON** (`lib/data-packing.mjs`, `lib/readme-terms.mjs`). Parts are `dist/catalog.part-NN.json`, `dist/spaces.part-NN.json` and `data/readme-terms/part-NN.json` (largest 7.0 MB on the real catalogue). Gzip parts written by earlier runs are still read, and the next pack or shard write replaces them. The public-data pruning, the live check and the publication comparison know both names, so the raw catalogue still cannot be published. The quality snapshot stays gzip for now: it is read from the checkpoint branch at runtime and is 114 MB raw, over GitHub's file limit unless split.
2. **The browsing index is no longer committed** (`.gitignore`, 78,193 files removed from the index; the files stay on disk). The only thing the build read from it was the list of storefront screenshots needing small responsive copies, which is now `data/preview-wanted.json` (413 names, the same number the production build reports), written by each publication and never a reason to publish by itself. With the index absent, the build step still finds all 413.
3. **Recaptured screenshots that look the same are not saved again** (`scripts/preview-similarity.mjs`, used by `scripts/capture-previews.mjs`). Checked on 200 real rewritten screenshots: 69% differ by under 2 of 255 on average with under 1% of pixels changed (identical pages with different JPEG noise), and are kept; a page with a new banner (2.5 average, 1.6% of pixels) is not. The record still gets a fresh capture time.

Tests: new `tests/preview-similarity.mjs`; updated `data-packing`, `catalog-publication`, `sync-reliability`, `public-data` and `readme-terms`. Full suite passes (150 PASS lines) and `test:mcp` passes.

**Expected effect:** about 160-250 MB a day less in git once screenshots reach their weekly cycle. The saving from plain parts was measured in a scratch repository and should be confirmed after the first week of publications. The first publication after the switch adds about 100 MB once.

**Rollout:** merge, then watch the next sync's publication and the next Vercel deployment: the sync must write plain parts, the build must find `data/preview-wanted.json`, and the live check must still pass.
