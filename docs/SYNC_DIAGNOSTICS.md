# Understanding catalogue sync results

A successful workflow means its required steps completed. It does not mean new listings were added, or that every external demo loaded.

New reports include:
- The saved report phase: cleanup checkpoint, discovery checkpoint, or completed run. Checkpoint counts are provisional.
- Repository, demo-validation and screenshot coverage before and after the run.
- Why new discovery was enabled or paused, and the requested source batch sizes.
- Whether demo/screenshot browser work was due, skipped, or forced, and its next UTC window.
- For browser probes: due and selected totals, attempted checks, pages loaded, screenshots captured, remaining work, durations, reason counts and a bounded sample of public listing IDs to investigate.
- Partial probe progress saved during the batch, so a timed-out stage can retain useful debugging information.
- Stage results and publication status. Optional stages can fail even when GitHub labels the overall workflow successful.

## Zero additions or updates

Check the phase first: a cleanup checkpoint may report zero while later stages are still processing. The admin log labels these as provisional.

Discovery is intentionally paused while existing quality is below any of these gates:
- Repository checks: 95% of available demo listings.
- Conclusive demo checks: 95% of available demo listings.
- Current demo screenshots: 90% of visible demo listings.

When all gates pass, normal discovery batches automatically resume. There is no total-listing ceiling. A discovery batch may still find only already-indexed projects or encounter a source rate limit; additions are not guaranteed.

Browser work normally runs once per two-hour UTC window. A second push-triggered run in the same completed window can succeed while skipping screenshots. Its log now states that reason and the next window.

Screenshots may be deferred because of retry cooldowns, batch/time limits, inaccessible demos, HTTP errors, empty pages, blocked access or probe timeouts. Temporary failures preserve earlier data for retry. “Pages loaded” and “screenshots captured” are distinct outcomes.

If screenshot work is due but makes no progress, expand its debugging details and inspect the sampled listings and reason counts. For an immediate batch, check that no sync is active, then run **Refresh demo catalog** on main with **Refresh demo health and screenshots now** enabled. Normal per-listing retry cooldowns still apply.

## Storage and access

The admin sync log shows structured reports saved under `data/sync-runs/`. Older reports cannot acquire measurements they never recorded; missing values are shown as unavailable rather than invented.

GitHub Actions recovery artifacts retain raw logs and structured stage metrics for seven days. Diagnostic samples contain public listing IDs and bounded reason codes; they do not include access tokens or private account data. No database migration is required.
