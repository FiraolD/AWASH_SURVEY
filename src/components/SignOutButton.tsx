"use client";
import { doSignOut } from "@/server/actions/auth";

export function SignOutButton({ label, locale }: { label: string; locale: string }) {
  return (
    <form action={() => doSignOut(locale)}>
      <button type="submit" className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-bg">
        {label}
      </button>
    </form>
  );
}