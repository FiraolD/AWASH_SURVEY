import "server-only";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "~db/index";
import { parts, partTranslations } from "~db/schema";

export type PartHit = {
  id: string;
  names: Record<string, string>;
  usageCount: number;
};

export async function searchParts(q: string, limit = 40): Promise<PartHit[]> {
  const rows = await db.execute<{ part_id: string; names: Record<string, string>; usage_count: number }>(
    sql`SELECT * FROM search_parts(${q}, ${limit})`,
  );
  return rows.rows.map((r) => ({ id: r.part_id, names: r.names, usageCount: r.usage_count }));
}

export async function listPartsAdmin(limit = 200) {
  const rows = await db
    .select({
      id: parts.id,
      usageCount: parts.usageCount,
      source: parts.source,
      en: sql<string>`max(case when ${partTranslations.lang} = 'en' then ${partTranslations.name} end)`,
      am: sql<string>`max(case when ${partTranslations.lang} = 'am' then ${partTranslations.name} end)`,
    })
    .from(parts)
    .leftJoin(partTranslations, eq(partTranslations.partId, parts.id))
    .groupBy(parts.id)
    .orderBy(desc(parts.usageCount))
    .limit(limit);
  return rows;
}

export async function listUnmatchedCustomParts() {
  const rows = await db.execute<{
    en: string | null; am: string | null; times_used: number; last_used: string | null;
  }>(sql`SELECT en, am, times_used, last_used FROM v_custom_items_unmatched LIMIT 500`);
  return rows.rows.map((r) => ({
    en: r.en, am: r.am, timesUsed: r.times_used, lastUsed: r.last_used,
  }));
}

export async function getPartNames(partId: string): Promise<Record<string, string>> {
  const rows = await db.select({ lang: partTranslations.lang, name: partTranslations.name })
    .from(partTranslations).where(eq(partTranslations.partId, partId));
  return Object.fromEntries(rows.map((r) => [r.lang, r.name]));
}

// replace listPartsPaged in src/server/queries/parts.ts

export async function listPartsPaged(opts: {
    q?: string;
    active?: "all" | "active" | "inactive";
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(10, opts.pageSize ?? 25));
    const offset = (page - 1) * pageSize;
  
    // Build WHERE clauses using the alias `p` consistently so Postgres can
    // resolve every column against the FROM-clause entry.
    const conds: ReturnType<typeof sql>[] = [];
  
    if (opts.q) {
      const like = `%${opts.q.toLowerCase()}%`;
      conds.push(sql`exists (
        select 1
        from part_translations pt
        where pt.part_id = p.id
          and (lower(pt.name) like ${like} or pt.name_norm like ${like})
      )`);
    }
    if (opts.active === "active")   conds.push(sql`p.is_active = true`);
    if (opts.active === "inactive") conds.push(sql`p.is_active = false`);
  
    const where = conds.length
      ? sql`where ${sql.join(conds, sql` and `)}`
      : sql``;
  
    const rows = await db.execute<{
      id: string;
      code: string | null;
      is_active: boolean;
      usage_count: number;
      source: string;
      en: string | null;
      am: string | null;
    }>(sql`
      select
        p.id, p.code, p.is_active, p.usage_count, p.source,
        max(case when pt.lang = 'en' then pt.name end) as en,
        max(case when pt.lang = 'am' then pt.name end) as am
      from parts p
      left join part_translations pt on pt.part_id = p.id
      ${where}
      group by p.id
      order by p.usage_count desc, p.created_at desc
      limit ${pageSize} offset ${offset}
    `);
  
    const [{ count }] = (await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from parts p
      ${where}
    `)).rows;
  
    return { rows: rows.rows, total: count, page, pageSize };
  }