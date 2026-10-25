package com.mangoleaf.ai;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.ViewGroup;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.FrameLayout;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.mangoleaf.ai.ota.OtaManager;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.CompletableFuture;
import org.json.JSONObject;

/** Android owns local storage, permissions and bundle lifecycle; React owns application screens. */
public final class MainActivity extends ComponentActivity implements ApkUpdateManager.Host {
    public static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final int CAMERA_PERMISSION = 100;
    private static final int FILE_PICKER = 101;
    private static final int ARCHIVE_DESTINATION = 102;
    private static final int APK_PERMISSION = 103;
    private static final int APK_CONFIRMATION = 104;
    private ExecutorService operations;
    private WebView webView;
    private NativeStore store;
    private NativeBridge bridge;
    private NetworkMonitor network;
    private OtaManager ota;
    private ApkUpdateManager apkUpdater;
    private volatile boolean destroyed;
    private volatile boolean foreground;
    private volatile boolean applicationReady;
    private PermissionRequest cameraRequest;
    private ValueCallback<Uri[]> fileCallback;
    private WebChromeClient.FileChooserParams pendingChooser;
    private Uri capturedPhoto;
    private File capturedFile;
    private boolean acceptsJson;
    private boolean acceptsImages = true;
    private volatile boolean applicationBusy;
    private volatile boolean updateRestartPending;
    private volatile CompletableFuture<Boolean> archiveExport;
    private File archiveFile;
    private String apkConfirmationAttempt = "";

    @Override public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        if (savedState != null) apkConfirmationAttempt = savedState.getString("apkConfirmationAttempt", "");
        MangoLeafApplication application = (MangoLeafApplication) getApplication();
        operations = application.operations();
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) webView.goBack();
                else finish();
            }
        });
        // Never restore a WebView that might retain an obsolete bundle or permission state.
        WindowCompat.enableEdgeToEdge(getWindow());
        WindowInsetsControllerCompat systemBars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        systemBars.setAppearanceLightStatusBars(true);
        systemBars.setAppearanceLightNavigationBars(true);
        network = new NetworkMonitor(this, state -> {
            runOnUiThread(() -> {
                if (destroyed) return;
                if (bridge != null) bridge.notifyEvent("connectivity", state);
                if (apkUpdater != null) apkUpdater.networkChanged(state.optBoolean("validated"));
                if (ota != null && applicationReady && state.optBoolean("validated") && foreground) ota.checkForUpdates();
            });
        });
        operations.execute(() -> {
            try {
                store = application.store();
                ota = application.ota();
                try { apkUpdater = application.apkUpdater(); apkUpdater.attach(this); }
                catch (Exception optionalUpdaterUnavailable) { apkUpdater = null; }
                // Candidate activation occurs only during a new Activity launch, before any user task.
                File bundle = ota.getLaunchBundleDirectory();
                runOnUiThread(() -> {
                    if (!destroyed) initializeWebView(bundle);
                });
            } catch (Exception startupFailure) {
                runOnUiThread(() -> showStartupFailure(false));
            }
        });
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private void initializeWebView(File bundle) {
        webView = new WebView(this);
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            webView.destroy();
            webView = null;
            showStartupFailure(true);
            return;
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setUserAgentString(settings.getUserAgentString() + " MangoLeafAndroid/1");
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .setHttpAllowed(false)
            .addPathHandler("/", new LocalContent(this, store, bundle))
            .build();
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat workers = ServiceWorkerControllerCompat.getInstance();
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_CACHE_MODE)) workers.getServiceWorkerWebSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_CONTENT_ACCESS)) workers.getServiceWorkerWebSettings().setAllowContentAccess(false);
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_FILE_ACCESS)) workers.getServiceWorkerWebSettings().setAllowFileAccess(false);
            workers.setServiceWorkerClient(new ServiceWorkerClientCompat() {
                @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return LocalContent.trusted(request.getUrl()) ? loader.shouldInterceptRequest(request.getUrl()) : null;
                }
            });
        }
        bridge = new NativeBridge(operations, this::handleNativeCall);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(webView, "MangoLeafNative", Collections.singleton(APP_ORIGIN), bridge);
        }
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return LocalContent.trusted(request.getUrl()) ? loader.shouldInterceptRequest(request.getUrl()) : null;
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (LocalContent.trusted(uri)) return false;
                if (request.isForMainFrame() && request.hasGesture() && ("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme()))) openExternal(uri);
                // The bridge-enabled WebView never navigates to an external origin or unknown scheme.
                return true;
            }

            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (bridge != null) bridge.reset();
            }

            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                cancelCameraRequest();
                cancelFileCallback();
                if (apkUpdater != null) apkUpdater.backgrounded();
                if (bridge != null) bridge.close();
                // A renderer can die while the host process survives. Do not keep reopening a failed first OTA boot.
                if (ota != null) ota.rendererGone();
                if (view.getParent() instanceof ViewGroup parent) parent.removeView(view);
                view.destroy();
                webView = null;
                showStartupFailure(false);
                // Unacknowledged candidate boot is retained for next-launch OTA recovery.
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> requestCamera(request));
            }

            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (cameraRequest == request) cameraRequest = null;
            }

            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams chooser) {
                cancelFileCallback();
                fileCallback = callback;
                if (!foreground || updateRestartPending || (apkUpdater != null && apkUpdater.busy())
                        || !LocalContent.trusted(Uri.parse(view.getUrl() == null ? "" : view.getUrl()))) {
                    cancelFileCallback();
                    return true;
                }
                if (chooser.isCaptureEnabled() && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingChooser = chooser;
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
                } else launchChooser(chooser);
                return true;
            }
        });
        setContentView(createInsetContent(this, webView));
        ViewCompat.requestApplyInsets(webView.getRootView());
        webView.loadUrl(APP_ORIGIN + "/");
    }

    /** Resize the web viewport, including fixed CSS controls, outside Android's bars and keyboard. */
    static FrameLayout createInsetContent(Context context, View content) {
        FrameLayout container = new FrameLayout(context);
        container.setBackgroundColor(Color.rgb(246, 250, 241));
        container.addView(content, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        ViewCompat.setOnApplyWindowInsetsListener(container, (view, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            // Padding a WebView itself does not move its HTML viewport. Its parent must own the space.
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            // The native container already handles these insets; do not apply CSS safe areas again.
            return WindowInsetsCompat.CONSUMED;
        });
        return container;
    }

    private Object handleNativeCall(String method, JSONObject payload) throws Exception {
        if (destroyed) throw new IllegalStateException("APP_CLOSED");
        if (updateRestartPending) throw new IllegalStateException("BUSY");
        return switch (method) {
            case "app.info" -> network.snapshot().put("bridgeVersion", BuildConfig.BRIDGE_VERSION)
                .put("schemaVersion", BuildConfig.SCHEMA_VERSION).put("hostVersion", BuildConfig.VERSION_CODE)
                .put("hostVersionName", BuildConfig.VERSION_NAME)
                .put("cloudEnvironment", BuildConfig.CLOUD_ENVIRONMENT)
                .put("updateRestartSupported", true)
                .put("apkUpdateSupported", apkUpdater != null && ApkUpdateManager.supported());
            case "app.ready" -> {
                ota.markHealthy();
                applicationReady = true;
                if (foreground && network.snapshot().optBoolean("validated")) ota.checkForUpdates();
                yield true;
            }
            case "app.busy" -> { applicationBusy = payload.getBoolean("busy"); updateBusy(); yield true; }
            // Retain the bounded legacy bridge method for older compatible bundles; current UI uses recovery codes.
            case "storage.archive.export" -> exportArchive();
            case "diagnostics.export" -> exportDiagnostics(payload.getString("text"));
            case "ota.status" -> new JSONObject().put("status", ota.getStatus());
            case "ota.check" -> { if (applicationReady && network.snapshot().optBoolean("validated")) ota.checkForUpdates(); yield true; }
            case "ota.restart" -> restartForUpdate();
            case "apkUpdate.start" -> requireApkUpdater().start(payload.getString("id"), payload.getString("tag"), payload.getString("version"));
            case "apkUpdate.status" -> requireApkUpdater().snapshot(payload.getString("id"));
            case "apkUpdate.cancel" -> requireApkUpdater().cancel(payload.getString("id"));
            case "apkUpdate.install" -> requireApkUpdater().install(payload.getString("id"));
            default -> {
                boolean writes = method.equals("storage.report.save") || method.equals("storage.report.delete")
                    || method.equals("storage.report.deleteSynced") || method.equals("storage.cloudDelete.ack")
                    || method.equals("storage.import") || method.equals("storage.settings.set")
                    || method.equals("storage.guidelines.replace") || method.equals("storage.guidelines.change");
                if (writes) ota.setBusy(true);
                try { yield store.dispatch(method, payload); }
                finally { if (writes) updateBusy(); }
            }
        };
    }

    private ApkUpdateManager requireApkUpdater() {
        if (apkUpdater == null) throw new IllegalStateException("METHOD_NOT_ALLOWED");
        return apkUpdater;
    }

    /** Recreate the trusted local view after queued writes finish; never navigate to an external update URL. */
    private CompletableFuture<Boolean> restartForUpdate() {
        CompletableFuture<Boolean> result = new CompletableFuture<>();
        runOnUiThread(() -> {
            if (!canRestartUpdate() || updateRestartPending) {
                result.complete(false);
                return;
            }
            updateRestartPending = true;
            // The same executor owns SQLite work. Earlier writes settle before selection can be released.
            operations.execute(() -> {
                String verifiedPending = ota.prepareRestart();
                runOnUiThread(() -> {
                    // Foreground, camera and picker state can change while a full bundle is being hashed.
                    if (!ota.commitRestart(verifiedPending, canRestartUpdate())) {
                        updateRestartPending = false;
                        result.complete(false);
                        return;
                    }
                    result.complete(true);
                    recreate();
                });
            });
        });
        return result;
    }

    /** Both sides of asynchronous verification use this same host-owned guard. */
    private boolean canRestartUpdate() {
        return hostIdle() && (apkUpdater == null || !apkUpdater.busy());
    }

    @Override public boolean canUpdate() {
        return hostIdle() && applicationReady && !updateRestartPending;
    }

    private boolean hostIdle() {
        return !destroyed && foreground && !applicationBusy && archiveExport == null
            && cameraRequest == null && pendingChooser == null && fileCallback == null;
    }

    @Override public boolean connected() { return network != null && network.snapshot().optBoolean("validated"); }

    @Override public void changed(JSONObject snapshot) {
        if (destroyed) return;
        updateBusy();
        if (bridge != null) bridge.notifyEvent("apkUpdate", snapshot);
    }

    @Override public void permission(String id) {
        if (!canUpdate()) throw new IllegalStateException("BUSY");
        startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getPackageName())), APK_PERMISSION);
    }

    @Override public void confirmation(String id, Intent intent) {
        if (!canUpdate()) throw new IllegalStateException("BUSY");
        apkConfirmationAttempt = id;
        startActivityForResult(intent, APK_CONFIRMATION);
    }

    private void requestCamera(PermissionRequest request) {
        if (!foreground || updateRestartPending || (apkUpdater != null && apkUpdater.busy())
                || !LocalContent.trusted(request.getOrigin())) { request.deny(); return; }
        boolean videoOnly = request.getResources().length == 1 && PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(request.getResources()[0]);
        if (!videoOnly) { request.deny(); return; }
        cancelCameraRequest();
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            cameraRequest = request;
            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode != CAMERA_PERMISSION) return;
        boolean granted = foreground && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (cameraRequest != null) {
            if (granted) cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else cameraRequest.deny();
            cameraRequest = null;
        }
        if (pendingChooser != null) {
            WebChromeClient.FileChooserParams chooser = pendingChooser;
            pendingChooser = null;
            if (granted) launchChooser(chooser); else cancelFileCallback();
        }
    }

    private void launchChooser(WebChromeClient.FileChooserParams params) {
        try {
            Intent intent;
            acceptsJson = false;
            acceptsImages = false;
            for (String accepted : params.getAcceptTypes()) {
                if ("application/json".equals(accepted) || ".json".equals(accepted)) acceptsJson = true;
                if (accepted.startsWith("image/") || accepted.matches("(?i)\\.(jpg|jpeg|png|webp|gif)")) acceptsImages = true;
            }
            if (!acceptsJson && !acceptsImages) acceptsImages = true;
            if (params.isCaptureEnabled()) {
                acceptsImages = true;
                File directory = new File(getCacheDir(), "capture");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new java.io.IOException();
                capturedFile = File.createTempFile("photo-", ".jpg", directory);
                capturedPhoto = FileProvider.getUriForFile(this, BuildConfig.APPLICATION_ID + ".files", capturedFile);
                intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                intent.putExtra(MediaStore.EXTRA_OUTPUT, capturedPhoto);
                intent.setClipData(ClipData.newRawUri("", capturedPhoto));
                intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(acceptsJson && acceptsImages ? "*/*" : acceptsJson ? "application/json" : "image/*");
                if (acceptsJson && acceptsImages) intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "image/*"});
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
            startActivityForResult(intent, FILE_PICKER);
        } catch (ActivityNotFoundException | java.io.IOException | SecurityException unavailable) { cancelFileCallback(); }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == APK_PERMISSION) {
            if (apkUpdater != null) apkUpdater.permissionReturned(apkUpdater.permissionAttempt());
            return;
        }
        if (requestCode == APK_CONFIRMATION) {
            if (apkUpdater != null) apkUpdater.confirmationReturned(apkConfirmationAttempt, resultCode);
            apkConfirmationAttempt = "";
            return;
        }
        if (requestCode == ARCHIVE_DESTINATION) {
            finishArchiveDestination(resultCode, data);
            return;
        }
        if (requestCode != FILE_PICKER || fileCallback == null) return;
        ValueCallback<Uri[]> callback = fileCallback;
        fileCallback = null;
        Uri selected = resultCode == RESULT_OK ? (capturedPhoto != null ? capturedPhoto : data == null ? null : data.getData()) : null;
        if (selected != null && !"content".equals(selected.getScheme())) selected = null;
        if (selected != null) {
            try {
                String mime = getContentResolver().getType(selected);
                boolean accepted = acceptsImages && mime != null && mime.startsWith("image/");
                accepted |= acceptsJson && ("application/json".equals(mime) || "text/json".equals(mime));
                if (!accepted) selected = null;
            } catch (SecurityException unavailable) { selected = null; }
        }
        callback.onReceiveValue(selected == null ? null : new Uri[]{selected});
        if (capturedPhoto != null) revokeUriPermission(capturedPhoto, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        capturedPhoto = null;
        // Keep a returned capture until the next chooser or Activity destruction; WebView reads asynchronously.
        if (selected == null && capturedFile != null) { capturedFile.delete(); capturedFile = null; }
    }

    private CompletableFuture<Boolean> exportArchive() throws Exception {
        return exportDocument("mangoleaf-reports.json", "application/json", output -> store.writeArchive(output));
    }

    /** Bounded technical text only; the existing picker lifecycle handles cancel, close and write failures. */
    private CompletableFuture<Boolean> exportDiagnostics(String text) throws Exception {
        if (text.length() > 128 * 1024) throw new IllegalArgumentException("INVALID_ARGUMENT");
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > 128 * 1024) throw new IllegalArgumentException("INVALID_ARGUMENT");
        return exportDocument("MangoLeafAI-diagnostics-" + System.currentTimeMillis() + ".txt", "text/plain", output -> output.write(bytes));
    }

    private interface DocumentWriter { void write(OutputStream output) throws Exception; }

    /** Stage complete bytes before asking for an external destination; never truncate a file after a failed preparation. */
    private CompletableFuture<Boolean> exportDocument(String name, String mime, DocumentWriter writer) throws Exception {
        if (archiveExport != null) throw new IllegalStateException("BUSY");
        CompletableFuture<Boolean> result = new CompletableFuture<>();
        archiveExport = result;
        updateBusy();
        try {
            File directory = new File(getCacheDir(), "archives");
            if (!directory.isDirectory() && !directory.mkdirs()) throw new java.io.IOException();
            archiveFile = File.createTempFile("mangoleaf-", ".tmp", directory);
            // Finish and size-check a private file before opening a user-selected destination.
            // Invalid/oversized archives cannot truncate an existing external backup.
            try (OutputStream output = new FileOutputStream(archiveFile)) { writer.write(output); }
            runOnUiThread(() -> {
                if (destroyed || !foreground) { completeArchive(new IllegalStateException("CANCELLED")); return; }
                try {
                    Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                        .setType(mime).putExtra(Intent.EXTRA_TITLE, name);
                    create.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    startActivityForResult(create, ARCHIVE_DESTINATION);
                } catch (ActivityNotFoundException | SecurityException unavailable) { completeArchive(unavailable); }
            });
        } catch (Exception failure) { completeArchive(failure); }
        return result;
    }

    private void finishArchiveDestination(int resultCode, Intent data) {
        if (archiveExport == null) return;
        Uri destination = resultCode == RESULT_OK && data != null ? data.getData() : null;
        if (destination == null || !"content".equals(destination.getScheme())) {
            completeArchive(new IllegalStateException("CANCELLED"));
            return;
        }
        operations.execute(() -> {
            try (FileInputStream input = new FileInputStream(archiveFile);
                    OutputStream output = getContentResolver().openOutputStream(destination, "wt")) {
                if (output == null) throw new java.io.IOException();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                output.flush();
            } catch (Exception failure) { completeArchive(failure); return; }
            // Report completion only after closing the document stream successfully.
            completeArchive(null);
        });
    }

    private synchronized void completeArchive(Throwable failure) {
        CompletableFuture<Boolean> result = archiveExport;
        archiveExport = null;
        if (archiveFile != null) { archiveFile.delete(); archiveFile = null; }
        updateBusy();
        if (result != null) {
            if (failure == null) result.complete(true);
            else result.completeExceptionally(failure);
        }
    }

    private void updateBusy() { if (ota != null) ota.setBusy(applicationBusy || archiveExport != null || (apkUpdater != null && apkUpdater.busy())); }

    private void openExternal(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException ignored) { /* A missing external handler does not break local diagnosis. */ }
    }

    private void cancelCameraRequest() {
        if (cameraRequest != null) { cameraRequest.deny(); cameraRequest = null; }
    }

    private void cancelFileCallback() {
        pendingChooser = null;
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (capturedPhoto != null) revokeUriPermission(capturedPhoto, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        capturedPhoto = null;
        if (capturedFile != null) { capturedFile.delete(); capturedFile = null; }
    }

    private void showStartupFailure(boolean unsupportedWebView) {
        if (destroyed) return;
        TextView message = new TextView(this);
        message.setPadding(32, 48, 32, 48);
        message.setText(unsupportedWebView ? R.string.native_webview_unsupported : R.string.native_startup_error);
        setContentView(createInsetContent(this, message));
        ViewCompat.requestApplyInsets(message.getRootView());
    }

    @Override protected void onStart() {
        super.onStart();
        foreground = true;
        if (network != null) network.start();
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        if (apkUpdater != null) apkUpdater.permissionReturned(apkUpdater.permissionAttempt());
    }

    @Override protected void onPause() {
        // Android's camera permission dialog pauses this Activity without backgrounding it.
        // Hiding WebView here would cancel the very getUserMedia request the user is approving.
        if (webView != null && cameraRequest == null && pendingChooser == null) webView.onPause();
        super.onPause();
    }

    @Override protected void onStop() {
        foreground = false;
        // Leaving the app must still hide web content and release camera work, including a pending prompt.
        if (webView != null) webView.onPause();
        cancelCameraRequest();
        if (apkUpdater != null) apkUpdater.backgrounded();
        if (network != null) network.close();
        super.onStop();
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // The website link only opens this existing app. Never load its URI/extras in the trusted WebView.
    }

    @Override protected void onDestroy() {
        destroyed = true;
        completeArchive(new IllegalStateException("CANCELLED"));
        cancelCameraRequest();
        cancelFileCallback();
        if (network != null) network.close();
        if (apkUpdater != null) { apkUpdater.backgrounded(); apkUpdater.detach(this); }
        if (bridge != null) bridge.close();
        if (webView != null) { webView.stopLoading(); webView.destroy(); webView = null; }
        // SQLite and OTA remain process-owned. Ordinary Activity recreation retains the bundle;
        // only the guarded explicit restart releases selection before recreation.
        operations.execute(() -> { if (ota != null) ota.setBusy(apkUpdater != null && apkUpdater.busy()); });
        super.onDestroy();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putString("apkConfirmationAttempt", apkConfirmationAttempt);
        super.onSaveInstanceState(state);
    }
}
