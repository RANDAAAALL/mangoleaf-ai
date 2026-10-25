package com.mangoleaf.ai;

import java.io.IOException;
import java.util.LinkedHashSet;
import org.json.JSONException;
import org.json.JSONObject;

/** Caller IDs make cancellation final, including a cancelled start whose acknowledgment was lost. */
final class ApkUpdateState {
    private final LinkedHashSet<String> retired = new LinkedHashSet<>();
    String id = "";
    String version = "";
    String status = "idle";
    String error = "";
    long downloaded;
    long total;

    boolean active() { return status.equals("downloading") || status.equals("verifying") || status.equals("ready") || status.equals("installing"); }
    boolean owns(String value) { return id.equals(value); }
    boolean cancelled(String value) { return retired.contains(value) || !owns(value) || status.equals("cancelled") || status.equals("failed"); }

    void start(String value, String target) throws IOException {
        ApkUpdatePolicy.requireId(value);
        if (retired.contains(value)) throw new IOException("CANCELLED");
        if (active() || owns(value)) throw new IOException("BUSY");
        retire(id);
        id = value; version = target; status = "downloading"; error = ""; downloaded = 0; total = 0;
    }

    void cancel(String value) throws IOException {
        ApkUpdatePolicy.requireId(value);
        retire(value);
        if (owns(value)) { status = "cancelled"; error = ""; }
    }

    void fail(String value, String code) {
        if (!owns(value) || status.equals("cancelled")) return;
        status = "failed"; error = code; retire(value);
    }

    JSONObject snapshot(String requested) throws JSONException {
        boolean own = owns(requested);
        return new JSONObject().put("id", requested).put("status", own ? status : "cancelled")
            .put("version", own ? version : "").put("downloaded", own ? downloaded : 0)
            .put("total", own ? total : 0).put("error", own ? error : "")
            .put("handoff", own && status.equals("installing"));
    }

    private void retire(String value) {
        if (value.isEmpty()) return;
        retired.add(value);
        while (retired.size() > 64) retired.remove(retired.iterator().next());
    }
}
