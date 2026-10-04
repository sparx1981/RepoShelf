# Launch quality, reports and conversion analytics

Apply `supabase/migrations/202610040010_launch_quality_moderation_analytics.sql` once, after migration 9. Use the existing Supabase SQL editor; no new API key or GitHub secret is required. Existing browsing and analytics remain available before activation; new private tabs explain the missing migration. Admin Help links to this migration.

## Catalogue quality

Administration → Catalogue quality lists overdue repository/demo checks, missing captured demo screenshots, broken demos, retries and missing metadata. Featured selections sort first, followed by frequently viewed projects and completeness. Historic growth snapshots show preview coverage over time; historical preview counts can include author images, while the current missing-screenshot queue specifically requires captured demo images.

Hero and Editor’s picks require an available repository, a successful demo check within seven days, no temporary error on that check, and a usable current preview. Saved row selections are preserved, so failed entries can reappear when repaired. Automatic and other category rows retain their existing demo filtering.

Review listing can add an editorial description/category while preserving author text, reject the current preview, queue fresh checks/capture, temporarily hide or permanently exclude a listing. Empty overrides restore author metadata. A newer capture can replace a rejected preview. Changes use revision checks and have a private administrator audit trail. Restoring an excluded listing permits rediscovery; it does not promise immediate reimport.

Public listing controls update browsing/detail and API/MCP responses, with a short 30-second cache. Storage errors retain cached or saved moderation controls; a configured store without any usable controls returns a temporary failure rather than silently dropping decisions. Public controls contain only listing IDs and presentation/visibility/refresh settings, never reporters, administrator identities or audit notes. API browsing cursors change when moderation changes.

Workflows fetch these public controls before maintenance/submission imports. Exclusions suppress imports and default fallback picks, and are removed during publication. Quality refresh requests clear eligible schedules for the next maintenance run. The selected hero/picks IDs receive priority in the screenshot queue. This does not synchronously execute an untrusted demo in a web request. Temporary endpoint failures preserve the saved controls for retry.

## Reports

Signed-in GitHub users can select Report listing in details. Reasons: broken demo, misleading information, inappropriate content, ownership, copyright or another issue. Reports are private, limited to ten new reports per user per rolling day, and duplicate open reports for the same issue return the original receipt. Reporting does not automatically hide content.

Administration → Reports supports open/reviewed/dismissed views, listing review, review notes and pagination. Only administrators can read reports or audit history and change controls. Anonymous and member table access is denied by RLS; functions verify role/identity and revisions. Private report bodies are never published to GitHub or sent to analytics.

The support/privacy mailbox remains unset. When ready, configure `REPOSHELF_CONTACT_EMAIL` in Vercel and redeploy. Existing legal configuration also needs the appropriate operator identity before legal acceptance is activated; the RepoShelf brand does not settle that identity. Reports still work while contact setup is incomplete. Legal/privacy pages remain accessible without sign-in. No fictitious email or company has been added.

## Conversion analytics

The existing optional analytics choice remains independent of account sign-in and legal agreement. Client and server honour consent, DNT/GPC, bot filtering and administrator exclusion. No search text, IP address or GitHub/account ID is included in analytics events. Private reporting is a functional account action, separate from analytics consent.

New events record successful likes, newly observed public fork verification, sign-in starts/completions and shelf IDs. Like removals do not count as a new save. Initial collection reads do not count existing forks as new verifications. Sign-in markers are stored only after consent and expire after a day; completion requires a signed-in GitHub session. Migration readiness gates new event kinds without blocking existing statistics.

Conversion metrics count listing/session pairs in which the same browser session has the appropriate sequence: view then demo, view then like, or demo then like. Repeat events do not inflate pair denominators. These are observed associations, not proof of demo usage or causation. Rows show action counts by their actual shelf identifier. Returning browsers appear on at least two UTC dates in the chosen range. A new verified fork can predate its verification; it does not prove creation through RepoShelf. Browser identifiers do not join people across devices. Tracking starts with migration 10, with a visible start date; existing historical events are not backfilled into conversions. Detailed events retain the existing 90-day policy.

## Verification

Unit tests cover freshness gates, preview recovery, description provenance, public hiding across API surfaces, persisted exclusions, safe retries and authorization. PostgreSQL CI tests verify reporter privacy, admin-only moderation/audits, revision conflicts, duplicate reports, public controls with no private data and ordered conversion counts. Browser CI exercises guest/member/admin flows, reporting, queue requests, moderation, shelf-attributed demo/like events, the conversion panel and mobile layout.
