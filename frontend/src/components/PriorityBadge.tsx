import { RequestPriority } from "@/lib/types";

const STYLES: Record<RequestPriority, string> = {
  Low: "bg-slate-tint text-slate-ink",
  Normal: "bg-primary-tint text-primary",
  High: "bg-amber-tint text-amber-ink",
  Exam: "bg-red-tint text-red-ink",
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}
