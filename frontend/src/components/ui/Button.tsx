import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "dangerOutline" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "bg-surface text-ink border border-hairline-strong hover:bg-canvas disabled:opacity-50",
  danger: "bg-red-ink text-white hover:bg-red-ink/90 disabled:opacity-50",
  dangerOutline:
    "border border-red-ink/30 bg-red-tint text-red-ink hover:bg-red-ink/15 disabled:opacity-50",
  ghost: "text-ink-muted hover:text-ink disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
