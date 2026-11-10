import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mut: "#64748b",
        line: "#e4e8ee",
        bg: "#f5f7fa",
        acc: "#005baa",
        acc2: "#eaf3fc",
        rep: "#dc2626",
        rep2: "#fef2f2",
        fix: "#2563eb",
        fix2: "#eff6ff",
        wave: "#3cb4e0",
      },
      // Latin letters come from a clean UI font; Ethiopic letters fall through (per glyph) to Noto Sans Ethiopic.
      fontFamily: {
        sans: ['"Segoe UI"', "system-ui", "Roboto", '"Helvetica Neue"', "Arial", "var(--font-ethiopic)", '"Noto Sans Ethiopic"', "Nyala", '"Abyssinica SIL"', "sans-serif"],
        ethiopic: ['"Segoe UI"', "system-ui", "Roboto", '"Helvetica Neue"', "Arial", "var(--font-ethiopic)", '"Noto Sans Ethiopic"', "Nyala", '"Abyssinica SIL"', "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;