'use client';

import { useState, useEffect, useRef } from 'react';
import type { GiphyGif, SearchState } from '@/types/giphy';
import { searchGifs, getTrendingGifs, GiphyRateLimitError, PAGE_SIZE } from '@/lib/giphy';
import { giphyCache, getCacheKey } from '@/lib/cache';

const RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000; // GIPHY quota resets hourly

export interface UseGiphySearchResult {
  gifs: GiphyGif[];
  state: SearchState;
  totalCount: number;
  isRateLimited: boolean;
}

/**
 * Core data hook: given a (debounced) search query and a page index, it:
 *  1. Returns the cached result immediately if one exists.
 *  2. Otherwise fetches from GIPHY and stores the response in the LRU cache.
 *  3. Tracks rate-limit state so the UI can warn the user.
 *  4. Uses a request-ID ref to silently discard responses from superseded
 *     requests (stale-response protection without AbortController overhead).
 */
export function useGiphySearch(query: string, page: number): UseGiphySearchResult {
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [totalCount, setTotalCount] = useState(0);
  const rateLimitedUntilRef = useRef(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;

    const run = async () => {
      // ── No query → show 3 trending GIFs ────────────────────────────
      if (!query.trim()) {
        const cachedKey = getCacheKey('__trending__', 0);
        const cached = giphyCache.get(cachedKey);
        if (cached) {
          setGifs(cached.data);
          setTotalCount(cached.data.length);
          setState('success');
          return;
        }
        setState('loading');
        try {
          const trending = await getTrendingGifs(3);
          if (id !== requestId.current) return;
          // Wrap in a synthetic response so we can cache it uniformly
          giphyCache.set(cachedKey, {
            data: trending,
            pagination: { total_count: trending.length, count: trending.length, offset: 0 },
            meta: { status: 200, msg: 'OK', response_id: 'trending' },
          });
          setGifs(trending);
          setTotalCount(3);
          setState('success');
        } catch {
          if (id !== requestId.current) return;
          setState('error');
        }
        return;
      }

      // ── Query present ────────────────────────────────────────────────
      const offset = page * PAGE_SIZE;
      const cacheKey = getCacheKey(query, offset);
      const cached = giphyCache.get(cacheKey);

      if (cached) {
        setGifs(cached.data);
        setTotalCount(cached.pagination.total_count);
        setState('success');
        return;
      }

      if (Date.now() < rateLimitedUntilRef.current) {
        setState('rate-limited');
        setGifs([]);
        setTotalCount(0);
        return;
      }

      setState('loading');

      try {
        const result = await searchGifs(query, offset);
        if (id !== requestId.current) return;
        giphyCache.set(cacheKey, result);
        setGifs(result.data);
        setTotalCount(result.pagination.total_count);
        setState('success');
      } catch (err) {
        if (id !== requestId.current) return;
        if (err instanceof GiphyRateLimitError) {
          rateLimitedUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          setIsRateLimited(true);
          setState('rate-limited');
        } else {
          setState('error');
        }
      }
    };

    run();
  }, [query, page]);

  return { gifs, state, totalCount, isRateLimited };
}
