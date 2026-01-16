import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: ["@bhq/contacts", "@bhq/animals", "@bhq/breeding", "@bhq/offspring", "@bhq/marketing", "@bhq/finance", "@bhq/contracts", "@bhq/admin", "@bhq/waitlist", "@bhq/marketplace", "@bhq/bloodlines"],
  },

  resolve: {
    alias: {
      "@bhq/ui": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "@bhq/ui/layouts": fileURLToPath(new URL("../../packages/ui/src/layouts", import.meta.url)),
      "@bhq/api": fileURLToPath(new URL("../../packages/api/src", import.meta.url)),
      "@bhq/contacts": fileURLToPath(new URL("../contacts/src", import.meta.url)),
      "@bhq/animals": fileURLToPath(new URL("../animals/src", import.meta.url)),
      "@bhq/breeding": fileURLToPath(new URL("../breeding/src", import.meta.url)),
      "@bhq/offspring": fileURLToPath(new URL("../offspring/src", import.meta.url)),
      "@bhq/marketing": fileURLToPath(new URL("../marketing/src", import.meta.url)),
      "@bhq/finance": fileURLToPath(new URL("../finance/src", import.meta.url)),
      "@bhq/contracts": fileURLToPath(new URL("../contracts/src", import.meta.url)),
      "@bhq/admin": fileURLToPath(new URL("../admin/src", import.meta.url)),
      "@bhq/waitlist": fileURLToPath(new URL("../waitlist/src", import.meta.url)),
      "@bhq/marketplace": fileURLToPath(new URL("../marketplace/src", import.meta.url)),
      "@bhq/bloodlines": fileURLToPath(new URL("../bloodlines/src", import.meta.url)),
    },

    dedupe: ["react", "react-dom", "lucide-react"],

    preserveSymlinks: true,
  },

  server: {
    port: 6170,
    strictPort: true,
    host: true,
    allowedHosts: ["app.breederhq.test"],
    proxy: {
      "/api": { target: "http://127.0.0.1:6001", changeOrigin: true, ws: true },
      "/health": { target: "http://127.0.0.1:6001", changeOrigin: true },
      "/healthz": { target: "http://127.0.0.1:6001", changeOrigin: true },
      "/__diag": { target: "http://127.0.0.1:6001", changeOrigin: true },
    },
  },
});
