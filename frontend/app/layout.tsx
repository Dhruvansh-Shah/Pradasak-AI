import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';


export const metadata: Metadata = {
  title: "PradarshakAI - Ministry of Social Justice & Empowerment",
  description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
  icons: {
    icon: [
      { url: "/emblem-gold.png?v=2", href: "/emblem-gold.png?v=2" },
    ],
    apple: [
      { url: "/emblem-gold.png?v=2", href: "/emblem-gold.png?v=2" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
