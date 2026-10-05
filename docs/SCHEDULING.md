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

Discovery continues into a saved pending pool. Public browsing and agent search admit only available projects with a repository check within 48 hours, a working demo observation within seven days, and a captured screenshot matching the current demo URL. Temporary errors preserve recent successful evidence. Missing or expired evidence returns a project to pending admission; three consecutive failures quarantine incomplete entries for repair. Quarantine does not delete a record, and ordinary retry dates still apply. The admin quality workspace includes all saved entries and separate Published, Pending and Quarantined counts. Processing coverage targets remain visible and do not block new discovery. Featured eligibility continues to use its stricter checks.

A recovery workflow performs two targeted passes over missing evidence, preserving complete projects and respecting unsafe-address checks and explicit rate-limit backoff. Each pass has a shared 25-minute budget. Its report records per-pass attempts, reasons and net gains. Repeated inaccessible pages may still require manual review. Normal maintenance checks up to 80 failing GitHub listings per run for replacement links explicitly labelled as demos in the current README. A replacement is adopted only after the guarded browser loads it and captures an image; failed candidates preserve the original record.

Sync reports distinguish attempts and captures from net distinct screenshot gains, conclusive demo checks, working demos and publication-ready projects. Conclusive checks can identify broken demos; they are not a count of working applications. Recovery and normal syncs use the same concurrency group and save to the checkpoint branch, with no separate Vercel deployment per pass.
