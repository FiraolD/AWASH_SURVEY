import type { Messages } from "@/lib/i18n";
import type { ReportItem, SurveyReport } from "~db/schema";

const ROWS = 22;

export function PrintSheet({
  locale,
  messages,
  report,
  items,
  finalizedByName,
}: {
  locale: string;
  messages: Messages;
  report: SurveyReport;
  items: ReportItem[];
  finalizedByName?: string | null;
}) {
  const replaces = items.filter((i) => i.action === "replace");
  const repairs = items.filter((i) => i.action === "repair");
  const pages = Math.max(
    1,
    Math.ceil(Math.max(replaces.length, repairs.length) / ROWS),
  );
  const recNums = replaces
    .map((x, i) => (x.isRecovery ? i + 1 : null))
    .filter(Boolean)
    .join(", ");

  const isFull = report.coverage === "comprehensive";
  const isThird = report.coverage === "third_party";
  const isFinalized = report.status === "finalized";

  return (
    <div>
      {Array.from({ length: pages }).map((_, p) => {
        const isLast = p === pages - 1;
        return (
          <section
            key={p}
            className="page relative mx-auto mb-4 flex flex-col bg-white"
            style={{
              width: "210mm",
              height: "296mm",
              padding: "9mm 11mm 8mm",
              pageBreakAfter: "always",
              overflow: "hidden",
            }}
          >
            {isFinalized && (
              <Stamp report={report} finalizedByName={finalizedByName} />
            )}

            <div className="flex h-[22mm] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="" className="h-full object-contain" />
            </div>

            <div className="mt-[2mm] text-center text-[13.5pt] font-bold">
              በአደጋ የተጎዱ ተሽከርካሪዎች የአካል ጉዳት ዝርዝር መግለጫ
            </div>

            <div className="mt-[2mm] grid grid-cols-2 gap-x-[10mm] text-[9.5pt]">
              <div className="flex flex-col gap-[1mm]">
                <div className="flex h-[5.8mm] items-center gap-[3mm]">
                  <span className="flex items-center gap-1.5">
                    <b className="whitespace-nowrap">ሙሉ ኢንሹራንስ</b>
                    <Box checked={isFull} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <b className="whitespace-nowrap">ሦስተኛ ወገን</b>
                    <Box checked={isThird} />
                  </span>
                </div>
                <PrintField
                  label="የተሽከርካሪ ዓይነት"
                  value={report.vehicleType}
                />
                <PrintField label="የሠሌዳ ቁጥር" value={report.plateNo} />
                <PrintField
                  label="የተሠራበት ዓ.ም"
                  value={report.manufactureYear?.toString()}
                />
              </div>
              <div className="flex flex-col gap-[1mm]">
                <PrintField label="ቀን" value={report.reportDate} />
                <PrintField label="ቅርንጫፍ" value={String(report.branchId)} />
                <PrintField label="የሞተር ቁጥር" value={report.engineNo} />
                <PrintField label="የሻንሲ ቁጥር" value={report.chassisNo} />
                <PrintField label="ሞዴል" value={report.model} />
              </div>
            </div>

            <table
              className="mt-[2mm] w-full border-collapse border-[.35mm] border-black"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: "10mm" }} />
                <col />
                <col style={{ width: "10mm" }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <Th>ተ.ቁ</Th>
                  <Th>የሚለወጡ እቃዎች ዝርዝር</Th>
                  <Th>ተ.ቁ</Th>
                  <Th>የሚስተካከሉ እቃዎች ዝርዝር</Th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }).map((_, r) => {
                  const i = p * ROWS + r;
                  const a = replaces[i];
                  const b = repairs[i];
                  const aMeta = conditionMeta(a);
                  const bMeta = conditionMeta(b);
                  return (
                    <tr key={r} style={{ height: "7.05mm" }}>
                      <td className="border-[.3mm] border-black text-center text-[8pt]">
                        {a ? i + 1 : ""}
                      </td>
                      <td className="border-[.3mm] border-black">
                        {a && (
                          <div className="px-[1.5mm] leading-tight">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10pt] font-semibold">
                                {a.names.am}
                              </span>
                              <span className="text-[8.5pt] text-gray-600">
                                / {a.names.en}
                              </span>
                            </div>
                            {a.remark && (
                              <div className="text-[6.5pt] italic text-gray-600 mt-[1px]">
                                {a.remark}
                              </div>
                            )}
                            {aMeta && (
                              <div className="text-[6pt] font-semibold tracking-wide text-gray-500">
                                {aMeta}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border-[.3mm] border-black text-center text-[8pt]">
                        {b ? i + 1 : ""}
                      </td>
                      <td className="border-[.3mm] border-black">
                        {b && (
                          <div className="px-[1.5mm] leading-tight">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10pt] font-semibold">
                                {b.names.am}
                              </span>
                              <span className="text-[8.5pt] text-gray-600">
                                / {b.names.en}
                              </span>
                            </div>
                            {b.remark && (
                              <div className="text-[6.5pt] italic text-gray-600 mt-[1px]">
                                {b.remark}
                              </div>
                            )}
                            {bMeta && (
                              <div className="text-[6pt] font-semibold tracking-wide text-gray-500">
                                {bMeta}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isLast && (
              <div
                className="mt-[3mm] text-[8.6pt] leading-snug"
                style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <u className="text-[9.5pt] font-bold">{messages.notes.title}</u>
                <ol className="ml-[5mm] mt-1 list-decimal">
                  <li>{messages.notes.n1}</li>
                  <li>{messages.notes.n2}</li>
                  <li>{messages.notes.n3}</li>
                  <li>
                    {messages.notes.n4Prefix}{" "}
                    <span className="underline">
                      {recNums || "\u00A0".repeat(30)}
                    </span>{" "}
                    {messages.notes.n4Suffix}
                  </li>
                  <li>{messages.notes.n5}</li>
                </ol>
              </div>
            )}

            {pages > 1 && (
              <div className="absolute bottom-4 right-4 text-[8pt] text-gray-500">
                ገጽ {p + 1} / {pages}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Stamp({
  report: _report,
  finalizedByName: _finalizedByName,
}: {
  report: SurveyReport;
  finalizedByName?: string | null;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        bottom: "25mm",
        right: "15mm",
        width: "45mm",
        transform: "rotate(-12deg)",
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/stamp.png"
        alt=""
        style={{
          width: "45mm",
          height: "45mm",
          objectFit: "contain",
          opacity: 0.85,
        }}
      />
    </div>
  );
}

function conditionMeta(item: ReportItem | undefined): string {
  if (!item) return "";
  const parts: string[] = [];

  if (item.condition === "new") parts.push("አዲስ / New");
  else if (item.condition === "used") parts.push("ያገለገለ / Used");

  if (item.origin === "genuine") parts.push("ኦሪጅናል / Genuine");
  else if (item.origin === "local") parts.push("ሎካል / Local");

  return parts.join("  ·  ");
}

function PrintField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex h-[5.8mm] items-end gap-2">
      <b className="whitespace-nowrap">{label}</b>
      <i className="min-h-[4mm] flex-1 border-b-[.3mm] border-black px-1 not-italic">
        {value ?? ""}
      </i>
    </div>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex h-[4.6mm] w-[9mm] items-center justify-center border-[.3mm] border-black">
      {checked && (
        <svg
          viewBox="0 0 16 16"
          className="h-[4mm] w-[4mm]"
          fill="none"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8.5 6.5 12 13 4" />
        </svg>
      )}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-[.3mm] border-black bg-[#f3f3f3] text-[10pt] font-bold">
      {children}
    </th>
  );
}