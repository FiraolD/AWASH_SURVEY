import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "~db/index";
import { branches, users } from "~db/schema";

/**
 * Kept for callers that still want a simple list (e.g. the old
 * admin/users page before pagination). New code should use
 * listUsersPaged().
 */
export async function listUsers() {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      branchId: users.branchId,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(asc(users.fullName));
}

export type UserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "admin" | "supervisor" | "surveyor";
  branchId: number | null;
  branchCode: string | null;
  branchNames: Record<string, string> | null;
  preferredLang: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function listUsersPaged(opts: {
  q?: string;
  role?: "admin" | "supervisor" | "surveyor";
  branchId?: number;
  active?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, opts.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const conds: ReturnType<typeof sql>[] = [];

  if (opts.q) {
    const like = `%${opts.q.toLowerCase()}%`;
    conds.push(sql`(
      lower(u.full_name) like ${like}
      or lower(u.email) like ${like}
      or coalesce(lower(u.phone), '') like ${like}
    )`);
  }
  if (opts.role) conds.push(sql`u.role = ${opts.role}`);
  if (opts.branchId) conds.push(sql`u.branch_id = ${opts.branchId}`);
  if (opts.active === "active") conds.push(sql`u.is_active = true`);
  if (opts.active === "inactive") conds.push(sql`u.is_active = false`);

  const where = conds.length
    ? sql`where ${sql.join(conds, sql` and `)}`
    : sql``;

  const rows = await db.execute<{
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: "admin" | "supervisor" | "surveyor";
    branch_id: number | null;
    branch_code: string | null;
    branch_names: Record<string, string> | null;
    preferred_lang: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
  }>(sql`
    select
      u.id, u.email, u.full_name, u.phone, u.role,
      u.branch_id, u.preferred_lang, u.is_active,
      u.last_login_at, u.created_at,
      b.code as branch_code,
      b.names as branch_names
    from users u
    left join branches b on b.id = u.branch_id
    ${where}
    order by u.is_active desc, u.created_at desc
    limit ${pageSize} offset ${offset}
  `);

  const [{ count }] = (
    await db.execute<{ count: number }>(
      sql`select count(*)::int as count from users u ${where}`,
    )
  ).rows;

  return {
    rows: rows.rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      phone: r.phone,
      role: r.role,
      branchId: r.branch_id,
      branchCode: r.branch_code,
      branchNames: r.branch_names,
      preferredLang: r.preferred_lang,
      isActive: r.is_active,
      lastLoginAt: r.last_login_at,
      createdAt: r.created_at,
    })) as UserRow[],
    total: count,
    page,
    pageSize,
  };
}

export async function getAdminCount(): Promise<number> {
  const [{ n }] = (
    await db.execute<{ n: number }>(
      sql`select count(*)::int as n from users where role = 'admin' and is_active = true`,
    )
  ).rows;
  return n;
}