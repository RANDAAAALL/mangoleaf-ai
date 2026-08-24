import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MangoLeaf AI",
  description:
    "Offline-First Mango Leaf Disease Diagnostic PWA powered by TensorFlow.js and Supabase.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MangoLeaf AI",
  },
  icons: {
    icon: [
      { url: "/images/icons/svg/favicon.svg", type: "image/svg+xml" },
      {
        url: "/images/icons/png/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/icons/png/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: "/images/icons/png/apple-touch-icon.png",
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
  themeColor: "#277839",
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
        <link
          rel="preconnect"
          href="https://uuvvvoznajjqknedxpdg.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://uuvvvoznajjqknedxpdg.supabase.co"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
