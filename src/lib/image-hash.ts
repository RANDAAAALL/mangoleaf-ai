/** Fingerprint the original file bytes without loading the inference library. */
export async function computeImageHash(file: File): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
