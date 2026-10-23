export default function ReportNotFound() {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold">Report not found</h2>
        <p className="mt-1 text-sm text-slate-500">
          It may have been deleted, or the link is out of date.
        </p>
        <a
          href="/am/reports"
          className="mt-5 inline-block rounded-md bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
        >
          Back to reports
        </a>
      </div>
    );
  }