/** @type {import('tailwindcss').Config} */

// RESET: Pure Tailwind, no preset dependencies
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      // Only essentials for marketplace
      colors: {
        // Orange accent
        orange: {
          500: "#f97316",
          600: "#ea580c",
        },
      },
    },
  },
  plugins: [],
};
