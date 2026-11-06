'use client';

/**
 * Sticky banner shown once the GIPHY 429 rate-limit response is received.
 * It persists for the rest of the session – the only remediation is to wait
 * for the quota to reset (hourly on the free tier).
 *
 * Previously-fetched pages (held in the LRU cache) remain browsable even
 * while this banner is displayed.
 */
export function ApiLimitBanner() {
  return (
    <div className="api-limit-banner" role="alert" aria-live="assertive">
      <span className="api-limit-banner__icon">⚠️</span>
      <div className="api-limit-banner__body">
        <strong>API limit reached</strong>
        <span>
          The GIPHY free tier allows 42 requests per hour. You can still browse
          any results you&apos;ve already loaded – they&apos;re saved in the
          local cache.
        </span>
      </div>
    </div>
  );
}
