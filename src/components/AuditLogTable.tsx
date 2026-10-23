"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/Button";

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
};

export function AuditLogTable({
  rows,
  locale,
}: {
  rows: Row[];
  locale: string;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const tr = (am: string, en: string) => (locale === "am" ? am : en);

  const toggle = (id: number) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const actionStyle: Record<string, string> = {
    INSERT: "bg-[color:var(--success-2)] text-[color:var(--success)]",
    UPDATE: "bg-[color:var(--acc-2)] text-[color:var(--acc)]",
    DELETE: "bg-[color:var(--rep-2)] text-[color:var(--rep)]",
  };

  const actionLabel: Record<string, string> = {
    INSERT: tr("ተፈጠረ", "Created"),
    UPDATE: tr("ተስተካክሏል", "Updated"),
    DELETE: tr("ተሰርዟል", "Deleted"),
  };

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--bg)] text-left text-xs uppercase tracking-wide text-[color:var(--mut)]">
          <tr>
            <th className="px-4 py-3">{tr("ጊዜ", "When")}</th>
            <th className="px-4 py-3">{tr("ተጠቃሚ", "Who")}</th>
            <th className="px-4 py-3">{tr("እርምጃ", "Action")}</th>
            <th className="px-4 py-3">{tr("አካል", "Entity")}</th>
            <th className="w-16 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-[color:var(--mut)]"
              >
                {tr("ምንም የኦዲት መዝገብ የለም", "No audit entries")}
              </td>
            </tr>
          )}

          {rows.map((r) => {
            const isOpen = open.has(r.id);
            const diffKeys = r.diff ? Object.keys(r.diff) : [];

            return (
              <Fragment key={r.id}>
                <tr className="border-t border-[color:var(--line)] hover:bg-[color:var(--bg)]/50">
                  <td className="px-4 py-3 align-top tabular-nums text-xs text-[color:var(--mut)]">
                    {new Date(r.at).toLocaleString(
                      locale === "am" ? "am-ET" : "en-GB",
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">
                      {r.actor_email ?? tr("ሲስተም", "System")}
                    </div>
                    {r.actor_id && (
                      <div className="font-mono text-[10px] text-[color:var(--mut)]">
                        {r.actor_id.slice(0, 8)}…
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (actionStyle[r.action] ?? "")
                      }
                    >
                      {actionLabel[r.action] ?? r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-xs">{r.entity}</div>
                    <div className="font-mono text-[10px] text-[color:var(--mut)]">
                      {r.entity_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Button variant="ghost" size="xs" onClick={() => toggle(r.id)}>
                      {isOpen ? "▲" : "▼"}{" "}
                      {r.action === "UPDATE" && diffKeys.length > 0
                        ? `(${diffKeys.length})`
                        : ""}
                    </Button>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-[color:var(--bg)]">
                    <td colSpan={5} className="px-4 py-4">
                      {r.action === "UPDATE" && r.diff && diffKeys.length > 0 ? (
                        <div className="space-y-2">
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--mut)]">
                            {tr("የተቀየሩ መስኮች", "Changed fields")}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[10px] uppercase text-[color:var(--mut)]">
                                <th className="w-48 pb-1">{tr("መስክ", "Field")}</th>
                                <th className="pb-1">{tr("ከ", "From")}</th>
                                <th className="pb-1">{tr("ወደ", "To")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(r.diff).map(([field, { from, to }]) => (
                                <tr
                                  key={field}
                                  className="border-t border-[color:var(--line)]"
                                >
                                  <td className="py-1.5 pr-3 font-mono font-semibold">
                                    {field}
                                  </td>
                                  <td className="py-1.5 pr-3 text-[color:var(--rep)]">
                                    {formatValue(from)}
                                  </td>
                                  <td className="py-1.5 text-[color:var(--success)]">
                                    {formatValue(to)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--mut)]">
                            {tr("ሙሉ መዝገብ", "Full record")}
                          </div>
                          <pre className="overflow-auto rounded bg-white p-3 font-mono text-[11px] leading-snug">
                            {JSON.stringify(r.changes, null, 2)}
                          </pre>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 100 ? v.slice(0, 100) + "…" : v;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 100);
  return String(v);
}