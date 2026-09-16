"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useListLabsQuery } from "@/lib/api/labsApi";
import { useSubmitRequestMutation } from "@/lib/api/requestsApi";
import { ReporterRole, RequestPriority } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fieldClass, labelClass } from "@/lib/ui";

const REPORTER_ROLES: ReporterRole[] = ["Student", "Faculty", "Staff"];
const PRIORITIES: { value: RequestPriority; label: string }[] = [
  { value: "Low", label: "Low — not urgent" },
  { value: "Normal", label: "Normal" },
  { value: "High", label: "High — blocking my work" },
  { value: "Exam", label: "Exam / time-critical" },
];

export default function Home() {
  const { data: labs, isLoading: labsLoading, isError: labsError } = useListLabsQuery();
  const [submitRequest, { isLoading: submitting }] = useSubmitRequestMutation();

  const [reporterName, setReporterName] = useState("");
  const [reporterRole, setReporterRole] = useState<ReporterRole>("Student");
  const [reporterId, setReporterId] = useState("");
  const [labId, setLabId] = useState<number | "">("");
  const [seatId, setSeatId] = useState<number | "">("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("Normal");
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const seatsForSelectedLab = useMemo(
    () => labs?.find((lab) => lab.id === labId)?.seats ?? [],
    [labs, labId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!seatId) {
      setError("Please select a lab and seat number.");
      return;
    }

    try {
      const result = await submitRequest({
        reporterName,
        reporterRole,
        reporterId,
        seatId,
        issueDescription,
        priority,
      }).unwrap();

      setSubmittedId(result.id);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && err.status === 429) {
        setError("You're submitting too fast. Please wait a moment and try again.");
      } else {
        setError("Something went wrong submitting your request. Please try again.");
      }
    }
  }

  if (submittedId !== null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6">
        <Card className="w-full flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-tint text-green-ink">
            ✓
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Request submitted</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Your reference number is{" "}
              <span className="font-mono font-semibold text-ink">
                REQ-{String(submittedId).padStart(4, "0")}
              </span>
              . IT staff have been notified.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/status/${submittedId}`}>
              <Button type="button">Check status</Button>
            </Link>
            <Button type="button" variant="secondary" onClick={() => setSubmittedId(null)}>
              Report another issue
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Report a computer lab issue</h1>
        <p className="mt-1 text-sm text-ink-muted">
          No account needed. Fill this in and IT staff will see it right away.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Your name
            <input
              required
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div className="flex gap-4">
            <label className={`flex-1 ${labelClass}`}>
              Role
              <select
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value as ReporterRole)}
                className={fieldClass}
              >
                {REPORTER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className={`flex-1 ${labelClass}`}>
              ID number
              <input
                required
                value={reporterId}
                onChange={(e) => setReporterId(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                pattern="[0-9]*"
                className={fieldClass}
                placeholder='ex. "241165"'
              />
            </label>
          </div>

          <div className="flex gap-4">
            <label className={`flex-1 ${labelClass}`}>
              Laboratory
              <select
                required
                value={labId}
                onChange={(e) => {
                  setLabId(e.target.value ? Number(e.target.value) : "");
                  setSeatId("");
                }}
                className={fieldClass}
                disabled={labsLoading || labsError}
              >
                <option value="">Select a lab</option>
                {labs?.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.labName}
                  </option>
                ))}
              </select>
            </label>

            <label className={`flex-1 ${labelClass}`}>
              Seat number
              <select
                required
                value={seatId}
                onChange={(e) => setSeatId(e.target.value ? Number(e.target.value) : "")}
                className={fieldClass}
                disabled={!labId}
              >
                <option value="">Select a seat</option>
                {seatsForSelectedLab.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    {seat.seatNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            What&apos;s wrong?
            <textarea
              required
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Urgency
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RequestPriority)}
              className={fieldClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-ink">{error}</p>}
          {labsError && (
            <p className="text-sm text-red-ink">Could not load labs. Is the API running?</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
