# Sponsored promotions — test programme

Scope: a separate **Sponsored** ribbon; verified personal GitHub repository owners only; administrator approval before payment; £15 GBP for 30 active days; one payment, no renewal; five simultaneous reserved/running places; confirmed unavailability pauses the clock and preserves the place. Paid promotions do not change Editor’s Picks, organic popularity or search ranking. No traffic or impressions are guaranteed. The introductory price is a proposal for testing, not a live commercial offer.

Real payments are deliberately disabled. The server rejects live Stripe keys and live events. Test purchases appear only to authenticated administrators as clearly labelled previews. Guests and ordinary members receive no test-sponsored feed. The legal documents remain drafts while the actual operator identity and dedicated email remain unresolved.

## Configure the test environment

1. In Supabase → SQL Editor, apply [migration 6](../supabase/migrations/202610030006_promotions.sql), after migrations 1–5. Existing projects run only migrations not already applied. No secrets belong in the migration.
2. Open Stripe Dashboard and use a sandbox/test environment. Obtain its secret key beginning `sk_test_`. Do not use a live key or enter real card details.
3. In Stripe’s Webhooks / Workbench, add an endpoint for the sandbox:
   `https://reposhelf.vercel.app/api/promotions?action=webhook`
   Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, and `charge.refunded`.
4. Copy the endpoint’s signing secret beginning `whsec_`. It differs from a Stripe CLI forwarding secret.
5. In Vercel → RepoShelf → Settings → Environment Variables, add Production `STRIPE_SECRET_KEY` (test key) and `STRIPE_WEBHOOK_SECRET`. Hosted Checkout needs no browser publishable key. The existing Supabase service key is used privately for protected promotion mutations.
6. Generate a private sync credential of at least 32 random characters. Set `REPOSHELF_PROMOTION_SYNC_KEY` in Vercel and the same value in GitHub → RepoShelf → Settings → Secrets and variables → Actions → New repository secret. Never include it in URLs, source code or frontend configuration. Redeploy Vercel after changing settings.
7. GitHub Actions’ **Check promotion availability** workflow runs hourly at minute 43, or can be run manually. GitHub may delay scheduled runs. Before the sync key is configured, the workflow explicitly reports that setup is pending and does not mutate promotions. Admin **Check availability** and owner **Check payment / availability** also reconcile current records.

Do not send credentials to another user or add them to this repository. No Stripe account, webhook, Vercel secret, GitHub secret or Supabase migration is automatically created by deploying the code.

## Try the flow

1. Sign in as the personal owner of a public repository already in the saved catalogue, with an available demo. Archived/disabled repositories and organisation-owned repositories are ineligible. Ownership matches the immutable GitHub provider ID, not a typed username or client claim.
2. Open the listing. **Promote listing** appears after server ownership verification. Alternatively open My promotions from your account menu and enter `owner/repository` or its GitHub URL.
3. Submit a request. Up to three pending requests per owner are allowed; only one unfinished promotion can exist per immutable repository ID.
4. An administrator opens **Administration → Promotions** or **Review promotions** in the profile menu. Approve an available listing, or reject it with a note. Neither approval nor the checkout return URL marks payment as complete. If ownership or the approved demo changes before payment, checkout is blocked; an administrator can reject the unpaid approved request so the owner can submit it again.
5. The owner opens My promotions and selects **Test checkout — £15**. Capacity is atomically reserved before creating an idempotent Stripe Checkout session. Use `4242 4242 4242 4242`, a future expiry and any CVC. Use Stripe’s documented test cards for declines. Do not use real card details. If all five places are occupied, the approved request remains available for later checkout.
6. The signed test webhook records paid status only when amount, currency, one-off mode, promotion ID, attempt ID, session ID and payment intent match. Duplicate events do not replenish time or create another placement. A refresh reconciles the verified Stripe session if its webhook is delayed. Checkout cancellation does not activate a promotion.
7. As an administrator, the store shows the separate **Sponsored** preview with labels on each card. Order rotates across visits and minutes; visitor filters still apply. Ordinary members and guests see no test placements.
8. Check a demo outage and recovery. Confirmed 404/410 responses pause; HTTP 403/429, server errors, DNS failures and timeouts retain the last state for retry. Demo redirects are validated and public-IP-pinned on every hop; no demo JavaScript is executed server-side. Existing confirmed catalogue health failures also pause the promotion. Ownership changes, private/deleted repos, removed listings, archive/disablement and changed demo URLs pause it. Checks operate on available catalogue snapshots plus current repository/demo HTTP evidence; they are not continuous monitoring or a complete functional demo test.
9. An administrator can refund the full test payment and end a promotion. A successful full Stripe refund webhook also ends it. Changed ownership/demo links require refund/reapplication; the current approval is not automatically transferred to another owner or site.

## Clock, capacity and recovery

Thirty days means 2,592,000 active seconds stored server-side. Active elapsed time is deducted transactionally on checks; paused time is untouched. Expired placements disappear from the feed even before the next reconciliation; the worker marks expiry and frees capacity. All five reservations include checkout, active and paused states. A paused place is retained until recovery or an administrator refund, so it can block new sales intentionally.

Stripe normally expires abandoned Checkout sessions after 24 hours. Reconciliation releases the reservation only after Stripe confirms expiry, rather than trusting a client cancellation or local clock. An uncertain checkout creation can be retried with the same attempt/idempotency key. If payment confirmation arrives after an expired session’s place was reused, the paid request waits without consuming promotion time until capacity opens; unpaid requests cannot jump ahead. Hourly checks process records concurrently with database locking for safe seat allocation. The API reports failed checks for later retry without exposing secrets.

Requests, reviewer notes, checkout/payment references, status transitions and remaining time live in Supabase for cross-device compatibility. Owner/admin reads are restricted by RLS; browser clients cannot approve requests, claim payments or alter the clock. Events preserve status history. The server uses fixed GBP amount and duration; arbitrary client amounts are ignored. No card numbers are stored in RepoShelf. Billing state changes require administrator auth, a signed Stripe webhook, or the protected sync credential. The administrator full-refund action is idempotent; inspect Stripe before retrying an unresolved refund.

## Before enabling real payments

This implementation cannot accept live payments by configuration alone. A later release must explicitly add live mode after the actual UK operator/controller identity, dedicated monitored email, Stripe onboarding, tax/VAT treatment, advertising disclosures and applicable promotion/cancellation/refund/consumer rights are settled. Do not replace test keys with live keys to bypass this stage. Apply a new reviewed agreement/version if commercial terms change. Payments must not purchase Editor’s Picks placement.

Verification includes server ownership and signature/price/origin tests, PostgreSQL permissions and capacity/clock tests, browser owner/admin flows, mobile layouts and deployed private-route checks. Provider calls are simulated in automated flow tests; a real Stripe sandbox checkout still needs the above setup.
