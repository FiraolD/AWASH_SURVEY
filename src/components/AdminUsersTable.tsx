"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/components/ui/Toast";
import {
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
} from "@/server/actions/users";
import type { UserRow } from "@/server/queries/users";

type Branch = { id: number; code: string; names: Record<string, string> };

export function AdminUsersTable({
  rows,
  total,
  page,
  pageSize,
  branches,
  currentUserId,
  locale,
}: {
  rows: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  branches: Branch[];
  currentUserId: string;
  locale: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const tr = (am: string, en: string) => (locale === "am" ? am : en);

  // Filters
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [role, setRole] = useState(sp.get("role") ?? "");
  const [branch, setBranch] = useState(sp.get("branch") ?? "");
  const [active, setActive] = useState(sp.get("active") ?? "all");

  // Modals
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserRow | null>(null);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (role) next.set("role", role);
    if (branch) next.set("branch", branch);
    if (active && active !== "all") next.set("active", active);
    next.set("page", "1");
    router.push(`${path}?${next.toString()}`);
  };

  const clearFilters = () => {
    setQ("");
    setRole("");
    setBranch("");
    setActive("all");
    router.push(path);
  };

  const toggleActive = (row: UserRow) => {
    if (row.isActive) {
      setConfirmDeactivate(row);
    } else {
      start(async () => {
        try {
          await setUserActive(row.id, true);
          toast.success(
            tr("ተጠቃሚው እንደገና ነቅቷል", "User reactivated"),
          );
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        }
      });
    }
  };

  const doDeactivate = (row: UserRow) => {
    start(async () => {
      try {
        await setUserActive(row.id, false);
        toast.success(tr("ተጠቃሚው ጠፍቷል", "User deactivated"));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  const roleBadge = (r: UserRow["role"]) => {
    const map = {
      admin: "bg-[color:var(--acc-2)] text-[color:var(--acc)] border-[#b3d4f0]",
      supervisor: "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]",
      surveyor: "bg-[color:var(--bg)] text-[color:var(--ink-2)] border-[color:var(--line-2)]",
    } as const;
    const labels = {
      admin: tr("አስተዳዳሪ", "Admin"),
      supervisor: tr("ሱፐርቫይዘር", "Supervisor"),
      surveyor: tr("ሰርቬየር", "Surveyor"),
    } as const;
    return (
      <span
        className={
          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium " +
          map[r]
        }
      >
        {labels[r]}
      </span>
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-3 shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={tr("ስም፣ ኢሜይል ወይም ስልክ ፈልግ…", "Search name, email, or phone…")}
            className="lg:col-span-2"
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{tr("ሁሉም ሚናዎች", "All roles")}</option>
            <option value="admin">{tr("አስተዳዳሪ", "Admin")}</option>
            <option value="supervisor">{tr("ሱፐርቫይዘር", "Supervisor")}</option>
            <option value="surveyor">{tr("ሰርቬየር", "Surveyor")}</option>
          </Select>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">{tr("ሁሉም ቅርንጫፎች", "All branches")}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {locale === "am" ? b.names.am ?? b.names.en : b.names.en ?? b.code}
              </option>
            ))}
          </Select>
          <Select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="all">{tr("ሁሉም", "All statuses")}</option>
            <option value="active">{tr("ንቁ ብቻ", "Active only")}</option>
            <option value="inactive">{tr("የተሰናበቱ ብቻ", "Inactive only")}</option>
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={clearFilters} className="flex-1">
              {tr("አጽዳ", "Clear")}
            </Button>
            <Button variant="primary" size="sm" onClick={applyFilters} className="flex-1">
              {tr("አጣራ", "Apply")}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[color:var(--mut)]">
            {total} {tr("ተጠቃሚዎች", total === 1 ? "user" : "users")}
          </p>
          <Button
            variant="primary"
            onClick={() => setCreating(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            {tr("ተጠቃሚ ጨምር", "Add user")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg)] text-left text-xs uppercase tracking-wide text-[color:var(--mut)]">
            <tr>
              <th className="px-4 py-3">{tr("ስም", "Name")}</th>
              <th className="px-4 py-3">{tr("ኢሜይል", "Email")}</th>
              <th className="hidden px-4 py-3 md:table-cell">
                {tr("ሚና", "Role")}
              </th>
              <th className="hidden px-4 py-3 lg:table-cell">
                {tr("ቅርንጫፍ", "Branch")}
              </th>
              <th className="hidden px-4 py-3 xl:table-cell">
                {tr("የመጨረሻ መግቢያ", "Last login")}
              </th>
              <th className="px-4 py-3">{tr("ሁኔታ", "Status")}</th>
              <th className="w-32 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[color:var(--mut)]">
                  {tr("ምንም ተጠቃሚ አልተገኘም", "No users match these filters")}
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const isMe = r.id === currentUserId;
              return (
                <tr
                  key={r.id}
                  className={
                    "border-t border-[color:var(--line)] " +
                    (r.isActive ? "hover:bg-[color:var(--bg)]/50" : "opacity-60")
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--acc)] text-xs font-semibold text-white">
                        {r.fullName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {r.fullName}
                          {isMe && (
                            <span className="ml-2 rounded-full bg-[color:var(--bg)] px-1.5 py-0.5 text-[10px] text-[color:var(--mut)]">
                              {tr("እርስዎ", "you")}
                            </span>
                          )}
                        </div>
                        {r.phone && (
                          <div className="truncate text-xs text-[color:var(--mut)]">
                            {r.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{r.email}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {roleBadge(r.role)}
                  </td>
                  <td className="hidden px-4 py-3 text-xs lg:table-cell">
                    {r.branchNames
                      ? locale === "am"
                        ? r.branchNames.am ?? r.branchNames.en
                        : r.branchNames.en ?? r.branchCode
                      : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-xs tabular-nums text-[color:var(--mut)] xl:table-cell">
                    {r.lastLoginAt
                      ? new Date(r.lastLoginAt).toLocaleString(
                          locale === "am" ? "am-ET" : "en-GB",
                          { dateStyle: "short", timeStyle: "short" },
                        )
                      : tr("አልገባም", "Never")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                        (r.isActive
                          ? "bg-[color:var(--success-2)] text-[color:var(--success)]"
                          : "bg-[color:var(--bg)] text-[color:var(--mut)]")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (r.isActive
                            ? "bg-[color:var(--success)]"
                            : "bg-[color:var(--mut)]")
                        }
                      />
                      {r.isActive
                        ? tr("ንቁ", "Active")
                        : tr("ተሰናብቷል", "Inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="icon"
                        size="xs"
                        title={tr("አርትዕ", "Edit")}
                        onClick={() => setEditing(r)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </Button>
                      <Button
                        variant="icon"
                        size="xs"
                        title={tr("የይለፍ ቃል ቀይር", "Reset password")}
                        onClick={() => setResetting(r)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </Button>
                      <Button
                        variant="icon"
                        size="xs"
                        title={
                          r.isActive
                            ? tr("አቁም", "Deactivate")
                            : tr("አንቃ", "Activate")
                        }
                        disabled={isMe && r.isActive}
                        onClick={() => toggleActive(r)}
                      >
                        {r.isActive ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2v10" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5v14" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-[color:var(--line)]">
          <Pagination page={page} pageSize={pageSize} total={total} />
        </div>
      </div>

      {/* Create / Edit modal */}
      <UserFormModal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        initial={editing}
        branches={branches}
        locale={locale}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Reset password modal */}
      <ResetPasswordModal
        user={resetting}
        onClose={() => setResetting(null)}
        locale={locale}
        onSaved={() => {
          setResetting(null);
          router.refresh();
        }}
      />

      {/* Confirm deactivate */}
      <ConfirmDialog
        open={confirmDeactivate !== null}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => confirmDeactivate && doDeactivate(confirmDeactivate)}
        title={tr("ተጠቃሚውን ማቆም?", "Deactivate this user?")}
        confirmLabel={tr("አቁም", "Deactivate")}
        danger
        message={
          confirmDeactivate
            ? tr(
                `${confirmDeactivate.fullName} መግቢያ እንዲከለከል ይደረጋል። ቀደም ሲል የፈጠራቸው ሪፖርቶች አይጠፉም። በኋላ እንደገና ማስጀመር ይችላሉ።`,
                `${confirmDeactivate.fullName} will no longer be able to sign in. Their existing reports are preserved. You can reactivate them later.`,
              )
            : ""
        }
      />
    </>
  );
}

/* =================================================================== */

function UserFormModal({
  open,
  onClose,
  initial,
  branches,
  locale,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: UserRow | null;
  branches: Branch[];
  locale: string;
  onSaved: () => void;
}) {
  const tr = (am: string, en: string) => (locale === "am" ? am : en);
  const isEdit = initial !== null;

  const [email, setEmail] = useState(initial?.email ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<UserRow["role"]>(initial?.role ?? "surveyor");
  const [branchId, setBranchId] = useState(
    initial?.branchId ? String(initial.branchId) : String(branches[0]?.id ?? ""),
  );
  const [preferredLang, setPreferredLang] = useState<"en" | "am" | "om">(
    (initial?.preferredLang as "en" | "am" | "om") ?? "am",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset whenever the modal reopens
  useMemo(() => {
    if (!open) return;
    setEmail(initial?.email ?? "");
    setFullName(initial?.fullName ?? "");
    setPhone(initial?.phone ?? "");
    setRole(initial?.role ?? "surveyor");
    setBranchId(
      initial?.branchId ? String(initial.branchId) : String(branches[0]?.id ?? ""),
    );
    setPreferredLang((initial?.preferredLang as "en" | "am" | "om") ?? "am");
    setPassword("");
    setShowPassword(false);
  }, [open, initial, branches]);

  const submit = async () => {
    if (!fullName.trim()) {
      toast.error(tr("ስም ያስፈልጋል", "Name is required"));
      return;
    }
    if (!email.trim()) {
      toast.error(tr("ኢሜይል ያስፈልጋል", "Email is required"));
      return;
    }
    if (!isEdit && password.length < 6) {
      toast.error(
      tr(
          "የይለፍ ቃል ቢያንስ 6 ፊደሎች መሆን አለበት",
          "Password must be at least 6 characters",
        ),
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateUser({
          id: initial!.id,
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
          branchId: Number(branchId),
          preferredLang,
        });
        toast.success(tr("ተጠቃሚው ተስተካክሏል", "User updated"));
      } else {
        await createUser({
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
          branchId: Number(branchId),
          preferredLang,
          password,
        });
        toast.success(tr("ተጠቃሚው ተፈጥሯል", "User created"));
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? tr("ተጠቃሚ አርትዕ", "Edit user")
          : tr("አዲስ ተጠቃሚ", "Add user")
      }
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tr("ሰርዝ", "Cancel")}
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {isEdit
              ? tr("ለውጦችን አስቀምጥ", "Save changes")
              : tr("ተጠቃሚ ፍጠር", "Create user")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={tr("ሙሉ ስም", "Full name")} required>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={tr("ለምሳሌ አበበ ከበደ", "e.g. Abebe Kebede")}
            autoFocus
          />
        </Field>

        <Field label={tr("ኢሜይል", "Email")} required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@awash.example"
          />
        </Field>

        <Field label={tr("ስልክ", "Phone")} hint={tr("አማራጭ", "Optional")}>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+251 9XX XXX XXX"
          />
        </Field>

        <Field label={tr("ሚና", "Role")} required>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRow["role"])}
          >
            <option value="surveyor">{tr("ሰርቬየር", "Surveyor")}</option>
            <option value="supervisor">{tr("ሱፐርቫይዘር", "Supervisor")}</option>
            <option value="admin">{tr("አስተዳዳሪ", "Admin")}</option>
          </Select>
        </Field>

        <Field label={tr("ቅርንጫፍ", "Branch")} required>
          <Select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {locale === "am" ? b.names.am ?? b.names.en : b.names.en ?? b.code}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={tr("ተመራጭ ቋንቋ", "Preferred language")} required>
          <Select
            value={preferredLang}
            onChange={(e) =>
              setPreferredLang(e.target.value as "en" | "am" | "om")
            }
          >
            <option value="am">አማርኛ</option>
            <option value="en">English</option>
            <option value="om">Afaan Oromoo</option>
          </Select>
        </Field>

        {!isEdit && (
          <div className="sm:col-span-2">
            <Field
              label={tr("የመጀመሪያ የይለፍ ቃል", "Initial password")}
              hint={tr(
                "ቢያንስ 6 ፊደሎች · ተጠቃሚው እንዲቀይረው ይንገሩት",
                "At least 6 characters · ask the user to change it after first login",
              )}
              required
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="!pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--mut)] hover:text-ink"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* =================================================================== */

function ResetPasswordModal({
  user,
  onClose,
  locale,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  locale: string;
  onSaved: () => void;
}) {
  const tr = (am: string, en: string) => (locale === "am" ? am : en);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (user) {
      setPw("");
      setShow(false);
    }
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (pw.length < 6) {
      toast.error(
        tr(
          "የይለፍ ቃል ቢያንስ 6 ፊደሎች መሆን አለበት",
          "Password must be at least 6 characters",
        ),
      );
      return;
    }
    setSaving(true);
    try {
      await resetUserPassword(user.id, pw);
      toast.success(
        tr("የይለፍ ቃል ተቀይሯል", "Password reset"),
      );
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={tr("የይለፍ ቃል ቀይር", "Reset password")}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tr("ሰርዝ", "Cancel")}
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {tr("አስቀምጥ", "Save")}
          </Button>
        </>
      }
    >
      {user && (
        <>
          <p className="mb-4 text-sm text-[color:var(--mut)]">
            {tr(
              `ለ ${user.fullName} (${user.email}) አዲስ የይለፍ ቃል ያስገቡ።`,
              `Set a new password for ${user.fullName} (${user.email}).`,
            )}
          </p>
          <Field
            label={tr("አዲስ የይለፍ ቃል", "New password")}
            hint={tr("ቢያንስ 6 ፊደሎች", "At least 6 characters")}
            required
          >
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••••••"
                className="!pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--mut)] hover:text-ink"
                tabIndex={-1}
              >
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </Field>
          <p className="mt-3 rounded-[var(--r)] bg-[color:var(--warn-2)] px-3 py-2 text-xs text-[color:var(--warn)]">
            {tr(
              "ይህን በግል ያስተላልፉ። ተጠቃሚው ከገባ በኋላ እንዲቀይረው ይጠይቁት።",
              "Share this with the user privately. Ask them to change it after their first login.",
            )}
          </p>
        </>
      )}
    </Modal>
  );
}