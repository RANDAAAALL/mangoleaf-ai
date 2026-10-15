import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "your-anon-key";
const cloudRequestTimeoutMs = 10_000;

/**
 * Bound public guideline requests, including body downloads, so a stalled
 * connection releases background work independently of local diagnosis.
 */
async function fetchWithCloudTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const parentSignal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abortFromParent = () => controller.abort();

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  }

  const timeoutId = setTimeout(() => controller.abort(), cloudRequestTimeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    // Keep the timer active until guideline bytes arrive, not just headers.
    // Some browser fetch wrappers expose an empty stream for 204. These HTTP
    // statuses still forbid any reconstructed body, including zero bytes.
    const body =
      [204, 205, 304].includes(response.status) || !response.body
        ? null
        : await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

// The public key is authorized by guideline RLS. No guest is created, and this
// client never reads or stores the former cloud session or its scan photos.
export const guidelinesClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "mangoleaf-public-guidelines",
  },
  global: {
    fetch: fetchWithCloudTimeout,
  },
});
