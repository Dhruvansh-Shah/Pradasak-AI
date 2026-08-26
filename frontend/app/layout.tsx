import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NSFDC Channel Finance — Scheme Finder',
  description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
