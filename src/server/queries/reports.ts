import "server-only";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "~db/index";
import { reportItems, surveyReports } from "~db/schema";

// replace listReportsPaged in src/server/queries/reports.ts

export async function listReportsPaged(opts: {
    plate?: string;
    chassis?: string;
    status?: "draft" | "finalized" | "void";
    branchId?: number;
    dateFrom?: string;
    dateTo?: string;
    surveyorId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(10, opts.pageSize ?? 25));
    const offset = (page - 1) * pageSize;
  
    // Use the table alias `r` consistently so Postgres can resolve every column.
    const conds: ReturnType<typeof sql>[] = [];
    if (opts.plate)     conds.push(sql`upper(r.plate_no) like ${"%" + opts.plate.toUpperCase() + "%"}`);
    if (opts.chassis)   conds.push(sql`upper(r.chassis_no) like ${"%" + opts.chassis.toUpperCase() + "%"}`);
    if (opts.status)    conds.push(sql`r.status = ${opts.status}`);
    if (opts.branchId)  conds.push(sql`r.branch_id = ${opts.branchId}`);
    if (opts.surveyorId) conds.push(sql`r.surveyor_id = ${opts.surveyorId}::uuid`);
    if (opts.dateFrom)  conds.push(sql`r.report_date >= ${opts.dateFrom}`);
    if (opts.dateTo)    conds.push(sql`r.report_date <= ${opts.dateTo}`);
  
    const where = conds.length ? sql`where ${sql.join(conds, sql` and `)}` : sql``;
  
    const rows = await db.execute<{
      id: string;
      report_no: string | null;
      report_date: string;
      plate_no: string | null;
      chassis_no: string | null;
      status: "draft" | "finalized" | "void";
      coverage: "comprehensive" | "third_party" | null;
      branch_code: string;
    }>(sql`
      select r.id, r.report_no, r.report_date, r.plate_no, r.chassis_no, r.status,
             b.code as branch_code
      from survey_reports r
      join branches b on b.id = r.branch_id
      ${where}
      order by r.created_at desc
      limit ${pageSize} offset ${offset}
    `);
  
    const [{ count }] = (await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from survey_reports r
      ${where}
    `)).rows;
  
    return { rows: rows.rows, total: count, page, pageSize };
  }

export async function getReport(id: string) {
  const [report] = await db.select().from(surveyReports).where(eq(surveyReports.id, id)).limit(1);
  if (!report) return null;
  const items = await db.select().from(reportItems)
    .where(eq(reportItems.reportId, id))
    .orderBy(reportItems.action, reportItems.position);
  return { report, items };
}