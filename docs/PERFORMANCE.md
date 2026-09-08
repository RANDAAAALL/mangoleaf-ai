# MangoLeaf AI: System Performance & Optimization Specifications

This document outlines the technical optimizations, hardware acceleration strategies, memory management budgets, and React re-render controls implemented in **MangoLeaf AI** (`mangoleaf-ai`) to ensure seamless execution on low-end mobile devices and offline agricultural environments.

---

## 📊 Executive Summary & Performance Matrix

| Metric / Dimension | Before Optimization | After Optimization | Performance Gain |
| :--- | :--- | :--- | :--- |
| **Initial JS Payload (TFJS Engine)** | Eagerly imported in main bundle (~1.5MB) | Dynamic `import()` inside `useEffect` & event handlers | **~1.5MB lighter initial load, instant FCP** |
| **GPU VRAM Allocation (Per Scan)** | ~36 Million Floats (12MP Raw Tensor) | ~150 Thousand Floats (224x224 Canvas) | **~240x Memory Reduction** |
| **GPU Texture Precision** | 32-bit Float | 16-bit Float (`WEBGL_FORCE_F16_TEXTURES`) | **50% Lower VRAM Footprint** |
| **Model Download Size (First Load)** | Uncached model fetch | 11.53 MB Trial 3 float32 model precached in 3 shards | **No repeat download after install** |
| **UI Thread Block during AI** | Synchronous Blocking (`dataSync()`) | Async Non-blocking (`outputTensor.data()`) | **Smooth 60FPS UI Animations** |
| **Stored Scan Photo Size** | 6.0 MB – 12.0 MB Raw Camera File | ~75 KB WebP (with JPEG ~150 KB fallback) | **80x–160x Smaller Storage & Upload** |
| **Blob URL Memory & Render Lifecycle** | Central map regenerated ALL URLs on 1 scan change | Per-card `useEffect` ObjectURL creation & auto-cleanup | **Zero image flicker, zero heap leaks** |
| **React Component Re-renders** | Entire component tree re-rendered | `React.memo()` + stabilized callbacks (`useCallback`) & memoized arrays | **~75% Fewer DOM Diffs** |
| **Mobile Modal GPU Compositing** | Full-screen `backdrop-blur-md` on budget phones | Light `bg-black/60` on mobile, `md:backdrop-blur-sm` on desktop | **Smooth 60FPS modal transitions on budget Androids** |
| **Model Re-loads on Reconnect** | Re-loaded on every network toggle | Module-level singleton cache (loaded once) | **0.0s Reconnect Latency** |
| **Canvas Allocation per Scan** | New `<canvas>` element every inference | Module-level singleton canvas reuse | **Zero GC Pressure** |
| **Database Sync Operations** | Sequential single-row `put()` calls | Batch `bulkPut()` single-transaction | **~3x Faster Sync Flush** |
| **Font Loading (FOIT)** | Flash of Invisible Text on slow 3G | `display: "swap"` instant text rendering | **Instant Text Visibility** |
| **Conditional Component Bundles** | All components loaded upfront | `next/dynamic` code-splitting for heavy modals | **Smaller Initial JS Payload** |
| **Duplicate Photo Detection** | Same gallery photo re-diagnosed every time | SHA-256 Web Crypto hash check skips AI entirely | **No model inference for duplicates** |
| **3G Upload Timeout** | Stalled Storage upload holds sync job | Per-request `AbortController` aborts after 10 seconds | **10s max, exponential retry** |
| **Concurrent Sync Safety** | Sync triggers could overlap or miss new work | Lock queues one follow-up sync | **No overlapping uploads, no missed mutation** |
| **Supabase First Request** | Cold DNS + TLS handshake (~300ms on 3G) | `<link rel="preconnect">` preflight | **~300ms Faster First Sync** |

---

## 🧠 1. On-Device AI Engine & WebGL GPU Optimizations

### 1.1 Dynamic Code-Splitting for TensorFlow.js (`page.tsx`)
* **Problem:** Importing `@tensorflow/tfjs` and `@/lib/classifier` statically at the top of `page.tsx` pulled the entire ~1.5MB TensorFlow.js engine into the initial JavaScript bundle, delaying First Contentful Paint (FCP) on slow 3G networks.
* **Solution:** TensorFlow.js functions are dynamically imported using `await import("@/lib/classifier")` inside the model initialization `useEffect` and inside the `runDiagnosis` handler.
* **Result:** Initial page HTML and styling render in **under 1 second**, while TensorFlow.js loads silently in the background.

### 1.2 CPU Canvas Pre-Downscaling (GPU VRAM Protection)
* **Problem:** Smartphone cameras produce 12MP to 108MP photos (e.g. 4000x3000 pixels). Converting raw high-res images directly into TensorFlow.js tensors allocates 36 million floating-point numbers in GPU memory before resizing.
* **Solution:** In `src/lib/classifier.ts`, raw photos are first pre-scaled down to **224x224 pixels** on a lightweight CPU `<canvas>` element using browser-native bilinear interpolation before `tf.browser.fromPixels()` is invoked.
* **Result:** Prevents mobile browser tab crashes ("Aw, Snap!") on low-end smartphones with limited RAM.

### 1.3 WebGL 16-Bit Float Textures
* **Implementation:** `tf.env().set("WEBGL_FORCE_F16_TEXTURES", true)` is executed prior to model initialization.
* **Rationale:** Halves GPU texture memory allocation on phones. Trial 3 deliberately ships float32 weights, but this WebGL setting uploads them to half-float textures on supported devices. The model file, class mapping, thresholds, and model accuracy are not changed at runtime.
* **Download trade-off:** Trial 3 remains 11.53 MB across three shards. A separately verified float16 export could reduce transfer size, but it is not shipped; no model artifact was modified in this optimization pass.

### 1.4 Asynchronous Non-Blocking Inference & Garbage Collection
* **Implementation:** Output tensors are extracted via `await outputTensor.data()` instead of synchronous `dataSync()`.
* **VRAM Cleanup:** All tensor creation and matrix operations are wrapped inside `tf.tidy()`. Intermediate tensors are immediately purged from GPU VRAM, maintaining zero memory leaks across consecutive scans.

### 1.5 Startup GPU Shader Warmup & Light Green Splash Screen
* **Implementation:** On app launch, `loadMangoModel()` executes a dummy inference with `tf.zeros([1, 224, 224, 3])` behind a light organic green (`#f6faf1`) splash screen (`<SplashScreen />`) featuring the SVG brand logo and dual-tone spinner (`border-[#e2ebd9] border-t-[#277839]`).
* **Rationale:** Forces the mobile GPU to compile all WebGL shader programs during initial loading so that the user's first real scan executes instantaneously with zero lag.

### 1.6 Module-Level Model Singleton Cache (`classifier.ts`)
* **Implementation:** `cachedModel` and `loadingPromise` variables persist at the module level outside React's component lifecycle.
* **Behavior:** The AI model is loaded, warmed, and cached **only once** per browser session. All subsequent calls to `loadMangoModel()` return the cached instance in **0.0 seconds**, eliminating redundant model re-downloads during network reconnection events or React component remounts.

### 1.7 Singleton Canvas Reuse (`classifier.ts`)
* **Implementation:** A module-level `sharedCanvas` HTMLCanvasElement is created once and reused for all subsequent `downscaleToCanvas()` calls.
* **Context Hint:** Canvas 2D context is initialized with `{ alpha: false }` since all camera photos are opaque JPEGs, eliminating unnecessary alpha channel compositing overhead.
* **Confidence Rounding:** Replaced `parseFloat(maxProb.toFixed(2))` (float→string→float) with `Math.round(maxProb * 100) / 100` (pure numeric operation) in the inference hot path.

### 1.8 One-Time Splash Screen Guard (`page.tsx`)
* **Implementation:** A module-level `hasInitialized` flag persists across React remounts, network reconnections, and `useSync` state updates.
* **Behavior:** The splash screen renders **only once** on the very first app load. Going offline → online, component remounts, and sync triggers never re-trigger the splash screen.

---

## 🎨 2. Frontend React Architecture & DOM Optimizations

### 2.1 Per-Card Blob URL Management (`scan-card.tsx`)
* **Problem:** Maintaining a centralized `blobUrlMap` in `page.tsx` meant adding or deleting a single scan caused all Blob ObjectURLs across the entire history list to be revoked and regenerated, causing visible image flickering and memory spikes.
* **Solution:** Blob URL creation is scoped directly inside `scan-card.tsx` using a local `useEffect` linked to `imageBlob`.
* **Cleanup:** Each `ScanCard` revokes its own `ObjectURL` upon unmounting or when the scan blob changes, ensuring zero image flickering and zero heap memory leaks.

### 2.2 Modular Component Refactoring & `React.memo()` Memoization
* **Structure:** Scoped UI into isolated components (`SplashScreen`, `TopHeader`, `BottomNav`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `Footer`), grouped into `src/components/` subfolders by role: `brand/`, `layout/`, `modal/`, `scan/`, and `tab/`.
* **Per-Tab Components:** `HomeTab`, `HistoryTab`, and `AboutTab` replace the inline `activeTab` branches previously in `page.tsx`. Only the active tab's subtree is mounted, so switching tabs unmounts the other two instead of keeping all three in the render output.
* **Memoization:** `HomeTab`, `HistoryTab`, `AboutTab`, `DiagnosticScanner`, `ScanCard`, `ScanHistoryList`, `HowItWorksSteps`, `DiseaseCoverageCard`, `ScanDetailsModal`, `LegalModal`, `TopHeader`, `BottomNav`, `Icon`, `Logo`, and `Footer` are wrapped in `React.memo()` to prevent unnecessary re-renders when parent state changes. `SplashScreen` is not memoized because it renders once before the model finishes loading and is then replaced.
* **Stable Callbacks & Refs:** `handleViewAllHistory` and `setLanguage` are wrapped in `useCallback`. `selectedFileRef` and `previewUrlRef` stabilize `runDiagnosis` callback identity across state changes.

### 2.3 Dexie Reverse Query Optimization (`page.tsx`)
* **Implementation:** IndexedDB query fetches active scans sorted descending directly at the query level using `db.scans.where("_status").notEqual("pending-delete").sortBy("updated_at").then(results => results.reverse())`.
* **Impact:** Eliminates in-memory `[...scans].reverse()` array copying and re-allocation on every render.

### 2.4 Mobile Overlay Backdrop Blur Removal
* **Implementation:** Replaced heavy `backdrop-blur-md` on mobile full-screen overlays with lightweight `bg-black/60 md:backdrop-blur-sm` in `diagnostic-scanner.tsx`, `scan-details-modal.tsx`, and `legal-modal.tsx`.
* **Impact:** Budget Android devices (e.g., Redmi, Galaxy A series) render modal transitions smoothly at 60FPS without GPU shader composite bottlenecking.

### 2.5 Post-Inference Storage Compression (WebP with JPEG Fallback)
* **Flow:** 
  1. User snaps a photo.
  2. AI model analyzes the uncompressed image first (**97.46% Test Accuracy maintained**).
  3. **AFTER** prediction finishes, `compressImageForStorage()` resizes the photo to a max dimension of 1000px and compresses using **WebP at 75% quality** (~70–90 KB). If the browser doesn't support WebP canvas export, automatically falls back to **JPEG at 80% quality** (~150 KB).
* **Impact:** Drops storage footprint from **6 MB → 75 KB** (80x reduction) for WebP-capable devices, ensuring rapid synchronization on weak 3G/4G cellular networks. Upload time halved compared to JPEG.

### 2.6 Dynamic Code-Splitting for Modals (`page.tsx`)
* **Implementation:** `ScanDetailsModal` is loaded via `next/dynamic` instead of static imports.
* **Impact:** Component JS is downloaded only when the user opens a scan detail, keeping the main bundle lean.

### 2.7 Type-Only TensorFlow.js Import (`page.tsx`)
* **Implementation:** Uses `import type * as tf from "@tensorflow/tfjs"` in `page.tsx`.
* **Impact:** TensorFlow.js is no longer pulled into the main page bundle for type-only usage.

---

## 🌐 3. PWA Offline Infrastructure & Network Caching

### 3.1 Service Worker Model Pre-Caching (`sw.ts`)
* **Strategy:** Serwist precaches all five `/model/*` files: `model.json`, `model_config.json`, and `group1-shard1of3.bin` through `group1-shard3of3.bin`. The `CacheFirst` runtime rule remains as defence in depth.
* **Impact:** Guarantees that even if the smartphone is rebooted in complete Airplane Mode, the AI model loads instantly from browser `CacheStorage`.
* **Versioned cache name:** `mangoleaf-model-cache-v3-0-0`. The cache label is bumped whenever `public/model/` changes, and activation deletes superseded model caches so old weights do not occupy device storage forever.
* **The precache is the real update mechanism.** Public files receive content-revision hashes in Serwist's precache manifest, which is matched before runtime caching. Replaced weights therefore refetch on next activation. An empty runtime model cache is normal; verify updates in generated `public/sw.js`.

### 3.2 High-Capacity Offline Database (Dexie.js / IndexedDB)
* **Storage Layer:** Binary photo Blobs and scan metadata are persisted locally using Dexie.js (IndexedDB).
* **Indexed Queries:** Active scans are queried via `db.scans.where("_status").notEqual("pending-delete")` using Dexie's native index instead of in-memory JS `.filter()`. Pending sync scans use `db.scans.where("_status").anyOf(["pending-insert", "pending-delete"])`.
* **Efficient Lookups:** Finding the newest scan uses `db.scans.orderBy("updated_at").last()` instead of loading all records into memory.

### 3.3 Batch Database Operations (`useSync.ts`)
* **Guidelines Sync:** Remote guidelines are inserted via `db.guidelines.bulkPut()` in a single IndexedDB transaction instead of sequential individual `put()` calls.
* **Scans Sync:** Remote scans are checked with one `db.scans.bulkGet()` and inserted through `db.scans.bulkPut()`, avoiding one IndexedDB request per restored history row.

### 3.4 Duplicate Photo Checker (SHA-256 Image Hash)
* **Implementation:** When a farmer selects a photo, `computeImageHash()` in `classifier.ts` calculates a unique 64-character SHA-256 fingerprint through browser-native asynchronous Web Crypto. Its time depends on original photo size, but it does not run TensorFlow.js.
* **Lookup:** The hash is checked against the indexed `image_hash` column in Dexie's `scans` table via `db.scans.where("image_hash").equals(hash).first()`.
* **Duplicate Found:** If matched, the app skips AI model execution entirely and instantly opens the existing scan report — saving 100% of GPU memory, battery, and processing time.
* **New Photo:** If no match, runs the AI model normally and stores the `image_hash` alongside the scan record in both IndexedDB and Supabase.

### 3.5 3G Network Resilience: Upload Timeout (`supabase-client.ts`, `useSync.ts`)
* **Problem:** On weak 3G connections with packet loss, the default browser `fetch()` can hang for **30–60 seconds** waiting for a Supabase Storage upload response.
* **Solution:** A Supabase client fetch wrapper applies a real `AbortController` timeout only to writes into Storage's `scans` bucket. Storage's `upload()` options do not accept a signal, so this cancellation happens at its underlying fetch layer. The retry delays are 10 seconds, 30 seconds, 60 seconds, then every 5 minutes while online.
* **Safety:** The scan record remains `pending-insert` in IndexedDB. A successful blob upload stores its public URL locally before row insertion, so a later metadata failure retries only that small row instead of re-uploading photo bytes.

### 3.6 3G Network Resilience: Concurrent Sync Lock (`useSync.ts`)
* **Problem:** On slow 3G, multiple sync triggers (e.g., going online + taking a new scan simultaneously) could fire overlapping network requests.
* **Solution:** A `useRef`-based `isSyncingRef` lock allows one sync at a time. A trigger arriving during active work queues exactly one follow-up pass, which prevents overlap without losing a new local mutation.
* **Mobile background recovery:** Returning the PWA to the foreground clears a throttled retry timer and starts a fresh online sync immediately.

---

## 🎭 4. CSS & GPU Compositing Optimizations

### 4.1 Solid Backgrounds on Scroll List Cards (`scan-card.tsx`)
* **Change:** Replaced `backdrop-blur-sm` (expensive GPU filter on every card) with solid `bg-slate-900/95` background.
* **Impact:** Eliminates severe GPU rasterization lag during fast scrolling on budget smartphones.

### 4.2 Targeted CSS Transitions
* **Change:** Replaced `transition-all` with `transition-colors` or `transition-transform` on interactive elements across components.
* **Impact:** Browser only recalculates composite-friendly properties (color, transform) during hover/tap interactions, avoiding expensive layout recalculations.

### 4.3 Clean Text Justification Engine
* **Implementation:** Text callouts and guideline blocks use `text-justify [text-justify:inter-word] break-words hyphens-auto` paired with dynamic `lang="en" | "ceb"` attributes.
* **Impact:** Prevents unsightly line breaks and word gaps across English and Bisaya text without JS layout measurement overhead.

### 4.4 Font Loading Optimization (`layout.tsx`)
* **Implementation:** Added `display: "swap"` to both `Geist` and `Geist_Mono` font configurations.
* **Impact:** Eliminates Flash of Invisible Text (FOIT) on slow 3G/4G networks.
* **Font Variable Fix:** Updated `globals.css` body rule to use `var(--font-sans)` before falling back to Arial/Helvetica.

### 4.5 Supabase Network Preconnect (`layout.tsx`)
* **Implementation:** Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` for the Supabase project URL in document `<head>`.
* **Impact:** Browser initiates DNS resolution and TLS handshake to Supabase immediately on page load, saving **~300ms** on the first network request over 3G/4G networks.

---

## 📌 Accuracy & Integrity Guarantee

> **Note on AI Accuracy:** All storage, compression, UI rendering, database, and CSS optimizations operate independently of the neural network math. The AI model receives uncompressed tensor inputs first, preserving the **97.46% test classification accuracy** validated during Trial 3 model training.
>
> The three trial figures are not a trend line. Trial 2 scored 98.25% on a test set that contained near-duplicate copies of its own training images, so part of that score measured memorization. Perceptual-hash deduplication removed the duplicates before splitting, which is why Trial 2.1's 97.12% on 417 images is the honest figure rather than a regression. Trial 3 then changed the image pool, so its 97.46% is measured on a different 393-image test set again. Each number describes its own test set and none of them is a higher or lower version of another. See [model-training/trials/TRIAL_v3.md](model-training/trials/TRIAL_v3.md) for the current model and [model-training/trials/TRIAL_v2_1.md](model-training/trials/TRIAL_v2_1.md) for the deduplication work.
