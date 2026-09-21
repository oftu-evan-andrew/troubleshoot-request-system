"use client";

import { useEffect, useRef } from "react";
import { useGetQueueQuery } from "@/lib/api/requestsApi";
import { useAppDispatch } from "@/store/hooks";
import { toastShown } from "@/store/toastSlice";

const POLL_INTERVAL_MS = 5000;
const MAX_INDIVIDUAL_TOASTS = 3;

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

    const known = knownIds.current;
    const arrivals = queue.filter((r) => !known.has(r.id));

    for (const r of arrivals.slice(0, MAX_INDIVIDUAL_TOASTS)) {
      dispatch(
        toastShown(
          `New request REQ-${String(r.id).padStart(4, "0")} — ${r.labName} · ${r.seatNumber}`,
        ),
      );
    }

    const overflow = arrivals.length - MAX_INDIVIDUAL_TOASTS;
    if (overflow > 0) {
      dispatch(toastShown(`+${overflow} more new requests`));
    }

    knownIds.current = new Set(queue.map((r) => r.id));
  }, [queue, dispatch]);

  return null;
}
