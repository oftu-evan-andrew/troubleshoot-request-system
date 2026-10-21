"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toastDismissed, ToastItem, ToastTone } from "@/store/toastSlice";

const AUTO_DISMISS_MS = 6000;

const ICONS: Record<ToastTone, { glyph: string; className: string }> = {
  info: { glyph: "!", className: "bg-primary-tint text-primary" },
  success: { glyph: "✓", className: "bg-green-tint text-green-ink" },
  error: { glyph: "×", className: "bg-red-tint text-red-ink" },
};

export function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.items);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dispatch = useAppDispatch();
  const { id, message, tone } = toast;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(toastDismissed(id)), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-hairline bg-surface px-4 py-3 text-sm shadow-lg"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${ICONS[tone].className}`}
      >
        {ICONS[tone].glyph}
      </span>
      <p className="flex-1 text-ink">{message}</p>
      <button
        onClick={() => dispatch(toastDismissed(id))}
        className="text-ink-faint hover:text-ink-muted"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
