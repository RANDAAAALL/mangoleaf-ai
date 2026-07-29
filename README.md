# 🥭 MangoLeaf AI — Offline-First PWA for Mango Leaf & Fruit Disease Diagnosis

**MangoLeaf AI** is a Progressive Web Application (PWA) designed to empower Filipino farmers with real-time, on-device AI diagnostics for mango leaf and fruit diseases. Built with an offline-first architecture, the application executes computer vision inference directly inside the mobile browser without requiring an active internet connection.

---

## 🌟 Key Features

- **⚡ On-Device AI Classification:** Powered by MobileNetV3 (WebGL-accelerated TensorFlow.js) for instant offline disease diagnosis with 98.25% test accuracy.
- **📴 Offline-First IndexedDB Storage:** All scan logs, diagnostic reports, and compressed leaf photos are saved locally using Dexie.js so farmers can work in remote fields.
- **🌐 Automatic Cloud Synchronization:** Seamlessly syncs local records with Supabase Storage and Database whenever network connectivity is restored.
- **🇵🇭 Dual Language Support (Bilingual):** Instant toggle between **English** and **Cebuano / Bisaya** across all UI elements, diagnostic reports, and management guidelines.
- **🛡️ Research-Grounded Legal Protection:** Built-in Privacy Policy & Terms of Service modals compliant with RA 10173 (Data Privacy Act), RA 8293 (IP Code), and DOST-PCAARRD / BAFS guidelines.
- **🖼️ Duplicate Photo Detection:** Uses Web Crypto SHA-256 image hashing to instantly detect duplicate gallery uploads and return existing diagnostic reports in ~0.01s.
- **🎨 Premium UI System:** Modern organic light-green aesthetic matching Figma designs, fully responsive across desktop, tablet, and mobile browsers.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Runtime & Package Manager:** Bun (`bun`)
- **Styling:** Tailwind CSS (Vanilla CSS design system)
- **AI / Machine Learning:** TensorFlow.js (`@tensorflow/tfjs`) with WebGL shader optimization
- **Offline Storage:** Dexie.js (IndexedDB wrapper)
- **Backend & Cloud Sync:** Supabase (PostgreSQL + Object Storage)
- **PWA Service Worker:** Serwist (`@serwist/next`) with CacheFirst offline model pre-caching
- **Icons & Typography:** Reusable SVG Icon System, Geist Sans font family

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh) installed on your system.

```bash
bun --version
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RANDAAAALL/off-on-sync.git
   cd off-on-sync
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server:**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Development Commands

| Command | Action |
|---|---|
| `bun run dev` | Starts the Next.js development server with hot reloading |
| `bun run build` | Builds the production bundle & compiles the PWA service worker |
| `bun run start` | Serves the production build locally |
| `bun run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `bun run lint` | Runs ESLint code quality checks |

---

## 📊 Performance & Specifications

For comprehensive technical documentation on GPU WebGL optimizations, memory management budgets, image compression pipelines, and React render optimizations, see [PERFORMANCE.md](./PERFORMANCE.md).

---

## 📄 License & Compliance

Developed under Republic Act No. 8293 (Intellectual Property Code of the Philippines) and Republic Act No. 10173 (Data Privacy Act of 2012). Treatment guidelines are derived from official DOST-PCAARRD and BAFS agricultural standards.
