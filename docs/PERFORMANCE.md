# MangoLeaf AI: System Performance & Optimization Specifications

This document describes the performance mechanisms implemented in **MangoLeaf AI** (`mangoleaf-ai`). Their effects depend on the image, browser, hardware, and network. Use [TESTING.md](testing/TESTING.md) and the [physical reliability checklist](testing/PHYSICAL_RELIABILITY_CHECKLIST.md) to record measurements for the exact candidate and device.

The [October 3, 2026 low-end-device review](#low-end-device-performance-review-october-3-2026) records current source findings, short isolated browser measurements, and prioritized improvements. It separates existing safeguards from changes that have not yet been implemented.

The matrix distinguishes implementation choices from measured outcomes. Earlier instant-loading, fixed-frame-rate, and zero-leak claims were not established device benchmarks. R01 measures repeated-inference consistency; R02 exercises cached offline behavior; R03 records a 30-minute session. None proves field accuracy or performance on every phone.

---

## Performance mechanisms and expected effects

| Mechanism               | Current implementation                             | Expected effect or evidence limit                                                                                         |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| TensorFlow.js loading   | Dynamic classifier imports                         | Defers classifier code loading; total downloads and startup timing still need measurement.                                |
| Input tensor size       | Canvas resizes to 224x224 before tensor creation   | 150,528 channel values instead of 36 million for a 12MP RGB image; this is not total application memory.                  |
| GPU textures            | `WEBGL_FORCE_F16_TEXTURES`                         | Uses half-float render textures on the WebGL path; score parity must be measured.                                         |
| Model download          | Single V4.3.0 Combined export is precached locally | Reuses cached files while storage and revisions remain valid.                                                             |
| Output readback         | `outputTensor.data()`                              | Avoids synchronous readback; does not guarantee a frame rate.                                                             |
| Stored photos           | WebP with JPEG fallback after inference            | Reduces upload/storage bytes; final sizes vary by image.                                                                  |
| Blob URLs               | Per-card ownership and cleanup                     | Avoids stale URLs when a photo blob is replaced.                                                                          |
| React rendering         | Memoized components and selected stable callbacks  | Can skip renders when props stay equal; no measured percentage is claimed.                                                |
| Overlay effects         | Reduced mobile backdrop blur                       | Reduces filter work; target-phone frame rates remain a manual measurement.                                                |
| Model and canvas reuse  | One cached model instance and one shared canvas    | Avoids repeated initialization/allocation within the page session.                                                        |
| Database access         | Indexed scan lookups and guideline `bulkPut()`     | Guideline writes are batched; full scan collections are still materialized during History queries and cloud refreshes.    |
| Fonts and modal bundles | Font swapping and dynamic Details import           | Shows fallback text and defers some UI code.                                                                              |
| Duplicate photos        | SHA-256 lookup before inference                    | Reuses an active saved report; not a new prediction.                                                                      |
| Cloud request timeout   | 10-second abort timer with retries                 | Limits a stalled request attempt; total synchronization time is not capped at 10 seconds.                                 |
| Concurrent sync         | Lock and one queued follow-up pass                 | Serializes sync work while preserving new pending mutations.                                                              |
| Cloud identity          | Reused anonymous guest session for private scans   | Adds background Auth requests; diagnosis and local History do not wait for them. Device/network impact needs measurement. |
| Connection hints        | Supabase preconnect and DNS-prefetch               | May reduce connection setup delay; network measurements are needed.                                                       |

---

## 1. On-Device AI Engine & WebGL GPU Optimizations

### 1.1 Dynamic Code-Splitting for TensorFlow.js (`page.tsx`)

- **Problem:** Importing `@tensorflow/tfjs` and `@/lib/classifier` statically at the top of `page.tsx` pulled the entire ~1.5MB TensorFlow.js engine into the initial JavaScript bundle, delaying First Contentful Paint (FCP) on slow 3G networks.
- **Solution:** TensorFlow.js functions are dynamically imported using `await import("@/lib/classifier")` inside the model initialization `useEffect` and inside the `runDiagnosis` handler.
- **Expected effect:** Page content can render while TensorFlow.js loads in the background. First-contentful-paint timing needs measurement on the target device and connection.

### 1.2 CPU Canvas Pre-Downscaling (GPU VRAM Protection)

- **Problem:** Smartphone cameras produce 12MP to 108MP photos (e.g. 4000x3000 pixels). Converting raw high-res images directly into TensorFlow.js tensors allocates 36 million floating-point numbers in GPU memory before resizing.
- **Solution:** In `src/lib/classifier.ts`, photos are resized to **224x224 pixels** with browser Canvas before `tf.browser.fromPixels()` is invoked. The entire image is drawn into the square; this step resizes rather than crops, and can stretch a non-square image. Browser interpolation is not guaranteed to match the training loader.
- **Expected effect:** Reduces the input tensor to 150,528 channel values, about 239 times fewer than a 12-megapixel RGB image. This is an input-size comparison, not a measurement of total GPU memory or proof that a browser cannot crash.

### 1.3 WebGL 16-Bit Float Textures

- **Implementation:** `tf.env().set("WEBGL_FORCE_F16_TEXTURES", true)` is executed prior to model initialization.
- **Rationale:** Requests half-float texture storage on the WebGL path. Compatible textures use fewer bytes than float32 textures; this does not halve all application memory or establish that every GPU operation uses 16-bit arithmetic. Saved model files, class mapping, and thresholds stay unchanged, but rounding can alter scores or a decision near a threshold. The flag alone does not establish the cause of a wrong diagnosis or guarantee unchanged accuracy.
- **Download trade-off:** The historical Trial 3 bundle was 11.53 MB. The current V4.3.0 Combined bundle's five files total 12,101,642 bytes (about 12.10 MB). A separately verified float16 export could reduce transfer size, but it is not shipped; this review changes no model artifact.

The installed behavior can be checked in TensorFlow.js 4.22.0's [WebGL flag definitions](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-backend-webgl/src/flags_webgl.ts). Use browser/device evidence before changing this flag or claiming a benefit from another precision setting.

### 1.4 Asynchronous Non-Blocking Inference & Garbage Collection

- **Implementation:** Output tensors are extracted via `await outputTensor.data()` instead of synchronous `dataSync()`.
- **Scope:** Asynchronous readback does not move `model.predict()`, shader compilation, canvas work, or JavaScript CPU-backend computation off the main thread. It does not establish smooth frames during every scan.
- **Tensor cleanup:** `tf.tidy()` releases intermediate tensors, and the returned output tensor is disposed after successful readback. A rejected `data()` skips that disposal in the current code. Automated R01 checks successful predictions for net tensor-count growth; error paths, native bitmap memory, and pooled GPU allocation need separate checks.

### 1.5 Startup GPU Shader Warmup & Light Green Splash Screen

- **Implementation:** On app launch, the adopted single V4.3.0 Combined model loads and runs a dummy inference with `tf.zeros([1, 224, 224, 3])` behind the existing light organic green (`#f6faf1`) splash screen (`<SplashScreen />`).
- **Rationale:** Compiles model shaders before the first real scan. Its five files total about **12.10 MB**. The whole UI currently waits behind the splash screen; model/config requests have no application deadline. A rejected request is logged and clears the loading state, but there is no dedicated translated initialization-retry prompt. A request that remains pending can leave the splash visible. The [dated review](#startup-and-inference) records the short local measurements and proposed recovery work.

### 1.6 Module-Level Model Singleton Cache (`classifier.ts`)

- **Implementation:** The cached model and its loading promise persist at module level outside React's component lifecycle.
- **Behavior:** After successful initialization, subsequent calls reuse the same model in the current page session. Network reconnection does not reload it; a full page reload or terminated browser process creates a new in-memory session. A rejected loading promise currently remains cached too, so an in-page retry does not start a fresh attempt. A future retry fix must preserve the single-flight safeguard and dispose any graph left by failed warmup.

### 1.7 Singleton Canvas Reuse (`classifier.ts`)

- **Implementation:** A module-level `sharedCanvas` HTMLCanvasElement is created once and reused for all subsequent `downscaleToCanvas()` calls.
- **Context Hint:** Canvas 2D context uses `{ alpha: false }` for an opaque output. Uploaded files can still contain transparency, so this setting is part of the image-processing behavior rather than proof that every input is a JPEG.
- **Confidence Rounding:** Replaced `parseFloat(maxProb.toFixed(2))` (float→string→float) with `Math.round(maxProb * 100) / 100` (pure numeric operation) in the inference hot path.

### 1.8 One-Time Splash Screen Guard (`page.tsx`)

- **Implementation:** A module-level `hasInitialized` flag persists across React remounts, network reconnections, and `useSync` state updates.
- **Behavior:** The splash screen renders **only once** on the very first app load. Going offline → online, component remounts, and sync triggers never re-trigger the splash screen.

### 1.9 Console probability tables (`classifier.ts`)

- **Implementation:** Each actual inference prints one collapsed table of the seven class scores in development and production DevTools. A saved duplicate reused without inference does not print another table.
- **Purpose:** Supports developers, teammates, and technical reviewers who need to inspect accepted or rejected predictions. The result modal retains its existing presentation.
- **Behavior:** Sorting uses copied values, and rounding applies only to the printed percentages. The original probabilities, class mapping, model files, and rejection thresholds remain unchanged. Scores for one photo are not accuracy measurements.
- **Cost:** Creates seven diagnostic rows and formats their percentages once per inference; it adds no model pass or network request. Console rendering costs can vary by browser and whether DevTools is open. No device-performance improvement or slowdown has been measured for this change.

---

## 2. Frontend React Architecture & DOM Optimizations

### 2.1 Per-Card Blob URL Management (`scan-card.tsx`)

- **Problem:** Maintaining a centralized `blobUrlMap` in `page.tsx` meant adding or deleting a single scan caused all Blob ObjectURLs across the entire history list to be revoked and regenerated, causing visible image flickering and memory spikes.
- **Solution:** Blob URL creation is scoped directly inside `scan-card.tsx` using a local `useEffect` linked to `imageBlob`.
- **Cleanup:** Each `ScanCard` revokes its own `ObjectURL` upon unmounting or when the scan blob changes. Its render checks which blob owns the URL, avoiding reuse of a stale URL while effects update. This targeted cleanup is not proof of zero heap leaks across the application.

### 2.2 Modular Component Refactoring & `React.memo()` Memoization

- **Structure:** Scoped UI into isolated components (`SplashScreen`, `TopHeader`, `BottomNav`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `Footer`), grouped into `src/components/` subfolders by role: `brand/`, `layout/`, `modal/`, `scan/`, and `tab/`.
- **Per-Tab Components:** `HomeTab`, `HistoryTab`, and `AboutTab` replace the inline `activeTab` branches previously in `page.tsx`. Only the active tab's subtree is mounted, so switching tabs unmounts the other two instead of keeping all three in the render output.
- **Memoization:** `HomeTab`, `HistoryTab`, `AboutTab`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `TopHeader`, `BottomNav`, `Icon`, `Logo`, and `Footer` are wrapped in `React.memo()` to prevent unnecessary re-renders when parent state changes. `SplashScreen` is not memoized because it renders once before the model finishes loading and is then replaced.
- **Stable Callbacks & Refs:** `handleViewAllHistory` and `setLanguage` are wrapped in `useCallback`. `selectedFileRef` and `previewUrlRef` stabilize `runDiagnosis` callback identity across state changes.

### 2.3 Dexie Reverse Query Optimization (`page.tsx`)

- **Implementation:** The `_status` index selects active scans, but `sortBy("updated_at")` then materializes the complete result and sorts it in JavaScript. Installed Dexie copies that array before sorting; the following `reverse()` reverses the sorted array. This runs on qualifying live-query updates, rather than on every unrelated React render.
- **Limit:** Four Home cards and six History cards limit rendering only. The parent query still reads every active full scan record, including its photo Blob, even on About. The [dated query comparison](#history-query-measurements) explains why limits should eventually be applied while reading IndexedDB. That alternative has been measured in isolation, not implemented in the app. See [Dexie's sortBy documentation](<https://dexie.org/docs/Collection/Collection.sortBy()>) for the sorting behavior.

### 2.4 Mobile Overlay Backdrop Blur Removal

- **Implementation:** Replaced heavy `backdrop-blur-md` on mobile full-screen overlays with lightweight `bg-black/60 md:backdrop-blur-sm` in `diagnostic-scanner.tsx`, `scan-details-modal.tsx`, and `legal-modal.tsx`.
- **Expected effect:** Reduces backdrop-filter work on small screens. Frame rate on budget phones needs physical-device measurement.
- **Remaining work:** The sticky mobile header still uses `backdrop-blur-md`; smaller preview and badge filters also remain. Their scrolling cost should be compared before changing the styling.

### 2.5 Post-Inference Storage Compression (WebP with JPEG Fallback)

- **Ownership:** `src/lib/image-storage.ts` contains the reusable browser-Canvas helper, with comments explaining its purpose and why it runs after prediction. `page.tsx` imports it directly; `classifier.ts` re-exports it for existing callers. This module extraction preserves the algorithm and settings and does not establish a measured performance improvement.
- **Flow:**
  1. User snaps a photo.
  2. AI model analyzes the image through the existing 224x224 preprocessing before storage compression.
  3. **AFTER** prediction finishes, `compressImageForStorage()` resizes the photo to a max dimension of 1000px and compresses using **WebP at 75% quality** (~70–90 KB). If the browser doesn't support WebP canvas export, automatically falls back to **JPEG at 80% quality** (~150 KB).
- **Expected effect:** Reduces stored and uploaded image bytes. The sizes above are examples; actual compression and upload time depend on image content and network conditions. This compression occurs after diagnosis and does not change that completed prediction.

### 2.6 Dynamic Code-Splitting for Modals (`page.tsx`)

- **Implementation:** `ScanDetailsModal` is loaded via `next/dynamic` instead of static imports.
- **Scope:** The dynamic import defers component execution until a scan detail is rendered and keeps that code outside the main route bundle. The generated service worker also precaches application JavaScript, including this async chunk, so it can download the file earlier for offline use. Dynamic importing does not guarantee that the first detail opening is the first network download.

### 2.7 Type-Only TensorFlow.js Import (`page.tsx`)

- **Implementation:** Uses `import type * as tf from "@tensorflow/tfjs"` in `page.tsx`.
- **Impact:** TensorFlow.js is no longer pulled into the main page bundle for type-only usage.

---

## 3. PWA Offline Infrastructure & Network Caching

### 3.1 Service Worker Model Pre-Caching (`sw.ts`)

- **Strategy:** Serwist precaches the five adopted V4.3.0 Combined model files under `/model/`: `model.json`, `model_config.json`, and three weight shards. The `CacheFirst` runtime rule remains as defence in depth.
- **Expected effect:** Enables offline model loading after successful service-worker installation and caching, while browser storage remains available. Loading still requires local model initialization; cache eviction, cleared site data, or an incomplete first load can prevent it. R02 and the physical checklist verify this behavior for a recorded environment.
- **Versioned cache name:** `mangoleaf-model-cache-v4-3-0` for the adopted V4.3.0 Combined model, retained by app candidate `0.5.0`. Activation deletes superseded model caches, including V4.1.1, V4.2.0, and V4.3.0 candidate runtime caches. The active V4.3.0 cache is protected by the activation filter.
- **The precache is the real update mechanism.** Public files receive content-revision hashes in Serwist's precache manifest, which is matched before runtime caching. Replaced weights therefore refetch on next activation. An empty runtime model cache is normal; verify updates in generated `public/sw.js`.

### 3.2 High-Capacity Offline Database (Dexie.js / IndexedDB)

- **Storage Layer:** Binary photo Blobs and scan metadata are persisted locally using Dexie.js (IndexedDB).
- **Indexed Queries:** Active scans are queried via `db.scans.where("_status").notEqual("pending-delete")` using Dexie's native index instead of in-memory JS `.filter()`. Pending sync scans use `db.scans.where("_status").anyOf(["pending-insert", "pending-delete"])`.
- **Efficient Lookups:** Finding the newest scan uses `db.scans.orderBy("updated_at").last()` instead of loading all records into memory.

### 3.3 Batch Database Operations (`useSync.ts`)

- **Guidelines Sync:** A successful full download replaces the cached snapshot with `clear()` and `bulkPut()` in one IndexedDB transaction. This also removes rows deleted remotely when their Realtime event was missed. A failed download does not clear cached advice.
- **Guidelines Display:** Scan details read the existing live-query cache and perform no additional network request. Downloaded advice remains available offline; missing or blank text uses a translated status message. The bundled treatment dictionary has been removed, so guideline revisions are maintained in Supabase and arrive through successful synchronization. No download-time or bundle-size benchmark was measured for this change.
- **Scans Sync:** Remote cloud IDs are matched through the local `cloud_id` index. Photos already present as Blobs are reused; missing private photos are downloaded and saved with metadata in guarded transactions. Each result is rechecked after the network request so a concurrent local deletion is not replaced by the restored row.

### 3.4 Duplicate Photo Checker (SHA-256 Image Hash)

- **Implementation:** Photo selection starts one asynchronous `computeImageHash()` call in the lightweight `image-hash.ts` module using browser-native Web Crypto. This calculates a 64-character SHA-256 fingerprint of the original file. Time and buffer size depend on original photo size; the helper imports no TensorFlow.js code and does not run model inference or upload the photo. `classifier.ts` re-exports the helper for existing callers.
- **Lookup:** The hash is checked against the indexed `image_hash` column in Dexie's `scans` table, rather than reading the whole history. Reuse requires the exact active `model_version`; pending-deletion rows, another model version, and legacy unversioned rows are excluded. Older records remain visible in History, while reuploading their photo runs the adopted model.
- **Duplicate Found:** The existing preview shows "Photo already scanned" with Retake, Cancel, X, and View saved result. Opening that result is an explicit action and creates no record or prediction. The saved record is checked again before opening in case it changed during review. Reopening a report does not count as an R01 prediction.
- **New Photo:** Diagnosis stays disabled while checking. The completed hash is retained for this selected file and reused at diagnosis and save time. A final indexed lookup catches a duplicate saved since the preview check, without rereading and hashing the image bytes. No match means normal inference, compression, and storage of `image_hash` in IndexedDB and Supabase.
- **Cleanup:** Closing or retaking clears selection state, resets the picker, and releases the preview object URL. A stale asynchronous check cannot update a newer selection or reopen a dismissed preview. Rapid repeated diagnosis clicks are guarded so one review cannot start overlapping inference calls. Lookup failure keeps diagnosis disabled and offers a retry.
- **Scope:** This is exact-file matching, not perceptual matching. Edited, cropped, or recompressed copies can be treated as new photos; the app does not automatically block similar-looking leaves.

<a id="35-3g-network-resilience-upload-timeout-supabase-clientts-usesyncts"></a>

### 3.5 3G Network Resilience: Cloud Request Timeout (`supabase-client.ts`, `useSync.ts`)

- **Problem:** On weak 3G connections with packet loss, the default browser `fetch()` can hang for **30–60 seconds** waiting for a Supabase Storage upload response.
- **Solution:** A Supabase client fetch wrapper applies a real 10-second `AbortController` timeout to cloud requests, including Auth, guideline reads, private photo reads, and writes. The timer covers response-body reading as well as headers, and requests use `cache: "no-store"`. Storage's `upload()` options do not accept a signal, so this cancellation happens at its underlying fetch layer. The retry delays are 10 seconds, 30 seconds, 60 seconds, then every 5 minutes while online. Each request and the whole synchronization pass are different scopes; the latter can take longer than one request timeout.
- **Safety:** The scan record remains `pending-insert` in IndexedDB. A successful blob upload stores its owner-scoped private object path locally before row insertion, so a later metadata failure can retry that small row without re-uploading photo bytes. A public URL is not used as an authorization bypass.

### 3.6 3G Network Resilience: Concurrent Sync Lock (`useSync.ts`)

- **Problem:** On slow 3G, multiple sync triggers (e.g., going online + taking a new scan simultaneously) could fire overlapping network requests.
- **Solution:** A `useRef`-based `isSyncingRef` lock allows one sync at a time. A trigger arriving during active work queues exactly one follow-up pass, which prevents overlap without losing a new local mutation.
- **Mobile background recovery:** Returning the PWA to the foreground clears a throttled retry timer and starts a fresh online sync immediately.
- **Limit:** Every sync trigger also starts a public-guideline refresh, and each private history refresh reads the complete owner result. Serialization prevents concurrent private passes but does not remove repeated downloads, unchanged database writes, or full History-query invalidations. Application retries and the guideline subscription are not explicitly paused when the document is hidden. Supabase Auth already handles its own refresh visibility; that is a separate mechanism.

### 3.7 Background guest identity and private photo downloads

- **Local first:** Guest creation and session refresh belong to cloud synchronization. Neither is part of the classifier path or a prerequisite for saving a scan locally. The first online guest request and later refreshes add network work; no zero-overhead claim is made.
- **Session reuse:** The saved guest session is reused instead of creating an identity for each scan or reconnect. A shared pending task serializes guest creation, with an additional Web Lock across tabs where supported. The caller stops waiting after 15 seconds; individual HTTP requests abort after 10 seconds. If cloud authorization is unavailable, pending scan changes remain in IndexedDB for a later retry. A refresh error does not trigger creation of a replacement guest.
- **Public guidance:** Guideline downloading and live updates remain independent of private scan authorization. A failed guest request must not block published treatment guidance.
- **Private photos:** Restored photos require authenticated downloads. Once saved as local Blobs, subsequent offline display uses IndexedDB. The fetch wrapper buffers each response body before handing it to the SDK, adding temporary byte storage; no exact memory saving is claimed. The app must not expose private photo bytes in a shared public runtime cache or replace a failed download with the old public URL. A local-only report without bytes shows a translated photo-unavailable label and retains its metadata.
- **Evidence limit:** Additional Auth/download latency and memory depend on connection, browser, photo sizes, and restored history. Existing inference benchmarks do not measure this new cloud path; use the [cloud checks](testing/TESTING.md#cloud-ownership-and-offline-checks) and [Supabase guide](supabase/SECURITY-AND-SYNC.md).
- **Rollout status:** The live server's private bucket and owner policies are applied and verified. The updated client remains a locally validated candidate pending deployment; no production signup/upload timing or device-performance improvement is claimed from the security checks.

---

## 4. CSS & GPU Compositing Optimizations

### 4.1 Solid Backgrounds on Scroll List Cards (`scan-card.tsx`)

- **Current implementation:** Scan cards use a solid `bg-white` background without a backdrop-blur filter. The older `bg-slate-900/95` value belongs to the previous dark UI.
- **Expected effect:** Avoids a backdrop filter on every card; scrolling smoothness still needs device measurement.

### 4.2 Targeted CSS Transitions

- **Current implementation:** Many controls use `transition-colors` or `transition-transform`; some containers, including scan cards, still use `transition-all`.
- **Expected effect:** Restricts the properties animated by those controls. Color changes can require repainting, so these classes are not proof that all transitions run only in the compositor.

### 4.3 Clean Text Justification Engine

- **Implementation:** Text callouts and guideline blocks use `text-justify [text-justify:inter-word] break-words hyphens-auto` paired with dynamic `lang="en" | "ceb"` attributes.
- **Impact:** Prevents unsightly line breaks and word gaps across English and Bisaya text without JS layout measurement overhead.

### 4.4 Font Loading Optimization (`layout.tsx`)

- **Implementation:** Added `display: "swap"` to both `Geist` and `Geist_Mono` font configurations.
- **Impact:** Eliminates Flash of Invisible Text (FOIT) on slow 3G/4G networks.
- **Font Variable Fix:** Updated `globals.css` body rule to use `var(--font-sans)` before falling back to Arial/Helvetica.

### 4.5 Supabase Network Preconnect (`layout.tsx`)

- **Implementation:** Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` for the Supabase project URL in document `<head>`.
- **Expected effect:** Allows the browser to prepare the Supabase connection earlier. Any latency saving depends on whether the browser uses the hint and whether a connection is already available.

---

## Accuracy and runtime evidence

App `0.4.9` adopts V4.3.0 Combined with unchanged graph/shard bytes, seven-class order, preprocessing, folded temperature, and fitted `0.70 / 0 / 0.42` gates. Only release metadata changes in `model_config.json`; the [adoption receipt](model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records both configuration hashes. Adoption does not provide a new performance benchmark.

On October 2, 2026, filtered R01 passed one `chromium-mobile` case with a test duration of 57.2 seconds. It made eight photos × 30 actual predictions (240), with stable raw/displayed classes and acceptance, maximum raw-confidence range `0`, and maximum net tensor growth per photo `0`. The report records WebGL and browser `153.0.8010.12`. These same-session measurements describe application input fingerprint `aafefbaaff86b0c86f55ef534afc3e0e416dcb1825c15c5aaf912ed48703100a`; they do not establish field accuracy, browser/Keras parity, or a general inference-speed guarantee. The adoption receipt preserves the final core/R01 report records and hashes.

The [V4.3.0 report](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) preserves 386/393 raw correct predictions (98.22%), 373 correct/3 wrong accepted, 17 rejected mango images, and 24/84 plus 5/32 false OOD accepts on reused collections. These seven-class observations measure a different task from V3's six-class score and do not establish field accuracy, independent OOD rejection, or full browser/Keras parity. See the [testing guide](testing/TESTING.md) for automated validation status.

> **Note on AI accuracy:** The **97.46%** figure describes the recorded Trial 3 evaluation on 393 images. It is not a measured accuracy guarantee for browser inference or farm photos. Storage compression happens after prediction, but preprocessing, numeric precision, and rejection gates can affect runtime results. Browser consistency and UI tests do not establish diagnostic accuracy.
>
> The three trial figures are not a trend line. Trial 2 scored 98.25% on a test set that contained near-duplicate copies of its own training images, so part of that score measured memorization. Perceptual-hash deduplication removed the duplicates before splitting, which is why Trial 2.1's 97.12% on 417 images is the honest figure rather than a regression. Trial 3 then changed the image pool, so its 97.46% is measured on a different 393-image test set again. Each number describes its own test set and none of them is a higher or lower version of another. See [model-training/non-experiment/v3/TRIAL_v3.md](model-training/non-experiment/v3/TRIAL_v3.md) for the previous released model and [model-training/non-experiment/v2.1/TRIAL_v2_1.md](model-training/non-experiment/v2.1/TRIAL_v2_1.md) for the deduplication work. V4 through V4.3.0 use seven classes; their reused-set results describe a different task and still need independent field evaluation.

---

## Low-end-device performance review: October 3, 2026

> **Review snapshot:** These findings describe app `0.4.9`, model `v4.3.0`, before the storage-photo helper extraction. The runtime improvements below remain recommendations; this review does not establish a speed, heat, or battery improvement.

### Outcome and scope

The application already avoids continuous camera analysis, reuses one model, limits TensorFlow input to 224×224, compresses saved photos, and keeps cloud uploads separate from local diagnosis. The most useful next improvements concern how much History data is read, how startup failures recover, and how much background synchronization repeats.

The review covers startup, History queries, image processing, inference, and background synchronization. Short browser probes used an isolated production export and local mock backend.

The measured application fingerprint is `a316d8017d732e678704809b74289e3100beb4896611e8760f883ec78a923f71`. Raw probes and exact pre-edit documentation copies are saved locally under ignored `.tools/performance-review-20261003/`. These are local diagnostic records, not files deployed with the app.

### What the evidence means

- **Source finding:** the current code demonstrably performs the described work. It does not establish how often a farmer experiences a problem.
- **Browser measurement:** a short local desktop Chromium run with a 360×740 viewport, a local mock backend, and service workers blocked. It measures this environment only.
- **Synthetic failure check:** current classifier control flow executed with fake TensorFlow objects and deliberately failed or stalled operations. It proves a cleanup/retry branch, not actual GPU behavior.
- **Unmeasured:** target-phone temperatures, battery use, native camera behavior, and long-session thermal throttling. Desktop CPU slowdown cannot reproduce a phone's processor, GPU, memory limits, or heat. [Chrome CPU-throttling reference](https://developer.chrome.com/docs/devtools/performance/reference#cpu-throttle).

### Priorities in plain English

| Priority | Finding                                                                          | What it means for users                                                                               | Recommended next change                                                                                                      |
| -------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1        | History reads every saved scan before selecting a few cards.                     | Keeping more reports increases repeated database and sorting work, including on Home.                 | Read Home's newest four records and History's needed page through indexed queries. Load photo data only where needed.        |
| 1        | Startup waits for model/config requests without an application deadline.         | A stalled request can keep the whole app on its loading screen.                                       | Add bounded loading, a clear retry state, and cleanup of failed attempts. Evaluate keeping History available while AI loads. |
| 2        | Synchronization repeatedly reads full history and rewrites unchanged guidance.   | One saved scan can trigger work involving many older scans.                                           | Separate queued uploads/deletes from history refresh and guidance refresh; coalesce events and skip unchanged snapshots.     |
| 2        | Original camera photos are decoded and hashed at their original size.            | A small preview does not prevent a very large photo from stressing memory.                            | Measure decode/hash/encode separately, evaluate a bounded review thumbnail, and handle unreasonable image sizes clearly.     |
| 2        | Guidelines have both IndexedDB and a service-worker HTTP cache.                  | An older successful cached response could replace newer locally updated advice after network failure. | Make guideline REST reads network-only in the worker; retain Dexie as the offline advice cache.                              |
| 3        | Application retries/subscriptions continue without an explicit hidden-page gate. | Some cloud work can continue while the farmer is using another app.                                   | Pause application background retries/subscriptions and resume reconciliation on return; preserve queued scans.               |
| 3        | Remaining backdrop filters and possible image-URL churn.                         | They can add redraw work, especially when scrolling.                                                  | Compare header blur and count URL changes before altering effects or memoization.                                            |

These are implementation priorities, not claims of a measured temperature reduction or a guaranteed speedup.

### History query measurements

Current code at [page.tsx](../src/app/page.tsx#L169) selects every active scan and calls `sortBy("updated_at")`. Only afterward do [Home](../src/components/tab/home-tab.tsx#L27) and [History](../src/components/scan/scan-history-list.tsx#L57) select four or six cards.

Installed Dexie implements `sortBy()` by reading the collection, copying the array, and sorting in JavaScript. This is not ordering performed by IndexedDB's date index. [Dexie sortBy documentation](<https://dexie.org/docs/Collection/Collection.sortBy()>).

The refined probe used the exact installed Dexie library and current query. It compared that query with a hypothetical date-index query limited to six active records. Each row contained a synthetic 65,536-byte photo Blob; five reads per method produced the medians below. CPU slowdown was set to 4×. The proposed query was not installed in application source.

| Saved records | Current complete query, median | Proposed six-row indexed query, median |
| ------------- | ------------------------------ | -------------------------------------- |
| 25            | 8.5 ms                         | 3.4 ms                                 |
| 250           | 33.5 ms                        | 2.9 ms                                 |
| 1,000         | 93.6 ms                        | 3.2 ms                                 |

The complete 1,000-record result referenced 65,536,000 bytes of compressed Blob payload; six records referenced 393,216 bytes. Those totals are not measurements of heap allocation or decoded image memory. Browsers can represent Blob bytes outside the JavaScript heap.

This comparison covers query completion, record materialization, and sorting. It does not measure a rewritten Home/History interface, search behavior, rendering, cloud traffic, or a real phone. A bounded History implementation must preserve search, filters, counts, chronological order, pending-deletion behavior, and old model reports. Changing `.slice()` alone would leave the large read in place.

An earlier native-cursor prototype was saved separately as `browser-probe-cursor.json`. The table above uses the refined actual-Dexie probe in `browser-probe.json`, not that preliminary comparison.

### Startup and inference

#### What the short startup probe observed

The refined probe required the model's warmup-complete console event and the visible Scan button. It used one fresh browser context per CPU setting, local unthrottled network access, and the same desktop browser process.

| Desktop CPU setting | Model warmup and visible UI observed | Longest observed main-thread task |
| ------------------- | ------------------------------------ | --------------------------------- |
| Normal              | 2,278.7 ms                           | 1,946 ms                          |
| 4× slowdown         | 4,937.2 ms                           | 2,734 ms                          |

These are two samples, not an average startup benchmark. Each fetched 2,012,570 decoded JavaScript asset bytes and 12,101,642 model asset bytes. Decoded resource size is not compressed wire-transfer size. The main-thread observer records blocking durations, but these measurements do not attribute the entire task to a particular shader or function.

#### Why startup can remain stuck

[page.tsx](../src/app/page.tsx#L75) hides the application behind the splash until initialization settles. [classifier.ts](../src/lib/classifier.ts#L110) waits for both the graph and its optional configuration. Neither model nor configuration fetch has an application deadline. The Supabase timeout applies to cloud requests, not to these model requests.

The synthetic stalled-config check completed graph loading but left configuration pending. Initialization remained pending. A rejected initialization clears the splash and logs an error, but current code has no dedicated initialization-retry prompt.

The proposed fix should bound waiting and present an understandable retry option. It must retain one in-flight model load, keep fitted settings together with their model, and avoid quietly changing confidence/margin/entropy behavior to make startup succeed.

#### Cleanup and retry defects found in failure branches

- A rejected output `data()` skips output-tensor disposal. The synthetic check observed zero disposal calls on failure and one on success. This output has seven values, so this defect alone is not evidence of major overheating.
- A failed model load leaves its rejected promise cached. Two calls produced only one underlying load attempt, repeating the same failure instead of retrying.
- A graph loaded before a failed warmup was not disposed. Retrying must first release that failed attempt and preserve the model singleton.

Successful prediction cleanup already exists. Error-path recovery should be added without changing numerical inference behavior.

#### Asynchronous does not mean all work runs away from the screen

`outputTensor.data()` is asynchronous, but `model.predict()`, canvas operations, JavaScript CPU-backend work, and shader compilation can still occupy the main thread. TensorFlow.js describes these backend differences and warmup costs in its [platform guide](https://www.tensorflow.org/js/guide/platform_environment).

A worker or compatible WASM path is a separate experiment. It requires operation support, offline assets, recovery, and class/probability/gate parity checks. It should follow evidence of CPU fallback or large synchronous stalls on the target hardware.

### Photos and memory

[image-hash.ts](../src/lib/image-hash.ts#L3) reads the original file into a buffer. The review displays that original file, and diagnosis loads the original file into another `Image` before creating the small TensorFlow input. The 192-pixel CSS preview controls layout, not original photo dimensions. This does not prove a second decoder allocation; a browser may share decoded data.

For scale, a hypothetical 4,000×3,000 decoded surface at four bytes per pixel is 48,000,000 bytes. This is an illustration, not measured browser memory. Browser decoder downscaling, sharing, cache behavior, and backing formats differ; two object URLs do not prove two full decoded copies.

The next measurement should separate selection, hashing, decoding, inference, storage encoding, IndexedDB save, and result rendering. Existing R01 timings begin after image decode and do not measure the full photo-to-result delay. Stable tensor counts also do not measure native photo buffers or reserved WebGL texture pools.

A smaller review thumbnail should remain separate from the inference input until pixel and score checks prove that a new resizing path preserves behavior.

### Cloud and interface findings

[useSync.ts](../src/hooks/useSync.ts#L83) starts a guideline fetch on each synchronization trigger. Successful responses clear and rewrite the cache even when the text is unchanged. Authentication events, foreground return, local mutations, and Realtime subscription can cause more passes. Private-operation locks serialize work; they do not remove repeated refreshes.

[cloud-sync.ts](../src/lib/cloud-sync.ts#L177) reads all owner metadata and matching local records, including Blob fields. Multiple status/path writes during one upload can cause the complete live History query to rerun. Prefer mutation-only passes for queued uploads/deletes and bounded history restoration, with correct deletion reconciliation. Existing photos already present locally should continue to skip downloads.

[sw.ts](../src/sw.ts#L29) explicitly bypasses caches for private requests, but not guideline reads. In the production cross-origin configuration, guidelines can match Serwist's default network-first cache. A previously cached HTTP 200 could then be mistaken for a fresh successful snapshot after network failure and overwrite newer Realtime guidance. This is a source-established possible sequence, not an observed production data regression. A separate isolated service-worker test should reproduce it before a fix. Public advice already has an offline home in Dexie.

Application retries and the guideline channel have no explicit hidden-document pause. Installed Supabase Auth already pauses its own refresh timer when hidden; application work and Auth refresh must not be confused.

The sticky header retains mobile backdrop blur. Visible card URLs can also be recreated when queries return fresh Blob objects after metadata-only changes. Cleanup exists; neither point establishes a leak or a measured scrolling regression. Measure those effects before changing styling or cache identity.

### Safeguards to preserve

- Native camera/gallery selection without continuous video inference.
- One model and one small preprocessing canvas, with guarded scan clicks.
- Active-model duplicate reuse and successful tensor cleanup.
- Compression after inference; saved photos limited to a 1,000-pixel maximum dimension.
- Local-first saves and offline advice in IndexedDB.
- Four Home/six History cards, lazy card images, and object-URL cleanup.
- Private owner checks, Web Locks, request deadlines, durable pending mutations, and escalating retries.
- Reduced-motion support and sheet dragging that avoids a React render for every touch movement.

### Suggested implementation sequence and checks

1. Add bounded, recoverable startup and failure-path disposal. Validate stalled config/graph/shards, a transient failure followed by retry, and no duplicate live graphs using the isolated backend.
2. Bound Home and History queries. Verify chronological ordering, searches, filters, pagination, legacy reports, and deletion races. Repeat the large-history comparison against the implemented UI.
3. Separate cloud synchronization jobs, suppress unchanged advice writes, and explicitly control guideline HTTP caching. Verify offline advice, Realtime updates/deletions, reconnects, and durable upload/delete retries.
4. Measure large-photo stages and scrolling effects. Evaluate thumbnails, mobile blur changes, or a worker/backend experiment only where the measurements support them.

Each runtime change needs its applicable functional checks and `bun run typecheck`, `bun run lint`, and `bun run build`. Performance changes involving model pixels or a different backend additionally require prediction/gate parity. Heat or battery claims need recorded target-device measurements; the short probes here cannot supply those claims.
