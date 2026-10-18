/** Bounded per-process coalescing. No stale-on-error or distributed-cache claim. */
export class SnapshotCache {
  private entries = new Map<
    string,
    { value: Promise<unknown>; expires: number; pending: boolean }
  >();
  private capacity: number;
  private ttlMs: number;
  constructor(capacity = 128, ttlMs = 10_000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }
  read<T>(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (existing && (existing.pending || existing.expires > now))
      return existing.value as Promise<T>;
    this.entries.delete(key);
    for (const [entryKey, entry] of this.entries) {
      if (!entry.pending && entry.expires <= now) this.entries.delete(entryKey);
    }
    if (this.entries.size >= this.capacity) {
      const oldest = [...this.entries].find(([, entry]) => !entry.pending);
      if (oldest) this.entries.delete(oldest[0]);
      else
        return Promise.reject(
          new Error('The network service is busy. Try again shortly.'),
        );
    }
    const entry = {
      value: Promise.resolve() as Promise<unknown>,
      expires: now,
      pending: true,
    };
    entry.value = Promise.resolve()
      .then(load)
      .then((value) => {
        entry.pending = false;
        entry.expires = Date.now() + this.ttlMs;
        return value;
      })
      .catch((error) => {
        if (this.entries.get(key) === entry) this.entries.delete(key);
        throw error;
      });
    this.entries.set(key, entry);
    return entry.value as Promise<T>;
  }
}
export const snapshots = new SnapshotCache();
