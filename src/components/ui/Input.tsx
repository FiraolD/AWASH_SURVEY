"use client";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

const BASE =
  "w-full rounded-[var(--r)] border border-[color:var(--line-2)] bg-white px-3 py-2 text-sm " +
  "placeholder:text-[color:var(--mut)] " +
  "focus:border-[color:var(--acc)] focus:outline-none focus:ring-2 focus:ring-[color:var(--acc-ring)] " +
  "disabled:bg-[color:var(--bg)] disabled:cursor-not-allowed transition-shadow";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${BASE} pr-8 ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = error ? `err-${label.replace(/\s+/g, "-")}` : undefined;
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[color:var(--mut)]">
        {label}
        {required && (
          <span className="ml-0.5 text-[color:var(--rep)]" aria-hidden>*</span>
        )}
      </span>
      <div className={error ? "rounded-[var(--r)] ring-2 ring-[color:var(--rep)]/30" : ""}>
        {children}
      </div>
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-[color:var(--rep)]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[color:var(--mut)]">{hint}</span>
      ) : null}
    </label>
  );
}