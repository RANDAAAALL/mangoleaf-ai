# Supabase guidelines, preserved cloud data, and recovery

## Recovery and deletion race audit (October 23, 2026)

Recovery sign-in uses a separate in-memory Auth storage binding until password acceptance and server `getUser` confirm the protected vault claim and expected owner. Old-owner deletion jobs drain before promotion. A short local-only guard checks the scope again, persists the verified candidate and changes ownership; History deletion uses the same guard around its scope read and atomic outbox commit. No Auth HTTP call runs inside that local guard. Adapter generations prevent retired refresh operations from overwriting/removing the new session. Failed candidates preserve the connected identity; a failed local promotion attempts to restore prior settings and fails closed.

Before the first upload, the client rechecks that the report survived anonymous enrollment. Transfers yield between reports after backgrounding, diagnosis or pause; a started Storage/SQL deletion pair is acknowledged only after completion. Wrong-code input and Clear do not disconnect the current owner. This audit changes client/native behavior only: no SQL, Auth provider, policy, deployment, production data or testing data was modified. Cross-device deletion propagation remains absent. Mocked-SDK and local evidence are recorded in [Android testing](../testing/ANDROID_TESTING.md#october-23-2026-implementation-audit).

## Website installation hints (October 22, 2026)

Related-app results only select website labels and repeat-download presentation; they never authenticate ownership or expose the native bridge. Intent links fix the application ID and same-origin download fallback, without accepting package/URI overrides from query strings. Release `asset_statements` names only the public production website; Debug does not advertise that association. No HTTPS intent filter or new WebView navigation permission is added. Existing native launches continue to ignore external URI payloads and reuse the trusted Activity. Supabase resources, policies, data and sessions are unchanged. See [native association requirements](../versions/ANDROID_APK_VERSIONING.md#website-open-or-install).

## Automatic production enrollment follow-up (October 22, 2026)

The maintainer explicitly authorized automatic production backup, superseding the earlier opt-in candidate. Production function version 3 (bundle `280de1ce42aa876a7cca6106c957edc12d997aaebdf652849a57d9076a603221`) permits verified anonymous enrollment behind the existing true server flag. Production CORS remains native-only. Auth verifies bearer ownership, the existing atomic quota limits first enrollment, and protected app metadata plus unchanged RLS authorize private transfers. Device UUIDs and editable user metadata grant no access. Historical resources are not reassigned or deleted.

First eligible saved photos trigger setup while foreground/connected; empty History does not. Project-scoped sessions, bound owners and explicit pauses are preserved. Recovery codes attach to the same owner and must be saved outside the phone. Wrong codes preserve current credentials. Privacy/download text discloses automatic uploads. No automated production identity/report/photo was created: full-row count/digests remained equal for 75 scans, six guidelines, 85 users and 80 photo metadata rows; manifests stayed zero.

To halt new enrollment, disable the server flag; existing sessions/uploads and deletion jobs remain independent. Client rollback must also preserve credentials, local files and outboxes. No SQL/RLS/Storage/provider setting changed in this follow-up. Earlier photo-byte backup limits and advisor findings remain applicable. See [current native flow](../versions/history/ANDROID_APK_HISTORY.md#automatic-production-backup-and-update-prompt-october-22-2026).

## Production release preparation (October 22, 2026)

Production now has a local signed-APK preparation path and permanently approved external APK/OTA keys. Private files/passwords remain outside Git; Windows credentials use CurrentUser DPAPI and restrictive ACLs. A portable protected backup of both keys and passwords remains a manual publication prerequisite. Release checks the actual signing certificate, package, inventory/model/backend and signed public OTA trust; Debug cannot inherit production OTA configuration. Signing secrets are excluded from web and SDK child environments. Candidate receipts and generated artifacts stay ignored.

The additive production SQL now requires exact reviewed policy commands, roles, permissiveness, `USING` and `WITH CHECK` expressions through empty temporary-table comparisons. Merely naming an owner policy or mentioning ownership cannot pass. Weakened `OR true` and Storage-update policies are rejected without rewriting existing policies. Inspect/count/fingerprint SQL exposes no scan rows, credentials or photos. Preservation still requires real private snapshots and photo backups before production changes; aggregate equality alone is not a recovery backup.

Production provisioning requires the pinned project and `ANDROID_BACKUP_PROVISIONING_ENABLED=true`. After Supabase access returned, the additive SQL and function were deployed; the maintainer enabled the flag in Edge secrets. All nine catalog checks passed, as did native preflight, rejection of development/untrusted origins, invalid payload/enrollment refusal and unsigned private-table denial. Email/password login is enabled; existing signup/anonymous-provider settings were preserved. Production app backup remains explicit opt-in and does not enroll historical anonymous owners. No production identity, scan, photo, backup manifest or provisioning slot was created by verification.

Exact before/after snapshots retain all fields for 75 original scans, six guidelines, 85 Auth users and 80 photo-object metadata entries, along with existing policies/grants/bucket/schema resources. Private snapshots are under ignored `.tools/supabase-backups/20261022-production-android/`. The older archive contains 68 hash-verified photo copies; 12 current objects lack a local byte backup. No complete media export is claimed, and the additive deployment does not touch those objects. Separate authorization and appropriate backups are required before any historical destructive/reassignment work. Follow [current deployment status](../versions/history/ANDROID_APK_HISTORY.md#production-cloud-deployment-status-october-22-2026) and [server procedure](../versions/ANDROID_APK_VERSIONING.md#server-preparation-and-review). Roll back the enable flag first; retain resources, credentials and deletion queues. Never infer historical cleanup or propagate deletion across devices.

Remaining advisor results are recorded rather than suppressed: the private budget table intentionally has RLS with no client policy/grants; the guarded completion RPC intentionally exposes a narrow authenticated SECURITY DEFINER capability; ownership policies retain authenticated-role access with protected vault claims where required; historical anonymous-provider and leaked-password-protection notices remain. The empty new lookup index is reported unused. No broad provider/policy change was made to silence these notices. [RLS review](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [definer capability review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Automatic testing ownership and cleanup (October 21, 2026)

The maintainer enabled anonymous sign-ins and new-user signups on testing project `ajwlojaclehxupntnsve`; real anonymous signup was verified. Testing `android-backup-vault` version 2 verifies the bearer with `auth.getUser`, quota-limits first enrollment and sets the protected `app_metadata.android_backup_vault` claim on that same Auth user. The client refreshes the token before private transfer. User metadata and device UUIDs cannot grant ownership. Existing table/Storage RLS and transfer functions are unchanged. The deployed function retains `verify_jwt: false` for its existing gateway configuration; testing enrollment and code creation both perform bearer verification inside the handler.

Creating a recovery code adds credentials to the anonymous owner and keeps its UUID; the live test observed that user become non-anonymous. No Sign In/Register screen is added. The client verifies candidate recovery credentials before changing its active session, drains confirmed deletion jobs before switching owners, and keeps sessions/owner labels scoped to the project. Clearing the recovery input is not logout. Production behavior remains explicit opt-in, with production provider settings, data and server rollout unchanged.

Before code creation, the verified owner's public UUID labels pending deletes; after creation, existing recovery-email labels remain compatible. These labels route work and never authorize it. Deleting History removes its connected cloud copies after Storage and paired SQL cleanup succeed, but does not propagate deletion to other devices. Stale devices can reupload their own local copy. Public guidelines remain independent of Auth and backup.

With separate cleanup authorization, testing scans and backup manifests were deleted and the maintainer removed the test Storage photo. Final read-only verification found **0 scans, 0 manifests, 0 photos and 6 guideline rows**, with unchanged guideline checksum `b5c8a9e605239fc0fee820aae63fabcf`. The private bucket, Auth users, policies and production resources were preserved. No administrative cleanup endpoint was installed. Private controlled-test credentials and rollback snapshots remain ignored under `.tools/supabase-backups/`.

For rollback, preserve native SQLite/private photos, project-scoped sessions, owner labels and pending deletion jobs. Disable automatic testing uploads in the rollback client before reverting the provisioning handler: the previous handler does not support anonymous enrollment. Do not clear users, drop tables or downgrade Dexie to remove the outbox. The original handler snapshot is retained locally; production deployment remains a separate reviewed step. See [current Android recovery behavior](../versions/history/ANDROID_APK_HISTORY.md#automatic-testing-backup-and-recovery-october-21-2026).

## Confirmed History deletion (October 21, 2026)

The maintainer authorized synchronized deletion of connected backup copies when History reports are deleted. Development browser uses a new Dexie v10 outbox; both APK variants use an atomic SQLite/settings job, requiring native host code 2. Jobs bind to the project and recovery-vault label, never to a device UUID. The label routes pending work and does not authorize access: the worker calls `getUser`, verifies the server-owned vault claim and recovery email binding, then applies the existing owner/path RLS and paired-delete RPC. No Auth-provider setting, policy, migration or historical data is altered by this client change.

Private Storage removal must succeed before the SQL delete; local acknowledgment follows both. Failures/lost responses remain retryable, even with uploads paused. New vault connections cannot consume an old vault's jobs. A disconnected/lost credential must be reconnected before its queue can drain. Existing reports absent from local History, old tombstones and legacy cloud resources are not automatically deleted. Another active writer can reupload a stale copy, so pause other writers before deletion. The [Android guide](../versions/history/ANDROID_APK_HISTORY.md#history-deletion-and-recovery-october-21-2026) records limits and rollback preservation. Dated earlier local-only/retained-copy descriptions below precede this change.

## Testing isolation and development uploads (October 21, 2026)

**Later October 21 follow-up:** the maintainer authorized automatic development-browser uploads, replacing the explicit enable control recorded below. Development mode, browser target, testing environment and exact pinned URL must all match. The first saved non-deleted report needing upload can provision a quota-limited test owner automatically; empty History does not. These credentials remain scoped to testing and its browser origin. Browser recovery APIs stay closed, and Android/production backup still requires explicit consent and a saved recovery code. No RLS, production resources or server policy was loosened for this change.

Both APK variants retain optional diagnostics. Downloads use the trusted native bridge and Android document picker for bounded technical text only; no scan/photo/credential fields are added to the recorder. Development-browser diagnostics is visible below 768px. APK installation guidance does not expose the local debug binary as a public production download.

Browser development and debug APKs select the pinned `mangoleafai-testing` project. Explicit `.env.testing.local` loading overrides inherited production public variables; Android backend selection participates in build fingerprints, Gradle variant guards and native-host verification before a persisted private client is constructed. Debug has its own application ID. Session, recovery-code and enablement keys are project-scoped; native secret prefixes remain Keystore-encrypted. Earlier unscoped values are preserved without silently relabeling them.

Browser development adds an explicit test-sync control, with no recovery screens or guest creation at startup. It reuses server-provisioned owned manifests and uploads local Blobs to private Storage. Test credentials live in that development origin's localStorage; production browser builds cannot enable this path. Native recovery, code display, connection and whole-vault deletion reject browser callers. Confirmed History deletions queue cleanup of connected backup copies. Public guidelines remain readable without a private session.

Only the testing `android-backup-vault` function is deployed and enabled. Native/localhost/HTTPS development-tunnel CORS is pinned to that test deployment; other origins are refused. CORS does not authenticate ownership. Provisioning has the existing atomic quota and generates a new credential without accepting a caller-supplied owner. Private operations still require server-verified Auth and RLS. Production server rollout is unchanged and pending.

The maintainer explicitly authorized copying six public production guideline rows; all four columns were compared exactly with testing. No production scan rows, photo objects or Auth users were copied or changed. Read-only hosted checks verify six guidelines, development preflight and invalid-origin/payload refusal without creating users or records. Real-token upload/recovery and physical-device checks remain separate validation. See [routing and rollback](../versions/history/ANDROID_APK_HISTORY.md#development-and-production-routing-october-21-2026).

## Recovery-code Android candidate (October 20, 2026)

The candidate working-tree scan also covers newly added/uncommitted source. `.gitleaks.toml` retains every default rule and excludes only the exact public localStorage identifier `mangoleaf-diagnostics-v1` in its three audited diagnostics source/test files. No file, credential-shaped replacement, or general key name is exempted. The regression fixture replaces that value with a generated dummy credential at the same path/variable and requires detection with redacted output. Historical commit-specific exceptions remain preserved separately in `.gitleaksignore`.

The latest authorized Android feature reuses the preserved `public.scans` table and private `scans` bucket for **new opt-in backups**. It adds immutable `android_backup_reports` manifests and an explicitly invoked provisioning function. The recovery code is a high-entropy credential for a server-confirmed Auth identity, without Sign In/Register screens. Server-verified ownership and RLS gate each backup/restore/delete; device UUIDs and historical metadata never establish ownership. The native Keystore encrypts persisted recovery codes and sessions. Codes, tokens, photos, raw request URLs, and private report content must not enter diagnostics.

The reviewed forward SQL and Edge Function are prepared in source, not automatically applied by app startup/build. Historical users, rows, private objects, and owner policies remain preserved. Provisioning is disabled by default and uses a service-role-only atomic creation budget. Local saving stays offline and independent of backup; confirmed History deletion queues removal of connected backup copies without inferring historical cleanup. Restore is manual, verifies hashes/paths, and preserves local deletion records. See [server preparation, ownership, and rollback](../versions/ANDROID_APK_VERSIONING.md#cloud-recovery-without-sign-inregister-screens). A connected Supabase project and controlled cross-owner tests are required before enabling production provisioning. Dated local-only statements below describe the earlier browser candidate.

## Separate empty testing project (October 20, 2026)

Authenticated MCP verified and initialized only `mangoleafai-testing` (`ajwlojaclehxupntnsve`). Production access was limited to reading table definitions, without changing its rows, objects, users, policies, or settings. The test project has a private 8 MiB JPEG/WebP `scans` bucket, matching base-table columns, explicit least-privilege grants/RLS, the new backup schema/RPCs, and guideline-only Realtime. The initializer refuses existing application tables, Auth users, buckets, or objects and copies no production application data.

Six public offline-guideline setup seeds were briefly present, then removed under the maintainer's explicit empty-project instruction. Removal verified every field against the known seed and refused any changed or unrelated data. Final test scans, guidelines, backup manifests, photo objects, and Auth users were all zero. The provisioning-budget singleton is internal configuration, not user data. Thirty hosted temporary-table ownership cases passed and rolled back; eight live backup catalog checks passed. No real Auth identities, photo uploads, or backup/restore flows were exercised.

The platform's automatic-RLS helper initially had client EXECUTE access. The test-only hardening migration revoked it from PUBLIC/anon/authenticated while retaining the enabled administrator-owned event trigger. A backup foreign-key index and statement-cached JWT policy subqueries addressed the associated performance findings without changing ownership permissions.

Remaining advisor findings are retained for review: [authenticated SECURITY DEFINER execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) on `complete_android_backup_report` is the intentional narrow owner/owned-object completion capability; [RLS without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) on `backup_private.provision_budget` is intentional default denial with no client schema/table access and a service-only RPC. Unused-index information is expected on the empty test database. None of these findings was suppressed or resolved by granting broader access.

The testing provisioning Edge Function and debug/production connection separation remain pending. A debug APK currently has no new production-upload block; do not infer safe backend selection from its label or the testing project's existence. Existing `.env.local`, browser/native data, production resources, and model overrides remain preserved. Follow the [separate testing-project setup](../versions/ANDROID_APK_VERSIONING.md#separate-testing-project); never paste service-role keys or recovery credentials into chat or public build settings.

## Local-only History candidate (October 15, 2026)

The current source uses Supabase only for public guideline SELECT and Realtime notifications. The app creates no guest session and sends no scan, photo upload/download, or cloud deletion requests. Reports and compressed photo Blobs remain local in IndexedDB. Existing server tables, private Storage photos, Auth users, policies, and anonymous-sign-in settings were not changed or deleted.

The historical security implementation below remains evidence for earlier cloud clients and the retained cloud archive. Its configuration checklist is not a prerequisite for the local-only candidate. New project setup needs only the guideline table, least-privilege public read access, Realtime publication, and browser-safe project settings from [SETUP.md](../../SETUP.md#configure-supabase).

### Preservation and rollback boundary

Dexie v9 drops unused scan indexes without rewriting reports. Existing IDs, Blobs, hashes, model labels, status values, and historical owner/cloud/path/device references remain. Old `pending-delete` records remain hidden and do not run remote cleanup. A new local deletion removes only the selected local report/photo; it does not delete a preserved remote archive.

An older v8-only application cannot simply reopen a database upgraded to v9. A rollback must retain a v9-compatible schema and the preserved fields while deliberately restoring its old behavior; do not downgrade, clear, or recreate IndexedDB. Re-enabling cloud code would also need renewed guest ownership/security review, because old retained status values are no longer an active queue. Preserve the reviewed source baseline and backup before rollback.

No automatic recovery exists after local site data is cleared, evicted, or lost with the device. Retained historical server data is not automatically assigned to a newly generated UUID. Any administrator-assisted recovery or cleanup requires a separate authorized preservation plan. Disabling anonymous sign-ins alone would neither remove old Auth users nor delete their scan/photo data; no such dashboard action was performed here.

## Optional diagnostics boundary (prepared v0.7.0, October 17, 2026)

The new About diagnostics recorder stays in browser memory and localStorage (`mangoleaf-diagnostics-v1`); it does not use a Supabase table, bucket, Auth identity, or automatic upload. Public guideline instrumentation records controlled download counts/outcomes, Realtime status, and known error names without logging advice payloads, request URLs, project keys, or session tokens. Scan/photo/report identities and classification results are excluded from this log. A user may explicitly copy or download a plain-text export; that action does not send it to the server.

Recording defaults to off, with bounded best-effort retention and a memory-only fallback. Clearing diagnostics does not clear local scans/photos or alter preserved cloud resources. This adds evidence for troubleshooting rather than changing cloud ownership, guideline ordering, request timeouts, or stalled-operation recovery. See [diagnostic architecture](../ARCHITECTURE.md#optional-local-diagnostics-october-17-2026) and [phone instructions](../../SETUP.md#phone-diagnostics-and-stalled-operations).

## Historical cloud client and security implementation (October 2–14, 2026)

The earlier client synchronized scan reports and photos through verified guests. The following rules, SQL, evidence, and deployment notes describe that implementation and remain intact for preserved cloud resources.

For a plain-English explanation of the maintenance files, start with the [SQL folder guide](../../supabase/sql/README.md). It distinguishes the forward change, verification checks, and optional cloud-write pause.

## Related setup and testing guides

- [Project setup](../../SETUP.md#configure-supabase): required dashboard settings and application resources.
- [Application architecture](../ARCHITECTURE.md#synchronization): the client data flow.
- [Testing guide](../testing/TESTING.md#cloud-ownership-and-offline-checks): client checks and the separate database authorization checks.
- [Treatment-guideline review](../treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md): published advice and supporting literature.
- [Implementation status](#implementation-status): exact backup, local validation, live-policy evidence, and the pending deployment boundary.

## Why this change is needed

The former client used a browser-generated `device_id` to request its scans. That ID was a useful browser label, but the server did not verify ownership. A caller could change the request or omit its device filter.

The October 2, 2026 read-only review confirmed these conditions:

- RLS was enabled on `public.scans`, but public SELECT, INSERT, and DELETE policies accepted every row. An unsigned `anon` request could see 65 scan records belonging to 21 device IDs.
- The `scans` Storage bucket was public. Its policies allowed public listing, upload, and deletion throughout the bucket; 68 photo entries were visible during the review. Photo downloads were also public to anyone with the URL.
- `public.guidelines` allowed public reading, which suits published advice. Ordinary row writes had no allowing policy, but browser table grants were broader than the application needed.
- The security advisor returned no findings. That did not override the direct role and policy checks.

These observations establish excessive access. They do not establish that someone misused the data. The counts describe the review snapshot, not a permanent inventory.

## What farmers experience

The visible scan sequence stays the same: choose a photo, review it, run diagnosis, and read the result. There is no new registration screen, email request, password, or login button.

The app saves the scan and compressed photo in IndexedDB first. When online, the cloud code obtains a guest session and sends a protected copy. Diagnosis and local History do not wait for that session. If guest creation, session refresh, or upload fails, the local result remains available and cloud synchronization waits for a later attempt.

The first guest session needs an internet connection. Later visits reuse the saved session and refresh it when necessary. A new guest is not created for every scan or every reconnect.

A signed guest identity verifies cloud access; it does not identify the farmer as a real person.

**A guest session is tied to its saved browser data.** Clearing site data or losing that session can remove access to its cloud records, as well as any local data that was cleared. Another browser or phone receives a different guest identity. This design does not add cross-device recovery or permanent accounts.

## Ownership rules

The browser's public project key identifies the Supabase project. It is not a password for private records. The signed guest session supplies the verified user ID used by database and Storage policies. The public app must never contain a service-role or secret key.

| Resource                                           | Intended browser access                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.scans`                                     | A valid guest session may read, create, and delete only its own rows. Ownership is checked against `auth.uid()`, not a submitted `device_id`.                                   |
| `scans` Storage bucket                             | Private. Each guest may access only photo paths in its own owner directory. Upload replacement must satisfy the same ownership checks.                                          |
| `public.guidelines`                                | Public SELECT for published advice. Browser clients cannot create, edit, or delete treatment rows. Authorized project maintainers edit them through their administrative tools. |
| Older cloud rows/photos without verified ownership | Retained for administrator review and recovery. The browser cannot claim them merely by supplying the old device UUID.                                                          |

All old permissive scan/photo policies must be replaced. Adding a restrictive-looking owner policy alongside a public `USING (true)` policy would still leave access open because permissive policies combine with OR. Both table grants and RLS policies need review.

New photo paths use `<owner_id>/<cloud_id>.webp` or `<owner_id>/<cloud_id>.jpg`. The cloud row's `id` is that `cloud_id`; its `owner_id` and `storage_path` store the signed owner and exact object path, and its `image_url` is null. Storage policies check both the path and the object's recorded owner. Photo reads use an authenticated Storage download and save the returned Blob locally; the app must not restore a public URL to bypass a failed private download. Private photo bytes are not shared through a public service-worker runtime cache.

`device_id` remains a local browser label. It is not used as the server's ownership proof. No authorization decision uses editable user metadata.

## Treatment guidelines remain separate

Treatment guidelines are published advice, so their read access stays public and does not require a guest session. A guest sign-in failure must not prevent advice from downloading.

An online download checks guideline rows against IndexedDB after its ordering checks succeed. In `0.5.4`, an accepted snapshot with identical IDs, disease names, English advice, and Bisaya advice finishes successfully without rewriting the local set; row order does not affect equality. A different valid snapshot replaces the complete set atomically, including remote additions and deletions. Saved advice remains available offline. A missing row or blank language field still shows the translated unavailable message; uncertain diagnoses retain their dedicated photo reminder.

The `public.guidelines` table belongs to the `supabase_realtime` publication. While the app is open, online, and connected to its subscription, INSERT/UPDATE events carry the changed row's English and Bisaya values and update that saved row directly; DELETE events remove it. A successful full download contains all guideline rows. After its ordering and equality checks, it either keeps an identical local set or atomically replaces a different set, removing rows that no longer exist remotely. This reconciles missed deletion events. Failed or superseded downloads preserve saved advice.

### Guideline update ordering: October 7, 2026

The ordering and worker-cache safeguards were prepared in `0.5.3`, separately from the initial `0.5.2` implementation checks and earlier server-security verification. The [October 7 release-status confirmation](../versions/history/PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) records published `v0.5.0`–`v0.5.3` and reported live `v0.5.3`. The new [v0.5.4 prepared release](../versions/history/PWA_RELEASE_HISTORY.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and [validation record](../testing/TESTING.md#v054-release-validation-october-7-2026) cover the unchanged-HTTP-guidance checker. That check changes no remote row, policy, publication, or database schema.

`src/lib/guidelines-sync.ts` coordinates public HTTP reads and Realtime writes independently of private scan authentication. A change event received while an HTTP guidance download/save is unfinished marks that attempt as potentially outdated. The event's own row update or deletion still applies to IndexedDB; the old full response cannot undo it. After the active attempt finishes or fails, one shared follow-up GET retrieves the complete set while online. If that follow-up fails, the directly saved Realtime advice remains available and existing retry behavior provides another attempt. An ordinary event received with no active guidance attempt updates the local copy without an extra GET for that event.

The content checker runs inside the existing HTTP save transaction, after event-counter and starting-local-snapshot checks. It compares with the current saved set, not a stale copy captured before downloading. A response invalidated by an observed overlap or another tab is still rejected before this check. Identical guidance is a successful no-op, not a failed request; it does not schedule retries just because the content is unchanged. The comparison still follows every accepted full HTTP download, including a follow-up after overlap, and does not eliminate that download. Direct Realtime row writes remain unchanged.

This uses an event counter and ordered local writes, not a threshold in milliseconds. An HTTP attempt also records the local snapshot before fetching and compares it with IndexedDB inside its final transaction. A visible change from another tab rejects that older response without a schema migration. If an event arrives during the batch save, the final counter check aborts and rolls back that transaction instead of exposing a partially replaced set. Only an abort caused by invalidated work is handled as a superseded snapshot; unrelated database failures still surface for retry. Going offline or unmounting the synchronization hook invalidates old work; a transient WebSocket interruption alone is not treated as cancellation of every HTTP request. A newly ready subscription requests a full refresh to cover changes missed before listening started. Realtime does not guarantee replay of every event missed offline.

Guideline REST requests are network-only in the service worker. Activation removes old cached HTTP responses for that endpoint, while IndexedDB remains the offline guidance store. A network failure must not turn an old worker-cached HTTP response into a successful new snapshot. These client changes do not modify Supabase rows, policies, publication membership, or the treatment text itself. The [isolated update-ordering checks](../testing/TESTING.md#guideline-update-ordering-october-7-2026) verify the relevant client sequences; they do not claim a live production incident or establish server-wide event freshness.

## Older data and the transition

Existing scan rows, photos, local reports, and model-version labels must be preserved. The database change leaves older rows without a verified owner; the files remain in Storage but become private. There is no automatic remote ownership claim based on `device_id`, a photo hash, or a publicly visible old scan ID.

Dexie's version 8 upgrade preserves the local record IDs, photo Blobs, model labels, and historical URL values. Previously synchronized rows and old pending rows with an already-uploaded public image become local-only. They remain visible in History, but are not silently claimed or synchronized under the new guest identity. A pending row that was still purely local can continue uploading, with a separately saved fresh `cloud_id` to avoid colliding with an inaccessible legacy cloud row. New scans use the same new UUID for local `id` and `cloud_id`.

Local reports with an existing photo Blob remain readable offline. An old local-only row with no saved photo bytes shows “Photo not saved on this device” / “Walay litrato nga natipigan niini nga device” in its card and details, while retaining its diagnosis metadata. The app does not request its unowned legacy public URL as a fallback. Those URLs stop being a usable recovery path when the bucket becomes private. Recovery of an unowned remote record requires an administrator to verify ownership and make an explicit decision; it must not silently expose everyone's old files again. Deleting a local-only report removes that local copy, not an inaccessible old cloud archive.

**The server transition is applied; deploy the matching app next.** The live bucket is private and owner policies are active. The old deployed UUID-only client can no longer synchronize private scans. Its local scan workflow and public guideline reads remain available, but the updated app must be deployed before protected cloud synchronization works for those users. A local build does not update their installed PWA.

**Previously public photos may have cached copies.** The Storage dashboard warns: “Assets cached in the CDN may still be publicly accessible.” Changing a bucket to private must not be described as instantly revoking every CDN/browser copy already served publicly. Supabase documents the different [Storage CDN access and caching behavior](https://supabase.com/docs/guides/storage/cdn/fundamentals); already downloaded copies cannot be recalled by an RLS change. Original cloud data remains preserved. No remote photo purge or deletion has been performed for this transition.

## Backup before changing cloud settings

Store a private local backup under ignored `.tools/supabase-backups/<snapshot>/`. A backup needs:

1. The scan and guideline records, with original IDs and values.
2. Table definitions, columns, indexes, grants, RLS policies, and relevant publication membership.
3. Storage bucket settings and object inventory.
4. The actual photo bytes, with file sizes and hashes. Photo URLs or Storage metadata alone are not a photo backup.
5. The corresponding application source snapshot and an inventory of which configuration values require dashboard actions.

Compare inventories and hashes before proceeding. Preserve the original backup rather than editing it into the new schema. Private data, service keys, signed URLs, access tokens, and refresh tokens do not belong in commits or public reports. No duplicate cloud tables or second cloud bucket are required merely to hold a backup.

## Configuration checklist

These are maintainer tasks, not extra instructions for farmers:

1. In Authentication, **Sign In / Providers**, enable **Allow anonymous sign-ins** and save. This setting was reported as enabled on October 2, 2026.
2. Review Auth signup limits and abuse protection. Supabase recommends invisible CAPTCHA or Turnstile for anonymous signup abuse prevention. Enabling a CAPTCHA requirement also requires compatible client integration; do not add a visible farmer challenge without revisiting the agreed user flow.
3. After backup verification, set the `scans` bucket to **Private** using the Storage dashboard or the supported Storage `updateBucket()` API. Do not update `storage.buckets` or other Storage metadata directly with SQL. Then apply the reviewed [secure cloud SQL](../../supabase/sql/secure-cloud-sync.sql) for the scan ownership schema, least-privilege grants, and owner policies.
4. Keep guideline SELECT access public, browser writes denied, and Realtime publication membership enabled.
5. Build and validate the matching app before deployment. The same public project URL and browser-safe key remain sufficient; no service-role key belongs in `.env.local` with a `NEXT_PUBLIC_` prefix.
6. Record the actual migration, backup, and verification receipt. Check the new deployed client before declaring cloud synchronization restored.

## Verification and evidence limits

Client workflow checks use an isolated local mock backend and fresh browser contexts. They cover background guest reuse, delayed cloud synchronization, local offline persistence, failed sign-in recovery, public guidance during an Auth failure, and private photo caching. S03/S04 cover deletion during an upload and retaining the local deletion marker until failed photo cleanup succeeds. S05 checks the version 7-to-8 legacy-history upgrade and the missing-local-photo message without claiming the old cloud files. These cases cannot prove that the real Supabase RLS policies are correct.

Database verification must separately check grants and policies under unsigned `anon` and two distinct signed guest identities. Verify that the first identity cannot read, overwrite, or delete the second identity's row/photo, cannot submit another owner ID, and cannot claim an unowned legacy row. Check ordinary owner operations and public guideline reads as well. The [catalog verification SQL](../../supabase/sql/verify-cloud-security.sql) checks the configured rules, and the [temporary policy fixtures](../../supabase/sql/test-cloud-policy-fixtures.sql) copy those live rules and effective grants into temporary tables, simulate two owners and an unsigned caller, and end with ROLLBACK. These fixtures do not insert application rows, Auth users, or Storage metadata. Do not send automated app scans to production Supabase.

Read-only role queries, policy inspection, a passing static build, and a passing mock suite each provide different evidence. None alone establishes end-to-end live guest signup/upload/download behavior, low-end-device performance, or model accuracy. Authorization does not improve or change classifier predictions.

## Recovery and rollback

Use the private backup and recorded migration receipt to compare the exact previous configuration before restoring anything. Keep the scan and photo data intact while diagnosing a failed deployment.

Prefer fixing the matching client or temporarily letting uploads remain pending while keeping the cloud protections active. The [safe rollback SQL](../../supabase/sql/rollback-cloud-security.sql) pauses cloud writes and deletes while retaining owner-only reads, the private bucket, all rows/files, and the new columns. Reapply the reviewed forward SQL when the issue is resolved. Restoring an older app build does not require reopening public read/delete policies.

Restoring the exact old public access configuration from the private inventory would reintroduce the reviewed exposure. That is outside the supplied safe rollback and would require an explicit maintainer decision with that consequence understood. The bucket's access model is a separate supported Storage API/dashboard setting, not a SQL metadata write.

Do not drop new ownership fields or erase newer records/photos merely to match an older client. If a schema restore is needed, inventory data written since the snapshot first, preserve it, and restore data and settings as separate controlled actions. Disabling anonymous sign-ins does not itself undo the schema or safely migrate guest-owned records back to the former device-ID design.

## Implementation status

### Verified private backup

The October 2, 2026 snapshot is stored locally under ignored `.tools/supabase-backups/20261002-owner-security/`. It preserves 65 scan rows, six guideline rows, the schema/policy/bucket inventory, and all 68 photo files. The verified photo total is 32,928,506 bytes. `backup-receipt.json` records file hashes; `before.json` has SHA-256 `14e3f551a9aee42063e36b955254a50246e1e10420626046d9d0abd5aa8639af`. These private files are not committed or deployed.

### Verified local candidate

The final application input fingerprint is `a316d8017d732e678704809b74289e3100beb4896611e8760f883ec78a923f71`, recorded by the isolated test build. The following checks passed for that source:

- TypeScript, ESLint, the production static build, formatting, and Git diff checks.
- All 14 tooling tests with 41 assertions, including the four guest-session tests.
- All 80 core browser cases with zero failures in 7.4 minutes across Chromium desktop/mobile, Firefox desktop, and the scoped WebKit mobile cases. This full run preceded a test-only S05 fixture correction: seeding Dexie's version 7 as native IndexedDB version 70 and adding class/confidence/model-label assertions. The tightened S05 then passed all three focused Chromium desktop/mobile and Firefox cases in 8.1 seconds. The application fingerprint stayed unchanged; no second full 80-case run is claimed.
- All 10 exported-asset checks and the credential/history security scan.
- Preservation checks for 342 protected files, including all 43 notebooks, model assets, Git hooks, and GitHub workflows. The build regenerated the service worker normally; protected historical/model files were not changed.
- All 418 local Markdown links/anchors across 35 documents during the local candidate evidence pass. The later live-migration documentation update passed with 419 links/anchors across the same 35 documents.

Before the live transition, the proposed owner policies also passed 30 assertions on actual Postgres using temporary tables and simulated caller identities, followed by ROLLBACK. That preliminary proof evaluated the proposed rules; the separate post-migration checks below cover the applied configuration.

<a id="pending-live-transition-and-deployment"></a>

### Verified live configuration

Anonymous sign-ins were reported as enabled before the `scans` bucket was saved as private. The live check confirmed `public = false`. The reviewed forward SQL was applied through Supabase MCP as migration `secure_guest_owned_cloud_sync`, history version `20261002152830`, at 15:28:30 UTC / 23:28:30 Manila on October 2, 2026, with a successful result. Only the script's outer BEGIN/COMMIT were omitted because the migration tool supplies its transaction; the remaining SQL was unchanged. The full tracked script has SHA-256 `c6f9ff3622b0769f76bdd5ead5cfce9b7cac81c08ffacb06c95840c54d5d97af`.

Post-migration verification passed:

- The private bucket, RLS, least-privilege grants, ownership index, and expected policy counts: three scan policies, one guideline policy, and four Storage policies.
- Thirty assertions on temporary tables copying the applied live policy expressions and grants, with simulated owners/unsigned caller, followed by ROLLBACK. No production test users, scan records, or Storage files were created.
- The security advisor returned zero findings, alongside the direct grant/policy checks.
- Original fields in every backed-up row/object were compared against the live data: all 65 scan rows, six guideline rows, and 68 Storage object entries were unchanged, with zero missing and zero changed entries. New ownership columns remain nullable, and no legacy owner was assigned.
- Read-only HTTP checks: an unsigned scans GET returned 401; public guidelines returned 200 with all six rows; a cache-busted GET to an old public photo URL returned 400. The private `public-api-check.json` receipt records those statuses. The cache-busted result does not prove every old CDN/browser copy has been purged; no remote purge was performed.

Private `migration-receipt.json` and `preservation-receipt.json` record the applied migration and preservation comparison under the same ignored backup directory. The original `before.json`, photo backup, and `backup-receipt.json` remain intact. These receipts are local evidence, not committed database credentials or a production app release.

### Pending updated-client deployment

**Later status, October 7, 2026:** The [release-status confirmation](../versions/history/PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) records that `v0.5.0`–`v0.5.3` were published and used, with `v0.5.3` currently live. The heading and paragraphs below preserve the October 2–3 pending deployment record. The new `v0.5.4` prepared content-check release is separate. The confirmation does not retroactively establish production cloud-operation test results or historical deployment dates.

The October 2 local verification prepared and validated the updated cloud client; it did not establish production deployment. The applied server access rules do not update the app already installed on a farmer's device. Coordinated deployment remains pending in this record. Production guest signup and end-to-end production scan/upload/download behavior were not exercised by the isolated local suite or temporary SQL fixtures.

The October 2 verification used app `0.4.9`. On October 3, the matching client is prepared as app candidate `0.5.0`, retaining the adopted V4.3.0 Combined model, files, preprocessing, and rejection gates. See the [candidate validation](../testing/TESTING.md#v050-candidate-validation-october-3-2026) and [release status](../versions/history/PWA_RELEASE_HISTORY.md#v050-private-cloud-synchronization-candidate-october-3-2026). Historical results remain attached to their original source snapshots; preparing the new label does not establish production guest sign-in or deployment.

## Official references

- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous): guest sessions, ownership, session loss, and abuse prevention.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants, signed identity, and ownership predicates.
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control): private-object policies and the SELECT/INSERT/UPDATE requirements for upload replacement.
- [Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals): public downloads and authenticated private downloads.
- [Postgres change subscriptions](https://supabase.com/docs/guides/realtime/postgres-changes): published table events and client subscriptions.
