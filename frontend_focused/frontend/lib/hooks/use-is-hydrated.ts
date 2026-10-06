'use client';

import { useSyncExternalStore } from 'react';

function subscribeToNothing() {
  return () => {};
}

/**
 * False on the server and during hydration, true afterwards. Values that only the browser
 * knows (cached user data, storage, the platform) should wait for it to avoid a mismatch.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
