# X.com collection

The separate public collector repository is `sparx1981/reposhelf-x-collector`. It runs discovery and demo browser checks on GitHub Actions and exports fresh accepted candidates. RepoShelf's trusted intake imports them for normal publication, retaining source posts and the additional **As Seen On X.com** category.

## Setup

1. Apply `supabase/migrations/202610080027_x_collection_settings.sql` after the existing migrations.
2. Deploy the RepoShelf administration update. Open **Administration → Sync → X.com scanning**.
3. Set your maximum spend per billing cycle and auto-recharge preferences in the X Developer Console. Scans can use promotional or purchased credits. Keep the collector's `X_BEARER_TOKEN` in its GitHub Actions secrets.
4. Enable scanning and save. It starts on the next daily run at **06:17 UTC**; saving does not dispatch a run.
5. For an immediate run, use the collector's **Run workflow** button with **Search X** selected. Manual searches also obey the administrator toggle.

Scanning defaults off. A missing migration or unavailable setting prevents searches. Disabling takes effect before the next search request; it cannot recall a request already sent. Saved-candidate demo checks continue while scanning is off. The old `X_COLLECTION_ENABLED` GitHub variable is no longer used.

The collector checks X's balance before searches and keeps a $2 reserve. Each run reads at most 50 posts with a conservative $0.50 reservation ceiling. Billing/access/rate-limit responses stop the run without automatic retries. X's billing-cycle cap is authoritative; X may allow a slightly negative balance. The collector never purchases credits or modifies billing settings. Adding balance allows a future scheduled run to resume if scanning remains enabled and X's spending cap permits access.

Results are public in the collector's `collector-state` branch and workflow artifacts. Credentials and raw post text are never included. RepoShelf still applies freshness, screenshot and moderation requirements before publication.
