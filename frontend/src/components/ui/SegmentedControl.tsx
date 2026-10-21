"use client";

interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  name: string;
  className?: string;
}

// One-click alternative to a <select> for short option lists. Built on radio
// inputs so arrow keys move between options like a native radio group.
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  name,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`flex flex-wrap gap-1 rounded-md border border-hairline-strong bg-canvas p-1 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`flex-1 cursor-pointer whitespace-nowrap rounded px-3 py-1.5 text-center text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
              selected ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
