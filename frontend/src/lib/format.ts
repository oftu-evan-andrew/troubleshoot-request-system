export function formatRef(id: number): string {
  return `REQ-${String(id).padStart(4, "0")}`;
}

// Accepts "REQ-0012", "req12", "#12" or "12" so people can paste a reference
// however they wrote it down.
export function parseRef(input: string): number | null {
  const match = input.trim().match(/^(?:req-?|#)?\s*0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

export function formatAge(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
