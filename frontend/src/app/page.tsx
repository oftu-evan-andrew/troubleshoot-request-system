"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useListLabsQuery } from "@/lib/api/labsApi";
import { useSubmitRequestMutation } from "@/lib/api/requestsApi";
import { ReporterRole, RequestPriority } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { extractErrorMessage } from "@/lib/errors";
import { formatRef, parseRef } from "@/lib/format";
import { readStored, writeStored } from "@/lib/storage";
import { fieldClass, labelClass } from "@/lib/ui";
import { useIsClient } from "@/lib/useIsClient";

const REPORTER_ROLES: { value: ReporterRole; label: string }[] = [
  { value: "Student", label: "Student" },
  { value: "Faculty", label: "Faculty" },
  { value: "Staff", label: "Staff" },
];
const PRIORITIES: { value: RequestPriority; label: string; hint: string }[] = [
  { value: "Low", label: "Low", hint: "Not urgent" },
  { value: "Normal", label: "Normal", hint: "Needs fixing, but I can work around it" },
  { value: "High", label: "High", hint: "Blocking my work" },
  { value: "Exam", label: "Exam", hint: "Exam or time-critical" },
];

const REPORTER_KEY = "reporter";
const RECENT_KEY = "recentRequests";
const MAX_RECENT = 5;

interface StoredReporter {
  name: string;
  role: ReporterRole;
  id: string;
}

export default function Home() {
  // The form starts from what's remembered on this device, which only exists
  // in the browser, so it isn't server-rendered.
  return useIsClient() ? <ReportPage /> : null;
}

function readInitialState() {
  const reporter = readStored<StoredReporter>(REPORTER_KEY);
  // A per-seat link (e.g. a QR sticker on the PC) pre-selects the location.
  const seat = Number(new URLSearchParams(window.location.search).get("seat"));
  const seatId: number | "" = seat || "";
  return { reporter, seatId, recentIds: readStored<number[]>(RECENT_KEY) ?? [] };
}

function ReportPage() {
  const [initial] = useState(readInitialState);
  const { data: labs, isLoading: labsLoading, isError: labsError } = useListLabsQuery();
  const [submitRequest, { isLoading: submitting }] = useSubmitRequestMutation();

  const [reporterName, setReporterName] = useState(initial.reporter?.name ?? "");
  const [reporterRole, setReporterRole] = useState<ReporterRole>(
    initial.reporter?.role ?? "Student",
  );
  const [reporterId, setReporterId] = useState(initial.reporter?.id ?? "");
  const [labId, setLabId] = useState<number | "">("");
  const [seatId, setSeatId] = useState<number | "">(initial.seatId);
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("Normal");
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [recentIds, setRecentIds] = useState<number[]>(initial.recentIds);

  // The lab is implied by a pre-selected seat, or by there being only one lab,
  // so the reporter only has to pick it when it's genuinely ambiguous.
  const effectiveLabId =
    labId !== ""
      ? labId
      : (labs?.find((lab) => lab.seats.some((s) => s.id === seatId))?.id ??
        (labs?.length === 1 ? labs[0].id : ""));
  const seatsForSelectedLab = labs?.find((lab) => lab.id === effectiveLabId)?.seats ?? [];
  const effectiveSeatId = seatsForSelectedLab.some((s) => s.id === seatId) ? seatId : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!effectiveSeatId) {
      setError("Please select a lab and seat number.");
      return;
    }

    try {
      const result = await submitRequest({
        reporterName,
        reporterRole,
        reporterId,
        seatId: effectiveSeatId,
        issueDescription,
        priority,
      }).unwrap();

      writeStored(REPORTER_KEY, { name: reporterName, role: reporterRole, id: reporterId });
      const recent = [result.id, ...recentIds.filter((id) => id !== result.id)].slice(
        0,
        MAX_RECENT,
      );
      writeStored(RECENT_KEY, recent);
      setRecentIds(recent);
      setSubmittedId(result.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function handleReportAnother() {
    // Same person, usually the same seat: keep those, clear the issue itself.
    setIssueDescription("");
    setPriority("Normal");
    setSubmittedId(null);
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
              <span className="font-mono font-semibold text-ink">{formatRef(submittedId)}</span>
              . IT staff have been notified.
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              It&apos;s saved on this device, so you can find it again from the report page.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/status/${submittedId}`}>
              <Button type="button">Check status</Button>
            </Link>
            <Button type="button" variant="secondary" onClick={handleReportAnother}>
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
              autoComplete="name"
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className={`flex-1 ${labelClass}`}>
              <span>Role</span>
              <SegmentedControl
                name="role"
                value={reporterRole}
                options={REPORTER_ROLES}
                onChange={setReporterRole}
              />
            </div>

            <label className={`sm:w-36 ${labelClass}`}>
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
                value={effectiveLabId}
                onChange={(e) => {
                  setLabId(e.target.value ? Number(e.target.value) : "");
                  setSeatId("");
                }}
                className={fieldClass}
                disabled={labsLoading || labsError}
              >
                <option value="">{labsLoading ? "Loading labs..." : "Select a lab"}</option>
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
                value={effectiveSeatId}
                onChange={(e) => setSeatId(e.target.value ? Number(e.target.value) : "")}
                className={fieldClass}
                disabled={!effectiveLabId}
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
              // Returning reporters only have the issue itself left to fill in.
              autoFocus={Boolean(initial.reporter?.name && initial.reporter?.id)}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={4}
              placeholder="e.g. Monitor won't turn on, no internet, keyboard missing keys"
              className={fieldClass}
            />
          </label>

          <div className={labelClass}>
            <span>Urgency</span>
            <SegmentedControl
              name="priority"
              value={priority}
              options={PRIORITIES}
              onChange={setPriority}
            />
            <span className="text-xs font-normal text-ink-muted">
              {PRIORITIES.find((p) => p.value === priority)?.hint}
            </span>
          </div>

          {error && <p className="text-sm text-red-ink">{error}</p>}
          {labsError && (
            <p className="text-sm text-red-ink">Could not load labs. Is the API running?</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
          <p className="-mt-2 hidden text-center text-xs text-ink-faint sm:block">
            Tip: press Ctrl+Enter in the description to submit.
          </p>
        </form>
      </Card>

      <StatusLookup recentIds={recentIds} />
    </main>
  );
}

function StatusLookup({ recentIds }: { recentIds: number[] }) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [invalid, setInvalid] = useState(false);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = parseRef(ref);
    if (id === null) {
      setInvalid(true);
      return;
    }
    router.push(`/status/${id}`);
  }

  return (
    <section className="mt-6 flex flex-col gap-3 text-sm">
      <form onSubmit={handleLookup} className="flex items-center gap-2">
        <label htmlFor="ref-lookup" className="whitespace-nowrap text-ink-muted">
          Already reported?
        </label>
        <input
          id="ref-lookup"
          value={ref}
          onChange={(e) => {
            setRef(e.target.value);
            setInvalid(false);
          }}
          placeholder="REQ-0012"
          aria-invalid={invalid}
          className={`min-w-0 flex-1 font-mono ${fieldClass} ${invalid ? "border-red-ink" : ""}`}
        />
        <Button type="submit" variant="secondary" disabled={!ref.trim()}>
          Check status
        </Button>
      </form>

      {recentIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-ink-muted">
          <span>Your recent requests:</span>
          {recentIds.map((id) => (
            <Link
              key={id}
              href={`/status/${id}`}
              className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 font-mono text-xs text-ink hover:border-primary hover:text-primary"
            >
              {formatRef(id)}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
