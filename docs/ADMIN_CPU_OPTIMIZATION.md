# Administration CPU optimisation

Catalogue builds and sync checkpoints generate `data/admin-summary.json`. It contains catalogue coverage and the top 50 projects for each growth ranking. The Analytics API reads this small snapshot instead of loading and analysing the full catalogue. A compatibility fallback remains for deployments without a summary. Catalogue counts and growth rankings reflect the summary timestamp shown in Analytics; visitor statistics come from Supabase.

Authenticated analytics responses are cached for two minutes per administrator and date range. Sync-log responses are cached for 30 seconds per administrator and page. Administrator authorization runs before every cache lookup. Errors are not cached. Manual Refresh bypasses response caches. These caches live in each running server instance and cannot eliminate cold starts or share results between instances.

Visible Analytics tabs refresh every five minutes. Sync logs refresh every minute while a run is active and every five minutes otherwise. Hidden tabs do not poll; overlapping automatic analytics requests are suppressed. Sync and deployment schedules are unchanged.

This work does not change the public storefront's browse/search API. Storefront cold starts still load the compact browsing index, with search text loaded only for text queries. Profiling and reducing that work would be a separate optimisation affecting public visitors as well as administration. GitHub Actions repository checks and screenshot captures run outside Vercel Functions, so their execution time is not Vercel Active CPU usage.

No database migration, new paid service, or API key is required. Measure Vercel CPU usage after deployment to assess the actual reduction.
