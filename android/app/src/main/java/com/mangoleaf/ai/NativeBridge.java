package com.mangoleaf.ai;

import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.CompletionStage;
import org.json.JSONException;
import org.json.JSONObject;

/** A fixed method surface, exact origin and main-frame check replace unrestricted interfaces. */
final class NativeBridge implements WebViewCompat.WebMessageListener {
    interface Host {
        Object call(String method, JSONObject payload) throws Exception;
    }

    private final ExecutorService executor;
    private final Host host;
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean closed;
    private JavaScriptReplyProxy subscriber;
    private int pendingRequests;

    NativeBridge(ExecutorService executor, Host host) {
        this.executor = executor;
        this.host = host;
    }

    @Override public void onPostMessage(WebView view, WebMessageCompat message, Uri origin, boolean mainFrame, JavaScriptReplyProxy reply) {
        if (closed || !mainFrame || !LocalContent.trusted(origin) || !LocalContent.trusted(Uri.parse(view.getUrl() == null ? "" : view.getUrl()))) return;
        String data = message.getData();
        if (data == null || data.length() > 12 * 1024 * 1024) return;
        final String id;
        final String method;
        final JSONObject payload;
        try {
            JSONObject request = new JSONObject(data);
            id = request.getString("id");
            if (id.isEmpty() || id.length() > 160) return;
            method = request.getString("method");
            payload = request.optJSONObject("payload") == null ? new JSONObject() : request.getJSONObject("payload");
        } catch (JSONException invalidMessage) { return; }
        subscriber = reply;
        if (pendingRequests >= 8) {
            try { post(reply, new JSONObject().put("id", id).put("error", new JSONObject().put("code", "BUSY")).toString()); }
            catch (JSONException | RuntimeException ignored) { /* The calling frame may already be gone. */ }
            return;
        }
        pendingRequests++;
        executor.execute(() -> {
            try {
                Object result = host.call(method, payload);
                if (result instanceof CompletionStage<?> pending) {
                    // Document creation has a user interaction; never block the database executor waiting for it.
                    pending.whenComplete((value, failure) -> respond(reply, id, value, failure));
                } else respond(reply, id, result, null);
            } catch (Exception failure) {
                respond(reply, id, null, failure);
            }
        });
    }

    private void respond(JavaScriptReplyProxy reply, String id, Object result, Throwable failure) {
        JSONObject response = new JSONObject();
        try {
            response.put("id", id);
            if (failure == null) response.put("result", result == null ? JSONObject.NULL : result);
            else response.put("error", new JSONObject().put("code", NativeStore.safeError(failure)));
        } catch (JSONException impossible) { return; }
        main.post(() -> {
            pendingRequests--;
            if (!closed) {
                try { post(reply, response.toString()); }
                catch (RuntimeException detachedFrame) { /* Closing/reloading a page is not an app failure. */ }
            }
        });
    }

    void notifyEvent(String event, JSONObject payload) {
        main.post(() -> {
            if (closed || subscriber == null) return;
            try { post(subscriber, new JSONObject().put("event", event).put("payload", payload).toString()); }
            catch (JSONException | RuntimeException ignored) { /* A detached frame no longer receives events. */ }
        });
    }

    void reset() { subscriber = null; }
    void close() { closed = true; subscriber = null; }

    private static void post(JavaScriptReplyProxy reply, String message) {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) reply.postMessage(message);
    }
}
