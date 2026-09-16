"use client";

import { useEffect, useRef } from "react";
import { useGetQueueQuery } from "@/lib/api/requestsApi";
import { useAppDispatch } from "@/store/hooks";
import { toastShown } from "@/store/toastSlice";

const POLL_INTERVAL_MS = 5000;

// Mounted wherever staff are signed in, regardless of which page they're on.
// Diffs each poll against the previously seen IDs so only genuinely new
// arrivals toast — the first poll just establishes the baseline.
export function NewRequestWatcher() {
  const { data: queue } = useGetQueueQuery(undefined, { pollingInterval: POLL_INTERVAL_MS });
  const dispatch = useAppDispatch();
  const knownIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!queue) return;

    if (knownIds.current === null) {
      knownIds.current = new Set(queue.map((r) => r.id));
      return;
    }

    for (const r of queue) {
      if (!knownIds.current.has(r.id)) {
        dispatch(
          toastShown(
            `New request REQ-${String(r.id).padStart(4, "0")} — ${r.labName} · ${r.seatNumber}`,
          ),
        );
      }
    }

    knownIds.current = new Set(queue.map((r) => r.id));
  }, [queue, dispatch]);

  return null;
}
