"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { describeAudit, fieldLabel, fmtValue, type AuditCtx } from "@/lib/audit-describe";
import { formatDateTime } from "@/lib/format";

type Row = {
  id: number;
  at: string;
  actor_id: string | null;
  actor_email: string | null;
  entity: string;
  entity_id: string;
  action: string;
  changes: unknown;
  diff: Record<string, { from: unknown; to: unknown }> | null;
  row_pk: Record<string, string> | null;
  ctx?: AuditCtx;
};

export function AuditLogTable({ rows, locale }: { rows: Row[]; locale: string }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const tr = (am: string, en: string) => (locale === "am" ? am : en);

  const toggle = (id: number) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const badge = (action: string): [string, string] => {
    switch (action) {
      case "INSERT": return [tr("ተፈጠረ", "Created"), "bg-[color:var(--success-2)] text-[color:var(--success)]"];
      case "UPDATE": return [tr("ተስተካክሏል", "Updated"), "bg-[color:var(--acc-2)] text-[color:var(--acc)]"];
      case "DELETE": return [tr("ተሰርዟል", "Deleted"), "bg-[color:var(--rep-2)] text-[color:var(--rep)]"];
      case "EXECUTE": return [tr("ተፈጽሟል", "Executed"), "bg-[color:var(--warn-2)] text-[color:var(--warn)]"];
      case "APPLIED": return [tr("ተጠቅሟል", "Applied"), "bg-[color:var(--success-2)] text-[color:var(--success)]"];
      case "EXECUTE_FAILED":
      case "FAILED": return [tr("አልተሳካም", "Failed"), "bg-[color:var(--rep-2)] text-[color:var(--rep)]"];
      default: return [action, "bg-[color:var(--bg)] text-[color:var(--mut)]"];
    }
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white px-4 py-12 text-center text-[color:var(--mut)] shadow-[var(--shadow-sm)]">
        {tr("ምንም የኦዲት መዝገብ የለም", "No audit entries")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
      <div className="hidden bg-[color:var(--bg)] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[color:var(--mut)] md:grid md:grid-cols-[9.5rem_13rem_1fr_4.5rem] md:gap-4">
        <div>{tr("ጊዜ", "When")}</div>
        <div>{tr("ተጠቃሚ", "Who")}</div>
        <div>{tr("ምን ተደረገ", "What happened")}</div>
        <div />
      </div>

      {rows.map((r) => {
        const isOpen = open.has(r.id);
        const { text, reportId, reportNo } = describeAudit(r, locale);
        const [label, style] = badge(r.action);
        const diffKeys = r.diff ? Object.keys(r.diff).filter((k) => k !== "updated_at") : [];

        return (
          <div key={r.id} className="border-t border-[color:var(--line)] px-4 py-3 first:border-t-0 hover:bg-[color:var(--bg)]/40">
            <div className="grid gap-1 md:grid-cols-[9.5rem_13rem_1fr_4.5rem] md:items-start md:gap-4">
              <div className="text-xs tabular-nums text-[color:var(--mut)]">{formatDateTime(r.at)}</div>
              <div className="min-w-0 truncate text-sm font-medium">{r.actor_email ?? tr("ሲስተም", "System")}</div>
              <div className="min-w-0 text-sm">
                <span className={"mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium " + style}>{label}</span>
                <span className="break-words">{text}</span>
                {reportNo && (
                  <>
                    {" "}
                    {reportId ? (
                      <Link
                        href={`/${locale}/reports/${reportId}`}
                        className="whitespace-nowrap rounded-md bg-[color:var(--acc-2)] px-1.5 py-0.5 font-mono text-xs font-medium text-[color:var(--acc)] hover:underline"
                      >
                        {reportNo}
                      </Link>
                    ) : (
                      <span className="whitespace-nowrap rounded-md bg-[color:var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[color:var(--mut)]">{reportNo}</span>
                    )}
                  </>
                )}
              </div>
              <div className="md:text-right">
                <Button variant="ghost" size="xs" onClick={() => toggle(r.id)} aria-expanded={isOpen}>
                  {isOpen ? "▲" : "▼"} {tr("ዝርዝር", "Details")}
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 rounded-[var(--r)] bg-[color:var(--bg)] p-3">
                {r.action === "UPDATE" && r.diff && diffKeys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase text-[color:var(--mut)]">
                          <th className="w-40 pb-1">{tr("መስክ", "Field")}</th>
                          <th className="pb-1">{tr("ከ", "From")}</th>
                          <th className="pb-1">{tr("ወደ", "To")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffKeys.map((k) => (
                          <tr key={k} className="border-t border-[color:var(--line)]">
                            <td className="py-1.5 pr-3 font-medium">{fieldLabel(k, locale)}</td>
                            <td className="py-1.5 pr-3 text-[color:var(--rep)]">{fmtValue(k, r.diff![k].from, locale)}</td>
                            <td className="py-1.5 text-[color:var(--success)]">{fmtValue(k, r.diff![k].to, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="max-h-64 overflow-auto rounded bg-white p-3 font-mono text-[11px] leading-snug">
                    {JSON.stringify(r.changes ?? {}, null, 2)}
                  </pre>
                )}
                <p className="mt-2 font-mono text-[10px] text-[color:var(--mut)]">
                  {r.entity} · {r.entity_id}
                  {r.actor_id ? ` · ${r.actor_id.slice(0, 8)}…` : ""}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
