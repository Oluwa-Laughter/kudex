import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'KUDEX | Autonomous Confidential Settlement Layer & RFQ Marketplace',
  description:
    'Institutional-grade confidential settlement network, protected real-world asset yield vaults, and autonomous agent execution.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-500">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
