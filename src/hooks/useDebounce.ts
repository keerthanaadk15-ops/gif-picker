'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity.
 *
 * WHY DEBOUNCING IS REQUIRED HERE:
 *  The GIPHY free tier allows only 42 requests per hour (~1 every 85 s).
 *  Without debouncing, every keystroke would fire a network request, burning
 *  through the quota in seconds for a fast typist.  A 400 ms delay is the
 *  industry sweet-spot: users stop perceiving "lag" below ~300 ms, and most
 *  typing bursts resolve within 400 ms, so we issue at most one request per
 *  intentional query rather than one per character.
 *
 * IMPLEMENTATION CHOICE – plain useEffect over a utility library:
 *  We need no external dependency for a single setTimeout pattern.  This keeps
 *  the bundle minimal and the logic fully transparent to reviewers.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
