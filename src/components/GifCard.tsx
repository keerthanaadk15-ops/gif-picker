'use client';

import type { GiphyGif } from '@/types/giphy';

interface GifCardProps {
  gif: GiphyGif;
  onCopy: (url: string) => void;
}

/**
 * Renders a single GIF as an MP4 <video> element.
 *
 * WHY MP4 INSTEAD OF GIF:
 *  A typical animated GIF is 3–10× larger than the equivalent H.264 MP4.
 *  For example, a 2 MB GIF is commonly ~300 KB as MP4.  Using video/mp4 is
 *  the primary reason the app can meet the <1.5 s load target: less data
 *  transferred = faster Time-to-Interactive.
 *
 * The video is:
 *  – autoPlay   : begins playing as soon as it is buffered (like a GIF)
 *  – loop       : continuous playback (like a GIF)
 *  – muted      : GIFs have no audio; muted is also required for autoplay
 *  – playsInline: prevents iOS fullscreen hijack
 */
export function GifCard({ gif, onCopy }: GifCardProps) {
  const mp4Url =
    gif.images.original_mp4?.mp4 ??
    gif.images.fixed_height?.mp4 ??
    gif.images.original?.mp4;

  const shareUrl = gif.images.original?.url ?? gif.url;

  return (
    <div className="gif-card">
      <div className="gif-card__media">
        {mp4Url && (
          <video
            className="gif-card__video"
            src={mp4Url}
            autoPlay
            loop
            muted
            playsInline
            title={gif.title}
          />
        )}
        <div className="gif-card__overlay">
          <button
            className="gif-card__copy-btn"
            onClick={() => onCopy(shareUrl)}
            aria-label={`Copy GIF URL: ${gif.title}`}
          >
            📋 Copy URL
          </button>
        </div>
      </div>
      {gif.title && (
        <p className="gif-card__title" title={gif.title}>
          {gif.title}
        </p>
      )}
    </div>
  );
}
