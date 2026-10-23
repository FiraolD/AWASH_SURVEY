"use client";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/zod";

export function LangSwitch({ current }: { current: Locale }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-line text-xs">
      {LOCALES.filter((l) => l !== "om").map((l) => (
        <button
          key={l}
          onClick={() => {
            document.cookie = `locale=${l}; path=/; max-age=31536000`;
            const parts = path.split("/").filter(Boolean);
            parts[0] = l;
            router.push("/" + parts.join("/"));
          }}
          className={`px-2 py-1 ${current === l ? "bg-ink text-white" : "bg-white"}`}
        >
          {l === "en" ? "EN" : "አማ"}
        </button>
      ))}
    </div>
  );
}