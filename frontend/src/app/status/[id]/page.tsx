"use client";

import { use } from "react";
import Link from "next/link";
import { useGetRequestByIdQuery } from "@/lib/api/requestsApi";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const requestId = Number(id);
  const { data: request, isLoading, isError } = useGetRequestByIdQuery(requestId, {
    skip: Number.isNaN(requestId),
  });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <Link href="/" className="mb-6 text-sm text-ink-muted hover:text-primary">
        &larr; Report another issue
      </Link>

      <h1 className="mb-1 text-2xl font-semibold text-ink">
        Request <span className="font-mono">REQ-{String(requestId).padStart(4, "0")}</span>
      </h1>

      {isLoading && <p className="mt-4 text-sm text-ink-muted">Loading...</p>}
      {isError && (
        <p className="mt-4 text-sm text-red-ink">No request found with that reference number.</p>
      )}

      {request && (
        <Card className="mt-5 flex flex-col gap-3 p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Status</span>
            <StatusBadge status={request.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Location</span>
            <span className="font-mono text-ink">
              {request.labName} &middot; {request.seatNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Priority</span>
            <span className="text-ink">{request.priority}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-ink-muted">Issue</span>
            <p className="text-ink">{request.issueDescription}</p>
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-3">
            <span className="text-ink-muted">Submitted</span>
            <span className="text-ink">{new Date(request.timeSubmitted).toLocaleString()}</span>
          </div>
          {request.timeResolved && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Resolved</span>
              <span className="text-ink">{new Date(request.timeResolved).toLocaleString()}</span>
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
