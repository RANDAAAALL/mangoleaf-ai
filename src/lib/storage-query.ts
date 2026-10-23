/** Run one read at a time and replay changes once; never publish a snapshot invalidated mid-read. */
export function observeStorageQuery<T>(
  query: () => Promise<T>,
  subscribe: (changed: () => void) => () => void,
  onData: (data: T) => void,
  onError: () => void,
) {
  let active = true;
  let running = false;
  let dirty = false;
  async function refresh() {
    dirty = true;
    if (running || !active) return;
    running = true;
    try {
      do {
        dirty = false;
        try {
          const data = await query();
          if (active && !dirty) onData(data);
        } catch {
          if (active && !dirty) onError();
        }
      } while (active && dirty);
    } finally {
      running = false;
    }
  }
  const unsubscribe = subscribe(() => void refresh());
  void refresh();
  return () => {
    active = false;
    unsubscribe();
  };
}
