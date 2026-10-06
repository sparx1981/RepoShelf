# Demo viewer pilot (administrator harness)

The in-page demo viewer is built as an **administrator-only pilot**. Visitors do not see it yet; "Try demo" still opens the demo in a new tab. The design, the reviewer decisions and the rollout plan are in `docs/proposals/IN_PAGE_DEMO_VIEWER.md`. Core rule: **uncertainty always sends the visitor to the external demo.**

## What exists

| Piece | Where |
|---|---|
| Shared viewer configuration (sandbox string, per-demo flags, configuration id, eligibility decision) | `dist/viewer-config.js` |
| Viewer component (persistent Close, Open in new tab and "Third-party demo" label; uncached check before opening and while open) | `dist/viewer.js`, `dist/viewer.css` |
| Scenario format and validation | `lib/viewer-scenario.mjs` |
| API: visitor eligibility, administrator controls, qualification worker | `api/viewer.mjs`, `lib/viewer.mjs` |
| Database: global switch, approved demos, evidence | `supabase/migrations/202610060021_demo_viewer.sql`, `tests/database-viewer.sql` |
| Qualification tool | `scripts/viewer-qualify.mjs` |
| Daily qualification job | `.github/workflows/viewer-qualification.yml` |
| Administrator page | `/admin-viewer.html` (link on the Administration tabs) |

## Setting it up

1. Apply `supabase/migrations/202610060021_demo_viewer.sql` in the Supabase SQL editor (safe to run twice). All three tables and every function are server-only.
2. The worker key is the existing `REPOSHELF_SUBMISSION_SYNC_KEY` (Vercel environment variable and GitHub Actions secret). Without it the daily job does nothing.
3. Open **Administration → Demo viewer**. The global switch starts **off**.

## Approving a demo

On the administrator page, add the listing id and the demo address (https only), then write a **scenario**: a short JSON script run inside the framed demo.

```json
{
  "summary": "Adding a task shows it in the list",
  "steps": [
    {"action": "fill", "selector": "#new-task", "value": "Buy milk"},
    {"action": "click", "selector": "#add"},
    {"action": "expectText", "selector": "#list", "text": "Buy milk"}
  ]
}
```

- Actions: `click`, `fill`, `press`, `waitFor`, `expectVisible`, `expectText`, `expectPopup` (optionally `host`), `expectDownload`. At most 14 steps.
- A scenario **must contain at least one interaction and at least one expected result**. Loading the page is never enough.
- For a Hugging Face Space use the Space's `appUrl` as the demo address, not the `huggingface.co` page.
- **Popups** and **downloads** are per-demo flags, off by default. A demo that needs a provider login needs popups, and its scenario should use `expectPopup` with the expected host. A demo that serves a file needs downloads and `expectDownload`. Neither flag guarantees a login flow works.
- Neither top-navigation sandbox flag is ever allowed. A demo that tries to replace RepoShelf fails qualification.
- Demos that need camera, microphone or location stay external: the site-wide Permissions-Policy denies them and an iframe cannot override it. Also keep payments, wallets, credential requests and complicated logins out.

## What counts as eligible

A demo opens in the viewer only if **all** hold: global switch on; approved; not manually disabled; not suspended by a failed check; an `https://` address; a latest qualification run that **passed**, for the **exact current address** and **exact viewer configuration**, **within 48 hours**. The latest run decides: a failed or inconclusive run suspends the demo even if an older success is still fresh. Changing the address or toggling popups or downloads invalidates the evidence until the demo is re-qualified.

Reasons are shown in plain language on the administrator page. `GET /api/viewer?id=owner/repo` returns the same decision for visitors, uncached; any backend problem answers "not eligible".

## Qualification

`scripts/viewer-qualify.mjs` loads the exact sandbox on a page served as `https://www.reposhelf.co.uk` (so `frame-ancestors` rules are judged as for visitors), runs the scenario inside the frame and records: result, reason, browser, timestamp, resolved URL after redirects, configuration id, scenario hash, popup destinations, downloads, top-navigation attempts and console errors.

- **ok**: every step passed and nothing unexpected happened.
- **failed**: frame refused, HTTP error, top-navigation attempt, a step that cannot find its element, an unexpected popup or download, or a non-https address.
- **inconclusive**: load timeout, challenge page, or a problem in the tool itself. Inconclusive is never a pass.

```
node scripts/viewer-qualify.mjs --url=https://demo.example/ --scenario=scenario.json [--popups] [--downloads] [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]
node scripts/viewer-qualify.mjs --queue      # the daily job: qualify the approved list and report each result
```

The daily workflow runs Chromium. Run WebKit, Firefox and mobile emulation from **Actions → Demo viewer qualification → Run workflow**. These supplement real Safari and real device checks, which are repeated by hand after significant demo or viewer changes. Qualification shows a demo can work; it cannot guarantee every visitor's session.

## Disabling and propagation

- **Manual disable** on the administrator page is cleared only by an administrator. A successful qualification never clears it.
- A failed or inconclusive qualification suspends the demo automatically; only a later **successful** qualification lifts that suspension.
- The global switch and per-demo state are read by an **uncached** endpoint immediately before the frame is created, and again every 45 seconds while a viewer is open, so a disable reaches an open viewer within about a minute (polling interval plus request time).

## Not done yet (by design)

- No visitor-facing button, report action or analytics events.
- No site-wide Content-Security-Policy. The pilot plan is exact `frame-src` origins for approved demos (the evidence records the resolved origins), added when the viewer reaches visitors. A comprehensive CSP is a separate change, in report-only mode first.
- Scenario definitions live in the database row for each demo and are edited by administrators on the page.
