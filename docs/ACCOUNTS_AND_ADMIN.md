# Accounts, editorial rows and analytics

The code is deployed with safe fallbacks. GitHub sign-in, cross-device likes and administration activate after a Supabase project is connected. GitHub fork tracking uses the signed-in account; Hugging Face Space tracking remains browser-local. The agent API key does not grant user or administrator access.

## Activate Supabase

1. In Vercel → RepoShelf → Storage, connect a Supabase project through the Marketplace, or use an existing Supabase project. Select a suitable region and review the provider's plan before creating a paid resource.
2. In Supabase's SQL editor, run [the migration](../supabase/migrations/202610030001_accounts_editorial_analytics.sql). It creates likes, editorial rows, roles and private analytics, with row-level security. Run it once; policies intentionally fail if accidentally applied twice. Future changes should use a new migration.
3. In Supabase → Authentication → Providers, enable GitHub. Create a GitHub OAuth App with homepage `https://reposhelf.vercel.app` and callback URL `https://YOUR_PROJECT.supabase.co/auth/v1/callback`. Enter its client ID and secret in Supabase's GitHub provider settings. Public-repository browsing and fork links need no GitHub repository-write scope.
4. Set Supabase's authentication Site URL to `https://reposhelf.vercel.app`, and allow the redirect URL `https://reposhelf.vercel.app/api/auth?action=callback`. Preview/custom domains need their own explicit configuration; production sign-in is deliberately tied to one origin.
5. Add these **server-side Production environment variables** to Vercel, then redeploy:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` | Publishable/legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret/service-role key for anonymous analytics ingestion |
| `REPOSHELF_PUBLIC_URL` | `https://reposhelf.vercel.app` (default; change for a custom domain) |

The Marketplace aliases `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` are also supported server-side. No database key or OAuth secret is sent to frontend JavaScript. Do not paste secrets into chat, commit them, or put them in URLs. No Supabase secret is needed in GitHub Actions: scheduled catalog growth is saved with the catalog.

## Grant your administrator role

Sign in once through the storefront. Find your user in Supabase → Authentication → Users and verify it is the expected GitHub identity. Copy its UUID, then use the SQL editor:

```sql
insert into public.reposhelf_admins(user_id)
values ('YOUR-VERIFIED-USER-UUID')
on conflict do nothing;
```

Reload RepoShelf. The account dialog now offers **Administration**, at `/admin.html`. Other signed-in users can save likes but cannot manage roles, edit rows, or read analytics. The profile menu also offers **Help** and **Manage users** only to administrators. Help contains MCP client configuration, Supabase/OAuth instructions, migration links and configuration-presence checks without exposing secret keys. Administrator status comes from this protected table; GitHub usernames and user-editable metadata do not grant authority. After the first administrator is bootstrapped, use **Administration → Users & roles** to search established GitHub users and grant or revoke admin access. Users must have completed GitHub sign-in once. Their provider identity and immutable account UUID identify the selected account; user-editable profile metadata grants no authority. Every private request rechecks permissions. The interface and database role-management function prevent removing your own or the last administrator role, detect stale changes, and record actual changes in `admin_role_changes`. Privileged Supabase SQL remains a recovery option.

```sql
delete from public.reposhelf_admins where user_id='USER-UUID';
```

## Accounts and liked collections

GitHub OAuth uses PKCE with a short-lived verifier cookie, and server-verified Supabase sessions. Access/refresh tokens are in Secure, HttpOnly, SameSite=Lax cookies. Mutations require the configured same-origin Origin header. Expired sessions refresh through Supabase; invalid sessions are cleared. Sign-out revokes the current Supabase session and clears cookies.

Likes use authenticated database requests and owner-only row-level security. Each `(user_id, project_id)` is unique, so repeated saves are idempotent. There is pagination, with no fixed liked-collection total limit. Like controls work in cards and details and require GitHub sign-in. The collection has All saved, Liked, and Forks & Spaces views.

Guests can browse and try demos; new likes require sign-in. Existing browser likes from earlier versions remain available for explicit import. On signing in, account likes replace the guest view; **Import browser likes** explicitly migrates guest likes to that account. Account likes are never written to localStorage. Signing out clears them from memory and hides account likes and forks. Verified public GitHub forks are saved per account in Supabase. Manual Hugging Face Space tracking remains browser-local.

## Category-row CMS

Admins can create rows with a title, description and optional existing category. Manual mode lets you search the catalog, select projects, remove them and reorder the selection. Popular, Trending and Newest modes automatically choose projects from the saved catalog and category. Rows respect the storefront's demo, technology, source and category filters; unavailable projects remain hidden.

Save a draft, publish/unpublish, edit, reorder rows, or delete a row without deleting projects. A manual row can hold 120 selections; this editorial safeguard does not limit the catalog. Unavailable selections are labelled in the editor and must be removed before saving. Writes use database transactions and revision checks; stale edits return a conflict instead of overwriting another administrator's changes.

Published custom rows replace the automatic category section. Featured, community, recent-release and overall-trend ribbons stay above it. **Use custom category rows** can restore automatic rows while retaining drafts/selections. CMS data lives in Supabase, so catalog refreshes do not overwrite it.

## Private analytics

Only administrators can request analytics. The dashboard includes visits, page views, listing views, demo clicks, fork/duplicate clicks, search actions, current likes, likes added and still saved, top viewed listings, and historical catalog growth/coverage. It supports 7/30/90-day activity ranges. Removed likes are excluded from the “likes added” figure; it is not an all-time click total.

Optional first-party analytics are off by default. Visitors can opt in or withdraw through `/privacy.html`; consent is separate from agreeing to the Terms and is stored per browser. Browser instrumentation sends event UUIDs, randomly generated browser/session UUIDs, event types and catalog project IDs. Search text, IP addresses and full URLs are not stored. The server hashes session/browser IDs before storage, rotates the visitor hash daily, uses its own timestamp, ignores common bot user agents and applies a durable per-session ingestion limit. Repeated event UUIDs do not increase counts. Daily totals persist; detailed events and identity-deduplication rows have a 90-day retention window. Anonymous telemetry is an estimate and cannot eliminate all bots or spoofed requests. Browser privacy signals (DNT and Global Privacy Control), admin pages and signed-in administrators are excluded by the frontend.

Visits are sessions counted per UTC day; a session spanning midnight appears in both days. Visitors are approximate daily browser counts, not cross-device people. Fork clicks express intent; successful forks are not inferred from them. Analytics timestamps use UTC; current values should not be treated as a third-party billing/audit measurement.

Catalog growth is recorded after each six-hour discovery workflow in `dist/growth.json`, with record/demo/screenshot/README/source/unavailable counts. Its historical snapshots have no catalog-size ceiling and need no Supabase write secret in CI. History starts when this feature is enabled; no older counts are invented. The admin API combines this history with private database activity and current catalog coverage. Catalog counts are already public storefront data; user activity and likes remain protected.

## Verification and local development

```sh
npm test
npm run build
npm run test:mcp
```

CI also runs the migration and permissions against PostgreSQL 16, plus browser flows for guest/account likes, an independent browser context, draft/published storefront rows, ordering, analytics, mobile layout and the existing storefront. Those tests use simulated provider responses; the real GitHub OAuth round trip requires the configured provider.

For local sign-in use your own Supabase development project, set `REPOSHELF_PUBLIC_URL=http://localhost:3000`, add `http://localhost:3000/api/auth?action=callback` to its redirect allowlist, and provide server environment variables before `npm start`. Local HTTP uses HttpOnly SameSite=Lax cookies without Secure. Never reuse production admin/service secrets in shared fixtures. The migration can also be applied by your usual Supabase CLI migration process.

## Apply the user-management update

For an existing configured database, apply only [migration 2](../supabase/migrations/202610030002_admin_user_management.sql) in the Supabase SQL editor. New projects apply both migrations in order. This adds protected user search, role changes and role auditing; the first migration does not need to be rerun. No new server secret is required: role management uses authenticated RPCs and database-enforced authorization. User lists do not expose emails or tokens.

The admin profile **Help** link opens `/admin.html?tab=help`, and **Manage users** opens `/admin.html?tab=users`. Setup information comes from the admin-only `/api/admin-users?action=setup` route and contains configuration flags/project URL, never key values. The flags indicate settings are present; they do not assert OAuth or migration health. Direct unauthenticated or member requests cannot list users, update roles, or read setup status.

## Unique visitors

Apply [migration 3](../supabase/migrations/202610030003_unique_visitors.sql) once to activate the Unique visitors metric. Each browser counts once across the selected UTC dates, regardless of sessions or repeated visits on different days. Anonymous browser IDs are HMAC-hashed server-side; no IP addresses are stored. Signed-in users are also counted by browser, not as verified people across devices. Cleared storage, different devices and service-key rotation can increase the count. Admin visits and browser privacy opt-outs are excluded. Detailed hashed activity remains for 90 days. Existing daily visitor counts are retained, but their daily rotating hashes cannot reconstruct unique visitors for earlier dates: the dashboard displays the tracking start date and excludes historical unmeasured visits. Until the migration is applied, this metric displays a dash and activation instructions.

## Account-bound public forks

Apply [migration 4](../supabase/migrations/202610030004_account_forks.sql) once in Supabase. It creates per-user fork storage, resumable scan state and service-only verification functions. The already configured Supabase secret/service-role key enables server writes; no new GitHub scope or repository-write permission is requested. New sign-ins retain the existing GitHub OAuth provider token in a Secure HttpOnly cookie for authenticated public API reads, avoiding the much smaller anonymous quota. It is never exposed to frontend JavaScript, persisted in the database, or used for writes. Existing or expired provider tokens fall back to public reads; signing in again restores authenticated reads. GitHub usernames come from established provider identity data, never the old browser username field or user-editable profile metadata. The server resolves the current GitHub login using its immutable provider ID, verifies fork ownership and the parent repository, then saves public evidence. SQL binds the GitHub provider ID to the authenticated Supabase user and refuses client writes claiming verified status. Per-user RLS isolates saved forks, and concurrent checks use a lease.

The profile has one signed-in account and a Check my public forks button. A stale account visit starts a bounded check after six hours; this is activity-triggered, not a background job while the user is away. Each batch checks one saved fork and discovers up to three forks from the user's repository pages. Continue checking resumes its saved page/offset without a total-repository ceiling. Temporary errors and rate limits preserve saved records and scan progress. A confirmed missing, private or differently owned fork is labelled unavailable and may be restored on a later check. Only GitHub evidence marks a fork verified; a Fork click does not. Fork creation opens GitHub's own fork page after RepoShelf sign-in. Github can offer personal or organisation destinations: only a public fork actually owned by the signed-in individual is included here.

Browser-local GitHub tracking claims are no longer displayed or imported as verified records. Legacy likes can be imported explicitly. Hugging Face duplication still opens Hugging Face and requires its own identity; Space tracking remains local and is never labelled a verified GitHub fork. Account likes and forks are cleared from memory on sign-out and are not stored in localStorage. Migration 4 is additive and does not require rerunning earlier migrations.

## Admin catalog sync log

The admin profile Sync log link opens `/admin.html?tab=sync`. `/api/sync-log` checks the administrator role server-side before returning data. It combines GitHub Actions' run history (including queued, running, failed and cancelled runs) with saved per-run reports under `data/sync-runs`. Reports start with this update; earlier runs display status and times without invented record counts. Each new report compares catalog IDs and fingerprints before/after the run for added, updated, removed/merged and total records, records the number of available merged listings with usable demo links after the sync, captures named stage outcomes and reported temporary failure/warning counts, and links to the full workflow log. Fingerprint updates include metadata and check dates; temporary failure counts are reported attempts, not distinct failed repositories. The finished report runs even after an earlier stage fails, and its saved file is committed with any partial catalog updates. GitHub's final run conclusion overrides the pre-publish report status so a publish failure is still shown as failed. If GitHub history is temporarily unavailable, saved reports remain visible. Runs cancelled before a report can be written have no record counts. No Supabase migration or additional secret is needed. The log covers catalog refreshes, not personal fork checks. Times display in the administrator's local timezone.

Try demo and Repository actions now require a verified GitHub identity, including on hero cards and original-demo links. Guests see the sign-in dialog, and the server redirect endpoint rechecks the session before opening an external project link. Catalog browsing remains available without login; external public repositories and demos remain governed by their own hosting services.


## Bookmark snapshots and Terms/Privacy activation

Apply [migration 5](../supabase/migrations/202610030005_bookmarks_and_legal.sql) once in the Supabase SQL editor, after the earlier migrations. It adds private bookmark metadata and versioned legal acceptance records. Do not rerun migrations 1–4. New projects apply all five in order.

Likes now accept valid repository/Space identifiers even when a project comes from live search, a curated fallback or an older cached catalogue. Where available, canonical saved-catalogue details are preferred. Other bookmarks retain a bounded, sanitised snapshot supplied by the listing, visible only to their owner; this does not publish the project, verify availability or grant a licence. Existing databases without migration 5 retain the ability to save identifiers, but cannot retain missing-catalogue descriptions/demo links across devices until migration 5 is applied.

The drafted documents are `/terms.html` and `/privacy.html`. The review form is `/legal.html`. They remain explicitly marked as drafts, and account acceptance is inactive, until the operator name, country of operation and private contact email are configured. Obtain appropriate legal review for the actual operator and intended markets before public launch.

RepoShelf is configured as the public service name, with United Kingdom as the country of operation. This does not identify a company or resolve the actual legal operator. The legal operator name and contact email remain empty, so acceptance stays inactive. **Reminder: set up a dedicated, monitored RepoShelf email** for privacy, account deletion and legal requests. This reminder also appears in Administration → Help.

After confirming the actual legal identity and applying migration 5, set these public operator settings in Vercel and redeploy:

- `REPOSHELF_OPERATOR_NAME`: the actual person or legal entity operating the service.
- `REPOSHELF_OPERATOR_COUNTRY`: the actual country of operation.
- `REPOSHELF_CONTACT_EMAIL`: a monitored address for privacy, rights and legal requests.

Do not enter GitHub/Supabase credentials as contact details. These settings are public. With all three valid values, the documents become active and signed-in users review the current version before account actions or opening demos/repositories. Terms agreement and Privacy acknowledgment are explicit; optional analytics are unchecked and separate. Supabase records the user ID, Terms/Privacy versions and server timestamp privately and idempotently. The server checks acceptance on protected actions; existing users must also review the active documents. A material version change requires updating `LEGAL_VERSION`, the SQL accepted-version constraint/function and document dates together, then applying a new migration before deployment. Acceptance alone does not create analytics consent.

Withdrawal of optional analytics applies to the current browser immediately, clears its analytics identifiers and stops queued/scheduled events. DNT/GPC and administrators remain excluded. Earlier events retain the documented retention policy. Account deletion and privacy requests are currently handled manually through the configured contact address, including Supabase account data and the documented provider retention process.


## Sponsored promotion test programme

See [promotion setup](PROMOTIONS.md) for migration 6, Stripe test checkout/webhooks, hourly availability checks, owner requests and administrator approval. This uses a separate Sponsored ribbon and does not sell editorial placement. Real payments are disabled; test placements appear only to administrators.

Sync reports now include **With demo page**. This excludes unavailable repositories and demos confirmed unavailable, deduplicates linked GitHub/Space listings consistently with the store, and includes available standalone Spaces. Earlier reports display a dash because their historical demo count was not recorded. It measures saved demo links, not a guarantee of complete demo functionality.

All outgoing web links require verified GitHub sign-in, including README, licence, demo, repository, fork, Hugging Face, community discussion and documentation links. Links use the authenticated `/api/open` redirect, including new tabs and copied links. Signing in resumes the selected destination; internal browsing and legal pages stay accessible.

Free repository submissions are available from the signed-in account menu. See [SUBMISSIONS.md](SUBMISSIONS.md) for migration 7 and worker activation. Paid promotion is a separate feature.

The profile menu groups My collection and My submissions under Your projects, and Privacy preferences and Sign out under Account. Administrators also see a role badge, My promotions (test), and one Admin dashboard link. Storefront editing, analytics, users/roles, sync logs, promotion reviews and setup Help are accessed from that dashboard. Fork checks, last scan status and legacy browser-like imports are in My collection; fork checks appear in its Forks tab.


## Built-in storefront rows and random ordering

Apply [migration 8](../supabase/migrations/202610040008_editorial_discovery_qa.sql) after migrations 1–7. Existing projects do not need to rerun earlier migrations. Refresh Administration to edit the spotlight, editorial selections, community/release/trending rows and default category shelves. Saving a built-in row preserves the category layout; custom shelves can still replace categories using the existing setting. Random each page load provides a stable order while browsing, while Daily shuffle shares an order for the current UTC date. Migration 8 also aligns all selected-date analytics with UTC calendar days.
