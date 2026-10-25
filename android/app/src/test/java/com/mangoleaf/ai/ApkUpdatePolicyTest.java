package com.mangoleaf.ai;

import static org.junit.Assert.*;
import java.io.IOException;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/** All release/package identities are synthetic. No network, signing key or private report is used. */
public class ApkUpdatePolicyTest {
    private static final String ID = "8b7e744d-6104-421f-bc5e-1f1397459501";
    private static final String OTHER = "d3087078-c9c3-4db5-ac5a-9b733957eac1";
    private static final String PIN = "a".repeat(64);

    @Test public void fixedPublishedReleaseHasBoundedBytesAndOptionalDigest() throws Exception {
        ApkUpdatePolicy.Release value = ApkUpdatePolicy.release(release(), "v0.12.0", "0.1.9");
        assertEquals(100, value.bytes());
        assertEquals(ApkUpdatePolicy.releaseUrl("v0.12.0"), value.url());
        assertEquals(PIN, value.digest());
        JSONObject olderMetadata = release(); olderMetadata.getJSONArray("assets").getJSONObject(0).remove("digest");
        assertEquals("", ApkUpdatePolicy.release(olderMetadata, "v0.12.0", "0.1.9").digest());
    }

    @Test public void tagsIdsAndVersionsCannotEncodePathsOrDevelopmentTargets() throws Exception {
        ApkUpdatePolicy.requireId(ID);
        for (String value : new String[] {"../release", "v1?host=evil", "v1%2frelease", "v1#bad", " v1", "v1..0"})
            assertThrows(IOException.class, () -> ApkUpdatePolicy.requireRequest(value, "0.1.9"));
        for (String value : new String[] {"0.1.9-dev", "v0.1.9", "01.1.9", "0.1", "0.1.9/"})
            assertThrows(IOException.class, () -> ApkUpdatePolicy.requireRequest("v0.12.0", value));
        assertThrows(IOException.class, () -> ApkUpdatePolicy.requireId("../" + ID));
        assertTrue(ApkUpdatePolicy.newer("9007199254740993.0.0", "9007199254740992.0.0"));
        assertFalse(ApkUpdatePolicy.newer("0.1.8", "0.1.8"));
    }

    @Test public void privateDraftWrongLabelDuplicateAndOversizedMetadataFailClosed() throws Exception {
        for (String key : new String[] {"draft", "prerelease"}) {
            JSONObject json = release(); json.put(key, true);
            assertThrows(Exception.class, () -> ApkUpdatePolicy.release(json, "v0.12.0", "0.1.9"));
        }
        for (Object[] change : new Object[][] {{"label", "Android APK v0.1.8"}, {"size", 1.5}, {"size", -1},
                {"size", ApkUpdatePolicy.MAX_APK + 1}, {"size", "100"}, {"content_type", "text/html"},
                {"browser_download_url", "https://elsewhere.invalid/app.apk"}, {"digest", "sha256:bad"}}) {
            JSONObject json = release(); json.getJSONArray("assets").getJSONObject(0).put((String) change[0], change[1]);
            assertThrows(Exception.class, () -> ApkUpdatePolicy.release(json, "v0.12.0", "0.1.9"));
        }
        JSONObject duplicate = release(); duplicate.getJSONArray("assets").put(duplicate.getJSONArray("assets").getJSONObject(0));
        assertThrows(Exception.class, () -> ApkUpdatePolicy.release(duplicate, "v0.12.0", "0.1.9"));
    }

    @Test public void downloadRedirectsCannotLeavePinnedHttpsHosts() throws Exception {
        String original = ApkUpdatePolicy.releaseUrl("v0.12.0");
        ApkUpdatePolicy.requireDownloadUrl(original, original, true);
        ApkUpdatePolicy.requireDownloadUrl("https://release-assets.githubusercontent.com/asset?token=synthetic", original, false);
        for (String value : new String[] {"http://release-assets.githubusercontent.com/asset", "https://github.com/other/release.apk",
                "https://release-assets.githubusercontent.com.evil.invalid/a", "https://release-assets.githubusercontent.com:444/a",
                "https://user@release-assets.githubusercontent.com/a", "https://release-assets.githubusercontent.com/a#bad", "https://127.0.0.1/a"})
            assertThrows(Exception.class, () -> ApkUpdatePolicy.requireDownloadUrl(value, original, false));
    }

    @Test public void packageVersionAndOriginalSingleSignerMustAllAgree() throws Exception {
        identity(ApkUpdatePolicy.PACKAGE, "0.1.9", 10, Set.of(PIN), Set.of(PIN), PIN);
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE + ".debug", "0.1.9", 10, Set.of(PIN), Set.of(PIN), PIN));
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE, "0.1.8", 10, Set.of(PIN), Set.of(PIN), PIN));
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE, "0.1.9", 9, Set.of(PIN), Set.of(PIN), PIN));
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE, "0.1.9", 10, Set.of("b".repeat(64)), Set.of(PIN), PIN));
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE, "0.1.9", 10, Set.of(PIN), Set.of(), PIN));
        assertThrows(IOException.class, () -> identity(ApkUpdatePolicy.PACKAGE, "0.1.9", 10, Set.of(PIN), Set.of(PIN), "c".repeat(64)));
    }

    @Test public void cancellationBeforeStartRejectsLateAcknowledgedStart() throws Exception {
        ApkUpdateState state = new ApkUpdateState(); state.cancel(ID);
        assertThrows(IOException.class, () -> state.start(ID, "0.1.9"));
        assertEquals("cancelled", state.snapshot(ID).getString("status"));
        assertFalse(state.active());
    }

    @Test public void cancelledOrFailedWorkCannotPublishSuccessAndOldIdsCannotCancelNewWork() throws Exception {
        ApkUpdateState state = new ApkUpdateState(); state.start(ID, "0.1.9"); state.cancel(ID);
        state.fail(ID, "DOWNLOAD_FAILED"); assertEquals("cancelled", state.status);
        state.start(OTHER, "0.1.10"); state.cancel(ID);
        assertEquals("downloading", state.status); assertTrue(state.owns(OTHER)); assertTrue(state.cancelled(ID));
        assertEquals("", state.snapshot(ID).getString("version"));
        assertThrows(IOException.class, () -> state.start(OTHER, "0.1.10"));
    }

    @Test public void installerHandoffIsNotCompletion() throws Exception {
        ApkUpdateState state = new ApkUpdateState(); state.start(ID, "0.1.9");
        state.status = "installing";
        assertTrue(state.snapshot(ID).getBoolean("handoff"));
        assertEquals("installing", state.snapshot(ID).getString("status"));
        state.fail(ID, "INSTALL_FAILED");
        assertFalse(state.snapshot(ID).getBoolean("handoff"));
        assertEquals("failed", state.snapshot(ID).getString("status"));
    }

    private static void identity(String name, String version, long code, Set<String> downloaded, Set<String> installed, String pin) throws Exception {
        ApkUpdatePolicy.requireIdentity(name, version, code, "0.1.8", 9, "0.1.9", downloaded, installed, pin);
    }

    private static JSONObject release() throws Exception {
        JSONObject asset = new JSONObject().put("name", ApkUpdatePolicy.FILE).put("state", "uploaded").put("size", 100)
            .put("content_type", "application/vnd.android.package-archive").put("label", "Android APK v0.1.9")
            .put("browser_download_url", ApkUpdatePolicy.releaseUrl("v0.12.0")).put("digest", "sha256:" + PIN);
        return new JSONObject().put("draft", false).put("prerelease", false).put("published_at", "2026-10-26T00:00:00Z")
            .put("tag_name", "v0.12.0").put("html_url", "https://github.com/" + ApkUpdatePolicy.REPOSITORY + "/releases/tag/v0.12.0")
            .put("assets", new JSONArray().put(asset));
    }
}
