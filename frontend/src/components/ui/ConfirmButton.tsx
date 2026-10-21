"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const ARM_TIMEOUT_MS = 3000;

type ButtonProps = React.ComponentProps<typeof Button>;

// Two-step button for destructive actions: the first click arms it (the label
// changes to `confirmLabel`), a second click within a few seconds runs
// `onConfirm`. Guards against misclicks without a blocking browser dialog.
export function ConfirmButton({
  confirmLabel,
  onConfirm,
  children,
  variant = "dangerOutline",
  ...props
}: Omit<ButtonProps, "onClick"> & { confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      {...props}
      variant={armed ? "danger" : variant}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
