import { defaultCache } from "@serwist/next/worker";
import { Serwist, CacheFirst, type PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

// Bump with model swaps so old runtime caches can be evicted. Precache revisions
// fetch changed model files. See docs/MODEL_VERSIONING.md.
const MODEL_CACHE = "mangoleaf-model-cache-v4-3-0";

// Every model cache name this app has used, so old weights can be evicted
// instead of sitting on the device. Trial 2 was 11.51 MB, Trial 2.1 was 5.67 MB
// at float16, Trial 3 is 11.33 MB at float32.
const OUTDATED_MODEL_CACHES = [
  "mangoleaf-model-cache",
  "mangoleaf-model-cache-v2-1",
  "mangoleaf-model-cache-v2-1-1",
  "mangoleaf-model-cache-v3-0-0",
  "mangoleaf-model-cache-v4-0-0",
  "mangoleaf-model-cache-v4-1-0-candidate",
  "mangoleaf-model-cache-v4-1-1-candidate",
  "mangoleaf-model-cache-v4-2-0-dual-experiment",
  "mangoleaf-model-cache-v4-3-0-candidate",
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

// Free the space held by superseded model caches. Runs alongside Serwist's own
// activate handler. Failures are swallowed because a leftover cache wastes disk
// space but breaks nothing, and must never stop the new worker activating.
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
