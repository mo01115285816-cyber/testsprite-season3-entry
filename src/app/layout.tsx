import type {Metadata} from 'next';
import { Almarai, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const almarai = Almarai({
  weight: ['300', '400', '700', '800'],
  subsets: ['arabic'],
  variable: '--font-almarai',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NEXUS — AI-Powered Arabic IDE',
  description: 'بيئة تطوير ذكية لكتابة ومعاينة الأكواد مع محرك أمان سيبراني متقدم مدعوم بالذكاء الاصطناعي',
  icons: {
    icon: '/nexus-logo.webp',
    shortcut: '/nexus-logo.webp',
    apple: '/nexus-logo.webp',
  },
  openGraph: {
    title: 'NEXUS — AI-Powered Arabic IDE',
    description: 'بيئة تطوير ذكية لكتابة ومعاينة الأكواد مع محرك أمان سيبراني متقدم مدعوم بالذكاء الاصطناعي',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/webp" href="/nexus-logo.webp" />
        <link rel="icon" type="image/svg+xml" href="/nexus-logo.webp" />
        <link rel="shortcut icon" href="/nexus-logo.webp" />
        <link rel="apple-touch-icon" href="/nexus-logo.webp" />
        <meta property="og:image" content="/nexus-logo.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="/nexus-logo.webp" />
      </head>
      <body className="font-sans text-zinc-100 bg-[#020202]" suppressHydrationWarning>{children}</body>
    </html>
  );
}
