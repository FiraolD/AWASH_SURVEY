import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { can } from "@/server/permissions";
import { env } from "@/lib/env";
import { LangSwitch } from "@/components/LangSwitch";
import { SignOutButton } from "@/components/SignOutButton";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const messages = getMessages(await getLocale());
  const role = session.user.role;
  const currentLocale = await getLocale();

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-[color:var(--line)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          {/* Brand */}
          <Link
            href={`/${locale}/reports`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Awash"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold">{messages.app.title}</div>
              <div className="text-[11px] text-[color:var(--mut)]">
                {messages.app.subtitle}
              </div>
            </div>
          </Link>

          {/* Navigation — driven by capabilities, not roles */}
          <AppNav
            locale={locale}
            canSeeParts={can(role, "parts.view")}
            canSeeUsers={can(role, "users.manage")}
            canSeeAudit={can(role, "audit.view")}
            canSeeSql={can(role, "sql.run") && env.ALLOW_SQL_CONSOLE}
            labels={{
              reports: messages.nav.reports,
              parts: messages.nav.parts,
              users: messages.nav.users,
              audit: messages.audit.title,
              sql: messages.nav.sql ?? "Database",
            }}
          />

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <LangSwitch current={currentLocale} />

            <div className="hidden items-center gap-2.5 rounded-full border border-[color:var(--line)] bg-[color:var(--bg)] py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--acc)] text-xs font-semibold text-white">
                {session.user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="text-sm font-medium">{session.user.name}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--acc)] ring-1 ring-[color:var(--line-2)]">
                {session.user.role}
              </span>
            </div>

            <SignOutButton label={messages.app.logout} locale={locale} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] p-4">{children}</div>
    </div>
  );
}