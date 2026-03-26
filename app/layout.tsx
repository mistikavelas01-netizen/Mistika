import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { BiLogoGmail } from "react-icons/bi";
import { FaSquareInstagram, FaWhatsapp } from "react-icons/fa6";
import "@/style/globals.css";
import { getSiteUrl } from "@/lib/app-url";
import { Providers } from "./(webapp)/Providers";

const siteUrl = getSiteUrl();
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL;
const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Providers>
          {children}
          <footer className="border-t border-black/10 bg-black/5">
            <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-black/60">
              <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 sm:text-xs">
                    Horario
                  </span>
                  <p className="text-[11px] text-black/70 sm:text-xs">
                    Lunes a domingo de 9am a 7pm
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 sm:text-xs">
                    Redes sociales
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-end">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#E1306C] transition-all duration-150 hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                    aria-label="Instagram"
                  >
                    <FaSquareInstagram size={18} />
                  </a>
                  {WHATSAPP_URL ? (
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#25D366] transition-all duration-150 hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                      aria-label="WhatsApp"
                    >
                      <FaWhatsapp size={20} />
                    </a>
                  ) : null}
                  {CONTACT_EMAIL ? (
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#EA4335] transition-all duration-150 hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                      aria-label={`Correo: ${CONTACT_EMAIL}`}
                    >
                      <BiLogoGmail size={18} />
                    </a>
                  ) : null}
                  </div>
                </div>
              </div>

              <p className="mt-4 border-t border-black/10 pt-4 text-center text-[11px] sm:text-xs">
                © {year} Mistika. Todos los derechos reservados.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
