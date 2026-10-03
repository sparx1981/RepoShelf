# Catalogue sync reliability

The catalogue workflow runs every six hours. GitHub discovery, imports, revalidation and saved documentation happen first. A discovery checkpoint publishes the catalogue, sync report and growth snapshot before optional browser work. The final publication saves demo health, screenshots and the completed report.

Each demo runs in an isolated browser subprocess with a 35-second deadline (45 seconds for screenshots), and DNS checks have a three-second deadline. Demo-health work stops after eight minutes; screenshot work stops after six minutes. Deferred checks and temporary failures retain existing data for a later retry. Screenshots replace saved previews only after a completed successful capture.

Discovery includes zero-star repositories and alternates between recently updated and star-ranked search results. GitHub search quotas can pause discovery; the catalogue records the status and rate-limit headers and the report counts the temporary failure. Batch sizes limit work per run, not library size.

The admin sync log combines durable scan reports with GitHub job results. It distinguishes a cancellation before a runner started, an interrupted step, and confirmed catalogue publication. Counts describe the scan; a failed publication does not prove those changes reached the live catalogue. GitHub may replace pending requests even with `cancel-in-progress: false`; this does not cancel a currently executing scan.

Publication rebases generated changes over newer source commits and retries push races. A conflicting generated-data update stops publication without overwriting remote files. Recovery artifacts retain the generated catalogue, README/context snapshots, screenshots and stage logs for seven days. Inspect the failed stage in GitHub Actions, download the recovery artifact if needed, resolve a generated-data conflict against current main, and rerun the latest workflow. Never force-push an old catalogue over main.

An overall cancelled run can still have saved catalogue changes if its final publication succeeded. An older run without a saved report cannot reliably reconstruct exact record or demo counts; the UI leaves those values unknown.
