import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "your-anon-key";
const cloudRequestTimeoutMs = 10_000;

/**
 * Bound cloud requests so a stalled connection releases background work.
 * Authentication and uploads never gate local diagnosis or saved History.
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
    // Keep the timer active until bytes arrive too. Headers alone do not mean
    // a private photo finished downloading on a stalled mobile connection.
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

// Shared browser client. The anon key is public by design; what a caller may
// actually read or write is decided by the RLS policies on Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithCloudTimeout,
  },
});

// Published guidance must stay readable even when a guest token is expired or
// private synchronization cannot sign in. This client never stores a session.
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
