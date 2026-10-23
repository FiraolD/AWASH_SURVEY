"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The digest is Next.js's server-side error ID. Log it so ops can
  // find the exact exception in the server logs.
  if (typeof window !== "undefined") {
    console.error("[global-error]", error.digest ?? error.message);
  }

  return (
    <html>
      <body>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              The problem has been logged. Try again — if it keeps happening,
              contact your administrator
              {error.digest ? ` and mention reference ${error.digest.slice(0, 8)}` : ""}.
            </p>
            <button
              onClick={reset}
              className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}