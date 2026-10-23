import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "~db/index";
import { auditLog } from "~db/schema";

export type AuditFilters = {
  entity?: string;
  actorEmail?: string;
  action?: "INSERT" | "UPDATE" | "DELETE";
  entityId?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditEntries(filters: AuditFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 30));
  const offset = (page - 1) * pageSize;

  const conds: ReturnType<typeof sql>[] = [];
  if (filters.entity)     conds.push(sql`entity = ${filters.entity}`);
  if (filters.action)     conds.push(sql`action = ${filters.action}`);
  if (filters.entityId)   conds.push(sql`entity_id = ${filters.entityId}`);
  if (filters.actorEmail) conds.push(sql`actor_email ilike ${"%" + filters.actorEmail + "%"}`);

  const where = conds.length ? sql`where ${sql.join(conds, sql` and `)}` : sql``;

  const rows = await db.execute<{
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
  }>(sql`
    select id, at, actor_id, actor_email, entity, entity_id, action,
           changes, diff, row_pk
    from audit_log
    ${where}
    order by at desc
    limit ${pageSize} offset ${offset}
  `);

  const [{ count }] = (
    await db.execute<{ count: number }>(
      sql`select count(*)::int as count from audit_log ${where}`,
    )
  ).rows;

  return { rows: rows.rows, total: count, page, pageSize };
}

export async function listAuditForEntity(entity: string, entityId: string) {
  return db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.entity, entity), eq(auditLog.entityId, entityId)))
    .orderBy(desc(auditLog.at))
    .limit(200);
}

/**
 * Timeline for one report: every change to the report header AND every
 * change to any of its items. Useful on the report preview page.
 */
export async function listAuditForReport(reportId: string) {
  const rows = await db.execute<{
    id: number;
    at: string;
    actor_email: string | null;
    entity: string;
    entity_id: string;
    action: string;
    diff: Record<string, { from: unknown; to: unknown }> | null;
  }>(sql`
    select id, at, actor_email, entity, entity_id, action, diff
    from audit_log
    where (entity = 'survey_reports' and entity_id = ${reportId})
       or (entity = 'report_items'
           and changes->>'report_id' = ${reportId})
    order by at asc
  `);
  return rows.rows;
}

export async function listRecentActors() {
  const rows = await db.execute<{ actor_email: string; n: number }>(sql`
    select actor_email, count(*)::int as n
    from audit_log
    where actor_email is not null
      and at > now() - interval '90 days'
    group by actor_email
    order by n desc
    limit 30
  `);
  return rows.rows;
}