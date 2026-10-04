# Browsing catalogue

The storefront and admin picker never download catalog.json, spaces.json or community.json. Those files remain the canonical generated source snapshots for discovery and the authenticated agent API/MCP.

`npm run build` generates `data/browse/index.json`, an immutable server search index, plus per-project JSON in `data/browse/projects/`. The sync publisher generates these again immediately before each checkpoint/final publication. Deployment builds always regenerate from the deployed catalogue, including submitted repositories. Generated files must be published alongside their source data, never copied from a developer's fixture catalogue.

The index keeps metadata, bounded search text, one preview, technologies and a precomputed trend summary. Full author overviews, evidence, AI summaries, screenshot galleries and historical metrics stay in individual detail files. Search and facets cover all available projects; pagination is a response limit, not a library ceiling. GitHub and Spaces are merged before indexing so linked Spaces remain deduplicated and searchable under both sources.

The existing `/api/editorial` function handles `POST ?action=browse` and `GET ?action=detail&id=...`. Browsing POSTs require same-origin headers and retain no search text or exclusion IDs. Add `manage=1` for the administrator picker; this requires a verified administrator session. Existing editorial writes and account data retain their role checks. Detail views are public; all outgoing links still use the authenticated `/api/open` route. Agent keys are never shipped to the browser. No additional Vercel function or Supabase migration is required.

Initial storefront responses include up to 48 page cards plus the visible shelf selections. Subsequent searches return at most 48 cards. Community evidence is read only for storefront shelves or project details. The admin picker requests 30 cards, supports more pages and fetches selected project names as needed. A warm function reuses the parsed compact index instead of reparsing the monolithic catalogue per request.

Cursors bind the catalogue content version, query, filters, exclusions, seed and response limit. A new deployment invalidates old cursors; the storefront restarts at page one. Random shelves use one seed per page load, daily shelves use UTC dates, and both remain stable while browsing. Filter changes discard stale responses; transient errors preserve loaded cards and offer a retry. Project detail requests are deduplicated and the browser retains up to 100 fetched details.

`tests/browsing.mjs` checks independent serving after deleting the source JSONs, full-library facets/search, cursor invalidation, deduplication and role/origin guards. `scripts/verify-browsing-ui.mjs` verifies 1,000 rich fixture projects without monolithic downloads, pagination, lazy detail loading, retries and stale responses. Deployment QA measures the actual initial response and enforces a 750 KB uncompressed payload budget, separate from image bytes and compressed transfer size.

Shelf-setting outages fall back to the last successful editorial settings in that warm function, or the built-in defaults on a cold function. Browsing returns a notice and remains usable; no catalogue data or editorial settings are changed by this fallback.
