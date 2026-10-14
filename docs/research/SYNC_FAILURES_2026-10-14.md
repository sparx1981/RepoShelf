# Sync failures investigated on 14 October 2026

Two recent scheduled catalogue runs were inspected through GitHub Actions job steps and logs:

| Run | Failed stage | Evidence |
|---|---|---|
| [38528955151](https://github.com/sparx1981/RepoShelf/actions/runs/38528955151) | Validate catalog logic | `Cookie Policy lists the reposhelf.studio.resume.v1 storage key` assertion failed. |
| [38530057782](https://github.com/sparx1981/RepoShelf/actions/runs/38530057782) | Validate catalog logic | Same assertion failed; downstream discovery/enrichment steps were skipped. Browser shards still completed. |

The new Studio storage key was missing from `dist/cookies.html`. The policy now lists Studio resume settings and the UI component return key, and the policy test passes. This fixes the observed validation blocker; a complete successful production sync after publication is still needed to establish recovery.

The older run's refresh log also records checkpoint restoration from 09:01:39 to 09:41:12 UTC: 59,717 generated files restored, roughly 39 minutes 33 seconds. The workflow has a 45-minute refresh limit. The latest refresh was cancelled while its restore step was active; its job log could not yet be fetched (GitHub BlobNotFound), so its precise cancellation cause is not established.

`restoreCheckpoint()` previously launched a separate `git show` for each restored blob. It now selects the same conflict-approved paths, creates a temporary separate Git index, fills it with NUL-delimited index-info records, and lets `git checkout-index` restore the approved blobs in bulk. Newer main changes are still preserved. The real Git index is untouched, generated-path allowlisting remains and packed data is unpacked afterwards.

Verification: a native Git fixture restored 2,000 binary files with spaces in their names and preserved the original index byte-for-byte. The existing publication integration fixture was expanded with 250 restored records and real-index preservation. Node Git subprocess fixtures are blocked in this workspace; the end-to-end fixture must run in Actions. The broad npm test run also stops at a missing local Playwright browser. Targeted sync/API/security and Studio tests pass; these limits are not production pass claims.

The changed `/api/sync-log` function was traced and imported as an isolated production package: 1.91 MB, within the existing 30 MB lightweight-function budget, including `lib/sync-switches.mjs`. The full bundle verifier uses Node subprocesses that are blocked locally; this changed-function check ran its isolated import directly.

Publication change detection also compares binary/file identities from one raw staged diff instead of reading both blobs for every screenshot. Only the four public JSON feeds still need semantic reads/decompression. Internal generated metadata remains excluded; mode-only changes with identical blob IDs do not count as public content changes. This avoids moving the same per-file process overhead into the later publication stage.
