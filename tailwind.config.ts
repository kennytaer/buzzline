import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'media', // Enable automatic dark mode based on system preference
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      colors: {
        // Main brand colors
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5edcd6',
          400: '#22d3ee',
          500: '#5EC0DA', // Main cyan action color
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ED58A0', // Main pink brand color
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Supporting colors
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Data visualization colors
        chart: {
          1: '#5EC0DA', // Primary action color
          2: '#ED58A0', // Secondary brand color
          3: '#10b981', // Green for positive metrics
          4: '#f59e0b', // Amber for warnings
          5: '#ef4444', // Red for negative metrics
          6: '#8b5cf6', // Purple for additional data
          7: '#06b6d4', // Cyan variant
          8: '#84cc16', // Lime for growth
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
