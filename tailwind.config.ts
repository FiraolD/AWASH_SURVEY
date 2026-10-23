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
      fontFamily: {
        ethiopic: ["Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;