// ─── Query Client ───────────────────────────────────────────────────────────
//
// One deep module behind the page hooks. Before, every hook re-implemented the
// same shallow plumbing: a loading flag, an error string, a try/catch, a manual
// refetch, and no protection against two components firing the same request or a
// realtime event racing an in-flight fetch.
//
// This client states that plumbing once. Callers cross a small interface —
// `subscribe`, `fetch`, `invalidate` (and the `useQuery`/`useMutation` hooks
// built on top) — and the implementation owns caching, in-flight de-duplication,
// and invalidation-driven refetch. Keys are plain strings; a mutation invalidates
// keys and every mounted query on those keys refetches from one place.
//
// Fetchers return the app's `ApiResponse<T>` envelope (never throw for HTTP
// errors); the client unwraps `success`/`error` into the snapshot.

import { ApiResponse } from './apiTypes';

export type Fetcher<T> = () => Promise<ApiResponse<T>>;

export interface QuerySnapshot<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  isFetching: boolean;
}

type Listener = () => void;

interface Entry<T> {
  snapshot: QuerySnapshot<T>;
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
  lastFetcher: Fetcher<T> | null;
  updatedAt: number;
}

const FALLBACK_ERROR = 'Xatolik yuz berdi';
const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute default TTL

class QueryClient {
  private cache = new Map<string, Entry<unknown>>();

  private getEntry<T>(key: string): Entry<T> {
    let entry = this.cache.get(key) as Entry<T> | undefined;
    if (!entry) {
      // Fast hydration from sessionStorage for instant (0ms) render on reload / tab switch
      let hydratedData: T | undefined = undefined;
      let updatedAt = 0;
      if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
        try {
          const item = window.sessionStorage.getItem(`dastyor_qc_${key}`);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed && parsed.data !== undefined) {
              hydratedData = parsed.data;
              updatedAt = parsed.updatedAt || 0;
            }
          }
        } catch {
          // Ignore parse errors safely
        }
      }

      entry = {
        snapshot: {
          data: hydratedData,
          error: null,
          loading: false,
          isFetching: false,
        },
        listeners: new Set(),
        inFlight: null,
        lastFetcher: null,
        updatedAt,
      };
      this.cache.set(key, entry as Entry<unknown>);
    }
    return entry;
  }

  private persist<T>(key: string, data: T, updatedAt: number): void {
    if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
      try {
        if (['menu', 'categories', 'tables', 'staff'].includes(key)) {
          window.sessionStorage.setItem(
            `dastyor_qc_${key}`,
            JSON.stringify({ data, updatedAt })
          );
        }
      } catch {
        // quota exceeded or private mode, safe to ignore
      }
    }
  }

  /** Commit a new snapshot (new object reference) and notify subscribers. */
  private commit<T>(entry: Entry<T>, patch: Partial<QuerySnapshot<T>>): void {
    entry.snapshot = { ...entry.snapshot, ...patch };
    entry.listeners.forEach((l) => l());
  }

  /** Current snapshot for a key — stable reference between commits (for useSyncExternalStore). */
  getSnapshot<T>(key: string): QuerySnapshot<T> {
    return this.getEntry<T>(key).snapshot;
  }

  subscribe(key: string, listener: Listener): () => void {
    const entry = this.getEntry(key);
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
    };
  }

  /**
   * Stale-While-Revalidate fetch:
   * 1. Returns cached data instantly if present.
   * 2. If fresh (within staleTime) and not forced, does 0 network requests.
   * 3. If stale or forced, runs background fetch without destroying existing data.
   * 4. De-duplicates concurrent in-flight requests.
   */
  fetch<T>(
    key: string,
    fetcher: Fetcher<T>,
    opts: { force?: boolean; staleTime?: number } = {}
  ): Promise<void> {
    const entry = this.getEntry<T>(key);
    entry.lastFetcher = fetcher;

    const staleTime = opts.staleTime ?? DEFAULT_STALE_TIME;
    const isFresh = entry.updatedAt > 0 && Date.now() - entry.updatedAt < staleTime;

    // In-flight deduplication
    if (entry.inFlight && !opts.force) return entry.inFlight;

    // Fresh cache hit -> 0 network requests
    if (entry.snapshot.data !== undefined && isFresh && !opts.force) {
      return Promise.resolve();
    }

    // Set loading state (only true if no data exists yet) and isFetching flag
    this.commit(entry, {
      loading: entry.snapshot.data === undefined,
      isFetching: true,
      error: null,
    });

    const run = (async () => {
      try {
        const res = await fetcher();
        if (res.success) {
          const now = Date.now();
          entry.updatedAt = now;
          this.persist(key, res.data, now);
          this.commit(entry, {
            data: res.data,
            error: null,
            loading: false,
            isFetching: false,
          });
        } else {
          this.commit(entry, {
            error: res.error?.message ?? FALLBACK_ERROR,
            loading: false,
            isFetching: false,
          });
        }
      } catch (e) {
        this.commit(entry, {
          error: e instanceof Error ? e.message : FALLBACK_ERROR,
          loading: false,
          isFetching: false,
        });
      } finally {
        entry.inFlight = null;
      }
    })();

    entry.inFlight = run;
    return run;
  }

  /**
   * Optimistically update cached data directly without waiting for a server roundtrip.
   */
  setQueryData<T>(key: string, updater: (prev: T | undefined) => T): void {
    const entry = this.getEntry<T>(key);
    const newData = updater(entry.snapshot.data);
    entry.updatedAt = Date.now();
    this.persist(key, newData, entry.updatedAt);
    this.commit(entry, { data: newData, error: null, loading: false });
  }

  /**
   * Invalidate matching keys: marks them as stale so they revalidate in the background
   * WITHOUT blanking out the current screen.
   */
  invalidate(match: string | ((key: string) => boolean)): void {
    const predicate = typeof match === 'string' ? (k: string) => k === match : match;
    for (const [key, entry] of this.cache) {
      if (!predicate(key)) continue;
      // Mark as stale (updatedAt = 0), but KEEP snapshot.data intact!
      entry.updatedAt = 0;
      if (entry.listeners.size > 0 && entry.lastFetcher) {
        this.fetch(key, entry.lastFetcher, { force: true });
      } else {
        entry.listeners.forEach((l) => l());
      }
    }
  }

  /** Test/teardown helper: forget everything. */
  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
      try {
        ['menu', 'categories', 'tables', 'staff'].forEach((k) => {
          window.sessionStorage.removeItem(`dastyor_qc_${k}`);
        });
      } catch {
        // Ignore
      }
    }
  }
}

export const queryClient = new QueryClient();
