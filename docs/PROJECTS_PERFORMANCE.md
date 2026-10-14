# Projects loading

The storefront and text search remain server-backed. Browsers receive the existing bounded shelf responses or up to 48 results, rather than the catalogue or README search index.

## Initial storefront

The deployment build saves a compact storefront snapshot using current moderation and editorial settings when the database is available. Each shared request still verifies current controls and shelf settings. A settings mismatch, personalised filter, unsupported random/daily selection, or expired evidence uses the existing browsing path. The existing CDN freshness limits and edit-triggered purge remain in place.

Time-dependent community, release and trending shelves are recalculated from a smaller candidate pool. Popular on RepoShelf still uses current click counts and retrieves just the selected cards. The snapshot never grants publication eligibility or bypasses quarantine rules.

## Search and pagination

A generated token-postings index identifies a superset of possible matches, including aliases, name prefixes and metadata spelling tolerance. The existing relevance matcher supplies final scores and explanations. Published overview/README text is stored in 256-project shards; searches load the required shards. Broad searches can still load many shards. Searches with no results and searches after moderation edits retain full-text fallback and existing suggestions.

Postings use delta-varints to reduce first-search parsing. Decompression is asynchronous. Published text and catalogue indexes are packaged compressed, without duplicate published search files.

A bounded cache inside each warm process reuses result ordering and facets for repeated searches and subsequent pages. It holds at most 32 entries/100,000 record references for 30 seconds. Keys include the catalogue/moderation version, evidence time, query, sort, exclusions, session seed and public/admin options. Cache misses and other server instances compute results normally; process caches are optimisations, not authoritative data.

Independent moderation/settings reads run concurrently, and simultaneous moderation reads share one in-flight request. Fresh shared responses still fail if fresh controls cannot be verified. Existing private exclusion lists never enter the shared storefront path.

## Hosting

`vercel.json` explicitly selects Dublin (`dub1`), near RepoShelf's Ireland Supabase project, and keeps Fluid Compute enabled. No database schema, subscription or authentication changes are required. These settings take effect on deployment.

## Local comparison

Single-run service measurements used the same saved catalogue: 53,292 indexed records and 31,872 published listings. They exclude database/network latency, CDN behaviour, browser rendering and platform cold starts. Cold means a new service instance. Results, ordering, shelves and facets were compared against the original implementation.

| Operation | Before | After |
| --- | ---: | ---: |
| Initial storefront | 1,082 ms | 176 ms |
| Name sort, second page | 253 ms | <1 ms |
| First `chess` search | 1,617 ms | 1,055 ms |
| First `calculator` search | 1,492 ms | 1,073 ms |
| First `photo` search | 2,150 ms | 1,637 ms |
| Repeated `photo` search | 242 ms | 10 ms |

These are development measurements, not production guarantees. Recheck production cold/warm requests and cache-hit behaviour after deployment.

## Verification

`tests/projects-performance.mjs` covers snapshot/fallback parity, click ranking, moderation/settings/evidence invalidation, selective README loading, packaged-text fallback, pagination reuse, cache limits and concurrent moderation reads. The reference-matcher corpus also checks that candidate lookup retains all reference matches, including accents, aliases, plurals, typos and non-Latin queries.

Existing browser checks cover progressive shelves, retries, search, pagination, mobile layout and private viewing-history exclusions. Run `npm test`, `npm run build` and `npm run verify:bundles` in the deployment environment; some unrelated existing SEO/image tests use POSIX URL paths that do not work with Sharp on Windows.
