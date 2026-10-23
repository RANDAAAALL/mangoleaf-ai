package com.mangoleaf.ai.ota;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Restricted ZIP profile matches the deterministic repository packager. */
public final class OtaArchive {
    private OtaArchive() {}

    public static void extract(File archive, File destination,
            OtaProtocol.Manifest manifest) throws Exception {
        if (archive.length() != manifest.archiveBytes
                || !OtaProtocol.hash(archive).equals(manifest.archiveSha256)) {
            throw new IOException("Update archive identity differs.");
        }
        if (!destination.mkdir()) throw new IOException("Staging destination must be new.");
        validateCentralDirectory(archive, manifest);
        long total = 0;
        int count = 0;
        try (ZipFile zip = new ZipFile(archive)) {
            Enumeration<? extends ZipEntry> entries = zip.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                File target = OtaProtocol.child(destination, entry.getName());
                File parent = target.getParentFile();
                if (parent == null || (!parent.isDirectory() && !parent.mkdirs())
                        || !target.createNewFile()) throw new IOException("Duplicate extraction path.");
                CRC32 crc = new CRC32();
                long length = 0;
                try (InputStream input = zip.getInputStream(entry);
                        FileOutputStream output = new FileOutputStream(target)) {
                    byte[] buffer = new byte[32768];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        if (Thread.currentThread().isInterrupted()) throw new IOException("Update interrupted.");
                        length += read;
                        total += read;
                        if (length > entry.getSize() || length > OtaProtocol.MAX_FILE_BYTES
                                || total > manifest.expandedBytes) throw new IOException("Expanded update exceeds limits.");
                        crc.update(buffer, 0, read);
                        output.write(buffer, 0, read);
                    }
                    output.getFD().sync();
                }
                if (length != entry.getSize() || crc.getValue() != entry.getCrc()) {
                    throw new IOException("Extracted update is corrupt.");
                }
                count++;
            }
        }
        if (count != manifest.fileCount || total != manifest.expandedBytes) {
            throw new IOException("Extracted update totals differ.");
        }
        OtaProtocol.verifyDirectory(destination, manifest);
    }

    // java.util.zip does not expose Unix symlink attributes. Inspect the central
    // directory before extracting, reject symlinks, ZIP64, encryption and extra data.
    private static void validateCentralDirectory(File archive,
            OtaProtocol.Manifest manifest) throws Exception {
        try (RandomAccessFile input = new RandomAccessFile(archive, "r")) {
            long end = input.length() - 22;
            if (end < 0) throw new IOException("Truncated update ZIP.");
            input.seek(end);
            if (u32(input) != 0x06054b50L || u16(input) != 0 || u16(input) != 0) {
                throw new IOException("Unsupported update ZIP ending.");
            }
            int count = u16(input);
            if (u16(input) != count || count != manifest.fileCount) throw new IOException("Update ZIP count differs.");
            long centralBytes = u32(input);
            long centralStart = u32(input);
            if (u16(input) != 0 || centralStart + centralBytes != end) throw new IOException("Unsupported update ZIP comment.");
            long cursor = centralStart;
            long nextOffset = 0;
            long total = 0;
            Set<String> names = new HashSet<>();
            for (int index = 0; index < count; index++) {
                if (cursor + 46 > end) throw new IOException("Truncated update ZIP directory.");
                input.seek(cursor);
                if (u32(input) != 0x02014b50L) throw new IOException("Invalid update ZIP directory.");
                input.skipBytes(4);
                int flags = u16(input);
                int method = u16(input);
                input.skipBytes(4);
                long crc = u32(input);
                long compressed = u32(input);
                long size = u32(input);
                int nameBytes = u16(input);
                int extraBytes = u16(input);
                int commentBytes = u16(input);
                int disk = u16(input);
                input.skipBytes(2);
                long attributes = u32(input);
                long offset = u32(input);
                if (nameBytes < 1 || nameBytes > 240 || extraBytes != 0 || commentBytes != 0
                        || disk != 0 || flags != 0x800 || method != ZipEntry.DEFLATED
                        || ((attributes >>> 16) & 0170000) != 0100000
                        || size > OtaProtocol.MAX_FILE_BYTES || compressed < 1
                        || size > compressed * 1000 || offset != nextOffset
                        || cursor + 46 + nameBytes > end) {
                    throw new IOException("Unsupported or oversized update ZIP entry.");
                }
                byte[] nameData = new byte[nameBytes];
                input.readFully(nameData);
                String name = OtaProtocol.safePath(new String(nameData, StandardCharsets.US_ASCII));
                if (!names.add(name.toLowerCase(Locale.ROOT))) throw new IOException("Duplicate update ZIP path.");
                input.seek(offset);
                if (offset + 30 + nameBytes + compressed > centralStart
                        || u32(input) != 0x04034b50L) throw new IOException("Invalid update ZIP local header.");
                input.skipBytes(2);
                if (u16(input) != flags || u16(input) != method) throw new IOException("ZIP local flags differ.");
                input.skipBytes(4);
                if (u32(input) != crc || u32(input) != compressed || u32(input) != size
                        || u16(input) != nameBytes || u16(input) != 0) throw new IOException("ZIP local sizes differ.");
                byte[] localName = new byte[nameBytes];
                input.readFully(localName);
                if (!java.util.Arrays.equals(nameData, localName)) throw new IOException("ZIP local name differs.");
                total += size;
                if (total > manifest.expandedBytes) throw new IOException("Update ZIP is too large.");
                nextOffset = offset + 30 + nameBytes + compressed;
                cursor += 46 + nameBytes;
            }
            if (cursor != end || nextOffset != centralStart || total != manifest.expandedBytes) {
                throw new IOException("Update ZIP has unexpected data.");
            }
        }
    }

    private static int u16(RandomAccessFile input) throws IOException {
        return input.readUnsignedByte() | input.readUnsignedByte() << 8;
    }

    private static long u32(RandomAccessFile input) throws IOException {
        return (u16(input) | (long) u16(input) << 16) & 0xffffffffL;
    }
}
