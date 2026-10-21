"use client";

import { useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { PasswordField } from "@/components/ui/PasswordField";
import { extractErrorMessage } from "@/lib/errors";
import { fieldClass, labelClass, scrollListClass, stickyHeadClass } from "@/lib/ui";
import { usePagination } from "@/lib/usePagination";
import { useListStaffQuery, useRegisterStaffMutation } from "@/lib/api/authApi";

export default function StaffSettingsPage() {
  return (
    <RequireStaffAuth>
      <StaffNav />
      <SettingsContent />
    </RequireStaffAuth>
  );
}

function SettingsContent() {
  const { data: staff, isLoading } = useListStaffQuery();
  const [registerStaff, { isLoading: registering }] = useRegisterStaffMutation();
  const pager = usePagination(staff);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const created = await registerStaff({ name, email, password }).unwrap();
      setSuccess(`${created.name} can now sign in.`);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">IT staff accounts</h2>
        {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}
        {!isLoading && !staff?.length && (
          <Card className="px-4 py-6 text-center text-sm text-ink-muted">
            No staff accounts found.
          </Card>
        )}
        {!!staff?.length && (
          <Card className="overflow-hidden">
            <div className={scrollListClass}>
              <table className="w-full text-left text-sm">
                <thead className={stickyHeadClass}>
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageItems.map((s) => (
                    <tr key={s.id} className="border-t border-hairline">
                      <td className="px-4 py-2.5 text-ink">{s.name}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pager} onPageChange={pager.setPage} />
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Register a new staff account</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Every IT staff account has the same access &mdash; there&apos;s no separate admin tier.
        </p>
        <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <label className={labelClass}>
            Name
            <input
              required
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Email
            <input
              required
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>

          <PasswordField
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            hint="At least 6 characters, with an uppercase letter, a lowercase letter, a number, and a symbol."
          />

          {error && <p className="text-sm text-red-ink">{error}</p>}
          {success && <p className="text-sm text-green-ink">{success}</p>}

          <Button type="submit" disabled={registering} className="mt-2 w-full">
            {registering ? "Registering..." : "Register staff account"}
          </Button>
        </Card>
      </section>
    </main>
  );
}
