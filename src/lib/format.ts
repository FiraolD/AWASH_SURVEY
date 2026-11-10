// One date format for the whole app: dd/MM/yyyy (Gregorian), Addis Ababa time for timestamps.
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-09" or a Date/ISO timestamp -> "09/11/2026" */
export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  if (typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); // plain DATE column: no timezone shifting
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** timestamp -> "09/11/2026 14:05" */
export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? pad(0);
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}
