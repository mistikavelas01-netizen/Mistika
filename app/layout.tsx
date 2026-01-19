import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "@/style/globals.css";
import { Providers } from "./(webapp)/Providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MISTIKA",
    template: "%s | MISTIKA",
  },
  description: "Velas artesanales",
  applicationName: "MISTIKA",
  keywords: [
    "velas artesanales",
    "velas aromaticas",
    "mistika",
    "rituales",
    "aromas",
  ],
  authors: [{ name: "MISTIKA" }],
  creator: "MISTIKA",
  publisher: "MISTIKA",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MISTIKA",
    description: "Velas artesanales",
    url: "/",
    siteName: "MISTIKA",
    images: ["/images/products/HomeImage.jpg"],
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "MISTIKA",
    description: "Velas artesanales",
    images: ["/images/products/HomeImage.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
