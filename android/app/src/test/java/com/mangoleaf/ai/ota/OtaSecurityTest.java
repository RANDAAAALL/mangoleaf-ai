package com.mangoleaf.ai.ota;

import static org.junit.Assert.*;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.zip.CRC32;
import java.util.zip.Deflater;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

/** Fixtures use ephemeral test keys and never embed a publisher's signing key. */
public class OtaSecurityTest {
    @Rule public TemporaryFolder temporary = new TemporaryFolder();
    private static KeyPair key;

    @BeforeClass public static void keys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(3072);
        key = generator.generateKeyPair();
    }

    @Test public void signatureAuthenticatesExactBytes() throws Exception {
        Fixture fixture = fixture();
        OtaConfig config = config(fixture.modelIdentity);
        OtaProtocol.Manifest verified = OtaProtocol.authenticate(fixture.metadata, fixture.signature, config);
        assertEquals(2, verified.sequence);
        byte[] changed = (new String(fixture.metadata, StandardCharsets.UTF_8) + " ").getBytes(StandardCharsets.UTF_8);
        assertThrows(IOException.class, () -> OtaProtocol.authenticate(changed, fixture.signature, config));
    }

    @Test public void incompatibleModelBridgeSchemaAndHostAreRejected() throws Exception {
        Fixture fixture = fixture();
        for (String field : new String[] {"bridgeVersion", "schemaVersion", "nativeHostMin", "modelIdentity"}) {
            JSONObject changed = new JSONObject(new String(fixture.metadata, StandardCharsets.UTF_8));
            changed.put(field, field.equals("modelIdentity") ? "0".repeat(64) : 2);
            byte[] bytes = changed.toString().getBytes(StandardCharsets.UTF_8);
            byte[] signed = sign(bytes);
            assertThrows(IOException.class, () -> OtaProtocol.authenticate(bytes, signed, config(fixture.modelIdentity)));
        }
    }

    @Test public void releaseTrustCannotEscapeRepositoryOrHttps() throws Exception {
        for (String address : new String[] {
                "http://github.com/example/mangoleaf/releases/download/v1/a.zip",
                "https://github.com/other/mangoleaf/releases/download/v1/a.zip",
                "https://github.com.example.com/example/mangoleaf/releases/download/v1/a.zip",
                "https://github.com/example/mangoleaf/releases/download/v1/a%2fprivate.zip",
                "https://github.com/example/mangoleaf/releases/download/v1/a.zip?redirect=outside"}) {
            assertThrows(Exception.class, () -> OtaProtocol.requireReleaseUrl(address, "example/mangoleaf", false));
        }
        OtaProtocol.requireReleaseUrl("https://github.com/example/mangoleaf/releases/latest/download/update.json", "example/mangoleaf", true);
    }

    @Test public void missingConfigurationDisablesRemoteUpdates() {
        assertFalse(new OtaConfig("", "", "", "", 1, 1, 1, "0".repeat(64), 1).isEnabled());
    }

    @Test public void completeSignedArchiveExtractsAndDetectsChangedFile() throws Exception {
        Fixture fixture = fixture();
        File archive = temporary.newFile();
        Files.write(archive.toPath(), fixture.archive);
        File web = new File(temporary.newFolder(), "web");
        OtaProtocol.Manifest manifest = OtaProtocol.authenticate(fixture.metadata, fixture.signature, config(fixture.modelIdentity));
        OtaArchive.extract(archive, web, manifest);
        assertTrue(new File(web, "index.html").isFile());
        Files.write(new File(web, "index.html").toPath(), "changed".getBytes(StandardCharsets.UTF_8));
        assertThrows(IOException.class, () -> OtaProtocol.verifyDirectory(web, manifest));
    }

    @Test public void signedZipWithSymlinkOrConflictingHeaderIsRejected() throws Exception {
        for (boolean symlink : new boolean[] {true, false}) {
            Fixture fixture = fixture();
            byte[] changed = fixture.archive.clone();
            if (symlink) {
                int offset = indexOf(changed, new byte[] {0x50, 0x4b, 0x01, 0x02});
                ByteBuffer.wrap(changed).order(ByteOrder.LITTLE_ENDIAN).putInt(offset + 38, 0120777 << 16);
            } else changed[14] ^= 1;
            JSONObject metadata = new JSONObject(new String(fixture.metadata, StandardCharsets.UTF_8));
            metadata.put("archiveSha256", OtaProtocol.hash(changed));
            byte[] bytes = metadata.toString().getBytes(StandardCharsets.UTF_8);
            OtaProtocol.Manifest manifest = OtaProtocol.authenticate(bytes, sign(bytes), config(fixture.modelIdentity));
            File archive = temporary.newFile();
            Files.write(archive.toPath(), changed);
            File web = new File(temporary.newFolder(), "web");
            assertThrows(IOException.class, () -> OtaArchive.extract(archive, web, manifest));
        }
    }

    @Test public void traversalNamesAreRejectedBeforeAnyWrite() {
        for (String name : new String[] {"../scan.db", "/absolute", "C:/private", "x\\y", "x//y", "x/../y"}) {
            assertThrows(IOException.class, () -> OtaProtocol.safePath(name));
        }
    }

    private static OtaConfig config(String modelIdentity) {
        return new OtaConfig(
                "https://github.com/example/mangoleaf/releases/latest/download/update.json",
                "https://github.com/example/mangoleaf/releases/latest/download/update.sig",
                "example/mangoleaf", Base64.getEncoder().encodeToString(key.getPublic().getEncoded()),
                1, 1, 1, modelIdentity, 1);
    }

    private static byte[] sign(byte[] bytes) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(key.getPrivate());
        signature.update(bytes);
        return Base64.getEncoder().encode(signature.sign());
    }

    private static Fixture fixture() throws Exception {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry("index.html", "<html>fixture</html>"));
        entries.add(new Entry("model/model.json", "{}"));
        entries.add(new Entry("model/model_config.json", "{}"));
        JSONArray files = new JSONArray();
        StringBuilder model = new StringBuilder();
        for (Entry entry : entries) {
            JSONObject file = new JSONObject();
            file.put("path", entry.path);
            file.put("bytes", entry.bytes.length);
            String checksum = OtaProtocol.hash(entry.bytes);
            file.put("sha256", checksum);
            files.put(file);
            if (entry.path.startsWith("model/")) model.append(entry.path).append('\t')
                    .append(entry.bytes.length).append('\t').append(checksum).append('\n');
        }
        String modelIdentity = OtaProtocol.hash(model.toString().getBytes(StandardCharsets.UTF_8));
        JSONObject descriptor = new JSONObject();
        descriptor.put("protocol", 1);
        descriptor.put("sequence", 2);
        descriptor.put("bundleVersion", "0.8.0");
        descriptor.put("nativeHostMin", 1);
        descriptor.put("nativeHostMax", 1);
        descriptor.put("bridgeVersion", 1);
        descriptor.put("schemaVersion", 1);
        descriptor.put("modelIdentity", modelIdentity);
        descriptor.put("sourceCommit", "a".repeat(40));
        descriptor.put("files", files);
        byte[] descriptorBytes = descriptor.toString().getBytes(StandardCharsets.UTF_8);
        entries.add(new Entry("android-bundle.json", descriptorBytes));
        entries.sort(Comparator.comparing(entry -> entry.path));
        byte[] archive = zip(entries);
        JSONObject metadata = new JSONObject(descriptor.toString());
        metadata.remove("files");
        metadata.put("archiveUrl", "https://github.com/example/mangoleaf/releases/download/web-2/web-update.zip");
        metadata.put("archiveSha256", OtaProtocol.hash(archive));
        metadata.put("archiveBytes", archive.length);
        metadata.put("expandedBytes", entries.stream().mapToInt(entry -> entry.bytes.length).sum());
        metadata.put("fileCount", entries.size());
        metadata.put("descriptorSha256", OtaProtocol.hash(descriptorBytes));
        byte[] metadataBytes = metadata.toString().getBytes(StandardCharsets.UTF_8);
        return new Fixture(archive, metadataBytes, sign(metadataBytes), modelIdentity);
    }

    // Test writer uses the same restricted ZIP profile as the Node producer. Java's
    // general ZipOutputStream adds data descriptors that this protocol rejects.
    private static byte[] zip(List<Entry> entries) throws Exception {
        ByteArrayOutputStream local = new ByteArrayOutputStream();
        ByteArrayOutputStream central = new ByteArrayOutputStream();
        for (Entry entry : entries) {
            byte[] name = entry.path.getBytes(StandardCharsets.US_ASCII);
            Deflater deflater = new Deflater(9, true);
            deflater.setInput(entry.bytes);
            deflater.finish();
            byte[] compressedBuffer = new byte[entry.bytes.length + 1024];
            int compressedLength = deflater.deflate(compressedBuffer);
            deflater.end();
            CRC32 crc = new CRC32();
            crc.update(entry.bytes);
            ByteBuffer header = ByteBuffer.allocate(30).order(ByteOrder.LITTLE_ENDIAN);
            header.putInt(0x04034b50).putShort((short) 20).putShort((short) 0x800)
                    .putShort((short) 8).putShort((short) 0).putShort((short) 33)
                    .putInt((int) crc.getValue()).putInt(compressedLength).putInt(entry.bytes.length)
                    .putShort((short) name.length).putShort((short) 0);
            ByteBuffer directory = ByteBuffer.allocate(46).order(ByteOrder.LITTLE_ENDIAN);
            directory.putInt(0x02014b50).putShort((short) 0x314).putShort((short) 20)
                    .putShort((short) 0x800).putShort((short) 8).putShort((short) 0).putShort((short) 33)
                    .putInt((int) crc.getValue()).putInt(compressedLength).putInt(entry.bytes.length)
                    .putShort((short) name.length).putShort((short) 0).putShort((short) 0)
                    .putShort((short) 0).putShort((short) 0).putInt(0100644 << 16).putInt(local.size());
            local.write(header.array()); local.write(name); local.write(compressedBuffer, 0, compressedLength);
            central.write(directory.array()); central.write(name);
        }
        ByteBuffer ending = ByteBuffer.allocate(22).order(ByteOrder.LITTLE_ENDIAN);
        ending.putInt(0x06054b50).putShort((short) 0).putShort((short) 0)
                .putShort((short) entries.size()).putShort((short) entries.size())
                .putInt(central.size()).putInt(local.size()).putShort((short) 0);
        local.write(central.toByteArray()); local.write(ending.array());
        return local.toByteArray();
    }

    private static int indexOf(byte[] bytes, byte[] wanted) {
        for (int index = 0; index <= bytes.length - wanted.length; index++) {
            boolean same = true;
            for (int part = 0; part < wanted.length; part++) if (bytes[index + part] != wanted[part]) same = false;
            if (same) return index;
        }
        throw new AssertionError("Missing ZIP central directory.");
    }

    private static final class Entry {
        final String path; final byte[] bytes;
        Entry(String path, String value) { this(path, value.getBytes(StandardCharsets.UTF_8)); }
        Entry(String path, byte[] value) { this.path = path; bytes = value; }
    }
    private static final class Fixture {
        final byte[] archive; final byte[] metadata; final byte[] signature; final String modelIdentity;
        Fixture(byte[] archive, byte[] metadata, byte[] signature, String modelIdentity) {
            this.archive = archive; this.metadata = metadata; this.signature = signature; this.modelIdentity = modelIdentity;
        }
    }
}
