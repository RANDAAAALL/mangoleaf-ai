package com.mangoleaf.ai;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Platform verification only: copy public APK bytes into test cache, never install or touch History. */
@RunWith(AndroidJUnit4.class)
public final class ApkUpdateArchiveTest {
    @Test public void signedArchivePassesButChangingModelBytesWithoutResigningFails() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        PackageManager manager = context.getPackageManager();
        File original = new File(context.getApplicationInfo().sourceDir);
        PackageInfo parsed = ApkUpdateManager.archive(manager, original.getAbsolutePath());
        assertNotNull(parsed); assertEquals(context.getPackageName(), parsed.packageName);
        File altered = File.createTempFile("apk-integrity-", ".apk", context.getCacheDir());
        try {
            Files.copy(original.toPath(), altered.toPath(), StandardCopyOption.REPLACE_EXISTING);
            corruptEntry(altered, "assets/web/model/group1-shard1of3.bin");
            // Manifest/ZIP structure and signing block are unchanged; only signed payload bytes differ.
            assertNull(ApkUpdateManager.archive(manager, altered.getAbsolutePath()));
        } finally { assertTrue(!altered.exists() || altered.delete()); }
    }

    @Test public void debugCannotOfferOrRequestProductionInstallation() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertTrue(BuildConfig.DEBUG); assertFalse(ApkUpdateManager.supported());
        PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS);
        if (info.requestedPermissions != null) for (String permission : info.requestedPermissions)
            assertNotEquals("android.permission.REQUEST_INSTALL_PACKAGES", permission);
        ApkUpdateManager manager = new ApkUpdateManager(context);
        assertThrows(IllegalStateException.class, () -> manager.start("8b7e744d-6104-421f-bc5e-1f1397459501", "v0.12.0", "0.1.9"));
    }

    private static void corruptEntry(File apk, String wanted) throws Exception {
        try (RandomAccessFile file = new RandomAccessFile(apk, "rw")) {
            long end = file.length(); long eocd = -1;
            for (long offset = end - 22; offset >= Math.max(0, end - 65557); offset--) {
                file.seek(offset); if (u32(file) == 0x06054b50L) { eocd = offset; break; }
            }
            assertTrue(eocd >= 0); file.seek(eocd + 10); int entries = u16(file);
            file.seek(eocd + 16); long directory = u32(file); assertTrue(entries < 10000);
            file.seek(directory);
            for (int i = 0; i < entries; i++) {
                long header = file.getFilePointer(); assertEquals(0x02014b50L, u32(file));
                file.seek(header + 28); int nameLength = u16(file); int extraLength = u16(file); int commentLength = u16(file);
                file.seek(header + 42); long local = u32(file); byte[] name = new byte[nameLength]; file.readFully(name);
                if (wanted.equals(new String(name, StandardCharsets.UTF_8))) {
                    file.seek(local); assertEquals(0x04034b50L, u32(file)); file.seek(local + 26);
                    int localName = u16(file); int localExtra = u16(file); long payload = local + 30 + localName + localExtra;
                    file.seek(payload); int value = file.readUnsignedByte(); file.seek(payload); file.write(value ^ 1); return;
                }
                file.seek(header + 46 + nameLength + extraLength + commentLength);
            }
            fail("Public packaged model fixture was not found.");
        }
    }

    private static int u16(RandomAccessFile file) throws Exception { return file.readUnsignedByte() | file.readUnsignedByte() << 8; }
    private static long u32(RandomAccessFile file) throws Exception { return Integer.toUnsignedLong(u16(file) | u16(file) << 16); }
}
