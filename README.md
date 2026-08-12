# MangoLeaf AI

MangoLeaf AI is an offline-first progressive web application for identifying possible diseases affecting mango leaves and fruit. It is designed for farmers who need a clear, mobile-friendly way to capture or upload a photo, review an AI-assisted result, and keep a local history of scans.

## Features

- Capture a new photo or upload an existing leaf or fruit image.
- Retake a photo in one tap from the confirmation view, guided by a quality reminder to keep the leaf or fruit clear, centered, and well-lit.
- Run on-device image classification with TensorFlow.js and WebGL when available.
- Review the detected condition, confidence score, and treatment guidance.
- Switch treatment guidance between English and Cebuano/Bisaya.
- Save scan records and compressed images locally with IndexedDB.
- Detect duplicate uploads with SHA-256 image hashing.
- Synchronize records with Supabase when a connection is available.
- Continue using core scan-history and diagnostic features in offline conditions.

## Technology

- Next.js 16 and React 19
- Bun
- TypeScript and Tailwind CSS
- TensorFlow.js
- Dexie / IndexedDB
- Supabase
- Serwist PWA service worker

## Requirements

Install [Bun](https://bun.sh), then confirm it is available:

```bash
bun --version
```

## Local setup

1. Clone the repository and enter the project directory.

   ```bash
   git clone https://github.com/RANDAAAALL/mangoleaf-ai.git
   cd mangoleaf-ai
   ```

2. Install dependencies.

   ```bash
   bun install
   ```

3. Create `.env.local` in the project root.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_VERSION=0.2.0
   NEXT_PUBLIC_MODEL_VERSION=model-v2.0.0
   ```

4. Start the development server.

   ```bash
   bun run dev
   ```

   Open `http://localhost:3000` in a browser.

## Commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start the local development server. |
| `bun run build` | Build the production application and service worker. |
| `bun run start` | Start the production server. |
| `bun run typecheck` | Run TypeScript checks without emitting files. |
| `bun run lint` | Run ESLint. |

## Notes

MangoLeaf AI provides AI-assisted classifications and treatment guidance. Results should be treated as a field-support tool and considered alongside visual inspection and appropriate local agricultural advice.

For implementation and performance details, see [PERFORMANCE.md](./PERFORMANCE.md).

## License and data use

The application is developed for use in the Philippine agricultural context. Operators are responsible for configuring their deployment, privacy notices, data handling, and treatment guidance to meet applicable requirements, including the Data Privacy Act of 2012.
