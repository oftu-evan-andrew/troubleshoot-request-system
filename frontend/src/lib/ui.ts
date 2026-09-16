// Shared Tailwind class strings for form controls, so every page's inputs,
// selects, and textareas look identical without wrapping each one in a
// component (label/error placement differs enough per form to not be worth it).
export const fieldClass =
  "rounded-md border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-faint";

export const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink";
