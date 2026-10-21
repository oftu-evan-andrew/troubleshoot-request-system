"use client";

import { useState } from "react";
import { fieldClass, labelClass } from "@/lib/ui";

// Password input with a show/hide toggle, so a typo can be checked instead of
// retyping the whole thing after a failed attempt.
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={labelClass}>
      {label}
      <span className="relative flex">
        <input
          required
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pr-16 ${fieldClass}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink-muted hover:text-primary"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
      {hint && <span className="text-xs font-normal text-ink-muted">{hint}</span>}
    </label>
  );
}
