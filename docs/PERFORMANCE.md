# MangoLeaf AI: System Performance & Optimization Specifications

## V5.0.0 local candidate (October 19, 2026)

The completed V5 model is installed only in the maintainer's uncommitted workspace with unchanged seven-output architecture, full-photo canvas preprocessing, float32 browser weights, forced-float16 WebGL setting, and confidence-only 0.70 gate. Its three shards total 11,886,412 bytes, the same shard size as V4.5. The graph JSON and shard bytes differ; equal size does not establish equal predictions, latency or device memory use. The new cache identity and precache revisions replace older served model bytes; the exact V4.5 backup stays outside `public/`.

The [V5 review](model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md) separates training and inference observations. Five fine-tuning epochs and the observed 53-second Colab CPU OOD report are run-specific, not phone performance benchmarks. The local matched browser follow-up records its actual renderer/backend and preprocessing, without claiming Keras numerical parity or physical-device speed, memory, heat, battery, or reliability. R01/R03 and physical-device evidence remain tied to their exact tested build; no new result is inferred from successful export or repeated scores.

## V5.0.0 serial training batches (prepared October 18, 2026)

The experimental Colab helper now completes CPU image decoding, the existing bilinear resize, and augmentation before each compiled model update. It synchronizes returned metrics before loading the next batch. Training/validation no longer use the nested generator or input prefetch implicated by the supplied augmentation tracebacks. Prediction source generators also finish CPU loading before yielding. The full data collection is not copied into RAM; host input memory is bounded by the active batches. Model operations remain GPU-eligible.

This deliberately removes input/model overlap. It may increase wall-clock time; no speed, memory, or thermal improvement is measured or guaranteed. The augmentation recipe and model objective remain the same, but device placement and random realizations can change. OE exposure now counts successful synchronized updates rather than producer pulls. A small Step 2 execution probe can reject an incompatible runtime before the long Drive inventory; passing it does not establish full-run reliability. The [trial follow-up](model-training/experiment/v5.0.0/TRIAL_v5_0_0.md#october-18-2026-serial-training-batch-correction) distinguishes the reported failures, local fixtures, and pending full Colab evidence. This workflow is separate from browser inference and does not alter PWA runtime performance.

## Local diagnostics and raw confidence (prepared v0.7.0, October 17, 2026)

Prepared v0.7.0 adds opt-in diagnostics in About and retains raw classifier confidence in new reports. Model V4.5.0, its assets/cache identity, preprocessing, and the 0.70 confidence-only rejection rule are unchanged. Current source retains the maintainer's explicit `WEBGL_FORCE_F16_TEXTURES=true` setting; it does not use the earlier automatic 32-bit-first choice or retry on GPU memory failure. The [release record](versions/history/PWA_RELEASE_HISTORY.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026) distinguishes repository preparation, CI, and manual production promotion.

### Recorder work and evidence limits

- Recording defaults to off. Calls then return without appending events, serializing a history, or scheduling event-persistence writes; controlled call-site work and startup/preference reading still exist. This is not a claim of zero runtime cost.
- When enabled, one shared recorder keeps at most 200 events and a 64 KiB serialized UTF-8 payload. Each append sanitizes allowed fields and checks bounded retention; it copies/serializes a bounded history rather than scanning photos or History reports. Old events rotate out.
- localStorage writes are grouped behind a 250 ms timer, plus best-effort page-hide/exit flushes and immediate preference writes. The actual storage write is synchronous on the browser thread. A bounded payload and grouped writes limit work; they do not establish a measured phone-latency, memory, heat, or battery result.
- About subscribes to recorder snapshots; the other tab/modal screens do not mount duplicate log viewers. Plain-text export is built when viewing/copying/downloading. No model pass, photograph capture, background upload, database schema, or full-history query is added by logging.
- Known storage/error failures remain diagnostic evidence rather than altering save/delete outcomes. A memory-only fallback prevents diagnostic persistence failures from throwing into app work. Most recent events can be missing after a crash/freeze; a start without completion does not establish the exact cause.

Instrumentation records selected startup, photo readiness, inference stages, camera state, database save/delete, public guideline, and app visibility/connectivity events. It excludes private photo/report identities, input bytes, class predictions/probability tables, raw error text/stacks, and request URLs. It is not an every-interaction recorder or a cure for disabled Run, GPU/browser freezes, or pending database deletion. About is still blocked by an active stuck modal. The [recovery instructions](../SETUP.md#phone-diagnostics-and-stalled-operations) explain saving evidence after reopening and checking whether a local save/delete already committed.

### Confidence storage and formatting work

`classifier.ts` returns `maxProb` unchanged, and local saving keeps that number for new reports. The UI helper performs `Math.floor(confidence * 1000) / 10` and string conversion only, displaying at most one decimal with no `.0`. It adds no inference pass, asynchronous work, or database query. Examples include `62%`, `62.1%`, `69.8%`, and `69.9%` from 69.99%; acceptance still uses the raw score. Historical reports/duplicate reuse retain their earlier precision because discarded decimals cannot be recovered. This fixes the misleading rounded display near 70%; it does not improve measured classification accuracy or establish a frame-rate guarantee. See [v0.7.0 validation](testing/TESTING.md#v070-diagnostics-and-raw-confidence-october-17-2026) for the scope of controlled formatting/retention and browser checks.

## V4.5.0 repository adoption (October 16, 2026)

The October 16 adoption selected V4.5.0 with confidence-only rejection at 0.70 and then documented capability-based texture selection. The October 17 prepared source above retains an explicit forced-16-bit override instead; neither path supplies an automatic GPU memory-failure retry. The model/cache identity change provides no measured startup, scan-latency, memory, battery, heat, or low-end-device improvement. See the [model adoption record](model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#current-model-adoption-october-16-2026) for that dated evidence; physical-device checks remain tied to their exact build and settings.

## Local-only History candidate (October 15, 2026)

The current source removes guest sign-in/refresh, scan uploads/pulls, private photo requests, and cloud deletion retries. Local scan saves and deletions do not trigger guideline downloads. This removes that background network and database work online and after reconnect. It does not change TensorFlow.js inference, image decoding/compression, model warmup, startup asset downloads, or their existing deadlines; no physical low-end-device speedup is claimed.

Dexie v9 retains only the scan primary key, exact-file hash index, and date index. Upgrading removes unused indexes without rewriting large photo rows. Existing fields and photo bytes remain stored. History still loads its visible records for client filtering/pagination; this is not an incremental-query optimization.

A storage-full save retains one completed report and compressed photo in memory for retry without another prediction. History deletion is explicit; the app does not evict saved scans automatically. The draft is released on successful save or discard and is lost if the page closes/reloads. Browser quota is shared with cached app/model files; removing cloud storage does not increase the browser quota or prevent eviction. [Focused validation](testing/TESTING.md#local-only-history-and-storage-quota-october-15-2026) records actual checks separately from expected effects. R03 and a shortened substitute remain excluded.

**V4.5.0 local model test, October 12, 2026:** The candidate browser bundle totals 12,116,193 bytes across its graph, configuration, and three float32 shards. It uses a new runtime cache identity and evicts the previous V4.3.0 cache; the rollback backup is outside the served bundle. This is artifact/cache evidence, not a startup, latency, memory, physical-device, or field-accuracy measurement. No 30-minute R03 testcase or shortened replacement was run. See the [local candidate record](model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#v450-completed-results-and-local-test-october-12-2026) and [focused verification](testing/TESTING.md#v450-local-candidate-validation-october-12-2026). Existing dated measurements retain their original model/build scope.

This document describes the performance mechanisms implemented in **MangoLeaf AI** (`mangoleaf-ai`). Their effects depend on the image, browser, hardware, and network. Use [TESTING.md](testing/TESTING.md) and the [physical reliability checklist](testing/PHYSICAL_RELIABILITY_CHECKLIST.md) to record measurements for the exact release build and device.

**Historical app snapshot, October 10, 2026:** App `0.5.5` included the guided-camera lifecycle, responsive installation guide, four-report phone History pages, photo-card sizing, and per-inference console diagnostics. It then used model `v4.3.0`. The current repository model is V4.5.0; no target-phone speed, memory, battery, or heat improvement is established by the model change.

**Historical prepared-release snapshot, October 7, 2026:** App `0.5.4` adds a comparison that skips unchanged HTTP guidance writes after existing ordering safeguards pass. Model `v4.3.0` remains unchanged. See the [prepared release record](versions/history/PWA_RELEASE_HISTORY.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and [versioned validation](testing/TESTING.md#v054-release-validation-october-7-2026). The [reported release status](versions/history/PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) preserves the earlier live-version and publication report; original candidate evidence remains historical.

**October 6, 2026 candidate snapshot:** App `0.5.2` packages responsive Home/History scan lists and shared single/batch deletion while retaining the scan-thumbnail stability fix and model `v4.3.0`. The [candidate record](versions/history/PWA_RELEASE_HISTORY.md#v052-scan-history-and-deletion-candidate-october-6-2026) tracks release status. The [v0.5.1 validation](testing/TESTING.md#v051-candidate-validation-october-5-2026) and October 4 thumbnail evidence retain their original build identities.

The [October 6 responsive-list and deletion update](#responsive-scan-lists-and-batch-deletion-october-6-2026) records source-established avoided work and the remaining full-history query. It has no new speed, memory, heat, battery, or physical-device measurements. The October 5 results identify an earlier build.

The [October 7 guideline-ordering update](#38-guideline-http-and-realtime-coordination-guidelines-syncts-october-7-2026) was prepared in `0.5.3` after the existing local `v0.5.2` tag, which excludes the fix. It protects saved advice from an observed overlapping HTTP/Realtime update and removes old guideline HTTP responses from worker caches. Direct Realtime writes and IndexedDB offline advice remain in use. Follow-up downloads can add network work; this is a correctness change, not a measured performance improvement. The `0.5.4` checker below separately avoids rewriting identical accepted HTTP results.

The [October 3, 2026 low-end-device review](#low-end-device-performance-review-october-3-2026) records current source findings, short isolated browser measurements, and prioritized improvements. It separates existing safeguards from changes that have not yet been implemented.

The matrix distinguishes implementation choices from measured outcomes. Earlier instant-loading, fixed-frame-rate, and zero-leak claims were not established device benchmarks. R01 measures repeated-inference consistency; R02 exercises cached offline behavior; R03 records a 30-minute session. None proves field accuracy or performance on every phone.

---

## Performance mechanisms and expected effects

| Mechanism                 | Current implementation                                       | Expected effect or evidence limit                                                                                              |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| TensorFlow.js loading     | Dynamic classifier imports                                   | Defers classifier code loading; total downloads and startup timing still need measurement.                                     |
| Input tensor size         | Canvas resizes to 224x224 before tensor creation             | 150,528 channel values instead of 36 million for a 12MP RGB image; this is not total application memory.                       |
| GPU textures              | `WEBGL_FORCE_F16_TEXTURES`                                   | Uses half-float render textures on the WebGL path; score parity must be measured.                                              |
| Model download            | Single V4.5.0 OE export is cached locally                    | Reuses cached files while storage and revisions remain valid.                                                                  |
| Output readback           | `outputTensor.data()`                                        | Avoids synchronous readback; does not guarantee a frame rate.                                                                  |
| Stored photos             | WebP with JPEG fallback after inference                      | Reduces local storage bytes; final sizes vary by image.                                                                        |
| Blob URLs                 | Per-card content comparison and URL cleanup                  | Reuses the thumbnail URL for unchanged photo bytes; replaces it for changed photos.                                            |
| React rendering           | Memoized components and selected stable callbacks            | Can skip renders when props stay equal; no measured percentage is claimed.                                                     |
| Responsive scan lists     | One/four Home cards and four/six History entries             | Mounts only the viewport's preview/page; phone History reuses one image per row. The parent still reads all active scans.      |
| Overlay effects           | Reduced mobile backdrop blur                                 | Reduces filter work; target-phone frame rates remain a manual measurement.                                                     |
| Model and canvas reuse    | One cached model instance and one shared canvas              | Avoids repeated initialization/allocation within the page session.                                                             |
| Database access           | Indexed scan lookups and guideline `bulkPut()`               | Guideline writes are batched; full scan collections are still materialized for History. No scan-cloud refresh is used.         |
| Local batch deletion      | One local Dexie `bulkDelete()` for deduplicated IDs          | Removes selected local records without a cloud queue or guideline refresh. No automatic deletion timeout is added.             |
| Fonts and modal bundles   | Font swapping and dynamic Details import                     | Shows fallback text and defers some UI code.                                                                                   |
| Duplicate photos          | SHA-256 lookup before inference                              | Reuses an active saved report; not a new prediction.                                                                           |
| Cloud request timeout     | 10-second abort timer with retries                           | Limits a stalled request attempt; total synchronization time is not capped at 10 seconds.                                      |
| Concurrent sync           | Shared guideline attempt and protected follow-up             | Coordinates guideline writes/downloads independently of local diagnosis and saves.                                             |
| Guideline update ordering | Shared HTTP attempt, event counter, and ordered local writes | Prevents an observed overlapping update from being replaced by an older full response; a follow-up download adds network work. |
| Cloud identity            | No application guest session or private scan synchronization | Avoids the former Auth/scan/photo work; it does not establish a measured device speedup.                                       |
| Local diagnostics         | Opt-in 200-event/64-KiB recorder with grouped storage writes | Collects bounded evidence; synchronous persistence and viewer updates still have runtime cost.                                 |
| Confidence presentation   | Raw new-report storage; downward display to one decimal      | Keeps the 0.70 check independent of formatting, with no extra prediction or database request.                                  |
| Connection hints          | Supabase preconnect and DNS-prefetch                         | May reduce connection setup delay; network measurements are needed.                                                            |

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

<a id="13-webgl-16-bit-float-textures"></a>

<a id="13-capability-based-webgl-texture-precision"></a>

### 1.3 Current Forced-16-Bit WebGL Texture Precision

- **Implementation, prepared v0.7.0:** `src/lib/classifier.ts` retains the active `tf.env().set("WEBGL_FORCE_F16_TEXTURES", true)` override before `tf.ready()`. It logs the actual enabled/capable flags, and the optional diagnostic recorder captures them. This is an existing maintainer choice included in the prepared source; no automatic 32-bit-first or memory-failure fallback is added. The October 16 capability-based description above remains dated history.
- **Scope:** Texture precision describes GPU calculations and is separate from saved float32 weights. Half-float textures can use less memory per stored value but may produce different scores near a rejection boundary. The override does not guarantee score parity, prevent out-of-memory/context failures, establish the cause of an observed stall, or prove that every GPU operation uses one precision.
- **Download trade-off:** The historical Trial 3 bundle was 11.53 MB. The adopted V4.5.0 five-file bundle totals 12,116,197 bytes (three float32 shards, graph, and config), as recorded in the adoption receipt. Texture precision does not change model download size.

The installed behavior can be checked in TensorFlow.js 4.22.0's [WebGL flag definitions](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-backend-webgl/src/flags_webgl.ts). Use browser/device evidence before changing this flag or claiming a benefit from another precision setting.

### 1.4 Asynchronous Non-Blocking Inference & Garbage Collection

- **Implementation:** Output tensors are extracted via `await outputTensor.data()` instead of synchronous `dataSync()`.
- **Scope:** Asynchronous readback does not move `model.predict()`, shader compilation, canvas work, or JavaScript CPU-backend computation off the main thread. It does not establish smooth frames during every scan.
- **Tensor cleanup, October 13 update:** `tf.tidy()` releases intermediate tensors, and a `finally` block disposes the returned output after readback settles, including rejection. Cancelling the caller's wait retains the output and blocks another inference until the original GPU read settles. See [diagnosis recovery](#211-diagnosis-stage-deadlines-and-recovery-october-13-2026) for error-path evidence and limits; tensor counts do not measure native bitmap memory or pooled GPU allocation.

### 1.5 Startup GPU Shader Warmup & Light Green Splash Screen

- **Implementation:** On app launch, the active single model loads and runs a dummy inference with `tf.zeros([1, 224, 224, 3])` behind the existing light organic green (`#f6faf1`) splash screen (`<SplashScreen />`). The October 13 update awaits the warmup output's asynchronous readback before declaring readiness, disposes that output on success/failure, and disposes the graph after failed warmup.
- **Rationale:** Compiles model shaders before the first real scan. Its five files total about **12.10 MB**. Warmup has a 60-second recovery deadline; failure clears the splash and shows a translated Reload action. Pending readback retains its tensor, graph, and initialization gate until settlement; an overdue graph is discarded rather than cached. Model/config requests still have no application deadline and can leave the splash visible while pending. The [dated review](#startup-and-inference) retains its earlier measurements and scope.

### 1.6 Module-Level Model Singleton Cache (`classifier.ts`)

- **Implementation:** The cached model and its loading promise persist at module level outside React's component lifecycle.
- **Behavior, October 13 update:** After successful initialization, subsequent calls reuse the same model in the current page session. Network reconnection does not reload it; a full page reload or terminated browser process creates a new in-memory session. Failed initialization releases the shared loading promise so another call can retry. Concurrent callers share one attempt, and a remounted page restores its model state from the cached loader.

### 1.7 Singleton Canvas Reuse (`classifier.ts`)

- **Implementation:** A module-level `sharedCanvas` HTMLCanvasElement is created once and reused for all subsequent `downscaleToCanvas()` calls.
- **Context Hint:** Canvas 2D context uses `{ alpha: false }` for an opaque output. Uploaded files can still contain transparency, so this setting is part of the image-processing behavior rather than proof that every input is a JPEG.
- **Confidence, October 17 update:** The classifier returns the raw `maxProb`; it no longer rounds before saving. A small UI-only helper truncates the displayed percentage to at most one decimal and omits `.0`, without changing canvas work, inference, or rejection math. Earlier releases saved a rounded score; their lost precision cannot be reconstructed.

### 1.8 One-Time Splash Screen Guard (`page.tsx`)

- **Implementation:** A module-level `hasInitialized` flag persists across React remounts, network reconnections, and `useSync` state updates.
- **Behavior:** The splash screen renders **only once** on the very first app load. Going offline → online, component remounts, and sync triggers never re-trigger the splash screen.

### 1.9 Console probability tables (`classifier.ts`)

- **Implementation:** Each actual inference prints one collapsed table of the seven class scores in development and production DevTools. A saved duplicate reused without inference does not print another table.
- **Purpose:** Supports developers, teammates, and technical reviewers who need to inspect accepted or rejected predictions. The existing fresh-result table is separate from these console groups and is not persisted in saved reports; it predates this release. Optional persistent diagnostics excludes class scores/tables.
- **Behavior:** Sorting uses copied values, and rounding applies only to the printed percentages. The original probabilities, class mapping, model files, and rejection thresholds remain unchanged. Scores for one photo are not accuracy measurements.
- **Cost:** Creates seven diagnostic rows and formats their percentages once per inference; it adds no model pass or network request. Console rendering costs can vary by browser and whether DevTools is open. No device-performance improvement or slowdown has been measured for this change.

---

## 2. Frontend React Architecture & DOM Optimizations

### 2.1 Per-Card Blob URL Management (`scan-card.tsx`)

- **Problem:** Maintaining a centralized `blobUrlMap` in `page.tsx` meant adding or deleting a single scan caused all Blob ObjectURLs across the entire history list to be revoked and regenerated, causing visible image flickering and memory spikes.
- **Current fix (October 4, 2026):** `scan-card.tsx` delegates photo URLs to `useScanPhotoUrl.ts`. Metadata updates return new Blob wrappers from IndexedDB; the hook compares saved-photo SHA-256 fingerprints before replacing a URL. Equal size alone is insufficient, so different photos of equal size must still update. The displayed fingerprint is cached, and comparisons run only for a changed wrapper with the same size/type. No new decoder work is needed to compare fingerprints.
- **Cleanup:** Replaced URLs are released after the rendered image switches. Empty photos and unmounted cards release owned URLs; canceled comparisons cannot restore an older photo. If fingerprinting fails, the incoming photo still replaces the displayed copy.
- **Cost and scope:** Comparison reads a saved photo into an ArrayBuffer and runs Web Crypto asynchronously; it is not free and does not reduce the full History database query. The current fingerprint is kept only in memory. Upload duplicate hashes, model inputs, storage encoding, and cloud records retain their existing behavior. Avoiding reloads is not proof of a temperature, battery, or total-memory improvement.
- **Regression evidence:** Before the fix, three metadata-only writes to one record caused all four visible thumbnails to reload, 12 reloads total, in an isolated production export. The original recording also shows a blank thumbnail behind the stable result photo at about 8.5 seconds. Follow-up verification is recorded in [thumbnail checks](testing/TESTING.md#scan-thumbnail-stability-october-4-2026).

### 2.2 Modular Component Refactoring & `React.memo()` Memoization

- **Structure:** Scoped UI into isolated components (`SplashScreen`, `TopHeader`, `BottomNav`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `Footer`), grouped into `src/components/` subfolders by role: `brand/`, `layout/`, `modal/`, `scan/`, and `tab/`.
- **Per-Tab Components:** `HomeTab`, `HistoryTab`, and `AboutTab` replace the inline `activeTab` branches previously in `page.tsx`. Only the active tab's subtree is mounted, so switching tabs unmounts the other two instead of keeping all three in the render output.
- **Memoization:** `HomeTab`, `HistoryTab`, `AboutTab`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `TopHeader`, `BottomNav`, `Icon`, `Logo`, and `Footer` are wrapped in `React.memo()` to prevent unnecessary re-renders when parent state changes. `SplashScreen` is not memoized because it renders once before the model finishes loading and is then replaced.
- **Stable Callbacks & Refs:** `handleViewAllHistory` and `setLanguage` are wrapped in `useCallback`. `selectedFileRef` and `previewUrlRef` stabilize `runDiagnosis` callback identity across state changes.

### 2.3 Dexie Reverse Query Optimization (`page.tsx`)

- **Implementation:** The `_status` index selects active scans, but `sortBy("updated_at")` then materializes the complete result and sorts it in JavaScript. Installed Dexie copies that array before sorting; the following `reverse()` reverses the sorted array. This runs on qualifying live-query updates, rather than on every unrelated React render.
- **Limit:** Home shows one card below 768px and an Install card on wider screens. Its recent-list wrapper uses CSS hiding, so up to four hidden scan cards can remain mounted on desktop. History mounts four records per phone page and six per desktop page. These are presentation/rendering limits. The parent query still reads every active full scan record, including its photo Blob, even on About. The [dated query comparison](#history-query-measurements) explains why limits should eventually be applied while reading IndexedDB. That alternative has been measured in isolation, not implemented in the app. See [Dexie's sortBy documentation](<https://dexie.org/docs/Collection/Collection.sortBy()>) for the sorting behavior.

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

### 2.8 Responsive scan presentation (`scan-history-list.tsx`, `scan-card.tsx`)

- **Mounted cards:** Home passes at most four newest records to the shared list, which mounts one below 768px. The extra phone cards are absent from the React subtree, so they create no photo URLs or image elements. At 768px and above, Home shows the Install card and hides its entire recent-list wrapper with CSS; that hidden list can still mount four scan cards and create their photo URLs. History mounts four records per phone page and six per desktop page. Hiding desktop Home history does not establish a memory or query saving.
- **One responsive photo:** History uses a 56px thumbnail row on phones and a full photo card on desktop with one image element per record, preserving the existing lazy image loading and photo-URL lifecycle. Full cards reserve a 4:3 photo area using width-based padding, addressing mis-sized flex-card photos after a viewport change in older Safari. Thumbnail dimensions do not resize the saved Blob or prove that the browser decodes fewer pixels.
- **Search and counts:** Search matches are memoized separately from category filtering. Category counts cover all search matches across pages, while Home skips category counting because it has no filter controls. Search resets All, page one, the phone filter panel, and selection. History still scans the full in-memory result for search and category totals; this is not a bounded IndexedDB search.
- **Selection and layout:** Selected IDs persist across pages; Select all captures the current filtered result IDs. Confirmation freezes those IDs before deletion. The phone delete-selection button precedes pagination. History containers use `transition-colors` while their selection layout changes; Home retains its existing `transition-all`. No target-device rendering or interaction-time benchmark is established by these source changes.

### 2.9 Guided live-camera lifecycle (October 8, 2026)

- **Ownership:** `useGuidedCamera.ts` acquires and releases the video stream; `scan/guided-camera.tsx` renders a positioning guide and explicit Capture action. Both iOS and Android follow the same secure-context and API checks. Preview requests no microphone access and prefers rear-camera video at 1280×720 with a requested maximum of 30 frames per second. Actual dimensions and lens depend on the browser/device.
- **Preview work:** The camera runs only while the live dialog is active. The guide resizes from video dimensions and preview-container measurements; it does not analyze each frame or invoke TensorFlow.js. Live video itself still uses camera, decoder, rendering, and battery resources.
- **Capture work:** One full-size video frame is drawn to a temporary canvas and encoded as JPEG at quality 0.92. Capture uses delivered frame dimensions rather than cropping to the guide. The stream stops before review; hashing and duplicate lookup use the captured JPEG. Explicit diagnosis then uses the existing 224×224 input and later storage compression. Capture encoding introduces work before inference; a request for 1280×720 does not establish a hard decoded-memory limit or preservation of native-camera image quality.
- **Cleanup:** Close, unmount, hidden-document transitions, `pagehide`, interruption, and successful capture stop all tracks and detach the video. Request identities discard late permission/encoding completions. An acquired stream has a 15-second preview-start deadline; permission prompts do not. Foreground return requires an explicit retry instead of restarting the camera automatically.
- **Evidence limits:** The [focused camera checks](testing/TESTING.md#guided-live-camera-october-8-2026) verify controlled lifecycle/capture behavior and a Chromium synthetic-video bridge. They do not measure physical-phone capture time, frame rate, memory, thermal behavior, battery use, or disease accuracy. No 30-minute R03 session ran. The [physical checklist](testing/PHYSICAL_RELIABILITY_CHECKLIST.md#r04-m01-guided-camera-gallery-and-layout) records the remaining observations.

---

### 2.10 Rounded diagnosis preview (October 12, 2026)

The diagnosis preview keeps its green border and shadow on the outer frame. A separate inner wrapper clips the photo and scanning blur to a 14px radius inside the 2px border. The blur overlay inherits that inner radius. Explicit clipping addresses the square filtered corners reproduced in Chromium when rounded overflow alone failed to contain the overlay. The photo remains 192px square with `object-contain` sizing.

All 12 focused rendering checks passed in Chromium and WebKit: normal review and scanning at phone portrait, landscape, and desktop sizes, using the actual component and installed Tailwind styles. They simulate the scanning state and do not measure inference, physical-phone behavior, or a performance improvement. Local before/after screenshots and geometry observations are preserved under ignored `.tools/scan-preview-corners-20261012/`. No 30-minute reliability session is part of this visual fix.

### 2.11 Diagnosis stage deadlines and recovery (October 13, 2026)

QA reported intermittent analysis stalls, mostly at 45%, sometimes at 15%, 75%, or 90%, online and offline. The phone/browser and native failure have not been identified. Progress numbers are stage markers: preparation includes the duplicate recheck/import/decode at 15%; inference/readback is 45%; saved-photo encoding is 75%; local commit is 90%. Cloud synchronization is started separately and is not awaited by diagnosis. Tapping elsewhere does not explicitly retry inference.

The original flow had unbounded image, GPU-readback, encoder, and database waits and only console error handling. Three isolated baseline probes deliberately withheld detached image completion, native WebGL fence completion with the current real model, and WebP completion. Each remained locked after five minutes of simulated clock time. The three probes ran in 9.2 seconds; they are fault-injection evidence, not a physical-phone measurement or an R03 session. Separate controlled tests exposed failed output disposal and permanently cached failed initialization.

`diagnosis-step.ts` applies recovery deadlines of 20 seconds for preparation, 60 seconds for analysis, 20 seconds for result encoding, and 15 seconds for saving. These are caps while the browser can schedule work, not expected durations or a faster-model claim. Stage labels, Cancel/Escape, translated errors, retry, and a reload action replace an indefinite locked preview. A synchronous overrun is checked again when work returns; a JavaScript timer cannot preempt a blocked browser/driver thread. Startup GPU warmup also has a 60-second recovery deadline and translated failure banner with Reload. Its pending read retains the output, graph, and initialization gate; late completion disposes the overdue graph without caching it. Model-download/configuration waits still have no application deadline.

Cancellation removes detached decoder handlers, ignores late encoder completions, and releases image/canvas resources. Pending GPU reads keep their tensor and inference gate until settlement; the UI asks for reload while that work remains pending. Cancelling or timing out an active local save requests transaction abort and checks the signal before/after insertion. A record already committed before cancellation stays valid; retry performs the same active-model duplicate lookup instead of saving another copy. Successful saves return their committed record directly, avoiding the former final database re-query. No error is converted into an uncertain diagnosis. Model files, preprocessing, class order, backend/precision flags, and rejection math are unchanged.

Focused candidate checks and remaining physical-device requirements are recorded in [TESTING.md](testing/TESTING.md#diagnosis-recovery-october-13-2026). Baseline probes, source copies, model hashes, and local reports are kept under ignored `.tools/analysis-stall-20261013/`. Original dated performance measurements below retain their original scope.

## 3. PWA Offline Infrastructure & Network Caching

### 3.1 Service Worker Model Pre-Caching (`sw.ts`)

- **Strategy:** Serwist precaches the five adopted V4.5.0 model files under `/model/`: `model.json`, `model_config.json`, and three weight shards. The `CacheFirst` runtime rule remains as defence in depth.
- **Expected effect:** Enables offline model loading after successful service-worker installation and caching, while browser storage remains available. Loading still requires local model initialization; cache eviction, cleared site data, or an incomplete first load can prevent it. R02 and the physical checklist verify this behavior for a recorded environment.
- **Versioned cache name:** `mangoleaf-model-cache-v4-5-0` for the adopted V4.5.0 model, retained by prepared app `0.7.0`. Activation deletes superseded model caches, including former V4.3.0 and V4.5.0 candidate runtime caches. The active V4.5.0 cache is protected by the activation filter.
- **The precache is the real update mechanism.** Public files receive content-revision hashes in Serwist's precache manifest, which is matched before runtime caching. Replaced weights therefore refetch on next activation. An empty runtime model cache is normal; verify updates in generated `public/sw.js`.

### 3.2 High-Capacity Offline Database (Dexie.js / IndexedDB)

**Current v0.7.0 source:** Dexie v9 keeps `id`, `image_hash`, and `updated_at` scan indexes. The parent query reads full records in reverse date order and filters legacy tombstones before client-side pagination; it is not bounded to the visible page. Optional diagnostics uses separate bounded localStorage, not a new IndexedDB store. The following earlier index/query descriptions are historical and were superseded by the local-only transition; they are not current implementation instructions.

- **Storage Layer:** Binary photo Blobs and scan metadata are persisted locally using Dexie.js (IndexedDB).
- **Indexed Queries:** Active scans are queried via `db.scans.where("_status").notEqual("pending-delete")` using Dexie's native index instead of in-memory JS `.filter()`. Pending sync scans use `db.scans.where("_status").anyOf(["pending-insert", "pending-delete"])`.
- **Efficient Lookups:** Finding the newest scan uses `db.scans.orderBy("updated_at").last()` instead of loading all records into memory.

### 3.3 Batch Database Operations (`useSync.ts`)

- **Guidelines Sync:** A successful full download first checks its event counter and starting local snapshot in one IndexedDB transaction, then compares downloaded content with current local guidance. An identical set succeeds without `clear()` or `bulkPut()`; a different valid set uses those operations to replace the snapshot atomically. A response superseded by an observed local/Realtime change is discarded and schedules one protected follow-up. Accepted changed full sets also remove rows deleted remotely when their event was missed. Failed downloads do not clear saved advice.
- **Guidelines Display:** Scan details read the existing live-query cache and perform no additional network request. Downloaded advice remains available offline; missing or blank text uses a translated status message. The bundled treatment dictionary has been removed, so guideline revisions are maintained in Supabase and arrive through successful synchronization. No download-time or bundle-size benchmark was measured for this change.
- **Current local Scan Deletion:** `deleteScans()` deduplicates IDs and awaits one local `bulkDelete()`; it does not create tombstones, upload/delete cloud resources, or refresh guidelines. The confirmation locks while waiting and has no automatic timeout. Diagnostic start/completion/error events observe this existing behavior rather than changing it.
- **Historical scan-cloud behavior, before October 15:** Remote cloud IDs were matched through the local `cloud_id` index. Photos already present as Blobs were reused; missing private photos were downloaded and saved with metadata in guarded transactions. Each result was rechecked after the network request so a concurrent local deletion was not replaced by the restored row. Earlier deletion used `bulkGet()`, removed local-only/unowned rows, marked owned rows as hidden `pending-delete` tombstones, and requested one sync after a changed batch. That queue is retired by local-only History; preserved old tombstones remain hidden.

### 3.4 Duplicate Photo Checker (SHA-256 Image Hash)

- **Implementation:** Photo selection starts one asynchronous `computeImageHash()` call in the lightweight `image-hash.ts` module using browser-native Web Crypto. This calculates a 64-character SHA-256 fingerprint of the original file. Time and buffer size depend on original photo size; the helper imports no TensorFlow.js code and does not run model inference or upload the photo. `classifier.ts` re-exports the helper for existing callers.
- **Lookup:** The hash is checked against the indexed `image_hash` column in Dexie's `scans` table, rather than reading the whole history. Reuse requires the exact active `model_version`; pending-deletion rows, another model version, and legacy unversioned rows are excluded. Older records remain visible in History, while reuploading their photo runs the adopted model.
- **Duplicate Found:** The existing preview shows "Photo already scanned" with Retake, Cancel, X, and View saved result. Opening that result is an explicit action and creates no record or prediction. The saved record is checked again before opening in case it changed during review. Reopening a report does not count as an R01 prediction.
- **New Photo:** Diagnosis stays disabled while checking. The completed hash is retained for this selected file and reused at diagnosis and save time. A final indexed lookup catches a duplicate saved since the preview check, without rereading and hashing the image bytes. No match means normal inference, compression, and storage of `image_hash` in IndexedDB only.
- **Cleanup:** Closing or retaking clears selection state, resets the picker, and releases the preview object URL. A stale asynchronous check cannot update a newer selection or reopen a dismissed preview. Rapid repeated diagnosis clicks are guarded so one review cannot start overlapping inference calls. Lookup failure keeps diagnosis disabled and offers a retry.
- **Scope:** This is exact-file matching, not perceptual matching. Edited, cropped, or recompressed copies can be treated as new photos; the app does not automatically block similar-looking leaves.

<a id="35-3g-network-resilience-upload-timeout-supabase-clientts-usesyncts"></a>

### 3.5 3G Network Resilience: Cloud Request Timeout (`supabase-client.ts`, `useSync.ts`)

**Current scope, prepared v0.7.0:** The 10-second wrapper serves public guideline HTTP downloads. Scan/photo/Auth requests are no longer part of the application flow. It does not time out model downloads, GPU reads, or local deletion. The following upload/session description records the earlier cloud client rather than an active queue.

- **Problem:** On weak 3G connections with packet loss, the default browser `fetch()` can hang for **30–60 seconds** waiting for a Supabase Storage upload response.
- **Solution:** A Supabase client fetch wrapper applies a real 10-second `AbortController` timeout to cloud requests, including Auth, guideline reads, private photo reads, and writes. The timer covers response-body reading as well as headers, and requests use `cache: "no-store"`. Storage's `upload()` options do not accept a signal, so this cancellation happens at its underlying fetch layer. The retry delays are 10 seconds, 30 seconds, 60 seconds, then every 5 minutes while online. Each request and the whole synchronization pass are different scopes; the latter can take longer than one request timeout.
- **Safety:** The scan record remains `pending-insert` in IndexedDB. A successful blob upload stores its owner-scoped private object path locally before row insertion, so a later metadata failure can retry that small row without re-uploading photo bytes. A public URL is not used as an authorization bypass.

### 3.6 3G Network Resilience: Concurrent Sync Lock (`useSync.ts`)

**Current scope, prepared v0.7.0:** Guideline downloads use the shared coordinator and its ordered writes, online retry, and foreground recovery. Local saves/deletes do not request guideline refreshes. The following private-scan sync description is preserved historical behavior, superseded by the local-only transition.

- **Problem:** On slow 3G, multiple sync triggers (e.g., going online + taking a new scan simultaneously) could fire overlapping network requests.
- **Solution:** A `useRef`-based `isSyncingRef` lock allows one sync at a time. A trigger arriving during active work queues exactly one follow-up pass, which prevents overlap without losing a new local mutation.
- **Mobile background recovery:** Returning the PWA to the foreground clears a throttled retry timer and starts a fresh online sync immediately.
- **Limit:** Every sync trigger also starts a public-guideline refresh, and each private history refresh reads the complete owner result. Serialization prevents concurrent private passes but does not remove repeated downloads or full History-query invalidations. App `0.5.4` skips identical HTTP guidance writes; direct Realtime handling and private scan/history writes are outside that optimization. Application retries and the guideline subscription are not explicitly paused when the document is hidden. Supabase Auth already handles its own refresh visibility; that is a separate mechanism.

### 3.7 Background guest identity and private photo downloads

**Historical scope:** The October 15 local-only transition retired the application guest session, private photo downloads, and scan upload/pull queue described below. Prepared v0.7.0 does not re-enable them, and its optional diagnostics does not introduce a network log sink. Existing server archives/policies remain preserved separately.

- **Local first:** Guest creation and session refresh belong to cloud synchronization. Neither is part of the classifier path or a prerequisite for saving a scan locally. The first online guest request and later refreshes add network work; no zero-overhead claim is made.
- **Session reuse:** The saved guest session is reused instead of creating an identity for each scan or reconnect. A shared pending task serializes guest creation, with an additional Web Lock across tabs where supported. The caller stops waiting after 15 seconds; individual HTTP requests abort after 10 seconds. If cloud authorization is unavailable, pending scan changes remain in IndexedDB for a later retry. A refresh error does not trigger creation of a replacement guest.
- **Public guidance:** Guideline downloading and live updates remain independent of private scan authorization. A failed guest request must not block published treatment guidance.
- **Private photos:** Restored photos require authenticated downloads. Once saved as local Blobs, subsequent offline display uses IndexedDB. The fetch wrapper buffers each response body before handing it to the SDK, adding temporary byte storage; no exact memory saving is claimed. The app must not expose private photo bytes in a shared public runtime cache or replace a failed download with the old public URL. A local-only report without bytes shows a translated photo-unavailable label and retains its metadata.
- **Evidence limit:** Additional Auth/download latency and memory depend on connection, browser, photo sizes, and restored history. Existing inference benchmarks do not measure this new cloud path; use the [cloud checks](testing/TESTING.md#cloud-ownership-and-offline-checks) and [Supabase guide](security/SECURITY-AND-SYNC.md).
- **Rollout status:** The live server's private bucket and owner policies are applied and verified. Client publication and promotion are recorded separately in the [release guide](versions/history/PWA_RELEASE_HISTORY.md#v055-guided-camera-and-installation-prepared-release-october-10-2026); no production signup/upload timing or device-performance improvement is claimed from the security checks.

### 3.8 Guideline HTTP and Realtime coordination (`guidelines-sync.ts`): October 7, 2026

- **Behavior:** Realtime INSERT/UPDATE values and DELETE removals still apply directly to IndexedDB. Receiving an event while a guidance HTTP download/save is unfinished increments an event counter, protects saved advice from that potentially stale full result, and requests one follow-up GET after the current attempt finishes or fails while online. Ordinary events with no active guidance attempt do not add a GET. HTTP completion alone does not request another successful download.
- **Shared work:** Concurrent callers reuse one HTTP task; repeated overlap notifications share a follow-up. Local writes are ordered. Before replacing the full set, the commit compares IndexedDB with the attempt's starting snapshot, protecting visible shared-data changes made by another tab without a new database schema. A final counter check rolls back the whole batch if an event arrives during saving; invalidation-related aborts are distinct from unrelated database failures.
- **HTTP caching:** Guideline REST reads bypass service-worker response caching, and activation removes older cached responses. IndexedDB retains downloaded advice for offline display and after failed requests. A worker cache hit must not masquerade as a newly downloaded snapshot.
- **Scope and cost:** The decision uses unfinished work and received events rather than a millisecond cutoff. A follow-up request can add download latency and bytes, especially if guidance keeps changing. The change prevents an observed overlap from undoing saved advice; it does not prove every delayed server event is newer than every HTTP snapshot. No speed, battery, heat, or memory improvement is measured here. See the [isolated regression checks](testing/TESTING.md#guideline-update-ordering-october-7-2026).

### 3.9 Unchanged HTTP guidance writes: October 7, 2026

- **Comparison:** After the existing ordering and other-tab checks pass, compare the current and downloaded guidance by all four saved fields, independent of row order. This reads and compares the small guidance text set; it does not use model inference or understand the words' meaning.
- **Avoided work:** An identical response finishes successfully without clearing or rewriting IndexedDB. A different response still updates the complete saved set, including additions and deletions. Ordinary Realtime row writes retain their existing behavior.
- **Remaining work:** HTTP still downloads the complete guidance set. The checker does not eliminate network transfer, retries caused by actual failures, or follow-up GETs needed after overlap. It compares data inside the guarded transaction and does not accept stale content solely because it happens to match.
- **Evidence limit:** Applicable regression checks establish skipped writes and preserved synchronization behavior. Exact CPU time, end-to-end latency, phone memory, heat, and battery effects are not measured by this change. See [v0.5.4 validation](testing/TESTING.md#v054-release-validation-october-7-2026).

---

## 4. CSS & GPU Compositing Optimizations

### 4.1 Solid Backgrounds on Scroll List Cards (`scan-card.tsx`)

- **Current implementation:** Home and desktop History cards use a solid `bg-white` background without a backdrop-blur filter. Phone History uses separated thumbnail rows. The older `bg-slate-900/95` value belongs to the previous dark UI.
- **Expected effect:** Avoids a backdrop filter on every card; scrolling smoothness still needs device measurement.

### 4.2 Targeted CSS Transitions

- **Current implementation:** Many controls use `transition-colors` or `transition-transform`; History rows/cards use `transition-colors` as selection changes their layout, while Home cards and some other containers still use `transition-all`.
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

## Experimental inventory retry: October 11, 2026

The maintainer reported about an hour in V4.5.0 training Step 4 before the notebook rejected an OOD collection containing 200 photos instead of the selected 500. The original code decoded and hashed all mango/OE/OOD images before checking that OOD count. This observation is session evidence, not a benchmark of T4 training speed; Step 4 also performs Drive reads, CPU hashing/decoding, and image resizing.

The training template now checks the OOD file count before any mango/OE content reads, then retains its normal decoding and identity validation. Progress prints every 100 images and every ten preview pages, using each preview folder's name. An incomplete inventory blocks the next review step. The [specific live-session recovery](model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#if-step-4-counted-200-ood-photos-after-a-long-scan) rescans OOD while reusing completed mango/OE inventories; later input-hash checks remain mandatory. It does not provide an automatic resume cache or a measured speedup for complete inputs. Colab documents that mounted [Drive reads can be slow](https://research.google.com/colaboratory/faq.html); actual progress and session timings should inform later estimates.

## Accuracy and runtime evidence

App `0.4.9` adopts V4.3.0 Combined with unchanged graph/shard bytes, seven-class order, preprocessing, folded temperature, and fitted `0.70 / 0 / 0.42` gates. Only release metadata changes in `model_config.json`; the [adoption receipt](model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records both configuration hashes. Adoption does not provide a new performance benchmark.

On October 2, 2026, filtered R01 passed one `chromium-mobile` case with a test duration of 57.2 seconds. It made eight photos × 30 actual predictions (240), with stable raw/displayed classes and acceptance, maximum raw-confidence range `0`, and maximum net tensor growth per photo `0`. The report records WebGL and browser `153.0.8010.12`. These same-session measurements describe application input fingerprint `aafefbaaff86b0c86f55ef534afc3e0e416dcb1825c15c5aaf912ed48703100a`; they do not establish field accuracy, browser/Keras parity, or a general inference-speed guarantee. The adoption receipt preserves the final core/R01 report records and hashes.

The [V4.3.0 report](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) preserves 386/393 raw correct predictions (98.22%), 373 correct/3 wrong accepted, 17 rejected mango images, and 24/84 plus 5/32 false OOD accepts on reused collections. These seven-class observations measure a different task from V3's six-class score and do not establish field accuracy, independent OOD rejection, or full browser/Keras parity. See the [testing guide](testing/TESTING.md) for automated validation status.

> **Note on AI accuracy:** The **97.46%** figure describes the recorded Trial 3 evaluation on 393 images. It is not a measured accuracy guarantee for browser inference or farm photos. Storage compression happens after prediction, but preprocessing, numeric precision, and rejection gates can affect runtime results. Browser consistency and UI tests do not establish diagnostic accuracy.
>
> The three trial figures are not a trend line. Trial 2 scored 98.25% on a test set that contained near-duplicate copies of its own training images, so part of that score measured memorization. Perceptual-hash deduplication removed the duplicates before splitting, which is why Trial 2.1's 97.12% on 417 images is the honest figure rather than a regression. Trial 3 then changed the image pool, so its 97.46% is measured on a different 393-image test set again. Each number describes its own test set and none of them is a higher or lower version of another. See [model-training/non-experiment/v3/TRIAL_v3.md](model-training/non-experiment/v3/TRIAL_v3.md) for the previous released model and [model-training/non-experiment/v2.1/TRIAL_v2_1.md](model-training/non-experiment/v2.1/TRIAL_v2_1.md) for the deduplication work. V4 through V4.3.0 use seven classes; their reused-set results describe a different task and still need independent field evaluation.

---

## Responsive scan lists and batch deletion: October 6, 2026

The current source reduces the mobile Home preview from four mounted cards to one and shows five compact History rows per page while retaining six desktop cards. One responsive image serves each History record. Category counts use search matches across every page, and Home skips those counts. Batch deletion uses one local transaction and requests synchronization once after a changed batch rather than once for every selected scan. These are source-established changes in work performed, not measured improvements in inference, scrolling, deletion latency, memory, temperature, or battery life.

The parent live query still materializes and sorts every active scan, including photo Blobs. Search and category counting still work on that complete array. The October 3 database-query measurements therefore remain evidence for their original snapshot; reducing mounted cards does not implement its proposed bounded queries. Cloud cleanup also retains its existing per-record owner checks, photo/row removal, and retry behavior.

The shared native deletion dialog waits for the local transaction, locks dismissal/actions during saving, and keeps a failed confirmation available for retry. Its confirmed IDs cannot expand when new scans arrive. The compact photo-tips sheet keeps Cancel visible while its content scrolls. Disease-badge colors/padding and the reused Scan icon are presentation changes. Current-model duplicate reuse, older and unlabeled History reports, classifier inputs, model files, rejection gates, and post-inference photo compression keep their established behavior.

The [v0.5.2 validation record](testing/TESTING.md#v052-candidate-validation-october-6-2026) identifies the October 6 functional checks and R01 run. R01 completed 240 actual predictions with stable class/acceptance, confidence range 0, and no net tensor growth in that browser session. These results do not measure scrolling speed, deletion latency, total browser memory, temperature, or battery life. Earlier benchmarks and fingerprints remain tied to their original builds; this update adds no new performance benchmark. The [v0.5.3 validation](testing/TESTING.md#v053-candidate-validation-october-7-2026) separately identifies the new versioned build.

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

The former `src/lib/cloud-sync.ts` (line 177 in this dated review) reads all owner metadata and matching local records, including Blob fields. Multiple status/path writes during one upload can cause the complete live History query to rerun. Prefer mutation-only passes for queued uploads/deletes and bounded history restoration, with correct deletion reconciliation. Existing photos already present locally should continue to skip downloads.

**October 15, 2026:** that cloud module is retired by the local-only History candidate. This finding and recommendation remain historical evidence; current scans do not run that upload/pull path.

[sw.ts](../src/sw.ts#L29) explicitly bypasses caches for private requests, but not guideline reads. In the production cross-origin configuration, guidelines can match Serwist's default network-first cache. A previously cached HTTP 200 could then be mistaken for a fresh successful snapshot after network failure and overwrite newer Realtime guidance. This is a source-established possible sequence, not an observed production data regression. A separate isolated service-worker test should reproduce it before a fix. Public advice already has an offline home in Dexie.

Application retries and the guideline channel have no explicit hidden-document pause. Installed Supabase Auth already pauses its own refresh timer when hidden; application work and Auth refresh must not be confused.

The sticky header retains mobile backdrop blur. Visible card URLs can also be recreated when queries return fresh Blob objects after metadata-only changes. Cleanup exists; neither point establishes a leak or a measured scrolling regression. Measure those effects before changing styling or cache identity.

**October 4 follow-up:** The [per-card photo fix](#21-per-card-blob-url-management-scan-cardtsx) addresses the fresh-Blob URL churn observed after this review. The historical findings above describe their original source snapshot; the remaining database, synchronization, and blur recommendations are separate work.

**October 7 follow-up:** The [guideline coordination change](#38-guideline-http-and-realtime-coordination-guidelines-syncts-october-7-2026) adds service-worker network-only guideline reads and removes older cached HTTP responses. It also protects a full HTTP snapshot from overwriting overlapping Realtime or visible other-tab guidance changes. App `0.5.4` separately skips unchanged accepted HTTP guidance writes as described in section 3.9. The October 3 finding above remains a possible sequence in its original source snapshot, not a recorded production regression. Separating all cloud jobs remains a separate recommendation.

**October 8 follow-up, documented October 9:** Phone Take Photo now uses the [guided live-camera lifecycle](#29-guided-live-camera-lifecycle-october-8-2026), replacing the native-camera picker described in this historical review. It adds a live preview and one JPEG capture while preserving explicit still-photo diagnosis and stopping hardware before review or on backgrounding. The original October 3 measurements do not measure this new camera path.

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
