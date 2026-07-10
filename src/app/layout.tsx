import type {Metadata} from 'next';
import { Almarai, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

const almarai = Almarai({
  weight: ['300', '400', '700', '800'],
  subsets: ['arabic'],
  variable: '--font-almarai',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEXUS — AI-Powered Arabic IDE',
  description: 'A smart development environment for writing and previewing code with an AI-powered cybersecurity engine',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico',
    apple: '/nexus-logo.png',
  },
  openGraph: {
    title: 'NEXUS — AI-Powered Arabic IDE',
    description: 'A smart development environment for writing and previewing code with an AI-powered cybersecurity engine',
    type: 'website',
    images: [{ url: '/nexus-logo.png', width: 512, height: 512 }],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/nexus-logo.png" />
      </head>
      <body className="font-sans text-zinc-100 bg-[#020202]" suppressHydrationWarning>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
