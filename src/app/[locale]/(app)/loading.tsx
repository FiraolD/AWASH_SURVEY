// Shown instantly while a page in the signed-in area loads (uses the .skeleton style from globals.css).
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>
      <div className="skeleton h-24 w-full" style={{ borderRadius: "var(--r-lg)" }} />
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[color:var(--line)] px-4 py-3 last:border-0">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
