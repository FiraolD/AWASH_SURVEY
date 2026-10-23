"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; message: string };

const listeners = new Set<(t: Toast) => void>();
let seq = 0;

function emit(kind: Kind, message: string) {
  const t = { id: ++seq, kind, message };
  listeners.forEach((l) => l(t));
}

export const toast = {
  success: (m: string) => emit("success", m),
  error:   (m: string) => emit("error", m),
  info:    (m: string) => emit("info", m),
};

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const fn = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      setTimeout(
        () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
        3500,
      );
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  // Wipe toasts on navigation
  useEffect(() => { setItems([]); }, [pathname]);

  const color: Record<Kind, string> = {
    success: "border-l-[color:var(--success)] bg-white",
    error:   "border-l-[color:var(--rep)] bg-white",
    info:    "border-l-[color:var(--fix)] bg-white",
  };
  const icon: Record<Kind, string> = { success: "✓", error: "✕", info: "i" };
  const iconBg: Record<Kind, string> = {
    success: "bg-[color:var(--success-2)] text-[color:var(--success)]",
    error:   "bg-[color:var(--rep-2)] text-[color:var(--rep)]",
    info:    "bg-[color:var(--fix-2)] text-[color:var(--fix)]",
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`anim-slide pointer-events-auto flex max-w-sm items-start gap-3 rounded-[var(--r)] border-l-4 ${color[t.kind]} px-4 py-3 shadow-[var(--shadow-lg)]`}
        >
          <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${iconBg[t.kind]}`}>
            {icon[t.kind]}
          </span>
          <span className="text-sm text-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}