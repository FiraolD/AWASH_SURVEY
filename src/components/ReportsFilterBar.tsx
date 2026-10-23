"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Messages } from "@/lib/i18n";

export function ReportsFilterBar({
  branches, messages,
}: {
  branches: { id: number; code: string; names: Record<string, string> }[];
  messages: Messages;
}) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  const [v, setV] = useState({
    plate: sp.get("plate") ?? "",
    chassis: sp.get("chassis") ?? "",
    status: sp.get("status") ?? "",
    branch: sp.get("branch") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  });

  const apply = () => {
    const next = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val) next.set(k, val);
    next.set("page", "1");
    router.push(`${path}?${next.toString()}`);
  };

  const clear = () => {
    setV({ plate: "", chassis: "", status: "", branch: "", from: "", to: "" });
    router.push(path);
  };

  return (
    <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-3 shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Input
          placeholder={messages.reports.plate}
          value={v.plate}
          onChange={(e) => setV({ ...v, plate: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <Input
          placeholder={messages.reports.chassis}
          value={v.chassis}
          onChange={(e) => setV({ ...v, chassis: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
          <option value="">{messages.reports.status}</option>
          <option value="draft">Draft</option>
          <option value="finalized">Finalized</option>
          <option value="void">Void</option>
        </Select>
        <Select value={v.branch} onChange={(e) => setV({ ...v, branch: e.target.value })}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.names.en ?? b.code}</option>
          ))}
        </Select>
        <Input type="date" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} />
        <Input type="date" value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
        <Button variant="primary" size="sm" onClick={apply}>Apply filters</Button>
      </div>
    </div>
  );
}