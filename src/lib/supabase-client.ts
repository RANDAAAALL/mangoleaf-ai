import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "your-anon-key";
const scanUploadTimeoutMs = 10_000;

function isScanObjectUpload(input: RequestInfo | URL, init?: RequestInit) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");

  return (
    (method === "POST" || method === "PUT") &&
    /\/storage\/v1\/object\/scans(?:\/|$)/.test(url)
  );
}

/**
 * Storage upload options do not accept an AbortSignal in Supabase JS v2. This
 * fetch wrapper applies a real timeout only to scan-object writes, keeping
 * stalled mobile uploads from holding the synchronization lock indefinitely.
 */
async function fetchWithScanUploadTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!isScanObjectUpload(input, init)) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const parentSignal = init?.signal;
  const abortFromParent = () => controller.abort();

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  }

  const timeoutId = setTimeout(() => controller.abort(), scanUploadTimeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

// Shared browser client; authorization must be enforced by Supabase RLS policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithScanUploadTimeout,
  },
});
