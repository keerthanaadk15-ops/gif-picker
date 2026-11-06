import type { GiphySearchResponse } from '@/types/giphy';

/**
 * LRU (Least-Recently-Used) cache for GIPHY API responses.
 *
 * WHY LRU:
 *  – The GIPHY free tier is capped at 42 requests per hour.
 *    Returning a cached response costs 0 requests, so an already-seen
 *    query hits the screen instantly and never counts against the quota.
 *  – LRU eviction keeps memory bounded (MAX_SIZE entries) while preserving
 *    the searches the user is actually cycling through right now.
 *  – Entries survive the rate-limit state, so the user can still browse
 *    previously-fetched pages even after the 429 kicks in.
 *
 * Implementation: a single Map<key, entry> maintains insertion order.
 * On get(), we delete and re-insert to move the entry to the "most recent"
 * end.  When the map is full, we delete its first (oldest) key.
 * This gives O(1) get and set via the JS engine's optimised Map internals.
 */

const MAX_SIZE = 50;

interface CacheEntry {
  value: GiphySearchResponse;
}

class LRUCache {
  private readonly map = new Map<string, CacheEntry>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): GiphySearchResponse | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    // Refresh position → most recently used
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: GiphySearchResponse): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict least recently used (first key in insertion order)
      const lruKey = this.map.keys().next().value as string;
      this.map.delete(lruKey);
    }
    this.map.set(key, { value });
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

/** Singleton cache shared across the React component tree */
export const giphyCache = new LRUCache(MAX_SIZE);

/** Stable, lowercase key so "Cats" and "cats" share a cache slot */
export function getCacheKey(query: string, offset: number): string {
  return `${query.trim().toLowerCase()}:${offset}`;
}
