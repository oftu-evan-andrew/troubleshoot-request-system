"use client";

import { useMemo, useState } from "react";
import { RequireStaffAuth } from "@/components/RequireStaffAuth";
import { StaffNav } from "@/components/StaffNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fieldClass, labelClass } from "@/lib/ui";
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
import { ComputerUnitStatus } from "@/lib/types";

const UNIT_STATUSES: ComputerUnitStatus[] = ["Operational", "UnderMaintenance", "OutOfService"];

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return "Something went wrong. Please try again.";
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
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      {actionError && (
        <p className="rounded-md bg-red-tint px-3 py-2 text-sm text-red-ink">{actionError}</p>
      )}

      <QuickAddForms onError={setActionError} />
      <SeatsSection onError={setActionError} />
      <UnitsSection onError={setActionError} />
    </main>
  );
}

function QuickAddForms({ onError }: { onError: (msg: string | null) => void }) {
  const { data: labs } = useListLabsQuery();
  const [createLab, { isLoading: creatingLab }] = useCreateLabMutation();
  const [createSeat, { isLoading: creatingSeat }] = useCreateSeatMutation();
  const [createUnit, { isLoading: creatingUnit }] = useCreateUnitMutation();

  const [labName, setLabName] = useState("");
  const [location, setLocation] = useState("");

  const [seatLabId, setSeatLabId] = useState<number | "">("");
  const [seatNumber, setSeatNumber] = useState("");

  const [assetTag, setAssetTag] = useState("");

  async function handleCreateLab(e: React.FormEvent) {
    e.preventDefault();
    if (!labName || !location) return;
    onError(null);
    try {
      await createLab({ labName, location }).unwrap();
      setLabName("");
      setLocation("");
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

  async function handleCreateSeat(e: React.FormEvent) {
    e.preventDefault();
    if (!seatLabId || !seatNumber) return;
    onError(null);
    try {
      await createSeat({ labId: seatLabId, seatNumber }).unwrap();
      setSeatNumber("");
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetTag) return;
    onError(null);
    try {
      await createUnit({ assetTag }).unwrap();
      setAssetTag("");
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

  return (
    <section className="grid gap-6 sm:grid-cols-3">
      <Card as="form" onSubmit={handleCreateLab} className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Add a lab</h2>
        <label className={labelClass}>
          Lab name
          <input
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
        <Button type="submit" disabled={creatingLab} className="mt-1">
          Add lab
        </Button>
      </Card>

      <Card as="form" onSubmit={handleCreateSeat} className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Add a seat</h2>
        <label className={labelClass}>
          Lab
          <select
            required
            value={seatLabId}
            onChange={(e) => setSeatLabId(e.target.value ? Number(e.target.value) : "")}
            className={fieldClass}
          >
            <option value="">Select a lab</option>
            {labs?.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.labName}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Seat number
          <input
            required
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
            className={fieldClass}
          />
        </label>
        <Button type="submit" disabled={creatingSeat} className="mt-1">
          Add seat
        </Button>
      </Card>

      <Card as="form" onSubmit={handleCreateUnit} className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Register a unit</h2>
        <label className={labelClass}>
          Asset tag
          <input
            required
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
            className={fieldClass}
          />
        </label>
        <p className="text-xs text-ink-muted">
          New units start unassigned. Assign them to a seat below.
        </p>
        <Button type="submit" disabled={creatingUnit} className="mt-auto">
          Register unit
        </Button>
      </Card>
    </section>
  );
}

function SeatsSection({ onError }: { onError: (msg: string | null) => void }) {
  const { data: labs, isLoading } = useListLabsQuery();
  const [deleteLab] = useDeleteLabMutation();
  const [deleteSeat] = useDeleteSeatMutation();

  async function handleDeleteLab(id: number, name: string) {
    if (!window.confirm(`Delete lab "${name}"? This also removes its seats.`)) return;
    onError(null);
    try {
      await deleteLab(id).unwrap();
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

  async function handleDeleteSeat(id: number, seatNumber: string) {
    if (!window.confirm(`Delete seat "${seatNumber}"?`)) return;
    onError(null);
    try {
      await deleteSeat(id).unwrap();
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

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
        {labs?.map((lab) => (
          <Card key={lab.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                {lab.labName}{" "}
                <span className="font-normal text-ink-muted">&middot; {lab.location}</span>
              </h3>
              <Button
                size="sm"
                variant="dangerOutline"
                onClick={() => handleDeleteLab(lab.id, lab.labName)}
              >
                Delete lab
              </Button>
            </div>
            {!lab.seats.length && <p className="text-sm text-ink-muted">No seats yet.</p>}
            {!!lab.seats.length && (
              <table className="w-full text-left text-sm">
                <thead>
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
                  {lab.seats.map((seat) => (
                    <tr key={seat.id} className="border-t border-hairline">
                      <td className="py-2 font-mono text-ink">{seat.seatNumber}</td>
                      <td className="py-2 font-mono text-ink-muted">
                        {seat.currentUnit ? seat.currentUnit.assetTag : "Unassigned"}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="dangerOutline"
                          onClick={() => handleDeleteSeat(seat.id, seat.seatNumber)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function UnitsSection({ onError }: { onError: (msg: string | null) => void }) {
  const { data: labs } = useListLabsQuery();
  const { data: units, isLoading } = useListUnitsQuery();
  const [updateUnitStatus] = useUpdateUnitStatusMutation();
  const [assignUnit] = useAssignUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  const seatOptions = useMemo(
    () =>
      (labs ?? []).flatMap((lab) =>
        lab.seats.map((seat) => ({
          id: seat.id,
          label: `${lab.labName} · ${seat.seatNumber}`,
          takenByOtherUnit: seat.currentUnit !== null,
        })),
      ),
    [labs],
  );

  async function handleAssign(unitId: number, seatId: number | "") {
    onError(null);
    try {
      await assignUnit({ id: unitId, seatId: seatId === "" ? null : seatId }).unwrap();
    } catch (err) {
      onError(extractErrorMessage(err));
    }
  }

  async function handleDeleteUnit(id: number, assetTag: string) {
    if (!window.confirm(`Delete unit "${assetTag}"?`)) return;
    onError(null);
    try {
      await deleteUnit(id).unwrap();
    } catch (err) {
      onError(extractErrorMessage(err));
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
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas">
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
              {units.map((unit) => (
                <tr key={unit.id} className="border-t border-hairline">
                  <td className="px-4 py-2.5 font-mono text-ink">{unit.assetTag}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={unit.status}
                      onChange={(e) =>
                        updateUnitStatus({
                          id: unit.id,
                          status: e.target.value as ComputerUnitStatus,
                        })
                      }
                      className="rounded-md border border-hairline-strong bg-surface px-2 py-1 text-xs text-ink focus:border-primary"
                    >
                      {UNIT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
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
                      className="rounded-md border border-hairline-strong bg-surface px-2 py-1 text-xs text-ink focus:border-primary"
                    >
                      <option value="">Unassigned</option>
                      {seatOptions.map((seat) => (
                        <option
                          key={seat.id}
                          value={seat.id}
                          disabled={seat.takenByOtherUnit && seat.id !== unit.currentSeatId}
                        >
                          {seat.label}
                          {seat.takenByOtherUnit && seat.id !== unit.currentSeatId
                            ? " (occupied)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="dangerOutline"
                      onClick={() => handleDeleteUnit(unit.id, unit.assetTag)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
