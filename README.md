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
