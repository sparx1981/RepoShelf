# Browse CPU review — 8 October 2026

Vercel's email reports the team's four-hour Hobby Active CPU allowance has been consumed. This is CPU executing Vercel functions, not GitHub Actions CPU or time waiting for network requests. Registered user count does not measure function traffic: scheduled health checks, browser qualification, bots and guest visits also make requests.

## Confirmed findings

- The saved catalogue contains 25,205 indexed listings. The local public view contains 20,179 eligible listings. Neither population was reduced.
- Compact browsing metadata is 43,504,405 bytes. Search text is separate (102,217,554 bytes), loaded on the first text query. Full repository data is 200,320,359 bytes and Spaces data is 31,683,850 bytes. Browsing already uses separate project detail files rather than sending the full raw catalogue to visitors.
- Cross-provider popularity ranking used `indexOf` and `lastIndexOf` on each provider's sorted scores for every project. This caused quadratic work. The replacement calculates tied-score percentile ranges once, preserving source normalization, ranking ties and output order.
- Browsing also sorted the same matched list twice for the default popular order. It now reuses that ranking, creates facet filter options once and shares technology calculations within each request. Nothing is written back to the catalogue.
- `.github/workflows/health.yml` runs every 30 minutes, plus selected workflow-completion triggers. Its browse request for one card still computes catalogue-wide ranking and facets. Discovery and demo checking generally run on GitHub; their requests into RepoShelf can incur Vercel function CPU.
- Other recurring callers include submission intake, publication checks, maintenance, workflow controls and browser qualification. They need invocation/CPU totals to establish their contribution. The agent catalogue service can load richer data, so agent/MCP calls should also be included in attribution.

## Local comparison

Same saved catalogue and Node 24 on Windows; `process.cpuUsage()` user plus system CPU around the browse service call. These are local measurements, not Vercel billing. CPU excludes subsequent JSON serialization and network/database calls. Times fluctuate with runtime scheduling and garbage collection.

| Warm request | Before | After | Approximate reduction |
| --- | ---: | ---: | ---: |
| Health-style browse, one card | 1,141 ms | 157 ms | 86% |
| Homepage with built-in shelves | 2,766 ms | 1,328 ms | 52% |

Cold index parsing still costs approximately 0.4–0.5 seconds CPU locally. The metadata/search file sizes are unchanged. Homepage responses remain approximately 729 KB. Further storage changes should separate fields by demonstrated runtime need rather than discard catalogue, screenshot, provenance or classification data.

Five full-catalogue comparisons against the previous implementation produced byte-for-byte equal responses: health browse, homepage shelves, React-filtered pagination, Hugging Face name sorting and an AI-category trending request. Existing browsing tests cover search, pagination/cursor validation, moderation and facets; ranking regression tests cover ties, both providers, single-provider lists and invalid scores.

## Attribution limitation and next steps

The connected Vercel account denied access to this team's project/runtime logs. Historical function invocation counts and Active CPU totals could not be retrieved. These findings establish an avoidable browsing cost; they do not prove which callers consumed all four hours. At 48 daily health checks and 1.14 seconds each, the warm browse calculation alone would be around 0.46 hours over 30 days, excluding cold starts, retries, extra triggers and other requests.

Use Vercel Usage/Observability to identify the top functions by Active CPU and invocation count, then group requests by route/action and caller. The four-hour allowance belongs to the team, so include other projects if present. Check whether external watchdogs request the same expensive browse action more frequently than the repository health schedule. If needed, use a lightweight health endpoint and reduce redundant full-catalogue checks while keeping quality freshness requirements intact. Consider smaller runtime metadata and precomputed/cached shelves next; account-specific controls, time-sensitive eligibility and cursor versions must remain correct.

Sources: [Function usage and pricing](https://vercel.com/docs/functions/usage-and-pricing), [Hobby plan](https://vercel.com/docs/plans/hobby).
