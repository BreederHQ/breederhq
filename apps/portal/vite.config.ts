import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // UI package (components, styles, layouts)
      "@bhq/ui": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "@bhq/ui/layouts": fileURLToPath(new URL("../../packages/ui/src/layouts", import.meta.url)),
      "@bhq/ui/styles": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),

      // Config/preset and API SDK
      "@bhq/config": fileURLToPath(new URL("../../packages/config", import.meta.url)),
      "@bhq/api": fileURLToPath(new URL("../../packages/api/src", import.meta.url)),

      // Cross-module import for MessagesPage
      "@bhq/marketing": fileURLToPath(new URL("../marketing/src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 6171,
    strictPort: true,
    host: true,
    allowedHosts: ["portal.breederhq.test"],
    proxy: {
      "/api": {
        target: "http://localhost:6001",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        rewrite: (p) => p, // keep /api/*
      },
      "/health": { target: "http://localhost:6001", changeOrigin: true },
      "/healthz": { target: "http://localhost:6001", changeOrigin: true },
      "/__diag": { target: "http://localhost:6001", changeOrigin: true },
    },
  },
});
