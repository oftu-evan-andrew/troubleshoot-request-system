"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { NewRequestWatcher } from "@/components/NewRequestWatcher";

// Client-side gate: redirects to the login page if there's no token.
// Every request-mutating API call is still independently protected by the
// backend's [Authorize] attribute, so this is a UX convenience, not the
// system's actual security boundary.
export function RequireStaffAuth({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/staff/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return null;
  }

  return (
    <>
      <NewRequestWatcher />
      {children}
    </>
  );
}
