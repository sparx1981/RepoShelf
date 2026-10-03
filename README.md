# RepoShelf

An app-store-style catalog for public GitHub repositories. Browse real open-source projects, try live demos, and keep a collection of your forks.

## Features

- Curated listings and live GitHub discovery.
- Live demos only by default; toggle to include projects without confirmed demos.
- Search, category filters, and sorting by featured, stars, forks, creation date, or updates.
- Project details with GitHub and demo links.
- Fork through GitHub and track projects in your browser.
- Import and verify public forks using a GitHub username.
- Responsive dark storefront inspired by Fab.

## Run locally

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm start
```

Open http://localhost:3000. Validate static output with `npm run build`.

## Deploy to Vercel

Import `sparx1981/RepoShelf` in Vercel. `vercel.json` configures framework Other, build command `npm run build`, and output directory `dist`. No environment variables are required. Once linked, pushes to the production branch trigger deployment automatically.

## Data and limitations

GitHub uses its unauthenticated public API and applies rate limits. Star/fork counts and dates are fetched from GitHub. Demo discovery recognizes explicit demo or playground links in README files, but does not verify destination uptime. Curated browsing and local tracking work even if the API is unavailable.

GitHub does not sort repository search by creation date. Newest discovery searches projects created in the last 30 days, retrieves popular results, and sorts loaded results by creation date. Popularity can be sorted by forks or stars.

Forking opens GitHub's fork screen; the app does not fork automatically. Public username sync checks up to 1,000 recently updated repositories and verifies their fork parents. Private forks need manual tracking. Your collection and username are saved in this browser, not across devices. No OAuth credentials are collected.

Covers use typographic project artwork rather than screenshots. Repository licenses govern code reuse.

## Larger demo catalog

The default view loads `dist/catalog.json`, an indexed catalog, rather than limiting visitors to 12 curated projects. Search and category filters work locally on that catalog. “Search beyond the catalog” runs live GitHub searches in 100-repository batches, using demo, playground, live-preview, and other README signals without requiring a `webapp` topic. Sparse batches automatically advance; failed README fetches are not cached as missing demos. Clicking the demo toggle off searches public repositories without demo-specific qualifiers.

READMEs load from raw.githubusercontent.com using the repository's default branch. This avoids a GitHub API call per project. Demo detection supports Markdown, reference-style links, HTML anchors, linked badges, and URLs under demo headings. Detection results are cached for seven days and invalidated by repository update dates. URLs indicate published demo links, not independently verified uptime.

The `Refresh demo catalog` GitHub Actions workflow runs on its initial push, manually, and every six hours. It checks up to 1,500 candidates per run, partitions search by star ranges to work around GitHub's 1,000-result query limit, retains prior successful entries through temporary failures, and commits catalog updates to `main`. Vercel's Git integration deploys those updates. It uses GitHub's built-in workflow token; no personal token is required. The collection accumulates across runs; the per-run limit is not a catalog-size limit. Enable Actions and workflow write permissions if your repository policy disables them.

Run `npm test` for demo-parser and query-planning checks. Run `node scripts/index-catalog.mjs` to refresh the catalog locally, optionally supplying `GITHUB_TOKEN` for a higher search quota. `.catalog-cache.json` is an ignored incremental crawler cache, not a credential file.

## Repository revalidation

Before discovering new demos, each refresh checks up to 250 saved repositories, prioritizing entries that have waited longest. Entries become eligible after 24 hours; larger catalogs may take longer to complete a cycle. Checks use GitHub's repository API, so a missing README or a failed demo site is not treated as a deleted repository.

Each record can contain `availability`, `lastCheckedAt`, `lastAttemptAt`, and `lastAvailableAt`. `lastCheckedAt` records a definitive repository availability result; temporary failures only advance `lastAttemptAt`. Unavailable entries are retained with `unavailableSince` and a reason, but hidden from storefront browsing. A 404/410 is labeled unavailable, because GitHub does not distinguish a deleted repository from an inaccessible private one. A confirmed private repository is also hidden. Future checks can restore public entries.

Timeouts, server errors, authentication errors, and rate limits preserve the previous status and demo link. A retry date and error kind are recorded; throttling or rejected authentication stops the revalidation pass promptly. A successful repository check clears stale errors and refreshes metadata, including renamed repositories and changed default branches. `lastDemoCheckedAt` separately records README demo-link checks. Removing a demo link does not delete its saved record, but it no longer appears under “Live demos only.” This checks repository access and published demo references, not demo uptime.

Tracked personal forks remain in the local collection even if an upstream repository becomes unavailable. No user setup or new secrets are required: the existing six-hour GitHub Actions workflow uses its built-in token.

## Storefront discovery and previews

Curated is a storefront with Editor's picks, popular releases from the last 30 days, measured trends, and category ribbons. Each category supports Popular/Trending ranking and View all. Technology channels filter the entire storefront and carry into catalog search. Technologies come from GitHub topics, primary languages, and actual package dependencies; using Node as a build tool alone does not classify a project as a Node.js app.

Popularity uses `0.7 * log(1 + stars) + 0.3 * log(1 + forks)`. These are tunable starting weights. Watcher counts are excluded. Daily star/fork snapshots are kept for 35 days. Trending requires at least 24 hours of history and positive measured growth; ranking compares weighted growth per day against the closest available seven-day baseline. Cards state the actual observation window. Recently created repositories and recently pushed code are separate from published GitHub releases.

Each refresh enriches up to 80 projects with release dates and dependency evidence. A separate Playwright step captures up to 20 real live-demo screenshots per run and saves them in `dist/previews/`. Screenshots are refreshed after seven days; temporary capture failures preserve old previews. Only public network destinations are allowed during capture. Visitors load saved images, not a screenshot service. README screenshots can supplement the gallery and are labeled as project images. If a preview fails to load, the typographic cover remains available.

Detail views show the gallery, technologies, license, latest release, code freshness, and availability-check dates. Try demo and Fork on GitHub are separate from Track this fork. Manual tracking does not claim that a fork has been verified.

The workflow installs a pinned Playwright version and runs browser interaction checks at desktop/mobile widths before publishing preview assets. Measured trends will be empty until enough history exists. Releases and screenshots fill in progressively as background batches process the catalog; missing data is never invented.

### Multiple discovery sources

The catalog refresh now imports public Hugging Face Spaces and candidates from the allowlisted repositories in `sources.config.json`. Curated list links are discovery evidence, not demo evidence: each candidate’s GitHub metadata and README are checked independently. List provenance appears in project details. Import cursors are cached so scheduled batches progress through the lists instead of repeating their first entries.

Spaces live in `dist/spaces.json`, with separate namespaced identities, likes, runtime, and availability check dates. Public RUNNING or SLEEPING Spaces qualify for the live-demo filter; gated, disabled, or broken builds do not. Oldest due entries are rechecked daily in bounded batches; inaccessible entries are hidden and temporary errors retain existing data for a later retry. The paginated Spaces import accumulates entries across refreshes. Public browsing requires no Hugging Face token.

Explicit source-code links are verified against GitHub before they enable GitHub forking. A Space linked to an already indexed GitHub repository merges into that listing and can supply a missing demo. Standalone Spaces offer duplication on Hugging Face, which requires a Hugging Face account. Collection saves are local browser records; only public GitHub forks can be verified through account sync. Neither provider’s licenses automatically grant unrestricted reuse.

Source filters include All sources, GitHub, Hugging Face Spaces, and GitHub fork available. GitHub popularity uses weighted logarithmic stars and forks; Spaces use likes. Mixed-source Popular ordering uses within-source percentiles to avoid equating a like with a GitHub star. Trending and recent releases retain GitHub-specific evidence.

Search, filters, sorting, and Show more operate on saved catalogs and never automatically call GitHub. The separate “Search beyond the catalog on GitHub” button opts into live discovery. Existing matches remain visible throughout a request and after a rate limit or network error. Changing the query invalidates any pending response.
