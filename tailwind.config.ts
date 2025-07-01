import type { Config } from "tailwindcss";
import { theme } from "./src/lib/theme";

// Get all keys from the light theme as a template
const allThemeKeys = Object.keys(theme.light);

// Filter out non-color keys. This is the crucial fix to prevent server crashes.
const colorKeys = allThemeKeys.filter(key => key !== 'radius');

// Create the themeColors object correctly, mapping keys to CSS variables.
const themeColors = colorKeys.reduce((acc: { [key: string]: string }, key) => {
    acc[key] = `hsl(var(--${key}))`;
    return acc;
}, {});

export default {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        headline: ["Inter", "sans-serif"],
      },
      colors: {
        ...themeColors,
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
