import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';

const bodyFont = localFont({
  src: [
    { path: '../../public/fonts/dm-sans-400.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/dm-sans-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/dm-sans-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/dm-sans-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const headingFont = localFont({
  src: [
    { path: '../../public/fonts/sora-400.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/sora-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/sora-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/sora-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kudex | Private, Automated Finance for Modern Businesses',
  description:
    'Kudex is a financial operating system where AI agents pay invoices, trade assets, and earn protected yield automatically without exposing your balances to the public.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${headingFont.variable} min-h-dvh bg-background font-sans text-base leading-relaxed text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
