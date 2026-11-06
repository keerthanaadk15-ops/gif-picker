'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { GifGrid } from '@/components/GifGrid';
import { CopyAlert } from '@/components/CopyAlert';
import { ApiLimitBanner } from '@/components/ApiLimitBanner';
import { Pagination } from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useGiphySearch } from '@/hooks/useGiphySearch';
import { PAGE_SIZE } from '@/lib/giphy';

/**
 * Inner component that reads URL search params.
 * Wrapped in <Suspense> below so Next.js can statically render the shell
 * without blocking on the dynamic search-params read.
 */
function GifPickerApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';

  // Input value tracks the text field; URL is updated on the debounced value
  const [inputValue, setInputValue] = useState<string>(urlQuery);
  const [page, setPage] = useState<number>(0);
  const [copyAlertVisible, setCopyAlertVisible] = useState<boolean>(false);

  // 400 ms debounce: balances responsiveness against the 42 req/hr GIPHY limit
  const debouncedQuery = useDebounce(inputValue, 400);

  const { gifs, state, totalCount, isRateLimited } = useGiphySearch(debouncedQuery, page);

  // ── Sync debounced query → URL ─────────────────────────────────────────────
  // Using replace() keeps the history stack clean: typing "c", "ca", "cat"
  // does not create three back-button steps.
  // The early-return guard prevents an infinite loop: router.replace triggers
  // a new searchParams value, which would re-run this effect — unless we
  // short-circuit when the URL already matches the debounced query.
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    const nextQ = debouncedQuery.trim();
    if (currentQ === nextQ) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextQ) {
      params.set('q', nextQ);
    } else {
      params.delete('q');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, router, searchParams]);

  // Reset to page 0 whenever the query changes
  const handleSearch = useCallback((value: string) => {
    setInputValue(value);
    setPage(0);
  }, []);

  // Copy GIF URL and show a toast for 3 s
  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopyAlertVisible(true);
      setTimeout(() => setCopyAlertVisible(false), 3000);
    });
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isShowingTrending = !debouncedQuery.trim();

  return (
    <main className="app">
      <header className="header">
        <h1 className="header__title">🎬 GIF Picker</h1>
        <p className="header__subtitle">
          Search millions of GIFs — copy &amp; paste into any chat
        </p>
        <SearchBar value={inputValue} onChange={handleSearch} />
      </header>

      {isRateLimited && <ApiLimitBanner />}

      <GifGrid
        gifs={gifs}
        state={state}
        onCopy={handleCopy}
        isTrending={isShowingTrending}
      />

      {!isShowingTrending && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <CopyAlert visible={copyAlertVisible} />
    </main>
  );
}

/**
 * Page shell.
 *
 * The <Suspense> boundary lets Next.js pre-render everything outside
 * GifPickerApp as static HTML (the header/search-bar skeleton), which the
 * browser can paint immediately.  The dynamic part (search-params read)
 * streams in without blocking First Contentful Paint.
 *
 * This is the primary architectural decision behind the <1.5 s load time:
 * the user sees the search bar before the JS bundle has even evaluated the
 * search-params hook.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="app">
          <header className="header">
            <h1 className="header__title">🎬 GIF Picker</h1>
            <p className="header__subtitle">
              Search millions of GIFs — copy &amp; paste into any chat
            </p>
            <div className="search-bar">
              <span className="search-bar__icon" aria-hidden="true">🔍</span>
              <input
                className="search-bar__input"
                placeholder="Search for GIFs…"
                disabled
                aria-label="Search GIFs"
              />
            </div>
          </header>
        </main>
      }
    >
      <GifPickerApp />
    </Suspense>
  );
}
