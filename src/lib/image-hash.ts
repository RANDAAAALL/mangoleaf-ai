/** Fingerprint supplied image bytes; File extends Blob, so uploads use this too. */
export async function computeImageHash(file: Blob): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
