# Proposal: in-page demo viewer for RepoShelf

Status: draft for review (2026-10-06). Nothing in this document is implemented yet.
Reviewer: please challenge the assumptions, the security model and the rollout, and answer the open questions at the end.

## 1. Problem

RepoShelf lists public GitHub repositories and Hugging Face Spaces that have a live demo. Today "Try demo" opens the demo site in a new browser tab. That has two drawbacks:

1. **Repo address leakage.** We want visitors to try demos while the repository (owner and name) stays behind sign-in, because the point of the sign-in prompt is to convert visitors into members. Many demo addresses give the repo away on their own (see section 3).
2. **Leaving the product.** A new tab sends the visitor away from RepoShelf with no way back to what they were browsing, and we learn nothing about whether the demo worked for them.

Related decisions already taken: signed-out visitors see repository details as locked buttons (presentation-level only, repo identifiers still exist in the published catalogue files); the MCP connector is members-only; Google sign-in exists alongside GitHub.

## 2. What we measured

A manual GitHub Actions run of `scripts/frame-probe.mjs` (workflow "Demo framing probe", 2026-10-06) sampled 400 catalogue demos and 60 real-browser iframe checks.

| Result | Value |
|---|---|
| Reachable demos that can be framed by RepoShelf | **60.5%** of 324 (196 with no restrictions plus a few more) |
| Blocked by `X-Frame-Options: DENY` | 101 |
| Blocked by `X-Frame-Options: SAMEORIGIN` | 12 |
| Blocked by CSP `frame-ancestors` (self / other / none) | 7 / 6 / 2 |
| Unreachable (404, redirects, network, 403, other) | 76 of 400 |
| Header verdict agreed with a real iframe load | 58 of 59 (98%) |
| github.io | 100% embeddable (69 checked) |
| netlify.app / vercel.app | 94% / 85% |
| huggingface.co | 0% of 90, **but this is a probe artefact**: it tested the `huggingface.co/spaces/...` page, not the embeddable `*.hf.space` address |

Caveats: one sample, one point in time, and the probe fetches headers from a datacenter IP. "Embeddable" means the headers allow framing, not that the demo works usefully inside a frame.

## 3. Which demo addresses reveal the repository

Computed from the saved catalogue (11,211 demos) by comparing the demo URL with the repo owner and name. This is a heuristic on the address only; a demo's own page can still link to GitHub.

| Address pattern | Share |
|---|---|
| `owner.github.io` or a github.com address (names the owner) | 21% |
| Hosting subdomain containing the owner or project name (for example `myapp.vercel.app`) | 12% |
| Own domain containing the owner or project name (for example `immich.app`) | 20% |
| Hugging Face Space addresses (`owner/space`) | 23% |
| Not obviously revealing | 24% |

## 4. Goals and non-goals

Goals
- Let visitors try an embeddable demo without leaving RepoShelf and without the demo address being shown.
- Never present a broken or blank frame as if it worked.
- Keep a one-click path to the demo in a new tab for everything else.
- Keep security and privacy at least as strong as today's outbound link.

Non-goals
- Guaranteeing the repo cannot be discovered. Repo identifiers remain in published data; a demo page may link to its repo.
- Streaming a remote browser (cost and operations are out of scope for the first version).
- Testing demo features beyond "the page loads".

## 5. Options considered

| Option | Coverage | Reliability | Cost | Verdict |
|---|---|---|---|---|
| A. New tab only (today) | 100% | High | None | Leaks repo for roughly half of demos; no feedback loop |
| B. iframe viewer for every demo | about 60% real | Poor: blank frames for the rest | Low | Rejected: failure mode is invisible to the page |
| C. iframe viewer only for demos flagged embeddable, new-tab fallback for the rest | about 60-75% | Good: failures are pre-filtered | Low-medium | **Proposed** |
| D. Screenshot only | 100% | High | Low | Safe fallback inside C; does not let people try anything |
| E. Remote browser streamed to the visitor | about 95% | High | High per visit, new infrastructure | Out of scope for now |

## 6. Proposed design (option C)

### 6.1 Decide embeddability at sync time, not in the visitor's browser
A cross-origin iframe that is refused still fires `load`, and the parent cannot read the result, so runtime detection is unreliable. Instead:
- Add a `framing` record to each listing, written by the existing demo health check (it already fetches each demo): `{embeddable: boolean, reason, checkedAt}`, using `classifyFraming` from `scripts/frame-probe.mjs` (already unit tested).
- Re-evaluate whenever the demo is re-checked, so a site that adds `X-Frame-Options` drops out of the viewer automatically.
- Add `framing` to the compact browse record in `lib/browse-index.mjs` so cards and details know without an extra request. The size impact must be checked: the first storefront response is already about 685 KB against a 750 KB deployed-route guard, so store a small enum or a single boolean, not objects.

### 6.2 When the viewer is used
Use the viewer only when all hold: `framing.embeddable` is true; the demo URL is `https://` (an `http://` frame is blocked as mixed content in our https page); the listing's demo health status is `working`; and, for Hugging Face Spaces, the address is rewritten to the Space's embed host `https://<owner>-<space>.hf.space` (lowercased, `.` and `_` replaced by `-`). All other cases keep the current new-tab behaviour.

### 6.3 The viewer itself
- A full-screen dialog opened by "Try demo". The iframe is created only after the click (lazy), with a loading state and a visible "Not loading? Open in a new tab" button after a few seconds, plus a "Demo not working" report button.
- iframe attributes: `referrerpolicy="no-referrer"`, `loading="lazy"`, and a strict `sandbox`, for example `allow-scripts allow-same-origin allow-forms allow-modals` and deliberately **not** `allow-top-navigation`, `allow-popups` or `allow-popups-to-escape-sandbox`. Omitting popups stops "View on GitHub" links that open a new tab, which supports the repo-hiding goal, at the cost of demos that need a popup (OAuth sign-in).
- `allow` feature policy: start with nothing (no camera, microphone, geolocation, clipboard) and add per-demo only if reports show a need.
- Our own page: add a CSP `frame-src https:` (we currently send no CSP) and keep the existing `Referrer-Policy`.
- The viewer chrome must obey the signed-out lock rules: no repository name or link for signed-out visitors.

### 6.4 Feedback loop
- "Demo not working" posts an event (only with analytics consent; otherwise a local-only message) keyed by listing. Several reports within a window set a server-side `viewerDisabled` flag so the listing reverts to new-tab until the next successful health check.
- Count `viewer_open`, `viewer_new_tab_click` and `viewer_report` as aggregate events to learn the real success rate.

### 6.5 Privacy and legal
- The third-party demo receives the visitor's IP and user agent when the frame loads, the same as with a new tab. No cookies or identifiers from RepoShelf are shared (`no-referrer`, cross-origin).
- Update the Privacy Policy and Cookie Policy: demos shown in a frame can set their own cookies; RepoShelf does not control them.
- Decide whether opening the viewer requires the analytics banner choice. It should not; the viewer works either way.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Frame refused or demo blocks itself after the check | Sync-time flag, re-check on each demo health run, visible new-tab fallback, user reports |
| Demo needs third-party cookies / storage, broken in Safari or Firefox partitioned storage | Cannot be fixed from our side; fallback and report path; track report rate per host |
| Demo breaks out (`top.location`) | Sandbox without `allow-top-navigation` |
| Malicious demo content inside our page | The frame is cross-origin to RepoShelf, so the demo cannot read our storage or cookies (our auth cookies are HttpOnly and `__Host-` scoped); the sandbox adds limits on navigation and popups |
| Hugging Face Space asleep | "Waking up" state with a timeout and fallback |
| Mixed content or redirects to `http` | HTTPS-only rule; recheck redirects in the health check |
| Storefront payload growth | Single boolean or enum, measured against the 750 KB guard |
| Does not actually hide the repo | Documented as presentation-level; popups blocked; set expectations in the UI copy |

## 8. Test plan

- Unit: `classifyFraming` fixtures (exists); Space embed-address rewrite; HTTP rejection; viewer eligibility function.
- Browser verifier (route-mocked, like the other `scripts/verify-*-ui.mjs`): viewer opens for an embeddable listing, never for a blocked or `http` one; fallback button; report flow; signed-out lock rules; mobile layout; sandbox attribute exact match.
- Sync: demo health writes `framing`; `framing` changes when headers change; browse index size stays under 750 KB.
- Production smoke after rollout: a small allow-list of known-embeddable demos load in the viewer.

## 9. Rollout

1. Ship the `framing` flag and probe integration only (no UI). Verify values against the manual probe.
2. Ship the viewer behind an admin-only switch, then enable for github.io, Netlify and Vercel hosts, then all flagged demos.
3. Review report rates per host after one week; adjust the sandbox, the `allow` policy or the host allow-list.

Success measures: share of "Try demo" clicks that use the viewer; report rate under 5% of viewer opens; no increase in demo-link abandonment; sign-in prompt clicks per viewer open.

## 10. Open questions for the reviewer

1. Is a sync-time flag sufficient, or should the visitor's browser also run a lightweight runtime check (for example a timeout heuristic) despite its unreliability?
2. Is the proposed sandbox right? Specifically `allow-same-origin` is needed for most demos to use their own storage; is anything about the combination with `allow-scripts` unsafe when the frame is cross-origin to RepoShelf?
3. Is blocking popups worth the lost OAuth demos, or should popups be allowed and the repo-hiding goal treated as best effort?
4. For Hugging Face Spaces, is the `<owner>-<space>.hf.space` rewrite reliable enough, or should we read the Space's real host from its API during sync?
5. What belongs in a CSP for the whole site now, given we currently send none? Is `frame-src https:` too permissive?
6. Should the viewer be available to signed-out visitors, given the goal is to encourage sign-in? Alternatives: a time-limited trial, or sign-in after the first few opens.
7. Are there demo categories we should exclude by policy (login-required, payment, anything asking for credentials) regardless of framing headers?
8. Does adding `framing` to the compact browse record risk the 750 KB storefront guard, and is there a better place for it?
9. What did we miss about reliability, accessibility (keyboard focus trap, escape to close, screen readers) or mobile behaviour of full-screen iframes?
10. Is there a simpler design that achieves the repo-hiding goal for the 24% of demos where it matters, without a viewer at all?

## 11. Reference

- Probe code and workflow: `scripts/frame-probe.mjs`, `.github/workflows/frame-probe.yml`, `tests/frame-probe.mjs`.
- Demo health: `scripts/demo-health.mjs`, `scripts/check-demo-health.mjs`, `scripts/demo-probe.mjs`.
- Browse record shape: `lib/browse-index.mjs` (`compactProject`).
- Sign-in lock rules: `docs/ACCOUNTS_AND_ADMIN.md` ("Revealing repository details").
