// localStorage can throw (private mode, blocked storage) or hold stale/garbled
// values, so every access is wrapped and falls back to "nothing stored".
export function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Remembering is a convenience; losing it is fine.
  }
}
