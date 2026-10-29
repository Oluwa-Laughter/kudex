import type { Metadata } from 'next';
import localFont from 'next/font/local';

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
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Kudex | Confidential Settlement & Autonomous Finance on Portaldot 3.0',
  description:
    'Private negotiated settlement, institutional RFQ markets and bounded financial agents on Portaldot V3. Testnet development; confidential transfers remain disabled.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${headingFont.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
