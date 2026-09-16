import { RequestStatus } from "@/lib/types";

const STYLES: Record<RequestStatus, string> = {
  Pending: "bg-amber-tint text-amber-ink",
  InProgress: "bg-primary-tint text-primary",
  Resolved: "bg-green-tint text-green-ink",
  Cancelled: "bg-slate-tint text-slate-ink",
};

const LABELS: Record<RequestStatus, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
  Resolved: "Resolved",
  Cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
