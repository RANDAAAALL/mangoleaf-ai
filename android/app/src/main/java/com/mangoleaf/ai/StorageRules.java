package com.mangoleaf.ai;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Pure validation/canonicalization is shared by normal saves and local imports. */
public final class StorageRules {
    public static final int MAX_PHOTO_BYTES = 8 * 1024 * 1024;
    private StorageRules() {}

    public static String identifier(String value) {
        if (value == null || value.isEmpty() || value.length() > 160 || value.indexOf('\0') >= 0) {
            throw new IllegalArgumentException("INVALID_ARGUMENT");
        }
        return value;
    }

    public static JSONObject report(JSONObject input) throws JSONException {
        JSONObject record = new JSONObject(input.toString());
        identifier(record.getString("id"));
        String disease = record.getString("disease_name");
        String timestamp = record.getString("updated_at");
        double confidence = record.getDouble("confidence");
        if (disease.isBlank() || disease.length() > 200 || timestamp.isBlank()
                || timestamp.length() > 64 || !Double.isFinite(confidence)
                || confidence < 0 || confidence > 1) {
            throw new IllegalArgumentException("INVALID_ARGUMENT");
        }
        if (record.toString().length() > 64 * 1024) throw new IllegalArgumentException("INVALID_ARGUMENT");
        // Generated local endpoints are never accepted as provenance or stored as metadata.
        record.remove("photoUri");
        record.remove("image_blob");
        return record;
    }

    public static JSONArray guidelines(JSONArray input) throws JSONException {
        if (input.length() > 1000) throw new IllegalArgumentException("INVALID_ARGUMENT");
        java.util.HashSet<String> ids = new java.util.HashSet<>();
        JSONArray result = new JSONArray();
        for (int i = 0; i < input.length(); i++) {
            JSONObject row = input.getJSONObject(i);
            String id = identifier(row.getString("id"));
            if (!ids.add(id)) throw new IllegalArgumentException("INVALID_ARGUMENT");
            for (String field : new String[]{"disease_name", "guidelines_en", "guidelines_bis"}) {
                String text = row.getString(field);
                if (text.isBlank() || text.length() > 256 * 1024) throw new IllegalArgumentException("INVALID_ARGUMENT");
            }
            result.put(new JSONObject(row.toString()));
        }
        return result;
    }

    public static String canonical(Object value) throws JSONException {
        if (value instanceof JSONObject object) {
            List<String> keys = new ArrayList<>();
            Iterator<String> iterator = object.keys();
            while (iterator.hasNext()) keys.add(iterator.next());
            Collections.sort(keys);
            List<String> entries = new ArrayList<>();
            for (String key : keys) entries.add(JSONObject.quote(key) + ":" + canonical(object.get(key)));
            return "{" + String.join(",", entries) + "}";
        }
        if (value instanceof JSONArray array) {
            List<String> entries = new ArrayList<>();
            for (int i = 0; i < array.length(); i++) entries.add(canonical(array.get(i)));
            return "[" + String.join(",", entries) + "]";
        }
        if (value instanceof String string) return JSONObject.quote(string);
        return String.valueOf(value);
    }

    public static String guidelineIdentity(JSONArray rows) throws JSONException {
        List<String> values = new ArrayList<>();
        for (int i = 0; i < rows.length(); i++) values.add(canonical(rows.getJSONObject(i)));
        Collections.sort(values);
        return String.join("\n", values);
    }
}
