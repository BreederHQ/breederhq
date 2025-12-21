import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@bhq/ui": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "@bhq/ui/layouts": fileURLToPath(new URL("../../packages/ui/src/layouts", import.meta.url)),
      "@bhq/contacts": fileURLToPath(new URL("../contacts/src", import.meta.url)),
      "@bhq/animals": fileURLToPath(new URL("../animals/src", import.meta.url)),
      "@bhq/breeding": fileURLToPath(new URL("../breeding/src", import.meta.url)),
      "@bhq/offspring": fileURLToPath(new URL("../offspring/src", import.meta.url)),
      "@bhq/marketplace": fileURLToPath(new URL("../marketplace/src", import.meta.url)),
      "@bhq/finance": fileURLToPath(new URL("../finance/src", import.meta.url)),
      "@bhq/organizations": fileURLToPath(new URL("../organizations/src", import.meta.url)),
      "@bhq/admin": fileURLToPath(new URL("../admin/src", import.meta.url)),
    },

    dedupe: ["react", "react-dom", "lucide-react"],

    preserveSymlinks: true,
  },

  server: {
    port: 6170,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:6001", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:6001", changeOrigin: true },
      "/healthz": { target: "http://127.0.0.1:6001", changeOrigin: true },
      "/__diag": { target: "http://127.0.0.1:6001", changeOrigin: true },
    },
  },
});
