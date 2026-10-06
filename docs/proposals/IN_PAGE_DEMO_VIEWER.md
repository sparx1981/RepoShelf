# Proposal: in-page demo viewer for RepoShelf (revision 3)

Status: agreed as a pilot plan after two review rounds (2026-10-06). Implemented so far: the classifier fix (section 3) and build steps 1-4 of section 7 (the administrator harness: `docs/DEMO_VIEWER.md`), revised after a third review round (per-profile evidence, scenario revisions, production-realistic harness, honest popup and download handling, separate preview and live-test modes). Visitors do not see the viewer.
- Revision 1: iframe viewer for every demo whose headers allow framing (60-75% coverage). Rejected as premature.
- Revision 2: small, individually verified pilot.
- Revision 3 (this): reviewer answers to the open questions are recorded as decisions (section 10), and the build scope for the first step is fixed (section 7).

## 1. Problem

RepoShelf lists public GitHub repositories and Hugging Face Spaces that have a live demo. "Try demo" opens the demo in a new tab. That keeps the original RepoShelf tab available, so leaving the product is not the main problem. The real opportunities:

1. A demo can be tried without leaving the page, with a smoother browsing experience, and we can learn whether demos work.
2. A secondary benefit: the demo address is not shown. This is modest, because repository identifiers are public in published data and demos can reveal their source themselves.

The risk that matters: **a demo failing inside RepoShelf will feel like RepoShelf failing**, even when an external site is to blame. Every decision below follows from that. External opening stays the baseline, and the viewer must earn expansion through a demonstrably better browsing experience.

## 2. What we measured, and what it does not show

`scripts/frame-probe.mjs` (manual workflow run, 2026-10-06): 400 demos sampled, 60 real-browser iframe checks.

| Result | Value |
|---|---|
| Reachable demos whose headers allow framing | 60.5% of 324 |
| Header verdict agreed with a real iframe load | 58 of 59 |
| github.io / netlify.app / vercel.app | 100% / 94% / 85% header-embeddable |
| huggingface.co | 0% of 90, a probe artefact: it tested the `huggingface.co/spaces/...` page, not the Space's own app address |

- The "98%" is **header verdict versus iframe load**, not "the demo works". The browser check looks for a frame and certain refusal errors. It does not verify usable content or interaction, silently drops timed-out checks, and ran with popups allowed.
- 60-75% is a **header ceiling, not a success rate**, and is unvalidated in the actual viewer.

## 3. Defects found in existing code during review

1. **Framing classifier** (fixed in this branch, with tests):
   - A policy allowing only `https://reposhelf.vercel.app` or the bare `https://reposhelf.co.uk` was accepted for the canonical site `https://www.reposhelf.co.uk`. The classifier now judges against the canonical viewer origin only.
   - A bare `http:` source is not accepted as evidence for an https page. CSP3 does let `http:` match https, so this is **a deliberately conservative eligibility policy, not a spec correction**.
2. **Demo health `working` is too permissive for viewer eligibility.** The health code deliberately preserves an earlier success after temporary failures (a listing can stay `working` after a newer application error). That suits catalogue retention but not the viewer. Eligibility needs its own stricter evidence (section 6.1).

## 4. Which demo addresses reveal the repository (context only)

Computed on 11,211 saved demos by comparing the address with the repo owner and name (address only; the demo's own page may link to GitHub):

| Address pattern | Share |
|---|---|
| `owner.github.io` or a github.com address | 21% |
| Hosting subdomain containing owner or project name | 12% |
| Own domain containing owner or project name | 20% |
| Hugging Face Space addresses | 23% |
| Not obviously revealing | 24% |

## 5. Goals and non-goals

Goals
- Let visitors try a **verified** demo without leaving RepoShelf, signed in or not.
- Never present a broken or blank frame as if it worked; always keep an obvious way out.
- Uncertainty always sends the visitor to the external demo.
- Keep security and privacy at least as strong as today's outbound link.
- Learn the real failure rate before expanding.

Non-goals
- Guaranteeing the repository cannot be discovered.
- Blocking legitimate demo behaviour (popups, downloads where approved) to suppress GitHub links.
- Streaming a remote browser.
- Wide coverage in the first release. A smaller set that works consistently beats a large set that sometimes does not.
- A mandatory "you are leaving RepoShelf" page. The existing new-tab flow already keeps RepoShelf open; an easy report action on return is the lighter alternative.

## 6. Design

### 6.1 Eligibility: positive, recent, specific evidence
A listing may use the viewer only if **all** hold:
- It has a **manual approval** by a RepoShelf admin (pilot list, section 7). No whole host groups.
- Its latest **qualification check** succeeded **and** is at most **48 hours old**, tied to the **exact resolved demo URL** and the **exact viewer configuration version** (sandbox string, popup/download flags, permitted frame origins). A changed URL or configuration invalidates the evidence.
- The latest check, not an older one, decides: **any failed or inconclusive latest check suspends eligibility**, even if an older success is still inside 48 hours.
- No active global disable and no active per-demo disable (6.4).
- The address is `https://`.
- It does not need camera, microphone, geolocation or other device permissions (the parent page denies these, see 6.3).

Unknown, stale, inconclusive (timeout, challenge page, error page) or disabled demos **open externally**, as today. `classifyFraming` is a cheap pre-filter for choosing candidates, not the gate.

### 6.2 Qualification (what "meaningful interaction" means)
- **One short, explicit scenario per approved demo**, written and reviewed by a RepoShelf admin: an app accepts input and shows a visible result; a Hugging Face Space completes a small inference; a static demo performs its advertised interaction. A content-length check alone is not enough.
- The automated check runs the scenario in a headless browser **inside an iframe with the exact production sandbox on the canonical origin**, in Chromium, and records: scenario, result, browser, timestamp, resolved URL (after redirects), viewer configuration version, any popup destinations, any download events, any top-navigation attempt, and a screenshot.
- Playwright WebKit and mobile emulation supplement the check. They **do not replace** manual checks on real Safari and real devices, which are repeated after significant demo or viewer changes.
- Hugging Face Spaces use the API-provided `appUrl` already stored on the listing (including when a Space supplies a GitHub listing's demo). No hostname guessing.
- Before approving, run **deliberately difficult cases** (OAuth, downloads, device permissions, top-navigation attempts, error pages, refusal to frame) through the tool to confirm it rejects them correctly.
- The daily bounded job re-runs qualification for approved demos (6.4). Evidence storage is separate from manual approval and disable state.

### 6.3 The viewer
- Opened by "Try demo" for eligible demos. The frame is created only after the click, and only after an **uncached eligibility check** (6.4) passes; if that check fails or errors, the demo opens externally.
- **Persistent controls**, visible immediately: Close, **Open in new tab**, report, and a short label "Third-party demo". A slow-load hint may appear later but the UI makes **no success or failure claims** from timers or `load` events (neither is reliable for cross-origin frames).
- iframe: `referrerpolicy="no-referrer"`, lazy.
- Sandbox: scripts, forms, modals, `allow-same-origin` (the frame is cross-origin to RepoShelf, so this only lets the demo use its own storage). **Neither `allow-top-navigation` nor `allow-top-navigation-by-user-activation`**: a click inside a demo must not replace RepoShelf, and demos needing that open externally. Navigation inside the iframe stays available.
- **Popups** (`allow-popups`, `allow-popups-to-escape-sandbox`) and **downloads** (`allow-downloads`) are **per-demo flags**, off by default, granted only to individually reviewed demos that need them. Qualification must inspect popup destinations and exercise the actual login or download flow. These attributes do not guarantee OAuth works (cookie restrictions and provider rules can still break it).
- **Permissions:** an empty iframe `allow` attribute does not deny every capability, but RepoShelf's parent `Permissions-Policy` already denies camera, microphone and geolocation, and per-iframe attributes cannot override that. Demos that depend on those stay external initially.
- **CSP for the pilot:** `frame-src` lists the **exact approved frame origins**, including any redirect destinations the demo needs, not `https:`. A comprehensive site-wide CSP is a **separate, separately tested change**: inventory scripts, styles, authentication and connections, then introduce restrictions in **report-only** mode first.
- Signed-out visitors may use the viewer. Trying demos is the useful introduction. Sign-in stays attached to saving, collections and repository actions. No arbitrary open limits. Conversion is assessed separately from viewer success. The viewer chrome obeys the signed-out lock rules (no repository name or link).
- Keyboard focus trap, Escape to close, screen-reader labels, mobile-safe full-screen layout.

### 6.4 Controls, propagation, reports
- **Storage:** a dedicated **global setting** and **per-demo viewer controls** in Supabase, under existing admin authorization. Qualification evidence is stored separately from manual approval and disable state.
- **An automatic successful check never clears an admin's manual disable.** A viewer-disabled demo (from reports or an automatic failure) is restored **only after a new successful qualification**; a manual disable is cleared only by an admin.
- **Propagation:** the existing listing-controls code caches for 30 seconds and can keep stale controls after backend errors, so it cannot back an "immediate" emergency switch. Instead:
  1. Before creating the iframe, call a **dedicated uncached endpoint** for eligibility (global switch, per-demo state, evidence age). If it fails or errors, open externally.
  2. While a viewer is open, **poll** that endpoint and remove the viewer if the demo or the feature is disabled. Document the propagation limit (polling interval plus request time).
- **Report "Demo not working"** works **independently of analytics consent**. It is an explicit user action, stored as a report (rate limited, no extra identifiers). Reports can suspend a demo (6.4 above). Aggregate events (`viewer_open`, `viewer_new_tab_click`, `viewer_close`) are recorded only with analytics consent.
- A low report rate is **weak evidence**; many frustrated visitors leave. Also track quick closes, immediate new-tab clicks and repeat opens.
- On the existing new-tab flow, add an easy report action on return rather than an interstitial.

### 6.5 Excluded categories (initial)
Payments; wallet connections; sensitive personal-data collection; requests for passwords or API keys; anything needing device permissions; complicated login. Benign provider OAuth may be considered individually after its complete flow passes qualification. Start with straightforward demos.

### 6.6 Privacy and legal
- The demo receives the visitor's IP and user agent when it loads, as with a new tab. No RepoShelf identifiers are shared (`no-referrer`, cross-origin).
- Update the Privacy and Cookie Policies: demos in a frame may set their own cookies; RepoShelf does not control them.

## 7. Build plan

**First step (built; see `docs/DEMO_VIEWER.md`):** the **qualification tool** plus a **minimal admin-only harness** that **shares the eventual viewer's configuration and controls**. Qualification establishes eligibility; it cannot guarantee every visitor's session will work, so the persistent external-open control remains essential.

1. Viewer configuration module (one versioned definition: sandbox string, per-demo flag handling, permitted frame origins).
2. Supabase migration: global setting, per-demo viewer controls (approval, disable, flags), qualification evidence table. All service-role writes, admin-only reads, tested with SQL tests like the existing ones.
3. Qualification tool (`scripts/` + bounded daily workflow): scenario file format, Playwright Chromium (plus WebKit and mobile emulation), evidence recorder, rejection tests with local fixture pages (frame refusal, top navigation, popup, download, error page, challenge page, slow page).
4. Uncached eligibility endpoint (admin-only at first) and an admin harness page to open a candidate in the exact viewer configuration, run the scenario, and see evidence.
5. Pilot: **about 20-50 individually approved demos**, each also checked manually on **desktop and mobile in Chrome, Safari and Firefox**. Then expose the viewer to visitors for the approved list only, behind the global switch.
6. Expand in small batches on observed reliability and fallback use, host group by host group. Wider coverage is a later decision.

Success measures: the approved set works consistently across the browser matrix; fallback and quick-close rates stay low; no complaints attributed to RepoShelf; no increase in demo abandonment; viewer judged a better browsing experience than the new tab.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Demo fails inside the frame and looks like a RepoShelf failure | Approved pilot list; strict evidence; persistent external-open control; global and per-demo disable; uncached check before opening |
| Eligibility based on stale or inconclusive evidence | 48-hour evidence, latest result decides, unknown opens externally |
| Emergency switch cannot act quickly | Uncached endpoint before opening plus polling while open; documented propagation limit |
| Demo needs third-party cookies/storage (Safari, Firefox partitioning) | Browser-matrix qualification; excluded if it fails |
| OAuth or downloads blocked | Per-demo flags; test the full flow; otherwise external |
| Top navigation replaces RepoShelf | Neither top-navigation sandbox flag; demos needing it open externally |
| Popups escape the sandbox | Per-demo only; inspect popup destinations during qualification; hand review |
| Malicious demo content inside our page | Cross-origin frame (no access to our storage or HttpOnly `__Host-` cookies); exact `frame-src` origins; hand-reviewed pilot list |
| Storefront payload growth | At most one small boolean on the public record; evidence stored privately |
| Automatic re-enable overrides an admin | Manual disable only cleared by an admin |

## 9. Test plan

- Unit: classifier fixtures (extended in this branch); eligibility function (48-hour age, latest-result-decides, URL binding, configuration binding, `https` only, per-demo flags, manual disable precedence); Space `appUrl` handling.
- Qualification tool against fixture pages that refuse framing, attempt top navigation, need a popup, trigger a download, show an error or challenge page, or load slowly.
- SQL tests for the migration (admin-only access, evidence separate from approval, privileges).
- Browser verifier (route-mocked like the other `scripts/verify-*-ui.mjs`): viewer opens only for eligible demos; persistent controls; uncached check failure opens externally; poll removes the viewer when disabled; report works with analytics declined; signed-out visitors can use it; lock rules; mobile layout; exact sandbox string.
- Manual: the browser matrix before each expansion.

## 10. Decisions on earlier open questions

| Question | Decision |
|---|---|
| Meaningful interaction check | One short explicit scenario per approved demo, admin-reviewed; record scenario, result, browser, timestamp, resolved URL, configuration. WebKit/mobile emulation supplements real Safari/device checks |
| Top navigation | Both top-navigation sandbox flags absent; demos needing it open externally |
| Popups and downloads | Per-demo, off by default; inspect popup destinations; test real login and download flows |
| Freshness and rechecking | Daily bounded job; maximum evidence age 48 hours (initial operating choices, not proven thresholds); latest failed or inconclusive check suspends eligibility |
| CSP | Exact approved frame origins for the pilot; comprehensive CSP separately, report-only first |
| Permissions | Parent Permissions-Policy denies camera/microphone/geolocation and cannot be overridden per iframe; such demos stay external |
| Signed-out visitors | Allowed; no open limits; sign-in stays on saving, collections and repository actions |
| Excluded categories | Payments, wallets, sensitive data, credentials, device permissions, complicated login; benign OAuth individually |
| Switch storage and propagation | Supabase global and per-demo controls with existing admin auth; evidence separate; uncached check before opening plus polling; manual disable never auto-cleared |
| Simpler alternative | No obligatory interstitial; keep external opening as the baseline; easy report on return |

## 11. Decisions on the remaining questions (third review)

| Question | Decision |
|---|---|
| Polling | 45 seconds with a short request timeout (4 s) and an immediate recheck when the tab regains focus; compare the URL as well as the configuration. "About a minute" is a foreground target: background-tab throttling prevents a strict guarantee |
| Scenario storage | Database rows, with revision history, editor identity and evidence invalidation on every edit. Credentials never appear in scenarios |
| Workflow | Separate and bounded; publish a summary; alert on failed jobs and on missed runs before evidence expires (failed-run notification plus an administrator-page warning at 36 hours); run the complete suite on GitHub before merging |
| GPU/WebGL | Not excluded automatically: test a representative operation and visible output; if the runner cannot meaningfully verify it, keep the demo external for the pilot; a hardware-specific manual pass alone does not enable it universally |

Further changes from this round (see `docs/DEMO_VIEWER.md`): evidence is judged per browser profile and one profile's pass never clears another's failure; editing a scenario invalidates earlier evidence and runs for a changed scenario are rejected; provider-login popup flows are out of the pilot (qualification cannot complete them) and downloads must save completely; the harness uses the real viewer component and production headers and checks that every request is public; RepoShelf can never be a demo; the validator requires a result assertion after the last interaction; the admin page has a labelled unqualified preview and a separate "test as visitor" mode.

## 12. Reference

- Probe and workflow: `scripts/frame-probe.mjs`, `.github/workflows/frame-probe.yml`, `tests/frame-probe.mjs`.
- Demo health: `scripts/demo-health.mjs`, `scripts/check-demo-health.mjs`, `scripts/demo-probe.mjs`; Space `appUrl` is stored on Space listings.
- Listing controls cache: `lib/listing-policy.mjs`.
- Browse record shape: `lib/browse-index.mjs` (`compactProject`).
- Sign-in lock rules: `docs/ACCOUNTS_AND_ADMIN.md` ("Revealing repository details").

## Appendix: review disposition

| Review point | Response |
|---|---|
| 98% does not show demos work | Accepted; header ceiling, not success rate |
| Browser probe drops timeouts, allows popups | Accepted; qualification uses the production sandbox; inconclusive means external |
| `working` too permissive | Accepted; separate, recent, URL- and configuration-bound evidence |
| Classifier false positives | Canonical-origin fix confirmed and fixed; bare `http:` rejection is a conservative policy, not a spec correction (reviewer agreed CSP3 lets `http:` match https) |
| Fallback visible immediately; timers prove nothing | Accepted |
| Reports independent of analytics consent | Accepted |
| Restore only after a successful framed check; never clear an admin disable | Accepted |
| Hugging Face hostname guessing | Accepted; use stored `appUrl` |
| Pilot of 20-50 approved demos | Accepted |
| Do not break demos to hide GitHub links | Accepted |
| Empty `allow` is not a deny; parent Permissions-Policy already denies camera, microphone, geolocation | Accepted; permission-dependent demos stay external |
| Existing 30-second control cache cannot back an immediate switch | Accepted; uncached eligibility endpoint plus polling |
| Existing new-tab flow already preserves a return path | Accepted; no mandatory interstitial |
