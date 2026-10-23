"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/components/ui/Toast";
import { deletePart, setPartActive, upsertPart } from "@/server/actions/parts";

type Row = {
  id: string;
  code: string | null;
  en: string;
  am: string;
  isActive: boolean;
  usageCount: number;
  source: string;
};

export function AdminPartsTable({
  rows, total, page, pageSize,
}: { rows: Row[]; total: number; page: number; pageSize: number }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [active, setActive] = useState(sp.get("active") ?? "all");

  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const submitFilters = () => {
    const next = new URLSearchParams(sp.toString());
    if (q) next.set("q", q); else next.delete("q");
    if (active && active !== "all") next.set("active", active); else next.delete("active");
    next.set("page", "1");
    router.push(`${path}?${next.toString()}`);
  };

  const toggleActive = (row: Row) => {
    start(async () => {
      await setPartActive(row.id, !row.isActive);
      toast.success(row.isActive ? "Part deactivated" : "Part activated");
      router.refresh();
    });
  };

  const doDelete = (row: Row) => {
    start(async () => {
      await deletePart(row.id);
      toast.success("Part deactivated");
      router.refresh();
    });
  };

  return (
    <>
      {/* Filter bar */}
      <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-3 shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto_auto]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitFilters()}
            placeholder="Search English or Amharic…"
          />
          <Select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </Select>
          <Button variant="secondary" onClick={submitFilters}>Apply filters</Button>
          <Button
            variant="primary"
            onClick={() => setCreating(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Add part
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg)] text-left text-xs uppercase tracking-wide text-[color:var(--mut)]">
            <tr>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">አማርኛ</th>
              <th className="hidden px-4 py-3 md:table-cell">Code</th>
              <th className="px-4 py-3 text-right">Uses</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-24 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[color:var(--mut)]">
                  No parts match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[color:var(--line)] hover:bg-[color:var(--bg)]/50"
              >
                <td className="px-4 py-3 font-medium">{r.en || "—"}</td>
                <td className="px-4 py-3">{r.am || "—"}</td>
                <td className="hidden px-4 py-3 font-mono text-xs text-[color:var(--mut)] md:table-cell">
                  {r.code || "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.usageCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium " +
                      (r.isActive
                        ? "bg-[color:var(--success-2)] text-[color:var(--success)]"
                        : "bg-[color:var(--bg)] text-[color:var(--mut)]")
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + (r.isActive ? "bg-[color:var(--success)]" : "bg-[color:var(--mut)]")} />
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="icon" size="xs" onClick={() => setEditing(r)} title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </Button>
                    <Button
                      variant="icon"
                      size="xs"
                      onClick={() => toggleActive(r)}
                      title={r.isActive ? "Deactivate" : "Activate"}
                    >
                      {r.isActive ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2v10" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5v14" />
                        </svg>
                      )}
                    </Button>
                    <Button
                      variant="icon"
                      size="xs"
                      onClick={() => setConfirmDelete(r)}
                      title="Deactivate permanently"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-[color:var(--line)]">
          <Pagination page={page} pageSize={pageSize} total={total} />
        </div>
      </div>

      {/* Add / edit modal */}
      <PartFormModal
        open={creating || editing !== null}
        onClose={() => { setCreating(false); setEditing(null); }}
        initial={editing}
        onSaved={() => { setCreating(false); setEditing(null); router.refresh(); }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && doDelete(confirmDelete)}
        title="Deactivate this part?"
        message={
          confirmDelete
            ? `"${confirmDelete.en}" will be hidden from surveyor search but stays attached to existing reports. You can reactivate it any time.`
            : ""
        }
        confirmLabel="Deactivate"
        danger
      />
    </>
  );
}

function PartFormModal({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Row | null;
  onSaved: () => void;
}) {
  const [en, setEn] = useState(initial?.en ?? "");
  const [am, setAm] = useState(initial?.am ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  // Reset when the modal reopens with a different row
  useMemo(() => {
    setEn(initial?.en ?? "");
    setAm(initial?.am ?? "");
    setCode(initial?.code ?? "");
    setIsActive(initial?.isActive ?? true);
  }, [initial, open]);

  const submit = async () => {
    if (!en.trim() || !am.trim()) {
      toast.error("Both English and Amharic names are required");
      return;
    }
    setSaving(true);
    try {
      await upsertPart({
        id: initial?.id,
        en: en.trim(),
        am: am.trim(),
        code: code.trim(),
        isActive,
      });
      toast.success(initial ? "Part updated" : "Part created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit part" : "Add a new part"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {initial ? "Save changes" : "Create part"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="English name" hint="Shown to surveyors when searching in English">
          <Input value={en} onChange={(e) => setEn(e.target.value)} placeholder="e.g. Front bumper" autoFocus />
        </Field>
        <Field label="Amharic name" hint="Shown on the printed report">
          <Input value={am} onChange={(e) => setAm(e.target.value)} placeholder="e.g. የፊት ፓራውልት" />
        </Field>
        <Field label="Internal code (optional)">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TOY-52119-0K010" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--line-2)]"
          />
          Active — visible to surveyors
        </label>
      </div>
    </Modal>
  );
}