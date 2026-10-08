# Repository submissions

Anyone with a connected GitHub account can suggest a public repository, including one created by somebody else. The submission belongs to the submitter's private request history; it does not establish ownership of the repository or the catalogue entry. Promotion ownership checks are separate.

A new request dispatches the submission workflow with its submission ID. The selected request is claimed under a database lease. Scheduled runs every 15 minutes provide a fallback and claim up to five requests. GitHub runner queues, restoring the saved catalogue and an active catalogue/publication workflow can delay the start. This is prompt asynchronous processing, not a guarantee of an instant result.

The worker checks the public repository, reads its README, discovers the demo, opens the demo through the existing guarded browser probe and captures a JPEG preview at quality 60. Existing moderation controls apply. Only entries that pass the publication eligibility rules are accepted. Transient errors preserve the catalogue record and schedule a retry; confirmed failures or missing demo links are explained in the private request status.

An accepted result is recorded only after catalogue data and screenshots are saved to the checkpoint branch. The page then shows the next expected daily publication at 06:35 UTC in the visitor's device time zone. Administrators can publish sooner; schedules may be delayed. Older imported requests without quality receipts are labelled as earlier scans rather than being claimed to have passed the new checks.

Queued requests and requests waiting for retry can be cancelled by their submitter. A scan that already holds a lease cannot be cancelled, and an imported entry cannot be removed through the submission screen. Cancellation stops the private request; other discovery processes can still include the public repository. A cancelled or rejected repository can be submitted again after the existing one-hour cooldown. The ten-per-day submission limit remains.

## Enable the update

Apply `supabase/migrations/202610080026_submission_quality_cancellation.sql` once in the project's SQL editor after migration 7. No new secret or provider key is required. Existing `REPOSHELF_SUBMISSION_SYNC_KEY` and the dispatch token must remain configured as before.

Until migration 26 and the updated API are available, the new worker leaves requests queued. The UI only shows cancellation when the database reports support. Worker leases are never returned in member API responses, and submission account IDs are not attached to public catalogue records.
