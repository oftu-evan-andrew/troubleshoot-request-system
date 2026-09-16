import { ComponentPropsWithoutRef, ElementType } from "react";

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      className={`rounded-lg border border-hairline bg-surface shadow-sm ${className}`}
      {...props}
    />
  );
}
