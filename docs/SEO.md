# Search engine discovery

`npm run build` generates a public `/explore.html` directory, paginated category pages, and individual project pages with HTML descriptions, author README excerpts where available, technologies, licences, demo-check dates, and related project links. They work without JavaScript. Project actions return to the existing storefront and sign-in flow.

The build uses the moderated browse index and the same `publishedEligible` check as public browsing. Hidden, excluded, pending, quarantined, unavailable, and stale listings are omitted. Each build removes the previous generated project/category directories before writing current pages. A repository rename produces its current URL; the retired URL returns 404. This does not create permanent redirects for renamed repositories.

Generation is bounded to 5,000 project pages to limit build time and deployment size. It reserves up to 12 eligible projects per category before filling by the existing source-aware popularity ranking. Only selected projects receive public pages and sitemap entries; others continue to work through the existing storefront. Categories contain up to 48 links per page with ordinary previous/next anchors. Empty categories are omitted. The storefront links to the directory, and its share action uses a public page when that listing is present in the generated manifest, falling back to the existing `?project=` link otherwise.

Every public page has a unique title and description, an absolute canonical URL, Open Graph/Twitter metadata, and a social image. Project screenshots are used where available; a generated 1200×630 RepoShelf PNG is the fallback. JSON-LD describes the website, category collections, source-code projects, and breadcrumbs. Stars and forks are not presented as review ratings. Sitemap entries omit `lastmod` rather than presenting build time or unrelated repository updates as page modification dates.

The canonical origin defaults to **https://www.reposhelf.co.uk**, matching the application's existing account configuration. To deploy under another domain, set `REPOSHELF_SITE_URL` to its HTTPS origin before building. This is a public build setting, not a secret, and is independent of OAuth's allowed origins. Do not set it to a temporary preview URL. The build rejects origins containing credentials, paths, queries, or fragments.

When `VERCEL_ENV` is `preview` or `development`, HTML receives `noindex, nofollow`, the sitemap has no entries, and robots disallows crawling. Production account, administration, legal-acceptance, and offline pages also receive `noindex`. API responses have an `X-Robots-Tag` header. Public legal policy pages have canonical URLs but are excluded from the discovery sitemap. `/index.html` permanently redirects to `/`.

After merging and deploying:

1. Verify `/robots.txt`, `/sitemap.xml`, `/explore.html`, and a linked project URL on the production domain.
2. Add the canonical domain to Google Search Console and Bing Webmaster Tools using an account you control. Complete their domain-verification process and submit `/sitemap.xml`.
3. Use URL Inspection to request crawling of the home page and directory, and monitor indexing and search queries. Publishing a sitemap enables discovery; search engines decide whether and when to index pages.

No account verification, sitemap submission, or production deployment is performed by the build. `npm run test:seo` checks generated HTML, pagination, moderation, escaping, canonical configuration, sitemap consistency, repeated builds, retirement, and preview exclusions without calling external services.
