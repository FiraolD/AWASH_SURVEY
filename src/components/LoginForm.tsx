"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";

export function LoginForm({
  action,
  locale,
  messages,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
  messages: Messages;
  error: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md anim-slide">
      {/* Mobile brand — shows above the form on small screens */}
      <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[color:var(--line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Awash" className="h-8 w-8 rounded-lg object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{messages.app.title}</div>
          <div className="text-[11px] text-[color:var(--mut)]">
            {messages.app.subtitle}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white p-8 shadow-[var(--shadow-lg)] sm:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {messages.login.title}
          </h1>
          <p className="mt-1.5 text-sm text-[color:var(--mut)]">
            {locale === "am"
              ? "ወደ መለያዎ ለመግባት ዝርዝሮችዎን ያስገቡ።"
              : "Enter your credentials to access the surveyor workspace."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-[var(--r)] border border-[#fecaca] bg-[color:var(--rep-2)] px-3.5 py-3 anim-fade">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[color:var(--rep)] text-[10px] font-bold text-white">
              !
            </span>
            <div className="text-sm text-[color:var(--rep)]">
              {messages.login.error}
            </div>
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-[color:var(--mut)]"
            >
              {messages.login.email}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[color:var(--mut)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 5L2 7" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@awash.example"
                className="w-full rounded-[var(--r)] border border-[color:var(--line-2)] bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-[color:var(--mut)] focus:border-[color:var(--acc)] focus:outline-none focus:ring-2 focus:ring-[color:var(--acc-ring)] transition-shadow"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-[color:var(--mut)]"
            >
              {messages.login.password}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[color:var(--mut)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-[var(--r)] border border-[color:var(--line-2)] bg-white py-2.5 pl-10 pr-11 text-sm placeholder:text-[color:var(--mut)] focus:border-[color:var(--acc)] focus:outline-none focus:ring-2 focus:ring-[color:var(--acc-ring)] transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--mut)] hover:text-ink transition-colors"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <SubmitButton label={messages.login.submit} />
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[color:var(--line)]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--mut)]">
            {locale === "am" ? "ወይም" : "or"}
          </span>
          <div className="h-px flex-1 bg-[color:var(--line)]" />
        </div>

        {/* Language switcher */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-[color:var(--mut)]">
            {locale === "am" ? "ቋንቋ" : "Language"}:
          </span>
          <div className="inline-flex overflow-hidden rounded-md border border-[color:var(--line-2)] bg-white">
            <a
              href="/en/login"
              className={
                "px-3 py-1 text-xs font-medium transition-colors " +
                (locale === "en"
                  ? "bg-[color:var(--acc)] text-white"
                  : "text-[color:var(--ink-2)] hover:bg-[color:var(--bg)]")
              }
            >
              English
            </a>
            <a
              href="/am/login"
              className={
                "border-l border-[color:var(--line-2)] px-3 py-1 text-xs font-medium transition-colors " +
                (locale === "am"
                  ? "bg-[color:var(--acc)] text-white"
                  : "text-[color:var(--ink-2)] hover:bg-[color:var(--bg)]")
              }
            >
              አማርኛ
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-[color:var(--mut)]">
        {locale === "am"
          ? "ችግር ካለ የቢሮ አስተዳዳሪዎን ያነጋግሩ።"
          : "Need access? Contact your branch administrator."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[var(--r)] bg-[color:var(--acc)] px-5 font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[color:var(--acc-h)] disabled:cursor-not-allowed disabled:opacity-70 active:translate-y-px"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Signing in…</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  );
}