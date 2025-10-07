import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@bhq/ui":            fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "@bhq/ui/layouts":    fileURLToPath(new URL("../../packages/ui/src/layouts", import.meta.url)),
      "@bhq/contacts":      fileURLToPath(new URL("../contacts/src", import.meta.url)),
      "@bhq/animals":       fileURLToPath(new URL("../animals/src", import.meta.url)),
      "@bhq/organizations": fileURLToPath(new URL("../organizations/src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 6170,
    strictPort: true,
    proxy: {
      "/api":    { target: "http://localhost:6001", changeOrigin: true, rewrite: p => p },
      "/health": { target: "http://localhost:6001", changeOrigin: true },
      "/healthz":{ target: "http://localhost:6001", changeOrigin: true },
      "/__diag": { target: "http://localhost:6001", changeOrigin: true },
    },
  },
});
