# Cloud security SQL explained in plain English

**Current source candidate, October 15, 2026:** the app now stores reports/photos only in IndexedDB and uses Supabase for public guidelines. These SQL files remain historical security and preservation tools for retained cloud resources; they are not setup requirements for the local-only candidate. No SQL, server resource, or Auth setting was changed by that candidate. See the [transition and rollback boundary](../../docs/supabase/SECURITY-AND-SYNC.md#local-only-history-candidate-october-15-2026).

This folder keeps the database instructions used to protect MangoLeaf AI's cloud scan records and photos, plus scripts for checking those protections and pausing cloud writes during a problem.

Think of these files as saved instructions for a maintainer. The live Supabase project stores and enforces the security rules; these files explain how those rules were applied and can be checked later.

## Does the application run these files?

No. Opening the app, taking a photo, running `bun run dev`, or building the app does not execute these SQL files. Farmers do not need to open them or follow extra steps.

The earlier cloud client sent scan/photo requests to Supabase; the current candidate requests public guidelines only. Supabase checks those requests against its already-installed access rules. Local diagnosis and History use IndexedDB and do not depend on running maintenance SQL.

This folder does not contain the actual database, uploaded photos, or a data backup. Private backups belong under ignored `.tools/supabase-backups/`, outside the public app and tracked documentation.

## What does each file do?

| File                                                             | Plain-English purpose                                                                                                                                                                                       | Does running it make lasting cloud changes?                                                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [secure-cloud-sync.sql](secure-cloud-sync.sql)                   | Install the rules that let each signed guest access only their own cloud scans and photos. Keep published treatment guidelines readable by everyone, while preventing ordinary app users from editing them. | **Yes.** It changes the scan table layout, access permissions, and security rules. It preserves existing rows and photos.                                                                          |
| [verify-cloud-security.sql](verify-cloud-security.sql)           | Inspect the installed settings: is the photo bucket private, are the expected rules present, and are access permissions restricted? Report an error when a required check fails.                            | **No.** It reads settings and counts inside a read-only transaction.                                                                                                                               |
| [test-cloud-policy-fixtures.sql](test-cloud-policy-fixtures.sql) | Copy the installed rules into temporary test tables. Pretend to be two different visitors and a caller without a signed session, then check which actions are allowed or blocked.                           | **No lasting changes.** It creates temporary test data and finishes with `ROLLBACK`, which cancels the test transaction. It does not create real Auth users, application scans, or Storage photos. |
| [rollback-cloud-security.sql](rollback-cloud-security.sql)       | Pause browser cloud uploads and deletions while a maintainer investigates a problem. Keep private owner reads and the existing cloud data.                                                                  | **Yes.** It changes permissions and removes the write/delete policies. It does not restore the old public access rules.                                                                            |

## What protection does the first script add?

The old setup trusted a browser's `device_id`, which a caller could change. The new rules compare each request's verified guest identity with the saved record's `owner_id`.

For example, Visitor A can access Visitor A's new cloud scans and photos. Visitor A cannot access Visitor B's scans by changing the device ID in a request. A caller without a signed session cannot read private scans, but can still download the public treatment guidelines.

The script also adds fields for the owner, photo location, and model version. It does not guess who owns older records or automatically assign them to a new guest. See [legacy data and the rollout status](../../docs/supabase/SECURITY-AND-SYNC.md#implementation-status) for the preserved records and verification limits.

## Are these migrations?

A **migration** is a planned change to a database's structure or rules.

`secure-cloud-sync.sql` is the forward security change. It was applied to the existing project on October 2, 2026 through Supabase MCP as migration `secure_guest_owned_cloud_sync`, recorded with history version `20261002152830`.

The two verification files are checks, not setup migrations. The rollback file is an optional maintenance action that pauses writes; it is not a complete restoration of the previous database setup.

These are reviewed maintenance scripts under `supabase/sql/`, not a Supabase CLI-generated `supabase/migrations/` directory. They are also not a complete setup for an empty project: the forward script expects the existing `scans` and `guidelines` tables and the `scans` bucket.

## When would a maintainer use them?

- **To understand the existing setup:** read this guide and the [full security and recovery guide](../../docs/supabase/SECURITY-AND-SYNC.md). There is no need to rerun a migration just because these files exist.
- **To apply a reviewed security change:** first verify the backup and prerequisites, then use the forward script through an authorized database connection or migration tool. The `scans` bucket must already be private.
- **To check the installed protections:** use the catalog verification and temporary policy tests after the forward change has committed. The temporary tests check database permissions; they do not prove real guest sign-in or photo upload/download works from a browser.
- **To pause cloud writes during recovery:** use the rollback script only when that pause is intended. After resolving the problem, review the backup and prerequisites before reapplying the forward script and checking it again.

Do not run all four files as one setup sequence. The rollback would pause the cloud writes that the forward script enabled. Each file's opening comments explain its prerequisites, and database maintenance requires an appropriately privileged connection.

## Which settings are separate from these scripts?

**Allow anonymous sign-ins** is an Auth setting. These SQL files do not enable it. The earlier cloud client needed that setting enabled to create its background guest session; the current local-only candidate does not use guest sign-in.

**Private bucket** is a Storage setting. Set it through the Supabase dashboard or supported Storage API. The forward SQL checks that it is already private; it does not switch the bucket to private or directly modify Storage metadata.

A failure in guest sign-in can leave cloud uploads waiting even when the database rules are correct. The SQL checks alone do not establish that all parts of synchronization work.

## Where to read more

- [Security rules, backups, evidence, and recovery](../../docs/supabase/SECURITY-AND-SYNC.md)
- [Project setup](../../SETUP.md#configure-supabase)
