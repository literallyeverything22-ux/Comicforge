import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComicForge — Create Comics with AI',
  description: 'AI-powered comic and manga creation platform. Turn any story idea into a real comic — no drawing skills required.',
  keywords: 'comic creator, manga creator, AI comics, AI manga, comic maker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

