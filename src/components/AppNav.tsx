"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function AppNav({
  locale,
  canSeeParts,
  canSeeUsers,
  canSeeAudit,
  canSeeSql,
  labels,
}: {
  locale: string;
  canSeeParts: boolean;
  canSeeUsers: boolean;
  canSeeAudit: boolean;
  canSeeSql: boolean;
  labels: {
    reports: string;
    parts: string;
    users?: string;
    audit?: string;
    sql?: string;
  };
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: `/${locale}/reports`,
      label: labels.reports,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
    },
  ];

  if (canSeeParts) {
    items.push({
      href: `/${locale}/admin/parts`,
      label: labels.parts,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      ),
    });
  }

  if (canSeeUsers && labels.users) {
    items.push({
      href: `/${locale}/admin/users`,
      label: labels.users,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      ),
    });
  }

  if (canSeeAudit && labels.audit) {
    items.push({
      href: `/${locale}/admin/audit`,
      label: labels.audit,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      ),
    });
  }

  if (canSeeSql && labels.sql) {
    items.push({
      href: `/${locale}/admin/sql`,
      label: labels.sql,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="ml-6 flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--bg)] p-1">
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              "group relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all " +
              (active
                ? "bg-white text-[color:var(--acc)] shadow-[var(--shadow-xs)] ring-1 ring-[color:var(--line-2)]"
                : "text-[color:var(--ink-2)] hover:bg-white/70 hover:text-ink")
            }
          >
            <span
              className={
                "transition-colors " +
                (active
                  ? "text-[color:var(--acc)]"
                  : "text-[color:var(--mut)] group-hover:text-ink")
              }
            >
              {it.icon}
            </span>
            <span>{it.label}</span>
            {active && (
              <span className="absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[color:var(--acc)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}