# 🎬 GIF Picker

**Live: https://gif-picker-stuller.vercel.app/**

A fast, accessible GIF search and share tool built with Next.js 15 and TypeScript, powered by the GIPHY API.

---

## Features

| Feature | Status |
|---|---|
| Search for GIFs with a clear, prominent search bar | ✅ |
| URL-synced search (`?q=cats`) – shareable, bookmarkable | ✅ |
| Copy GIF URL to clipboard in one click | ✅ |
| Toast alert when URL is copied | ✅ |
| Results appear ~400 ms after you stop typing (debounced) | ✅ |
| Cycle through pages of results (pagination) | ✅ |
| Alert when GIPHY rate limit is reached | ✅ |
| Browse previous results after rate limit hits (LRU cache) | ✅ |
| 3 random GIFs shown before any search | ✅ |
| MP4 video rendering via `<video>` | ✅ |
| Loads in under 1.5 s | ✅ First paint 0.3 s desktop / 0.9 s throttled mobile; ⚠️ throttled-mobile time-to-interactive 1.8 s (see [PERFORMANCE.md](docs/PERFORMANCE.md)) |
| Works in modern browsers | Uses standard APIs; only Chromium/Edge tested so far |
| TypeScript (strict mode) | ✅ |
| Full test suite (Jest + React Testing Library) | ✅ |

---

## Getting started locally

### Prerequisites

- Node.js 20+
- A free GIPHY API key — see **Accounts** below

### Windows without Node on PATH

If Node.js isn't on your PATH, use `run.cmd` (edit `NODE_HOME` inside it to
point at your Node folder). It sets PATH for that command only:

```
run.cmd install    run.cmd dev    run.cmd test    run.cmd build
```

### 1. Clone and install

```bash
git clone <your-repo-url>
cd gif-picker
npm install
```

### 2. Set up your environment

```bash
cp .env.example .env.local
```

Open `.env.local` and paste your GIPHY API key:

```
NEXT_PUBLIC_GIPHY_API_KEY=your_actual_key_here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test            # run once
npm run test:watch  # watch mode
npm test -- --coverage  # with coverage report
```

### 5. Build for production

```bash
npm run build
npm start
```

---

## Deploying to Vercel

This project was deployed with the Vercel command line (no GitHub needed):

```
run.cmd npx vercel login
run.cmd npx vercel link --yes --project gif-picker
run.cmd npx vercel env add NEXT_PUBLIC_GIPHY_API_KEY --environment production --type config --value <your key> --yes
run.cmd npx vercel deploy --prod --yes
```

Vercel assigns the public URL. Alternatively, push the repository to GitHub
and import it at [vercel.com](https://vercel.com) (add the same environment
variable), which also redeploys automatically on every push.

---

## Accounts to create (on Keerthana's name)

### 1. GIPHY Developer Account

1. Go to [developers.giphy.com](https://developers.giphy.com)
2. Sign up with Keerthana's email.
3. Dashboard → **Create an App** → choose **API** → fill in the app name
   (e.g. "GIF Picker") and description.
4. Copy the **API Key** and add it to `.env.local` and Vercel environment
   variables.

> **Rate limits**: Free tier = 42 requests/hour, 1 000/day.
> The app handles the 429 response gracefully and shows a warning banner.

### 2. Vercel Account

Sign up at [vercel.com](https://vercel.com) with Keerthana's email. This is
where the public URL lives.

### 3. GitHub Account (optional)

Needed only if you want to store the code online and have Vercel redeploy
automatically on every push.

---

## Project structure

```
gif-picker/
├── src/
│   ├── app/
│   │   ├── layout.tsx       Root HTML, metadata, preconnect hints
│   │   ├── page.tsx         Main page + Suspense boundary
│   │   └── globals.css      All styles (no CSS-in-JS)
│   ├── components/
│   │   ├── SearchBar.tsx    Controlled search input
│   │   ├── GifGrid.tsx      Responsive grid, skeleton states
│   │   ├── GifCard.tsx      MP4 video card + copy button
│   │   ├── CopyAlert.tsx    Clipboard toast
│   │   ├── ApiLimitBanner.tsx  Rate-limit warning
│   │   └── Pagination.tsx   Prev / Next navigation
│   ├── hooks/
│   │   ├── useDebounce.ts   400 ms debounce hook
│   │   └── useGiphySearch.ts  Cache-first fetching + rate-limit handling
│   ├── lib/
│   │   ├── giphy.ts         GIPHY API client
│   │   └── cache.ts         LRU in-memory cache
│   ├── types/
│   │   └── giphy.ts         TypeScript types for GIPHY responses
│   └── __tests__/           Jest + RTL tests
├── docs/
│   ├── ARCHITECTURE.md      Design decisions explained
│   ├── PERFORMANCE.md       How the <1.5 s target is met
│   └── TESTING.md           Test strategy + benchmark results
├── .env.example             Environment variable template
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Key architectural decisions (quick reference)

| Decision | Reason |
|---|---|
| **Next.js + Suspense** | Static HTML shell paints before hydration (measured FCP 0.3 s desktop / 0.9 s mobile) |
| **MP4 via `<video>`** | Required by the brief; smaller than GIF and plays progressively |
| **400 ms debounce** | Respects the 42 req/hr GIPHY limit |
| **LRU cache (50 entries)** | Zero-latency repeat queries; survives rate limits |
| **URL search params** | Shareable + bookmarkable searches |
| **No external libraries** | First Load JS is 106 kB (almost all React/Next runtime) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full analysis.

---

## Browser support

The app uses only widely supported standards (`URLSearchParams`,
`navigator.clipboard`, `<video autoplay muted playsinline>`, CSS custom
properties, `aspect-ratio`), available in current Chrome, Edge, Firefox and
Safari. Only Chromium/Edge has been tested so far. `navigator.clipboard`
requires HTTPS (or localhost), which Vercel provides.
