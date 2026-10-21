import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False during the server render and hydration, true afterwards. Lets a
// component read browser-only state (localStorage, the URL) in its initial
// render without a hydration mismatch or a setState-in-effect round trip.
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
