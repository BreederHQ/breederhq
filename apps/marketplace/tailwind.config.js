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
      // Theme colors - dark mode portal colors (marketplace uses dark by default for cards)
      colors: {
        // Dark portal backgrounds (for dark mode / cards)
        portal: {
          bg: "#0a0a0a",           // Dark background
          base: "#0d0d0d",         // Base dark
          elevated: "#141414",      // Elevated surfaces
          card: "#1a1a1a",          // Card background
          "card-hover": "#242424",  // Card hover
          surface: "#1f1f1f",       // Surface areas
        },
        // Dark borders
        "border-subtle": "#2a2a2a",
        "border-default": "#3a3a3a",
        // Brand accent (orange) - #f97316 is the theme orange
        accent: {
          DEFAULT: "#f97316",
          hover: "#ea580c",
          muted: "rgba(249, 115, 22, 0.1)",
        },
        // Dark theme text (light text on dark backgrounds)
        "text-primary": "#ffffff",
        "text-secondary": "#a1a1aa",
        "text-tertiary": "#71717a",
        "text-muted": "#52525b",
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
