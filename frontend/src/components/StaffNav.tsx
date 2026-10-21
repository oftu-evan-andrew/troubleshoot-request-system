"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/authSlice";
import { baseApi } from "@/lib/api/baseApi";
import { useGetQueueQuery } from "@/lib/api/requestsApi";

const LINKS = [
  { href: "/staff/dashboard", label: "Queue" },
  { href: "/staff/history", label: "History" },
  { href: "/staff/labs", label: "Labs" },
  { href: "/staff/settings", label: "Settings" },
];

export function StaffNav() {
  const pathname = usePathname();
  const staff = useAppSelector((state) => state.auth.staff);
  const dispatch = useAppDispatch();
  const router = useRouter();
  // Shares the cache entry NewRequestWatcher already polls, so the count stays
  // live on every staff page without an extra request.
  const { data: queue } = useGetQueueQuery();
  const pendingCount = queue?.length ?? 0;

  function handleLogout() {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    router.replace("/staff/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-hairline bg-surface px-6">
      <div className="flex items-center gap-6">
        <span className="py-3.5 text-sm font-semibold text-ink">Staff console</span>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 py-3.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {link.label}
              {link.href === "/staff/dashboard" && !!pendingCount && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-muted">{staff?.name}</span>
        <button onClick={handleLogout} className="font-medium text-ink-muted hover:text-primary">
          Log out
        </button>
      </div>
    </nav>
  );
}
