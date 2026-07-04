import type { Metadata } from "next";
import { Almarai, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const almarai = Almarai({
  weight: ["300", "400", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-almarai",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NEXUS — AI-Powered Arabic IDE",
  description:
    "NEXUS is an AI-powered Arabic-first IDE with a unique Arabic-to-code translation engine, AI security analyzer (taint flow, attack chaining, CVSS), and a 3-mode AI coding agent. Built for the TestSprite Hackathon Season 3 — Build the Loop.",
  keywords: [
    "NEXUS",
    "Arabic IDE",
    "AI code editor",
    "security analyzer",
    "taint analysis",
    "TestSprite",
    "hackathon",
  ],
  authors: [{ name: "MOAAMN SAYED" }],
  openGraph: {
    title: "NEXUS — AI-Powered Arabic IDE",
    description:
      "Arabic-first IDE with AI security analyzer and Arabic-to-code translation engine.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${almarai.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="font-sans text-zinc-100 bg-[#020202]"
        suppressHydrationWarning
      >
        <a href="#main-content" className="skip-link">
          تخطّى إلى المحتوى
        </a>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
