import { giphyCache, getCacheKey } from '@/lib/cache';
import type { GiphySearchResponse } from '@/types/giphy';

const makeResponse = (id: string): GiphySearchResponse => ({
  data: [
    {
      type: 'gif',
      id,
      title: `GIF ${id}`,
      url: `https://giphy.com/gifs/${id}`,
      embed_url: `https://giphy.com/embed/${id}`,
      images: {
        original: { url: `https://media.giphy.com/${id}/giphy.gif`, mp4: '', width: '480', height: '270' },
        original_mp4: { mp4: `https://media.giphy.com/${id}/giphy.mp4`, mp4_size: '500000', width: '480', height: '270' },
        fixed_height: { url: '', mp4: '', width: '200', height: '200' },
        downsized: { url: '', mp4: '', width: '200', height: '200' },
      },
    },
  ],
  pagination: { total_count: 100, count: 1, offset: 0 },
  meta: { status: 200, msg: 'OK', response_id: id },
});

describe('LRU Cache', () => {
  beforeEach(() => giphyCache.clear());

  it('returns undefined for a missing key', () => {
    expect(giphyCache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    const key = getCacheKey('cats', 0);
    const res = makeResponse('abc');
    giphyCache.set(key, res);
    expect(giphyCache.get(key)).toEqual(res);
  });

  it('overwrites an existing key without growing size', () => {
    const key = getCacheKey('dogs', 0);
    giphyCache.set(key, makeResponse('a'));
    giphyCache.set(key, makeResponse('b'));
    expect(giphyCache.size).toBe(1);
    expect(giphyCache.get(key)?.data[0].id).toBe('b');
  });

  it('evicts the least recently used entry when full (max 50)', () => {
    for (let i = 0; i < 50; i++) giphyCache.set(`k${i}:0`, makeResponse(String(i)));
    giphyCache.get('k0:0'); // refresh k0 so k1 becomes the oldest
    giphyCache.set('k50:0', makeResponse('50'));
    expect(giphyCache.size).toBe(50);
    expect(giphyCache.has('k0:0')).toBe(true);
    expect(giphyCache.has('k1:0')).toBe(false);
    expect(giphyCache.has('k50:0')).toBe(true);
  });

  it('reports has() correctly', () => {
    const key = getCacheKey('fish', 0);
    expect(giphyCache.has(key)).toBe(false);
    giphyCache.set(key, makeResponse('x'));
    expect(giphyCache.has(key)).toBe(true);
  });
});

describe('getCacheKey', () => {
  it('normalises to lowercase and trims whitespace', () => {
    expect(getCacheKey('  Cats  ', 0)).toBe('cats:0');
  });

  it('includes the offset', () => {
    expect(getCacheKey('dogs', 24)).toBe('dogs:24');
  });
});
