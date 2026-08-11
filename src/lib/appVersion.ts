const rawAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

export const pwaVersion = rawAppVersion.startsWith("v")
  ? rawAppVersion
  : `v${rawAppVersion}`;

export const modelVersion =
  process.env.NEXT_PUBLIC_MODEL_VERSION || "model-v2.0.0";
