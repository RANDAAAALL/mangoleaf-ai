package com.mangoleaf.ai;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs only against a fresh instrumented app sandbox, never production/cloud storage. */
@RunWith(AndroidJUnit4.class)
public final class NativeStoreTest {
    private Context context;
    private NativeStore store;

    @Before public void create() {
        context = ApplicationProvider.getApplicationContext();
        context.deleteDatabase("mangoleaf-native-test.db");
        store = new NativeStore(context, "mangoleaf-native-test.db");
    }

    @After public void close() {
        store.close();
        context.deleteDatabase("mangoleaf-native-test.db");
        java.io.File[] photos = new java.io.File(context.getFilesDir(), "instrumentation-photos").listFiles();
        if (photos != null) for (java.io.File photo : photos) photo.delete();
    }

    private JSONObject record(String id, String status) throws Exception {
        return new JSONObject().put("id", id).put("disease_name", "Healthy Leaf")
            .put("confidence", 0.923456789).put("updated_at", "2026-10-20T00:00:00.000Z")
            .put("_status", status).put("image_url", JSONObject.NULL)
            .put("image_hash", "same-hash").put("model_version", "v4.5.0");
    }

    private JSONObject save(JSONObject record) throws Exception {
        return (JSONObject) store.dispatch("storage.report.save", new JSONObject().put("record", record));
    }

    @Test public void reportSaveIsIdempotentAndConflictsDoNotOverwrite() throws Exception {
        JSONObject record = record("one", "local-only").put("owner_id", "legacy-owner");
        save(record);
        save(record);
        assertEquals(1, ((JSONArray) store.dispatch("storage.report.list", new JSONObject())).length());
        assertThrows(IllegalStateException.class, () -> save(record("one", "local-only").put("confidence", 0.5)));
        JSONObject stored = (JSONObject) store.dispatch("storage.report.get", new JSONObject().put("id", "one"));
        assertEquals(0.923456789, stored.getDouble("confidence"), 0);
        assertEquals("legacy-owner", stored.getString("owner_id"));
    }

    @Test public void duplicateLookupRequiresSameModelAndHidesTombstones() throws Exception {
        save(record("one", "local-only"));
        save(record("hidden", "pending-delete"));
        assertEquals(1, ((JSONArray) store.dispatch("storage.report.list", new JSONObject())).length());
        Object old = store.dispatch("storage.report.findByHash", new JSONObject().put("hash", "same-hash").put("modelVersion", "v5.0.0"));
        assertEquals(JSONObject.NULL, old);
        JSONObject same = (JSONObject) store.dispatch("storage.report.findByHash", new JSONObject().put("hash", "same-hash").put("modelVersion", "v4.5.0"));
        assertEquals("one", same.getString("id"));
        assertEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", "hidden")));
    }

    @Test public void importNeverResurrectsAnExistingTombstone() throws Exception {
        save(record("hidden", "pending-delete"));
        store.dispatch("storage.import", new JSONObject().put("records", new JSONArray()
            .put(new JSONObject().put("record", record("hidden", "local-only")))));
        assertEquals(0, ((JSONArray) store.dispatch("storage.report.list", new JSONObject())).length());
        JSONObject exported = (JSONObject) store.dispatch("storage.export", new JSONObject());
        assertEquals("pending-delete", exported.getJSONArray("records").getJSONObject(0).getString("_status"));
    }

    @Test public void failedImportRollsBackEarlierRows() throws Exception {
        save(record("conflict", "local-only"));
        JSONArray records = new JSONArray().put(new JSONObject().put("record", record("new", "local-only")))
            .put(new JSONObject().put("record", record("conflict", "local-only").put("confidence", 0.5)));
        assertThrows(IllegalStateException.class, () -> store.dispatch("storage.import", new JSONObject().put("records", records)));
        assertEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", "new")));
    }

    @Test public void recoveryCannotResurrectLocallyDeletedReport() throws Exception {
        JSONObject record = record("deleted", "local-only");
        save(record);
        store.dispatch("storage.report.delete", new JSONObject().put("ids", new JSONArray().put("deleted")));
        store.dispatch("storage.import", new JSONObject().put("records", new JSONArray().put(new JSONObject().put("record", record))));
        assertEquals(0, ((JSONArray) store.dispatch("storage.report.list", new JSONObject())).length());
        assertThrows(IllegalStateException.class, () -> save(record));
        JSONObject exported = (JSONObject) store.dispatch("storage.export", new JSONObject());
        assertEquals("deleted", exported.getJSONArray("deletedIds").getString(0));
    }

    @Test public void cloudDeletionSurvivesReopenAndStaysInItsVault() throws Exception {
        String id = "33333333-3333-4333-8333-333333333333";
        String scope = "ajwlojaclehxupntnsve:11111111-1111-4111-8111-111111111111";
        save(record(id, "local-only"));
        store.dispatch("storage.report.deleteSynced", new JSONObject().put("ids", new JSONArray().put(id)).put("scope", scope));
        store.close();
        store = new NativeStore(context, "mangoleaf-native-test.db");
        assertEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", id)));
        assertEquals(1, ((JSONArray) store.dispatch("storage.cloudDelete.list", new JSONObject().put("scope", scope))).length());
        String other = "ajwlojaclehxupntnsve:22222222-2222-4222-8222-222222222222";
        assertEquals(0, ((JSONArray) store.dispatch("storage.cloudDelete.list", new JSONObject().put("scope", other))).length());
        store.dispatch("storage.cloudDelete.ack", new JSONObject().put("scope", other).put("record_id", id));
        assertEquals(1, ((JSONArray) store.dispatch("storage.cloudDelete.list", new JSONObject().put("scope", scope))).length());
        store.dispatch("storage.cloudDelete.ack", new JSONObject().put("scope", scope).put("record_id", id));
        assertEquals(0, ((JSONArray) store.dispatch("storage.cloudDelete.list", new JSONObject().put("scope", scope))).length());
        // Cloud acknowledgment must never remove the permanent local anti-resurrection record.
        assertThrows(IllegalStateException.class, () -> save(record(id, "local-only")));
    }

    @Test public void failedCloudQueueWriteCannotDeleteLocalReport() throws Exception {
        String id = "33333333-3333-4333-8333-333333333333";
        save(record(id, "local-only"));
        // Fail only the isolated test database's outbox insert, inside the deletion transaction.
        store.getWritableDatabase().execSQL("CREATE TEMP TRIGGER reject_test_queue BEFORE INSERT ON settings BEGIN SELECT RAISE(ABORT, 'TEST_QUEUE_WRITE'); END");
        assertThrows(android.database.sqlite.SQLiteException.class, () -> store.dispatch("storage.report.deleteSynced", new JSONObject()
            .put("ids", new JSONArray().put(id)).put("scope", "ajwlojaclehxupntnsve:11111111-1111-4111-8111-111111111111")));
        assertNotEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", id)));
        assertEquals(0, ((JSONObject) store.dispatch("storage.export", new JSONObject())).getJSONArray("deletedIds").length());
    }

    @Test public void importedDeletionIntentDoesNotEraseVisibleRecords() throws Exception {
        save(record("visible", "local-only"));
        store.dispatch("storage.import", new JSONObject().put("records", new JSONArray())
            .put("deletedIds", new JSONArray().put("visible").put("absent")));
        assertNotEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", "visible")));
        store.dispatch("storage.import", new JSONObject().put("records", new JSONArray()
            .put(new JSONObject().put("record", record("absent", "local-only")))));
        assertEquals(JSONObject.NULL, store.dispatch("storage.report.get", new JSONObject().put("id", "absent")));
    }

    @Test public void localArchiveIncludesPhotosAndLegacyMetadataWithoutRemoteRequests() throws Exception {
        android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(2, 2, android.graphics.Bitmap.Config.ARGB_8888);
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        assertTrue(bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, bytes));
        bitmap.recycle();
        JSONObject image = new JSONObject().put("base64", android.util.Base64.encodeToString(bytes.toByteArray(), android.util.Base64.NO_WRAP))
            .put("mimeType", "image/png");
        store.dispatch("storage.report.save", new JSONObject().put("record", record("photo", "local-only").put("owner_id", "old-owner")).put("image", image));
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        store.writeArchive(output);
        JSONObject archive = new JSONObject(output.toString("UTF-8"));
        assertEquals("mangoleaf-local-reports", archive.getString("format"));
        JSONObject saved = archive.getJSONArray("records").getJSONObject(0);
        assertEquals("old-owner", saved.getJSONObject("record").getString("owner_id"));
        assertFalse(saved.getJSONObject("record").has("photoUri"));
        assertArrayEquals(bytes.toByteArray(), android.util.Base64.decode(saved.getJSONObject("image").getString("base64"), android.util.Base64.DEFAULT));
    }

    @Test public void guidelineCompareAndReplacePreservesNewerChanges() throws Exception {
        JSONObject row = new JSONObject().put("id", "one").put("disease_name", "Disease")
            .put("guidelines_en", "English").put("guidelines_bis", "Bisaya");
        assertEquals(true, store.dispatch("storage.guidelines.replace", new JSONObject().put("rows", new JSONArray().put(row)).put("expected", new JSONArray())));
        assertEquals(false, store.dispatch("storage.guidelines.replace", new JSONObject().put("rows", new JSONArray()).put("expected", new JSONArray())));
        assertEquals(1, ((JSONArray) store.dispatch("storage.guidelines.get", new JSONObject())).length());
    }

    @Test public void accountSessionIsEncryptedAtRestAndCanBeRemoved() throws Exception {
        store.dispatch("storage.settings.set", new JSONObject().put("key", "supabase-backup-session").put("value", "test-session-not-a-real-token"));
        assertEquals("test-session-not-a-real-token", store.dispatch("storage.settings.get", new JSONObject().put("key", "supabase-backup-session")));
        try (android.database.Cursor cursor = store.getReadableDatabase().rawQuery("SELECT value FROM settings WHERE id=?", new String[]{"supabase-backup-session"})) {
            assertTrue(cursor.moveToFirst());
            assertFalse(cursor.getString(0).contains("test-session-not-a-real-token"));
        }
        store.dispatch("storage.settings.set", new JSONObject().put("key", "supabase-backup-session").put("value", JSONObject.NULL));
        assertEquals(JSONObject.NULL, store.dispatch("storage.settings.get", new JSONObject().put("key", "supabase-backup-session")));
    }

    @Test public void photoDiskExhaustionUsesTheSameQuotaRecoveryCodeAsSQLite() {
        java.io.IOException failure = new java.io.IOException(new android.system.ErrnoException("write", android.system.OsConstants.ENOSPC));
        assertEquals("QUOTA_EXCEEDED", NativeStore.safeError(failure));
        assertEquals("QUOTA_EXCEEDED", NativeStore.safeError(new android.database.sqlite.SQLiteFullException()));
    }
}
