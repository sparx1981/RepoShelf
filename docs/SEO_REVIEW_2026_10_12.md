# RepoShelf SEO and agent discovery review — 12 October 2026

Reviewed production commit `d67eca75ce2ced4e64a4aa4b0acac479b997a7cb` and its source. GitHub reports that Vercel’s production deployment succeeded. Direct fetches of the production home page, directory, robots, sitemap and agent guide were unavailable through the browsing service; the Vercel fetch connection also lacked permission to read the deployment’s alias/protection configuration. This is a limitation of this review environment, not evidence that the public site blocks crawlers. The Is Agentic report could not be retrieved, so no numerical agent-readiness score is claimed.

## Findings addressed

| Finding in deployed source | Change |
| --- | --- |
| Projects are now readable as HTML, but agents have no compact public path into the catalogue. | Add llms.txt, a concise public agent guide, linked Markdown mirrors, and versioned JSON chunks of up to 25 records. |
| The agent guide focuses on an operator key, lists only five tools, and uses the old Vercel hostname. | Explain public reading separately from member MCP and operator REST access, list the current nine tools, and use the configured canonical origin. |
| OpenAPI advertises the old hostname and only authenticated operations. | Use the canonical origin and document public static discovery with explicit empty security requirements, preserving Bearer requirements on all existing REST operations. |
| Metadata insertion silently skips HTML documents that omit a closing head tag. The deployed agent guide does so. | Correct the guide markup and support valid HTML with omitted head tags, including private page noindex metadata. |
| Search engines have little site-identity or catalogue documentation context. | Link the source repository in WebSite metadata and describe public discovery using DataCatalog/Dataset metadata on the agent guide. |
| Machine-friendly copies could become competing search results. | Keep canonical HTML indexable and give Markdown/JSON alternatives noindex response headers. |

All discovery formats are generated from the same moderated, published selection. Hidden, excluded and stale listings are omitted. Removed listings and old JSON versions are deleted on rebuild. The public field whitelist does not include account data or credentials, and authenticated endpoints are unchanged.

## Validation

The SEO integration suite checks public metadata, Markdown alternatives, agent links, compact JSON pagination, coverage and provenance, public-field whitelisting, licence/demo evidence, escaping, canonical-domain changes, retirement, preview exclusions and repeated builds. It checks that every existing REST operation retains Bearer authentication. The early storefront-request parity test and syntax checks also run. Direct production response and browser verification remain unconfirmed from this environment; the PR’s remote CI and deployment checks provide further validation.

## Remaining priorities

1. Confirm the production HTML, JSON, Markdown and robots responses after deployment, including response content types and noindex headers. Use Search Console URL Inspection for the home page, agent guide, directory and representative project pages.
2. Complete canonical-domain verification and sitemap submission in Google Search Console and Bing Webmaster Tools if not already done. Monitor indexed pages, excluded URLs and search queries; publishing a sitemap does not prove indexing.
3. Monitor how often freshness checks and the 5,000-page selection retire project URLs. Long-lived, useful pages support discovery, but publication checks should not be weakened to keep stale listings indexed. A rename redirect needs reliable identity evidence, not a name-based guess.
4. Improve source-backed project context over time where descriptions are too brief. Prefer useful author evidence and provenance over generating near-duplicate category or keyword pages.

Google’s [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) treats accessible content and ordinary SEO as the foundation. The [llms.txt proposal](https://llmstxt.org/) helps agents navigate readable material, but is optional and does not guarantee discovery or citations.
