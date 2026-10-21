"use client";

import { useMemo, useRef, useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pagination } from "@/components/ui/Pagination";
import { extractErrorMessage } from "@/lib/errors";
import { expandSeatNumbers, MAX_SEATS_PER_ADD } from "@/lib/seatNumbers";
import { fieldClass, labelClass, scrollListClass, stickyHeadClass } from "@/lib/ui";
import { usePagination } from "@/lib/usePagination";
import {
  useAssignUnitMutation,
  useCreateLabMutation,
  useCreateSeatMutation,
  useCreateUnitMutation,
  useDeleteLabMutation,
  useDeleteSeatMutation,
  useDeleteUnitMutation,
  useListLabsQuery,
  useListUnitsQuery,
  useUpdateUnitStatusMutation,
} from "@/lib/api/labsApi";
import { ComputerUnitStatus, LabDto, SeatDto } from "@/lib/types";
import { useAppDispatch } from "@/store/hooks";
import { toastShown } from "@/store/toastSlice";

const UNIT_STATUSES: { value: ComputerUnitStatus; label: string }[] = [
  { value: "Operational", label: "Operational" },
  { value: "UnderMaintenance", label: "Under maintenance" },
  { value: "OutOfService", label: "Out of service" },
];

const compactFieldClass =
  "rounded-md border border-hairline-strong bg-surface px-2 py-1 text-xs text-ink focus:border-primary";

// Feedback for this page goes through toasts, so it shows up next to whatever
// the staff member just did instead of in a banner at the top of the page.
function useNotify() {
  const dispatch = useAppDispatch();
  return {
    success: (message: string) => dispatch(toastShown({ message, tone: "success" })),
    error: (err: unknown) =>
      dispatch(toastShown({ message: extractErrorMessage(err), tone: "error" })),
  };
}

function useSeatOptions() {
  const { data: labs } = useListLabsQuery();
  return useMemo(
    () =>
      (labs ?? []).flatMap((lab) =>
        lab.seats.map((seat) => ({
          id: seat.id,
          label: `${lab.labName} · ${seat.seatNumber}`,
          occupiedBy: seat.currentUnit?.id ?? null,
        })),
      ),
    [labs],
  );
}

export default function StaffLabsPage() {
  return (
    <RequireStaffAuth>
      <StaffNav />
      <LabsContent />
    </RequireStaffAuth>
  );
}

function LabsContent() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      <section className="grid gap-6 sm:grid-cols-2">
        <AddLabForm />
        <RegisterUnitForm />
      </section>
      <SeatsSection />
      <UnitsSection />
    </main>
  );
}

function AddLabForm() {
  const [createLab, { isLoading }] = useCreateLabMutation();
  const notify = useNotify();
  const [labName, setLabName] = useState("");
  const [location, setLocation] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!labName || !location) return;
    try {
      await createLab({ labName, location }).unwrap();
      notify.success(`Added ${labName}. Add its seats below.`);
      setLabName("");
      setLocation("");
      nameRef.current?.focus();
    } catch (err) {
      notify.error(err);
    }
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Add a lab</h2>
      <label className={labelClass}>
        Lab name
        <input
          ref={nameRef}
          required
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Location
        <input
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={fieldClass}
        />
      </label>
      <Button type="submit" disabled={isLoading} className="mt-auto">
        {isLoading ? "Adding..." : "Add lab"}
      </Button>
    </Card>
  );
}

function RegisterUnitForm() {
  const [createUnit, { isLoading: creating }] = useCreateUnitMutation();
  const [assignUnit, { isLoading: assigning }] = useAssignUnitMutation();
  const seatOptions = useSeatOptions();
  const notify = useNotify();
  const [assetTag, setAssetTag] = useState("");
  const [seatId, setSeatId] = useState<number | "">("");
  const tagRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetTag) return;
    try {
      const unit = await createUnit({ assetTag }).unwrap();
      if (seatId) {
        await assignUnit({ id: unit.id, seatId }).unwrap();
      }
      const seatLabel = seatOptions.find((s) => s.id === seatId)?.label;
      notify.success(seatLabel ? `Registered ${assetTag} at ${seatLabel}.` : `Registered ${assetTag}.`);
      setAssetTag("");
      setSeatId("");
      tagRef.current?.focus();
    } catch (err) {
      notify.error(err);
    }
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Register a unit</h2>
      <label className={labelClass}>
        Asset tag
        <input
          ref={tagRef}
          required
          value={assetTag}
          onChange={(e) => setAssetTag(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        <span>
          Seat <span className="font-normal text-ink-muted">(optional)</span>
        </span>
        <select
          value={seatId}
          onChange={(e) => setSeatId(e.target.value ? Number(e.target.value) : "")}
          className={fieldClass}
        >
          <option value="">Leave unassigned</option>
          {seatOptions
            .filter((seat) => seat.occupiedBy === null)
            .map((seat) => (
              <option key={seat.id} value={seat.id}>
                {seat.label}
              </option>
            ))}
        </select>
      </label>
      <Button type="submit" disabled={creating || assigning} className="mt-auto">
        {creating || assigning ? "Registering..." : "Register unit"}
      </Button>
    </Card>
  );
}

function SeatsSection() {
  const { data: labs, isLoading } = useListLabsQuery();
  const labsPager = usePagination(labs);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-ink">Labs &amp; seats</h2>
      {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}
      {!isLoading && !labs?.length && (
        <Card className="px-4 py-6 text-center text-sm text-ink-muted">
          No labs yet. Add one above.
        </Card>
      )}

      <div className="flex flex-col gap-6">
        {labsPager.pageItems.map((lab) => (
          <LabCard key={lab.id} lab={lab} />
        ))}
      </div>
      <div className="mt-2">
        <Pagination {...labsPager} onPageChange={labsPager.setPage} />
      </div>
    </section>
  );
}

function LabCard({ lab }: { lab: LabDto }) {
  const [deleteLab] = useDeleteLabMutation();
  const [deleteSeat] = useDeleteSeatMutation();
  const notify = useNotify();
  const seatPager = usePagination(lab.seats);

  async function handleDeleteLab() {
    try {
      await deleteLab(lab.id).unwrap();
      notify.success(`Deleted ${lab.labName}.`);
    } catch (err) {
      notify.error(err);
    }
  }

  async function handleDeleteSeat(seat: SeatDto) {
    try {
      await deleteSeat(seat.id).unwrap();
      notify.success(`Deleted seat ${seat.seatNumber}.`);
    } catch (err) {
      notify.error(err);
    }
  }

  async function handleCopyLink(seat: SeatDto) {
    const url = `${window.location.origin}/?seat=${seat.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notify.success(`Copied report link for ${lab.labName} · ${seat.seatNumber}.`);
    } catch {
      // Clipboard API is unavailable on plain-http LAN origins; show the link
      // so it can still be copied by hand.
      window.prompt("Copy this report link:", url);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {lab.labName} <span className="font-normal text-ink-muted">&middot; {lab.location}</span>
          <span className="ml-2 font-normal text-ink-faint">
            {lab.seats.length} {lab.seats.length === 1 ? "seat" : "seats"}
          </span>
        </h3>
        <ConfirmButton
          size="sm"
          confirmLabel={lab.seats.length ? "Delete lab and its seats?" : "Confirm delete"}
          onConfirm={handleDeleteLab}
        >
          Delete lab
        </ConfirmButton>
      </div>

      <AddSeatsForm lab={lab} />

      {!!lab.seats.length && (
        <>
          <div className="mt-3 max-h-72 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface shadow-[inset_0_-1px_0_var(--color-hairline)]">
                <tr>
                  <th className="py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Seat
                  </th>
                  <th className="py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Current unit
                  </th>
                  <th className="py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {seatPager.pageItems.map((seat) => (
                  <tr key={seat.id} className="border-t border-hairline">
                    <td className="py-2 font-mono text-ink">{seat.seatNumber}</td>
                    <td className="py-2 font-mono text-ink-muted">
                      {seat.currentUnit ? seat.currentUnit.assetTag : "Unassigned"}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Link that opens the report form with this seat already selected — print it as a QR code on the PC"
                          onClick={() => handleCopyLink(seat)}
                        >
                          Copy report link
                        </Button>
                        <ConfirmButton
                          size="sm"
                          confirmLabel="Confirm delete"
                          onConfirm={() => handleDeleteSeat(seat)}
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="-mx-4 -mb-4 mt-2">
            <Pagination {...seatPager} onPageChange={seatPager.setPage} />
          </div>
        </>
      )}
    </Card>
  );
}

function AddSeatsForm({ lab }: { lab: LabDto }) {
  const [createSeat] = useCreateSeatMutation();
  const notify = useNotify();
  const [entry, setEntry] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const seatNumbers = expandSeatNumbers(entry);
  const tooMany = seatNumbers.length > MAX_SEATS_PER_ADD;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seatNumbers.length || tooMany) return;

    setAdding(true);
    const failed: string[] = [];
    let firstError: unknown = null;
    // Sequential so a large batch doesn't trip the API's rate limiter.
    for (const seatNumber of seatNumbers) {
      try {
        await createSeat({ labId: lab.id, seatNumber }).unwrap();
      } catch (err) {
        failed.push(seatNumber);
        firstError ??= err;
      }
    }
    setAdding(false);

    const added = seatNumbers.length - failed.length;
    if (added) {
      notify.success(`Added ${added} ${added === 1 ? "seat" : "seats"} to ${lab.labName}.`);
    }
    if (failed.length) {
      notify.error(firstError);
      // Leave only the failures in the box so they can be fixed and retried.
      setEntry(failed.join(", "));
    } else {
      setEntry("");
    }
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Add seats, e.g. PC-01-PC-30 or 1, 2, 5"
          aria-label={`Add seats to ${lab.labName}`}
          className={`min-w-0 flex-1 ${fieldClass}`}
        />
        <Button type="submit" variant="secondary" disabled={adding || !seatNumbers.length || tooMany}>
          {adding
            ? "Adding..."
            : seatNumbers.length > 1
              ? `Add ${seatNumbers.length} seats`
              : "Add seat"}
        </Button>
      </div>
      {seatNumbers.length > 1 && (
        <p className={`text-xs ${tooMany ? "text-red-ink" : "text-ink-muted"}`}>
          {tooMany
            ? `Too many seats. Add at most ${MAX_SEATS_PER_ADD} at a time.`
            : `${seatNumbers.slice(0, 3).join(", ")}${seatNumbers.length > 4 ? ", …" : ""}${
                seatNumbers.length > 3 ? `, ${seatNumbers[seatNumbers.length - 1]}` : ""
              }`}
        </p>
      )}
    </form>
  );
}

function UnitsSection() {
  const { data: units, isLoading } = useListUnitsQuery();
  const [updateUnitStatus] = useUpdateUnitStatusMutation();
  const [assignUnit] = useAssignUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();
  const seatOptions = useSeatOptions();
  const notify = useNotify();
  const unitsPager = usePagination(units);

  async function handleStatus(id: number, status: ComputerUnitStatus) {
    try {
      await updateUnitStatus({ id, status }).unwrap();
    } catch (err) {
      notify.error(err);
    }
  }

  async function handleAssign(id: number, seatId: number | "") {
    try {
      await assignUnit({ id, seatId: seatId === "" ? null : seatId }).unwrap();
    } catch (err) {
      notify.error(err);
    }
  }

  async function handleDelete(id: number, assetTag: string) {
    try {
      await deleteUnit(id).unwrap();
      notify.success(`Deleted unit ${assetTag}.`);
    } catch (err) {
      notify.error(err);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-ink">Units</h2>
      {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}
      {!isLoading && !units?.length && (
        <Card className="px-4 py-6 text-center text-sm text-ink-muted">
          No units registered yet.
        </Card>
      )}

      {!!units?.length && (
        <Card className="overflow-hidden">
          <div className={scrollListClass}>
            <table className="w-full text-left text-sm">
              <thead className={stickyHeadClass}>
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Asset tag
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Assigned seat
                  </th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {unitsPager.pageItems.map((unit) => (
                  <tr key={unit.id} className="border-t border-hairline">
                    <td className="px-4 py-2.5 font-mono text-ink">{unit.assetTag}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={unit.status}
                        onChange={(e) =>
                          handleStatus(unit.id, e.target.value as ComputerUnitStatus)
                        }
                        aria-label={`Status of ${unit.assetTag}`}
                        className={compactFieldClass}
                      >
                        {UNIT_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={unit.currentSeatId ?? ""}
                        onChange={(e) =>
                          handleAssign(unit.id, e.target.value ? Number(e.target.value) : "")
                        }
                        aria-label={`Seat for ${unit.assetTag}`}
                        className={compactFieldClass}
                      >
                        <option value="">Unassigned</option>
                        {seatOptions.map((seat) => {
                          const occupied = seat.occupiedBy !== null && seat.occupiedBy !== unit.id;
                          return (
                            <option key={seat.id} value={seat.id} disabled={occupied}>
                              {seat.label}
                              {occupied ? " (occupied)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ConfirmButton
                        size="sm"
                        confirmLabel="Confirm delete"
                        onConfirm={() => handleDelete(unit.id, unit.assetTag)}
                      >
                        Delete
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...unitsPager} onPageChange={unitsPager.setPage} />
        </Card>
      )}
    </section>
  );
}
