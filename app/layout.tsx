import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "@/style/globals.css";
import { Providers } from "./(webapp)/Providers";
import { getSiteUrl } from "@/lib/app-url";

const siteUrl = getSiteUrl();
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

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
  const year = new Date().getFullYear();

  return (
    <html lang="es" className="light" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <Providers>
          {children}
          <footer className="border-t border-black/10 bg-black/5">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-black/60 sm:flex-row sm:text-left">
              <p className="text-[11px] sm:text-xs">
                © {year} Mistika. Todos los derechos reservados.
              </p>
              {CONTACT_EMAIL ? (
                <p className="text-[11px] sm:text-xs">
                  Contacto:{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-medium text-black/75 underline underline-offset-2 hover:text-black"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
              ) : null}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
