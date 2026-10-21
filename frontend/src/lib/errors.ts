// Pulls a human-readable message out of an RTK Query error. The API returns
// either { message } (domain errors like 409 conflicts) or, for ASP.NET
// Identity failures (weak password, duplicate email), a list of
// { code, description } entries.
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "status" in error && error.status === 429) {
    return "You're going too fast. Please wait a moment and try again.";
  }

  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (Array.isArray(data)) {
      const descriptions = data
        .map((entry) =>
          entry && typeof entry === "object" && "description" in entry
            ? (entry as { description?: unknown }).description
            : null,
        )
        .filter((d): d is string => typeof d === "string");
      if (descriptions.length) return descriptions.join(" ");
    }

    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return "Something went wrong. Please try again.";
}
