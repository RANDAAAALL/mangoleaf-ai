package com.mangoleaf.ai.ota;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;
import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.json.JSONObject;

/** Stages authenticated web bundles; selection happens only on a cold host launch. */
public final class OtaManager implements AutoCloseable {
    private static final long CHECK_INTERVAL_MS = 15 * 60 * 1000L;
    private final Context context;
    private final OtaConfig config;
    private final File root;
    private final File bundles;
    private final AtomicFile stateFile;
    private final Object stateLock = new Object();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final OkHttpClient http = new OkHttpClient.Builder()
            .followRedirects(false).followSslRedirects(false)
            .connectTimeout(20, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS)
            .callTimeout(5, TimeUnit.MINUTES).build();
    private OtaState state;
    private volatile boolean busy;
    private volatile boolean ready;
    private volatile boolean closed;
    private volatile boolean cancelled;
    private volatile String status;
    private volatile Call call;
    private volatile Thread worker;
    private Future<?> task;
    private long lastCheck;
    private boolean selected;
    private boolean preparingRestart;
    private String launched = "";

    public OtaManager(Context context, OtaConfig config) throws Exception {
        this.context = context.getApplicationContext();
        this.config = config;
        root = new File(context.getFilesDir(), "web-updates");
        bundles = new File(root, "bundles");
        if (!bundles.isDirectory() && !bundles.mkdirs()) throw new IOException("Cannot create update storage.");
        stateFile = new AtomicFile(new File(root, "state.json"));
        state = readState();
        status = config.isEnabled() ? "idle" : "disabled";
    }

    /** Call once, off the UI thread, before constructing the bridge-enabled WebView. */
    public File getLaunchBundleDirectory() {
        synchronized (stateLock) {
            if (selected) return launched.isEmpty() ? null : new File(new File(bundles, launched), "web");
            selected = true;
            try {
                boolean recovering = state.selectLaunch(config.bundledSequence, id -> {
                    OtaProtocol.Manifest candidate = verifiedBundle(id);
                    return candidate == null ? null : candidate.sequence;
                });
                // Persist this before exposing code. A process death before ready acknowledgement
                // causes the next cold launch to select the prior known-good bundle.
                launched = state.active;
                state.beginLaunch();
                persistState();
                cleanupUnusedBundles();
                status = recovering ? "recovered" : launched.isEmpty() ? "using-bundled" : "launching-update";
                return launched.isEmpty() ? null : new File(new File(bundles, launched), "web");
            } catch (Exception failure) {
                // APK assets are immutable fallback. No database/photo directory is touched.
                launched = "";
                status = "using-bundled";
                return null;
            }
        }
    }

    public void markHealthy() {
        synchronized (stateLock) {
            if (!selected || closed || ready) return;
            try {
                state.markHealthy(launched);
                persistState();
                ready = true;
                status = config.isEnabled() ? "ready" : "disabled";
            } catch (Exception failure) {
                status = "health-save-failed";
            }
        }
    }

    /** Busy work includes capture, inference and any native save/delete/import operation. */
    public synchronized void setBusy(boolean value) {
        busy = value;
        if (value) {
            cancelled = true;
            Call running = call;
            if (running != null) running.cancel();
            // A cancelled Future reports done before its worker's cleanup ends. Retain ownership until finally returns.
            Thread runningWorker = worker;
            if (runningWorker != null) runningWorker.interrupt();
        }
    }

    public String getStatus() { return status; }

    /** Release only a failed first OTA launch; ordinary recreation and healthy bundles keep their selection. */
    public void rendererGone() {
        synchronized (stateLock) {
            if (!selected || ready || !state.isUnacknowledgedLaunch(launched)) return;
            // Keep the durable boot marker so the next Activity uses the normal verified rollback path.
            selected = false;
            launched = "";
            status = "recovery-pending";
        }
    }

    /** Hash off-thread without releasing the current selection while the host may still background. */
    public String prepareRestart() {
        return prepareRestart(id -> verifiedBundle(id) != null);
    }

    /** Keep disk verification outside both monitors so foreground/camera state can change without waiting on hashes. */
    String prepareRestart(Predicate<String> verifier) {
        final String candidate;
        synchronized (this) {
            synchronized (stateLock) {
                if (closed || busy || !ready || preparingRestart || state.pending.isEmpty()
                        || (task != null && !task.isDone())) return null;
                candidate = state.pending;
                preparingRestart = true;
            }
        }
        try {
            return verifier.test(candidate) ? candidate : null;
        } finally {
            synchronized (this) { preparingRestart = false; }
        }
    }

    /** Commit on the UI thread only after its final foreground/task checks, using the exact verified candidate. */
    public synchronized boolean commitRestart(String verifiedPending, boolean hostIdle) {
        synchronized (stateLock) {
            if (!hostIdle || closed || busy || !ready || preparingRestart || verifiedPending == null
                    || verifiedPending.isEmpty() || !state.pending.equals(verifiedPending)
                    || (task != null && !task.isDone())) return false;
            // Activation and its rollback marker still happen in getLaunchBundleDirectory, before new web code loads.
            selected = false;
            ready = false;
            launched = "";
            lastCheck = 0;
            status = "restarting";
            return true;
        }
    }

    public synchronized void checkForUpdates() {
        if (closed || !config.isEnabled()) { status = "disabled"; return; }
        if (busy || !ready || preparingRestart || (task != null && !task.isDone())) return;
        if (!networkValidated()) { status = "waiting-for-network"; return; }
        long now = android.os.SystemClock.elapsedRealtime();
        if (lastCheck != 0 && now - lastCheck < CHECK_INTERVAL_MS) return;
        lastCheck = now;
        cancelled = false;
        task = executor.submit(() -> {
            worker = Thread.currentThread();
            try {
                ensureIdle();
                status = "checking";
                byte[] metadata = downloadSmall(config.metadataUrl, OtaProtocol.MAX_METADATA_BYTES);
                byte[] signature = downloadSmall(config.signatureUrl, 2048);
                OtaProtocol.Manifest manifest = OtaProtocol.authenticate(metadata, signature, config);
                synchronized (stateLock) {
                    if (manifest.sequence <= state.highWater) { status = state.currentStatus(); return; }
                }
                if (root.getUsableSpace() < manifest.archiveBytes + manifest.expandedBytes + 32L * 1024 * 1024) {
                    throw new IOException("Insufficient update storage.");
                }
                stage(manifest, metadata, signature);
            } catch (Exception failure) {
                status = busy || closed || cancelled || Thread.currentThread().isInterrupted() ? "deferred" : "check-failed";
                // Only bounded status codes cross the bridge; raw exceptions can contain URLs.
            } finally {
                call = null;
                worker = null;
                Thread.interrupted();
            }
        });
    }

    private void stage(OtaProtocol.Manifest manifest, byte[] metadata, byte[] signature) throws Exception {
        File staging = new File(root, "staging");
        File archive = new File(root, "download.part");
        ensureIdle();
        deleteOwned(staging);
        deleteOwned(archive);
        if (!staging.mkdir()) throw new IOException("Cannot prepare update staging.");
        try {
            status = "downloading";
            try (Response response = request(manifest.archiveUrl);
                    InputStream input = requireBody(response).byteStream();
                    FileOutputStream output = new FileOutputStream(archive)) {
                long length = response.body().contentLength();
                if (length != -1 && length != manifest.archiveBytes) throw new IOException("Archive size differs.");
                long total = 0;
                byte[] buffer = new byte[32768];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    ensureIdle();
                    total += read;
                    if (total > manifest.archiveBytes) throw new IOException("Download exceeds signed size.");
                    output.write(buffer, 0, read);
                }
                output.getFD().sync();
                if (total != manifest.archiveBytes) throw new IOException("Download is incomplete.");
            }
            ensureIdle();
            status = "verifying";
            OtaArchive.extract(archive, new File(staging, "web"), manifest);
            writeDurable(new File(staging, "update.json"), metadata);
            writeDurable(new File(staging, "update.sig"), signature);
            ensureIdle();
            synchronized (stateLock) {
                ensureIdle();
                if (manifest.sequence <= state.highWater) throw new IOException("Update sequence is stale.");
                File destination = new File(bundles, manifest.id);
                if (destination.exists()) deleteOwned(destination);
                if (!staging.renameTo(destination)) throw new IOException("Cannot commit staged update.");
                state.stage(manifest.id, manifest.sequence);
                persistState();
                cleanupUnusedBundles();
                status = "staged";
            }
        } finally {
            deleteOwned(staging);
            deleteOwned(archive);
        }
    }

    private boolean networkValidated() {
        ConnectivityManager manager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return false;
        Network network = manager.getActiveNetwork();
        NetworkCapabilities capabilities = network == null ? null : manager.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    private byte[] downloadSmall(String url, int limit) throws Exception {
        ensureIdle();
        try (Response response = request(url); InputStream input = requireBody(response).byteStream()) {
            if (response.body().contentLength() > limit) throw new IOException("Response exceeds limits.");
            return OtaProtocol.readBounded(input, limit);
        }
    }

    private Response request(String initialUrl) throws Exception {
        OtaProtocol.requireReleaseUrl(initialUrl, config.repository, true);
        URI url = new URI(initialUrl);
        for (int redirects = 0; redirects < 4; redirects++) {
            ensureIdle();
            call = http.newCall(new Request.Builder().url(url.toString())
                    .header("Accept-Encoding", "identity").header("Cache-Control", "no-cache")
                    .header("User-Agent", "MangoLeaf-Android-OTA/1").build());
            Response response = call.execute();
            int code = response.code();
            if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                String location = response.header("Location");
                response.close();
                if (location == null) throw new IOException("Missing redirect location.");
                URI next = url.resolve(location);
                if (!"https".equals(next.getScheme()) || next.getUserInfo() != null
                        || next.getPort() != -1 || next.getRawFragment() != null) throw new IOException("Unsafe update redirect.");
                if ("github.com".equals(next.getHost())) {
                    OtaProtocol.requireReleaseUrl(next.toString(), config.repository, true);
                } else if (!"release-assets.githubusercontent.com".equals(next.getHost())) {
                    throw new IOException("Update redirect host is not allowed.");
                }
                url = next;
                continue;
            }
            if (code != 200 || response.body() == null
                    || response.header("Content-Encoding", "identity").equalsIgnoreCase("gzip")) {
                response.close();
                throw new IOException("Update host did not provide an ordinary complete response.");
            }
            return response;
        }
        throw new IOException("Too many update redirects.");
    }

    private static ResponseBody requireBody(Response response) throws IOException {
        if (response.body() == null) throw new IOException("Missing response body.");
        return response.body();
    }

    private void ensureIdle() throws IOException {
        if (busy || closed || cancelled || Thread.currentThread().isInterrupted()) throw new IOException("Update deferred while app is busy.");
    }

    private OtaProtocol.Manifest verifiedBundle(String id) {
        if (!validId(id)) return null;
        try {
            File directory = new File(bundles, id);
            byte[] metadata;
            byte[] signature;
            try (InputStream input = new FileInputStream(new File(directory, "update.json"))) {
                metadata = OtaProtocol.readBounded(input, OtaProtocol.MAX_METADATA_BYTES);
            }
            try (InputStream input = new FileInputStream(new File(directory, "update.sig"))) {
                signature = OtaProtocol.readBounded(input, 2048);
            }
            OtaProtocol.Manifest manifest = OtaProtocol.authenticate(metadata, signature, config);
            if (!manifest.id.equals(id) || manifest.sequence <= config.bundledSequence) return null;
            OtaProtocol.verifyDirectory(new File(directory, "web"), manifest);
            return manifest;
        } catch (Exception invalid) {
            return null;
        }
    }

    private OtaState readState() {
        try {
            JSONObject json = new JSONObject(new String(stateFile.readFully(), StandardCharsets.UTF_8));
            OtaState restored = new OtaState(Math.max(config.bundledSequence,
                    OtaProtocol.integer(json, "highWater", 1, OtaProtocol.MAX_SEQUENCE)));
            restored.active = pointer(json.optString("active"));
            restored.previous = pointer(json.optString("previous"));
            restored.pending = pointer(json.optString("pending"));
            restored.booting = pointer(json.optString("booting"));
            return restored;
        } catch (Exception missingOrCorrupt) {
            return new OtaState(config.bundledSequence);
        }
    }

    private void persistState() throws Exception {
        JSONObject json = new JSONObject();
        json.put("highWater", state.highWater);
        json.put("active", state.active);
        json.put("previous", state.previous);
        json.put("pending", state.pending);
        json.put("booting", state.booting);
        FileOutputStream output = null;
        try {
            output = stateFile.startWrite();
            output.write(json.toString().getBytes(StandardCharsets.UTF_8));
            stateFile.finishWrite(output);
        } catch (Exception failure) {
            if (output != null) stateFile.failWrite(output);
            throw failure;
        }
    }

    private static boolean validId(String id) { return id != null && id.matches("[1-9][0-9]{0,15}-[a-f0-9]{16}"); }
    private static String pointer(String id) throws IOException {
        if (id.isEmpty() || validId(id)) return id;
        throw new IOException("Invalid update pointer.");
    }

    private void cleanupUnusedBundles() throws IOException {
        Set<String> retained = new HashSet<>();
        retained.add(state.active);
        retained.add(state.previous);
        retained.add(state.pending);
        File[] directories = bundles.listFiles();
        if (directories == null) return;
        for (File directory : directories) if (!retained.contains(directory.getName())) deleteOwned(directory);
        deleteOwned(new File(root, "staging"));
        deleteOwned(new File(root, "download.part"));
    }

    private void deleteOwned(File file) throws IOException {
        if (!file.exists()) return;
        String path = file.getCanonicalPath();
        if (!path.startsWith(root.getCanonicalPath() + File.separator)
                || !path.equals(file.getAbsolutePath())) throw new IOException("Refusing to remove a non-update path.");
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children == null) throw new IOException("Cannot read update directory.");
            for (File child : children) deleteOwned(child);
        }
        if (!file.delete()) throw new IOException("Cannot remove old update file.");
    }

    private static void writeDurable(File file, byte[] content) throws IOException {
        try (FileOutputStream output = new FileOutputStream(file)) {
            output.write(content);
            output.getFD().sync();
        }
    }

    @Override public synchronized void close() {
        closed = true;
        cancelled = true;
        Call running = call;
        if (running != null) running.cancel();
        executor.shutdownNow();
        http.dispatcher().executorService().shutdown();
        http.connectionPool().evictAll();
    }
}
