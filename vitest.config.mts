import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mesmo JSX do Next (runtime automático, sem precisar de `import React`).
  // Desde o Vitest 5 (Vite 8) quem transforma o código é o oxc, não o esbuild.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    clearMocks: true,
  },
});
