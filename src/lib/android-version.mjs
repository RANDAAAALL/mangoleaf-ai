/**
 * Display metadata only; installed identity still comes from the trusted Android host.
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function parseAndroidVersion(value) {
  return typeof value === "string" &&
    value.length <= 48 &&
    value === value.trim() &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-dev)?$/.test(value)
    ? value
    : undefined;
}

const assetLabelPrefix = "Android APK v";

/** Compare native release versions without rounding large numeric components or accepting Debug labels. */
export function isNewerAndroidApk(available, installed) {
  const next = parseAndroidVersion(available);
  const current = parseAndroidVersion(installed);
  if (!next || !current || next.endsWith("-dev") || current.endsWith("-dev"))
    return false;
  const left = next.split(".");
  const right = current.split(".");
  for (let index = 0; index < 3; index++) {
    if (left[index] === right[index]) continue;
    return left[index].length === right[index].length
      ? left[index] > right[index]
      : left[index].length > right[index].length;
  }
  return false;
}

/**
 * The publisher copies this label from the verified APK receipt, independently of the web-release tag.
 * @param {unknown} value
 */
export function androidApkAssetLabel(value) {
  const version = parseAndroidVersion(value);
  if (!version || version.endsWith("-dev"))
    throw new Error("A production APK version is required.");
  return `${assetLabelPrefix}${version}`;
}

/**
 * Missing, Debug or malformed labels hide only the optional version, preserving older valid downloads.
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function parseAndroidApkAssetLabel(value) {
  if (typeof value !== "string" || !value.startsWith(assetLabelPrefix)) return;
  const version = parseAndroidVersion(value.slice(assetLabelPrefix.length));
  return version && !version.endsWith("-dev") ? version : undefined;
}
