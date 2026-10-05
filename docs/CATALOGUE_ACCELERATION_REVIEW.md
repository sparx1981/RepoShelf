# Revision 2 implementation review

Reviewed the plan on `ccr-7fe988d8-jurp40` against main `c4dcc831` on 5 October 2026.

## Implemented

- GitHub: 1,500 README candidate inspections and up to 40 search pages per run. Keep at least 4.5 seconds between search requests and persist primary/secondary-limit cooldowns. These are per-run work budgets, never a catalogue storage ceiling.
- Expanded discovery domains/topics, persisted per-query inspections, demo findings, genuinely new records and empty-run history. Productive queries can advance to another page in the same run; three zero-addition visits defer a query for seven days, then explore it again. New queries still get their turn.
- Spaces: 350 inspections, SDK allowlist (`gradio`, `streamlit`, `static`, `docker`) and minimum two likes for new intake. Follow multiple pages with a persisted exact cursor; no more than four concurrent checks, 15 pages or five minutes per intake stage. Existing low-like records are retained and revalidated. Runtime metadata is evidence to inspect, not a substitute for a working demo and screenshot.
- Four separate browser runners, maximum four browser workers each. One workflow setting drives the matrix, partition, reported concurrency and live progress. Partition by demo hostname so listings on the same host stay on one runner and retain serial visits; Spaces use their native app host. Successful partial results still merge even if another runner fails.
- Preflight skips refused connections, 5xx responses and explicit Cloudflare challenge headers. NXDOMAIN, certificate errors and explicit challenges receive 30-day backoff after two failures. Temporary DNS resolution errors and timeouts remain short retries. No challenge bypass.
- Conservative short-page title/text rejection for server error pages, missing pages, access challenges, login walls and blocking cookie walls. A ordinary app mentioning login, errors or cookies is not rejected solely for those words.
- Existing successful saved preview approval paths accept provider-suffixed filenames consistently; optional providers remain disabled by default. No automatic enabling or paid provider requests were introduced.
- A separate 30-minute launch scheduler checks whether to dispatch a real catalogue run, without adding idle checks to Sync log: normal processing remains every two hours at even hours :17 UTC. Additional :17/:47 runs are admitted only while fewer than 5,000 quality-ready published listings exist. Limit 24 **extra** runs per rolling 24 hours, on top of normal maintenance. Pause acceleration for six hours after three runs without published-count gains. Missing/stale coverage fails closed for extra runs; normal and manual runs remain available. GitHub may delay cron triggers.
- Routine processing still saves to the checkpoint branch, without deploying each sync. Daily publication remains 06:35 UTC; manual Publish now remains available. On a successful run reaching the initial 5,000 milestone, publish once and record that completion. Growth beyond 5,000 continues on the normal schedule.
- Growth records published counts by source; sync stages include per-source and per-query yield, cache hits, errors and genuinely new additions, distinguishing metadata refreshes from expansion.
- At the milestone, generate a random 100-listing visual-review manifest, deliberately reserving 40 Spaces and 40 low-star GitHub listings where available. Entries start **pending**, not reviewed. Saved under `data/launch-review/` and retained with workflow artifacts. Do not declare public launch based only on automated checks.

## Deliberately conditional recommendations

**GraphQL:** deferred. It has primary point accounting but secondary abuse protection still applies. A separate REST-independent budget is not a guarantee of more safe throughput. First measure the widened REST rotation over five consecutive runs before introducing another query transport.

**Archive splitting:** deferred as the plan itself recommends only if checkpoint size/runtime becomes a problem. Moving unavailable/quarantined records needs coordinated restoration, agent context, moderation, saved selections and retry readers. It is unnecessary to improve current discovery and risks silently losing retry candidates. Public browsing already uses the compact index and strict admission, rather than downloading this full worker file.

**Manual 100-listing review:** the sample workflow is implemented, but an actual visual review is a launch gate and remains pending. Open each demo and its screenshot, check that the interface is functional and representative, note broken/error/wall pages, then exclude/report failures and request repair. Record sample ID, date, reviewer outcome, and reasons in a follow-up document before declaring launch.

## Measurement, not promises

The plan's 350–400 published additions per run and 4–6-hour completion estimate are hypotheses. Search overlap, Hugging Face API latency, available runnable Spaces, quality rejection, host throttling and GitHub scheduler delays all affect yield. `raw.githubusercontent.com` does not consume REST API points but can still throttle or fail; README failures must retain old data. Review five successive syncs for new published gains, Spaces acceptance, search cooldowns, browser captures, and time-budget deferrals. Tune budgets from these receipts.

No new migration or API key is required for this revision. Optional providers still require migration 13 and explicit admin setup if used later.
