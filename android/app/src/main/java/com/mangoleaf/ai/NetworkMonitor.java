package com.mangoleaf.ai;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import org.json.JSONException;
import org.json.JSONObject;

/** Native connectivity is a hint. Individual HTTP requests still decide success. */
final class NetworkMonitor implements AutoCloseable {
    interface Listener { void changed(JSONObject state); }

    private final ConnectivityManager manager;
    private final Listener listener;
    private boolean registered;
    private final ConnectivityManager.NetworkCallback callback = new ConnectivityManager.NetworkCallback() {
        @Override public void onAvailable(Network network) { publish(); }
        @Override public void onLost(Network network) { publish(); }
        @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities capabilities) { publish(); }
        @Override public void onBlockedStatusChanged(Network network, boolean blocked) { publish(); }
    };

    NetworkMonitor(Context context, Listener listener) {
        manager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.listener = listener;
    }

    void start() {
        if (!registered) {
            manager.registerDefaultNetworkCallback(callback);
            registered = true;
        }
        publish();
    }

    JSONObject snapshot() {
        Network network = manager.getActiveNetwork();
        NetworkCapabilities capabilities = network == null ? null : manager.getNetworkCapabilities(network);
        boolean connected = capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        boolean validated = connected && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        try {
            return new JSONObject().put("connected", connected).put("validated", validated);
        } catch (JSONException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private void publish() { listener.changed(snapshot()); }

    @Override public void close() {
        if (registered) {
            manager.unregisterNetworkCallback(callback);
            registered = false;
        }
    }
}
