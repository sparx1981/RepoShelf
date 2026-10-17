# Full QA report and fix plan — 17 October 2026

Scope: the whole application, code and live site, with extra depth on browsing and search, accounts and My collection, prompts and Studio, and administration, the MCP connector and the syncs. Tested at commit `fb8a561387` (main). Nothing in the application was changed by this QA pass; this file is the only addition.

## 1. Summary

The core is solid. Every automated suite passes, the database chain applies cleanly twice on a fresh database, private data is properly locked down (no path for one member to read another's data, every write checks its origin, every admin function checks admin rights in the database), and the live pages load quickly with no console errors or broken requests.

The problems found are mostly in four places:

1. **Things the public can reach that they should not**: the full 216 MB raw catalogue file, an open redirect on the site's own domain, and no protection against the site being framed.
2. **Browsing bugs a visitor will hit**: "View all" on the Trendshift shelf breaks the home page, and one-letter searches say "No projects found".
3. **Pipeline and CI reliability**: the main check is red on most pushes because it does not wait long enough for Vercel, a failed validation does not stop the catalogue pipeline, and shared scheduling can silently drop the daily X import.
4. **Prompt customiser and fill-in edge cases** that can break the live preview or let board text into the brief.

| Severity | Count |
|---|---|
| High | 4 |
| Medium | 22 |
| Low | 27 |

**Fix first (all small):** QA-01 (catalogue files), QA-02 (Trendshift View all), QA-03 (open redirect), QA-05 (single-letter search), QA-06 (MCP batch limit), QA-07 (pipeline continues after failed tests), QA-04 (CI deploy wait).

How to read the evidence column:
- **Live**: reproduced on www.reposhelf.co.uk during this pass.
- **Repro**: reproduced locally by running the real code.
- **Code**: traced through the code but not reproduced.
- **Likely**: the code path is confirmed, but whether it happens depends on timing or data.

## Fix status

Updated as phases are completed. "Fixed" means changed, covered by a new or extended test, and passing; it is live only after the commit reaches `main` and Vercel deploys it.

| ID | Status | What changed | Test |
|---|---|---|---|
| QA-01 | Fixed (Phase 1) | `scripts/prune-public-data.mjs` runs at the end of the production build (`vercel.json`) and removes `catalog.json`, `spaces.json` and their 64 shard files from the published output. The CI build is unchanged, because later checks read them. | `tests/public-data.mjs`; `verify-deployed-api.mjs` fails if `/catalog.json`, `/spaces.json` or a shard is still served |
| QA-02 | Fixed (Phase 1) | The sort box gained "Trending on Trendshift", unknown shelf rankings fall back to Popular, and a blank sort box no longer stops the page from redrawing. | `tests/sort-options.mjs` |
| QA-05 | Fixed (Phase 1) | One-letter searches now run, and the grid shows its loading state while a search waits for its short delay. | `tests/sort-options.mjs`; `verify-browsing-ui.mjs` |
| QA-14 | Partly fixed (Phase 1) | `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` on every response, so other sites cannot frame pages but same-site previews still work. A full script policy is still open. | `tests/security-headers.mjs`; `verify-deployed-api.mjs` checks the live header |
| QA-22 | Fixed (Phase 1) | `connect.html` and `privacy.html` now say the connector can read the owner's boards, and the policy has a "Your boards" paragraph. The legal version was not bumped; that is your decision. | `tests/boards.mjs` |
| QA-27 | Fixed (Phase 1) | The board name on the `board:` line is cleaned like the item lines, and dropdown labels are one line. | `verify-prompt-fields-ui.mjs` |
| QA-28 | Fixed (Phase 1) | "Clear all boxes" re-enables the Reference board dropdown, and a board that finishes loading after Clear is not applied. | `verify-prompt-fields-ui.mjs` |
| QA-03 | Fixed (Phase 2) | `/api/open` now shows a "You are leaving RepoShelf" page, naming the destination, for any link that does not come from a RepoShelf page (the browser's `Sec-Fetch-Site` header; a missing header counts as outside). Links from RepoShelf pages go straight through. Sign-in can now return only to fork and duplicate links, so the page cannot be reached through a sign-in. I did not use a catalogue lookup, because README, community and documentation links go to arbitrary sites. | `tests/open-redirect.mjs`; `tests/accounts.mjs`; `verify-deployed-api.mjs` checks the live page |
| QA-06 | Fixed (Phase 2) | JSON-RPC batches are refused with `-32600` before the rate limit and before any tool runs. | `tests/mcp-batch.mjs` |
| QA-21 | Fixed (Phase 2) | A failed or cancelled Google or GitHub link clears only its one-off cookies, so the member stays signed in and sees the explanation. Link and merge starts from another site are refused. | `tests/session-robustness.mjs` |
| QA-42 | Fixed (Phase 2) | A 403 from the sign-in service for a deleted or merged user is treated as an expired session: the cookies are cleared and the member is asked to sign in again. | `tests/session-robustness.mjs` |
| QA-44 | Fixed (Phase 2) | Linking Google leaves the stored GitHub token alone. | `tests/session-robustness.mjs`; `tests/google-signin.mjs` |
| QA-26 | Fixed (Phase 2) | Every workflow installs with `npm ci --ignore-scripts` from the lockfile (Playwright with `--ignore-scripts`), and read-only workflows and the catalogue browser shards no longer keep the token on disk. | `tests/workflow-hardening.mjs` |
| QA-52 (part) | Fixed (Phase 2) | The manual-run inputs of `viewer-diagnose.yml` and `frame-probe.yml` now go through `env:` and are quoted. The wording on the connect page about revocation is still open. | `tests/workflow-hardening.mjs` |
| QA-53 (part) | Fixed (Phase 2) | A badly encoded cookie on the host can no longer break sign-in, every account route, or sign-out. | `tests/session-robustness.mjs` |
| QA-04 | Fixed (Phase 3) | `scripts/wait-for-deployment.mjs` waits (up to 35 minutes) for the commit's Vercel build status before the live checks run, fails with a clear message if the build itself failed, and steps aside when Vercel skipped the build or a newer commit is on `main`. The job timeout is now 55 minutes. Vercel's builds were taking 17 to 26 minutes, which is why the old 2.5-minute wait gave up. | `tests/wait-for-deployment.mjs` (real status shapes); run against the live API for `fb8a561387` |
| QA-07 | Fixed (Phase 3) | The taxonomy refresh, growth record, browser queue check and browser handoff in `catalog.yml` now also require the catalogue tests and build to have passed. The failure itself is still written to the sync report. | `tests/workflow-hardening.mjs` |
| QA-09 | Fixed (Phase 3) | The deploy filter diffs everything since the last successful deployment (`VERCEL_GIT_PREVIOUS_SHA`), skips a checkpoint-only range only if every commit in it is a checkpoint, and builds when the previous deployment is not in the clone. | `tests/deployment-policy.mjs` (including a real git repository) |
| QA-08 | Fixed (Phase 3) | The X import now waits for the external collector in a separate job outside the shared concurrency group. Every workflow in that group counts as busy for the other dispatchers (the X import was missing). If the scheduled import was cancelled, the maintenance timer starts it once after 08:30 UTC, never repeats a real failure, and never more than once a day. | `tests/x-import-policy.mjs`; `tests/workflow-hardening.mjs` |
| QA-46 | Fixed (Phase 3) | Cause found: the catch-up sync on 17 October failed at its last step because the checkpoint commit was taken on an older `main` commit but carried the newer working tree, so it differed from its base in `.github/workflows/checks.yml` and GitHub refuses that from an Actions token ("without `workflows` permission"). Any workflow edit during a sync did this. Workflow files in the checkpoint now always equal the base commit's. The three publication failures on 16 October were a different, earlier-fixed cause (a catalogue file over Node's string limit). | `tests/checkpoint-history.mjs` |
| QA-47 | Fixed (Phase 3) | Artifact cleanup no longer deletes `publication-recovery-*` artifacts (uploaded only when a publication fails). The large per-sync artifacts are still removed after 3 hours. | `tests/workflow-hardening.mjs` |
| QA-40 | Fixed (Phase 3) | `verify-studio-ui.mjs` starts its own server, expects the real background count (static plus live), and accepts the current ASCII text detail. It and `verify-sync-layout.mjs` now run in CI, and a test fails if any `verify-*-ui` script is not in `checks.yml`. | `tests/workflow-hardening.mjs`; the script itself |
| QA-41 | Fixed (Phase 3) | The two Studio migrations that created the temporary `http` extension are now no-ops for it (the import is finished and later migrations remove it). All five Studio migrations run twice in the CI chain against a small Storage stand-in, with a new `tests/database-studio.sql`. The production migration check is now 123 of 123 on the test database. | `tests/database-studio.sql` |
| QA-10 | Fixed (Phase 4) | A shelf service version that keeps changing restarts the home page at most twice a minute, then carries on with what it has. | `scripts/verify-shelves-ui.mjs` |
| QA-11 | Fixed (Phase 4) | A shelf the service leaves out is treated as empty instead of loading forever. | `scripts/verify-shelves-ui.mjs` |
| QA-12 | Fixed (Phase 4) | A deep link to a listing that has not passed the publication checks shows its details, says it is unverified, and offers no demo link, evidence or screenshots. | `tests/detail-unverified.mjs` |
| QA-16 | Fixed (Phase 4) | Opening a project with "hide seen" on no longer resets "Show more"; later pages reuse the exclusion list their first page used. | `scripts/verify-shelves-ui.mjs` |
| QA-13 | Fixed (Phase 4) | The featured-project banner has previous, pause and next buttons (hidden when there is only one project) and stops rotating while paused. | `scripts/verify-shelves-ui.mjs` |
| QA-15 | Fixed (Phase 4) | Keyboard focus survives a re-render after liking or saving a project (the shelves and the detail panel). | `scripts/verify-shelves-ui.mjs` |
| QA-30 | Fixed (Phase 4) | The scrollable code blocks on the connect page and the tables on the cookies page can be reached by keyboard and are named regions. | `tests/accessibility-markup.mjs` |
| QA-31 | Fixed (Phase 4) | View toggles, filters, rank buttons and gallery thumbnails report `aria-pressed`; the shelf placeholders are no longer live regions. | `scripts/verify-shelves-ui.mjs` |
| QA-32 | Fixed (Phase 4) | Fork buttons meet the 24 px target size; Studio has a single `<h1>`. | `scripts/verify-shelves-ui.mjs`, `tests/accessibility-markup.mjs` |
| QA-48 | Fixed (Phase 4) | Unknown addresses, including unknown `/projects/…` pages, show a branded noindex 404 page with links back. | `tests/not-found-page.mjs` |
| QA-53 (part) | Fixed (Phase 4) | Project detail responses are cached at the edge for 5 minutes (plus 5 minutes stale-while-revalidate) and purged with the shelves. | `tests/detail-cache.mjs` |
| QA-17 | Fixed (Phase 5) | The Live page is swapped as markup. Brand names and quoted copy change only in visible text and in the alt, title, aria-label, placeholder and value attributes, never in scripts, styles, class names or ids. Colours, fonts and links also follow into styles, attributes and the quoted strings of scripts. | `tests/prompt-customise.mjs` |
| QA-18 | Fixed (Phase 5) | A font swap leaves longer family names alone (Inter Tight, Roboto Mono, Geist Mono, Barlow Condensed, Archivo Black and others), in the prompt and in the Live page, including Google Fonts links. | `tests/prompt-customise.mjs` |
| QA-35 | Fixed (Phase 5) | An unedited prompt is returned exactly as written. | `tests/prompt-customise.mjs` |
| QA-36 | Fixed (Phase 5) | Changed quoted lines are applied before the brand name, so a text change survives a brand change; a text swap no longer reaches inside a longer line the prompt also quotes ("View" inside "View all"). | `tests/prompt-customise.mjs` |
| QA-19 | Fixed (Phase 5) | The admin save records which of title, category and description changed (`ss_prompts.edited_fields`), writes only fields that really changed (line-ending differences are not edits), and the SceneAI import leaves edited fields alone. Needs migration `202610180038`; until it runs, saves work but edits are not remembered. | `tests/prompt-edits.mjs`; `tests/database-prompt-edits.sql` |
| QA-38 | Fixed (Phase 5) | Deleting a prompt in the admin records it in `ss_prompt_tombstones`; the SceneAI and MotionSites imports skip those ids. Needs migration `202610180038`. | `tests/prompt-edits.mjs`; `tests/database-prompt-edits.sql` |
| QA-37 | Fixed (Phase 5) | `area=bundle` returns the prompt with `html:null` when a page prompt has no generated page yet, and the viewer hides the Live and Code tabs and shows the prompt. | `tests/prompt-edits.mjs`; `scripts/verify-prompt-fields-ui.mjs` |
| QA-34 | Fixed (Phase 5) | Signed-in members get the Customise analysis as soon as a page prompt opens, so the Live page shows saved changes without visiting the Prompt tab. The Code tab, Copy code and the zip carry the changes too (the Code tab says so). | `scripts/verify-prompt-fields-ui.mjs` |
| QA-33 | Fixed (Phase 5) | Only a click outside the dialog's box closes it; a tap on its padding or a keyboard click does not. | `scripts/verify-prompt-fields-ui.mjs` |
| QA-29 | Fixed (Phase 5) | The fill-in boxes and the customiser keep their values under separate keys (`reposhelf.promptfields.v2.<account>` and `reposhelf.promptcustomise.v2.<account>`), only while signed in, and both are removed on sign-out. The Cookie Policy page lists the new keys. | `scripts/verify-prompt-fields-ui.mjs`; `tests/cookie-policy.mjs` |
| QA-20 | Fixed (Phase 5), decision: the page code is public | The wording now says the running page is open to everyone and that signing in gives the code with a copy button and the download. | |
| QA-39 | Open: accepted for now | Decision: leave the same-origin UI-component preview for later; it needs a second domain. | |
| QA-49 | Fixed (Phase 6) | One migration (`202610180039_advisor_fixes.sql`): `auth.uid()` and `reposhelf_is_admin()` are called once per query in the four flagged policies; the editorial tables have one read policy per role (the administrators' policy now covers writes only); eight missing foreign-key indexes are added. The other application's `shelf_extensions` index is left alone (QA-25). | `tests/database-advisor-fixes.sql` |
| QA-50 | Needs you | Turn on "Prevent use of leaked passwords" in the Supabase dashboard (Authentication, Providers, Email). It is a dashboard setting and cannot be changed from the repository. Sign-in is OAuth-only, so the impact is small. | |
| QA-51 | Fixed (Phase 6) | Prompt thumbnails are cached for one hour at the CDN (was a day, plus a week stale) and their address carries the update time; project screenshots are cached for an hour, then a day stale (was a day, plus a week stale). | `tests/prompts.mjs` |
| QA-52 | Fixed (Phase 6) | The connect page now says a revoked key stops working "within a minute". | |
| QA-53 | Fixed (Phase 6) | The "＋ Board" button appears only on All saved and Liked cards. The account export lists sign-in methods and connector keys (never a key); the merge preview counts boards and connector keys (migration `202610180040`). Creating a connector key and confirming a merge require accepted Terms. A board created while the list is loading is in the list before its first item is added. "1 project" is singular. The dead functions `hydrate`, `loadEditorial`, `reportDemoUrl` and `classify` are gone from `app.js`. Workflows run JavaScript actions on Node 24. The `/api/open` docs were already corrected in Phase 2, and the hero pause/play line in `docs/QA_2026_10_04.md` is true now. The sitemap's 5,000 static project pages (of 31,723) stay as they are: it is a deliberate size limit, now written down here as a reviewed choice. | `tests/database-export-merge.sql`; `tests/legal.mjs`; `tests/workflow-hardening.mjs`; `scripts/verify-boards-ui.mjs` |
| QA-25 | Open: needs your decision | Where the SketchUp Shelf data should live. |  |

## 2. What was run

| Check | Result |
|---|---|
| `node scripts/check.mjs` (syntax and static build validation) | Pass |
| `npm test` (131 suites) | Pass. One optional check skipped: browser shader compilation needs `REPOSHELF_PLAYWRIGHT_MODULE`. |
| `npm run test:mcp` (official MCP client over HTTP and stdio) | Pass |
| Database chain from `checks.yml` on a fresh PostgreSQL 16 database (84 steps: every migration twice plus every database test) | Pass, 0 failures |
| `supabase/verify_migrations.sql` on that database | 122 / 123. The one false row is a Studio migration that needs Supabase's `http` extension (see QA-41). |
| Production migration check (run by the owner in Supabase) | All true |
| 26 browser verification scripts (Playwright) | 25 pass. `verify-studio-ui.mjs` fails and is not in CI (QA-40). |
| `verify-deployed-api.mjs` against production | Pass |
| `verify-deployed-discovery.mjs` against production | Pass, with one warning: the operator REST API is not configured (QA-45). |
| Live page audit: 15 pages × desktop and mobile; status, console errors, failed requests, horizontal overflow, axe-core WCAG 2 A/AA | All 200; no failed requests; no overflow; 2 axe "serious" issues (QA-30) |
| Live interaction checks: search, filters, prompts dialog, Studio tabs, 404s | 2 bugs reproduced (QA-02, QA-05) |
| Live HTTP checks: headers, robots, sitemap, API status codes, caching | See QA-01, QA-03, QA-14, QA-48 |
| Vercel runtime errors, last 7 days | 1 error: `/api/editorial` exited with code 1 once on 15 October; not recurring |
| GitHub Actions, last 100 runs | Check application failed 8 of 13; catch-up sync 2 of 8; publication 3 of 8; X import failed on its only run (QA-04, QA-08, QA-46) |
| Supabase security and performance advisors | Reviewed (QA-29, QA-49, QA-50) |
| Four independent code reviews, one per focus area | Findings verified and merged below |

Not covered:
- Signed-in journeys on the live site. No test account was used: likes, boards, fork verification, account deletion and merge were tested only with fixtures.
- Real payments (they are disabled).
- Search Console and Bing indexing, which need owner access.
- A local `npm run build`, because it rewrites about 63,000 tracked files. CI's build step passed on `fb8a561387`.

## 3. Findings

### High

**QA-01 · High · Live: the full raw catalogue is publicly downloadable (216 MB)**
- **What happens:**
  - `https://www.reposhelf.co.uk/catalog.json` (216 MB) and `/spaces.json` (36 MB) are served with status 200, along with 66 `catalog.part-*` / `spaces.part-*` files.
  - They contain every record, including unpublished, quarantined and moderated listings, plus internal fields such as `checkError`, `demoEvidence`, `qualityPriority`, `agentContext` and `consecutiveFailures`.
  - About 470 downloads of `/catalog.json` would use the whole 100 GB monthly Hobby bandwidth allowance.
  - Listing controls (hiding a listing) do not apply to these files.
- **Where:** the `package.json` build unpacks into `dist/`; `vercel.json` sets `outputDirectory: dist`.
- **Fix:** unpack to a folder outside `dist/` (for example `data/runtime/`, which the functions already read), or delete these files from `dist/` at the end of the build. Add a `vercel.json` rule that returns 404 for `/catalog*` and `/spaces*` as a backstop. Then add a check to `verify-deployed-api.mjs` that `/catalog.json` returns 404.
- **Effort:** S

**QA-02 · High · Live: "View all" on the Trendshift shelf breaks the home page**
- **What happens:**
  - The button has `data-rank="trendshift"`, but the sort dropdown has no `trendshift` option, so its value becomes `""`.
  - Every later render throws `Cannot read properties of undefined (reading 'textContent')`.
  - The grid never appears, filters stop responding, and only a reload recovers the page.
- **Where:** `dist/app.js` (View all handler, and `render()` reading `#sort.selectedOptions[0]`).
- **Fix:** map shelf modes to valid sorts (Trendshift goes to `trending`, or add a "Trending on Trendshift" option), and guard `selectedOptions[0]`. Add a browser check that clicks every shelf's View all.
- **Effort:** S

**QA-03 · High · Live: open redirect on the site's own domain, including after sign-in**
- **What happens:**
  - `/api/open?url=https://example.org/…` returns a 302 to any http(s) address, with no sign-in.
  - `/api/auth?action=start&return=/api/open?url=https://evil.example` sends a visitor through a real GitHub sign-in and then on to the attacker's page. That is an ideal phishing setup ("your session expired, sign in again").
- **Where:** `api/open.mjs`; `lib/accounts.mjs` (`authReturn` accepts any `/api/open?url=`).
- **Fix:** accept a project id and field name (for example `?id=owner/repo&link=demo`) and redirect only to the address stored in the catalogue for that project. If that is not possible, sign outbound URLs with an HMAC, or show a "You are leaving RepoShelf" page for unknown hosts. Apply the same rule in `authReturn`. Update `tests/accounts.mjs` and `docs/BROWSING.md`.
- **Effort:** M

**QA-04 · High (process) · Live: the main CI check is red on most pushes for a reason unrelated to the code**
- **What happens:**
  - "Check application" failed 8 of its last 13 runs.
  - The failing step is "Verify deployed agent routes", which polls production for about 2.5 minutes (24 tries, 5 seconds apart) and then fails with "Production search UI does not match this commit".
  - Vercel builds of this repository routinely take longer than that, so a correct commit goes red. Real failures are now hidden in the noise.
- **Where:** `scripts/verify-deployed-api.mjs`; `.github/workflows/checks.yml`.
- **Fix:** wait for the Vercel deployment of the exact SHA before probing. Either trigger the live checks from GitHub's `deployment_status` event, which Vercel posts, or poll for up to 15 minutes. Skip the live comparison when `deployment-policy` skipped the build.
- **Effort:** S–M

### Medium

**QA-05 · Medium · Live: one-letter searches show a false "No projects found"**
- **What happens:**
  - Typing `r` shows "No projects found… Try a different search" next to "31,723 projects".
  - `scheduleBrowse` ignores one-character queries, but the grid still switches to search mode.
  - Every search started from the storefront also flashes the empty state for the 350 ms debounce.
- **Where:** `dist/app.js`.
- **Fix:** show a "Searching…" state while a search is pending or debounced, and hide the count. Allow one-character queries, which the server already handles.
- **Effort:** S

**QA-06 · Medium · Repro: JSON-RPC batches bypass the connector's 120-per-minute limit (up to 100×)**
- **What happens:** one POST holding 100 `tools/call` messages counts as one hit but runs 100 calls. Usage analytics record only the first tool.
- **Where:** `lib/mcp-endpoint.mjs`.
- **Fix:** reject array bodies with 400 (protocol 2025-06-18 dropped batching), or charge the gate once per element. Add a test.
- **Effort:** S

**QA-07 · Medium · Code: a failed "Validate catalog logic" step does not stop the catalogue pipeline**
- **What happens:** when `npm test` or the build fails in `catalog.yml`, the reclassification, checkpoint, browser shards and `refresh` steps still run (`if: always() && steps.baseline.outcome == 'success'`). The result is then saved for the next daily publication.
- **Fix:** add `&& steps.validate.outcome == 'success'` to those conditions, or leave the handoff SHA empty when validation fails.
- **Effort:** S

**QA-08 · Medium · Likely: the shared `reposhelf-catalog` concurrency group silently drops queued runs**
- **What happens:**
  - The catalogue sync (`17 */2`), the X import (`20 6`), publication (`35 6`), submissions and recovery share one group.
  - GitHub keeps only one pending run per group, so when the 06:17 sync is still running, the 06:35 publication replaces the 06:20 X import.
  - Nothing re-requests a lost X import. The X import's own last run also failed: "Collector did not succeed".
- **Where:** `.github/workflows/{catalog,x-intake,publication,submissions,recovery}.yml`; `scripts/sync-watchdog.mjs`; `lib/workflow-control.mjs`.
- **Fix:**
  - Move the X import cron out of the 06:17–09:00 window, or chain it after publication.
  - Split its 20-minute collector wait into a job outside the group.
  - Make every dispatcher treat any non-completed run in the group (including x-intake and recovery) as busy.
- **Effort:** M

**QA-09 · Medium · Code: the deploy filter looks only at the last commit of a push**
- **What happens:** `scripts/deployment-policy.mjs` runs `git diff-tree HEAD`. If a push contains a server change followed by a test-only commit, Vercel's build of the newest commit is skipped and the server change never goes live.
- **Fix:** diff `VERCEL_GIT_PREVIOUS_SHA..HEAD`, and build when that range cannot be resolved.
- **Effort:** S

**QA-10 · Medium · Likely: live click counts in the storefront version can cause a shelf reload loop**
- **What happens:**
  - The "Popular on RepoShelf" shelf hashes live 30-day view counts into `catalogVersion`.
  - The first storefront response and the per-shelf responses are cached separately, so their versions can differ. A mismatch makes `loadShelves` refetch the page, shelves revert to "Projects load as you browse…", and the cycle can repeat.
  - The same causes "Show more" on that sort to drop back to page 1 (409 `catalog_changed`).
  - Not seen in a 70-second live sample (28 shelf requests, none repeated).
- **Where:** `lib/browse-service.mjs`; `dist/app.js`.
- **Fix:** keep view counts out of the version (version shelf contents separately), and cap mismatch retries.
- **Effort:** M

**QA-11 · Medium · Likely: a shelf missing from the response is requested again forever**
- **What happens:** if an admin disables or deletes a shelf while visitors have the page open, its placeholder stays and a new IntersectionObserver requests it again on every render.
- **Where:** `dist/app.js`.
- **Fix:** mark requested ids that come back missing as removed.
- **Effort:** S

**QA-12 · Medium · Code: deep links show unpublished or quarantined listings with a "Try demo" button**
- **What happens:** `action=detail` does not check `publishedEligible`, so `/?project=owner/repo` opens unverified listings with a prominent demo link.
- **Where:** `lib/browse-service.mjs`; `dist/app.js`.
- **Fix:** for non-published records, hide the demo button and label the listing "Not yet verified".
- **Effort:** S

**QA-13 · Medium · Code: the hero carousel has no pause button and no previous/next controls (WCAG 2.2.2)**
- **What happens:** the hero rotates every 8 seconds and pauses only temporarily. A `[data-hero-step]` handler exists, but no element uses it. `docs/QA_2026_10_04.md` wrongly says it has pause/play.
- **Fix:** add a persistent pause toggle and previous/next buttons.
- **Effort:** S

**QA-14 · Medium · Live: no Content-Security-Policy and no framing protection**
- **What happens:** responses send no `frame-ancestors` and no `X-Frame-Options`, so the storefront, sign-in and admin pages can be framed (clickjacking). There is also no CSP as a second line of defence for a UI built mostly with `innerHTML`.
- **Where:** `vercel.json`.
- **Fix:** add `Content-Security-Policy: frame-ancestors 'none'` now. Add a full `script-src` policy later, after an inventory of inline scripts.
- **Effort:** S (framing), M (full CSP)

**QA-15 · Medium · Code: keyboard focus is lost after liking a project in the grid or the detail dialog**
- **What happens:** the grid and the dialog are re-rendered with `innerHTML`, so the focused button disappears and focus jumps to the page body.
- **Where:** `dist/app.js`.
- **Fix:** update like buttons in place, or restore focus by key the way `reconcileRibbons` does.
- **Effort:** S

**QA-16 · Medium · Code: with "Hide already seen" on, opening a project resets pagination**
- **What happens:** opening a project grows the exclude list, which changes the browse key and reloads page 1. Each change also sends the full history list (up to 5,000 ids).
- **Where:** `dist/app.js`.
- **Fix:** filter newly seen items on the client, and refetch only when filters change.
- **Effort:** S

**QA-17 · Medium · Repro: Customise swaps rewrite the page's CSS and JavaScript, breaking the Live page**
- **What happens:**
  - Brand and text swaps are plain regular expressions over the whole HTML.
  - Brand "Nova" → "Blue Fox" produced `const blue fox=…`, a syntax error.
  - Text "View" → "See work" produced `scrollIntoSee work(`, which stops the page's script.
  - A brand named Grid, Flex or Ease changes CSS such as `display:grid`.
- **Where:** `dist/prompt-customise.js` (`html()`).
- **Fix:** parse with DOMParser, change only text nodes and safe attributes (alt, title, aria-label, placeholder, value), and never touch `<script>` or `<style>`.
- **Effort:** M

**QA-18 · Medium · Repro: changing a font also changes longer font names that start with it**
- **What happens:** Inter → Poppins turns "Inter Tight" into "Poppins Tight", a font that does not exist. The same happens with Roboto Mono, Geist Mono, Barlow Condensed and Archivo Black.
- **Where:** `dist/prompt-customise.js`.
- **Fix:** drop spans covered by a longer detected font name.
- **Effort:** S

**QA-19 · Medium · Code: the weekly SceneAI sync overwrites admin edits to title, category and description**
- **What happens:** only `prompt` is protected from upstream changes, but the admin dialog says "Your edits are kept".
- **Where:** `lib/sceneai-sync.mjs`.
- **Fix:** store the original upstream values, or a list of edited fields, and update only fields that have not been edited. Send `prompt` from the dialog only when it changed: textarea newline normalisation otherwise marks prompts as edited.
- **Effort:** M

**QA-20 · Medium · Code: the Code tab's sign-in gate does not actually hide the code**
- **What happens:** `area=preview` is public, cached for an hour, and returns the same HTML that the Code tab, Copy code and the zip hold back for members.
- **Fix:** a product decision. Either say the page code is public, as Studio already does, or show guests an image instead of live HTML.
- **Effort:** S (wording), L (redesign)

**QA-21 · Medium · Repro: a failed or cancelled Google or GitHub link signs the member out and hides the explanation**
- **What happens:**
  - The link callback clears the session cookies, then redirects to `?link=failed`.
  - The message never shows, because the panel is hidden when the member is signed out.
  - `link-*` starts with a plain GET, so any site can trigger it and sign a member out.
- **Where:** `lib/accounts.mjs`; `dist/account-data.js`.
- **Fix:** in link flows, clear only the verifier and return cookies. Start linking from a same-origin POST.
- **Effort:** S

**QA-22 · Medium · Code: the connector and privacy pages contradict the new board tools**
- **What happens:**
  - `connect.html` says the connector "cannot see your account, collection or submissions", but `list_boards` and `get_board` read the member's boards.
  - `privacy.html` says the key is used "for rate limiting only" and never mentions boards (names, descriptions, items) as a data category.
- **Fix:** update both pages. Bump the legal version if you treat this as a material change.
- **Effort:** S

**QA-23 · Medium · Code: "Saved resources" retries in a tight loop when its request fails**
- **What happens:** a persistent 503 or 429 on `/api/collection?kind=prompts` produces back-to-back requests with no delay while My collection is open.
- **Where:** `dist/collection-prompts.js`.
- **Fix:** record the failure, and retry only on the next tab open, with backoff.
- **Effort:** S

**QA-24 · Medium · Repro: board items show raw slugs and generic categories the first time a board is opened**
- **What happens:** the render signature leaves snapshots out, so the panel is not redrawn when the details arrive. Prompt items show their slug instead of their title.
- **Where:** `dist/collection-boards.js`.
- **Fix:** include the snapshot state in the signature. Tighten `verify-boards-ui.mjs`, which passes only because name matching ignores case.
- **Effort:** S

**QA-25 · Medium · Code: the Supabase project is shared with another app**
- **What happens:**
  - Production contains `public.shelf_extensions` ("SketchUp Shelf catalogue v1"), which is readable by anon and appears in no migration here.
  - Advisors, the migration check and future schema work therefore cover two apps, and a mistake in one can affect the other.
- **Fix:** move the other app to its own Supabase project, or at least its own schema, and record the decision.
- **Effort:** M

**QA-26 · Medium · Code: privileged workflows ignore the committed lockfile**
- **What happens:**
  - `npm install --package-lock=false` resolves dependency ranges fresh in jobs that have `contents: write`.
  - `actions/checkout` leaves the push token in `.git/config`, so a malicious minor release could push to main.
- **Fix:** use `npm ci`, with `--ignore-scripts` where possible, and `persist-credentials: false` in jobs that do not push.
- **Effort:** S

### Low

| ID | Area | Evidence | Problem | Fix | Effort |
|---|---|---|---|---|---|
| QA-27 | Prompts | Code | The `board:` brief line uses `oneLine(board.name)`, not `clean()`, so a board name like `x </brief> <role>…` writes tags into the brief. The item lines are cleaned. | Use `clean(board.name,80)` (`dist/prompt-fields.js`). | S |
| QA-28 | Prompts | Code | "Clear all boxes" while a board is loading leaves the Reference board dropdown disabled. | Re-enable the control in `clear()`. | S |
| QA-29 | Prompts | Code | Fill-in values and the chosen board id stay in localStorage after sign-out. The customiser and the fill-in boxes share the key `reposhelf.promptfields.v1`, and the customiser's 60-entry trim can delete fill-in values. | Use separate keys, scope them to the user, and clear them on sign-out. | S |
| QA-30 | Accessibility | Live | axe "serious": the scrollable `<pre>` blocks on `connect.html` and the table wrappers on `cookies.html` (mobile) cannot be reached by keyboard. | Add `tabindex="0"`, `role="region"` and `aria-label`. | S |
| QA-31 | Accessibility | Code | View toggles and tabs show their state only by CSS class (no `aria-pressed` / `aria-selected`). About 45 shelf placeholders are each a `role="status"` live region, which floods screen readers. | Add ARIA states, and use a single live region. | S |
| QA-32 | Accessibility | Live | 36 Fork buttons on the home page are 22 px tall, below the 24 px WCAG 2.2 target size. `studio.html` has two `<h1>` elements. | Pad the buttons; demote the second heading. | S |
| QA-33 | Prompts | Code | Clicking the dialog's padding closes it (`e.target===dialog`), so taps near the edge on mobile close it. | Compare click coordinates with the dialog rectangle. | S |
| QA-34 | Prompts | Code | The Live page ignores saved customisations until the Prompt tab is opened. The Code tab and the zip always use the original HTML. | Mount the customiser's analysis when the bundle loads. | S |
| QA-35 | Prompts | Code | "Copy prompt" normalises whitespace even when nothing was customised (it collapses blank lines and trailing spaces). | Return the original text when there are no edits. | S |
| QA-36 | Prompts | Code | With both a brand and quoted text customised, the Live page drops the text change. | Apply text pairs before brand pairs. | S |
| QA-37 | Prompts | Code, latent | `area=bundle` returns 404 for page prompts that have no generated page, so members cannot read the prompt. Production currently has 0 such published prompts, but MotionSites imports would hit it. | Return the prompt with `html:null` and hide the Live and Code tabs. | S |
| QA-38 | Prompts | Code | Re-running the MotionSites or SceneAI import brings deleted prompts back. | Record deletions (tombstones) and skip them. | S |
| QA-39 | Prompts and Studio | Code | The UI-component preview frame uses `allow-scripts allow-same-origin` on the same origin, so a compromised component bundle would run with full site rights. | Serve previews from a separate origin. | M |
| QA-40 | Tests | Live run | `scripts/verify-studio-ui.mjs` and `verify-sync-layout.mjs` are not in CI. The Studio one times out waiting for "100 backgrounds"; the live count is 272. | Update the expectation and add both to `checks.yml`. | S |
| QA-41 | Database | Repro | The two Studio import migrations use `create extension http` without `if not exists`, so re-running them fails. `20261013224859` couples the bucket MIME update to that extension. None of the five Studio migrations are in the CI chain. | Make them idempotent no-ops now that the import is finished, and add a storage stub plus these migrations to CI. | S |
| QA-42 | Accounts | Repro | A 403 from Supabase for a deleted or merged user shows "Administrator access is required." and never clears the cookies. | Treat a 403 from `/auth/v1/user` like a 401: refresh, then clear the session. Use a neutral message. | S |
| QA-43 | Accounts | Code | The saved-resources list ignores its cursor (`project_id` is overwritten), so with 500+ saved resources Studio's paging loop never ends. | Combine both conditions in an `and=(…)` filter (`api/collection.mjs`). | S |
| QA-44 | Accounts | Code | Linking Google deletes the stored GitHub token, so fork checks fall back to rate-limited anonymous calls. | Touch the GitHub cookie only on GitHub flows. | S |
| QA-45 | MCP | Live | The operator REST API (`/api/v1/*`) returns 503 `not_configured` because `REPOSHELF_API_KEY` is not set in production. The member MCP connector works. | Set the key in Vercel if the operator API is wanted; otherwise say in `docs/AGENT_API.md` that it is off. | S |
| QA-46 | Syncs | Live | The catch-up sync failed at "Save completed sync for daily publication" (run 39019516424) and publication failed 3 times on 16 October. The causes need a closer look in the step logs. | Investigate; add the failing step's reason to the sync report. | M |
| QA-47 | Syncs | Code | Artifact cleanup deletes every artifact older than 3 hours, including the recovery artifacts the logs say are kept for 7 days. | Exclude `*-recovery-*` by name. | S |
| QA-48 | Browsing | Live | Unknown pages get Vercel's plain "The page could not be found" text, and unknown `/projects/…` pages get a bare "Not found". | Add a styled `dist/404.html`. | S |
| QA-49 | Database | Advisor | 4 RLS policies call `auth.uid()` per row; 9 foreign keys lack an index (including `board_items(board_id,user_id)`); 2 tables have duplicate permissive SELECT policies. | Wrap the calls as `(select auth.uid())`, add the indexes, and merge the policies, in one migration. | S |
| QA-50 | Auth | Advisor | Leaked-password protection is off in Supabase Auth. Sign-in is OAuth-only, so the impact is small. | Turn it on in the Supabase dashboard. | S |
| QA-51 | Caching | Code | Unpublished or deleted prompt pages and thumbnails stay on the CDN for 1–8 days. Project screenshots keep the same URL across recaptures for up to 8 days. | Shorter `s-maxage`, a version query string, or purge by tag. | S |
| QA-52 | MCP | Code | The connect page says a revoked key loses access "immediately"; in fact it can work for up to 60 seconds. Manually dispatched workflow inputs in `viewer-diagnose.yml` and `frame-probe.yml` are pasted straight into shell commands (write access needed, no secrets exposed). | Fix the wording; pass the inputs through `env:` and quote them. | S |
| QA-53 | Housekeeping | Code | Assorted smaller items, listed after this table. | See below. | S |

Details for QA-53:
- "＋ Board" appears on Forks and Recently viewed cards that cannot be added to a board.
- The account export omits connector keys and non-GitHub identities.
- Merge preview counts omit boards and keys.
- One malformed cookie breaks every account endpoint, including sign-out.
- Key creation and merge skip the Terms acceptance gate.
- A new board can silently miss its first item while a list load is in flight.
- My collection says "1 projects".
- There is dead code in `app.js`: `hydrate`, `loadEditorial`, `reportDemoUrl`, `classify`.
- Some docs are stale: `docs/BROWSING.md` and `docs/ACCOUNTS_AND_ADMIN.md` describe `/api/open` as authenticated, and `docs/QA_2026_10_04.md` mentions hero pause/play.
- Detail responses are `no-store` although they are public.
- GitHub Actions `v4` actions are running on deprecated Node 20.
- Only 5,000 of 31,723 projects get static pages in the sitemap; this is intentional (`PROJECT_LIMIT`), but worth reviewing for SEO.

## 4. Fix plan

Each phase is meant to fit in one or two working sessions and ships as its own commit, with its own test.

### Phase 1: stop the exposure and the visible breakage (all S)
1. **QA-01:** move the unpacked catalogue out of `dist/`, add a 404 rule, and add a live check.
2. **QA-02:** fix the Trendshift View all and guard `#sort`. Add a browser check that clicks every View all.
3. **QA-05:** add a pending search state and allow one-letter queries.
4. **QA-14 (framing part):** add `frame-ancestors 'none'`.
5. **QA-27 and QA-28:** clean the board name and re-enable the dropdown after Clear. These are follow-ups to this week's board feature.
6. **QA-22:** correct the connector and privacy text about boards.

### Phase 2: security and limits (S–M)
1. **QA-03:** restrict `/api/open` to catalogue-stored links, and apply the same rule in `authReturn`.
2. **QA-06:** reject or meter MCP batches.
3. **QA-21:** make link failures keep the session, and start linking from a POST.
4. **QA-26:** use `npm ci` and `persist-credentials: false`.
5. **QA-42, QA-44 and the QA-53 cookie item:** session robustness.
6. **QA-25:** decide where the SketchUp Shelf data should live.

### Phase 3: pipeline and CI reliability (S–M)
1. **QA-04:** gate the live checks on the Vercel deployment status.
2. **QA-07:** stop the catalogue pipeline after a failed validation.
3. **QA-09:** make the deploy filter use the whole push range.
4. **QA-08:** reschedule the X import, split its wait out of the group, and make the dispatchers aware of it. Investigate the collector failure.
5. **QA-46 and QA-47:** investigate the publication and catch-up failures, and keep the recovery artifacts.
6. **QA-40 and QA-41:** bring the Studio verification and the Studio migrations into CI.

### Phase 4: browsing and accessibility polish (S)
1. **Browsing:** QA-10, QA-11, QA-12 and QA-16.
2. **Accessibility:** QA-13, QA-15, QA-30, QA-31 and QA-32.
3. **Pages and caching:** QA-48, plus the detail-response caching from QA-53.

### Phase 5: prompt library correctness (S–M)
1. **Customiser:** QA-17 (DOM-based swaps), QA-18, QA-35 and QA-36.
2. **Fill-in storage:** QA-29.
3. **Admin edits and imports:** QA-19 and QA-38.
4. **Prompt viewer:** QA-33, QA-34 and QA-37.
5. **QA-20:** decide whether page code is public.
6. **QA-39:** separate origin for UI previews (can be scheduled independently).

### Phase 6: housekeeping
- The QA-49 advisor migration, QA-50, QA-51, QA-52, the rest of QA-53, and the stale docs.

## 5. Tests to add, so these stay fixed

- Browser: click every shelf's View all; type a one-letter search; like a project and assert focus stays; open a board and assert titles (case-sensitive) and not slugs.
- Live check: `/catalog.json` and `/spaces.json` return 404; responses carry `frame-ancestors`; `/api/open` refuses a host that is not in the catalogue.
- Unit: an MCP batch body is rejected or metered per element; the customiser leaves `<script>` and `<style>` untouched and does not rewrite "Inter Tight"; the board-name brief line is cleaned; the saved-resources cursor paginates.
- CI: Studio migrations with a storage stub; `verify-studio-ui.mjs` and `verify-sync-layout.mjs`; live checks triggered by the deployment status.

## 6. Checked and fine

- **Member data isolation:** likes, forks, history and legal records use member-token RLS. Boards and connector keys are server-only tables behind security-definer functions with fixed `search_path`, executable only by the service role and scoped to the verified owner. The 28 security-definer functions open to signed-in users all either check `reposhelf_is_admin()` or act only on `auth.uid()`, which was confirmed function by function.
- **Writes:** every POST, PUT and DELETE checks the exact Origin and rejects a missing one. Admin routes re-check admin rights in the database on every request. The last-admin and self-demotion protections hold.
- **Sessions:** `__Host-` cookies (HttpOnly, Secure, SameSite=Lax), PKCE sign-in, an HMAC-bound merge flow with typed confirmation, and account deletion with a recent sign-in plus a database guard.
- **Connector keys:** only SHA-256 hashes are stored, comparisons are timing-safe, keys are revocable, the invalid-key limit is 30 per minute per address, and every tool response is framed as data, not instructions.
- **Rendering:** catalogue, README, board and prompt text is escaped or set with `textContent` everywhere traced. The prompt preview iframe is `sandbox="allow-scripts"` only, giving it an opaque origin.
- **Caching:** private and API responses are `private, no-store`, the public storefront carries no per-user data, and the service worker never caches `/api`.
- **SEO:** canonical, robots, sitemap (5,191 URLs), JSON-LD escaping, and `noindex` on the API are correct.
- **Performance (live):**
  - Desktop DOMContentLoaded: home page 2.8 s (cold), other pages under 0.6 s.
  - Mobile: home page 1.5 s.
  - Storefront response is about 100 KB; the prompt list API is 273 KB.
- **Database:** every repository migration applies twice cleanly, and production reports every migration as applied.
