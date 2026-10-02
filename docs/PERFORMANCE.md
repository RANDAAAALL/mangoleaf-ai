# MangoLeaf AI: System Performance & Optimization Specifications

This document describes the performance mechanisms implemented in **MangoLeaf AI** (`mangoleaf-ai`). Their effects depend on the image, browser, hardware, and network. Use [TESTING.md](TESTING.md) and the [physical reliability checklist](PHYSICAL_RELIABILITY_CHECKLIST.md) to record measurements for the exact candidate and device.

The matrix distinguishes implementation choices from measured outcomes. Earlier instant-loading, fixed-frame-rate, and zero-leak claims were not established device benchmarks. R01 measures repeated-inference consistency; R02 exercises cached offline behavior; R03 records a 30-minute session. None proves field accuracy or performance on every phone.

---

## Performance mechanisms and expected effects

| Mechanism               | Current implementation                             | Expected effect or evidence limit                                                                        |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| TensorFlow.js loading   | Dynamic classifier imports                         | Defers classifier code loading; total downloads and startup timing still need measurement.               |
| Input tensor size       | Canvas resizes to 224x224 before tensor creation   | 150,528 channel values instead of 36 million for a 12MP RGB image; this is not total application memory. |
| GPU textures            | `WEBGL_FORCE_F16_TEXTURES`                         | Uses half-float render textures on the WebGL path; score parity must be measured.                        |
| Model download          | Single V4.3.0 Combined export is precached locally | Reuses cached files while storage and revisions remain valid.                                            |
| Output readback         | `outputTensor.data()`                              | Avoids synchronous readback; does not guarantee a frame rate.                                            |
| Stored photos           | WebP with JPEG fallback after inference            | Reduces upload/storage bytes; final sizes vary by image.                                                 |
| Blob URLs               | Per-card ownership and cleanup                     | Avoids stale URLs when a photo blob is replaced.                                                         |
| React rendering         | Memoized components and selected stable callbacks  | Can skip renders when props stay equal; no measured percentage is claimed.                               |
| Overlay effects         | Reduced mobile backdrop blur                       | Reduces filter work; target-phone frame rates remain a manual measurement.                               |
| Model and canvas reuse  | One cached model instance and one shared canvas    | Avoids repeated initialization/allocation within the page session.                                       |
| Database batches        | `bulkGet()` and `bulkPut()`                        | Reduces per-record database work; no fixed speedup is established.                                       |
| Fonts and modal bundles | Font swapping and dynamic Details import           | Shows fallback text and defers some UI code.                                                             |
| Duplicate photos        | SHA-256 lookup before inference                    | Reuses an active saved report; not a new prediction.                                                     |
| Storage upload timeout  | 10-second abort timer with retries                 | Limits a stalled upload attempt; total synchronization time is not capped at 10 seconds.                 |
| Concurrent sync         | Lock and one queued follow-up pass                 | Serializes sync work while preserving new pending mutations.                                             |
| Connection hints        | Supabase preconnect and DNS-prefetch               | May reduce connection setup delay; network measurements are needed.                                      |

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
- **Download trade-off:** Trial 3 remains 11.53 MB across three shards. A separately verified float16 export could reduce transfer size, but it is not shipped; no model artifact was modified in this optimization pass.

The installed behavior can be checked in TensorFlow.js 4.22.0's [WebGL flag definitions](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-backend-webgl/src/flags_webgl.ts). Use browser/device evidence before changing this flag or claiming a benefit from another precision setting.

### 1.4 Asynchronous Non-Blocking Inference & Garbage Collection

- **Implementation:** Output tensors are extracted via `await outputTensor.data()` instead of synchronous `dataSync()`.
- **Tensor cleanup:** `tf.tidy()` releases intermediate tensors, and the returned output tensor is disposed after its data is read. Automated R01 checks for net tensor-count growth; browser heap and GPU allocation behavior still need observation during extended use.

### 1.5 Startup GPU Shader Warmup & Light Green Splash Screen

- **Implementation:** On app launch, the adopted single V4.3.0 Combined model loads and runs a dummy inference with `tf.zeros([1, 224, 224, 3])` behind the existing light organic green (`#f6faf1`) splash screen (`<SplashScreen />`).
- **Rationale:** Warms the model before the first real scan. If the model or config fails to load, startup resolves to a translated reload prompt. Its five files total about **12.10 MB**. First-load time, GPU/heap memory, and scan latency on low-end phones still need measurement.

### 1.6 Module-Level Model Singleton Cache (`classifier.ts`)

- **Implementation:** The cached model and its loading promise persist at module level outside React's component lifecycle.
- **Behavior:** After successful initialization, subsequent calls reuse the same model in the current page session. Network reconnection does not reload it; a full page reload or terminated browser process creates a new in-memory session.

### 1.7 Singleton Canvas Reuse (`classifier.ts`)

- **Implementation:** A module-level `sharedCanvas` HTMLCanvasElement is created once and reused for all subsequent `downscaleToCanvas()` calls.
- **Context Hint:** Canvas 2D context uses `{ alpha: false }` for an opaque output. Uploaded files can still contain transparency, so this setting is part of the image-processing behavior rather than proof that every input is a JPEG.
- **Confidence Rounding:** Replaced `parseFloat(maxProb.toFixed(2))` (float→string→float) with `Math.round(maxProb * 100) / 100` (pure numeric operation) in the inference hot path.

### 1.8 One-Time Splash Screen Guard (`page.tsx`)

- **Implementation:** A module-level `hasInitialized` flag persists across React remounts, network reconnections, and `useSync` state updates.
- **Behavior:** The splash screen renders **only once** on the very first app load. Going offline → online, component remounts, and sync triggers never re-trigger the splash screen.

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

- **Implementation:** IndexedDB query fetches active scans sorted descending directly at the query level using `db.scans.where("_status").notEqual("pending-delete").sortBy("updated_at").then(results => results.reverse())`.
- **Impact:** Eliminates in-memory `[...scans].reverse()` array copying and re-allocation on every render.

### 2.4 Mobile Overlay Backdrop Blur Removal

- **Implementation:** Replaced heavy `backdrop-blur-md` on mobile full-screen overlays with lightweight `bg-black/60 md:backdrop-blur-sm` in `diagnostic-scanner.tsx`, `scan-details-modal.tsx`, and `legal-modal.tsx`.
- **Expected effect:** Reduces backdrop-filter work on small screens. Frame rate on budget phones needs physical-device measurement.

### 2.5 Post-Inference Storage Compression (WebP with JPEG Fallback)

- **Flow:**
  1. User snaps a photo.
  2. AI model analyzes the image through the existing 224x224 preprocessing before storage compression.
  3. **AFTER** prediction finishes, `compressImageForStorage()` resizes the photo to a max dimension of 1000px and compresses using **WebP at 75% quality** (~70–90 KB). If the browser doesn't support WebP canvas export, automatically falls back to **JPEG at 80% quality** (~150 KB).
- **Expected effect:** Reduces stored and uploaded image bytes. The sizes above are examples; actual compression and upload time depend on image content and network conditions. This compression occurs after diagnosis and does not change that completed prediction.

### 2.6 Dynamic Code-Splitting for Modals (`page.tsx`)

- **Implementation:** `ScanDetailsModal` is loaded via `next/dynamic` instead of static imports.
- **Impact:** Component JS is downloaded only when the user opens a scan detail, keeping the main bundle lean.

### 2.7 Type-Only TensorFlow.js Import (`page.tsx`)

- **Implementation:** Uses `import type * as tf from "@tensorflow/tfjs"` in `page.tsx`.
- **Impact:** TensorFlow.js is no longer pulled into the main page bundle for type-only usage.

---

## 3. PWA Offline Infrastructure & Network Caching

### 3.1 Service Worker Model Pre-Caching (`sw.ts`)

- **Strategy:** Serwist precaches the five adopted V4.3.0 Combined model files under `/model/`: `model.json`, `model_config.json`, and three weight shards. The `CacheFirst` runtime rule remains as defence in depth.
- **Expected effect:** Enables offline model loading after successful service-worker installation and caching, while browser storage remains available. Loading still requires local model initialization; cache eviction, cleared site data, or an incomplete first load can prevent it. R02 and the physical checklist verify this behavior for a recorded environment.
- **Versioned cache name:** `mangoleaf-model-cache-v4-3-0` for the adopted V4.3.0 Combined model in app `0.4.9`. Activation deletes superseded model caches, including V4.1.1, V4.2.0, and V4.3.0 candidate runtime caches. The active V4.3.0 cache is protected by the activation filter.
- **The precache is the real update mechanism.** Public files receive content-revision hashes in Serwist's precache manifest, which is matched before runtime caching. Replaced weights therefore refetch on next activation. An empty runtime model cache is normal; verify updates in generated `public/sw.js`.

### 3.2 High-Capacity Offline Database (Dexie.js / IndexedDB)

- **Storage Layer:** Binary photo Blobs and scan metadata are persisted locally using Dexie.js (IndexedDB).
- **Indexed Queries:** Active scans are queried via `db.scans.where("_status").notEqual("pending-delete")` using Dexie's native index instead of in-memory JS `.filter()`. Pending sync scans use `db.scans.where("_status").anyOf(["pending-insert", "pending-delete"])`.
- **Efficient Lookups:** Finding the newest scan uses `db.scans.orderBy("updated_at").last()` instead of loading all records into memory.

### 3.3 Batch Database Operations (`useSync.ts`)

- **Guidelines Sync:** Remote guidelines are inserted via `db.guidelines.bulkPut()` in a single IndexedDB transaction instead of sequential individual `put()` calls.
- **Guidelines Display:** Scan details read the existing live-query cache and perform no additional network request. Downloaded advice remains available offline; missing or blank text uses a translated status message. The bundled treatment dictionary has been removed, so guideline revisions are maintained in Supabase and arrive through successful synchronization. No download-time or bundle-size benchmark was measured for this change.
- **Scans Sync:** Remote scans are checked with one `db.scans.bulkGet()` and inserted through `db.scans.bulkPut()`, avoiding one IndexedDB request per restored history row.

### 3.4 Duplicate Photo Checker (SHA-256 Image Hash)

- **Implementation:** Photo selection starts one asynchronous `computeImageHash()` call in the lightweight `image-hash.ts` module using browser-native Web Crypto. This calculates a 64-character SHA-256 fingerprint of the original file. Time and buffer size depend on original photo size; the helper imports no TensorFlow.js code and does not run model inference or upload the photo. `classifier.ts` re-exports the helper for existing callers.
- **Lookup:** The hash is checked against the indexed `image_hash` column in Dexie's `scans` table, rather than reading the whole history. Reuse requires the exact active `model_version`; pending-deletion rows, another model version, and legacy unversioned rows are excluded. Older records remain visible in History, while reuploading their photo runs the adopted model.
- **Duplicate Found:** The existing preview shows "Photo already scanned" with Retake, Cancel, X, and View saved result. Opening that result is an explicit action and creates no record or prediction. The saved record is checked again before opening in case it changed during review. Reopening a report does not count as an R01 prediction.
- **New Photo:** Diagnosis stays disabled while checking. The completed hash is retained for this selected file and reused at diagnosis and save time. A final indexed lookup catches a duplicate saved since the preview check, without rereading and hashing the image bytes. No match means normal inference, compression, and storage of `image_hash` in IndexedDB and Supabase.
- **Cleanup:** Closing or retaking clears selection state, resets the picker, and releases the preview object URL. A stale asynchronous check cannot update a newer selection or reopen a dismissed preview. Rapid repeated diagnosis clicks are guarded so one review cannot start overlapping inference calls. Lookup failure keeps diagnosis disabled and offers a retry.
- **Scope:** This is exact-file matching, not perceptual matching. Edited, cropped, or recompressed copies can be treated as new photos; the app does not automatically block similar-looking leaves.

### 3.5 3G Network Resilience: Upload Timeout (`supabase-client.ts`, `useSync.ts`)

- **Problem:** On weak 3G connections with packet loss, the default browser `fetch()` can hang for **30–60 seconds** waiting for a Supabase Storage upload response.
- **Solution:** A Supabase client fetch wrapper applies a real `AbortController` timeout only to writes into Storage's `scans` bucket. Storage's `upload()` options do not accept a signal, so this cancellation happens at its underlying fetch layer. The retry delays are 10 seconds, 30 seconds, 60 seconds, then every 5 minutes while online.
- **Safety:** The scan record remains `pending-insert` in IndexedDB. A successful blob upload stores its public URL locally before row insertion, so a later metadata failure retries only that small row instead of re-uploading photo bytes.

### 3.6 3G Network Resilience: Concurrent Sync Lock (`useSync.ts`)

- **Problem:** On slow 3G, multiple sync triggers (e.g., going online + taking a new scan simultaneously) could fire overlapping network requests.
- **Solution:** A `useRef`-based `isSyncingRef` lock allows one sync at a time. A trigger arriving during active work queues exactly one follow-up pass, which prevents overlap without losing a new local mutation.
- **Mobile background recovery:** Returning the PWA to the foreground clears a throttled retry timer and starts a fresh online sync immediately.

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

The [V4.3.0 report](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) preserves 386/393 raw correct predictions (98.22%), 373 correct/3 wrong accepted, 17 rejected mango images, and 24/84 plus 5/32 false OOD accepts on reused collections. These seven-class observations measure a different task from V3's six-class score and do not establish field accuracy, independent OOD rejection, or full browser/Keras parity. See the [testing guide](TESTING.md) for automated validation status.

> **Note on AI accuracy:** The **97.46%** figure describes the recorded Trial 3 evaluation on 393 images. It is not a measured accuracy guarantee for browser inference or farm photos. Storage compression happens after prediction, but preprocessing, numeric precision, and rejection gates can affect runtime results. Browser consistency and UI tests do not establish diagnostic accuracy.
>
> The three trial figures are not a trend line. Trial 2 scored 98.25% on a test set that contained near-duplicate copies of its own training images, so part of that score measured memorization. Perceptual-hash deduplication removed the duplicates before splitting, which is why Trial 2.1's 97.12% on 417 images is the honest figure rather than a regression. Trial 3 then changed the image pool, so its 97.46% is measured on a different 393-image test set again. Each number describes its own test set and none of them is a higher or lower version of another. See [model-training/non-experiment/v3/TRIAL_v3.md](model-training/non-experiment/v3/TRIAL_v3.md) for the previous released model and [model-training/non-experiment/v2.1/TRIAL_v2_1.md](model-training/non-experiment/v2.1/TRIAL_v2_1.md) for the deduplication work. V4 through V4.3.0 use seven classes; their reused-set results describe a different task and still need independent field evaluation.
