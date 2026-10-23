"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import {
  analyzeSql,
  runSql,
  runPendingMigration,
  type SqlRunResult,
  type MigrationFile,
} from "@/server/actions/sql";

export function SqlConsole({
  locale,
  migrations,
}: {
  locale: string;
  migrations: MigrationFile[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const tr = (am: string, en: string) => (locale === "am" ? am : en);

  const [sql, setSql] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [confirming, setConfirming] = useState<{
    dangerous: boolean;
    message: string;
  } | null>(null);
  const [running, setRunning] = useState(false);

  const execute = (confirmDestructive = false) => {
    if (!sql.trim()) {
      toast.error(tr("SQL ያስገቡ", "Enter SQL"));
      return;
    }
    setRunning(true);
    start(async () => {
      try {
        const r = await runSql({ text: sql, readOnly, confirmDestructive });
        setResult(r);
        if (r.ok) {
          toast.success(
            tr(
              `ተጠናቅቋል · ${r.durationMs}ms`,
              `Done · ${r.durationMs}ms`,
            ),
          );
        } else {
          toast.error(tr("ጥያቄው አልተሳካም", "Query failed"));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      } finally {
        setRunning(false);
        setConfirming(null);
      }
    });
  };

  const tryExecute = async () => {
    if (!sql.trim()) {
      toast.error(tr("SQL ያስገቡ", "Enter SQL"));
      return;
    }
    // Pre-flight: check whether this needs a confirmation
    const analysis = await analyzeSql(sql);
    if (!readOnly && (analysis.destructive || analysis.deleteAll)) {
      setConfirming({
        dangerous: true,
        message: analysis.deleteAll
          ? tr(
              "ይህ ጥያቄ ሁሉንም ረድፎች ሊያጠፋ ይችላል። መቀጠል?",
              "This query may delete every row in a table. Continue?",
            )
          : tr(
              "ይህ ጥያቄ ዳታቤዙን ይቀይራል። መቀጠል?",
              "This query will modify the database. Continue?",
            ),
      });
      return;
    }
    execute();
  };

  const applyMigration = (name: string) => {
    setRunning(true);
    start(async () => {
      try {
        await runPendingMigration(name);
        toast.success(tr(`"${name}" ተጠቅሟል`, `"${name}" applied`));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Migration failed");
      } finally {
        setRunning(false);
      }
    });
  };

  const pending = migrations.filter((m) => !m.applied);

  return (
    <div className="space-y-6">
      {/* Migrations panel */}
      <section className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">
              {tr("ማይግሬሽኖች", "Migrations")}
            </h2>
            <p className="text-xs text-[color:var(--mut)]">
              {tr(
                "ከdb/migrations የተነበቡ። ያልተጠቀሙትን ብቻ ከዚህ ማስኬድ ይችላሉ።",
                "Read from db/migrations. Only pending migrations can be applied.",
              )}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.refresh()}
          >
            {tr("አድስ", "Refresh")}
          </Button>
        </div>

        <ul className="divide-y divide-[color:var(--line)]">
          {migrations.map((m) => (
            <li key={m.name} className="flex items-center gap-3 py-2 text-sm">
              <span
                className={
                  "h-2 w-2 flex-none rounded-full " +
                  (m.applied
                    ? "bg-[color:var(--success)]"
                    : "bg-[color:var(--warn)]")
                }
              />
              <span className="flex-1 font-mono text-xs">{m.name}</span>
              {m.applied ? (
                <span className="text-[10px] text-[color:var(--mut)]">
                  {m.appliedAt
                    ? new Date(m.appliedAt).toLocaleString(
                        locale === "am" ? "am-ET" : "en-GB",
                      )
                    : tr("ተጠቅሟል", "Applied")}
                </span>
              ) : (
                <Button
                  variant="primary"
                  size="xs"
                  disabled={running}
                  onClick={() => applyMigration(m.name)}
                >
                  {tr("አስኪድ", "Apply")}
                </Button>
              )}
            </li>
          ))}
          {migrations.length === 0 && (
            <li className="py-6 text-center text-sm text-[color:var(--mut)]">
              {tr("ምንም ማይግሬሽን አልተገኘም", "No migrations found")}
            </li>
          )}
        </ul>
        {pending.length > 0 && (
          <p className="mt-3 rounded-[var(--r)] bg-[color:var(--warn-2)] px-3 py-2 text-xs text-[color:var(--warn)]">
            {tr(
              `${pending.length} ማይግሬሽኖች በመጠበቅ ላይ ናቸው።`,
              `${pending.length} migration${pending.length === 1 ? "" : "s"} pending.`,
            )}
          </p>
        )}
      </section>

      {/* SQL console */}
      <section className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">
              {tr("SQL ኮንሶል", "SQL console")}
            </h2>
            <p className="text-xs text-[color:var(--mut)]">
              {readOnly
                ? tr(
                    "በንባብ-ብቻ ሁኔታ። ምንም ለውጥ አይቀመጥም።",
                    "Read-only mode. Nothing is persisted.",
                  )
                : tr(
                    "የመጻፍ ሁኔታ። ለውጦች ይቀመጣሉ።",
                    "Write mode. Changes are committed.",
                  )}
            </p>
          </div>
          <label
            className={
              "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
              (readOnly
                ? "border-[color:var(--line-2)] text-[color:var(--mut)]"
                : "border-[color:var(--rep)] bg-[color:var(--rep-2)] text-[color:var(--rep)]")
            }
          >
            <input
              type="checkbox"
              checked={!readOnly}
              onChange={(e) => setReadOnly(!e.target.checked)}
              className="sr-only"
            />
            <span
              className={
                "h-2 w-2 rounded-full " +
                (readOnly ? "bg-[color:var(--mut)]" : "bg-[color:var(--rep)]")
              }
            />
            {readOnly
              ? tr("ንባብ ብቻ", "Read-only")
              : tr("መጻፍ ተከፍቷል", "Write enabled")}
          </label>
        </div>

        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              tryExecute();
            }
          }}
          rows={10}
          spellCheck={false}
          placeholder={"SELECT * FROM survey_reports LIMIT 10;"}
          className="w-full resize-y rounded-[var(--r)] border border-[color:var(--line-2)] bg-[#0f172a] p-3 font-mono text-[13px] leading-relaxed text-emerald-50 placeholder:text-slate-500 focus:border-[color:var(--acc)] focus:outline-none focus:ring-2 focus:ring-[color:var(--acc-ring)]"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-[color:var(--mut)]">
            {tr(
              "Ctrl+Enter ለማስኬድ · አንድ ብቻ ጥያቄ ወይም ብዙ",
              "Ctrl+Enter to run · single statement or many",
            )}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSql("");
                setResult(null);
              }}
            >
              {tr("አጽዳ", "Clear")}
            </Button>
            <Button
              variant={readOnly ? "primary" : "danger"}
              size="sm"
              onClick={tryExecute}
              loading={running}
            >
              {readOnly
                ? tr("አስኪድ", "Run query")
                : tr("አስኪድ (መጻፍ)", "Run (write)")}
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
          <div
            className={
              "flex items-center justify-between border-b px-5 py-3 " +
              (result.ok
                ? "border-[#bbf7d0] bg-[color:var(--success-2)]"
                : "border-[#fecaca] bg-[color:var(--rep-2)]")
            }
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-white " +
                  (result.ok
                    ? "bg-[color:var(--success)]"
                    : "bg-[color:var(--rep)]")
                }
              >
                {result.ok ? "✓" : "✕"}
              </span>
              <span className="font-semibold">
                {result.ok
                  ? tr("ተጠናቅቋል", "Query succeeded")
                  : tr("አልተሳካም", "Query failed")}
              </span>
              <span className="text-[color:var(--mut)]">
                · {result.durationMs}ms ·{" "}
                {result.readOnly ? tr("ንባብ ብቻ", "read-only") : tr("መጻፍ", "write")}
              </span>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-xs text-[color:var(--mut)] hover:text-ink"
            >
              {tr("ዝጋ", "Dismiss")}
            </button>
          </div>

          {!result.ok && (
            <div className="p-5">
              <pre className="whitespace-pre-wrap font-mono text-xs text-[color:var(--rep)]">
                {result.error}
              </pre>
            </div>
          )}

          {result.ok && result.resultSets.length === 0 && (
            <div className="p-5 text-sm text-[color:var(--mut)]">
              {tr("ምንም ውጤት የለም", "No output")}
            </div>
          )}

          {result.ok &&
            result.resultSets.map((rs, i) => (
              <div key={i} className="border-t border-[color:var(--line)] first:border-t-0">
                <div className="flex items-center gap-3 bg-[color:var(--bg)] px-5 py-2 text-xs">
                  <span className="font-semibold text-[color:var(--acc)]">
                    {rs.command}
                  </span>
                  <span className="text-[color:var(--mut)]">
                    {rs.rowCount}{" "}
                    {tr("ረድፎች", rs.rowCount === 1 ? "row" : "rows")}
                  </span>
                </div>
                {rs.rows.length > 0 ? (
                  <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[color:var(--bg)] text-left uppercase tracking-wide text-[color:var(--mut)]">
                        <tr>
                          {rs.columns.map((c) => (
                            <th
                              key={c}
                              className="border-b border-[color:var(--line)] px-3 py-2 font-mono"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rs.rows.map((row, ri) => (
                          <tr
                            key={ri}
                            className="hover:bg-[color:var(--bg)]/50"
                          >
                            {rs.columns.map((c) => (
                              <td
                                key={c}
                                className="border-b border-[color:var(--line)] px-3 py-1.5 font-mono"
                              >
                                {formatCell(row[c])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-4 text-xs text-[color:var(--mut)]">
                    {tr("ምንም ረድፍ አልተመለሰም", "No rows returned")}
                  </div>
                )}
              </div>
            ))}
        </section>
      )}

      {/* Destructive confirmation */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={tr("ማረጋገጫ ያስፈልጋል", "Confirmation required")}
        width="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              {tr("ሰርዝ", "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => execute(true)}
              loading={running}
            >
              {tr("አዎ፣ አስኪድ", "Yes, run it")}
            </Button>
          </>
        }
      >
        <p className="text-sm">{confirming?.message}</p>
      </Modal>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}