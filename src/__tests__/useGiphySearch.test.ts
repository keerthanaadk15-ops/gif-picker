import { renderHook, waitFor } from '@testing-library/react';
import { useGiphySearch } from '@/hooks/useGiphySearch';
import { giphyCache } from '@/lib/cache';
import * as api from '@/lib/giphy';
import type { GiphySearchResponse } from '@/types/giphy';

jest.mock('@/lib/giphy', () => {
  const actual = jest.requireActual('@/lib/giphy');
  return { ...actual, searchGifs: jest.fn(), getTrendingGifs: jest.fn() };
});

const searchGifs = api.searchGifs as jest.Mock;
const getTrendingGifs = api.getTrendingGifs as jest.Mock;

const gif = (id: string) => ({ id, title: id, url: '', embed_url: '', type: 'gif', images: {} });
const response = (ids: string[], total = 40): GiphySearchResponse => ({
  data: ids.map(gif) as unknown as GiphySearchResponse['data'],
  pagination: { total_count: total, count: ids.length, offset: 0 },
  meta: { status: 200, msg: 'OK', response_id: 'x' },
});

beforeEach(() => {
  giphyCache.clear();
  jest.resetAllMocks();
});

describe('useGiphySearch', () => {
  it('loads 3 trending GIFs when there is no query', async () => {
    getTrendingGifs.mockResolvedValue([gif('a'), gif('b'), gif('c')]);
    const { result } = renderHook(() => useGiphySearch('', 0));
    await waitFor(() => expect(result.current.state).toBe('success'));
    expect(result.current.gifs).toHaveLength(3);
    expect(getTrendingGifs).toHaveBeenCalledWith(3);
  });

  it('fetches search results and exposes totalCount', async () => {
    searchGifs.mockResolvedValue(response(['1', '2'], 99));
    const { result } = renderHook(() => useGiphySearch('cats', 0));
    await waitFor(() => expect(result.current.state).toBe('success'));
    expect(result.current.gifs).toHaveLength(2);
    expect(result.current.totalCount).toBe(99);
    expect(searchGifs).toHaveBeenCalledWith('cats', 0);
  });

  it('uses the page index to compute the API offset', async () => {
    searchGifs.mockResolvedValue(response(['1']));
    renderHook(() => useGiphySearch('cats', 2));
    await waitFor(() => expect(searchGifs).toHaveBeenCalledWith('cats', 2 * api.PAGE_SIZE));
  });

  it('serves a repeated query from cache without a second request', async () => {
    searchGifs.mockResolvedValue(response(['1']));
    const first = renderHook(() => useGiphySearch('cats', 0));
    await waitFor(() => expect(first.result.current.state).toBe('success'));
    const second = renderHook(() => useGiphySearch('Cats', 0));
    await waitFor(() => expect(second.result.current.state).toBe('success'));
    expect(searchGifs).toHaveBeenCalledTimes(1);
  });

  it('flags rate limiting on a 429', async () => {
    searchGifs.mockRejectedValue(new api.GiphyRateLimitError());
    const { result } = renderHook(() => useGiphySearch('cats', 0));
    await waitFor(() => expect(result.current.state).toBe('rate-limited'));
    expect(result.current.isRateLimited).toBe(true);
  });

  it('still shows cached results after the limit is hit, and makes no more requests', async () => {
    searchGifs.mockResolvedValueOnce(response(['1']));
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useGiphySearch(q, 0),
      { initialProps: { q: 'cats' } }
    );
    await waitFor(() => expect(result.current.gifs).toHaveLength(1));

    searchGifs.mockRejectedValueOnce(new api.GiphyRateLimitError());
    rerender({ q: 'dogs' });
    await waitFor(() => expect(result.current.state).toBe('rate-limited'));

    rerender({ q: 'cats' });
    await waitFor(() => expect(result.current.state).toBe('success'));
    expect(result.current.gifs).toHaveLength(1);
    expect(result.current.isRateLimited).toBe(true);

    rerender({ q: 'birds' });
    await waitFor(() => expect(result.current.state).toBe('rate-limited'));
    expect(searchGifs).toHaveBeenCalledTimes(2);
  });

  it('reports a generic error for non-429 failures', async () => {
    searchGifs.mockRejectedValue(new api.GiphyApiError(500));
    const { result } = renderHook(() => useGiphySearch('cats', 0));
    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.isRateLimited).toBe(false);
  });
});
