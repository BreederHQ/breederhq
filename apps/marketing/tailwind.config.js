/** @type {import('tailwindcss').Config} */
const preset = require("../../packages/config/tailwind-preset.cjs");

module.exports = {
  presets: [preset],
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "../../packages/ui/src/**/*.{ts,tsx,js,jsx,css}",
  ],
};

