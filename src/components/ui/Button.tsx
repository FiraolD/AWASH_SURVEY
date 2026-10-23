"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost" | "outline-danger" | "icon";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[color:var(--acc)] text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--acc-h)] disabled:opacity-50",
  secondary:
    "bg-white text-ink border border-[color:var(--line-2)] shadow-[var(--shadow-xs)] hover:bg-[color:var(--bg)] disabled:opacity-50",
  danger:
    "bg-[color:var(--rep)] text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--rep-h)] disabled:opacity-50",
  success:
    "bg-[color:var(--success)] text-white shadow-[var(--shadow-sm)] hover:opacity-90 disabled:opacity-50",
  ghost:
    "text-ink-2 hover:bg-[color:var(--bg)] hover:text-ink",
  "outline-danger":
    "border border-[#fecaca] text-[color:var(--rep)] hover:bg-[color:var(--rep-2)]",
  icon:
    "text-[color:var(--mut)] hover:bg-[color:var(--bg)] hover:text-ink p-1.5 rounded-md",
};

const SIZES: Record<Size, string> = {
  xs: "h-7 px-2 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center rounded-[var(--r)] font-medium",
        "disabled:cursor-not-allowed whitespace-nowrap select-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
});