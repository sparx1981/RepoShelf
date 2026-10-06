# Proposal: in-page demo viewer for RepoShelf (revision 2)

Status: revised after review (2026-10-06). Nothing in this document is implemented except the classifier fix listed in section 3.
Revision 1 proposed an iframe viewer for every demo whose headers allowed framing (60-75% coverage). Review showed that was premature. This revision proposes a small, individually verified pilot, with the wider rollout earned by evidence.

## 1. Problem

RepoShelf lists public GitHub repositories and Hugging Face Spaces that have a live demo. "Try demo" opens the demo in a new tab. Two drawbacks:

1. **Repo address leakage.** We wanted visitors to try demos while the repository stays behind sign-in. Many demo addresses give the repo away on their own (section 4). Review pointed out this benefit is modest: repository identifiers are public in the published data and demos can reveal their source themselves. So it is a secondary reason, not the main one.
2. **Leaving the product.** A new tab sends the visitor away with no way back to what they were browsing, and we learn nothing about whether the demo worked.

The risk that matters: **a demo failing inside RepoShelf will feel like RepoShelf failing**, even when an external site is to blame. That risk drives every decision below.

## 2. What we measured, and what it does not show

`scripts/frame-probe.mjs` (manual workflow run, 2026-10-06): 400 demos sampled, 60 real-browser iframe checks.

| Result | Value |
|---|---|
| Reachable demos whose headers allow framing | 60.5% of 324 |
| Header verdict agreed with a real iframe load | 58 of 59 |
| github.io / netlify.app / vercel.app | 100% / 94% / 85% header-embeddable |
| huggingface.co | 0% of 90, a probe artefact: it tested the `huggingface.co/spaces/...` page, not the Space's own app address |

Corrections to how revision 1 used these numbers:
- The "98%" is **header verdict versus iframe load**, not "the demo works". The browser check looks for a frame and certain refusal errors. It does not verify usable content or interaction, it silently drops timed-out checks, and it ran with popups allowed, unlike the proposed viewer.
- "Embeddable" therefore does not show that OAuth sign-in, storage, downloads or device permissions work in a frame. Coverage of 60-75% is a **header ceiling, not a success rate**, and is unvalidated in the actual viewer.
- The sample is one point in time from a datacenter address.

## 3. Defects found in existing code during review

1. **Framing classifier false positives** (confirmed and fixed in this branch, with tests):
   - `frame-ancestors https://reposhelf.vercel.app` was accepted for the canonical site `https://www.reposhelf.co.uk`, because any of our three origins counted. Likewise `https://reposhelf.co.uk` (bare domain). The classifier now judges against the canonical viewer origin only.
   - A bare `http:` source was accepted for an https page. It is now not accepted as evidence (CSP3 lets `http:` match https, but we want explicit evidence before gating a user-facing feature).
2. **Demo health `working` is too permissive for viewer eligibility.** The health code deliberately preserves an earlier success after temporary failures; the reviewer reproduced a listing staying `working` after a newer application error. That is right for catalogue retention but wrong here. Viewer eligibility needs its own, stricter evidence (section 6.1).

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
- Let visitors try a **verified** demo without leaving RepoShelf.
- Never present a broken or blank frame as if it worked, and always keep an obvious way out.
- Keep security and privacy at least as strong as today's outbound link.
- Learn the real failure rate before expanding.

Non-goals
- Guaranteeing the repository cannot be discovered. Popups and outbound links inside a demo are **not** blocked just to suppress GitHub links; breaking legitimate demo behaviour is not worth a modest hiding benefit.
- Streaming a remote browser (cost and operations).
- Wide coverage in the first release. A smaller set that works consistently beats a large set that sometimes does not.

## 6. Proposed design

### 6.1 Eligibility: positive, recent, specific evidence
A listing may use the viewer only if **all** hold:
- It is on the **approved pilot list** (section 7), reviewed individually. No whole host groups (github.io, Netlify, Vercel) by default.
- It has a **recent successful framed check** (suggest within 7 days) tied to the **exact current demo URL and the exact viewer configuration** (sandbox and `allow` string version). A changed URL or configuration invalidates the evidence.
- The check was run by a headless browser inside an iframe with the production sandbox on the canonical origin, and passed a **meaningful content assertion** (page produced non-trivial visible content, no frame-refusal error, no top-navigation attempt), not only "frame loaded".
- The address is `https://`.
- No active per-demo or global disable (6.4).

Unknown, stale, or inconclusive (timed out, challenge page, error page) results keep the demo **opening in a new tab**, as today. Header classification (`classifyFraming`) is a cheap pre-filter for which demos to qualify, not the gate.

Evidence is stored privately and the public browse record gets at most one small boolean (the storefront's first response is about 685 KB against a 750 KB deployed-route guard).

### 6.2 Hugging Face Spaces
Do not guess hostnames. RepoShelf already stores the API-provided `appUrl` for Spaces. Use that address, verify it with the same framed check, and apply the same rule to a **GitHub listing whose demo is supplied by a Space**. A sleeping Space gets a "waking up" state and falls back to the new tab.

### 6.3 The viewer
- Opened by "Try demo". The frame is created only after the click.
- **Persistent** controls always visible: Close, **Open in new tab**, and a short label "Third-party demo". The new-tab control is visible immediately, not after a timeout. A slow-load hint may appear later, but a timeout cannot prove failure, and `load` cannot prove success, for a cross-origin frame, so the UI makes no success or failure claims.
- iframe: `referrerpolicy="no-referrer"`, lazy, and a sandbox that **allows what legitimate demos need**: scripts, forms, modals, `allow-same-origin` (the frame is cross-origin to RepoShelf so this only lets the demo use its own storage), and popups, including `allow-popups-to-escape-sandbox` so OAuth and "open in new window" work. Not `allow-top-navigation`. Whether to allow `allow-top-navigation-by-user-activation` is an open question. The exact string is versioned (6.1).
- `allow` feature policy starts empty; add per demo only with evidence.
- Site-wide CSP is currently absent; adding `frame-src https:` and the rest is part of the work (open question 5).
- The viewer chrome obeys the signed-out lock rules (no repository name or link for signed-out visitors).
- Keyboard focus trap, Escape to close, screen reader labels, and a mobile-safe full-screen layout.

### 6.4 Disabling, reports and feedback
- **Immediate global switch** (admin, no deploy needed) and **per-demo disable** controls. Either reverts to the new tab at once.
- **Report "Demo not working"** works **independently of analytics consent**. It is an explicit user action, so it is stored as a report (rate limited, no extra identifiers).
- A disabled demo is restored **only after a new successful framed check** (6.1), never after an ordinary page-load health check, which could re-enable the same broken experience.
- Aggregate events (`viewer_open`, `viewer_new_tab_click`, `viewer_close`) only with analytics consent. Treat a low report rate as **weak evidence**: frustrated visitors mostly just leave. Watch quiet signals too: quick closes, immediate new-tab clicks and repeat opens.

### 6.5 Privacy and legal
- The demo receives the visitor's IP and user agent when it loads, as with a new tab. No RepoShelf identifiers are shared (`no-referrer`, cross-origin).
- Update the Privacy Policy and Cookie Policy: demos in a frame may set their own cookies and RepoShelf does not control them.

## 7. Pilot and rollout

1. **Fix and harden the classifier** (done) and build the qualification tool: loads a demo inside the exact production sandbox on the canonical origin, performs a defined interaction check, records evidence and timestamp.
2. **Pick roughly 20-50 demos individually**, mixed across hosts, Spaces, and some deliberately difficult ones (OAuth, storage, downloads, device permissions). Qualify each on **desktop and mobile, in Chrome, Safari and Firefox**.
3. **Ship the viewer for the approved list only**, behind the global switch, admin-only first.
4. **Measure** fallback use, quick closes, reports, and sign-in prompt clicks. Expand only in small batches, with observed reliability, host group by host group. Wider coverage is a later decision, not a goal.

Success measures: the approved set works consistently across the browser matrix; new-tab fallback and quick-close rates stay low; no complaints attributed to RepoShelf; no increase in demo abandonment.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Demo fails inside the frame and looks like a RepoShelf failure | Approved pilot list; strict evidence; visible new-tab control; global and per-demo disable |
| Eligibility based on stale or inconclusive evidence | Recent, URL-bound, configuration-bound framed check; unknowns open externally |
| Demo needs third-party cookies/storage (Safari, Firefox partitioning) | Browser-matrix qualification; excluded from the list if it fails |
| OAuth or downloads blocked by the sandbox | Popups allowed; test explicitly; exclude or leave external if failing |
| Frame breaks out via top navigation | Sandbox without `allow-top-navigation`; qualification checks for it |
| Malicious demo content inside our page | Cross-origin frame (no access to our storage or HttpOnly `__Host-` cookies); sandbox limits; pilot list reviewed by hand |
| Storefront payload growth | One small boolean on the public record; evidence stored privately |
| Silent failure after re-enabling | Restore only after a successful framed check |

## 9. Test plan

- Unit: classifier fixtures (extended in this branch); eligibility function (freshness, URL binding, configuration binding, `https` only); Space `appUrl` handling.
- Qualification tool: runs against local fixture pages that refuse framing, attempt top navigation, need a popup, or return error pages, and passes or fails them correctly.
- Browser verifier (route-mocked, like the other `scripts/verify-*-ui.mjs`): viewer opens for an approved listing; never for unapproved, stale or `http`; persistent controls; fallback; report works with analytics declined; signed-out lock rules; mobile layout; exact sandbox string; global switch.
- Manual: the browser matrix in section 7 on real devices before expansion.

## 10. Open questions

1. What is the right meaningful-interaction check per demo type (static page, app, Streamlit, Hugging Face Space), and who defines it for each approved demo?
2. Should the sandbox allow `allow-top-navigation-by-user-activation`? Frame-busting scripts rarely have user activation, but a click inside the demo could then navigate the whole tab away.
3. Is `allow-popups-to-escape-sandbox` acceptable security-wise for a hand-reviewed pilot, and does it need to change for a wider rollout?
4. How fresh must framed-check evidence be (7 days suggested), and what runs the re-check without adding load to the sync? (A separate low-frequency job over the approved list is the likely answer.)
5. What belongs in a site-wide CSP now, given none is sent today? Is `frame-src https:` too permissive for a launch with a curated list (a host allow-list may fit the pilot better)?
6. Should signed-out visitors get the viewer, given the sign-in conversion goal? Alternatives: a limited number of opens, or sign-in after the first.
7. Which demo categories are excluded by policy regardless of evidence (login-required, payments, anything asking for credentials)?
8. Where do per-demo disable and the global switch live (existing editorial or listing controls tables, or a new setting), and how fast does a change reach visitors given the short cache on listing controls?
9. Is there a simpler way to achieve the retention and feedback value without a viewer, for example an interstitial "You are leaving RepoShelf" with a return link and a working/not working prompt on return?

## 11. Reference

- Probe and workflow: `scripts/frame-probe.mjs`, `.github/workflows/frame-probe.yml`, `tests/frame-probe.mjs`.
- Demo health: `scripts/demo-health.mjs`, `scripts/check-demo-health.mjs`, `scripts/demo-probe.mjs`; Space `appUrl` is stored on Space listings.
- Browse record shape: `lib/browse-index.mjs` (`compactProject`).
- Sign-in lock rules: `docs/ACCOUNTS_AND_ADMIN.md` ("Revealing repository details").

## Appendix: review disposition

| Review point | Response |
|---|---|
| 98% does not show demos work | Accepted. Reworded; coverage is a header ceiling, not a success rate. Pilot with real framed checks instead |
| Browser probe drops timeouts, allows popups | Accepted. New qualification tool uses the production sandbox; inconclusive means external |
| `working` too permissive | Accepted. Separate, recent, URL- and configuration-bound evidence |
| Classifier false positives | Confirmed and fixed with tests (canonical origin only; bare `http:` not accepted) |
| Fallback visible immediately; timeout proves nothing | Accepted. Persistent controls, no success or failure claims from timers |
| Reports independent of analytics consent | Accepted |
| Restore only after a successful framed check | Accepted |
| Hugging Face hostname guessing | Accepted. Use stored `appUrl` and verify it |
| Start with 20-50 approved demos, not host groups | Accepted as the pilot |
| Do not break demos to hide GitHub links | Accepted. Popups allowed; repo hiding is best effort |
| Report rate under 5% is weak evidence | Accepted. Watch quick closes and fallback use as well |
