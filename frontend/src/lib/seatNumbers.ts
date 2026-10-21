export const MAX_SEATS_PER_ADD = 200;

// Expands a seat entry into individual seat numbers so a whole lab can be set
// up in one go. Comma/newline separated; each part is either a literal seat
// ("A5") or a numeric range that keeps its prefix and zero padding
// ("PC-01-PC-30" or "PC-01-30" -> PC-01 … PC-30, "1-40" -> 1 … 40).
export function expandSeatNumbers(input: string): string[] {
  const seats: string[] = [];

  for (const part of input.split(/[,\n]/)) {
    const token = part.trim();
    if (!token) continue;

    const range = token.match(/^(.*?)(\d+)\s*[-–]\s*(?:\1)?(\d+)$/);
    if (range) {
      const [, prefix, startText, endText] = range;
      const start = Number(startText);
      const end = Number(endText);
      if (end > start) {
        // Stops one past the limit: enough for the caller to reject an
        // oversized range without building a huge list.
        const last = Math.min(end, start + MAX_SEATS_PER_ADD);
        for (let n = start; n <= last; n++) {
          seats.push(prefix + String(n).padStart(startText.length, "0"));
        }
        continue;
      }
    }

    seats.push(token);
  }

  return [...new Set(seats)];
}
