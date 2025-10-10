import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens placeholder – populate with brand palette once finalized.
      },
      spacing: {
        // Spacing scale placeholder – adjust when design tokens are defined.
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-merriweather)", "Georgia", "serif"],
      },
      borderRadius: {
        // Radius tokens placeholder – keeps border radii consistent across UI.
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
