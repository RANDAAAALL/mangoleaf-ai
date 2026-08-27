import { defaultCache } from "@serwist/next/worker";
import { Serwist, CacheFirst, type PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

// Bump this whenever the files in public/model/ are replaced. The CacheFirst rule
// below never revalidates, and model.json keeps the same URL across model versions,
// so an already-installed PWA would otherwise keep serving the previous model's
// weights from cache indefinitely and silently. See docs/MODEL_VERSIONING.md.
const MODEL_CACHE = "mangoleaf-model-cache-v3-0-0";

// Every model cache name this app has ever used, so the old weights can be
// evicted instead of sitting on the device forever. Trial 2's model was 11.51 MB,
// Trial 2.1's was 5.67 MB at float16, and Trial 3's is 11.33 MB at float32.
const OUTDATED_MODEL_CACHES = [
  "mangoleaf-model-cache",
  "mangoleaf-model-cache-v2-1",
  "mangoleaf-model-cache-v2-1-1",
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: /\/model\/.*$/,
      handler: new CacheFirst({
        cacheName: MODEL_CACHE,
      }),
    },
    ...defaultCache,
  ],
});

// Reclaim the space held by superseded model caches. Runs alongside Serwist's own
// activate handler; failures are swallowed because a stale cache is a disk-space
// problem, not a correctness one, and must never block the new worker.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all(
      OUTDATED_MODEL_CACHES.filter((name) => name !== MODEL_CACHE).map((name) =>
        caches.delete(name).catch(() => false),
      ),
    ),
  );
});

serwist.addEventListeners();
