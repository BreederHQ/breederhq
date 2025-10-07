const path = require("node:path");
module.exports = {
  darkMode: "class",
  content: [
    path.resolve(__dirname, "index.html"),
    path.resolve(__dirname, "src/**/*.{ts,tsx}"),
    path.resolve(__dirname, "../../packages/ui/src/**/*.{ts,tsx}"),
    path.resolve(__dirname, "../organizations/src/**/*.{ts,tsx}"),
  ],
  theme: { extend: {} },
  plugins: [],
};
