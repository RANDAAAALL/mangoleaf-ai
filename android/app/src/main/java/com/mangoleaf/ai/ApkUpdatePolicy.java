package com.mangoleaf.ai;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/** Pure validation shared by the native downloader and isolated regression tests. */
final class ApkUpdatePolicy {
    static final String REPOSITORY = "RANDAAAALL/mangoleaf-ai";
    static final String PACKAGE = "com.mangoleaf.ai";
    static final String FILE = "mangoleaf-ai.apk";
    static final int MAX_METADATA = 256 * 1024;
    static final long MAX_APK = 128 * 1024 * 1024L;
    static final long DEADLINE_MS = 10 * 60 * 1000L;

    record Release(String tag, String version, String url, long bytes, String digest) {}

    static void requireId(String id) throws IOException {
        if (id == null || !id.matches("[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")) invalid();
    }

    static void requireRequest(String tag, String version) throws IOException {
        if (tag == null || !tag.matches("[A-Za-z0-9][A-Za-z0-9._-]{0,127}") || tag.contains("..")) invalid();
        requireVersion(version);
    }

    static String metadataUrl(String tag) { return "https://api.github.com/repos/" + REPOSITORY + "/releases/tags/" + tag; }
    static String releaseUrl(String tag) { return "https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/" + FILE; }

    static Release release(JSONObject json, String tag, String version) throws Exception {
        requireRequest(tag, version);
        if (!Boolean.FALSE.equals(json.opt("draft")) || !Boolean.FALSE.equals(json.opt("prerelease"))
                || !tag.equals(json.opt("tag_name"))
                || !("https://github.com/" + REPOSITORY + "/releases/tag/" + tag).equals(json.opt("html_url"))) invalid();
        Object published = json.opt("published_at");
        if (!(published instanceof String) || !((String) published).matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z")) invalid();
        Instant.parse((String) published);
        JSONArray assets = json.optJSONArray("assets");
        if (assets == null || assets.length() > 1000) invalid();
        JSONObject found = null;
        for (int i = 0; i < assets.length(); i++) {
            JSONObject asset = assets.optJSONObject(i);
            if (asset == null || !FILE.equals(asset.opt("name"))) continue;
            if (found != null) invalid();
            found = asset;
        }
        if (found == null || !"uploaded".equals(found.opt("state"))
                || !("Android APK v" + version).equals(found.opt("label"))
                || !releaseUrl(tag).equals(found.opt("browser_download_url"))
                || !Set.of("application/vnd.android.package-archive", "application/octet-stream").contains(found.optString("content_type"))) invalid();
        Object raw = found.opt("size");
        if (!(raw instanceof Number)) invalid();
        long bytes = ((Number) raw).longValue();
        if (((Number) raw).doubleValue() != bytes || bytes < 1 || bytes > MAX_APK) invalid();
        Object digestValue = found.opt("digest");
        String digest = "";
        if (digestValue != null && digestValue != JSONObject.NULL) {
            if (!(digestValue instanceof String) || !((String) digestValue).matches("sha256:[a-f0-9]{64}")) invalid();
            digest = ((String) digestValue).substring(7);
        }
        return new Release(tag, version, releaseUrl(tag), bytes, digest);
    }

    static void requireDownloadUrl(String address, String original, boolean initial) throws Exception {
        URI uri = new URI(address);
        if (!"https".equals(uri.getScheme()) || uri.getRawUserInfo() != null || uri.getPort() != -1 || uri.getRawFragment() != null) invalid();
        if (initial || "github.com".equals(uri.getHost())) {
            if (!address.equals(original)) invalid();
        } else if (!"release-assets.githubusercontent.com".equals(uri.getHost())
                || uri.getRawPath() == null || !uri.getRawPath().startsWith("/")) invalid();
    }

    static void requireIdentity(String packageName, String version, long code, String installedVersion,
            long installedCode, String expectedVersion, Set<String> downloadedSigners,
            Set<String> installedSigners, String originalPin) throws IOException {
        requireVersion(expectedVersion);
        if (!PACKAGE.equals(packageName) || !expectedVersion.equals(version) || code <= installedCode || code > Integer.MAX_VALUE
                || !newer(version, installedVersion) || originalPin == null || !originalPin.matches("[a-f0-9]{64}")
                || downloadedSigners.size() != 1 || installedSigners.size() != 1
                || !downloadedSigners.equals(installedSigners) || !downloadedSigners.contains(originalPin)) invalid();
    }

    static boolean newer(String candidate, String current) throws IOException {
        requireVersion(candidate); requireVersion(current);
        String[] a = candidate.split("\\."); String[] b = current.split("\\.");
        for (int i = 0; i < 3; i++) {
            if (a[i].length() != b[i].length()) return a[i].length() > b[i].length();
            int comparison = a[i].compareTo(b[i]);
            if (comparison != 0) return comparison > 0;
        }
        return false;
    }

    private static void requireVersion(String version) throws IOException {
        if (version == null || version.length() > 80 || !version.matches("(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)")) invalid();
    }

    private static void invalid() throws IOException { throw new IOException("INVALID_UPDATE"); }
}
