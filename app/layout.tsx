import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GalaPo — Discover Olongapo",
    template: "%s | GalaPo",
  },
  description:
    "Your ultimate city business directory for Olongapo City, Philippines. Discover local businesses, restaurants, services, and more.",
  manifest: "/manifest.json",
  applicationName: "GalaPo",
  keywords: [
    "Olongapo",
    "business directory",
    "Philippines",
    "local businesses",
    "restaurants",
    "services",
  ],
  authors: [{ name: "GalaPo" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GalaPo",
  },
  openGraph: {
    type: "website",
    siteName: "GalaPo",
    title: "GalaPo — Discover Olongapo",
    description:
      "Your ultimate city business directory for Olongapo City, Philippines.",
    locale: "en_PH",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B2A4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
