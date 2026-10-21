"use client";

import { useState } from "react";

// Table cell for an issue description: one truncated line by default, the
// full text on click, so staff can read a report without leaving the table.
export function IssueCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <td className="max-w-xs px-4 py-2.5 text-ink">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? undefined : text}
        className={`block w-full text-left ${expanded ? "whitespace-pre-wrap break-words" : "truncate"}`}
      >
        {text}
      </button>
    </td>
  );
}
