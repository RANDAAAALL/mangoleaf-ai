package com.mangoleaf.ai;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteFullException;
import android.graphics.BitmapFactory;
import android.util.Base64;
import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** SQLite/photos live outside OTA bundles; this layer performs no cloud requests. */
final class NativeStore extends SQLiteOpenHelper {
    static final String PHOTO_PATH = "/_native/photos/";
    private final Context context;
    private final File photos;

    NativeStore(Context context) {
        this(context, "mangoleaf-native.db");
    }

    NativeStore(Context context, String databaseName) {
        super(context, databaseName, null, 1);
        this.context = context.getApplicationContext();
        photos = new File(context.getFilesDir(), "mangoleaf-native.db".equals(databaseName) ? "photos" : "instrumentation-photos");
        if (!photos.isDirectory() && !photos.mkdirs()) throw new IllegalStateException("STORAGE_UNAVAILABLE");
        setWriteAheadLoggingEnabled(true);
    }

    @Override public void onConfigure(SQLiteDatabase database) {
        database.setForeignKeyConstraintsEnabled(true);
    }

    @Override public void onCreate(SQLiteDatabase database) {
        database.execSQL("CREATE TABLE reports (id TEXT PRIMARY KEY NOT NULL, record TEXT NOT NULL, photo_name TEXT, photo_mime TEXT, photo_sha256 TEXT, image_hash TEXT, model_version TEXT, status TEXT, updated_at TEXT NOT NULL)");
        database.execSQL("CREATE INDEX report_image_model ON reports(image_hash, model_version)");
        database.execSQL("CREATE INDEX report_updated ON reports(updated_at)");
        database.execSQL("CREATE UNIQUE INDEX report_photo ON reports(photo_name)");
        database.execSQL("CREATE TABLE guidelines (id TEXT PRIMARY KEY NOT NULL, record TEXT NOT NULL)");
        database.execSQL("CREATE TABLE settings (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)");
        database.execSQL("CREATE TABLE deleted_reports (id TEXT PRIMARY KEY NOT NULL)");
    }

    @Override public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        // Future migrations must preserve records and stay compatible with bundle rollback.
        throw new IllegalStateException("UNSUPPORTED_SCHEMA");
    }

    synchronized Object dispatch(String method, JSONObject payload) throws Exception {
        return switch (method) {
            case "storage.report.list" -> listReports(false);
            case "storage.report.get" -> getReport(payload.getString("id"));
            case "storage.report.findByHash" -> findByHash(payload.getString("hash"), payload.getString("modelVersion"));
            case "storage.report.save" -> save(payload.getJSONObject("record"), payload.optJSONObject("image"));
            case "storage.report.delete" -> delete(payload.getJSONArray("ids"), null);
            case "storage.report.deleteSynced" -> delete(payload.getJSONArray("ids"), cloudScope(payload.getString("scope")));
            case "storage.cloudDelete.list" -> listCloudDeletes(cloudScope(payload.getString("scope")));
            case "storage.cloudDelete.ack" -> acknowledgeCloudDelete(payload);
            case "storage.guidelines.get" -> readGuidelines(getReadableDatabase());
            case "storage.guidelines.replace" -> replaceGuidelines(payload.getJSONArray("rows"), payload.getJSONArray("expected"));
            case "storage.guidelines.change" -> changeGuideline(payload);
            case "storage.settings.get" -> getSetting(payload.getString("key"));
            case "storage.settings.set" -> setSetting(payload.getString("key"), payload.get("value"));
            case "storage.import" -> importRecords(payload);
            case "storage.export" -> exportRecords();
            default -> throw new IllegalArgumentException("METHOD_NOT_ALLOWED");
        };
    }

    synchronized void seedGuidelines() throws IOException, JSONException {
        SQLiteDatabase database = getWritableDatabase();
        try (Cursor cursor = database.rawQuery("SELECT 1 FROM guidelines LIMIT 1", null)) {
            if (cursor.moveToFirst()) return;
        }
        try (InputStream stream = context.getAssets().open("web/starter-guidelines.json")) {
            ByteArrayOutputStream collected = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = stream.read(buffer)) != -1) {
                if (collected.size() + read > 2 * 1024 * 1024) throw new IOException("INVALID_STARTER_GUIDELINES");
                collected.write(buffer, 0, read);
            }
            byte[] bytes = collected.toByteArray();
            JSONArray rows = StorageRules.guidelines(new JSONArray(new String(bytes, StandardCharsets.UTF_8)));
            database.beginTransaction();
            try {
                putGuidelines(database, rows);
                database.setTransactionSuccessful();
            } finally { database.endTransaction(); }
        }
    }

    private JSONArray listReports(boolean includeHidden) throws JSONException {
        JSONArray result = new JSONArray();
        String where = includeHidden ? "" : " WHERE status IS NULL OR status != 'pending-delete'";
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT record,photo_name FROM reports" + where + " ORDER BY updated_at DESC,id", null)) {
            while (cursor.moveToNext()) result.put(withPhoto(cursor.getString(0), cursor.getString(1)));
        }
        return result;
    }

    private Object getReport(String id) throws JSONException {
        StorageRules.identifier(id);
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT record,photo_name FROM reports WHERE id=? AND (status IS NULL OR status != 'pending-delete')", new String[]{id})) {
            return cursor.moveToFirst() ? withPhoto(cursor.getString(0), cursor.getString(1)) : JSONObject.NULL;
        }
    }

    private Object findByHash(String hash, String model) throws JSONException {
        StorageRules.identifier(hash);
        StorageRules.identifier(model);
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT record,photo_name FROM reports WHERE image_hash=? AND model_version=? AND (status IS NULL OR status != 'pending-delete') ORDER BY updated_at DESC LIMIT 1", new String[]{hash, model})) {
            return cursor.moveToFirst() ? withPhoto(cursor.getString(0), cursor.getString(1)) : JSONObject.NULL;
        }
    }

    private JSONObject withPhoto(String json, String photoName) throws JSONException {
        JSONObject record = new JSONObject(json);
        record.put("photoUri", photoName == null ? JSONObject.NULL : MainActivity.APP_ORIGIN + PHOTO_PATH + photoName);
        return record;
    }

    private record Prepared(JSONObject metadata, byte[] bytes, String mime, String hash) {}

    private Prepared prepare(JSONObject input, JSONObject image) throws Exception {
        JSONObject record = StorageRules.report(input);
        if (image == null || image.isNull("base64") || image.optString("base64").isEmpty()) {
            // Legacy records without a local photo remain metadata-only. No cloud fallback.
            return new Prepared(record, null, null, null);
        }
        String encoded = image.getString("base64");
        if (encoded.length() > (StorageRules.MAX_PHOTO_BYTES * 4L / 3L) + 8) throw new IllegalArgumentException("PHOTO_TOO_LARGE");
        String mime = image.getString("mimeType");
        if (!Set.of("image/jpeg", "image/png", "image/webp", "image/gif").contains(mime)) throw new IllegalArgumentException("INVALID_PHOTO");
        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
        if (bytes.length == 0 || bytes.length > StorageRules.MAX_PHOTO_BYTES) throw new IllegalArgumentException("PHOTO_TOO_LARGE");
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
        if (options.outWidth <= 0 || options.outHeight <= 0 || !mime.equals(options.outMimeType)) throw new IllegalArgumentException("INVALID_PHOTO");
        return new Prepared(record, bytes, mime, sha256(bytes));
    }

    private Object save(JSONObject input, JSONObject image) throws Exception {
        Prepared prepared = prepare(input, image);
        SQLiteDatabase database = getWritableDatabase();
        List<File> created = new ArrayList<>();
        database.beginTransaction();
        try {
            JSONObject saved = insertReport(database, prepared, false, created);
            database.setTransactionSuccessful();
            return saved;
        } catch (Exception error) {
            for (File file : created) file.delete();
            throw error;
        } finally { database.endTransaction(); }
    }

    private JSONObject insertReport(SQLiteDatabase database, Prepared prepared, boolean importing, List<File> created) throws Exception {
        String id = prepared.metadata().getString("id");
        try (Cursor deleted = database.rawQuery("SELECT 1 FROM deleted_reports WHERE id=?", new String[]{id})) {
            if (deleted.moveToFirst()) {
                if (importing) return null;
                throw new IllegalStateException("CONFLICT");
            }
        }
        try (Cursor cursor = database.rawQuery("SELECT record,photo_name,photo_sha256 FROM reports WHERE id=?", new String[]{id})) {
            if (cursor.moveToFirst()) {
                JSONObject existing = new JSONObject(cursor.getString(0));
                if ("pending-delete".equals(existing.optString("_status")) && importing) return withPhoto(existing.toString(), cursor.getString(1));
                boolean same = StorageRules.canonical(existing).equals(StorageRules.canonical(prepared.metadata()))
                    && java.util.Objects.equals(cursor.getString(2), prepared.hash());
                if (!same) throw new IllegalStateException("CONFLICT");
                return withPhoto(existing.toString(), cursor.getString(1));
            }
        }
        String name = null;
        if (prepared.bytes() != null) {
            name = UUID.randomUUID().toString().replace("-", "");
            File file = new File(photos, name);
            created.add(file);
            try (FileOutputStream stream = new FileOutputStream(file)) {
                stream.write(prepared.bytes());
                stream.getFD().sync();
            }
        }
        ContentValues values = new ContentValues();
        values.put("id", id);
        values.put("record", prepared.metadata().toString());
        values.put("photo_name", name);
        values.put("photo_mime", prepared.mime());
        values.put("photo_sha256", prepared.hash());
        values.put("image_hash", nullable(prepared.metadata(), "image_hash"));
        values.put("model_version", nullable(prepared.metadata(), "model_version"));
        values.put("status", nullable(prepared.metadata(), "_status"));
        values.put("updated_at", prepared.metadata().getString("updated_at"));
        database.insertOrThrow("reports", null, values);
        return withPhoto(prepared.metadata().toString(), name);
    }

    private static String nullable(JSONObject record, String key) {
        return record.isNull(key) ? null : record.optString(key, null);
    }

    private boolean delete(JSONArray input, String cloudScope) throws JSONException {
        if (input.length() > 10000) throw new IllegalArgumentException("INVALID_ARGUMENT");
        List<String> names = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < input.length(); i++) ids.add(StorageRules.identifier(input.getString(i)));
        SQLiteDatabase database = getWritableDatabase();
        database.beginTransaction();
        try {
            for (String id : ids) {
                if (cloudScope != null && id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
                    // Queue and local deletion share one transaction, including when the phone is offline.
                    String job = new JSONObject().put("scope", cloudScope).put("record_id", id).toString();
                    ContentValues pending = new ContentValues();
                    pending.put("id", "cloud-history-delete:" + cloudScope + ":" + id);
                    pending.put("value", new JSONObject().put("value", job).toString());
                    database.insertWithOnConflict("settings", null, pending, SQLiteDatabase.CONFLICT_REPLACE);
                }
                try (Cursor cursor = database.rawQuery("SELECT photo_name FROM reports WHERE id=?", new String[]{id})) {
                    if (cursor.moveToFirst() && !cursor.isNull(0)) names.add(cursor.getString(0));
                }
                database.delete("reports", "id=?", new String[]{id});
                // Keep local deletion intent independent of photos and replaceable web bundles.
                // A later account recovery must not revive a report this installation deleted.
                ContentValues tombstone = new ContentValues();
                tombstone.put("id", id);
                database.insertWithOnConflict("deleted_reports", null, tombstone, SQLiteDatabase.CONFLICT_IGNORE);
            }
            database.setTransactionSuccessful();
        } finally { database.endTransaction(); }
        // Commit removal first: an interrupted cleanup can leave an inaccessible orphan,
        // but never a visible report whose photo was removed before rollback.
        for (String name : names) new File(photos, name).delete();
        return true;
    }

    private static String cloudScope(String scope) {
        if (!scope.matches("[a-z]{20}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            throw new IllegalArgumentException("INVALID_ARGUMENT");
        return scope;
    }

    private JSONArray listCloudDeletes(String scope) throws JSONException {
        JSONArray jobs = new JSONArray();
        // Existing settings storage keeps schema version 1 and survives replacement of OTA assets.
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT value FROM settings WHERE id LIKE ? ORDER BY id LIMIT 200",
                new String[]{"cloud-history-delete:" + scope + ":%"})) {
            while (cursor.moveToNext()) jobs.put(new JSONObject(new JSONObject(cursor.getString(0)).getString("value")));
        }
        return jobs;
    }

    private boolean acknowledgeCloudDelete(JSONObject payload) throws JSONException {
        String scope = cloudScope(payload.getString("scope"));
        String id = StorageRules.identifier(payload.getString("record_id"));
        getWritableDatabase().delete("settings", "id=?", new String[]{"cloud-history-delete:" + scope + ":" + id});
        return true;
    }

    private JSONArray readGuidelines(SQLiteDatabase database) throws JSONException {
        JSONArray rows = new JSONArray();
        try (Cursor cursor = database.rawQuery("SELECT record FROM guidelines ORDER BY id", null)) {
            while (cursor.moveToNext()) rows.put(new JSONObject(cursor.getString(0)));
        }
        return rows;
    }

    private void putGuidelines(SQLiteDatabase database, JSONArray rows) throws JSONException {
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.getJSONObject(i);
            ContentValues values = new ContentValues();
            values.put("id", row.getString("id"));
            values.put("record", row.toString());
            database.insertWithOnConflict("guidelines", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        }
    }

    private boolean replaceGuidelines(JSONArray input, JSONArray expected) throws JSONException {
        JSONArray rows = StorageRules.guidelines(input);
        SQLiteDatabase database = getWritableDatabase();
        database.beginTransaction();
        try {
            if (!StorageRules.guidelineIdentity(readGuidelines(database)).equals(StorageRules.guidelineIdentity(expected))) return false;
            database.delete("guidelines", null, null);
            putGuidelines(database, rows);
            database.setTransactionSuccessful();
            return true;
        } finally { database.endTransaction(); }
    }

    private boolean changeGuideline(JSONObject payload) throws JSONException {
        String type = payload.getString("type");
        SQLiteDatabase database = getWritableDatabase();
        if ("DELETE".equals(type)) {
            database.delete("guidelines", "id=?", new String[]{StorageRules.identifier(payload.getString("id"))});
        } else if ("INSERT".equals(type) || "UPDATE".equals(type)) {
            JSONArray rows = StorageRules.guidelines(new JSONArray().put(payload.getJSONObject("guideline")));
            putGuidelines(database, rows);
        } else throw new IllegalArgumentException("INVALID_ARGUMENT");
        return true;
    }

    private Object getSetting(String key) throws JSONException {
        StorageRules.identifier(key);
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT value FROM settings WHERE id=?", new String[]{key})) {
            if (!cursor.moveToFirst()) return JSONObject.NULL;
            String value = new JSONObject(cursor.getString(0)).getString("value");
            if (!secretSetting(key)) return value;
            try {
                return SecretSettings.decrypt(value);
            } catch (Exception invalidatedKeyOrCiphertext) {
                // A lost/invalidated key means sign-in is needed again. Never expose ciphertext.
                getWritableDatabase().delete("settings", "id=?", new String[]{key});
                return JSONObject.NULL;
            }
        }
    }

    private boolean setSetting(String key, Object value) throws Exception {
        StorageRules.identifier(key);
        if (value == JSONObject.NULL) {
            getWritableDatabase().delete("settings", "id=?", new String[]{key});
            return true;
        }
        if (!(value instanceof String)) throw new IllegalArgumentException("INVALID_ARGUMENT");
        if (secretSetting(key)) value = SecretSettings.encrypt((String) value);
        String encoded = new JSONObject().put("value", value).toString();
        if (encoded.length() > 256 * 1024) throw new IllegalArgumentException("INVALID_ARGUMENT");
        ContentValues values = new ContentValues();
        values.put("id", key);
        values.put("value", encoded);
        getWritableDatabase().insertWithOnConflict("settings", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        return true;
    }

    private Object importRecords(JSONObject payload) throws Exception {
        JSONArray input = payload.getJSONArray("records");
        if (input.length() > 1000) throw new IllegalArgumentException("INVALID_ARGUMENT");
        List<Prepared> records = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < input.length(); i++) {
            JSONObject item = input.getJSONObject(i);
            Prepared record = prepare(item.getJSONObject("record"), item.optJSONObject("image"));
            if (!ids.add(record.metadata().getString("id"))) throw new IllegalArgumentException("INVALID_ARGUMENT");
            records.add(record);
        }
        JSONArray guidelines = payload.has("guidelines") ? StorageRules.guidelines(payload.getJSONArray("guidelines")) : null;
        JSONArray deletedIds = payload.optJSONArray("deletedIds");
        if (deletedIds != null && deletedIds.length() > 10000) throw new IllegalArgumentException("INVALID_ARGUMENT");
        SQLiteDatabase database = getWritableDatabase();
        List<File> created = new ArrayList<>();
        database.beginTransaction();
        try {
            long before = android.database.DatabaseUtils.queryNumEntries(database, "reports");
            if (deletedIds != null) {
                for (int i = 0; i < deletedIds.length(); i++) {
                    String id = StorageRules.identifier(deletedIds.getString(i));
                    // An imported archive can preserve deletion intent for absent rows,
                    // but cannot erase a visible record already present on this device.
                    try (Cursor existing = database.rawQuery("SELECT 1 FROM reports WHERE id=?", new String[]{id})) {
                        if (!existing.moveToFirst()) {
                            ContentValues tombstone = new ContentValues();
                            tombstone.put("id", id);
                            database.insertWithOnConflict("deleted_reports", null, tombstone, SQLiteDatabase.CONFLICT_IGNORE);
                        }
                    }
                }
            }
            for (Prepared record : records) insertReport(database, record, true, created);
            if (guidelines != null) putGuidelines(database, guidelines);
            long imported = android.database.DatabaseUtils.queryNumEntries(database, "reports") - before;
            database.setTransactionSuccessful();
            return new JSONObject().put("processed", records.size()).put("imported", imported);
        } catch (Exception error) {
            for (File file : created) file.delete();
            throw error;
        } finally { database.endTransaction(); }
    }

    private static boolean secretSetting(String key) {
        return "supabase-backup-session".equals(key) || "backup-recovery-code".equals(key)
            || key.startsWith("supabase-backup-session:") || key.startsWith("backup-recovery-code:");
    }

    private JSONObject exportRecords() throws Exception {
        JSONArray deletedIds = new JSONArray();
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT id FROM deleted_reports ORDER BY id", null)) {
            while (cursor.moveToNext()) deletedIds.put(cursor.getString(0));
        }
        return new JSONObject().put("schemaVersion", 1).put("records", listReports(true))
            .put("guidelines", readGuidelines(getReadableDatabase())).put("deletedIds", deletedIds);
    }

    /** Stream an explicitly requested local archive; photos never cross the bridge as one giant JSON message. */
    synchronized void writeArchive(OutputStream output) throws Exception {
        SQLiteDatabase database = getReadableDatabase();
        JSONArray guidelines = readGuidelines(database);
        JSONArray deletedIds = new JSONArray();
        try (Cursor cursor = database.rawQuery("SELECT id FROM deleted_reports ORDER BY id", null)) {
            while (cursor.moveToNext()) deletedIds.put(cursor.getString(0));
        }
        String start = "{\"format\":\"mangoleaf-local-reports\",\"schemaVersion\":1,\"records\":[";
        String end = "],\"guidelines\":" + guidelines + ",\"deletedIds\":" + deletedIds + "}";
        long estimate = utf8(start).length + utf8(end).length;
        try (Cursor cursor = database.rawQuery("SELECT record,photo_name,photo_mime FROM reports ORDER BY updated_at,id", null)) {
            boolean first = true;
            while (cursor.moveToNext()) {
                JSONObject metadata = new JSONObject(cursor.getString(0));
                File photo = cursor.isNull(1) ? null : new File(photos, cursor.getString(1));
                long imageBytes = photo != null && photo.isFile() ? photo.length() : 0;
                if (imageBytes > StorageRules.MAX_PHOTO_BYTES) throw new IllegalArgumentException("ARCHIVE_TOO_LARGE");
                String prefix = "{\"record\":" + metadata + ",\"image\":";
                estimate += utf8(prefix).length + (first ? 0 : 1) + 1;
                estimate += imageBytes == 0 ? 4 : utf8("{\"base64\":\"\",\"mimeType\":" + JSONObject.quote(cursor.getString(2)) + "}").length + ((imageBytes + 2) / 3) * 4;
                if (estimate > 64L * 1024 * 1024) throw new IllegalArgumentException("ARCHIVE_TOO_LARGE");
                first = false;
            }
        }
        output.write(utf8(start));
        try (Cursor cursor = database.rawQuery("SELECT record,photo_name,photo_mime FROM reports ORDER BY updated_at,id", null)) {
            boolean first = true;
            while (cursor.moveToNext()) {
                JSONObject item = new JSONObject().put("record", new JSONObject(cursor.getString(0)));
                File photo = cursor.isNull(1) ? null : new File(photos, cursor.getString(1));
                if (photo == null || !photo.isFile()) item.put("image", JSONObject.NULL);
                else {
                    byte[] bytes = Files.readAllBytes(photo.toPath());
                    item.put("image", new JSONObject().put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP)).put("mimeType", cursor.getString(2)));
                }
                if (!first) output.write(',');
                output.write(utf8(item.toString()));
                first = false;
            }
        }
        output.write(utf8(end));
        output.flush();
    }

    private static byte[] utf8(String text) { return text.getBytes(StandardCharsets.UTF_8); }

    synchronized Photo photo(String name) {
        if (!name.matches("[a-f0-9]{32}")) return null;
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT photo_mime FROM reports WHERE photo_name=?", new String[]{name})) {
            File file = new File(photos, name);
            return cursor.moveToFirst() && file.isFile() ? new Photo(file, cursor.getString(0)) : null;
        }
    }

    record Photo(File file, String mime) {}

    private static String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder hex = new StringBuilder();
            for (byte value : digest) hex.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
            return hex.toString();
        } catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }

    static String safeError(Throwable error) {
        Set<Throwable> seen = new HashSet<>();
        for (Throwable current = error; current != null && seen.add(current); current = current.getCause()) {
            if (current instanceof SQLiteFullException) return "QUOTA_EXCEEDED";
            if (current instanceof android.system.ErrnoException system
                    && (system.errno == android.system.OsConstants.ENOSPC || system.errno == android.system.OsConstants.EDQUOT)) {
                return "QUOTA_EXCEEDED";
            }
        }
        String message = error.getMessage();
        if (Set.of("INVALID_ARGUMENT", "METHOD_NOT_ALLOWED", "PHOTO_TOO_LARGE", "INVALID_PHOTO", "CONFLICT", "UNSUPPORTED_SCHEMA", "STORAGE_UNAVAILABLE", "ARCHIVE_TOO_LARGE", "CANCELLED", "BUSY").contains(message == null ? "" : message)) return message;
        if (error instanceof JSONException || error instanceof IllegalArgumentException) return "INVALID_ARGUMENT";
        return "STORAGE_ERROR";
    }
}
