import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Off On Sync",
  description: "A high-performance Progressive Web App built with Next.js, Bun, and Serwist.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OffOnSync",
  },
  formatDetection: {
    telephone: false,
  },
};

// Dedicated viewport export for optimal PWA mobile rendering (Next.js 14+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#020617",  // Matches bg-slate-950 dark background
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to Supabase: saves ~300ms DNS + TLS handshake on 3G networks */}
        <link rel="preconnect" href="https://uuvvvoznajjqknedxpdg.supabase.co" />
        <link rel="dns-prefetch" href="https://uuvvvoznajjqknedxpdg.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
