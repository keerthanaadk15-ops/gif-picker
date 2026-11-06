/**
 * Unit tests for the GIPHY API client (src/lib/giphy.ts).
 * The global fetch is mocked so no real network requests are made.
 */

import { searchGifs, getTrendingGifs, GiphyRateLimitError, GiphyApiError } from '@/lib/giphy';

const MOCK_KEY = 'test_key_1234';

beforeAll(() => {
  process.env.NEXT_PUBLIC_GIPHY_API_KEY = MOCK_KEY;
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_GIPHY_API_KEY;
});

const mockFetch = (status: number, body: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
};

const gifPayload = {
  data: [{ id: '1', title: 'Cool GIF', url: 'https://giphy.com/1', embed_url: '', images: { original: { url: '', mp4: '', width: '480', height: '270' }, original_mp4: { mp4: '', mp4_size: '', width: '480', height: '270' }, fixed_height: { url: '', mp4: '', width: '200', height: '200' }, downsized: { url: '', mp4: '', width: '200', height: '200' } } }],
  pagination: { total_count: 100, count: 1, offset: 0 },
  meta: { status: 200, msg: 'OK', response_id: 'abc' },
};

describe('searchGifs', () => {
  it('returns parsed search results', async () => {
    mockFetch(200, gifPayload);
    const result = await searchGifs('cats');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
  });

  it('throws GiphyRateLimitError on 429', async () => {
    mockFetch(429, {});
    await expect(searchGifs('cats')).rejects.toThrow(GiphyRateLimitError);
  });

  it('throws GiphyApiError on other non-OK status', async () => {
    mockFetch(500, {});
    await expect(searchGifs('cats')).rejects.toThrow(GiphyApiError);
  });

  it('includes the api_key query parameter', async () => {
    mockFetch(200, gifPayload);
    await searchGifs('dogs');
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(`api_key=${MOCK_KEY}`);
    expect(url).toContain('q=dogs');
  });

  it('applies the correct offset for pagination', async () => {
    mockFetch(200, gifPayload);
    await searchGifs('dogs', 24);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('offset=24');
  });
});

describe('getTrendingGifs', () => {
  it('returns the data array from the trending endpoint', async () => {
    mockFetch(200, gifPayload);
    const result = await getTrendingGifs(3);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe('1');
  });

  it('returns exactly 3 distinct GIFs picked from one request', async () => {
    const many = {
      ...gifPayload,
      data: Array.from({ length: 25 }, (_, i) => ({ ...gifPayload.data[0], id: String(i) })),
    };
    mockFetch(200, many);
    const result = await getTrendingGifs(3);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((g) => g.id)).size).toBe(3);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('limit=25');
  });

  it('throws GiphyRateLimitError on 429', async () => {
    mockFetch(429, {});
    await expect(getTrendingGifs()).rejects.toThrow(GiphyRateLimitError);
  });
});
