package com.mangoleaf.ai.ota;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/** Version-one protocol deliberately forbids model or schema changes through web OTA. */
public final class OtaProtocol {
    public static final long MAX_SEQUENCE = 9_007_199_254_740_991L;
    public static final int MAX_METADATA_BYTES = 64 * 1024;
    public static final int MAX_DESCRIPTOR_BYTES = 2 * 1024 * 1024;
    public static final long MAX_ARCHIVE_BYTES = 150L * 1024 * 1024;
    public static final long MAX_EXPANDED_BYTES = 300L * 1024 * 1024;
    public static final long MAX_FILE_BYTES = 64L * 1024 * 1024;
    public static final int MAX_FILES = 5000;
    private OtaProtocol() {}

    public static boolean isHash(String value) {
        return value != null && value.matches("[a-f0-9]{64}");
    }

    public static String safePath(String name) throws IOException {
        if (name == null || name.isEmpty() || name.length() > 240
                || !name.matches("[a-zA-Z0-9_./@()+\\[\\] -]+")
                || name.startsWith("/") || name.contains("\\")) {
            throw new IOException("Invalid bundle path.");
        }
        for (String part : name.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) {
                throw new IOException("Invalid bundle path.");
            }
        }
        return name;
    }

    public static URI requireReleaseUrl(String value, String repository,
            boolean allowLatest) throws Exception {
        if (repository == null || !repository.matches("[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")) {
            throw new IOException("Missing allowed repository.");
        }
        URI url = new URI(value);
        String prefix = "/" + repository + "/releases/";
        String path = url.getRawPath();
        if (!"https".equals(url.getScheme()) || !"github.com".equals(url.getHost())
                || url.getPort() != -1 || url.getUserInfo() != null
                || url.getRawQuery() != null || url.getRawFragment() != null
                || path == null || !path.startsWith(prefix)
                || path.toLowerCase(Locale.ROOT).matches(".*%(2f|5c|2e).*")) {
            throw new IOException("Update URL is outside the allowed GitHub Releases repository.");
        }
        String suffix = path.substring(prefix.length());
        if (!suffix.matches("download/[^/]+/[^/]+")
                && !(allowLatest && suffix.matches("latest/download/[^/]+"))) {
            throw new IOException("Update URL must name a release asset.");
        }
        return url;
    }

    public static PublicKey publicKey(String encoded) throws Exception {
        PublicKey key = KeyFactory.getInstance("RSA").generatePublic(
                new X509EncodedKeySpec(Base64.getDecoder().decode(encoded)));
        if (!(key instanceof RSAPublicKey)
                || ((RSAPublicKey) key).getModulus().bitLength() < 3072) {
            throw new IOException("OTA signing key must be RSA 3072 bits or stronger.");
        }
        return key;
    }

    public static Manifest authenticate(byte[] metadata, byte[] signature,
            OtaConfig config) throws Exception {
        if (metadata.length > MAX_METADATA_BYTES || signature.length > 2048) {
            throw new IOException("Update metadata exceeds limits.");
        }
        Signature verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(publicKey(config.publicKeyBase64));
        verifier.update(metadata);
        byte[] rawSignature = Base64.getDecoder().decode(
                new String(signature, StandardCharsets.US_ASCII).trim());
        if (!verifier.verify(rawSignature)) throw new IOException("Update signature is invalid.");
        return new Manifest(new JSONObject(new String(metadata, StandardCharsets.UTF_8)), config);
    }

    public static byte[] readBounded(InputStream input, int limit) throws IOException {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (result.size() + count > limit) throw new IOException("Input exceeds size limit.");
            result.write(buffer, 0, count);
        }
        return result.toByteArray();
    }

    public static String hash(byte[] bytes) throws Exception {
        return hex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    public static String hash(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[32768];
            int length;
            while ((length = input.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) throw new IOException("Update interrupted.");
                digest.update(buffer, 0, length);
            }
        }
        return hex(digest.digest());
    }

    public static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format(Locale.ROOT, "%02x", value & 255));
        return result.toString();
    }

    public static final class Manifest {
        public final JSONObject json;
        public final long sequence;
        public final String id;
        public final String archiveUrl;
        public final String archiveSha256;
        public final String descriptorSha256;
        public final long archiveBytes;
        public final long expandedBytes;
        public final int fileCount;

        Manifest(JSONObject json, OtaConfig config) throws Exception {
            this.json = json;
            sequence = integer(json, "sequence", 1, MAX_SEQUENCE);
            if (integer(json, "protocol", 1, 1) != 1
                    || integer(json, "bridgeVersion", 1, Integer.MAX_VALUE) != config.bridgeVersion
                    || integer(json, "schemaVersion", 1, Integer.MAX_VALUE) != config.schemaVersion
                    || integer(json, "nativeHostMin", 1, Integer.MAX_VALUE) > config.nativeHostVersion
                    || integer(json, "nativeHostMax", 1, Integer.MAX_VALUE) < config.nativeHostVersion
                    || !config.modelIdentity.equals(json.getString("modelIdentity"))) {
                throw new IOException("Update is incompatible with this installed app.");
            }
            if (!json.getString("bundleVersion").matches("\\d+\\.\\d+\\.\\d+(?:[-+][A-Za-z0-9.-]+)?")
                    || !json.getString("sourceCommit").matches("[a-f0-9]{40}")) {
                throw new IOException("Invalid update identity.");
            }
            archiveUrl = json.getString("archiveUrl");
            requireReleaseUrl(archiveUrl, config.repository, false);
            archiveSha256 = json.getString("archiveSha256");
            descriptorSha256 = json.getString("descriptorSha256");
            if (!isHash(archiveSha256) || !isHash(descriptorSha256)) throw new IOException("Invalid update hash.");
            archiveBytes = integer(json, "archiveBytes", 1, MAX_ARCHIVE_BYTES);
            expandedBytes = integer(json, "expandedBytes", 1, MAX_EXPANDED_BYTES);
            fileCount = (int) integer(json, "fileCount", 1, MAX_FILES);
            id = sequence + "-" + archiveSha256.substring(0, 16);
        }
    }

    static long integer(JSONObject json, String field, long min, long max) throws Exception {
        Object raw = json.get(field);
        if (!(raw instanceof Number)) throw new IOException("Expected numeric update field.");
        double number = ((Number) raw).doubleValue();
        long value = ((Number) raw).longValue();
        if (!Double.isFinite(number) || number != value || value < min || value > max) {
            throw new IOException("Update numeric field exceeds limits.");
        }
        return value;
    }

    /** Rechecked before launch so a partial or changed directory never becomes active. */
    public static void verifyDirectory(File root, Manifest manifest) throws Exception {
        root = root.getCanonicalFile();
        File descriptorFile = new File(root, "android-bundle.json");
        byte[] descriptor;
        try (InputStream input = new FileInputStream(descriptorFile)) {
            descriptor = readBounded(input, MAX_DESCRIPTOR_BYTES);
        }
        if (!hash(descriptor).equals(manifest.descriptorSha256)) throw new IOException("Bundle descriptor differs.");
        JSONObject json = new JSONObject(new String(descriptor, StandardCharsets.UTF_8));
        for (String key : new String[] {"protocol", "sequence", "bundleVersion", "nativeHostMin",
                "nativeHostMax", "bridgeVersion", "schemaVersion", "modelIdentity", "sourceCommit"}) {
            if (!json.get(key).toString().equals(manifest.json.get(key).toString())) {
                throw new IOException("Bundle descriptor differs from signed metadata.");
            }
        }
        JSONArray entries = json.getJSONArray("files");
        if (entries.length() + 1 != manifest.fileCount) throw new IOException("Bundle file count differs.");
        Map<String, JSONObject> inventory = new HashMap<>();
        Set<String> caseNames = new HashSet<>();
        long total = descriptor.length;
        StringBuilder model = new StringBuilder();
        String priorPath = "";
        for (int index = 0; index < entries.length(); index++) {
            JSONObject entry = entries.getJSONObject(index);
            String path = safePath(entry.getString("path"));
            if (path.equals("android-bundle.json") || path.compareTo(priorPath) <= 0
                    || !caseNames.add(path.toLowerCase(Locale.ROOT))) throw new IOException("Duplicate or unordered bundle path.");
            priorPath = path;
            long length = integer(entry, "bytes", 0, MAX_FILE_BYTES);
            String checksum = entry.getString("sha256");
            File file = child(root, path);
            if (!isHash(checksum) || !file.isFile() || file.length() != length
                    || !checksum.equals(hash(file))) throw new IOException("Bundle file is missing or changed.");
            total += length;
            if (total > MAX_EXPANDED_BYTES) throw new IOException("Bundle exceeds size limit.");
            inventory.put(path, entry);
            if (path.startsWith("model/")) model.append(path).append('\t').append(length)
                    .append('\t').append(checksum).append('\n');
        }
        if (!inventory.containsKey("index.html") || !inventory.containsKey("model/model.json")
                || !inventory.containsKey("model/model_config.json")
                || !hash(model.toString().getBytes(StandardCharsets.UTF_8)).equals(json.getString("modelIdentity"))
                || total != manifest.expandedBytes || countFiles(root, root) != manifest.fileCount) {
            throw new IOException("Bundle identity or totals differ.");
        }
    }

    static File child(File root, String path) throws IOException {
        File file = new File(root.getCanonicalFile(), safePath(path));
        if (!file.getCanonicalFile().equals(file.getAbsoluteFile())
                || !file.getCanonicalPath().startsWith(root.getCanonicalPath() + File.separator)) {
            throw new IOException("Bundle path escapes its directory.");
        }
        return file;
    }

    private static int countFiles(File root, File folder) throws IOException {
        int count = 0;
        File[] files = folder.listFiles();
        if (files == null) throw new IOException("Bundle directory is unreadable.");
        for (File file : files) {
            if (!file.getCanonicalFile().equals(file.getAbsoluteFile())
                    || !file.getCanonicalPath().startsWith(root.getCanonicalPath() + File.separator)) {
                throw new IOException("Bundle contains a symbolic link.");
            }
            count += file.isDirectory() ? countFiles(root, file) : 1;
            if (count > MAX_FILES) throw new IOException("Bundle contains too many files.");
        }
        return count;
    }
}
