"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

const ORDER = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid rendering the wrong icon during SSR/hydration
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  const current = (theme ?? "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Monitor;
  const label = `Theme: ${current}. Switch to ${next}.`;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md
                 border border-border text-foreground
                 hover:bg-accent hover:text-accent-foreground
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}