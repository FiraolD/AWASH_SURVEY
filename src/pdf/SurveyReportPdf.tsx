import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Svg,
  Path,
} from "@react-pdf/renderer";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Messages } from "@/lib/i18n";
import type { ReportItem, SurveyReport } from "~db/schema";

const FONT_REGULAR = join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSansEthiopic-Regular.ttf",
);
const FONT_BOLD = join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSansEthiopic-Bold.ttf",
);

if (!existsSync(FONT_REGULAR)) {
  throw new Error(
    `Ethiopic font missing at ${FONT_REGULAR}. ` +
      `Download NotoSansEthiopic-Regular.ttf into public/fonts/.`,
  );
}

const FONT_KEY = "__awash_ethiopic_font_registered__";
if (!(globalThis as any)[FONT_KEY]) {
  Font.register({
    family: "Ethiopic",
    fonts: [
      { src: FONT_REGULAR, fontWeight: 400 },
      ...(existsSync(FONT_BOLD)
        ? [{ src: FONT_BOLD, fontWeight: 700 as const }]
        : []),
    ],
  });
  (globalThis as any)[FONT_KEY] = true;
}

const LOGO_KEY = "__awash_logo_data_url__";
const STAMP_KEY = "__awash_stamp_data_url__";

function loadImageAsDataUrl(candidates: string[]): string | null {
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const buf = readFileSync(path);
      if (buf.length < 4) continue;
      const isPng =
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
      if (!isPng && !isJpeg) continue;
      const mime = isPng ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      // try next
    }
  }
  return null;
}

const LOGO_DATA_URL: string | null =
  (globalThis as any)[LOGO_KEY] ??
  ((globalThis as any)[LOGO_KEY] = loadImageAsDataUrl([
    join(process.cwd(), "public", "logo.jpg"),
    join(process.cwd(), "public", "logo.jpeg"),
    join(process.cwd(), "public", "logo.png"),
  ]));

const STAMP_DATA_URL: string | null =
  (globalThis as any)[STAMP_KEY] ??
  ((globalThis as any)[STAMP_KEY] = loadImageAsDataUrl([
    join(process.cwd(), "public", "stamp.png"),
  ]));

const ROWS = 22;

const S = StyleSheet.create({
  page: {
    paddingTop: "9mm",
    paddingBottom: "8mm",
    paddingHorizontal: "11mm",
    fontSize: 9,
    fontFamily: "Ethiopic",
    position: "relative",
  },
  logo: {
    height: "22mm",
    alignSelf: "center",
    objectFit: "contain",
    marginBottom: "1.5mm",
  },
  title: {
    fontSize: 13.5,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: "2mm",
  },
  head: {
    flexDirection: "row",
    marginBottom: "2mm",
  },
  col: {
    flex: 1,
    paddingRight: "5mm",
  },
  covRow: {
    flexDirection: "row",
    alignItems: "center",
    height: "5.8mm",
    marginBottom: "1mm",
  },
  covItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "4mm",
  },
  covLabel: {
    fontWeight: 700,
    fontSize: 9.5,
    marginRight: "1.5mm",
  },
  box: {
    width: "9mm",
    height: "4.6mm",
    borderWidth: 0.5,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: "4mm",
    height: "4mm",
  },
  field: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "5.8mm",
  },
  label: {
    fontWeight: 700,
    paddingRight: "2mm",
  },
  line: {
    flex: 1,
    borderBottomWidth: 0.4,
    borderBottomColor: "#000",
    minHeight: "4mm",
    fontSize: 8.5,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#000",
    flexDirection: "column",
  },
  thead: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    backgroundColor: "#f3f3f3",
  },
  th: {
    padding: 4,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  thNo: {
    width: "10mm",
    borderRightWidth: 0.4,
    borderColor: "#000",
  },
  thPart: {
    flex: 1,
  },
  thPartBordered: {
    flex: 1,
    borderRightWidth: 0.4,
    borderColor: "#000",
  },
  tbodyRow: {
    flexDirection: "row",
    borderBottomWidth: 0.3,
    borderColor: "#000",
    minHeight: "7.05mm",
  },
  tdNo: {
    width: "10mm",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.3,
    borderColor: "#000",
  },
  tdNoMid: {
    width: "10mm",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.3,
    borderColor: "#000",
  },
  tdPart: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "1.5mm",
  },
  tdPartBordered: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "1.5mm",
    borderRightWidth: 0.3,
    borderColor: "#000",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  tdAm: {
    fontSize: 10,
    fontWeight: 700,
    marginRight: 4,
  },
  tdEn: {
    fontSize: 8.5,
    color: "#444",
    paddingBottom: 0.8,
  },
  tdRemark: {
    fontSize: 6.5,
    color: "#555",
    // fontStyle: "italic", <-- REMOVED to prevent the font fallback error
    marginTop: 1,
  },
  tdMeta: {
    fontSize: 6.5,
    color: "#666",
    marginTop: 1,
    letterSpacing: 0.2,
    fontWeight: 700,
  },
  notes: {
    marginTop: "3mm",
    fontSize: 8.6,
    lineHeight: 1.35,
  },
  notesTtl: {
    fontSize: 9.5,
    fontWeight: 700,
    textDecoration: "underline",
    marginBottom: "1mm",
  },
  noteItem: {
    flexDirection: "row",
    marginBottom: "0.6mm",
  },
  noteNum: {
    width: "4mm",
    fontFamily: "Helvetica",
  },
  noteBody: {
    flex: 1,
  },
  pageNo: {
    position: "absolute",
    bottom: "4mm",
    right: "11mm",
    fontSize: 8,
    color: "#444",
  },
  stampWrap: {
    position: "absolute",
    bottom: "25mm",
    right: "15mm",
    width: "45mm",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-12deg)",
  },
  stampImage: {
    width: "45mm",
    height: "45mm",
    objectFit: "contain",
    opacity: 0.85,
  },
});

export function SurveyReportPdf({
  locale: _locale,
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
    <Document title={report.reportNo ?? "Draft"} author="Awash Insurance">
      {Array.from({ length: pages }).map((_, p) => {
        const isLast = p === pages - 1;
        return (
          <Page key={p} size="A4" style={S.page}>
            {isFinalized && (
              <Stamp report={report} finalizedByName={finalizedByName} />
            )}

            {LOGO_DATA_URL && <Image src={LOGO_DATA_URL} style={S.logo} />}

            <Text style={S.title}>
              በአደጋ የተጎዱ ተሽከርካሪዎች የአካል ጉዳት ዝርዝር መግለጫ
            </Text>

            <View style={S.head}>
              <View style={S.col}>
                <View style={S.covRow}>
                  <View style={S.covItem}>
                    <Text style={S.covLabel}>ሙሉ ኢንሹራንስ</Text>
                    <Box checked={isFull} />
                  </View>
                  <View style={[S.covItem, { marginRight: 0 }]}>
                    <Text style={S.covLabel}>ሦስተኛ ወገን</Text>
                    <Box checked={isThird} />
                  </View>
                </View>
                <Field label="የተሽከርካሪ ዓይነት" value={report.vehicleType} />
                <Field label="የሠሌዳ ቁጥር" value={report.plateNo} />
                <Field
                  label="የተሠራበት ዓ.ም"
                  value={report.manufactureYear?.toString() ?? ""}
                />
              </View>
              <View style={S.col}>
                <Field label="ቀን" value={report.reportDate} />
                <Field label="ቅርንጫፍ" value={String(report.branchId)} />
                <Field label="የሞተር ቁጥር" value={report.engineNo} />
                <Field label="የሻንሲ ቁጥር" value={report.chassisNo} />
                <Field label="ሞዴል" value={report.model} />
              </View>
            </View>

            <View style={S.table}>
              <View style={S.thead}>
                <Text style={[S.th, S.thNo]}>ተ.ቁ</Text>
                <Text style={[S.th, S.thPartBordered]}>
                  የሚለወጡ እቃዎች ዝርዝር
                </Text>
                <Text style={[S.th, S.thNo]}>ተ.ቁ</Text>
                <Text style={[S.th, S.thPart]}>
                  የሚስተካከሉ እቃዎች ዝርዝር
                </Text>
              </View>

              {Array.from({ length: ROWS }).map((_, r) => {
                const i = p * ROWS + r;
                const a = replaces[i];
                const b = repairs[i];
                const aMeta = conditionMeta(a);
                const bMeta = conditionMeta(b);
                return (
                  <View key={r} style={S.tbodyRow} wrap={false}>
                    <View style={S.tdNo}>
                      <Text>{a ? i + 1 : ""}</Text>
                    </View>
                    <View style={S.tdPartBordered}>
                      {a && (
                        <>
                          <View style={S.nameRow}>
                            <Text style={S.tdAm}>{a.names.am}</Text>
                            <Text style={S.tdEn}> / {a.names.en}</Text>
                          </View>
                          {a.remark && (
                            <Text style={S.tdRemark}>{a.remark}</Text>
                          )}
                          {aMeta ? <Text style={S.tdMeta}>{aMeta}</Text> : null}
                        </>
                      )}
                    </View>
                    <View style={S.tdNoMid}>
                      <Text>{b ? i + 1 : ""}</Text>
                    </View>
                    <View style={S.tdPart}>
                      {b && (
                        <>
                          <View style={S.nameRow}>
                            <Text style={S.tdAm}>{b.names.am}</Text>
                            <Text style={S.tdEn}> / {b.names.en}</Text>
                          </View>
                          {b.remark && (
                            <Text style={S.tdRemark}>{b.remark}</Text>
                          )}
                          {bMeta ? <Text style={S.tdMeta}>{bMeta}</Text> : null}
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {isLast && (
              <View style={S.notes} wrap={false}>
                <Text style={S.notesTtl}>ማሳሰቢያ</Text>
                <Note n={1}>{messages.notes.n1}</Note>
                <Note n={2}>{messages.notes.n2}</Note>
                <Note n={3}>{messages.notes.n3}</Note>
                <View style={S.noteItem}>
                  <Text style={S.noteNum}>4.</Text>
                  <Text style={S.noteBody}>
                    በተራ ቁጥር{" "}
                    <Text style={{ textDecoration: "underline" }}>
                      {recNums || " ".repeat(30)}
                    </Text>{" "}
                    ዕቃዎች ለኩባንያ ሪከቨሪ ይመለሳል።
                  </Text>
                </View>
                <Note n={5}>{messages.notes.n5}</Note>
              </View>
            )}

            {pages > 1 && (
              <Text style={S.pageNo}>
                ገጽ {p + 1} / {pages}
              </Text>
            )}
          </Page>
        );
      })}
    </Document>
  );
}

function Stamp({
  report: _report,
  finalizedByName: _finalizedByName,
}: {
  report: SurveyReport;
  finalizedByName?: string | null;
}) {
  if (!STAMP_DATA_URL) return null;
  return (
    <View style={S.stampWrap} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={STAMP_DATA_URL} style={S.stampImage} />
    </View>
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

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={S.field}>
      <Text style={S.label}>{label}</Text>
      <Text style={S.line}>{value ?? ""}</Text>
    </View>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <View style={S.box}>
      {checked && (
        <Svg viewBox="0 0 16 16" style={S.check}>
          <Path
            d="M3 8.5 L6.5 12 L13 4"
            stroke="#000"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

function Note({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={S.noteItem}>
      <Text style={S.noteNum}>{n}.</Text>
      <Text style={S.noteBody}>{children}</Text>
    </View>
  );
}