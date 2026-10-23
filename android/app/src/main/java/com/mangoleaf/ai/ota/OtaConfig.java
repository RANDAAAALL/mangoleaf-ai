package com.mangoleaf.ai.ota;

import android.content.Context;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/** Native trust and compatibility policy; empty remote settings disable network updates. */
public final class OtaConfig {
    public final String metadataUrl;
    public final String signatureUrl;
    public final String repository;
    public final String publicKeyBase64;
    public final int nativeHostVersion;
    public final int bridgeVersion;
    public final int schemaVersion;
    public final String modelIdentity;
    public final long bundledSequence;

    public OtaConfig(String metadataUrl, String signatureUrl, String repository,
            String publicKeyBase64, int nativeHostVersion, int bridgeVersion,
            int schemaVersion, String modelIdentity, long bundledSequence) {
        this.metadataUrl = metadataUrl;
        this.signatureUrl = signatureUrl;
        this.repository = repository;
        this.publicKeyBase64 = publicKeyBase64;
        this.nativeHostVersion = nativeHostVersion;
        this.bridgeVersion = bridgeVersion;
        this.schemaVersion = schemaVersion;
        this.modelIdentity = modelIdentity;
        this.bundledSequence = bundledSequence;
    }

    public static OtaConfig fromAssets(Context context, String metadataUrl,
            String signatureUrl, String repository, String publicKeyBase64,
            int hostVersion, int bridgeVersion, int schemaVersion) throws Exception {
        JSONObject descriptor;
        try (InputStream input = context.getAssets().open("web/android-bundle.json")) {
            descriptor = new JSONObject(new String(
                    OtaProtocol.readBounded(input, OtaProtocol.MAX_DESCRIPTOR_BYTES),
                    StandardCharsets.UTF_8));
        }
        if (descriptor.getInt("protocol") != 1
                || descriptor.getInt("bridgeVersion") != bridgeVersion
                || descriptor.getInt("schemaVersion") != schemaVersion
                || descriptor.getInt("nativeHostMin") > hostVersion
                || descriptor.getInt("nativeHostMax") < hostVersion) {
            throw new IllegalStateException("Bundled web application is incompatible.");
        }
        String modelIdentity = descriptor.getString("modelIdentity");
        long sequence = descriptor.getLong("sequence");
        if (!OtaProtocol.isHash(modelIdentity) || sequence < 1
                || sequence > OtaProtocol.MAX_SEQUENCE) {
            throw new IllegalStateException("Bundled web identity is invalid.");
        }
        return new OtaConfig(metadataUrl, signatureUrl, repository, publicKeyBase64,
                hostVersion, bridgeVersion, schemaVersion, modelIdentity, sequence);
    }

    public boolean isEnabled() {
        if (metadataUrl == null || metadataUrl.isEmpty()
                || signatureUrl == null || signatureUrl.isEmpty()
                || repository == null || repository.isEmpty()
                || publicKeyBase64 == null || publicKeyBase64.isEmpty()) return false;
        try {
            OtaProtocol.requireReleaseUrl(metadataUrl, repository, true);
            OtaProtocol.requireReleaseUrl(signatureUrl, repository, true);
            OtaProtocol.publicKey(publicKeyBase64);
            return true;
        } catch (Exception invalid) {
            return false;
        }
    }
}
