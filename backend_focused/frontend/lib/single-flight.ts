/**
 * Wraps an async task so concurrent callers share one in-flight run.
 * Once it settles, the next call starts a fresh run.
 */
export function createSingleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return () => {
    inFlight ??= task().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
