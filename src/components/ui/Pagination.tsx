"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function Pagination({
  page, pageSize, total,
}: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const am = path.split("/")[1] === "am";
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
      <p className="text-sm text-[color:var(--mut)]">
        {am
          ? `ጠቅላላ ${total.toLocaleString()} · ገጽ ${page} / ${pages}`
          : `${total.toLocaleString()} total · page ${page} of ${pages}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(1)}
          aria-label="First page"
          disabled={page === 1}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          «
        </button>
        <button
          onClick={() => go(page - 1)}
          aria-label="Previous page"
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
              "min-w-8 rounded-md px-2.5 py-1.5 text-sm max-sm:min-w-9 max-sm:py-2 " +
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
          aria-label="Next page"
          disabled={page === pages}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          ›
        </button>
        <button
          onClick={() => go(pages)}
          aria-label="Last page"
          disabled={page === pages}
          className="rounded-md border border-[color:var(--line-2)] bg-white px-2.5 py-1.5 text-sm hover:bg-[color:var(--bg)] disabled:opacity-40"
        >
          »
        </button>
      </div>
    </div>
  );
}