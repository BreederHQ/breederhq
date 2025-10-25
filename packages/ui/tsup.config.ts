import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    overlay: "src/overlay/index.ts",
  },
  format: ["esm", "cjs"],
  dts: { tsconfig: "tsconfig.build.json" }, 
  tsconfig: "tsconfig.build.json",          
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: ["react", "react-dom"]
});
