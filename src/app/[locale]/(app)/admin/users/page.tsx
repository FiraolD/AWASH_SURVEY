import { requireRole } from "@/server/permissions";
import { listUsersPaged } from "@/server/queries/users";
import { listBranches } from "@/server/queries/branches";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { auth } from "@/server/auth";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    role?: string;
    branch?: string;
    active?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  await requireRole("admin");
  const sp = await searchParams;

  const session = await auth();
  const branches = await listBranches();

  const { rows, total, page, pageSize } = await listUsersPaged({
    q: sp.q,
    role: (sp.role as "admin" | "supervisor" | "surveyor" | undefined) || undefined,
    branchId: sp.branch ? Number(sp.branch) : undefined,
    active: (sp.active as "all" | "active" | "inactive") ?? "all",
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-[color:var(--mut)]">
          Manage who can sign in, their role, and which branch they belong to
        </p>
      </header>

      <AdminUsersTable
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        branches={branches}
        currentUserId={session!.user.id}
        locale={locale}
      />
    </section>
  );
}