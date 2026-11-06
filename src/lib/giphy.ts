import type { GiphySearchResponse, GiphyGif } from '@/types/giphy';

const BASE_URL = 'https://api.giphy.com/v1/gifs';

/** Number of GIFs per page – 12 fills a 4-column grid neatly */
export const PAGE_SIZE = 12;

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_GIPHY_API_KEY is not configured');
  return key;
}

/** Thrown when GIPHY returns HTTP 429 (rate limit) */
export class GiphyRateLimitError extends Error {
  constructor() {
    super('GIPHY API rate limit reached (42 req/hr on the free tier)');
    this.name = 'GiphyRateLimitError';
  }
}

/** Thrown for any other non-OK GIPHY response */
export class GiphyApiError extends Error {
  constructor(public readonly status: number) {
    super(`GIPHY API error – HTTP ${status}`);
    this.name = 'GiphyApiError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 429) throw new GiphyRateLimitError();
  if (!res.ok) throw new GiphyApiError(res.status);
  return res.json() as Promise<T>;
}

/**
 * Search GIPHY for GIFs matching `query`.
 * `offset` drives pagination: pass `page * PAGE_SIZE`.
 */
export async function searchGifs(
  query: string,
  offset = 0,
  signal?: AbortSignal
): Promise<GiphySearchResponse> {
  const params = new URLSearchParams({
    api_key: getApiKey(),
    q: query,
    limit: String(PAGE_SIZE),
    offset: String(offset),
    rating: 'g',
    lang: 'en',
  });

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  return parseResponse<GiphySearchResponse>(res);
}

const TRENDING_POOL_SIZE = 25;

/**
 * Returns `count` random GIFs for the landing view. One request fetches a
 * pool of trending GIFs and we pick randomly from it, which costs 1 API
 * request instead of `count` calls to the /random endpoint (42/hour quota).
 */
export async function getTrendingGifs(count = 3): Promise<GiphyGif[]> {
  const params = new URLSearchParams({
    api_key: getApiKey(),
    limit: String(TRENDING_POOL_SIZE),
    rating: 'g',
  });

  const res = await fetch(`${BASE_URL}/trending?${params}`, {
    headers: { Accept: 'application/json' },
  });

  const data = await parseResponse<GiphySearchResponse>(res);
  const pool = [...data.data];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
