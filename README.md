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

Requires Node.js 20 or newer. Run `npm install` to install the API/MCP server dependencies.

```sh
npm start
```

Open http://localhost:3000. Validate static output with `npm run build`.

## Deploy to Vercel

Import `sparx1981/RepoShelf` in Vercel. `vercel.json` configures framework Other, build command `npm run build`, and output directory `dist`. The storefront requires no environment variables. The private agent API/MCP endpoints require `REPOSHELF_API_KEY` as documented below. Once linked, pushes to the production branch trigger deployment automatically.

## Data and limitations

GitHub uses its unauthenticated public API and applies rate limits. Star/fork counts and dates are fetched from GitHub. Demo discovery recognizes explicit demo or playground links in README files, and scheduled browser checks separately check whether demo pages load. Curated browsing and local tracking work even if the API is unavailable.

GitHub does not sort repository search by creation date. Newest discovery searches projects created in the last 30 days, retrieves popular results, and sorts loaded results by creation date. Popularity can be sorted by forks or stars.

Likes and GitHub fork actions require GitHub sign-in. Forking opens GitHub's fork screen; RepoShelf does not create forks itself. Public fork verification uses the signed-in provider identity and saves verified results per account in Supabase. Checks resume in bounded batches without a total-repository ceiling. Private forks are unavailable to this feature. Browsing and demos remain public.

Covers use saved demo screenshots where available, with typographic project artwork as a fallback. Repository licenses govern code reuse.

## Larger demo catalog

The default view loads `dist/catalog.json`, an indexed catalog, rather than limiting visitors to 12 curated projects. Search and category filters work locally on that catalog. “Search beyond the catalog” runs live GitHub searches in 100-repository batches, using demo, playground, live-preview, and other README signals without requiring a `webapp` topic. Sparse batches automatically advance; failed README fetches are not cached as missing demos. Clicking the demo toggle off searches public repositories without demo-specific qualifiers.

READMEs load from raw.githubusercontent.com using the repository's default branch. This avoids a GitHub API call per project. Demo detection supports Markdown, reference-style links, HTML anchors, linked badges, and URLs under demo headings. Detection results are cached for seven days and invalidated by repository update dates. A discovered URL initially indicates a published demo link. Saved demo-health checks provide separate dated page-load evidence.

The `Refresh demo catalog` GitHub Actions workflow runs on its initial push, manually, and every six hours. It checks up to 1,500 candidates per run, partitions search by star ranges to work around GitHub's 1,000-result query limit, retains prior successful entries through temporary failures, and commits catalog updates to `main`. Vercel's Git integration deploys those updates. It uses GitHub's built-in workflow token; no personal token is required. The collection accumulates across runs; the per-run limit is not a catalog-size limit. Enable Actions and workflow write permissions if your repository policy disables them.

Run `npm test` for demo-parser and query-planning checks. Run `node scripts/index-catalog.mjs` to refresh the catalog locally, optionally supplying `GITHUB_TOKEN` for a higher search quota. `.catalog-cache.json` is an ignored incremental crawler cache, not a credential file.

## Repository revalidation

Before discovering new demos, each refresh checks up to 250 saved repositories, prioritizing entries that have waited longest. Entries become eligible after 24 hours; larger catalogs may take longer to complete a cycle. Checks use GitHub's repository API, so a missing README or a failed demo site is not treated as a deleted repository.

Each record can contain `availability`, `lastCheckedAt`, `lastAttemptAt`, and `lastAvailableAt`. `lastCheckedAt` records a definitive repository availability result; temporary failures only advance `lastAttemptAt`. Unavailable entries are retained with `unavailableSince` and a reason, but hidden from storefront browsing. A 404/410 is labeled unavailable, because GitHub does not distinguish a deleted repository from an inaccessible private one. A confirmed private repository is also hidden. Future checks can restore public entries.

Timeouts, server errors, authentication errors, and rate limits preserve the previous status and demo link. A retry date and error kind are recorded; throttling or rejected authentication stops the revalidation pass promptly. A successful repository check clears stale errors and refreshes metadata, including renamed repositories and changed default branches. `lastDemoCheckedAt` separately records README demo-link checks. Removing a demo link does not delete its saved record, but it no longer appears under “Live demos only.” This checks repository access and published demo references, not demo uptime.

Saved personal fork evidence remains in the account collection even if an upstream repository becomes unavailable. No user setup or new secrets are required: the existing six-hour GitHub Actions workflow uses its built-in token.

## Storefront discovery and previews

Curated is a storefront with Editor's picks, popular releases from the last 30 days, measured trends, and category ribbons. Each category supports Popular/Trending ranking and View all. Technology channels filter the entire storefront and carry into catalog search. Technologies come from GitHub topics, primary languages, and actual package dependencies; using Node as a build tool alone does not classify a project as a Node.js app.

Popularity uses `0.7 * log(1 + stars) + 0.3 * log(1 + forks)`. These are tunable starting weights. Watcher counts are excluded. Daily star/fork snapshots are kept for 35 days. Trending requires at least 24 hours of history and positive measured growth; ranking compares weighted growth per day against the closest available seven-day baseline. Cards state the actual observation window. Recently created repositories and recently pushed code are separate from published GitHub releases.

Each refresh enriches up to 80 projects with release dates and dependency evidence. A separate Playwright step captures up to 20 real live-demo screenshots per run and saves them in `dist/previews/`. Screenshots are refreshed after seven days; temporary capture failures preserve old previews. Only public network destinations are allowed during capture. Visitors load saved images, not a screenshot service. README screenshots can supplement the gallery and are labeled as project images. If a preview fails to load, the typographic cover remains available.

Detail views show the gallery, technologies, license, latest release, code freshness, and availability-check dates. Try demo and Fork on GitHub are separate from Check my public forks. Only server-verified ownership and parent evidence marks a GitHub fork as verified.

The workflow installs a pinned Playwright version and runs browser interaction checks at desktop/mobile widths before publishing preview assets. Measured trends will be empty until enough history exists. Releases and screenshots fill in progressively as background batches process the catalog; missing data is never invented.

### Multiple discovery sources

The catalog refresh now imports public Hugging Face Spaces and candidates from the allowlisted repositories in `sources.config.json`. Curated list links are discovery evidence, not demo evidence: each candidate’s GitHub metadata and README are checked independently. List provenance appears in project details. Import cursors are cached so scheduled batches progress through the lists instead of repeating their first entries.

Spaces live in `dist/spaces.json`, with separate namespaced identities, likes, runtime, and availability check dates. Public RUNNING or SLEEPING Spaces qualify for the live-demo filter; gated, disabled, or broken builds do not. Oldest due entries are rechecked daily in bounded batches; inaccessible entries are hidden and temporary errors retain existing data for a later retry. The paginated Spaces import accumulates entries across refreshes. Public browsing requires no Hugging Face token.

Explicit source-code links are verified against GitHub before they enable GitHub forking. A Space linked to an already indexed GitHub repository merges into that listing and can supply a missing demo. Standalone Spaces offer duplication on Hugging Face, which requires a Hugging Face account. Liked projects and verified public GitHub forks sync across devices; manual Space tracking remains browser-local. Neither provider’s licenses automatically grant unrestricted reuse.

Source selection in More filters includes All sources, GitHub, and Hugging Face Spaces. GitHub popularity uses weighted logarithmic stars and forks; Spaces use likes. Mixed-source Popular ordering uses within-source percentiles to avoid equating a like with a GitHub star. Trending and recent releases retain GitHub-specific evidence.

Search, filters, sorting, and Show more operate on saved catalogs and never automatically call GitHub. The separate “Search beyond the catalog on GitHub” button opts into live discovery. Existing matches remain visible throughout a request and after a rate limit or network error. Changing the query invalidates any pending response.

### Project overviews and simpler filters

Source selection is inside the native, keyboard-accessible “More filters” disclosure. An active source stays visible beside its label when collapsed, and a Clear source filter action restores all sources. The GitHub fork availability checkbox is removed; individual Fork and Duplicate actions describe the relevant provider. The Hugging Face account requirement appears in project details instead of the browsing controls.

Project cards retain their original short description. Details can additionally show “About this project”: up to three introductory paragraphs and five features extracted from the author's README, clearly labelled as an author-written excerpt and linked to the full source. This is deterministic extraction, not AI generation or a claim that RepoShelf tested the advertised features. Plain text is escaped when rendered; scripts, badges, code blocks, setup sections, and contribution instructions are excluded where possible. If suitable author text is absent, the additional section is omitted.

`scripts/readme-overviews.mjs` provides the shared extractor. Discovery reuses READMEs already fetched for demo checks and source verification; `scripts/enrich-overviews.mjs` backfills older GitHub and Space entries in bounded batches. Saved records include the extraction version, source URL, content fingerprint, extraction date, and check date. Unchanged content keeps its original extraction date. Older entries are revisited after seven days or a repository update, subject to a six-hour retry interval. Temporary failures keep the saved text. The scheduled refresh publishes all extracted text with the static catalogs, so visitors never trigger README or model requests. No AI API key is required.


### Demo reliability and broken-demo reports

Every scheduled refresh checks up to 100 public demo pages in four browser workers. New popular listings, older due checks, and reported demos share the batch. Successful checks are eligible for another check after seven days; processing the whole catalog can take longer. Cards and details distinguish untested links, checked pages, inconclusive attempts, and unavailable demos, and display the recorded check date.

A 404/410 or explicit missing-page response needs two checks at least six hours apart before the demo is excluded from the default demo-only results. Timeouts, rate limits, server errors, bot challenges, empty pages, and unavailable Space app frames preserve the previous result and retry later. A recovery restores the demo. Unavailable demos can still be browsed by disabling the demo-only filter; repository availability is handled separately. These are page-load checks, not tests of every interactive feature. Browser requests and redirects are restricted to public network addresses. Screenshots share the same health logic and never count a second failure within the same refresh.

Details include **Report a broken demo**, opening a prefilled issue in this repository. A GitHub account is needed to submit it. Refreshes review open reports whose project and URL match a saved listing and prioritize an independent check; a report cannot directly hide a listing. No extra secret or manual action is needed for scheduled demo checks.

### Reuse information and optional AI overviews

Details show what the project does, who the author says it is for, and explicitly documented API-key, account, paid-service, and self-hosting requirements. `scripts/project-insights.mjs` extracts and quotes author statements, with README provenance, check dates, and fingerprints. Missing information is presented as unknown, never as a promise that no accounts or costs are required. Declared licences include a short reuse guide and full terms where a recognised SPDX identifier exists. These guides do not infer a licence for unlicensed projects.

An optional Gemini step can add one or two clearly labelled plain-language paragraphs for popular projects, keeping the original short description and author-written excerpt. It uses already saved author information, not a claim to have operated the demo. Exact supporting quotes are checked against that information and shown alongside the summary; this provides traceability, not a guarantee against every model error. Failed generations preserve saved text. Unchanged sources/model skip regeneration.

To enable it, add **GEMINI_API_KEY** as a GitHub Actions repository secret and **GEMINI_MODEL** as a repository variable naming a model available to that key. Neither belongs in frontend code or Vercel variables. Without both, the step safely skips and all author-based details remain available. The workflow caps generation at 10 attempts per refresh and 20 per UTC day, with usage persisted in the catalog and a six-hour failure retry interval. Model calls are never made by visitors. A provider quota or spend limit is recommended for an additional external cap. X discovery is not implemented.


### Automated community discoveries

The Curated storefront includes **Community discoveries**, a ribbon of repositories linked in recent Hacker News and Bluesky discussions. It works automatically for personal browsing; community submissions and a public RepoShelf deployment are not required. Discussion links, dates, titles, authors, and observed engagement appear in project details. The ribbon follows existing category, technology, source, and demo filters.

Every six-hour catalog refresh calls Hacker News's Algolia story search and Bluesky's public AppView search for GitHub links. Each source is limited to three 100-result pages, looking back 30 days; this is a bounded discovery sample, not exhaustive social-platform coverage. GitHub links in Bluesky facets and external embeds are included. If Bluesky anonymous search rejects access, the importer falls back to the official public Jetstream feed: a sample beginning one hour before the refresh, bounded to 25 seconds, 40,000 events, 32 MiB, or 200 matching posts. This sample can cover only part of that hour and is not continuous monitoring. Public post views supply engagement where accessible; missing engagement is labelled rather than shown as an observed zero. Stream deletions remove matching saved discussions when observed. No X API, Bluesky login, or extra secret is needed. Public-service restrictions or rate limits can temporarily prevent a source from refreshing; saved recent discussions remain available while the other source continues. Entries expire from the ribbon after 30 days.

`scripts/import-community.mjs` validates up to 60 candidate repositories per refresh using the existing GitHub metadata and README pipeline. Repository identities are deduplicated case-insensitively, including renamed repositories; existing catalog records and demo-health evidence are retained on temporary failures. New repositories without demo links are retained so they can be browsed when demo-only filtering is disabled. A social post is discovery evidence, not proof of a working demo. The built-in workflow GitHub token is sent only to GitHub requests.

`dist/community.json` stores at most 2,000 recent repository mentions, source refresh status, and import counts; browser visits load this saved file. The community ranking uses age-decayed engagement ranked within each source, with capped credit for independent authors. Repeated posts by one author do not add independent-author credit. Hacker News points are not equated directly with Bluesky likes, and GitHub popularity/trending calculations stay separate. `.community-cache.json` records bounded import retry dates and is cached by Actions.


## Agent API and MCP

A read-only agent API is available under `/api/v1/` and an official-SDK MCP server under `/api/mcp`, both disabled until a private `REPOSHELF_API_KEY` is configured in Vercel and the app is redeployed. The same tools run locally over stdio without a hosted key, or bridge to the deployed API with the key in the client environment. See [the connection guide](docs/AGENT_API.md), the hosted `/agent-guide.html`, and `/openapi.json` for exact Codex/Claude setup, endpoints, safeguards, and context limits.

Scheduled indexing saves full README snapshots and progressively adds licence files and available dependency manifests, with original source links, content hashes and dates. API search is keyword-based and returns compact results; document endpoints allow complete reading in chunks. Missing or unusually large documents are explicitly identified. The server never fetches live repositories on a client request, executes project code, modifies a repository, or manages the user's browser collection. `npm test` covers the catalog/API/security service; `npm run test:mcp` verifies the official MCP client over HTTP and local/remote stdio.

## Accounts, administration and analytics

GitHub sign-in and synced liked projects use Supabase, with database-enforced owner/admin permissions. Administration includes draft/published category ribbons, manual or automatic project selection, ordering, and private activity/catalog-growth analytics. Legacy guest likes can be imported after sign-in. GitHub forks use the same signed-in identity; manual Space tracking remains local. Apply migration 4 to activate account fork storage.

Follow [the activation guide](docs/ACCOUNTS_AND_ADMIN.md) to connect Supabase, apply the migration, enable GitHub OAuth, configure Vercel environment variables and grant your verified administrator role. The administration workspace is `/admin.html`. No real provider credentials are embedded in this repository.
