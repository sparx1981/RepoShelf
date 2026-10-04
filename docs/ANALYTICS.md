# Analytics behaviour and checks

Visitor statistics count eligible visitors, including consenting signed-in members and consenting guests. Administrator activity and the admin workspace are excluded on both the client and server. Browser Do Not Track and Global Privacy Control signals override consent. Turning off consent clears queued events. Functional likes, verified forks and private viewing history are independent of analytics consent.

Listing opens, successful demo/fork navigation attempts, searches and page views enqueue unique event IDs. Consented events that happen before account readiness wait until identity and legal requirements are known; they are discarded if the visitor turns out to be an admin or tracking is disabled. Events before consent are never backfilled. Temporary network failures, timeouts and HTTP 429 throttling preserve IDs for retry, so database idempotency prevents duplicate counting. Valid discovered project IDs can be recorded before the canonical catalogue saves that project.

Admin Analytics refreshes every 60 seconds while visible and has a manual Refresh stats button. It displays when stats were refreshed, when the last eligible visitor event reached storage, and whether the Supabase server key can read analytics storage. A configuration/migration failure appears as a diagnostic notice. This read-only check does not fabricate visitor activity or write test events to production.

Node tests cover consent, privacy signals, early views, admin exclusion, rate-limit retries and discovery IDs. GitHub Actions tests the real PostgreSQL migrations and ingestion/aggregation RPCs. Authenticated production diagnostics run when an administrator opens Analytics; private production sessions and credentials are not available to local tests.
