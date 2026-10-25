package com.mangoleaf.ai;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Only the explicit system-held session callback can reach this nonexported receiver. */
public final class ApkUpdateReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!ApkUpdateManager.supported() || intent == null) return;
        try { ((MangoLeafApplication) context.getApplicationContext()).apkUpdater().receive(intent); }
        catch (Exception ignored) { /* A cold process cannot resume an interrupted installer automatically. */ }
    }
}
