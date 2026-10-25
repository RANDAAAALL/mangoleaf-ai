package com.mangoleaf.ai;

import android.app.Application;
import com.mangoleaf.ai.ota.OtaConfig;
import com.mangoleaf.ai.ota.OtaManager;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** A process owns one bundle selection; only an explicit verified-update restart releases it. */
public final class MangoLeafApplication extends Application {
    private final ExecutorService operations = Executors.newSingleThreadExecutor();
    private NativeStore store;
    private OtaManager ota;
    private ApkUpdateManager apkUpdater;

    ExecutorService operations() { return operations; }

    synchronized ApkUpdateManager apkUpdater() throws Exception {
        if (apkUpdater == null) apkUpdater = new ApkUpdateManager(this);
        return apkUpdater;
    }

    synchronized NativeStore store() throws Exception {
        if (store == null) {
            NativeStore candidate = new NativeStore(this);
            try {
                candidate.seedGuidelines();
                store = candidate;
            } catch (Exception failure) {
                candidate.close();
                throw failure;
            }
        }
        return store;
    }

    synchronized OtaManager ota() throws Exception {
        if (ota == null) {
            OtaConfig config = OtaConfig.fromAssets(this, BuildConfig.OTA_METADATA_URL, BuildConfig.OTA_SIGNATURE_URL,
                BuildConfig.OTA_ALLOWED_REPOSITORY, BuildConfig.OTA_PUBLIC_KEY, BuildConfig.VERSION_CODE,
                BuildConfig.BRIDGE_VERSION, BuildConfig.SCHEMA_VERSION);
            ota = new OtaManager(this, config);
        }
        return ota;
    }
}
