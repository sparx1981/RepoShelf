# Syncing, publication and independent recovery

Catalogue maintenance is requested every two hours. Each run saves accumulated generated data to `reposhelf-checkpoints`; this branch is excluded from Vercel deployments. Sync log and growth reports read the checkpoint branch without deploying. Repository availability is rechecked every 48 hours. Reusable browser workers validate demos and capture images in one visit, with a fresh isolated browser context for every listing. Browser processes recycle after 50 visits; a hung worker’s entire process group is killed and replaced. Worker environments exclude credentials. HTTP and WebSocket destinations must pass the public-network checks; service workers and downloads remain blocked. Public WebSockets are allowed so interactive demos can finish loading. Blank pages get up to eight additional seconds to render, including visible content inside open Shadow DOM. Entries previously labelled empty receive one fresh attempt when the probe version changes; other retry dates remain in force.

The screenshot and demo queues share **25 minutes** (15:10 allocation while both have work); an empty queue lends capacity to the other. The scheduler visits each listing once, preferring screenshot-plus-validation over a separate demo-only visit. Concurrency starts at two and adapts between one and four, based on measured available memory, system load and a rolling sample of worker timeouts/errors. Access challenges and unavailable demos are not treated as resource pressure. Browser metrics record concurrency changes, memory source, worker starts/restarts and per-queue worker time. These observations, not worker count alone, should guide further increases.

Every sync checks current eligibility; another completed batch in the same two-hour window does not suppress untouched work. Recently attempted listings retain their individual two-hour cooldown and retry dates. Missing validation and screenshots come before routine refreshes, with administrator requests and new broken-demo reports prioritised. Repeated failures remain in the retry queue and receive administrator review guidance; nothing is automatically removed just for temporary failures. DNS errors and unsafe/private targets are reported separately.

Aggregate live progress is written about once per minute to the small `reposhelf-progress` branch. This branch and `reposhelf-checkpoints` are excluded from Vercel deployment. No user data, credentials, demo URLs or raw browser output are written to the progress branch. Administration → Sync log refreshes every 30 seconds while visible and matches progress by run ID and attempt. Counters older than two minutes are labelled stale; unavailable progress does not interrupt catalogue work. The final saved report remains authoritative.

Completed results are checkpointed at most every ten seconds and flushed when the stage finishes. A forced termination can lose the most recent ten seconds of completed work. Temporary errors preserve prior evidence; three consecutive failures retry after 24 hours, instead of consuming every two-hour batch. Successful demos and screenshots are revisited after seven days; screenshots also refresh after repository updates. These are time budgets, not completion guarantees or catalogue ceilings.

`Publish saved catalogue` runs at **06:35 UTC daily**. It restores the latest accumulated generated files onto current main, preserves newer independently edited main files, rebuilds the browsing index and publishes only when public content changes. A durable daily marker prevents repeated scheduled publication on the same UTC day. Failed publication does not advance that marker. Manual publication remains available after the daily publication; application source changes deploy normally.

In **Administration → Sync log**, use **Publish now**. This requests a publication workflow, not an immediate completed deployment. An active sync, submission scan or publication prevents another request. Refresh and inspect publication history and Vercel status afterward. If the server Actions token is absent, the linked GitHub workflow's **Run workflow → main** remains usable; leave the scheduled checkbox off for manual publication.

## Enable the in-app button

1. In GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens, create a token restricted to **sparx1981/RepoShelf**.
2. Grant **Actions: read and write** (Metadata read is automatic). No Contents write permission is required: the dispatched workflows use their own scoped Actions tokens to save data.
3. In Vercel → RepoShelf → Settings → Environment Variables, add `REPOSHELF_ACTIONS_TOKEN` to Production. The existing `REPOSHELF_SUBMISSION_WORKFLOW_TOKEN`, if configured with these permissions, is also supported.
4. Redeploy once to apply environment changes. Keep the token private and note its expiry date; replace it before expiry.

## Independent timer

The endpoint is implemented; a GitHub watchdog is also retained as fallback. An external timer must be activated separately. Neither an endpoint nor a configured secret proves an external timer is running.

1. Generate a separate random secret of at least 32 characters. Add it as `REPOSHELF_SCHEDULER_KEY` in Vercel Production, then redeploy.
2. In an external scheduler such as cron-job.org, create a job for `https://reposhelf.vercel.app/api/maintenance` **every 30 minutes**.
3. Set method **POST**, header `Authorization: Bearer YOUR_SCHEDULER_KEY`, and a request timeout of at least 30 seconds. The GitHub Actions token stays in Vercel and is never given to the timer. Do not put either secret in the URL or job logs.
4. Enable the scheduler's notifications for repeated non-success HTTP responses and failed executions. This requires the scheduler's notification configuration; RepoShelf does not send email alerts itself.
5. Run the timer once. HTTP 200 means no action is currently needed or a workflow is active; HTTP 202 means a workflow was requested. HTTP 401 indicates the scheduler header is wrong; HTTP 503 indicates missing configuration or unavailable GitHub access. Inspect GitHub Actions to confirm completion after a 202.

The timer prioritises a due daily publication after 06:35 UTC. Otherwise it requests catch-up maintenance when no successful sync has completed within three hours, or retries a failed workflow after its backoff. First failure retries after 30 minutes; consecutive failures back off to 60, 120 and at most 180 minutes. Active workflows prevent overlapping requests, history is rechecked before dispatch, and ambiguous POST failures are never blindly retried. GitHub Actions runner availability and third-party demo availability remain dependencies.

## What visitors see

Scans and submission imports accumulate in the saved catalogue before appearing on the deployed storefront. Submission status means imported into the saved catalogue; visibility follows the next daily or manual publication. Current storefront content, public API project data and screenshot assets remain a consistent deployed snapshot. Administrator sync reports and growth history may be newer. Last successful sync, last catalogue publication and deployment completion are distinct states.

## Admission and repair

Discovery continues into a saved pending pool. Public browsing and agent search admit only available projects with a repository check within 48 hours, a working demo observation within seven days (both judged as of the catalogue snapshot time, not each visitor's clock, so the public count does not shrink between daily publications; a snapshot older than 72 hours falls back to the real clock), and a captured screenshot matching the current demo URL. Temporary errors preserve recent successful evidence. Missing or expired evidence returns a project to pending admission; three consecutive failures quarantine incomplete entries for repair. Quarantine does not delete a record, and ordinary retry dates still apply. The admin quality workspace includes all saved entries and separate Published, Pending and Quarantined counts. Processing coverage targets remain visible and do not block new discovery. Featured eligibility continues to use its stricter checks.

A recovery workflow performs two targeted passes over missing evidence, preserving complete projects and respecting unsafe-address checks and explicit rate-limit backoff. Each pass has a shared 25-minute budget. Its report records per-pass attempts, reasons and net gains. Repeated inaccessible pages may still require manual review. Normal maintenance checks up to 80 failing GitHub listings per run for replacement links explicitly labelled as demos in the current README. A replacement is adopted only after the guarded browser loads it and captures an image; failed candidates preserve the original record.

Sync reports distinguish attempts and captures from net distinct screenshot gains, conclusive demo checks, working demos and publication-ready projects. Conclusive checks can identify broken demos; they are not a count of working applications. Recovery and normal syncs use the same concurrency group and save to the checkpoint branch, with no separate Vercel deployment per pass.

### Balanced growth and browser work

Discovery now persists its next query and per-query page in `data/discovery-search.json` on the checkpoint branch. Runs rotate demo terms, technology topics, star ranges, low-star creation years and recent projects, continuing to page 10 where GitHub exposes results. Each run requests up to 12 search pages, paced at least 4.5 seconds apart. Primary and secondary throttles save a cooldown (honouring Retry-After); subsequent runs retain the query without repeating requests during that cooldown. Fresh unchanged cached matches no longer rewrite existing repository observations.

Candidate budgets per sync are 250 GitHub README inspections, 25 new Spaces, 40 curated candidates and 20 community candidates. These are per-run work budgets, not catalogue ceilings. Seven curated lists rotate fairly even when an overridden batch cannot visit them all. Sources still require explicit demos, and public admission still requires fresh repository evidence, a working demo and a captured screenshot.

Normal browser checks share available worker time between admission (weight 6), maintenance (3) and repeated repairs (1). New reports and administrator refresh requests are urgent admission work. Empty lanes lend their time to the others; dedicated recovery passes keep their explicit recovery policy. Repeated restricted/unsafe/unresolved-domain failures back off for seven days; network/empty-page failures retry daily after three failures and every three days after six. Changes to rendering logic permit one extra empty-page retry, while rate-limit cooldowns remain intact.

Slow previously empty demos and Spaces receive a bounded extra render wait. Screenshot capture disables animations and the caret and retries a capture failure once with CSS scaling. Every navigation/subresource/socket still goes through the public-address guard. Captchas and access controls are never bypassed, and a failed capture never replaces a saved good screenshot. Sync browser metrics include lane selections and worker time so the balance can be audited.

## Parallel capture acceleration

Normal catalogue runs now prepare discovery and revalidation once, then split browser work between **two independent runners** using a stable SHA-256 partition of each listing ID. Each has up to four isolated browser processes and a 25-minute shared browser budget. Preparation, captures, and merge remain under the single workflow-level `reposhelf-catalog` lock. Merge has no second lock that could deadlock the parent workflow. Successful field patches and images from an interrupted runner are retained; missing or failed shards mark the run incomplete rather than green. URLs changed since preparation are preserved instead of overwritten. Live counters combine both runners; a stale worker heartbeat is explicitly stale.

An optional **Run workflow → recovery_passes → 2** in GitHub Actions runs two bounded passes on the existing eligible queues. A second pass continues untouched work; it does not override server rate limits, unsafe targets or listing cooldowns. It is not an unlimited burst. Scheduled runs use one pass. Run reports count successful distinct captures separately from attempts and refreshed metadata. Data still waits for daily publication at 06:35 UTC or admin **Publish now**.

A cheap GET/DNS/TLS preflight precedes Chromium. Resolved public addresses are pinned to the connection, and redirects are checked individually. DNS/TLS failures remain temporary; timeouts and forbidden HTTP responses still get the browser because a plain HTTP probe is not definitive for JavaScript apps. Visits to the same host are serialised within each runner. Repeated restricted, DNS and TLS failures use a 30-day retry after four consecutive failures; admin refresh can request an earlier attempt. These listings remain stored for repair. Blanket shorter rendering timeouts are intentionally avoided.

Repository checks save ETags and send `If-None-Match` only against previously confirmed public repositories at the same API resource. A valid 304 refreshes availability evidence while retaining metadata. Unexpected 304 responses cannot revive unavailable repositories. Metrics show `repositoryNotModified` separately. Browser downloads are cached by the exact Playwright version; worker isolation is verified on each runner. Full application and database QA remains in the Check application workflow and application logic checks remain in preparation.

## Optional free screenshot providers

Apply **migration 13**, `supabase/migrations/202610050013_capture_providers.sql`, in the Supabase SQL editor. Then open **Administration → Catalogue quality → Optional screenshot providers**. Providers are disabled by default, and regular browser checks need neither this migration nor provider keys.

Add credentials as **GitHub repository → Settings → Secrets and variables → Actions** secrets:

- ScreenshotOne: `SCREENSHOTONE_ACCESS_KEY` from a dedicated free account. Enforced cap: 100 request attempts per UTC calendar month.
- Thum.io: its free URL API needs no key. Optionally add `THUMIO_KEY` and requests use the authenticated `/get/auth/<key>/` URL instead (the key is part of the request URL, so keep it restricted to your Thum.io account's allowed use). Enforced cap: 1,000 request attempts per UTC calendar month. No paid-only options are used.
- Cloudflare Browser Run: `CLOUDFLARE_BROWSER_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; token must allow Browser Run for that account. Enforced cap: 10 request attempts per UTC day, conservatively reserving 60 seconds each against the 10-minute free allowance. The HTTP request has a 45-second deadline and navigation a 30-second deadline.

Use dedicated free accounts, keep provider billing disabled, and account for any use outside RepoShelf. RepoShelf's counters track its own attempts, including failures; they cannot see external use or changes to a provider's pricing. These are hard application safety caps, not purchased quotas. No paid plans or proxies are automatically enabled. Official references: [ScreenshotOne](https://screenshotone.com/pricing/), [Thum.io API](https://www.thum.io/documentation/api/url), [Cloudflare](https://developers.cloudflare.com/browser-run/pricing/).

Before enabling providers, generate a random secret of at least 32 characters and save the same value as `REPOSHELF_SUBMISSION_SYNC_KEY` in **Vercel Production environment variables and GitHub Actions secrets**, then redeploy once. If this shared key is already configured for submissions, reuse it rather than replacing it. The settings panel reports missing worker configuration. Workers use `REPOSHELF_SUBMISSION_SYNC_KEY` to read enabled settings and reserve a request atomically. Missing keys, unavailable settings and exhausted allowance skip providers safely. Configured-key status is reported after each sync; toggles take effect on the next run. Administrator updates use optimistic revision checks. Keys are never stored in Supabase, catalogue records, screenshot URLs or logs.

Fallback is limited to missing captures whose demo independently passed a fresh working check. Images alone never establish a working demo. A run attempts at most ten provider requests within three minutes. Images are downloaded, checked for invalid or almost uniform captures, compressed and retained in the checkpoint, with provider provenance. **Catalogue quality → Provider screenshot awaiting review → Approve preview** queues approval for the next sync. Approved images enter browsing only after normal quality admission and publication. No provider is called on visitor page loads. Review can still catch challenges or incorrect app screens that pixel checks cannot.

## Growth milestones, not record ceilings

Catalogue quality shows progress towards the **first 5,000 published quality-ready listings**. Pending and quarantined references do not count. The counter can exceed 100% and intake never stops at 5,000. There is no total-record cap. Per-run time, concurrency, free-provider allowance and GitHub rate limits remain operational budgets. Growth snapshots now retain `published` counts; older history without this field remains unknown rather than reconstructed.

## Compressed catalogue files

GitHub rejects any file over 100 MB, and the saved catalogue passed that size (105 MB in October 2026), which stopped every sync from saving its results. The four largest generated files are now stored in Git compressed (`dist/catalog.json.gz`, `dist/spaces.json.gz`, `data/browse/index.json.gz`, `data/catalogue-quality.json.gz`), about six to ten times smaller. Scripts still read and write the plain JSON files, which are not tracked by Git.

- `node scripts/data-packing.mjs unpack` recreates the plain files after a checkout. Every workflow runs it right after checkout and `npm run build` runs it first, so deployments are unchanged.
- Publishing and recovery checkpoints pack the files automatically before staging, and compare the unpacked content, so unchanged data never publishes.
- Locally, run `node scripts/data-packing.mjs unpack` after cloning. `--force` replaces plain files you already have.
- `tests/data-packing.mjs` fails if a tracked file approaches 100 MB or a workflow checkout lacks the unpack step.

The deployed functions also bundle the plain files (`vercel.json` `includeFiles`), about 350 MB in total today and growing with the catalogue. Watch Vercel's function size limit as the catalogue grows.
