# Testing — GIF Picker

## Strategy

Tests use **Jest 29** and **React Testing Library 16**. They verify behaviour
from the user's perspective. The GIPHY network is always mocked, so the
suite is deterministic and spends no API quota.

## Latest result (real run)

```
Test Suites: 7 passed, 7 total
Tests:       44 passed, 44 total
```

Type-check (`npx tsc --noEmit`): no errors. Production build (`next build`):
succeeds.

### Coverage (from `npm test`)

| Area | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| **All files** | 72.16 | 86.25 | 93.1 | 72.16 |
| components/ | 99.2 | 90.32 | 100 | 99.2 |
| hooks/ | 94.32 | 78.26 | 100 | 94.32 |
| lib/ | 100 | 95.83 | 100 | 100 |
| app/page.tsx | 0 | 0 | 0 | 0 |
| types/giphy.ts | 0 | 0 | 0 | 0 |

The overall figure is pulled down by `app/page.tsx` (URL sync, clipboard
copy, toast timer), which has **no automated test yet**, and by the
type-only file. These behaviours were not verified in a browser either,
because that needs a real GIPHY key (see "Not yet verified").

## Test matrix

| File | What it covers |
|---|---|
| `cache.test.ts` | get/set, overwrite, **LRU eviction order**, `has`, key normalisation |
| `useDebounce.test.ts` | initial value, no early update, update after delay, timer reset |
| `giphy.test.ts` | 200 / 429 / 500 handling, `api_key`/`q`/`offset` params, picks exactly 3 distinct GIFs from one request |
| `useGiphySearch.test.ts` | 3 starting GIFs with no query, search + totalCount, page→offset, **cache hit avoids 2nd request**, 429 → rate-limited, **cached results still shown after limit and no further requests**, generic error |
| `SearchBar.test.tsx` | render, onChange, clear button show/hide/click |
| `GifCard.test.tsx` | `<video>` with MP4 src, autoplay/loop/muted, title, copy callback |
| `components.test.tsx` | GifGrid states (loading skeletons, error, empty, rate-limited, trending), Pagination bounds, CopyAlert, ApiLimitBanner |

## Running

```bash
npm test               # all tests + coverage
npm run test:watch
```

## Performance results

See [PERFORMANCE.md](PERFORMANCE.md). On the deployed site: desktop first
paint 0.3 s / interactive 0.7 s; throttled mobile first paint 0.9 s /
interactive 1.8 s (over the 1.5 s target).

## Live end-to-end check (real browser, real GIPHY)

Current live site: [GIF Picker](https://gif-picker-stuller.vercel.app/).

The results below were recorded with Playwright driving Microsoft Edge against
the previous deployment with the real API key. Single run; these checks have
not been rerun against the current deployment.
The same script run earlier against the local production build gave the same
results.

| # | Check | Result |
|---|---|---|
| 1 | 3 random GIFs on load, rendered as MP4 `<video>` | 3 videos; playing 721 ms after navigation (includes API call + MP4 fetch). Two separate loads showed different sets of 3 |
| 2 | Type "cats" → results after debounce | 12 videos about 465 ms after typing; URL became `?q=cats` shortly after (~0.5 s later) |
| 3 | Copy button → toast + clipboard | Toast shown; clipboard held the `giphy.gif` media URL |
| 4 | Pagination (cycle through results) | "Page 2 of 42" |
| 5 | Back to page 1 | Served from cache; no extra API request |
| 6 | Open `/?q=dogs` directly | Input prefilled with "dogs"; 12 videos |

The session used **4 API requests** (starting GIFs, cats p1, cats p2, dogs).
The browser console showed no errors.

## Not yet verified

- The real HTTP 429 banner against live GIPHY (covered by unit tests with a
  mocked 429; not triggered live to avoid exhausting the quota).
- Cross-browser behaviour (only Edge/Chromium was available locally).
- URL syncing and the copy toast have no automated unit test
  (`app/page.tsx`); they were verified only by the live browser check above.
