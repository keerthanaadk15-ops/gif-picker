# Architecture — GIF Picker

## Overview

GIF Picker is a Next.js 15 (App Router) single-page application written in
TypeScript.  It fetches GIFs from the GIPHY API, renders them as MP4 videos,
and lets the user copy a shareable URL to their clipboard.

---

## Technology Decisions

### 1. Next.js over plain Create-React-App

| Concern | Plain CRA | Next.js (chosen) |
|---|---|---|
| Initial HTML | Empty shell, blank screen until JS parses | Pre-rendered shell via SSR/SSG |
| Code splitting | Manual | Automatic per-route |
| Deployment | Any static host | Vercel (zero-config, optimal) |
| Performance | Needs extra tooling | Built-in image optimisation, font loading, preconnect hints |

The most impactful choice for the <1.5 s load target is that Next.js sends
real HTML to the browser before any JavaScript has executed.  The user sees
the search bar immediately.

### 2. App Router with Suspense boundaries

`page.tsx` wraps the dynamic inner component (`GifPickerApp`) in a
`<Suspense>` boundary.  This splits the page into two rendering phases:

1. **Shell** — rendered statically, sent with the first response.  Contains
   the header and a disabled search input.  Measured first paint on the live
   site: 0.3 s on desktop, 0.9 s on throttled mobile.
2. **Dynamic layer** — the `useSearchParams()` hook reads the URL query
   string, which requires client-side hydration.  Suspense streams this in
   without blocking the initial paint.

Without Suspense, Next.js would defer the entire page until the search-params
read was ready, losing the static shell benefit entirely.

### 3. TypeScript (strict mode)

All files use TypeScript with `"strict": true`.  The primary benefits for this
project are:

- `GiphyGif`, `GiphySearchResponse`, `SearchState` types force compile-time
  awareness of optional fields in the GIPHY payload (e.g. `original_mp4` may
  be absent on older entries).
- The `SearchState` union (`'idle' | 'loading' | 'success' | 'error' | 'rate-limited'`)
  makes exhaustive UI rendering impossible to get wrong without a build error.

### 4. MP4 video instead of GIF

The PDF requires this, but the reason is important:

| Format | Compression | Notes |
|---|---|---|
| Animated GIF | Little compression between frames | Usually the larger file |
| H.264 MP4 | Compresses between frames | Usually several times smaller |

We did not benchmark GIF against MP4 for this app. For reference, one MP4
returned by GIPHY during our live test (`original_mp4`, a "cats" result)
was about 325 KB.

GIPHY provides the MP4 via `images.original_mp4.mp4`.  Using `<video
autoplay loop muted playsinline>` gives the same visual behaviour as a GIF
while transferring less data.

### 5. Debouncing at 400 ms

The GIPHY free tier allows **42 requests per hour** (one every 85 s on
average).  Without debouncing, a user typing "funny cats" (10 keystrokes)
would fire up to 10 requests within a couple of seconds.

400 ms was chosen as a judgement call (it is a common rule-of-thumb value,
not something we derived from measurements):
- Short enough that results feel prompt (measured on the live site: results
  appeared about 465 ms after typing stopped).
- Long enough that a normal typing rhythm does not trigger a request between
  keystrokes.
- A user typing a 10-character query steadily fires 1 request instead of 10.

Implementation: a pure `useDebounce<T>(value, delay)` hook based on
`setTimeout` / `clearTimeout`.  No external library is needed; the
implementation is 10 lines and is fully testable with fake timers.

### 6. LRU Client-Side Cache

```
giphyCache = LRUCache<string, GiphySearchResponse>(maxSize = 50)
key = `${query.trim().toLowerCase()}:${offset}`
```

**Why LRU, not a simple Map?**

A plain Map grows unbounded.  The LRU cache holds at most 50 responses, so
memory use has a fixed ceiling.  (We did not measure the memory per entry;
50 is a deliberately modest limit for a session-length cache.)

**Why client-side (not SWR / React Query)?**

The assignment explicitly prohibits third-party libraries beyond a fetch and
a utility library.  The LRU cache serves the same purpose for this use case
(instant cache hits, rate-limit survival) with ~50 lines of plain TypeScript.

**Benefits:**

1. Already-seen queries return **instantly** (0 ms, 0 requests).
2. After the API rate-limit is hit (429), the user can still browse every
   page they have already loaded — the cache survives the error state.
3. Typing and deleting a query re-uses the cached result instead of firing
   a second request.

### 7. URL-synced Search

The search query is stored in the URL query string (`?q=cats`).  This means:

- Sharing the URL opens the app with the same search pre-populated.
- Browser back/forward navigates through search history.
- Bookmarking a search works naturally.

`router.replace()` (not `push`) is used so that typing a query does not flood
the browser history stack with intermediate states.

### 8. Pagination via GIPHY offset

GIPHY's `/search` endpoint accepts an `offset` parameter.  We calculate:

```
offset = page * PAGE_SIZE   (PAGE_SIZE = 12)
```

12 GIFs fills a 4-column grid neatly on desktop.  Each pagination action
checks the cache before firing a network request, so flipping back to a
previous page never costs a request.

### 9. Stale-response protection

`useGiphySearch` uses a `requestId` ref counter.  Every effect execution
increments the counter and captures the current value.  After each `await`,
the code only updates state if its captured `id` still matches the ref.  This is a
zero-dependency alternative to `AbortController` for protecting against
out-of-order responses.

### 10. Three random GIFs before searching

With no search text, `getTrendingGifs` requests a pool of 25 trending GIFs in
**one** API request and picks 3 at random on the client.  GIPHY's `/random`
endpoint returns a single GIF per call, so 3 GIFs would cost 3 of the 42
hourly requests on every visit.  The result is stored in the cache, so it
stays stable for the session.

### 11. Rate-limit cooldown

When GIPHY answers HTTP 429, the hook records a one-hour cooldown (GIPHY's
quota resets hourly).  During the cooldown it makes no new requests, shows
the limit banner, and keeps serving anything already in the cache.

---

## Directory structure

```
gif-picker/
├── src/
│   ├── app/
│   │   ├── layout.tsx       Root HTML shell, metadata, preconnect hints
│   │   ├── page.tsx         Main page + Suspense boundary
│   │   └── globals.css      All styles (CSS custom properties, no CSS-in-JS)
│   ├── components/
│   │   ├── SearchBar.tsx    Controlled input with clear button
│   │   ├── GifGrid.tsx      Grid + skeleton + empty/error states
│   │   ├── GifCard.tsx      MP4 video card + copy button
│   │   ├── CopyAlert.tsx    Clipboard toast notification
│   │   ├── ApiLimitBanner.tsx  Rate-limit warning banner
│   │   └── Pagination.tsx   Prev/Next + page indicator
│   ├── hooks/
│   │   ├── useDebounce.ts   Generic debounce hook (400 ms default)
│   │   └── useGiphySearch.ts  Cache-first data fetching + rate-limit handling
│   ├── lib/
│   │   ├── giphy.ts         GIPHY API client (fetch wrappers + typed errors)
│   │   └── cache.ts         LRU cache (Map-backed, O(1) get/set)
│   ├── types/
│   │   └── giphy.ts         TypeScript types for GIPHY API responses
│   └── __tests__/           Unit + integration tests (Jest + RTL)
├── docs/
│   ├── ARCHITECTURE.md      ← you are here
│   ├── PERFORMANCE.md       How the app meets the <1.5 s target
│   └── TESTING.md           Test strategy and results
└── README.md                Setup, deployment, usage
```

---

## Data flow

```
User types in SearchBar
        │
        ▼ (400 ms debounce)
useDebounce hook
        │
        ▼
useGiphySearch hook
        │
        ├─ cache hit? ──► return cached GiphySearchResponse (0 ms)
        │
        └─ cache miss?
                │
                ▼
        GIPHY /search API
                │
                ├─ 429? ──► set isRateLimited = true
                │           show ApiLimitBanner
                │
                └─ 200 ──► store in LRU cache
                           update gifs + totalCount state
                                   │
                                   ▼
                              GifGrid re-renders
                              GifCard × PAGE_SIZE
```
