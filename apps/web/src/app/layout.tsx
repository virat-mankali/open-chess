import type { Metadata } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '../styles.css';
export const metadata: Metadata = {
  title: 'OpenChess — Your next brilliant move',
  description: 'Play chess bots, learn at your pace, and understand every move with OpenChess.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
