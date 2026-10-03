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

First-party browser instrumentation sends event UUIDs, randomly generated browser/session UUIDs, event types and catalog project IDs. Search text, IP addresses and full URLs are not stored. The server hashes session/browser IDs before storage, rotates the visitor hash daily, uses its own timestamp, ignores common bot user agents and applies a durable per-session ingestion limit. Repeated event UUIDs do not increase counts. Daily totals persist; detailed events and identity-deduplication rows have a 90-day retention window. Anonymous telemetry is an estimate and cannot eliminate all bots or spoofed requests. Browser privacy signals (DNT and Global Privacy Control), admin pages and signed-in administrators are excluded by the frontend.

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
