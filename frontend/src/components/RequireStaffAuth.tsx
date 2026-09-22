"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useMeQuery } from "@/lib/api/authApi";
import { NewRequestWatcher } from "@/components/NewRequestWatcher";

// Client-side gate: redirects to the login page if there's no token, or if
// a stored token turns out to be invalid or expired. Every request-mutating
// API call is still independently protected by the backend's [Authorize]
// attribute, so this is a UX convenience, not the system's actual security
// boundary.
export function RequireStaffAuth({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const router = useRouter();

  // Confirms a locally stored token is still accepted by the server before
  // trusting it — otherwise a stale token would render the portal for a
  // moment before the first real API call bounced with 401.
  const { isSuccess: verified, isError: rejected } = useMeQuery(undefined, {
    skip: !hydrated || !token,
  });

  useEffect(() => {
    if (hydrated && (!token || rejected)) {
      router.replace("/staff/login");
    }
  }, [hydrated, token, rejected, router]);

  if (!hydrated || !token) {
    return null;
  }

  if (!verified) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center px-6">
        <p className="text-sm text-ink-muted">Verifying your session&hellip;</p>
      </main>
    );
  }

  return (
    <>
      <NewRequestWatcher />
      {children}
    </>
  );
}
