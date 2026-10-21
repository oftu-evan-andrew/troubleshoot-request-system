"use client";

import { useMemo, useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { IssueCell } from "@/components/IssueCell";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { usePagination } from "@/lib/usePagination";
import { useListRequestsQuery } from "@/lib/api/requestsApi";
import { RequestStatus } from "@/lib/types";
import { formatRef } from "@/lib/format";
import { fieldClass, scrollListClass, stickyHeadClass } from "@/lib/ui";

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
  const [search, setSearch] = useState("");
  const { data: requests, isLoading } = useListRequestsQuery(
    filter === "All" ? undefined : { status: filter },
  );

  // Matches against everything staff are likely to remember about a request:
  // its reference, where it was, who reported it, or what they wrote.
  const matching = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!requests || !term) return requests;
    return requests.filter((r) =>
      [
        formatRef(r.id),
        String(r.id),
        `${r.labName} ${r.seatNumber}`,
        r.reporterName,
        r.reporterId,
        r.unitAssetTag ?? "",
        r.issueDescription,
        r.resolvedByName ?? "",
      ].some((field) => field.toLowerCase().includes(term)),
    );
  }, [requests, search]);
  const pager = usePagination(matching);

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-8">
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink">Request history</h2>
          <SegmentedControl
            name="status-filter"
            value={filter}
            options={STATUS_FILTERS}
            onChange={(value) => {
              setFilter(value);
              pager.setPage(1);
            }}
          />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pager.setPage(1);
          }}
          placeholder="Search by reference, seat, reporter, unit, or issue..."
          aria-label="Search requests"
          className={`mb-3 w-full ${fieldClass}`}
        />

        {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}
        {!isLoading && !matching?.length && (
          <Card className="px-4 py-6 text-center text-sm text-ink-muted">
            {search.trim() ? `No requests match "${search.trim()}".` : "No requests found."}
          </Card>
        )}

        {!!matching?.length && (
          <Card className="overflow-hidden">
            <div className={scrollListClass}>
              <table className="w-full text-left text-sm">
                <thead className={stickyHeadClass}>
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
                  {pager.pageItems.map((r) => (
                    <tr key={r.id} className="border-t border-hairline align-top">
                      <td className="px-4 py-2.5 font-mono text-ink-muted">{formatRef(r.id)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink">
                        {r.labName} &middot; {r.seatNumber}
                      </td>
                      <IssueCell text={r.issueDescription} />
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
            </div>
            <Pagination {...pager} onPageChange={pager.setPage} />
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
