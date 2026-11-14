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

const S = StyleSheet.create({
  page: {
<<<<<<< HEAD
    // Clears the header
    paddingTop: "76mm",
    // Allows table to flow further
    paddingBottom: "25mm",
=======
    // Leave room at the top for the absolute header
    paddingTop: "65mm",
    // Leave room at the bottom so content doesn't get cut off by the stamp or page end
    paddingBottom: "45mm",
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    paddingHorizontal: "11mm",
    fontSize: 9,
    fontFamily: "Ethiopic",
    position: "relative",
  },
  headerWrap: {
    position: "absolute",
    top: "9mm",
    left: "11mm",
    right: "11mm",
  },
  logo: {
    height: "22mm",
    alignSelf: "center",
    objectFit: "contain",
    marginBottom: "1.5mm",
  },
  title: {
    fontSize: 15,
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
    fontSize: 10.5,
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
    fontSize: 10,
  },
  line: {
    flex: 1,
    borderBottomWidth: 0.4,
    borderBottomColor: "#000",
    minHeight: "4mm",
    fontSize: 9.5,
<<<<<<< HEAD
=======
  },
  tableWrapper: {
    position: "relative",
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
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
    padding: 5,
    fontSize: 11,
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
<<<<<<< HEAD
=======
    minHeight: "6.8mm",
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
  },
  tdNo: {
    width: "10mm",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.3,
    borderColor: "#000",
    paddingVertical: "1mm",
  },
  tdNoMid: {
    width: "10mm",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.3,
    borderColor: "#000",
    paddingVertical: "1mm",
  },
  tdPart: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "1mm",
<<<<<<< HEAD
    paddingVertical: "1.5mm",
=======
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
  },
  tdPartBordered: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "1mm",
<<<<<<< HEAD
    paddingVertical: "1.5mm",
=======
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    borderRightWidth: 0.3,
    borderColor: "#000",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  tdAm: {
<<<<<<< HEAD
    fontSize: 9.5,
=======
    fontSize: 11,
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    fontWeight: 700,
    marginRight: 3,
    lineHeight: 1.1,
  },
  tdEn: {
<<<<<<< HEAD
    fontSize: 8,
=======
    fontSize: 9,
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    color: "#000",
    fontWeight: 700,
    paddingBottom: 0.8,
    lineHeight: 1.1,
  },
  tdRemark: {
<<<<<<< HEAD
    fontSize: 7,
    color: "#000",
    marginTop: 0.5,
    lineHeight: 1.1,
=======
    fontSize: 7.5,
    color: "#000",
    marginTop: 0.5,
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
  },
  tdMeta: {
    fontSize: 7,
    color: "#444",
    marginTop: 0.5,
    letterSpacing: 0.2,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  notes: {
<<<<<<< HEAD
    marginTop: "10mm",
    fontSize: 9,
    lineHeight: 1.3,
    paddingRight: "45mm", 
  },
  notesTtl: {
    fontSize: 10,
=======
    marginTop: "8mm",
    fontSize: 9.5,
    lineHeight: 1.4,
    paddingRight: "55mm",
  },
  notesTtl: {
    fontSize: 10.5,
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    fontWeight: 700,
    textDecoration: "underline",
    marginBottom: "1.5mm",
  },
  noteItem: {
    flexDirection: "row",
    marginBottom: "1mm",
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
<<<<<<< HEAD
    // FIX: Moved down from 12mm to 4mm so it sits at the very bottom and doesn't cover text
    bottom: "4mm",
    right: "12mm",
    width: "38mm",
    height: "38mm",
=======
    bottom: "10mm",
    right: "5mm",
    width: "50mm",
    height: "50mm",
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    transform: "rotate(-12deg)",
    opacity: 0.85,
    zIndex: 10,
  },
  stampImage: {
<<<<<<< HEAD
    width: "38mm",
    height: "38mm",
=======
    width: "50mm",
    height: "50mm",
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
    objectFit: "contain",
  },
});

export function SurveyReportPdf({
  locale: _locale,
  messages,
  report,
  branchName,
  items,
  finalizedByName,
}: {
  locale: string;
  messages: Messages;
  report: SurveyReport;
  branchName?: string | null;
  items: ReportItem[];
  finalizedByName?: string | null;
}) {
  const replaces = items.filter((i) => i.action === "replace");
  const repairs = items.filter((i) => i.action === "repair");
  
  // Total number of rows is the maximum length between the two lists
  const totalItems = Math.max(replaces.length, repairs.length);
  
<<<<<<< HEAD
  // Dynamically create rows to allow React-PDF to handle native pagination
=======
  // Create an array to map over. React-PDF handles the automatic page breaks
  // because of `wrap={false}` on each row.
>>>>>>> a7746c1566c3599277a1d773bbf41a6226403684
  const rows = Array.from({ length: Math.max(1, totalItems) }).map((_, i) => i);

  const recNums = replaces
    .map((x, i) => (x.isRecovery ? i + 1 : null))
    .filter(Boolean)
    .join(", ");

  const isFull = report.coverage === "comprehensive";
  const isThird = report.coverage === "third_party";
  const isFinalized = report.status === "finalized";

  return (
    <Document title={report.reportNo ?? "Draft"} author="Awash Insurance">
      <Page size="A4" style={S.page}>
        {/* 1. Header (Fixed on every page) */}
        <View fixed style={S.headerWrap}>
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
              <Field label="የተሠራበት ዓ.ም" value={report.manufactureYear?.toString() ?? ""} />
            </View>
            <View style={S.col}>
              <Field label="ቀን" value={report.reportDate} />
              <Field label="ቅርንጫፍ" value={branchName || String(report.branchId)} />
              <Field label="የሞተር ቁጥር" value={report.engineNo} />
              <Field label="የሻንሲ ቁጥር" value={report.chassisNo} />
              <Field label="ሞዴል" value={report.model} />
            </View>
          </View>
        </View>

        {/* 2. Table */}
        <View style={S.table}>
          <View style={S.thead} fixed>
            <Text style={[S.th, S.thNo]}>ተ.ቁ</Text>
            <Text style={[S.th, S.thPartBordered]}>የሚለወጡ እቃዎች ዝርዝር</Text>
            <Text style={[S.th, S.thNo]}>ተ.ቁ</Text>
            <Text style={[S.th, S.thPart]}>የሚስተካከሉ እቃዎች ዝርዝር</Text>
          </View>

          {rows.map((i) => {
            const a = replaces[i];
            const b = repairs[i];
            const aMeta = conditionMeta(a);
            const bMeta = conditionMeta(b);
            return (
              <View key={i} style={S.tbodyRow} wrap={false}>
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
                      {a.remark && <Text style={S.tdRemark}>{a.remark}</Text>}
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
                      {b.remark && <Text style={S.tdRemark}>{b.remark}</Text>}
                      {bMeta ? <Text style={S.tdMeta}>{bMeta}</Text> : null}
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Notice (Last page only) */}
        <View style={S.notes} wrap={false}>
          <Text style={S.notesTtl}>ማሳሰቢያ</Text>
          <Note n={1}>{messages.notes.n1}</Note>
          <Note n={2}>{messages.notes.n2}</Note>
          <Note n={3}>{messages.notes.n3}</Note>
          <View style={S.noteItem}>
            <Text style={S.noteNum}>4.</Text>
            <Text style={S.noteBody}>
              {messages.notes.n4Prefix}{" "}
              <Text style={{ textDecoration: "underline" }}>
                {recNums || " ".repeat(30)}
              </Text>{" "}
              {messages.notes.n4Suffix}
            </Text>
          </View>
          <Note n={5}>{messages.notes.n5}</Note>
        </View>

        {/* 4. Stamp (Fixed on every page) */}
        {isFinalized && (
          <View fixed style={S.stampWrap}>
            <Image src={STAMP_DATA_URL} style={S.stampImage} />
          </View>
        )}

        <Text
          style={S.pageNo}
          fixed
          render={({ pageNumber, totalPages }) => `ገጽ ${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
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
