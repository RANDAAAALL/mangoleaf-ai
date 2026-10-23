package com.mangoleaf.ai;

import static org.junit.Assert.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public final class StorageRulesTest {
    private static JSONObject record() throws Exception {
        return new JSONObject().put("id", "report-1").put("disease_name", "Healthy Leaf")
            .put("confidence", 0.923456789).put("updated_at", "2026-10-20T00:00:00.000Z");
    }

    @Test public void validationPreservesLegacyAndRawScores() throws Exception {
        JSONObject input = record().put("_status", "pending-delete").put("owner_id", "historical-owner")
            .put("image_url", "https://invalid.example/never-fetch")
            .put("future_metadata", new JSONObject().put("retained", true)).put("photoUri", "untrusted");
        JSONObject output = StorageRules.report(input);
        assertEquals(0.923456789, output.getDouble("confidence"), 0);
        assertEquals("pending-delete", output.getString("_status"));
        assertEquals("historical-owner", output.getString("owner_id"));
        assertTrue(output.getJSONObject("future_metadata").getBoolean("retained"));
        assertFalse(output.has("photoUri"));
        assertTrue(input.has("photoUri"));
    }

    @Test public void canonicalComparisonIgnoresPropertyInsertionOrder() throws Exception {
        assertEquals(StorageRules.canonical(new JSONObject("{\"b\":2,\"a\":{\"y\":1,\"x\":0}}")),
            StorageRules.canonical(new JSONObject("{\"a\":{\"x\":0,\"y\":1},\"b\":2}")));
    }

    @Test public void confidenceMustStayWithinUnitInterval() throws Exception {
        for (double confidence : new double[]{-0.01, 1.01}) {
            assertThrows(IllegalArgumentException.class, () -> StorageRules.report(record().put("confidence", confidence)));
        }
    }

    @Test public void duplicateGuidelineIdsAreRejectedBeforeReplacement() throws Exception {
        JSONObject guideline = new JSONObject().put("id", "anthracnose").put("disease_name", "Anthracnose")
            .put("guidelines_en", "English").put("guidelines_bis", "Bisaya");
        assertThrows(IllegalArgumentException.class, () -> StorageRules.guidelines(new JSONArray().put(guideline).put(guideline)));
    }

    @Test public void snapshotIdentityIgnoresRowOrderButDetectsContentChanges() throws Exception {
        JSONObject first = new JSONObject().put("id", "one").put("value", "first");
        JSONObject second = new JSONObject().put("id", "two").put("value", "second");
        assertEquals(StorageRules.guidelineIdentity(new JSONArray().put(first).put(second)),
            StorageRules.guidelineIdentity(new JSONArray().put(second).put(first)));
        assertNotEquals(StorageRules.guidelineIdentity(new JSONArray().put(first)),
            StorageRules.guidelineIdentity(new JSONArray().put(second)));
    }
}
