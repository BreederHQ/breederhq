/** @type {import('tailwindcss').Config} */

// Portal-aligned Tailwind config for Marketplace
// Design tokens sourced from Portal (apps/portal/src/design/tokens.css)
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      // Portal-aligned colors
      colors: {
        // Portal backgrounds
        portal: {
          bg: "#08090a",
          elevated: "#0f1012",
          card: "#141618",
          "card-hover": "#1a1c1f",
        },
        // Portal borders
        "border-subtle": "#1a1c1e",
        "border-default": "#232528",
        // Portal accent (orange)
        accent: {
          DEFAULT: "#ff6b35",
          hover: "#ff8555",
          muted: "rgba(255, 107, 53, 0.15)",
        },
        // Portal text
        "text-secondary": "#a8adb3",
        "text-tertiary": "#6b7280",
        "text-muted": "#4b5563",
      },
      // Portal radius scale
      borderRadius: {
        portal: "16px",
        "portal-sm": "12px",
        "portal-xs": "8px",
      },
      // Portal shadows
      boxShadow: {
        portal: "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.05)",
        "portal-hover": "0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)",
      },
      // Portal max-width
      maxWidth: {
        portal: "1200px",
      },
      // Portal header height
      height: {
        header: "64px",
      },
    },
  },
  plugins: [],
};
