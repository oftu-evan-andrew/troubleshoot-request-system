// Shared Tailwind class strings for form controls, so every page's inputs,
// selects, and textareas look identical without wrapping each one in a
// component (label/error placement differs enough per form to not be worth it).
export const fieldClass =
  "rounded-md border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-faint";

export const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink";

// Lists inside cards scroll within their own box, with the header pinned,
// instead of stretching the page. Pagination sits outside the scroll area so
// it stays reachable.
export const scrollListClass = "max-h-96 overflow-auto";
export const stickyHeadClass = "sticky top-0 z-10 bg-canvas shadow-[inset_0_-1px_0_var(--color-hairline)]";
