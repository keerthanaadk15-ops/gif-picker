'use client';

interface CopyAlertProps {
  visible: boolean;
}

/**
 * Fixed-position toast that appears at the bottom of the screen for 3 s after
 * the user copies a GIF URL.  The 3 s timeout is managed by the parent so
 * this component stays pure/presentational (easier to test).
 */
export function CopyAlert({ visible }: CopyAlertProps) {
  return (
    <div
      className={`copy-alert${visible ? ' copy-alert--visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      ✅ GIF URL copied to clipboard!
    </div>
  );
}
