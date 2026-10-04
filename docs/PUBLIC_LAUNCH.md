# Public launch checklist

Start with an invited beta. This document describes operational steps, not a claim that public launch or legal approval has occurred.

## Setup still owned by the operator

- Create a monitored support/privacy email. Configure `REPOSHELF_CONTACT_EMAIL` in Vercel and redeploy when ready.
- Resolve the actual legal operator identity and obtain appropriate UK/global legal review before activating agreement acceptance. A service brand alone is not a legal entity. Review disclosures before any real paid promotion offer.
- Apply migration 11 once, after 10, to enable account export/deletion. No additional secret is needed. Migrations are transactional; do not rerun earlier migrations.
- Ensure repository Issues and GitHub Actions are enabled. Watch the repository and enable issue notifications. `Monitor operational health` runs hourly and after maintenance, retrying transient production errors three times. It opens one bot issue, updates it when the set of problems changes, and closes it on recovery. Workflow errors are also visible in Actions. GitHub schedules and notifications can be delayed; this is monitoring, not a guaranteed uptime SLA.

## Quality targets

Administration → Catalogue quality shows target attainment. Aim for 95% fresh repository-check coverage, 95% recent conclusive demo checks and 90% captured-demo screenshot coverage. All manually selected featured projects should qualify, with useful descriptions and screenshots reviewed by a person. Short author descriptions can be improved through labelled editorial corrections. Unavailable selections remain saved so they can return when repaired.

The initial public storefront should be a curated subset of reliable projects, rather than exposing unfinished featured placements. Growth can intentionally stop while the repair backlog is processed; a flat record count alone is not a failure. Health monitoring checks data freshness and repeated maintenance failures.

## Physical-device acceptance checks

Browser automation covers responsive layout and emulated install/standalone behavior. It cannot prove native Android/iOS system-browser behavior, so complete these on actual devices:

1. Android Chrome: visit RepoShelf as a guest, dismiss the install invitation and keep browsing. Reopen installation from the footer and install.
2. iPhone Safari: follow Share → Add to Home Screen, then open from the home screen.
3. In both installed apps, open a demo and repository/README link as a guest. Close the external browser surface and confirm the RepoShelf session remains accessible. Repeat with Back and with a second external link.
4. Sign in with GitHub from the installed app. Verify you return to the correct app/account, without a localhost redirect or login loop.
5. Like a listing, enable optional viewing history, and open another listing. On a second device, sign in and confirm likes/history match. Sign out and confirm private content clears.
6. Try sharing a direct listing link, search filters, a misspelled search and the resulting suggestions. Check keyboard navigation, visible focus and narrow-screen overflow.
7. Test account export and deletion using a disposable beta account. Confirm its RepoShelf data disappears and its GitHub repos/forks remain. Confirm deletion is blocked for the last administrator.
8. Opt out of analytics and confirm no new application analytics requests. Opt in on a non-admin account and verify listing/demo/like events in Analytics. Admin visits are intentionally excluded.

Record device, OS/browser versions, date and outcome. Do not enter real payment cards; promotions remain an admin-only Stripe test programme.

## Invited beta

Invite a small varied group (for example 10–20 people using different mobile/desktop devices). Ask them to find a useful project, try the demo, read the source and save it. Review friction, broken-demo reports and misleading descriptions before expanding.

Use the existing consent-aware analytics for demo clicks, sign-in starts/completions, demo-to-like conversion and returning browsers. Counts are browser estimates and observed sequences, not proof of successful demo usage. Review reports and the quality queue alongside those numbers. Set baselines during beta rather than inventing conversion targets without traffic evidence.

## Paid promotions

Public payments stay disabled. Test requests require verified ownership and admin approval and appear only in labelled Sponsored admin previews, separate from Editor’s picks. Before enabling real purchases, finalise seller disclosures, price/tax treatment, eligibility, moderation/rejection rules, cancellation/consumer withdrawal and refund terms, payment-webhook recovery and dispute handling. Do not launch live checkout by swapping a Stripe key alone.

## Account data behavior

Account → Account & data downloads a JSON export of the current user's saved information. The endpoint uses a verified session and a database function bound to `auth.uid()`; a user cannot select another user ID.

Deletion requires same-origin DELETE, an explicit confirmation and GitHub sign-in within 15 minutes. A database trigger enforces last-admin protection and promotion blockers even for direct Supabase deletion. Likes, history, fork tracking, submissions and agreement records cascade. Unpaid resolved promotion requests are removed; completed paid records and events retain history with the owner reference cleared. Reporter explanation text is cleared; private moderation decisions retain their outcome with account references removed. Public catalogue entries, external GitHub repositories/forks, anonymous aggregate analytics, and provider backups are separate datasets. Export/deletion do not require new legal acceptance.
