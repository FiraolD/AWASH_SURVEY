"use client";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-base font-semibold text-red-900">
        Could not load this report
      </h2>
      <p className="mt-1 text-sm text-red-800">
        {error.message}
        {error.digest ? ` (ref ${error.digest.slice(0, 8)})` : ""}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-800 ring-1 ring-red-200 hover:bg-red-100"
        >
          Try again
        </button>
        <a
          href="/am/reports"
          className="rounded-md px-3 py-1.5 text-sm text-red-700 hover:underline"
        >
          Back to reports
        </a>
      </div>
    </div>
  );
}