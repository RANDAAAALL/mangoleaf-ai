package com.mangoleaf.ai.ota;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.ContextWrapper;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Each manager uses a fresh cache sandbox and an ephemeral key, never installed reports or publisher secrets. */
@RunWith(AndroidJUnit4.class)
public final class OtaLifecycleTest {
    private File directory;
    private File candidate;
    private OtaManager manager;
    private OtaState state;
    private String candidateId;

    @Before public void create() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        directory = Files.createTempDirectory(context.getCacheDir().toPath(), "ota-lifecycle-").toFile();
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(3072);
        KeyPair key = generator.generateKeyPair();
        Map<String, byte[]> files = new TreeMap<>();
        files.put("index.html", bytes("<html>isolated fixture</html>"));
        files.put("model/model.json", bytes("{}"));
        files.put("model/model_config.json", bytes("{}"));
        JSONArray inventory = new JSONArray();
        StringBuilder model = new StringBuilder();
        for (Map.Entry<String, byte[]> entry : files.entrySet()) {
            String hash = OtaProtocol.hash(entry.getValue());
            inventory.put(new JSONObject().put("path", entry.getKey()).put("bytes", entry.getValue().length).put("sha256", hash));
            if (entry.getKey().startsWith("model/")) model.append(entry.getKey()).append('\t')
                .append(entry.getValue().length).append('\t').append(hash).append('\n');
        }
        String modelIdentity = OtaProtocol.hash(bytes(model.toString()));
        JSONObject descriptor = new JSONObject().put("protocol", 1).put("sequence", 2).put("bundleVersion", "0.8.0")
            .put("nativeHostMin", 4).put("nativeHostMax", 4).put("bridgeVersion", 1).put("schemaVersion", 1)
            .put("modelIdentity", modelIdentity).put("sourceCommit", "a".repeat(40)).put("files", inventory);
        byte[] descriptorBytes = bytes(descriptor.toString());
        JSONObject metadata = new JSONObject(descriptor.toString());
        metadata.remove("files");
        metadata.put("archiveUrl", "https://github.com/example/mangoleaf/releases/download/fixture/web-update.zip")
            .put("archiveSha256", "a".repeat(64)).put("archiveBytes", 1)
            .put("expandedBytes", descriptorBytes.length + files.values().stream().mapToInt(value -> value.length).sum())
            .put("descriptorSha256", OtaProtocol.hash(descriptorBytes)).put("fileCount", files.size() + 1);
        byte[] metadataBytes = bytes(metadata.toString());
        OtaConfig config = new OtaConfig("", "", "example/mangoleaf", Base64.getEncoder().encodeToString(key.getPublic().getEncoded()),
            4, 1, 1, modelIdentity, 1);
        Context isolated = new ContextWrapper(context) {
            @Override public File getFilesDir() { return directory; }
        };
        manager = new OtaManager(isolated, config);
        java.lang.reflect.Field field = OtaManager.class.getDeclaredField("state");
        field.setAccessible(true);
        state = (OtaState) field.get(manager);
        candidateId = "2-" + "a".repeat(16);
        candidate = new File(directory, "web-updates/bundles/" + candidateId + "/web");
        assertTrue(candidate.mkdirs());
        for (Map.Entry<String, byte[]> entry : files.entrySet()) {
            File file = new File(candidate, entry.getKey());
            file.getParentFile().mkdirs();
            Files.write(file.toPath(), entry.getValue());
        }
        Files.write(new File(candidate, "android-bundle.json").toPath(), descriptorBytes);
        Files.write(new File(candidate.getParentFile(), "update.json").toPath(), metadataBytes);
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(key.getPrivate());
        signature.update(metadataBytes);
        Files.write(new File(candidate.getParentFile(), "update.sig").toPath(), Base64.getEncoder().encode(signature.sign()));
    }

    @After public void close() throws Exception {
        if (manager != null) manager.close();
        if (directory != null) {
            try (java.util.stream.Stream<java.nio.file.Path> paths = Files.walk(directory.toPath())) {
                for (java.nio.file.Path path : paths.sorted(java.util.Comparator.reverseOrder()).collect(java.util.stream.Collectors.toList())) Files.delete(path);
            }
        }
    }

    private static byte[] bytes(String value) { return value.getBytes(StandardCharsets.UTF_8); }

    private Object field(String name) throws ReflectiveOperationException {
        java.lang.reflect.Field field = OtaManager.class.getDeclaredField(name);
        field.setAccessible(true);
        return field.get(manager);
    }

    private void setField(String name, Object value) throws ReflectiveOperationException {
        java.lang.reflect.Field field = OtaManager.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(manager, value);
    }

    /** A launch can retain its selection while a fresh update finishes staging later in the same process. */
    private String prepareFromHealthyBundledSelection() {
        // Stage before selecting so launch cleanup retains the fixture, then hold it for an explicit restart.
        state.pending = candidateId;
        state.highWater = 2;
        state.active = "";
        try {
            java.lang.reflect.Field selected = OtaManager.class.getDeclaredField("selected");
            selected.setAccessible(true);
            selected.setBoolean(manager, true);
        } catch (ReflectiveOperationException error) { throw new AssertionError(error); }
        manager.markHealthy();
        String verified = manager.prepareRestart();
        assertEquals(candidateId, verified);
        assertNull(manager.getLaunchBundleDirectory());
        return verified;
    }

    @Test public void rejectedFinalHostGuardPreservesSelectionAndPendingUpdate() {
        String verified = prepareFromHealthyBundledSelection();
        assertFalse(manager.commitRestart(verified, false));
        assertNull(manager.getLaunchBundleDirectory());
        assertEquals(candidateId, state.pending);
        assertTrue(manager.commitRestart(verified, true));
        assertEquals(candidate, manager.getLaunchBundleDirectory());
    }

    @Test public void lateBusyStateOrChangedCandidateCannotCommitEarlierVerification() {
        String verified = prepareFromHealthyBundledSelection();
        manager.setBusy(true);
        assertFalse(manager.commitRestart(verified, true));
        manager.setBusy(false);
        state.pending = "3-" + "b".repeat(16);
        assertFalse(manager.commitRestart(verified, true));
        assertNull(manager.getLaunchBundleDirectory());
    }

    @Test public void blockedRestartVerificationCannotBlockHostGuardsOrReleaseSelection() throws Exception {
        String verified = prepareFromHealthyBundledSelection();
        CountDownLatch hashing = new CountDownLatch(1);
        CountDownLatch releaseHash = new CountDownLatch(1);
        ExecutorService verification = Executors.newSingleThreadExecutor();
        ExecutorService host = Executors.newSingleThreadExecutor();
        Future<String> preparation = verification.submit(() -> manager.prepareRestart(id -> {
            hashing.countDown();
            try { releaseHash.await(); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); return false; }
            return verified.equals(id);
        }));
        try {
            assertTrue(hashing.await(5, TimeUnit.SECONDS));
            // These calls model host/UI work while even a slow disk verification remains blocked.
            Future<Boolean> responsive = host.submit(() -> {
                manager.setBusy(true);
                manager.rendererGone();
                manager.setBusy(false);
                assertFalse(manager.commitRestart(verified, true));
                assertNull(manager.getLaunchBundleDirectory());
                return true;
            });
            assertTrue(responsive.get(2, TimeUnit.SECONDS));
        } finally {
            releaseHash.countDown();
            verification.shutdown();
            host.shutdown();
        }
        assertEquals(verified, preparation.get(5, TimeUnit.SECONDS));
        // A final background/busy host decision still rejects the prepared candidate after hashing ends.
        assertFalse(manager.commitRestart(verified, false));
        assertNull(manager.getLaunchBundleDirectory());
        assertEquals(candidateId, state.pending);
    }

    @Test public void rendererOnlyFailureRollsBackWithoutKillingHostProcess() {
        state.stage(candidateId, 2);
        assertEquals(candidate, manager.getLaunchBundleDirectory());
        // Ordinary recreation alone must retain the same not-yet-acknowledged launch.
        assertEquals(candidate, manager.getLaunchBundleDirectory());
        manager.rendererGone();
        assertNull(manager.getLaunchBundleDirectory());
        assertEquals("", state.active);
        assertEquals(2, state.highWater);
    }

    @Test public void healthyOtaRendererFailureDoesNotReleaseItsSelection() {
        state.stage(candidateId, 2);
        assertEquals(candidate, manager.getLaunchBundleDirectory());
        manager.markHealthy();
        manager.rendererGone();
        assertEquals(candidate, manager.getLaunchBundleDirectory());
        assertEquals(candidateId, state.active);
    }

    @Test public void cancellationKeepsWorkerOwnershipUntilItsCleanupActuallyFinishes() throws Exception {
        String verified = prepareFromHealthyBundledSelection();
        CountDownLatch working = new CountDownLatch(1);
        CountDownLatch cleaning = new CountDownLatch(1);
        CountDownLatch releaseCleanup = new CountDownLatch(1);
        ExecutorService executor = (ExecutorService) field("executor");
        Future<?> operation = executor.submit(() -> {
            try {
                setField("worker", Thread.currentThread());
                working.countDown();
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException cancelled) {
                    // Deliberately hold the cleanup window that Future.cancel would incorrectly mark completed.
                    cleaning.countDown();
                    releaseCleanup.await();
                }
            } catch (Exception failure) { throw new AssertionError(failure); }
            finally {
                try { setField("worker", null); }
                catch (ReflectiveOperationException failure) { throw new AssertionError(failure); }
            }
        });
        setField("task", operation);
        try {
            assertTrue(working.await(5, TimeUnit.SECONDS));
            manager.setBusy(true);
            assertTrue(cleaning.await(5, TimeUnit.SECONDS));
            manager.setBusy(false);
            assertFalse(operation.isDone());
            assertNull(manager.prepareRestart());
            assertFalse(manager.commitRestart(verified, true));
            assertNull(manager.getLaunchBundleDirectory());
        } finally { releaseCleanup.countDown(); }
        operation.get(5, TimeUnit.SECONDS);
        assertEquals(candidateId, manager.prepareRestart());
        assertTrue(manager.commitRestart(verified, true));
    }
}
