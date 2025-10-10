import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sunset-inspired brand palette
        sunset: {
          orange: '#FF9B6A',
          gold: '#FFD16A',
          DEFAULT: '#FF9B6A',
        },
        sky: {
          blue: '#6BA3C4',
          DEFAULT: '#6BA3C4',
        },
        lavender: {
          DEFAULT: '#B4A5C7',
          light: '#D4CBE0',
        },
        teal: {
          soft: '#7DBBC3',
        },
        neutral: {
          warm: '#F5F1E8',
        },
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
