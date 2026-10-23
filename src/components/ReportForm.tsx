"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n";
import type { ReportItem, SurveyReport } from "~db/schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import {
  PartConditionModal,
  type ItemCondition,
  type ItemOrigin,
} from "@/components/PartConditionModal";
import {
  addItem,
  bulkDeleteItems,
  bulkMoveItems,
  bulkSetRecovery,
  removeItem,
  reorderItems,
  restoreItems,
  toggleRecovery,
  updateItemDetails,
} from "@/server/actions/items";
import {
  saveReportHeader,
  finalizeReport,
  reopenReport,
} from "@/server/actions/reports";

type PartHit = { id: string; names: Record<string, string>; usageCount: number };
type LocalItem = ReportItem;

const MAX_HISTORY = 25;

export function ReportForm({
  locale,
  messages,
  report,
  items: initialItems,
  branches,
  readonly,
}: {
  locale: string;
  messages: Messages;
  report: SurveyReport;
  items: ReportItem[];
  branches: { id: number; code: string; names: Record<string, string> }[];
  readonly: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();

  const tr = useCallback(
    (am: string, en: string) => (locale === "am" ? am : en),
    [locale],
  );

  const [header, setHeader] = useState({
    coverage: report.coverage ?? "",
    reportDate: report.reportDate,
    branchId: String(report.branchId),
    vehicleType: report.vehicleType ?? "",
    plateNo: report.plateNo ?? "",
    manufactureYear: report.manufactureYear ? String(report.manufactureYear) : "",
    engineNo: report.engineNo ?? "",
    chassisNo: report.chassisNo ?? "",
    model: report.model ?? "",
    printLang: report.printLang,
    remarks: report.remarks ?? "",
    claimRef: report.claimRef ?? "",
  });
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});
  const [headerDirty, setHeaderDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [items, setItems] = useState<LocalItem[]>(initialItems);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);
  const historyRef = useRef<LocalItem[][]>([]);

  const replaces = useMemo(() => items.filter((i) => i.action === "replace"), [items]);
  const repairs = useMemo(() => items.filter((i) => i.action === "repair"), [items]);

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PartHit[]>([]);
  const [active, setActive] = useState(0);
  const [custom, setCustom] = useState({ en: "", am: "" });

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/parts/search?q=${encodeURIComponent(q)}&limit=40`);
      const json = await res.json();
      setHits(json.items ?? []);
      setActive(0);
    }, 140);
    return () => clearTimeout(t);
  }, [q]);

  const [conditionFor, setConditionFor] = useState<
    | { kind: "search"; hit: PartHit; action: "replace" | "repair" }
    | { kind: "custom"; action: "replace" | "repair" }
    | {
        kind: "edit";
        item: ReportItem;
      }
    | { kind: "bulk-move"; ids: string[] }
    | null
  >(null);

  const [confirmReopen, setConfirmReopen] = useState(false);
  const [reopening, setReopening] = useState(false);

  const snapshot = useCallback(() => {
    historyRef.current.push(items.map((i) => ({ ...i })));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }, [items]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) {
      toast.info(tr("የሚመለስ ለውጥ የለም", "Nothing to undo"));
      return;
    }
    setItems(prev);
    setSelection(new Set());
    start(async () => {
      try {
        await restoreItems(
          report.id,
          prev.map((p) => ({
            id: p.id,
            action: p.action,
            position: p.position,
            partId: p.partId,
            names: p.names,
            isRecovery: p.isRecovery,
            quantity: p.quantity,
            remark: p.remark,
            condition: (p.condition ?? null) as ItemCondition | null,
            origin: (p.origin ?? null) as ItemOrigin | null,
          })),
        );
        toast.success(tr("ተመልሷል", "Undone"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Undo failed");
      }
    });
  }, [report.id, tr]);

  useEffect(() => {
    if (readonly) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, readonly]);

  const nextPosition = (action: "replace" | "repair") =>
    items.filter((i) => i.action === action).reduce((m, i) => Math.max(m, i.position), 0) + 1;

  const addPart = useCallback(
    (
      hit: PartHit | { names: Record<string, string>; partId: null },
      action: "replace" | "repair",
      extra?: {
        condition?: ItemCondition | null;
        origin?: ItemOrigin | null;
        isRecovery?: boolean;
        remark?: string | null;
      },
    ) => {
      if (readonly) return;
      snapshot();

      const optimistic: LocalItem = {
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        reportId: report.id,
        action,
        position: nextPosition(action),
        partId: "id" in hit ? hit.id : null,
        names: hit.names,
        isRecovery: action === "replace" ? extra?.isRecovery ?? false : false,
        quantity: 1,
        remark: extra?.remark ?? null,
        condition: action === "replace" ? extra?.condition ?? null : null,
        origin: action === "replace" ? extra?.origin ?? null : null,
        createdAt: new Date(),
      };

      setItems((prev) => [...prev, optimistic]);

      start(async () => {
        try {
          const saved = await addItem({
            reportId: report.id,
            action,
            partId: "id" in hit ? hit.id : null,
            names: hit.names,
            isRecovery: optimistic.isRecovery,
            quantity: 1,
            remark: optimistic.remark ?? undefined,
            condition: optimistic.condition as ItemCondition | null,
            origin: optimistic.origin as ItemOrigin | null,
          });
          setItems((prev) =>
            prev.map((it) => (it.id === optimistic.id ? { ...it, id: saved.id } : it)),
          );
          toast.success(
            tr(
              `"${hit.names.am ?? hit.names.en}" ተጨምሯል`,
              `"${hit.names.en ?? hit.names.am}" added`,
            ),
          );
        } catch (err) {
          setItems((prev) => prev.filter((it) => it.id !== optimistic.id));
          toast.error(err instanceof Error ? err.message : "Failed to add");
        }
      });
    },
    [items, report.id, readonly, snapshot, tr],
  );

  const askReplace = (hit: PartHit) => setConditionFor({ kind: "search", hit, action: "replace" });
  const askRepair = (hit: PartHit) => setConditionFor({ kind: "search", hit, action: "repair" });
  
  const askCustomReplace = () => setConditionFor({ kind: "custom", action: "replace" });
  const askCustomRepair = () => setConditionFor({ kind: "custom", action: "repair" });

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    const next = new Set(selection);
    if (e.shiftKey && lastClickedRef.current) {
      const target = items.find((x) => x.id === id);
      const list = items.filter((i) => i.action === target?.action);
      const a = list.findIndex((i) => i.id === lastClickedRef.current);
      const b = list.findIndex((i) => i.id === id);
      const [s, t] = a < b ? [a, b] : [b, a];
      for (let i = s; i <= t; i++) next.add(list[i].id);
    } else if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    lastClickedRef.current = id;
    setSelection(next);
  };

  const doBulkMove = useCallback(
    (
      ids: string[],
      to: "replace" | "repair",
      values?: {
        condition: ItemCondition;
        origin: ItemOrigin | null;
        isRecovery?: boolean;
      },
    ) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      snapshot();

      setItems((prev) =>
        prev.map((i) =>
          idSet.has(i.id)
            ? {
                ...i,
                action: to,
                isRecovery: to === "replace" ? values?.isRecovery ?? i.isRecovery : false,
                condition:
                  to === "replace"
                    ? values?.condition ?? (i.condition as ItemCondition) ?? "new"
                    : null,
                origin:
                  to === "replace" ? values?.origin ?? (i.origin as ItemOrigin) ?? null : null,
              }
            : i,
        ),
      );
      setSelection(new Set());

      start(async () => {
        try {
          await bulkMoveItems(ids, to, values);
          toast.success(
            tr(
              `${ids.length} እቃዎች ተዛውረዋል`,
              `${ids.length} item${ids.length === 1 ? "" : "s"} moved`,
            ),
          );
        } catch (err) {
          const prev = historyRef.current.pop();
          if (prev) setItems(prev);
          toast.error(err instanceof Error ? err.message : "Move failed");
        }
      });
    },
    [snapshot, tr],
  );

  const bulkMove = (to: "replace" | "repair") => {
    if (!selection.size) return;
    const moving = items.filter((i) => selection.has(i.id) && i.action !== to);
    if (moving.length === 0) {
      toast.info(tr("የሚዛወር ነገር የለም", "Nothing to move"));
      return;
    }
    const ids = moving.map((i) => i.id);
    if (to === "replace") {
      setConditionFor({ kind: "bulk-move", ids });
    } else {
      doBulkMove(ids, "repair");
    }
  };

  const bulkDelete = () => {
    if (!selection.size) return;
    const ids = Array.from(selection);
    snapshot();
    setItems((prev) => prev.filter((i) => !selection.has(i.id)));
    setSelection(new Set());
    start(async () => {
      try {
        await bulkDeleteItems(ids);
        toast.success(
          tr(
            `${ids.length} እቃዎች ተሰርዘዋል`,
            `${ids.length} item${ids.length === 1 ? "" : "s"} removed`,
          ),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };

  const bulkRecovery = (v: boolean) => {
    if (!selection.size) return;
    const ids = Array.from(selection);
    snapshot();
    setItems((prev) =>
      prev.map((i) =>
        selection.has(i.id) && i.action === "replace" ? { ...i, isRecovery: v } : i,
      ),
    );
    setSelection(new Set());
    start(async () => {
      try {
        await bulkSetRecovery(ids, v);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  };

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const action = items.find((i) => i.id === dragId)?.action;
    if (!action) return;

    snapshot();

    const list = items.filter((i) => i.action === action).sort((a, b) => a.position - b.position);
    const from = list.findIndex((i) => i.id === dragId);
    const to = list.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const others = items.filter((i) => i.action !== action);
    const reordered = next.map((i, idx) => ({ ...i, position: idx + 1 }));
    setItems([...others, ...reordered]);

    start(async () => {
      try {
        await reorderItems(report.id, action, reordered.map((i) => i.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reorder failed");
      }
    });

    setDragId(null);
    setDragOverId(null);
  };

  const handleConditionSubmit = (values: {
    condition: ItemCondition | null;
    origin: ItemOrigin | null;
    isSalvage: boolean;
    remark: string;
  }) => {
    if (!conditionFor) return;

    if (conditionFor.kind === "search") {
      addPart(conditionFor.hit, conditionFor.action, {
        condition: values.condition,
        origin: values.origin,
        isRecovery: values.isSalvage,
        remark: values.remark,
      });
    } else if (conditionFor.kind === "custom") {
      addPart({ names: custom, partId: null }, conditionFor.action, {
        condition: values.condition,
        origin: values.origin,
        isRecovery: values.isSalvage,
        remark: values.remark,
      });
      setCustom({ en: "", am: "" });
    } else if (conditionFor.kind === "edit") {
      const id = conditionFor.item.id;
      snapshot();
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                condition: values.condition,
                origin: values.origin,
                isRecovery: values.isSalvage,
                remark: values.remark,
              }
            : x,
        ),
      );
      start(async () => {
        try {
          await updateItemDetails(id, {
            condition: values.condition,
            origin: values.origin,
            isRecovery: values.isSalvage,
            remark: values.remark,
          });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Update failed");
        }
      });
    } else if (conditionFor.kind === "bulk-move") {
      doBulkMove(conditionFor.ids, "replace", {
        condition: values.condition!,
        origin: values.origin,
        isRecovery: values.isSalvage,
      });
    }
  };

  const updateHeader = (patch: Partial<typeof header>) => {
    setHeader((h) => ({ ...h, ...patch }));
    setHeaderDirty(true);
  };

  const validateHeader = () => {
    const e: Record<string, string> = {};
    const req = messages.form.required ?? "Required";
    if (!header.coverage) e.coverage = req;
    if (!header.reportDate) e.reportDate = req;
    if (!header.branchId) e.branchId = req;
    if (!header.vehicleType.trim()) e.vehicleType = req;
    if (!header.plateNo.trim()) e.plateNo = req;
    if (!header.manufactureYear.trim()) {
      e.manufactureYear = req;
    } else if (!/^\d+$/.test(header.manufactureYear)) {
      e.manufactureYear = messages.form.invalidYear ?? "Must be a whole number";
    } else {
      const y = Number(header.manufactureYear);
      if (y < 1950 || y > 2100) e.manufactureYear = "1950 – 2100";
    }
    if (!header.chassisNo.trim()) e.chassisNo = req;
    if (!header.model.trim()) e.model = req;
    setHeaderErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSaveHeader = () => {
    if (!validateHeader()) {
      toast.error(
        tr("እባክዎ ሁሉንም አስፈላጊ መስኮች ይሙሉ", "Please fill in all required fields"),
      );
      return;
    }
    setSaveState("saving");
    start(async () => {
      try {
        await saveReportHeader(report.id, {
          ...header,
          manufactureYear: Number(header.manufactureYear),
          branchId: Number(header.branchId),
        });
        setSaveState("saved");
        setHeaderDirty(false);
        toast.success(tr("ተቀምጧል", "Saved"));
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (err) {
        setSaveState("idle");
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  const doFinalize = () => {
    start(async () => {
      try {
        await finalizeReport(report.id);
        toast.success(tr("ሪፖርቱ ተጠናቅቋል", "Report finalized"));
        router.push(`/${locale}/reports/${report.id}/preview`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not finalize");
      }
    });
  };

  const openReopenDialog = () => setConfirmReopen(true);

  const handleReopen = () => {
    setReopening(true);
    start(async () => {
      try {
        await reopenReport(report.id);
        toast.success(
          tr(
            "ሪፖርቱ እንደገና ተከፍቷል — ሁሉም መስኮች ሊስተካከሉ ይችላሉ",
            "Report reopened — all fields are now editable",
          ),
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not reopen");
      } finally {
        setReopening(false);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="space-y-4">
        {readonly && (
          <div
            className={
              "flex flex-wrap items-center gap-3 rounded-[var(--r-lg)] border p-4 " +
              (report.status === "finalized"
                ? "border-[color:var(--success)] bg-[color:var(--success-2)]"
                : "border-[color:var(--line-2)] bg-[color:var(--bg)]")
            }
          >
            <span
              className={
                "flex h-9 w-9 flex-none items-center justify-center rounded-full text-white " +
                (report.status === "finalized"
                  ? "bg-[color:var(--success)]"
                  : "bg-[color:var(--mut)]")
              }
            >
              {report.status === "finalized" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {report.status === "finalized"
                  ? tr(`ሪፖርት ${report.reportNo ?? ""} ተጠናቅቋል`, `Report ${report.reportNo ?? ""} is finalized`)
                  : tr(`ሪፖርቱ ${report.status} ሁኔታ ላይ ነው`, `Report is ${report.status}`)}
              </p>
              <p className="text-xs text-[color:var(--mut)]">
                {report.status === "finalized"
                  ? tr("ለማስተካከል ሪፖርቱን እንደገና ይክፈቱ። ሁሉም መስኮች እንደገና ሊስተካከሉ ይችላሉ።", "To make changes, reopen this report. All fields become editable again.")
                  : tr("ይህ ሪፖርት ሊስተካከል አይችልም።", "This report cannot be edited.")}
              </p>
            </div>
            {report.status === "finalized" && (
              <Button variant="primary" onClick={openReopenDialog} loading={reopening}>
                {tr("እንደገና ለማርትዕ", "Reopen for editing")}
              </Button>
            )}
          </div>
        )}

        <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-[color:var(--mut)]">
                {tr("ሪፖርት", "Report")}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{report.reportNo ?? tr("ረቂቅ", "Draft")}</p>
                {header.coverage && (
                  <span
                    className={
                      "rounded-full border px-2 py-0.5 text-xs font-medium " +
                      (header.coverage === "comprehensive"
                        ? "border-[#b3d4f0] bg-[color:var(--acc-2)] text-[color:var(--acc)]"
                        : "border-[#fde68a] bg-[color:var(--warn-2)] text-[color:var(--warn)]")
                    }
                  >
                    {header.coverage === "comprehensive"
                      ? tr("ሙሉ · Full", "Comprehensive")
                      : tr("ሦስተኛ · 3rd", "Third party")}
                  </span>
                )}
              </div>
            </div>
            {saveState === "saving" && <span className="text-xs text-[color:var(--mut)]">{messages.form.saving}</span>}
            {saveState === "saved" && <span className="text-xs text-[color:var(--success)]">{messages.form.saved}</span>}
          </div>

          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-[color:var(--mut)]">
              {messages.form.coverage}
              <span className="ml-0.5 text-[color:var(--rep)]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["comprehensive", "third_party"] as const).map((v) => (
                <label
                  key={v}
                  className={
                    "flex cursor-pointer items-center gap-2 rounded-[var(--r)] border-2 px-3 py-2.5 text-sm transition-colors " +
                    (header.coverage === v
                      ? "border-[color:var(--acc)] bg-[color:var(--acc-2)]"
                      : headerErrors.coverage && !header.coverage
                        ? "border-[color:var(--rep)]"
                        : "border-[color:var(--line)] hover:border-[color:var(--line-2)]")
                  }
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={header.coverage === v}
                    onChange={() => updateHeader({ coverage: v })}
                    disabled={readonly}
                  />
                  <span
                    className={
                      "flex h-4 w-4 items-center justify-center rounded-full border-2 " +
                      (header.coverage === v ? "border-[color:var(--acc)]" : "border-[color:var(--line-2)]")
                    }
                  >
                    {header.coverage === v && <span className="h-2 w-2 rounded-full bg-[color:var(--acc)]" />}
                  </span>
                  {v === "comprehensive" ? messages.form.comprehensive : messages.form.thirdParty}
                </label>
              ))}
            </div>
            {headerErrors.coverage && !header.coverage && (
              <p className="mt-1 text-xs text-[color:var(--rep)]">{headerErrors.coverage}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={messages.form.reportDate} required error={headerErrors.reportDate}>
              <Input
                type="date"
                value={header.reportDate}
                disabled={readonly}
                onChange={(e) => updateHeader({ reportDate: e.target.value })}
              />
            </Field>
            <Field label={messages.form.branch} required error={headerErrors.branchId}>
              <Select
                value={header.branchId}
                disabled={readonly}
                onChange={(e) => updateHeader({ branchId: e.target.value })}
              >
                <option value="">—</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {locale === "am" ? b.names.am ?? b.names.en : b.names.en ?? b.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={messages.form.plateNo} required error={headerErrors.plateNo}>
              <Input value={header.plateNo} disabled={readonly} onChange={(e) => updateHeader({ plateNo: e.target.value })} />
            </Field>
            <Field label={messages.form.chassisNo} required error={headerErrors.chassisNo}>
              <Input value={header.chassisNo} disabled={readonly} onChange={(e) => updateHeader({ chassisNo: e.target.value })} />
            </Field>
            <Field label={messages.form.vehicleType} required error={headerErrors.vehicleType}>
              <Input value={header.vehicleType} disabled={readonly} onChange={(e) => updateHeader({ vehicleType: e.target.value })} />
            </Field>
            <Field label={messages.form.manufactureYear} required error={headerErrors.manufactureYear}>
              <Input
                value={header.manufactureYear}
                disabled={readonly}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  updateHeader({ manufactureYear: digits });
                }}
              />
            </Field>
            <Field label={messages.form.engineNo} hint="Optional">
              <Input value={header.engineNo} disabled={readonly} onChange={(e) => updateHeader({ engineNo: e.target.value })} />
            </Field>
            <Field label={messages.form.model} required error={headerErrors.model}>
              <Input value={header.model} disabled={readonly} onChange={(e) => updateHeader({ model: e.target.value })} />
            </Field>
          </div>

          {!readonly && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {headerDirty && <span className="text-xs text-[color:var(--warn)]">{tr("ያልተቀመጡ ለውጦች", "Unsaved changes")}</span>}
              <Button variant="primary" onClick={doSaveHeader}>
                {tr("ራስጌውን አስቀምጥ", "Save header")}
              </Button>
            </div>
          )}
        </div>

        {!readonly && (
          <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[color:var(--mut)]">
              {messages.form.searchParts}
            </h3>
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(hits.length - 1, a + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(0, a - 1));
                } else if (e.key === "Enter" && hits[active]) {
                  e.preventDefault();
                  if (e.shiftKey) askRepair(hits[active]);
                  else askReplace(hits[active]);
                }
              }}
              placeholder={messages.form.searchPh}
              className="!border-2 !border-[color:var(--acc)] !py-2.5 !text-base"
            />

            {hits.length > 0 && (
              <div className="mt-3 max-h-[42vh] overflow-auto rounded-[var(--r)] border border-[color:var(--line)]">
                {hits.map((h, i) => (
                  <div
                    key={h.id}
                    className={
                      "flex items-center gap-2 border-b border-[color:var(--line)] px-3 py-2 last:border-b-0 " +
                      (i === active ? "bg-[color:var(--acc-2)]" : "hover:bg-[color:var(--bg)]")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold flex items-baseline gap-1.5">
                        <span>{h.names.am ?? h.names.en}</span>
                        {h.names.en && h.names.am && (
                          <span className="text-xs text-[color:var(--mut)]">/ {h.names.en}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline-danger" size="xs" onClick={() => askReplace(h)}>
                      + {tr("መተኪያ", "Replace")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      className="!border-[color:var(--fix)] !text-[color:var(--fix)]"
                      onClick={() => askRepair(h)}
                    >
                      + {tr("ጥገና", "Repair")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-[color:var(--acc)] hover:underline">
                {messages.form.addManual}
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Input
                  value={custom.en}
                  onChange={(e) => setCustom({ ...custom, en: e.target.value })}
                  placeholder={messages.form.enName}
                />
                <Input
                  value={custom.am}
                  onChange={(e) => setCustom({ ...custom, am: e.target.value })}
                  placeholder={messages.form.amName}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline-danger" size="sm" onClick={askCustomReplace}>
                  + {tr("መተኪያ", "Replace")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="!border-[color:var(--fix)] !text-[color:var(--fix)]"
                  onClick={askCustomRepair}
                >
                  + {tr("ጥገና", "Repair")}
                </Button>
              </div>
            </details>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {selection.size > 0 && !readonly && (
          <div className="anim-slide sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-[var(--r-lg)] border border-[color:var(--acc)] bg-[color:var(--acc-2)] px-3 py-2 shadow-[var(--shadow)]">
            <span className="text-sm font-medium text-[color:var(--acc)]">
              {selection.size} {tr("ተመርጠዋል", "selected")}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={() => bulkMove("replace")}>
                → {tr("መተኪያ", "Replace")}
              </Button>
              <Button size="xs" variant="secondary" onClick={() => bulkMove("repair")}>
                → {tr("ጥገና", "Repair")}
              </Button>
              <Button size="xs" variant="secondary" onClick={() => bulkRecovery(true)}>
                {tr("ቅሪት", "Salvage")}
              </Button>
              <Button size="xs" variant="secondary" onClick={() => bulkRecovery(false)}>
                {tr("ቅሪት አይደለም", "Not salvage")}
              </Button>
              <Button size="xs" variant="danger" onClick={bulkDelete}>
                {tr("ሰርዝ", "Delete")}
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setSelection(new Set())}>
                {tr("ተወው", "Cancel")}
              </Button>
            </div>
          </div>
        )}

        {!readonly && historyRef.current.length > 0 && (
          <div className="flex items-center justify-between rounded-[var(--r)] border border-[color:var(--line)] bg-white px-3 py-2 text-sm shadow-[var(--shadow-xs)]">
            <span className="text-[color:var(--mut)]">
              {historyRef.current.length} {tr("ለውጦች መመለስ ይቻላል", "changes available to undo")}
            </span>
            <Button size="xs" variant="secondary" onClick={undo}>
              ↶ {tr("መልስ", "Undo")} <span className="ml-1 text-[10px] text-[color:var(--mut)]">Ctrl+Z</span>
            </Button>
          </div>
        )}

        <ItemList
          title={messages.form.replaceList}
          tone="rep"
          items={replaces}
          selection={selection}
          readonly={readonly}
          messages={messages}
          locale={locale}
          onSelect={handleToggleSelect}
          onRemove={(id) => {
            snapshot();
            setItems((p) => p.filter((x) => x.id !== id));
            start(async () => {
              try {
                await removeItem(id);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Remove failed");
              }
            });
          }}
          onToggleRecovery={(id, v) => {
            snapshot();
            setItems((p) => p.map((x) => (x.id === id ? { ...x, isRecovery: v } : x)));
            start(async () => {
              try {
                await toggleRecovery(id, v);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Update failed");
              }
            });
          }}
          onEditDetails={(it) =>
            setConditionFor({
              kind: "edit",
              item: it,
            })
          }
          dragId={dragId}
          dragOverId={dragOverId}
          onDragStart={setDragId}
          onDragOver={setDragOverId}
          onDrop={dropOn}
          onDragEnd={() => {
            setDragId(null);
            setDragOverId(null);
          }}
        />

        <ItemList
          title={messages.form.repairList}
          tone="fix"
          items={repairs}
          selection={selection}
          readonly={readonly}
          messages={messages}
          locale={locale}
          onSelect={handleToggleSelect}
          onRemove={(id) => {
            snapshot();
            setItems((p) => p.filter((x) => x.id !== id));
            start(async () => {
              try {
                await removeItem(id);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Remove failed");
              }
            });
          }}
          onEditDetails={(it) =>
            setConditionFor({
              kind: "edit",
              item: it,
            })
          }
          dragId={dragId}
          dragOverId={dragOverId}
          onDragStart={setDragId}
          onDragOver={setDragOverId}
          onDrop={dropOn}
          onDragEnd={() => {
            setDragId(null);
            setDragOverId(null);
          }}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          {readonly ? (
            <>
              <Button variant="ghost" onClick={() => router.push(`/${locale}/reports`)}>
                ← {tr("ሁሉም ሪፖርቶች", "All reports")}
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/${locale}/reports/${report.id}/preview`)}>
                {tr("ቅድመ እይታ", "Preview")}
              </Button>
              <a href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
                <Button
                  variant="primary"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  }
                >
                  {tr("PDF አውርድ", "Download PDF")}
                </Button>
              </a>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={headerDirty}
                title={headerDirty ? tr("ከቅድመ እይታ በፊት ራስጌውን ያስቀምጡ", "Save the header before previewing") : ""}
                onClick={() => router.push(`/${locale}/reports/${report.id}/preview`)}
              >
                {tr("ቅድመ እይታ", "Preview")}
              </Button>
              <Button variant="primary" disabled={replaces.length === 0 && repairs.length === 0} onClick={doFinalize}>
                {messages.app.finalize} →
              </Button>
            </>
          )}
        </div>
      </section>

      <PartConditionModal
        open={conditionFor !== null}
        onClose={() => setConditionFor(null)}
        onSubmit={handleConditionSubmit}
        messages={messages}
        locale={locale}
        action={
          conditionFor?.kind === "edit" 
            ? conditionFor.item.action 
            : conditionFor?.kind === "search" 
              ? conditionFor.action 
              : conditionFor?.kind === "custom" 
                ? conditionFor.action 
                : "replace"
        }
        initial={
          conditionFor?.kind === "edit"
            ? {
                condition: (conditionFor.item.condition ?? null) as ItemCondition | null,
                origin: (conditionFor.item.origin ?? null) as ItemOrigin | null,
                isSalvage: conditionFor.item.isRecovery,
                remark: conditionFor.item.remark,
              }
            : undefined
        }
        partName={(() => {
          if (!conditionFor) return "";
          if (conditionFor.kind === "search") {
            return (
              conditionFor.hit.names[locale] ??
              conditionFor.hit.names.en ??
              conditionFor.hit.names.am ??
              ""
            );
          }
          if (conditionFor.kind === "custom") {
            return custom[locale as "en" | "am"] || custom.en || custom.am;
          }
          if (conditionFor.kind === "edit") {
            return conditionFor.item.names.am ?? conditionFor.item.names.en;
          }
          if (conditionFor.kind === "bulk-move") {
            const n = conditionFor.ids.length;
            return tr(
              `${n} እቃዎች ወደ "የሚለወጡ" ዝርዝር ይዛወራሉ። ለሁሉም አንድ ዓይነት ሁኔታ ይምረጡ።`,
              `${n} item${n === 1 ? "" : "s"} will be moved to the Replace column. Choose one condition that applies to all of them.`,
            );
          }
          return "";
        })()}
        title={conditionFor?.kind === "bulk-move" ? tr("ወደ መተኪያ ማዛወር", "Move to Replace") : undefined}
        submitLabel={
          conditionFor?.kind === "bulk-move"
            ? tr(
                `${conditionFor.ids.length} እቃዎችን አዛውር`,
                `Move ${conditionFor.ids.length} item${conditionFor.ids.length === 1 ? "" : "s"}`,
              )
            : undefined
        }
      />

      <ConfirmDialog
        open={confirmReopen}
        onClose={() => setConfirmReopen(false)}
        onConfirm={handleReopen}
        title={tr("ሪፖርቱን እንደገና ለማርትዕ ይክፈቱ?", "Reopen this report for editing?")}
        confirmLabel={tr("አዎ፣ ክፈት", "Yes, reopen")}
        message={tr(
          `ሪፖርት ${report.reportNo ?? ""} ወደ "ረቂቅ" ይመለሳል እና ሁሉም መስኮች እንደገና ሊስተካከሉ ይችላሉ። የሪፖርት ቁጥሩ አይቀየርም። ይህ እርምጃ በኦዲት ሎግ ይመዘገባል።`,
          `Report ${report.reportNo ?? ""} will return to "draft" and every field becomes editable again. The report number is preserved. This action is recorded in the audit log.`,
        )}
      />
    </div>
  );
}

function ItemList({
  title,
  tone,
  items,
  selection,
  readonly,
  messages,
  locale,
  onSelect,
  onRemove,
  onToggleRecovery,
  onEditDetails,
  dragId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  title: string;
  tone: "rep" | "fix";
  items: ReportItem[];
  selection: Set<string>;
  readonly: boolean;
  messages: Messages;
  locale: string;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onRemove: (id: string) => void;
  onToggleRecovery?: (id: string, v: boolean) => void;
  onEditDetails?: (it: ReportItem) => void;
  dragId: string | null;
  dragOverId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (id: string | null) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
}) {
  const isRep = tone === "rep";

  const conditionLabel: Record<string, string> = {
    new: messages.form.conditionNew,
    used: messages.form.conditionUsed,
  };
  const originLabel: Record<string, string> = {
    genuine: messages.form.originGenuine,
    local: messages.form.originLocal,
  };

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
      <div
        className={
          "flex items-center gap-2 px-4 py-3 " +
          (isRep
            ? "bg-[color:var(--rep-2)] border-b border-[#fecaca]"
            : "bg-[color:var(--fix-2)] border-b border-[#c7d2fe]")
        }
      >
        <span
          className={
            "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white " +
            (isRep ? "bg-[color:var(--rep)]" : "bg-[color:var(--fix)]")
          }
        >
          {items.length}
        </span>
        <h3 className="font-semibold">{title}</h3>
        {!readonly && items.length > 1 && (
          <span className="ml-auto text-xs text-[color:var(--mut)]">
            {locale === "am" ? "ለማስተካከል ይጎትቱ · Shift+ጠቅ ያድርጉ" : "Drag to reorder · Shift+click"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-[color:var(--mut)]">
          {locale === "am" ? "እስካሁን ምንም የለም።" : "Nothing here yet."}
        </div>
      ) : (
        <ul>
          {items.map((it, i) => {
            const selected = selection.has(it.id);
            const isDragging = dragId === it.id;
            const isOver = dragOverId === it.id && dragId !== it.id;
            const cond = (it.condition ?? null) as "new" | "used" | null;
            const orig = (it.origin ?? null) as "genuine" | "local" | null;
            const hasBadge = cond || orig;

            return (
              <li
                key={it.id}
                draggable={!readonly}
                onDragStart={(e) => {
                  onDragStart(it.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  onDragOver(it.id);
                }}
                onDragLeave={() => onDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(it.id);
                }}
                onDragEnd={onDragEnd}
                className={
                  "group relative flex items-center gap-3 border-b border-[color:var(--line)] px-3 py-2.5 last:border-b-0 transition-colors " +
                  (selected ? "bg-[color:var(--acc-2)]" : "hover:bg-[color:var(--bg)]/60") +
                  (isDragging ? " opacity-40" : "") +
                  (isOver ? " ring-2 ring-inset ring-[color:var(--acc)]" : "")
                }
              >
                {!readonly && (
                  <span className="cursor-grab text-[color:var(--line-2)] opacity-0 transition-opacity group-hover:opacity-100">
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                      <circle cx="3" cy="3" r="1.4" />
                      <circle cx="9" cy="3" r="1.4" />
                      <circle cx="3" cy="8" r="1.4" />
                      <circle cx="9" cy="8" r="1.4" />
                      <circle cx="3" cy="13" r="1.4" />
                      <circle cx="9" cy="13" r="1.4" />
                    </svg>
                  </span>
                )}

                {!readonly && (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(it.id, e);
                    }}
                    className="h-4 w-4 rounded border-[color:var(--line-2)]"
                  />
                )}

                <span className="w-6 text-right text-xs font-medium tabular-nums text-[color:var(--mut)]">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold flex items-baseline gap-1.5">
                    <span>{it.names.am ?? it.names.en}</span>
                    {it.names.en && it.names.am && (
                      <span className="text-xs text-[color:var(--mut)]">/ {it.names.en}</span>
                    )}
                  </div>
                  {it.remark && (
                    <div className="truncate text-[11px] text-[color:var(--mut)] italic mt-0.5">
                      {it.remark}
                    </div>
                  )}
                  {isRep && hasBadge && (
                    <button
                      type="button"
                      disabled={readonly}
                      onClick={() => onEditDetails?.(it)}
                      className={
                        "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-all " +
                        (cond === "new"
                          ? "border-[#b3d4f0] bg-[color:var(--acc-2)] text-[color:var(--acc)]"
                          : "border-[#fde68a] bg-[color:var(--warn-2)] text-[color:var(--warn)]") +
                        (readonly ? "" : " hover:brightness-95 hover:shadow-[var(--shadow-xs)]")
                      }
                      title={readonly ? "" : locale === "am" ? "ለመቀየር ጠቅ ያድርጉ" : "Click to change"}
                    >
                      {cond && conditionLabel[cond]}
                      {cond && orig && <span className="opacity-50">/</span>}
                      {orig && <span className="opacity-80">{originLabel[orig]}</span>}
                    </button>
                  )}
                  {!isRep && !readonly && !it.remark && (
                    <button
                      type="button"
                      onClick={() => onEditDetails?.(it)}
                      className="mt-1 text-[10px] text-[color:var(--acc)] hover:underline"
                    >
                      {locale === "am" ? "+ መግለጫ ጨምር" : "+ Add remark"}
                    </button>
                  )}
                </div>

                {isRep && onToggleRecovery && !readonly && (
                  <label
                    className={
                      "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                      (it.isRecovery
                        ? "border-[color:var(--warn)] bg-[color:var(--warn-2)] text-[color:var(--warn)]"
                        : "border-[color:var(--line-2)] text-[color:var(--mut)] hover:border-[color:var(--warn)]")
                    }
                    title={locale === "am" ? "ለኩባንያ ሪከቨሪ ይመለሳል" : "Returned to company (recovery)"}
                  >
                    <input
                      type="checkbox"
                      checked={it.isRecovery}
                      onChange={(e) => onToggleRecovery(it.id, e.target.checked)}
                      className="sr-only"
                    />
                    R
                  </label>
                )}

                {!readonly && (
                  <button
                    onClick={() => onRemove(it.id)}
                    title={locale === "am" ? "አስወግድ" : "Remove"}
                    className="rounded-md p-1.5 text-[color:var(--mut)] opacity-0 transition-opacity hover:bg-[color:var(--rep-2)] hover:text-[color:var(--rep)] group-hover:opacity-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}