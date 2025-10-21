import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    overlay: "src/overlay/index.ts"
  },
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  treeshake: true,
  tsconfig: "tsconfig.build.json",
  dts: { tsconfig: "tsconfig.build.json" }
});
