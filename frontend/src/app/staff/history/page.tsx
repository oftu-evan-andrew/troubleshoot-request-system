"use client";

import { useMemo, useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Card } from "@/components/ui/Card";
import { useListRequestsQuery } from "@/lib/api/requestsApi";
import { RequestStatus } from "@/lib/types";

const STATUS_FILTERS: { value: RequestStatus | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Cancelled", label: "Cancelled" },
];

const thClass = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted";

export default function StaffHistoryPage() {
  return (
    <RequireStaffAuth>
      <StaffNav />
      <HistoryContent />
    </RequireStaffAuth>
  );
}

function HistoryContent() {
  const [filter, setFilter] = useState<RequestStatus | "All">("All");
  const { data: requests, isLoading } = useListRequestsQuery(
    filter === "All" ? undefined : { status: filter },
  );

  const seatFrequency = useMemo(() => {
    if (!requests) return [];
    const counts = new Map<string, number>();
    for (const r of requests) {
      const key = `${r.labName} · ${r.seatNumber}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [requests]);

  const unitFrequency = useMemo(() => {
    if (!requests) return [];
    const counts = new Map<string, number>();
    for (const r of requests) {
      if (!r.unitAssetTag) continue;
      counts.set(r.unitAssetTag, (counts.get(r.unitAssetTag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [requests]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Request history</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as RequestStatus | "All")}
            className="rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-sm text-ink focus:border-primary"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}
        {!isLoading && !requests?.length && (
          <Card className="px-4 py-6 text-center text-sm text-ink-muted">
            No requests found.
          </Card>
        )}

        {!!requests?.length && (
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Ref</th>
                  <th className={thClass}>Location</th>
                  <th className={thClass}>Issue</th>
                  <th className={thClass}>Priority</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Submitted</th>
                  <th className={thClass}>Resolved by</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="px-4 py-2.5 font-mono text-ink-muted">
                      REQ-{String(r.id).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-ink">
                      {r.labName} &middot; {r.seatNumber}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-2.5 text-ink"
                      title={r.issueDescription}
                    >
                      {r.issueDescription}
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 text-ink-muted">
                      {new Date(r.timeSubmitted).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-ink-muted">{r.resolvedByName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Most frequently reported seats</h2>
          <FrequencyList items={seatFrequency} emptyLabel="Not enough data yet." />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Most frequently reported units</h2>
          <FrequencyList
            items={unitFrequency}
            emptyLabel="No requests are tied to a known unit yet."
          />
        </div>
      </section>
    </main>
  );
}

function FrequencyList({
  items,
  emptyLabel,
}: {
  items: [string, number][];
  emptyLabel: string;
}) {
  if (!items.length) {
    return <Card className="px-4 py-6 text-center text-sm text-ink-muted">{emptyLabel}</Card>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map(([label, count]) => (
        <li
          key={label}
          className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-2.5 font-mono text-ink shadow-sm"
        >
          <span>{label}</span>
          <span className="font-sans font-medium text-ink-muted">
            {count} {count === 1 ? "request" : "requests"}
          </span>
        </li>
      ))}
    </ul>
  );
}
