"use client";

import { useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { IssueCell } from "@/components/IssueCell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pagination } from "@/components/ui/Pagination";
import { scrollListClass, stickyHeadClass } from "@/lib/ui";
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
import { extractErrorMessage } from "@/lib/errors";
import { formatAge, formatRef } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { toastShown } from "@/store/toastSlice";

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
  const dispatch = useAppDispatch();

  async function handleProcessNext() {
    try {
      const result = await processNext().unwrap();
      dispatch(
        "id" in result
          ? toastShown({
              message: `Now working on ${formatRef(result.id)} — ${result.labName} · ${result.seatNumber}`,
              tone: "success",
            })
          : toastShown(result.message),
      );
    } catch (err) {
      dispatch(toastShown({ message: extractErrorMessage(err), tone: "error" }));
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            Pending queue
            {!!queue?.length && (
              <span className="ml-2 text-sm font-normal text-ink-muted">{queue.length}</span>
            )}
          </h2>
          <Button onClick={handleProcessNext} disabled={processing || !queue?.length}>
            {processing ? "Processing..." : "Process next"}
          </Button>
        </div>
        <RequestTable
          requests={queue}
          isLoading={queueLoading}
          emptyLabel="No pending requests. New ones will appear here automatically."
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
    <Card className="overflow-hidden">
      <div className={scrollListClass}>
        <table className="w-full text-left text-sm">
          <thead className={stickyHeadClass}>
            <tr>
              <th className={thClass}>Ref</th>
              <th className={thClass}>Location</th>
              <th className={thClass}>Reporter</th>
              <th className={thClass}>Issue</th>
              <th className={thClass}>Priority</th>
              <th className={thClass}>Waiting</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((r) => (
              <tr key={r.id} className="border-t border-hairline align-top">
                <td className="px-4 py-2.5 font-mono text-ink-muted">{formatRef(r.id)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink">
                  {r.labName} &middot; {r.seatNumber}
                </td>
                <td className="px-4 py-2.5 text-ink">{r.reporterName}</td>
                <IssueCell text={r.issueDescription} />
                <td className="px-4 py-2.5">
                  <PriorityBadge priority={r.priority} />
                </td>
                <td
                  className="whitespace-nowrap px-4 py-2.5 text-ink-muted"
                  title={new Date(r.timeSubmitted).toLocaleString()}
                >
                  {formatAge(r.timeSubmitted)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const dispatch = useAppDispatch();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function runAction(
    r: RequestDto,
    action: (id: number) => { unwrap: () => Promise<unknown> },
    outcome: string,
  ) {
    setBusyId(r.id);
    try {
      await action(r.id).unwrap();
      dispatch(toastShown({ message: `${formatRef(r.id)} ${outcome}`, tone: "success" }));
    } catch (err) {
      dispatch(toastShown({ message: extractErrorMessage(err), tone: "error" }));
    } finally {
      setBusyId(null);
    }
  }

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
    <Card className="overflow-hidden">
      <div className={scrollListClass}>
        <table className="w-full text-left text-sm">
          <thead className={stickyHeadClass}>
            <tr>
              <th className={thClass}>Ref</th>
              <th className={thClass}>Location</th>
              <th className={thClass}>Issue</th>
              <th className={thClass}>Priority</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((r) => {
              const busy = busyId === r.id;
              return (
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => runAction(r, resolveRequest, "marked resolved.")}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        title="Send it back to the queue with higher priority"
                        onClick={() =>
                          runAction(r, escalateRequest, "sent back to the queue as not fixed.")
                        }
                      >
                        Not fixed
                      </Button>
                      <ConfirmButton
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        confirmLabel="Confirm cancel"
                        onConfirm={() => runAction(r, cancelRequest, "cancelled.")}
                      >
                        Cancel
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination {...pager} onPageChange={pager.setPage} />
    </Card>
  );
}
