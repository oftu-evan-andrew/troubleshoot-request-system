"use client";

import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/usePagination";
import {
  useCancelRequestMutation,
  useEscalateRequestMutation,
  useGetQueueQuery,
  useListRequestsQuery,
  useProcessNextMutation,
  useResolveRequestMutation,
} from "@/lib/api/requestsApi";
import { RequestDto } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export default function StaffDashboardPage() {
  return (
    <RequireStaffAuth>
      <StaffNav />
      <DashboardContent />
    </RequireStaffAuth>
  );
}

function DashboardContent() {
  const { data: queue, isLoading: queueLoading } = useGetQueueQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  const { data: inProgress, isLoading: inProgressLoading } = useListRequestsQuery(
    { status: "InProgress" },
    { pollingInterval: POLL_INTERVAL_MS },
  );

  const [processNext, { isLoading: processing }] = useProcessNextMutation();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Pending queue</h2>
          <Button onClick={() => processNext()} disabled={processing || !queue?.length}>
            {processing ? "Processing..." : "Process next"}
          </Button>
        </div>
        <RequestTable
          requests={queue}
          isLoading={queueLoading}
          emptyLabel="No pending requests."
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">In progress</h2>
        <InProgressTable requests={inProgress} isLoading={inProgressLoading} />
      </section>
    </main>
  );
}

const thClass = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted";

function RequestTable({
  requests,
  isLoading,
  emptyLabel,
}: {
  requests: RequestDto[] | undefined;
  isLoading: boolean;
  emptyLabel: string;
}) {
  const pager = usePagination(requests);

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading...</p>;
  }

  if (!requests?.length) {
    return (
      <Card className="px-4 py-6 text-center text-sm text-ink-muted">{emptyLabel}</Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas">
          <tr>
            <th className={thClass}>Ref</th>
            <th className={thClass}>Location</th>
            <th className={thClass}>Reporter</th>
            <th className={thClass}>Issue</th>
            <th className={thClass}>Priority</th>
            <th className={thClass}>Status</th>
          </tr>
        </thead>
        <tbody>
          {pager.pageItems.map((r) => (
            <tr key={r.id} className="border-t border-hairline">
              <td className="px-4 py-2.5 font-mono text-ink-muted">
                REQ-{String(r.id).padStart(4, "0")}
              </td>
              <td className="px-4 py-2.5 font-mono text-ink">
                {r.labName} &middot; {r.seatNumber}
              </td>
              <td className="px-4 py-2.5 text-ink">{r.reporterName}</td>
              <td className="max-w-xs truncate px-4 py-2.5 text-ink" title={r.issueDescription}>
                {r.issueDescription}
              </td>
              <td className="px-4 py-2.5">
                <PriorityBadge priority={r.priority} />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination {...pager} onPageChange={pager.setPage} />
    </Card>
  );
}

function InProgressTable({
  requests,
  isLoading,
}: {
  requests: RequestDto[] | undefined;
  isLoading: boolean;
}) {
  const [resolveRequest] = useResolveRequestMutation();
  const [escalateRequest] = useEscalateRequestMutation();
  const [cancelRequest] = useCancelRequestMutation();
  const pager = usePagination(requests);

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading...</p>;
  }

  if (!requests?.length) {
    return (
      <Card className="px-4 py-6 text-center text-sm text-ink-muted">
        Nothing being worked on right now.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas">
          <tr>
            <th className={thClass}>Ref</th>
            <th className={thClass}>Location</th>
            <th className={thClass}>Issue</th>
            <th className={thClass}>Priority</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pager.pageItems.map((r) => (
            <tr key={r.id} className="border-t border-hairline">
              <td className="px-4 py-2.5 font-mono text-ink-muted">
                REQ-{String(r.id).padStart(4, "0")}
              </td>
              <td className="px-4 py-2.5 font-mono text-ink">
                {r.labName} &middot; {r.seatNumber}
              </td>
              <td className="max-w-xs truncate px-4 py-2.5 text-ink" title={r.issueDescription}>
                {r.issueDescription}
              </td>
              <td className="px-4 py-2.5">
                <PriorityBadge priority={r.priority} />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolveRequest(r.id)}>
                    Resolve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => escalateRequest(r.id)}>
                    Not fixed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancelRequest(r.id)}>
                    Cancel
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination {...pager} onPageChange={pager.setPage} />
    </Card>
  );
}
