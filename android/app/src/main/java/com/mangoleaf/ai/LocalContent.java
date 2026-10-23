package com.mangoleaf.ai;

import android.content.Context;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceResponse;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Only verified bundles and explicitly requested private photos are web-readable. */
final class LocalContent implements WebViewAssetLoader.PathHandler {
    private final Context context;
    private final NativeStore store;
    private final File bundle;

    LocalContent(Context context, NativeStore store, File bundle) {
        this.context = context.getApplicationContext();
        this.store = store;
        this.bundle = bundle;
    }

    static boolean trusted(Uri uri) {
        return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
            && (uri.getPort() == -1 || uri.getPort() == 443) && uri.getUserInfo() == null;
    }

    @Override public WebResourceResponse handle(String requestedPath) {
        String path = requestedPath.startsWith("/") ? requestedPath.substring(1) : requestedPath;
        if (path.contains("\\") || path.indexOf('\0') >= 0) return missing();
        for (String segment : path.split("/")) if (segment.equals("..") || segment.equals(".")) return missing();
        if (path.startsWith("_native/photos/")) {
            NativeStore.Photo photo = store.photo(path.substring("_native/photos/".length()));
            if (photo == null) return missing();
            try { return response(photo.mime(), new FileInputStream(photo.file())); }
            catch (IOException error) { return missing(); }
        }
        if (path.startsWith("_native/") || path.equals("sw.js") || path.startsWith("swe-worker-")) return missing();
        String[] candidates = path.isEmpty() ? new String[]{"index.html"}
            : path.endsWith("/") ? new String[]{path + "index.html", path.substring(0, path.length() - 1) + ".html"}
            : new String[]{path, path + ".html", path + "/index.html"};
        for (String candidate : candidates) {
            try {
                InputStream stream;
                if (bundle == null) stream = context.getAssets().open("web/" + candidate);
                else {
                    File target = new File(bundle, candidate);
                    if (!target.getCanonicalPath().startsWith(bundle.getCanonicalPath() + File.separator) || !target.isFile()) continue;
                    stream = new FileInputStream(target);
                }
                return response(mime(candidate), stream);
            } catch (IOException missingAsset) {
                // Try only exact static-export alternatives. Never return index.html for arbitrary files.
            }
        }
        // A missing local asset must never fall through to an external DNS/network request.
        return missing();
    }

    private static String mime(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".bin")) return "application/octet-stream";
        String extension = MimeTypeMap.getFileExtensionFromUrl(lower);
        String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        return type == null ? "application/octet-stream" : type;
    }

    private static WebResourceResponse response(String mime, InputStream stream) {
        Map<String, String> headers = new HashMap<>();
        // Native bundle selection owns updates; HTTP/service-worker caches cannot mix versions.
        headers.put("Cache-Control", "no-store");
        headers.put("X-Content-Type-Options", "nosniff");
        headers.put("Cross-Origin-Resource-Policy", "same-origin");
        headers.put("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
        return new WebResourceResponse(mime, mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "UTF-8" : null, 200, "OK", headers, stream);
    }

    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Map.of("Cache-Control", "no-store"), new ByteArrayInputStream(new byte[0]));
    }
}
