import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
