"use client";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open, onClose, title, children, footer, width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade"
      style={{ background: "rgba(15,23,42,.35)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${width} anim-pop rounded-[var(--r-lg)] bg-white shadow-[var(--shadow-lg)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[color:var(--mut)] hover:bg-[color:var(--bg)] hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[color:var(--line)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-[var(--r)] border border-[color:var(--line-2)] bg-white px-3.5 py-2 text-sm hover:bg-[color:var(--bg)]"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={
              "rounded-[var(--r)] px-3.5 py-2 text-sm text-white " +
              (danger ? "bg-[color:var(--rep)] hover:bg-[color:var(--rep-h)]" : "bg-[color:var(--acc)] hover:bg-[color:var(--acc-h)]")
            }
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-[color:var(--ink-2)]">{message}</p>
    </Modal>
  );
}