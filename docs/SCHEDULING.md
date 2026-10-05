# Syncing, publication and independent recovery

Catalogue maintenance is requested every two hours. Each run saves accumulated generated data to `reposhelf-checkpoints`; this branch is excluded from Vercel deployments. Sync log and growth reports read the checkpoint branch without deploying. Repository availability is rechecked every 48 hours. Screenshot workers validate demos and capture images in one visit, running first with three workers and a twelve-minute budget. Remaining due demos use four workers and an eight-minute budget. Both queues continue while time remains, without a fixed entry cap. Completed results are checkpointed at most every ten seconds and flushed when the stage finishes. A forced termination can lose the most recent ten seconds of completed work. Temporary errors preserve prior evidence; three consecutive failures retry after 24 hours, instead of consuming every two-hour batch. Successful demos and screenshots are revisited after seven days; screenshots also refresh after repository updates. These are time budgets, not completion guarantees or catalogue ceilings.

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
