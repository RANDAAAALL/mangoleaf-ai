import { defaultCache } from "@serwist/next/worker";
import { Serwist, CacheFirst, type PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: /\/model\/.*$/,
      handler: new CacheFirst({
        cacheName: "mangoleaf-model-cache",
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
