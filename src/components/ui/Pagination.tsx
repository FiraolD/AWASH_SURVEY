"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function Pagination({
  page, pageSize, total,
}: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`${path}?${next.toString()}`);
  };

  if (pages <= 1) return null;

  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const window = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <p className="text-sm text-[color:var(--mut)]">
        {total.toLocaleString()} total · page {page} of {pages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(1)}
          disabled={page === 1}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          «
        </button>
        <button
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          ‹
        </button>
        {window.map((p) => (
          <button
            key={p}
            onClick={() => go(p)}
            className={
              "min-w-8 rounded-md px-2.5 py-1.5 text-sm " +
              (p === page
                ? "bg-[color:var(--acc)] text-white"
                : "border border-[color:var(--line-2)] bg-white hover:bg-[color:var(--bg)]")
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => go(page + 1)}
          disabled={page === pages}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          ›
        </button>
        <button
          onClick={() => go(pages)}
          disabled={page === pages}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          »
        </button>
      </div>
    </div>
  );
}