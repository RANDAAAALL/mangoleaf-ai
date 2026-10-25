package com.mangoleaf.ai;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.json.JSONObject;

/** Native self-update owns only its private temporary installer and its own PackageInstaller session. */
final class ApkUpdateManager {
    interface Host {
        boolean canUpdate();
        boolean connected();
        void changed(JSONObject snapshot);
        void permission(String id);
        void confirmation(String id, Intent intent);
    }

    static final String CALLBACK_ACTION = "com.mangoleaf.ai.APK_UPDATE_STATUS";
    private final Context context;
    private final File root;
    private final SharedPreferences preferences;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final OkHttpClient http = new OkHttpClient.Builder().followRedirects(false).followSslRedirects(false).retryOnConnectionFailure(false)
        .connectTimeout(15, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS)
        .callTimeout(ApkUpdatePolicy.DEADLINE_MS, TimeUnit.MILLISECONDS).build();
    private final ApkUpdateState state = new ApkUpdateState();
    private Host host;
    private volatile Call call;
    private File installer;
    private ApkUpdatePolicy.Release release;
    private int sessionId = -1;
    private boolean externalUi;
    private boolean permissionPending;
    private long started;

    ApkUpdateManager(Context context) throws Exception {
        this.context = context.getApplicationContext();
        root = new File(context.getCacheDir(), "apk-update").getCanonicalFile();
        if (!root.getParentFile().equals(context.getCacheDir().getCanonicalFile())) throw new IOException("INVALID_UPDATE");
        preferences = context.getSharedPreferences("native-apk-update", Context.MODE_PRIVATE);
        // A process that died before completing its installer has no authority to resume it automatically.
        int staleSession = preferences.getInt("session", -1);
        if (staleSession >= 0) abandon(staleSession);
        preferences.edit().remove("session").apply();
        if (!root.isDirectory() && !root.mkdirs()) throw new IOException("STORAGE_UNAVAILABLE");
        File[] staleFiles = root.listFiles();
        if (staleFiles != null) for (File stale : staleFiles) {
            if (stale.isFile() && stale.getCanonicalFile().getParentFile().equals(root)) stale.delete();
        }
    }

    static boolean supported() { return !BuildConfig.DEBUG && "production".equals(BuildConfig.CLOUD_ENVIRONMENT); }
    synchronized void attach(Host current) { host = current; }
    synchronized void detach(Host current) { if (host == current) host = null; }
    synchronized boolean busy() { return state.active(); }

    synchronized JSONObject start(String id, String tag, String version) throws Exception {
        requireSupported(); ApkUpdatePolicy.requireRequest(tag, version);
        if (host == null || !host.canUpdate() || !host.connected()) throw new IllegalStateException("BUSY");
        if (!ApkUpdatePolicy.newer(version, BuildConfig.VERSION_NAME)) throw new IllegalArgumentException("INVALID_ARGUMENT");
        state.start(id, version);
        installer = new File(root, id + ".apk"); release = null; started = SystemClock.elapsedRealtime();
        externalUi = false; permissionPending = false;
        worker.execute(() -> download(id, tag, version));
        publish();
        return state.snapshot(id);
    }

    synchronized JSONObject snapshot(String id) throws Exception { ApkUpdatePolicy.requireId(id); return state.snapshot(id); }

    synchronized JSONObject cancel(String id) throws Exception {
        ApkUpdatePolicy.requireId(id);
        // After Android confirmation is presented, Android owns its install/cancel decision.
        if (state.owns(id) && state.status.equals("installing") && externalUi && !permissionPending) return state.snapshot(id);
        cancelAttempt(id, "");
        return state.snapshot(id);
    }

    synchronized JSONObject install(String id) throws Exception {
        requireSupported(); ApkUpdatePolicy.requireId(id);
        if (!state.owns(id) || state.cancelled(id)) return state.snapshot(id);
        if (state.status.equals("installing")) return state.snapshot(id);
        if (!state.status.equals("ready") || host == null || !host.canUpdate() || !host.connected()) throw new IllegalStateException("BUSY");
        state.status = "installing";
        worker.execute(() -> prepareSession(id));
        publish();
        return state.snapshot(id);
    }

    synchronized void networkChanged(boolean connected) {
        if (!connected && (state.status.equals("downloading") || state.status.equals("verifying") || state.status.equals("ready"))) cancelAttempt(state.id, "OFFLINE");
    }

    synchronized void backgrounded() {
        if (state.active() && !(state.status.equals("installing") && externalUi)) cancelAttempt(state.id, "");
    }

    synchronized String permissionAttempt() { return permissionPending ? state.id : ""; }

    synchronized void permissionReturned(String id) {
        if (!state.owns(id) || !permissionPending || !state.status.equals("installing")) return;
        permissionPending = false; externalUi = false;
        if (!context.getPackageManager().canRequestPackageInstalls()) {
            cancelAttempt(state.id, "PERMISSION_DENIED");
        } else {
            started = SystemClock.elapsedRealtime();
            worker.execute(() -> prepareSession(id));
        }
    }

    synchronized void confirmationReturned(String id, int result) {
        if (!state.owns(id) || !state.status.equals("installing") || permissionPending) return;
        if (result == Activity.RESULT_CANCELED) cancelAttempt(state.id, "");
        // RESULT_OK means approval, not successful replacement. Await PackageInstaller's final result.
    }

    void receive(Intent intent) {
        synchronized (this) {
            if (!supported() || !CALLBACK_ACTION.equals(intent.getAction()) || intent.getData() == null
                    || !("mangoleaf-apk-update:" + state.id).equals(intent.getDataString())
                    || intent.getIntExtra(PackageInstaller.EXTRA_SESSION_ID, -1) != sessionId
                    || !state.status.equals("installing")) return;
            int result = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (result == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirmation = Build.VERSION.SDK_INT >= 33
                    ? intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent.class)
                    : legacyIntent(intent);
                String id = state.id;
                main.post(() -> showConfirmation(id, confirmation));
            } else if (result == PackageInstaller.STATUS_SUCCESS) {
                // Self replacement normally terminates this process. Never show success from a download/approval.
                try {
                    PackageInfo current = installed(context.getPackageManager());
                    if (current == null || !state.version.equals(current.versionName)
                            || code(current) <= BuildConfig.VERSION_CODE) throw new IOException("INSTALL_FAILED");
                    cleanup();
                    state.status = "installed"; externalUi = false; publish();
                } catch (Exception failure) { fail(state.id, "INSTALL_FAILED"); }
            } else if (result == PackageInstaller.STATUS_FAILURE_ABORTED) {
                cancelAttempt(state.id, "");
            } else fail(state.id, "INSTALL_FAILED");
        }
    }

    @SuppressWarnings("deprecation")
    private static Intent legacyIntent(Intent intent) { return intent.getParcelableExtra(Intent.EXTRA_INTENT); }

    private void download(String id, String tag, String version) {
        File destination = new File(root, id + ".apk");
        try {
            String metadataAddress = ApkUpdatePolicy.metadataUrl(tag);
            byte[] metadata;
            try (Response response = request(id, metadataAddress, metadataAddress, true, true)) {
                ResponseBody body = response.body();
                String type = response.header("Content-Type", "").split(";", 2)[0].trim().toLowerCase(java.util.Locale.ROOT);
                if (body == null || !Set.of("application/json", "application/vnd.github+json").contains(type)
                        || body.contentLength() > ApkUpdatePolicy.MAX_METADATA) throw new IOException("INVALID_UPDATE");
                metadata = bounded(id, body.byteStream(), ApkUpdatePolicy.MAX_METADATA);
            }
            ApkUpdatePolicy.Release verified = ApkUpdatePolicy.release(new JSONObject(new String(metadata, StandardCharsets.UTF_8)), tag, version);
            synchronized (this) { checkTransfer(id); release = verified; state.total = verified.bytes(); publish(); }
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (Response response = request(id, verified.url(), verified.url(), false, true)) {
                ResponseBody body = response.body();
                String type = response.header("Content-Type", "").split(";", 2)[0].trim().toLowerCase(java.util.Locale.ROOT);
                if (body == null || !Set.of("application/vnd.android.package-archive", "application/octet-stream").contains(type)
                        || (body.contentLength() != -1 && body.contentLength() != verified.bytes())) throw new IOException("INVALID_UPDATE");
                synchronized (this) {
                    checkTransfer(id);
                    if (!destination.getCanonicalFile().getParentFile().equals(root) || destination.exists()) throw new IOException("INVALID_UPDATE");
                }
                try (InputStream input = body.byteStream(); FileOutputStream output = new FileOutputStream(destination)) {
                    byte[] bytes = new byte[64 * 1024]; int count; long written = 0;
                    while ((count = input.read(bytes)) != -1) {
                        synchronized (this) { checkTransfer(id); }
                        written += count;
                        if (written > verified.bytes()) throw new IOException("INVALID_UPDATE");
                        output.write(bytes, 0, count); digest.update(bytes, 0, count);
                        synchronized (this) { checkTransfer(id); state.downloaded = written; }
                    }
                    output.getFD().sync();
                    if (written != verified.bytes()) throw new IOException("INVALID_UPDATE");
                }
            }
            if (!verified.digest().isEmpty() && !hex(digest.digest()).equals(verified.digest())) throw new IOException("INVALID_UPDATE");
            synchronized (this) { checkTransfer(id); state.status = "verifying"; publish(); }
            verifyApk(destination, version);
            synchronized (this) { checkTransfer(id); state.status = "ready"; publish(); }
        } catch (Exception failure) {
            synchronized (this) { fail(id, failure instanceof java.net.SocketTimeoutException ? "TIMEOUT" : "INVALID_UPDATE".equals(failure.getMessage()) ? "INVALID_UPDATE" : "DOWNLOAD_FAILED"); }
        } finally {
            synchronized (this) {
                // A cancel can race file creation, or a newer attempt can own the manager by this point.
                if (state.cancelled(id)) destination.delete();
            }
        }
    }

    private Response request(String id, String address, String original, boolean metadata, boolean initial) throws Exception {
        for (int redirects = 0; redirects <= 3; redirects++) {
            synchronized (this) { checkTransfer(id); }
            if (metadata) {
                if (!address.equals(original)) throw new IOException("INVALID_UPDATE");
            } else ApkUpdatePolicy.requireDownloadUrl(address, original, initial);
            Request request = new Request.Builder().url(address).header("Accept", metadata ? "application/vnd.github+json" : "application/octet-stream")
                .header("Accept-Encoding", "identity").header("User-Agent", "MangoLeafAI-Android-Updater").build();
            Call current = http.newCall(request);
            synchronized (this) { checkTransfer(id); call = current; }
            Response response = current.execute();
            try { synchronized (this) { checkTransfer(id); } }
            catch (Exception failure) { response.close(); throw failure; }
            if (Set.of(301, 302, 303, 307, 308).contains(response.code())) {
                String location = response.header("Location"); response.close();
                if (metadata || redirects == 3 || location == null) throw new IOException("INVALID_UPDATE");
                address = new URI(address).resolve(location).toString(); initial = false;
            } else {
                if (!response.isSuccessful() || response.code() != 200) { response.close(); throw new IOException("DOWNLOAD_FAILED"); }
                return response;
            }
        }
        throw new IOException("INVALID_UPDATE");
    }

    private byte[] bounded(String id, InputStream input, int limit) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] chunk = new byte[8192]; int count;
        while ((count = input.read(chunk)) != -1) {
            synchronized (this) { checkTransfer(id); }
            if (output.size() + count > limit) throw new IOException("INVALID_UPDATE");
            output.write(chunk, 0, count);
        }
        return output.toByteArray();
    }

    private void prepareSession(String id) {
        try {
            File apk; ApkUpdatePolicy.Release verified;
            synchronized (this) { checkTransfer(id); apk = installer; verified = release; }
            verifyApk(apk, verified.version());
            if (!context.getPackageManager().canRequestPackageInstalls()) {
                main.post(() -> requestPermission(id));
                return;
            }
            PackageInstaller installerService = context.getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName(ApkUpdatePolicy.PACKAGE); params.setSize(apk.length());
            if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
            int created = installerService.createSession(params);
            synchronized (this) {
                if (state.cancelled(id)) { abandon(created); return; }
                sessionId = created;
                if (!preferences.edit().putInt("session", created).commit()) throw new IOException("INSTALL_FAILED");
            }
            try (PackageInstaller.Session session = installerService.openSession(created);
                    InputStream input = new FileInputStream(apk); OutputStream output = session.openWrite("base.apk", 0, apk.length())) {
                byte[] bytes = new byte[64 * 1024]; int count;
                while ((count = input.read(bytes)) != -1) { synchronized (this) { checkTransfer(id); } output.write(bytes, 0, count); }
                session.fsync(output);
            }
            commit(id);
        } catch (Exception failure) { synchronized (this) { fail(id, "INSTALL_FAILED"); } }
    }

    private synchronized void requestPermission(String id) {
        try {
            checkTransfer(id);
            if (host == null || !host.canUpdate()) throw new IOException("CANCELLED");
            if (context.getPackageManager().canRequestPackageInstalls()) worker.execute(() -> prepareSession(id));
            else { permissionPending = true; externalUi = true; publish(); host.permission(id); }
        } catch (Exception failure) { fail(id, "INSTALL_FAILED"); }
    }

    private void commit(String id) {
        synchronized (this) {
            try {
                checkTransfer(id);
                if (host == null || !host.canUpdate() || !context.getPackageManager().canRequestPackageInstalls()) throw new IOException("CANCELLED");
                Intent callback = new Intent(context, ApkUpdateReceiver.class).setAction(CALLBACK_ACTION)
                    .setData(Uri.parse("mangoleaf-apk-update:" + id));
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                PendingIntent result = PendingIntent.getBroadcast(context, sessionId, callback, flags);
                try (PackageInstaller.Session session = context.getPackageManager().getPackageInstaller().openSession(sessionId)) {
                    session.commit(result.getIntentSender());
                }
                publish();
            } catch (Exception failure) { fail(id, "INSTALL_FAILED"); }
        }
    }

    private synchronized void showConfirmation(String id, Intent intent) {
        try {
            if (state.cancelled(id) || !state.status.equals("installing")) return;
            if (host == null || !host.canUpdate() || intent == null
                    || !"android.content.pm.action.CONFIRM_INSTALL".equals(intent.getAction())
                    || intent.getIntExtra(PackageInstaller.EXTRA_SESSION_ID, -1) != sessionId) throw new IOException("INSTALL_FAILED");
            ResolveInfo target = context.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (target == null || target.activityInfo == null || (target.activityInfo.applicationInfo.flags
                    & (ApplicationInfo.FLAG_SYSTEM | ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) == 0) throw new IOException("INSTALL_FAILED");
            // Pin the resolved system confirmation component before launching it; never navigate the WebView.
            intent.setClassName(target.activityInfo.packageName, target.activityInfo.name);
            externalUi = true; permissionPending = false; publish(); host.confirmation(id, intent);
        } catch (Exception failure) { fail(id, "INSTALL_FAILED"); }
    }

    private void verifyApk(File apk, String expected) throws Exception {
        if (apk == null || !apk.getCanonicalFile().getParentFile().equals(root) || !apk.isFile()) throw new IOException("INVALID_UPDATE");
        PackageManager manager = context.getPackageManager();
        PackageInfo downloaded = archive(manager, apk.getAbsolutePath());
        PackageInfo installed = installed(manager);
        if (downloaded == null || installed == null) throw new IOException("INVALID_UPDATE");
        String pin;
        try (InputStream input = context.getAssets().open("production-trust.json")) {
            byte[] bytes = boundedTrust(input);
            JSONObject trust = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            if (trust.getInt("format") != 1) throw new IOException("INVALID_UPDATE");
            pin = trust.getString("certificateSha256");
        }
        ApkUpdatePolicy.requireIdentity(downloaded.packageName, downloaded.versionName, code(downloaded), installed.versionName,
            code(installed), expected, signers(downloaded), signers(installed), pin);
    }

    @SuppressWarnings("deprecation")
    static PackageInfo archive(PackageManager manager, String path) {
        // Android's archive parser collects certificates with skipVerify=false; malformed/tampered APKs return null.
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        return Build.VERSION.SDK_INT >= 33 ? manager.getPackageArchiveInfo(path, PackageManager.PackageInfoFlags.of(flags)) : manager.getPackageArchiveInfo(path, flags);
    }

    @SuppressWarnings("deprecation")
    private PackageInfo installed(PackageManager manager) throws Exception {
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        return Build.VERSION.SDK_INT >= 33 ? manager.getPackageInfo(context.getPackageName(), PackageManager.PackageInfoFlags.of(flags)) : manager.getPackageInfo(context.getPackageName(), flags);
    }

    @SuppressWarnings("deprecation")
    private static long code(PackageInfo info) { return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode; }

    @SuppressWarnings("deprecation")
    private static Set<String> signers(PackageInfo info) throws Exception {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28
            ? info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners() : info.signatures;
        Set<String> result = new HashSet<>();
        if (signatures != null) for (Signature signature : signatures) result.add(hex(MessageDigest.getInstance("SHA-256").digest(signature.toByteArray())));
        return result;
    }

    private static byte[] boundedTrust(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] bytes = new byte[2048]; int count;
        while ((count = input.read(bytes)) != -1) { if (output.size() + count > 16 * 1024) throw new IOException("INVALID_UPDATE"); output.write(bytes, 0, count); }
        return output.toByteArray();
    }

    private synchronized void checkTransfer(String id) throws IOException {
        if (state.cancelled(id)) throw new IOException("CANCELLED");
        if (SystemClock.elapsedRealtime() - started > ApkUpdatePolicy.DEADLINE_MS) throw new java.net.SocketTimeoutException();
        if (host == null || !host.canUpdate() || !host.connected()) throw new IOException("CANCELLED");
    }

    private synchronized void cancelAttempt(String id, String reason) {
        try { state.cancel(id); } catch (IOException invalid) { return; }
        if (state.owns(id)) {
            state.error = reason;
            Call running = call; if (running != null) running.cancel();
            cleanup(); externalUi = false; permissionPending = false; publish();
        }
    }

    private synchronized void fail(String id, String error) {
        if (!state.owns(id) || state.status.equals("cancelled")) return;
        state.fail(id, error); cleanup(); externalUi = false; permissionPending = false; publish();
    }

    private void cleanup() {
        int pending = sessionId; sessionId = -1;
        if (pending >= 0) abandon(pending);
        preferences.edit().remove("session").apply(); cleanupFile();
    }

    private void cleanupFile() { if (installer != null) { installer.delete(); installer = null; } }
    private void abandon(int id) { try { context.getPackageManager().getPackageInstaller().abandonSession(id); } catch (RuntimeException ignored) { /* Completed sessions already disappeared. */ } }
    private static void requireSupported() { if (!supported()) throw new IllegalStateException("METHOD_NOT_ALLOWED"); }
    private static String hex(byte[] bytes) { StringBuilder text = new StringBuilder(bytes.length * 2); for (byte b : bytes) text.append(String.format(java.util.Locale.ROOT, "%02x", b & 255)); return text.toString(); }

    private synchronized void publish() {
        if (host == null || state.id.isEmpty()) return;
        try { JSONObject snapshot = state.snapshot(state.id); Host receiver = host; main.post(() -> receiver.changed(snapshot)); }
        catch (Exception ignored) { /* Telemetry/rendering cannot change installer state. */ }
    }
}
