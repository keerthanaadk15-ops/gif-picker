'use client';

import type { GiphyGif, SearchState } from '@/types/giphy';
import { GifCard } from './GifCard';

interface GifGridProps {
  gifs: GiphyGif[];
  state: SearchState;
  onCopy: (url: string) => void;
  isTrending?: boolean;
}

export function GifGrid({ gifs, state, onCopy, isTrending }: GifGridProps) {
  const gridClassName = `gif-grid${isTrending ? ' gif-grid--trending' : ''}`;

  if (state === 'loading') {
    return (
      <div className={`${gridClassName} gif-grid--loading`} aria-busy="true">
        {Array.from({ length: isTrending ? 3 : 12 }).map((_, i) => (
          <div key={i} className="gif-card gif-card--skeleton" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="gif-grid__message gif-grid__message--error" role="alert">
        <span>⚠️</span>
        <p>Something went wrong. Please try again.</p>
      </div>
    );
  }

  if (state === 'rate-limited' && gifs.length === 0) {
    return (
      <div className="gif-grid__message" role="status">
        <p>No cached results for this query. Try a search you&apos;ve made before.</p>
      </div>
    );
  }

  if ((state === 'success' || state === 'rate-limited') && gifs.length === 0) {
    return (
      <div className="gif-grid__message" role="status">
        <p>No GIFs found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <section>
      {isTrending && (
        <p className="gif-grid__label">✨ Trending right now</p>
      )}
      <div className={gridClassName} role="list" aria-label="GIF results">
        {gifs.map((gif) => (
          <div key={gif.id} role="listitem">
            <GifCard gif={gif} onCopy={onCopy} />
          </div>
        ))}
      </div>
    </section>
  );
}
