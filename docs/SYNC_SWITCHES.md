# Sync switches

Administrator → Sync log → Sync switches controls the existing GitHub Actions workflows. Each switch has a sentence explaining its work and a link to its history. Changes save immediately and are read back from GitHub; existing runs are not cancelled. Disabled workflows reject future manual dispatches as well as scheduled/event triggers. No database migration, extra credential or paid service is introduced: the existing repository Actions token needs Actions read/write access.

The 13 switches cover catalogue refresh, submissions, listing recovery, SceneAI prompts, X candidate imports, promotion checks, demo framing, viewer qualification, viewer diagnostics, extra launch runs, catalogue publication, health/catch-up checks and artifact cleanup. The application CI workflow is deliberately not a sync switch.

GitHub discovery, curated sources, enrichment, demo checking and screenshots are stages within the catalogue workflow and share its switch. The existing X.com scanning switch remains separate: it controls new searches in the collector; X candidate imports control validation/imports of already saved candidates. Turning off one does not imply that the other is off.

Switch state is owned by GitHub. Unknown or missing workflows show unavailable controls. Writes require the current administrator session, current legal acceptance, an allowed site origin, a workflow from the server allowlist and the expected current state. The server verifies the saved state before confirming success. Concurrent changes prompt a refresh. Tokens never enter the browser response.

Turning off catalogue or publication can make the public site stale; health checks may still report the paused work. Turning off health/catch-up stops that workflow's monitoring and recovery requests. The external maintenance timer, if configured separately, is not disabled by the health switch; GitHub still refuses its requests for a disabled target workflow. The displayed schedule describes the normal timetable; it does not override a disabled workflow. Use Refresh switches after changing a workflow directly in GitHub.
