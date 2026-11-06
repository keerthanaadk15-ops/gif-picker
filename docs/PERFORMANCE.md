# Performance — How GIF Picker Targets < 1.5 s Load

The assignment requires the app to load in **under 1.5 seconds**. This
document explains the techniques used, and reports the **measured** results
and their limits.

---

## Measured results — deployed site (with real GIPHY data)

Current live site: [GIF Picker](https://gif-picker-stuller.vercel.app/).

The measurements below are from the previous deployment and have not been
rerun against the current deployment. Lighthouse 13.6.0, Microsoft Edge
headless, single run each, trending GIFs loaded from the live API.

| Metric | Desktop preset | Mobile preset (slow 4G, 4× CPU) | Target |
|---|---|---|---|
| Performance score | 100 | 93 | — |
| First Contentful Paint | 0.3 s | 0.9 s | < 1.5 s |
| Largest Contentful Paint | 0.7 s | 0.9 s | < 1.5 s |
| Time to Interactive | 0.7 s | **1.8 s** | < 1.5 s |
| Total Blocking Time | 0 ms | 310 ms | — |
| Cumulative Layout Shift | 0 | 0 | — |
| Total transferred | 362 KiB | 328 KiB | — |

Real-browser timing on the deployed site (unthrottled, Edge): the 3 starting
GIFs were playing **721 ms** after navigation, and search results appeared
**~465 ms** after typing.

Honest summary: first and largest paint meet 1.5 s on both presets, and the
page is interactive in 0.7 s on desktop. **On the deliberately harsh mobile
preset, Time to Interactive is 1.8 s, above 1.5 s.**

## Measured results — local production build (no API key)

Measured against the production build (`next build && next start`) served
locally, before the API key existed, so only the shell was loaded. Each row
is a single run.

| Metric | Desktop preset | Mobile preset (slow 4G, 4× CPU) | Target |
|---|---|---|---|
| Performance score | 100 | 99 | — |
| First Contentful Paint | 0.3 s | 0.8 s | < 1.5 s |
| Largest Contentful Paint | 0.3 s | 0.8 s | < 1.5 s |
| Speed Index | 0.4 s | 0.8 s | — |
| Time to Interactive | 0.5 s | **1.9 s** | < 1.5 s |
| Total Blocking Time | 0 ms | 110 ms | — |
| Cumulative Layout Shift | 0 | 0 | — |
| Total transferred | 114 KiB | 114 KiB | — |

Presets: desktop = 40 ms RTT, 10 Mbps, no CPU slowdown; mobile = 150 ms RTT,
1.6 Mbps, 4× CPU slowdown.

### How to read these numbers honestly

- **The user sees the search bar at 0.3 s (desktop) / 0.8 s (mobile).** Both
  meet the 1.5 s target for first paint and largest paint.
- **Under the harsh mobile preset, Time to Interactive is 1.9 s, which is
  over 1.5 s.** On desktop it is 0.5 s. If "load" is read as "usable", the
  target is met on desktop and missed on throttled mobile. We report this
  rather than hide it.
- **The local runs were made without a GIPHY API key**, so no GIF videos
  were downloaded; they describe the shell and JavaScript only. See the
  deployed-site table above for runs with real data.
- Lighthouse runs vary; these are single runs, not averages.

Reproduce:

```bash
npm run build && npm start            # serves on :3000
npx lighthouse http://localhost:3000 --only-categories=performance --preset=desktop
npx lighthouse http://localhost:3000 --only-categories=performance   # mobile
```

---

## Techniques used

### 1. Pre-rendered HTML shell (Next.js + Suspense)

The route is statically prerendered (`○ Static` in the build output).
`page.tsx` wraps the part that reads `useSearchParams()` in `<Suspense>`, so
the header and a search-bar fallback are in the HTML sent by the server. The
browser paints them before React hydrates, which is why FCP/LCP are well
under 1.5 s even on the throttled preset.

### 2. MP4 video instead of animated GIF

GIFs store each frame with little inter-frame compression. H.264 MP4 of the
same animation is typically several times smaller. The assignment requires MP4; the benefit is
less data per card and progressive playback via `<video autoplay loop muted
playsinline>`. We did not benchmark GIF vs MP4 for this app, so no exact
ratio is claimed.

### 3. Small JavaScript bundle

From `next build`: route `/` is **3.08 kB**, **First Load JS 106 kB**
(gzip), of which ~103 kB is the shared React/Next runtime. No lodash,
axios or other runtime libraries: native `fetch`, `URLSearchParams`, and a
small `useDebounce` hook cover everything the assignment's allowed
"fetch + utility" libraries would.

### 4. Preconnect to GIPHY origins

`layout.tsx` adds `<link rel="preconnect">` for `api.giphy.com` and
`media.giphy.com`, so DNS/TLS setup overlaps with page load rather than
happening when the first request fires.

### 5. Skeleton cards with a fixed aspect ratio

While loading, 12 shimmer cards with `aspect-ratio: 4/3` reserve the grid
space, so results do not shift the layout (measured CLS = 0).

### 6. LRU cache for repeat queries

Repeated queries/pages are served from memory with no network request
(covered by tests in `useGiphySearch.test.ts`). This improves perceived
speed and saves API quota.

### 7. Debounced search

400 ms debounce limits requests while typing, which protects both the
GIPHY quota and the network. See ARCHITECTURE.md for the reasoning.

---

## Known gaps / future work

- Video elements download as soon as they render; there is no
  IntersectionObserver-based lazy loading. For 12 cards this is acceptable,
  but it is the next optimisation if the real-key payload proves heavy.
- TTI on throttled mobile (1.8 s on the live site) exceeds 1.5 s. Candidates: defer hydration
  of non-critical components, or reduce the shared bundle further.
