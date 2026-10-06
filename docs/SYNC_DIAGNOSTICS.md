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

The admin sync log reads the latest `data/sync-runs/` reports directly from the non-deploying `reposhelf-checkpoints` branch, with deployed reports as a fallback. Logs can update without a site deployment. Older reports cannot acquire measurements they never recorded; missing values are shown as unavailable rather than invented.

GitHub Actions recovery artifacts retain raw logs and structured stage metrics for seven days. Diagnostic samples contain public listing IDs and bounded reason codes; they do not include access tokens or private account data. No database migration is required.

## Saved to GitHub versus live deployment

A successful catalogue sync saves its generated files to GitHub. Vercel must then deploy that commit before the public site sees them. The admin log separately shows the latest Vercel commit status, including blocked, pending or unknown states. A successful GitHub run must not be taken as proof that the live site has the new catalogue.

Recovery checkpoints are saved on the **reposhelf-checkpoints** branch, not main. `vercel.json` disables automatic deployments for that branch using `git.deploymentEnabled`; this also prevents checkpoint preview deployments. The ignored build command is retained as a fallback for older checkpoint commits, but is not the mechanism used to reduce deployment requests.

The workflow restores unpublished generated files from its checkpoint before scanning. It only restores a file if main has not independently changed that file since the checkpoint baseline. Newer source and catalogue changes are preserved; conflicting files remain available in checkpoint history and the recovery artifact. Checkpoints never move the working main branch.

A finished catalogue sync saves to the checkpoint branch with status **awaiting_publication**. The daily or manual publisher pushes to **main at most once**, then saves its final publication receipt to the checkpoint branch. If only logs, the browser-cycle marker, derived indexes, library-growth snapshots or internal attempt timestamps changed, main is not pushed and no production deployment is requested. Repository/demo freshness, stars/forks/history, demo status, moderation, descriptions, saved documents and preview changes still count as public updates. Administrator library-growth history can also read the checkpoint snapshots without deploying.

A main push still requires Vercel to deploy successfully. This change reduces future requests but cannot reset an allowance already exhausted. After Vercel's allowance resets, redeploy the latest main commit if it remains blocked. Normal source changes continue to deploy immediately. Repository submissions accumulate on the checkpoint branch for daily or manual publication. No Supabase migration or manual branch setup is required; the in-app publication button and independent timer require the credentials described in SCHEDULING.md.

## Daily publication

Maintenance and submission scans now save generated changes to the checkpoint branch. The final sync state is `awaiting_publication`; no production deployment is requested by the scan. A separate daily workflow at 06:35 UTC, or administrator Publish now, restores accumulated changes and publishes them once. Completed publication reconciles waiting sync reports to `main_saved`. See [SCHEDULING.md](SCHEDULING.md) for setup, independent timer integration and limits.

## Failed-run recovery

The watchdog requests the first retry of a failed or timed-out workflow after 30 minutes, even if an earlier successful run is still recent. Consecutive failures back off to 60, 120, then 180 minutes; successful runs reset this sequence. Active or queued catalogue jobs prevent another request, and history is checked again immediately before dispatch. Cancelled runs retain the three-hour cooldown.

Missed schedules still use the three-hour allowance. The watchdog itself runs on GitHub Actions, so a delayed GitHub scheduler can delay both maintenance and recovery. This is not an independent availability guarantee.

“Checks awaiting retry” counts individual inconclusive demo, screenshot or source checks. It does not represent a failed workflow or failed publication. Consult the run status and stage results for those failures.

## Run duration

Each run in Administration → Sync log shows its duration beside the status: finish time minus start time for completed runs, and "Running for" with elapsed time (refreshed with the 30-second auto-refresh) for active runs. Queued or waiting runs show "Not started". The finish time is GitHub's last update to the completed run, so cancelled and failed runs show how long they ran before stopping, and a re-run or later edit to a run can lengthen the figure slightly. Runs with an unusable start or finish time show "Not recorded".
