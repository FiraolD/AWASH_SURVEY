import { requireRole } from "@/server/permissions";
import { listAuditEntries } from "@/server/queries/audit";
import { AuditLogTable } from "@/components/AuditLogTable";
import { Pagination } from "@/components/ui/Pagination";
import { getMessages, getLocale } from "@/lib/i18n";

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    entity?: string;
    actor?: string;
    action?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  await requireRole("admin");
  const sp = await searchParams;
  const messages = getMessages(await getLocale());

  const { rows, total, page, pageSize } = await listAuditEntries({
    entity: sp.entity,
    actorEmail: sp.actor,
    action: sp.action as "INSERT" | "UPDATE" | "DELETE" | undefined,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {messages.audit.title}
        </h1>
        <p className="text-sm text-[color:var(--mut)]">
          {messages.audit.subtitle}
        </p>
      </header>

      <form className="grid grid-cols-1 gap-3 rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-3 shadow-[var(--shadow-sm)] md:grid-cols-4">
        <select
          name="entity"
          defaultValue={sp.entity ?? ""}
          className="rounded-[var(--r)] border border-[color:var(--line-2)] bg-white px-3 py-2 text-sm"
        >
          <option value="">{messages.audit.filterEntity}</option>
          <option value="survey_reports">survey_reports</option>
          <option value="report_items">report_items</option>
          <option value="parts">parts</option>
          <option value="part_translations">part_translations</option>
          <option value="users">users</option>
          <option value="branches">branches</option>
        </select>
        <input
          name="actor"
          defaultValue={sp.actor ?? ""}
          placeholder={messages.audit.filterActor}
          className="rounded-[var(--r)] border border-[color:var(--line-2)] bg-white px-3 py-2 text-sm"
        />
        <select
          name="action"
          defaultValue={sp.action ?? ""}
          className="rounded-[var(--r)] border border-[color:var(--line-2)] bg-white px-3 py-2 text-sm"
        >
          <option value="">{messages.audit.filterAction}</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button className="rounded-[var(--r)] bg-[color:var(--acc)] px-4 py-2 text-sm font-medium text-white">
          {messages.audit.recent}
        </button>
      </form>

      <AuditLogTable rows={rows} locale={locale} />

      <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
        <Pagination page={page} pageSize={pageSize} total={total} />
      </div>
    </section>
  );
}