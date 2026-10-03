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
