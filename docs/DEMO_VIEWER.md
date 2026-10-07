# Demo viewer pilot (administrator harness)

The in-page demo viewer is built as an **administrator-only pilot**. Visitors do not see it yet; "Try demo" still opens the demo in a new tab. The design, the reviewer decisions and the rollout plan are in `docs/proposals/IN_PAGE_DEMO_VIEWER.md`. Core rule: **uncertainty always sends the visitor to the external demo.**

## What exists

| Piece | Where |
|---|---|
| Shared viewer configuration (sandbox string, per-demo flags, configuration id, own-origin rule, eligibility decision) | `dist/viewer-config.js` |
| Viewer component (persistent RepoShelf logo, "Open in new tab" icon button and Close (X) button; uncached check before opening, while open, and when the tab regains focus) | `dist/viewer.js`, `dist/viewer.css` |
| Scenario format and validation | `lib/viewer-scenario.mjs` |
| API: visitor eligibility, administrator controls, qualification worker | `lib/viewer.mjs`, served as `/api/viewer` by the editorial function (`api/editorial.mjs`, `area=viewer`, rewritten in `vercel.json`) |
| Database: global switch and required profiles, approved demos, scenario history, evidence per browser profile | `supabase/migrations/202610060021_demo_viewer.sql` and `…0022_demo_viewer_v2.sql`, `tests/database-viewer.sql` |
| Qualification tool | `scripts/viewer-qualify.mjs` |
| Daily qualification job (one run per browser profile) | `.github/workflows/viewer-qualification.yml` |
| Administrator page | `/admin-viewer.html` (link on the Administration tabs) |

## Setting it up

1. Apply `supabase/migrations/202610060021_demo_viewer.sql` and then `202610060022_demo_viewer_v2.sql` in the Supabase SQL editor (both are safe to run twice, and migration 22 must come after 21). All tables and functions are server-only.
2. The worker key is the existing `REPOSHELF_SUBMISSION_SYNC_KEY` (Vercel environment variable and GitHub Actions secret). Without it the daily job does nothing.
3. Open **Administration → Demo viewer**. The global switch starts **off** and the required profile list starts as `chromium`.

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

- Actions: `click`, `fill`, `press`, `waitFor`, `expectVisible`, `expectText`, `expectPopup` (optionally `host`), `expectDownload` (optionally `filename`, `minBytes`). At most 14 steps.
- A scenario needs **at least one interaction and a result assertion after the last interaction**. Loading the page is never enough, an assertion that comes before the action proves nothing about it, and `expectVisible` on `body` is not a result. Review must still establish that the scenario proves something useful.
- **Keep credentials out of scenarios.** Password fields and token-shaped values are refused.
- **RepoShelf itself can never be a demo** (its own hosts, `*.reposhelf.co.uk`, `reposhelf.vercel.app`, including after redirects): the sandbox runs scripts with the frame's own storage, which is only safe while the content stays cross-origin.
- For a Hugging Face Space use the Space's `appUrl` as the demo address, not the `huggingface.co` page.
- **Popups** and **downloads** are per-demo flags, off by default. **Provider login (OAuth) demos stay external:** qualification cannot sign in and verify the result back in the demo, so popup hosts such as accounts.google.com and github.com are refused in scenarios. The popup flag is for ordinary windows (documentation, previews). A download passes only when the whole file is saved, is not empty, and (if given) has the expected name and size.
- Neither top-navigation sandbox flag is ever allowed. A demo that tries to replace RepoShelf fails qualification.
- Demos that need camera, microphone or location stay external: the site-wide Permissions-Policy denies them and an iframe cannot override it. Also keep payments, wallets, credential requests and complicated logins out. For GPU or WebGL demos, test a representative operation and visible output; if the runner cannot meaningfully verify it, keep the demo external for the pilot.

## Scenario revisions

Every change to a scenario or demo address bumps a **revision**, stored with the editor and time (the page shows the revision; the last five are kept). Editing invalidates earlier evidence immediately, because eligibility requires evidence for the **saved scenario hash**. A qualification run that finishes after its scenario or address changed is **rejected by the server**, not recorded.

## What counts as eligible

A demo opens in the viewer only if **all** hold: global switch on; approved; not manually disabled; not suspended; an `https://` address that is not RepoShelf; and **for every required browser profile** the latest run **passed**, for the **exact current address, saved scenario and viewer configuration**, **within 48 hours**.

- Evidence is tracked **per browser profile** (`chromium`, `chromium-mobile`, `webkit`, `webkit-mobile`, `firefox`; Firefox has no mobile emulation). A passing Chromium run never hides or clears another profile's failure: any profile whose latest run failed or was inconclusive keeps the demo external until it passes again, or an administrator explicitly clears that profile's result (for example when retiring a profile).
- Which profiles must pass is set on the administrator page (default `chromium`). The daily workflow runs every profile but skips those not required.
- Changing the address, scenario, or the popup/download flags invalidates evidence until the demo is re-qualified.

Reasons are shown in plain language on the administrator page. `GET /api/viewer?id=owner/repo` returns the same decision for visitors, uncached; any backend problem answers "not eligible".

## Qualification

`scripts/viewer-qualify.mjs` loads the **real viewer component and stylesheet, with the production response headers from `vercel.json`** (including the Permissions-Policy), on a page served as `https://www.reposhelf.co.uk`. It checks the frame carries the exact sandbox, runs the scenario inside it, and records: result, reason, browser profile, timestamp, resolved URL after redirects, configuration id, scenario hash, popup destinations, saved downloads (with size), top-navigation attempts and console errors.

- **Navigation is checked while the scenario runs, not only before it.** Any request aimed at RepoShelf (apart from the qualification page itself) is refused before it loads, every address the frame visits is recorded and validated, and the **address the frame ended on** (not the one it started on) is what gets validated and stored as the resolved URL.
- Every browser request and redirect must go to a **public address** (the same check the health checker uses). A request to a private address fails the run (`unsafe_destination`).
- **ok**: every step passed and nothing unexpected happened.
- **failed**: frame refused, HTTP error, top-navigation attempt, unsafe destination, RepoShelf as the destination, a step that cannot find its element, an unexpected popup or download, an incomplete download, or a non-https address.
- **inconclusive**: load timeout, challenge page, or a problem in the tool itself. Inconclusive is never a pass.

```
node scripts/viewer-qualify.mjs --url=https://demo.example/ --scenario=scenario.json [--popups] [--downloads] [--browser=chromium|webkit|firefox] [--mobile] [--screenshot=out.png]
node scripts/viewer-qualify.mjs --queue [--if-required] [--browser=...] [--mobile]   # the daily job, one profile at a time
```

Playwright WebKit and mobile emulation supplement, and do not replace, checks on real Safari and real devices, which are repeated by hand after significant demo or viewer changes. Qualification shows a demo can work; it cannot guarantee every visitor's session.

**Alerting:** the workflow publishes a summary on the run page and **fails the job when any demo failed, could not be checked, or was left unchecked** (time budget or queue limit), because unchecked demos' evidence would silently expire, so GitHub's failed-run notification is the alert. The administrator page also warns when any approved demo's evidence is missing or older than 36 hours, which catches a missed run before the 48-hour limit.

## Opening demos in the viewer from the storefront (administrators only)

**Administration → Demo viewer → "Open demos in the viewer on RepoShelf"** is a per-account switch for hand-checking demos while browsing the storefront. It needs **migration 23**, `supabase/migrations/202610070023_viewer_admin_preview.sql`, applied in the Supabase SQL editor (safe to run twice). Until then the switch reports that it is unavailable and demos keep opening in a new tab.

- **On:** every "Try demo" link opens that demo inside the viewer as an **unqualified preview**, whether or not it has passed qualification. The viewer bar looks the same as it does for visitors; `data-mode="preview"` on the dialog says which it is. "Open in new tab" and "Close" are always available.
- **Off (the default), and for every visitor:** "Try demo" opens a new tab exactly as before. The viewer code is not even downloaded unless an administrator has the switch on.
- The setting follows the account across devices and is read when a storefront page loads, so **reload the storefront after changing it**.
- Anything the viewer refuses to frame (a non-https address, or a demo on RepoShelf itself) opens in a new tab. Some sites forbid being framed at all; the viewer then shows an empty or blocked frame, and "Open in new tab" is the way out. For Hugging Face Spaces the listing's demo address can be the Space page rather than its `appUrl`, which may refuse to be framed.
- **Before opening, the server checks the demo** (`GET /api/viewer?action=frame-check`, administrators only) from its real response headers. A demo that forbids framing (`X-Frame-Options`, CSP `frame-ancestors`), cannot be reached, or is uncertain opens in a new tab with a short note. If the browser blocks that automatic tab, the note carries an "Open in new tab" link.
- **Rewrites the check applies:** a Hugging Face Space opens at its own app address (looked up from Hugging Face's public API; the `huggingface.co/spaces/...` page can never be framed), `http://` addresses are tried at `https://`, and Streamlit apps (`*.streamlit.app`) get `?embed=true`, without which they loop through sign-in redirects inside a frame.

### What the diagnosis found (run "Demo viewer diagnosis", 2026-10-07, 300 sampled working demos in the real viewer)

| Cause | Share of sample | What the viewer does now |
|---|---|---|
| Hugging Face Space **page** (always blocked) | 30% (91 of 300) | Opens the Space's app address instead: 96.5% of those load |
| Site forbids framing (Colab, python.org, arXiv, Discord, golang.org, DHTMLX and others) | about 6% of non-Hugging Face demos | Detected in advance, opens in a new tab |
| `http://` demo address | about 4% | Tried at `https://` |
| Streamlit redirect loop | about 3% | `?embed=true`; some of those apps are asleep and show Streamlit's own wake-up page |
| Loads but shows nothing (Flutter web, WebGL games, a login page) | about 1% | Not detected in advance; "Open in new tab" is the way out |
| Down, error page, slow | about 1% | Mostly detected by the header check |

The diagnosis is repeatable: **Actions → Demo viewer diagnosis** (optional `only` host and `variant=embed` inputs). It runs in Chromium only; Safari and Firefox, and visitors who block third-party cookies, can differ.

- This is **manual** checking. The automated check is the daily qualification job described above, which runs each approved demo's scenario in the viewer.

## The two preview modes

On the administrator page each demo has two buttons:

- **Unqualified preview** skips every eligibility check and polling. The bar is not labelled; only administrators can open it.
- **Test as visitor** runs the **real** path: the uncached eligibility check before the frame is created, polling while open, a recheck when the tab regains focus, and shutdown when the demo is disabled or its address or configuration changes. If the demo is not eligible it does not open and says why.

## Disabling and propagation

- **Manual disable** is cleared only by an administrator. A successful qualification never clears it.
- A failed or inconclusive qualification in any profile suspends the demo; only a later pass in that same profile (or an explicit clearance) lifts it.
- While a viewer is open it re-checks every **45 seconds**, each request has a **4-second timeout**, and it re-checks as soon as the tab regains focus. It closes if the check fails, times out, or reports a different address or configuration. About a minute is a **foreground target**: browsers throttle timers in background tabs, so there is no strict guarantee.

## Function limit

The Vercel Hobby plan allows at most **12 serverless functions** per deployment, and a 13th fails the build only after the push. The viewer endpoint therefore shares the editorial function instead of having its own file, and `tests/deployment-limits.mjs` fails if `api/` ever holds more than 12 files.

## Not done yet (by design)

- No visitor-facing button, report action or analytics events.
- No site-wide Content-Security-Policy. The pilot plan is exact `frame-src` origins for approved demos (the evidence records the resolved origins), added when the viewer reaches visitors. A comprehensive CSP is a separate change, in report-only mode first.
- Provider-login (OAuth) demos are out of the pilot.
