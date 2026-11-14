// Turns a raw audit_log row into a sentence a person can read (English / Amharic).
import { formatDate, formatDateTime } from "./format";

export type AuditCtx = {
  reportId?: string;
  reportNo?: string | null;
  plateNo?: string | null;
  partName?: string | null;
};

export type AuditRowLike = {
  entity: string;
  action: string;
  entity_id: string;
  changes: unknown;
  diff: Record<string, { from: unknown; to: unknown }> | null;
  ctx?: AuditCtx;
};

const T = (locale: string) => (am: string, en: string) => (locale === "am" ? am : en);

const LABELS: Record<string, [string, string]> = {
  plate_no: ["የሠሌዳ ቁጥር", "Plate no."],
  chassis_no: ["የሻንሲ ቁጥር", "Chassis no."],
  engine_no: ["የሞተር ቁጥር", "Engine no."],
  vehicle_type: ["የተሽከርካሪ ዓይነት", "Vehicle type"],
  model: ["ሞዴል", "Model"],
  manufacture_year: ["የተሠራበት ዓ.ም", "Year of manufacture"],
  coverage: ["የሽፋን ዓይነት", "Coverage"],
  report_date: ["ቀን", "Date"],
  branch_id: ["ቅርንጫፍ", "Branch"],
  remarks: ["አስተያየት", "Remarks"],
  claim_ref: ["የክሌም ቁጥር", "Claim ref."],
  print_lang: ["የህትመት ቋንቋ", "Print language"],
  status: ["ሁኔታ", "Status"],
  void_reason: ["የመሰረዝ ምክንያት", "Void reason"],
  report_no: ["የሪፖርት ቁጥር", "Report no."],
  condition: ["የእቃው ሁኔታ", "Condition"],
  origin: ["ምንጭ", "Origin"],
  is_recovery: ["ቅሪት", "Salvage"],
  quantity: ["ብዛት", "Quantity"],
  remark: ["መግለጫ", "Remark"],
  action: ["ዝርዝር", "List"],
  full_name: ["ሙሉ ስም", "Full name"],
  username: ["የተጠቃሚ ስም", "Username"],
  email: ["ኢሜይል", "Email"],
  phone: ["ስልክ", "Phone"],
  role: ["ሚና", "Role"],
  is_active: ["ንቁ", "Active"],
  preferred_lang: ["ተመራጭ ቋንቋ", "Preferred language"],
  must_change_password: ["የይለፍ ቃል ለውጥ ግዴታ", "Must change password"],
  password_changed: ["የይለፍ ቃል", "Password"],
  last_login_at: ["የመጨረሻ መግቢያ", "Last login"],
  code: ["ኮድ", "Code"],
  names: ["ስሞች", "Names"],
  name: ["ስም", "Name"],
  lang: ["ቋንቋ", "Language"],
  usage_count: ["የአጠቃቀም ብዛት", "Usage count"],
  source: ["ምንጭ", "Source"],
  position: ["ቦታ", "Position"],
  finalized_at: ["የተጠናቀቀበት ጊዜ", "Finalized at"],
  finalized_by: ["ያጠናቀቀው", "Finalized by"],
};

/** Fields that change as a side effect and say nothing useful in a sentence. */
const NOISE = new Set(["updated_at", "created_at", "position", "search_text", "finalized_at", "finalized_by", "last_login_at", "password_changed", "usage_count"]);

export function fieldLabel(key: string, locale: string): string {
  const l = LABELS[key];
  return l ? (locale === "am" ? l[0] : l[1]) : key;
}

const VALUES: Record<string, Record<string, [string, string]>> = {
  condition: { new: ["አዲስ", "New"], used: ["ያገለገለ", "Used"] },
  origin: { genuine: ["ኦሪጅናል", "Genuine"], local: ["ሎካል", "Local"] },
  coverage: { comprehensive: ["ሙሉ ኢንሹራንስ", "Comprehensive"], third_party: ["ሦስተኛ ወገን", "Third party"] },
  status: { draft: ["ረቂቅ", "Draft"], finalized: ["የተጠናቀቀ", "Finalized"], void: ["የተሰረዘ", "Void"] },
  action: { replace: ["የሚለወጡ", "Replace"], repair: ["የሚስተካከሉ", "Repair"] },
  role: { admin: ["አስተዳዳሪ", "Admin"], supervisor: ["ተቆጣጣሪ", "Supervisor"], surveyor: ["ሰርቬየር", "Surveyor"] },
};

export function fmtValue(key: string, v: unknown, locale: string): string {
  const tr = T(locale);
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? tr("አዎ", "Yes") : tr("አይደለም", "No");
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  const m = VALUES[key]?.[s];
  if (m) return tr(m[0], m[1]);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return formatDateTime(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDate(s);
  return s.length > 100 ? s.slice(0, 100) + "…" : s;
}

const LANG_NAME: Record<string, [string, string]> = {
  en: ["እንግሊዝኛ", "English"],
  am: ["አማርኛ", "Amharic"],
  om: ["ኦሮምኛ", "Afaan Oromo"],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function describeAudit(r: AuditRowLike, locale: string): { text: string; reportId?: string; reportNo?: string | null } {
  const tr = T(locale);
  const a = r.action;
  const d = r.diff ?? {};
  const c = (r.changes ?? {}) as any;
  const rec: any = (a === "UPDATE" ? c?.new : c) ?? {}; // the row after the change (or the deleted row)
  const changed = Object.keys(d).filter((k) => !NOISE.has(k));
  const labels = (keys: string[]) => keys.map((k) => fieldLabel(k, locale)).join(", ");
  const q = (s: string) => `“${s}”`;
  const nameOf = (names: any) => {
    if (!names) return "";
    const pref = locale === "am" ? [names.am, names.en] : [names.en, names.am];
    return String(pref.find(Boolean) ?? Object.values(names)[0] ?? "");
  };
  const val = (k: string, v: unknown) => fmtValue(k, v, locale);

  switch (r.entity) {
    case "survey_reports": {
      const reportNo = r.ctx?.reportNo ?? rec.report_no ?? null;
      const base = { reportId: r.ctx?.reportId ?? r.entity_id, reportNo };
      if (a === "INSERT") return { ...base, text: tr("አዲስ ረቂቅ ሪፖርት ፈጠረ", "created a new draft report") };
      if (a === "DELETE") return { ...base, text: tr("ረቂቅ ሪፖርት ሰረዘ", "discarded a draft report") };
      if (a === "UPDATE") {
        const st = d.status;
        if (st) {
          if (st.to === "finalized") return { ...base, text: tr("ሪፖርቱን አጠናቀቀ", "finalized the report") };
          if (st.from === "finalized" && st.to === "draft") return { ...base, text: tr("ሪፖርቱን እንደገና ከፈተ", "reopened the report") };
          if (st.to === "void") {
            const why = d.void_reason?.to ? ` — ${String(d.void_reason.to)}` : "";
            return { ...base, text: tr("ሪፖርቱን ሰረዘ", "voided the report") + why };
          }
          return { ...base, text: tr(`ሁኔታውን ቀየረ (${val("status", st.from)} → ${val("status", st.to)})`, `changed the status (${val("status", st.from)} → ${val("status", st.to)})`) };
        }
        return changed.length
          ? { ...base, text: tr(`የሪፖርቱን መረጃ አስተካከለ (${labels(changed)})`, `edited the report details (${labels(changed)})`) }
          : { ...base, text: tr("ሪፖርቱን አስቀመጠ", "saved the report") };
      }
      break;
    }

    case "report_items": {
      const reportId = r.ctx?.reportId;
      const reportNo = r.ctx?.reportNo ?? null;
      const name = q(nameOf(rec.names));
      const list = val("action", rec.action);
      if (a === "INSERT") return { reportId, reportNo, text: tr(`${name} ጨመረ (${list})`, `added ${name} (${list} list)`) };
      if (a === "DELETE") return { reportId, reportNo, text: tr(`${name} አስወገደ (${list})`, `removed ${name} (${list} list)`) };
      if (a === "UPDATE") {
        if (d.action) return { reportId, reportNo, text: tr(`${name} ከ${val("action", d.action.from)} ወደ ${val("action", d.action.to)} አዛወረ`, `moved ${name} from ${val("action", d.action.from)} to ${val("action", d.action.to)}`) };
        if (changed.length === 0) return { reportId, reportNo, text: tr("የእቃዎችን ቅደም ተከተል ቀየረ", "reordered the parts list") };
        const bits = changed.slice(0, 3).map((k) => `${fieldLabel(k, locale)}: ${val(k, d[k].from)} → ${val(k, d[k].to)}`);
        return { reportId, reportNo, text: tr(`${name} ዝርዝር ቀየረ — ${bits.join("; ")}`, `changed ${name} — ${bits.join("; ")}`) };
      }
      break;
    }

    case "parts": {
      const nm = r.ctx?.partName ? " " + q(r.ctx.partName) : "";
      if (a === "INSERT") return { text: tr(`አዲስ እቃ ወደ ዝርዝሩ ጨመረ${nm}`, `added a new part to the catalogue${nm}`) };
      if (a === "DELETE") return { text: tr(`እቃ ሰረዘ${nm}`, `deleted a part${nm}`) };
      if (d.is_active) return { text: d.is_active.to ? tr(`እቃውን አነቃ${nm}`, `activated the part${nm}`) : tr(`እቃውን አቆመ${nm}`, `deactivated the part${nm}`) };
      if (changed.length) return { text: tr(`እቃውን አስተካከለ${nm} (${labels(changed)})`, `edited the part${nm} (${labels(changed)})`) };
      return { text: tr("የእቃ አጠቃቀም ቆጠራ ተሻሻለ", "updated a part's usage count") };
    }

    case "part_translations": {
      const lang = LANG_NAME[rec.lang] ? tr(LANG_NAME[rec.lang][0], LANG_NAME[rec.lang][1]) : String(rec.lang ?? "");
      if (a === "DELETE") return { text: tr(`${lang} ስም አስወገደ ${q(String(rec.name ?? ""))}`, `removed the ${lang} name ${q(String(rec.name ?? ""))}`) };
      return { text: tr(`የ${lang} ስም ወደ ${q(String(rec.name ?? ""))} አደረገ`, `set the ${lang} name to ${q(String(rec.name ?? ""))}`) };
    }

    case "users": {
      const who = q(String(rec.full_name ?? ""));
      if (a === "INSERT") return { text: tr(`ተጠቃሚ ፈጠረ ${who} (${val("role", rec.role)})`, `created user ${who} (${val("role", rec.role)})`) };
      if (a === "DELETE") return { text: tr(`ተጠቃሚ ሰረዘ ${who}`, `deleted user ${who}`) };
      if (d.password_changed)
        return { text: d.must_change_password?.to === true ? tr(`የ${who} የይለፍ ቃል ዳግም አስጀመረ`, `reset the password of ${who}`) : tr(`የ${who} የይለፍ ቃል ቀየረ`, `changed the password of ${who}`) };
      if (d.is_active) return { text: d.is_active.to ? tr(`ተጠቃሚ አነቃ ${who}`, `activated user ${who}`) : tr(`ተጠቃሚ አቆመ ${who}`, `deactivated user ${who}`) };
      if (d.role) return { text: tr(`የ${who} ሚና ቀየረ (${val("role", d.role.from)} → ${val("role", d.role.to)})`, `changed the role of ${who} (${val("role", d.role.from)} → ${val("role", d.role.to)})`) };
      if (changed.length) return { text: tr(`ተጠቃሚ አስተካከለ ${who} (${labels(changed)})`, `edited user ${who} (${labels(changed)})`) };
      if (d.last_login_at) return { text: tr(`${who} ገባ`, `${who} signed in`) };
      return { text: tr(`ተጠቃሚ አዘመነ ${who}`, `updated user ${who}`) };
    }

    case "branches": {
      const code = String(rec.code ?? "");
      if (a === "INSERT") return { text: tr(`ቅርንጫፍ ፈጠረ ${code}`, `created branch ${code}`) };
      return { text: tr(`ቅርንጫፍ አስተካከለ ${code}`, `edited branch ${code}`) };
    }

    case "sql_console": {
      const sqlText = d.sql?.to ? ": " + String(d.sql.to).replace(/\s+/g, " ").slice(0, 80) : "";
      return { text: (a === "EXECUTE_FAILED" ? tr("ያልተሳካ SQL ጥያቄ አስኬደ", "ran an SQL query that failed") : tr("SQL ጥያቄ አስኬደ", "ran an SQL query")) + sqlText };
    }

    case "sql_migration":
      return { text: a === "FAILED" ? tr(`ማይግሬሽን አልተሳካም ${r.entity_id}`, `migration failed ${r.entity_id}`) : tr(`ማይግሬሽን ተጠቀመ ${r.entity_id}`, `applied migration ${r.entity_id}`) };
  }
  return { text: `${a.toLowerCase()} ${r.entity}` };
}
