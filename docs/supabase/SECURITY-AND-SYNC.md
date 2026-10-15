# Supabase guidelines, preserved cloud data, and recovery

## Local-only History candidate (October 15, 2026)

The current source uses Supabase only for public guideline SELECT and Realtime notifications. The app creates no guest session and sends no scan, photo upload/download, or cloud deletion requests. Reports and compressed photo Blobs remain local in IndexedDB. Existing server tables, private Storage photos, Auth users, policies, and anonymous-sign-in settings were not changed or deleted.

The historical security implementation below remains evidence for earlier cloud clients and the retained cloud archive. Its configuration checklist is not a prerequisite for the local-only candidate. New project setup needs only the guideline table, least-privilege public read access, Realtime publication, and browser-safe project settings from [SETUP.md](../../SETUP.md#configure-supabase).

### Preservation and rollback boundary

Dexie v9 drops unused scan indexes without rewriting reports. Existing IDs, Blobs, hashes, model labels, status values, and historical owner/cloud/path/device references remain. Old `pending-delete` records remain hidden and do not run remote cleanup. A new local deletion removes only the selected local report/photo; it does not delete a preserved remote archive.

An older v8-only application cannot simply reopen a database upgraded to v9. A rollback must retain a v9-compatible schema and the preserved fields while deliberately restoring its old behavior; do not downgrade, clear, or recreate IndexedDB. Re-enabling cloud code would also need renewed guest ownership/security review, because old retained status values are no longer an active queue. Preserve the reviewed source baseline and backup before rollback.

No automatic recovery exists after local site data is cleared, evicted, or lost with the device. Retained historical server data is not automatically assigned to a newly generated UUID. Any administrator-assisted recovery or cleanup requires a separate authorized preservation plan. Disabling anonymous sign-ins alone would neither remove old Auth users nor delete their scan/photo data; no such dashboard action was performed here.

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

The ordering and worker-cache safeguards were prepared in `0.5.3`, separately from the initial `0.5.2` implementation checks and earlier server-security verification. The [October 7 release-status confirmation](../versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026) records published `v0.5.0`–`v0.5.3` and reported live `v0.5.3`. The new [v0.5.4 prepared release](../versions/PWA_VERSIONING.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and [validation record](../testing/TESTING.md#v054-release-validation-october-7-2026) cover the unchanged-HTTP-guidance checker. That check changes no remote row, policy, publication, or database schema.

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

**Later status, October 7, 2026:** The [release-status confirmation](../versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026) records that `v0.5.0`–`v0.5.3` were published and used, with `v0.5.3` currently live. The heading and paragraphs below preserve the October 2–3 pending deployment record. The new `v0.5.4` prepared content-check release is separate. The confirmation does not retroactively establish production cloud-operation test results or historical deployment dates.

The October 2 local verification prepared and validated the updated cloud client; it did not establish production deployment. The applied server access rules do not update the app already installed on a farmer's device. Coordinated deployment remains pending in this record. Production guest signup and end-to-end production scan/upload/download behavior were not exercised by the isolated local suite or temporary SQL fixtures.

The October 2 verification used app `0.4.9`. On October 3, the matching client is prepared as app candidate `0.5.0`, retaining the adopted V4.3.0 Combined model, files, preprocessing, and rejection gates. See the [candidate validation](../testing/TESTING.md#v050-candidate-validation-october-3-2026) and [release status](../versions/PWA_VERSIONING.md#v050-private-cloud-synchronization-candidate-october-3-2026). Historical results remain attached to their original source snapshots; preparing the new label does not establish production guest sign-in or deployment.

## Official references

- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous): guest sessions, ownership, session loss, and abuse prevention.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants, signed identity, and ownership predicates.
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control): private-object policies and the SELECT/INSERT/UPDATE requirements for upload replacement.
- [Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals): public downloads and authenticated private downloads.
- [Postgres change subscriptions](https://supabase.com/docs/guides/realtime/postgres-changes): published table events and client subscriptions.
