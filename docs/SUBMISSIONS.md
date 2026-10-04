# Free repository submissions

Signed-in members open **Submit repository** from the account menu. Paste a public GitHub repository URL or `owner/repository`. This is free, requires a public demo link in the README or repository homepage, and is separate from promotion. It neither verifies ownership nor guarantees placement. Existing submissions are reused rather than duplicated; private/deleted repositories are labelled unavailable, and temporary errors automatically retry.

Requests and scan results live in Supabase and follow users across devices. Only public repository metadata, README snapshots and a generic source label are committed to the catalogue. Account IDs, queue records and lease tokens are never committed. New README data enters the existing agent API/MCP; scheduled enrichment and preview capture follow normally.

## Activation (required once)

1. In your Supabase project SQL Editor, run `supabase/migrations/202610030007_repository_submissions.sql` after migrations 1–6. Apply only migrations you have not already run.
2. Generate a private random value of at least 32 characters. Set **the same value** as `REPOSHELF_SUBMISSION_SYNC_KEY` in Vercel → RepoShelf → Settings → Environment Variables → Production, and GitHub → sparx1981/RepoShelf → Settings → Secrets and variables → Actions → New repository secret. Never put the value in source, browser configuration or a public issue.
3. Redeploy Vercel so the new environment setting takes effect.
4. In GitHub → Actions → **Scan submitted repositories**, choose Run workflow. Submit a repository through RepoShelf, rerun the workflow and check its status on the submission page.

The worker is scheduled every 15 minutes. GitHub can delay scheduled jobs; a running catalogue sync also takes priority through the shared concurrency lock. Twenty requests are processed per batch. This is a throughput limit, not a maximum catalogue size. If configuration is incomplete, the UI explains setup is pending and blocks new submissions.

## Optional immediate scan requests

Create a fine-grained GitHub token scoped to **sparx1981/RepoShelf only**, with **Actions: Read and write**. Set it as `REPOSHELF_SUBMISSION_WORKFLOW_TOKEN` in **Vercel Production only**, then redeploy. No repository contents write permission is needed for dispatch. GitHub's built-in workflow token publishes the catalogue from the workflow itself. New submissions request the scan immediately; dispatch failures preserve the queue for the scheduled worker. Existing imports and repeated submissions do not dispatch another run. Never reuse users’ GitHub sign-in tokens for this.

## Reliability and privacy

Repository URL validation rejects non-GitHub URLs, credentials, file URLs and unexpected query parameters. Public status is confirmed server-side. CSRF/origin and verified GitHub identity checks protect submissions. Limits allow ten new requests per account each day; unavailable requests can be resubmitted after an hour. Members can read only their own queue; administrators can read it through database policy. Only the server service role can enqueue/claim/complete requests.

Leases stop concurrent workers claiming the same request. A failed worker’s lease expires after 45 minutes. The worker imports using the existing discovery/README pipeline and publishes the catalogue before confirming an import. If publishing or confirmation fails, the lease expires and the next scan safely retries. Repository 404/410 responses mean unavailable; rate limits, authentication errors and network/server errors mean retry. Saved catalogue entries are retained during errors. The publication commit is recorded for imported entries. Live deployment may take a few minutes after publication.

The account page loads history in pages, without deleting older requests. Submission workflow logs are in GitHub Actions; private per-request status, attempt count, and last check are on **Your submissions**. No API key is required from the submitting user. No user GitHub credentials are exposed to the workflow.
