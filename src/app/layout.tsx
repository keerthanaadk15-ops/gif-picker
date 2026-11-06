import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GIF Picker – Find & Share GIFs',
  description:
    'Search millions of GIFs powered by GIPHY. Copy the URL in one click and share it in any chat program.',
  keywords: ['GIF', 'GIPHY', 'search', 'animated', 'share'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to GIPHY origins to save a round-trip on the first API call */}
        <link rel="preconnect" href="https://api.giphy.com" />
        <link rel="preconnect" href="https://media.giphy.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
