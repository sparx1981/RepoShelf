# Popularity growth analytics

Administration → Analytics now includes **Fastest growing on GitHub**. The default ranks the same measured score used by the Trending storefront, across visible available GitHub projects with usable demos. Technology, category and hide-seen filters on the storefront can narrow its pool; this administrator leaderboard covers the complete eligible pool. Hugging Face Spaces are excluded because Space likes are a different signal.

Rank by Trending score, stars gained per day or forks gained per day. Each ranking returns at most 20 projects by default, plus the total qualifying count. Expand a project for gains, totals, observation dates, score and saved star/fork history. The charts use actual timestamps and may contain gaps or decreases; lines do not imply daily checks. History is retained for 35 days.

The score is `0.7 * ln(1 + positive star gain / days) + 0.3 * ln(1 + positive fork gain / days)`. A baseline nearest seven days before the latest successful observation must be 1–9 days old. That latest observation must be no older than 48 hours. No baseline means no measured rank. Lifetime popularity, watching counts, RepoShelf visits, likes, demo clicks and payments are not inputs. The visitor date-range control does not change this observation window.

Coverage displays eligible projects, successful observations within 24 hours, usable growth windows, growing projects, stale or missing observations and projects awaiting a baseline. Temporary failures keep the last successful counts and history, flag a pending retry, and do not create an observation. Entries older than 48 hours stay out of this leaderboard until refreshed.

## Daily refresh target

The existing two-hour catalogue workflow updates stars/forks when revalidating repositories. Counts are lightweight metadata checks; they do not require re-running the demo, taking a screenshot or downloading a README.

Repository checks become due after 22 hours, leaving one two-hour scheduling interval for a rolling 24-hour target. Selection remains oldest-attempt-first and respects delayed retries. The automatic batch aims for at least 500 checks or one tenth of the stored GitHub catalogue, whichever is larger, subject to a 750-request batch safety limit, available GitHub core API allowance minus a 200-request reserve, and a six-minute revalidation time budget. The batch limit protects each run; it does not cap catalogue size. If allowance cannot be inspected, an authenticated run retains the conservative 500-check limit. Actual rate-limit/authentication responses stop checks promptly and preserve entries.

At 500 checks every two hours, nominal capacity is 6,000 checks/day. At 750 it is 9,000. Scheduled triggers, failed requests, retry delays and runtime budgets can lower actual coverage. The sync debugging details expose selected, due and remaining checks, the API budget, the number observed within 24 hours and whether nominal capacity covers the current catalogue. If the catalogue outgrows this budget, add API capacity or revise batching rather than cap the library or pretend stale records are fresh.

`GET /api/analytics?action=popularity&sort=trending|stars|forks&limit=20` is administrator-only, returns saved observations and uses private, non-cacheable responses. It makes no live GitHub requests. The ordinary administrator analytics response includes the default ranking. No Supabase migration or additional API key is required.
