import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow standard <img> tags for IndexedDB Blob URLs in offline PWA
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js*",
    "scratch/**",
    // Local audit output; tracked tools/ still receives the normal checks.
    ".tools/**",
    ".test-app/**",
    "test-results/**",
    "playwright-report/**",
    ".playwright-mcp/**",
    "src/remotion/**",
  ]),
  // Let Prettier own formatting; keep ESLint's code-quality checks.
  prettier,
]);

export default eslintConfig;
