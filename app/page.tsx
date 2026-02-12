import type { Metadata } from "next";
import { LandingPageView } from "@/views/home/LandingPageView";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "MISTIKA | Velas artesanales",
  description:
    "Velas artesanales para transformar tu espacio en calma, aroma y presencia.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MISTIKA | Velas artesanales",
    description:
      "Velas artesanales para transformar tu espacio en calma, aroma y presencia.",
    url: "/",
    siteName: "MISTIKA",
    images: ["/images/products/HomeImage.jpg"],
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "MISTIKA | Velas artesanales",
    description:
      "Velas artesanales para transformar tu espacio en calma, aroma y presencia.",
    images: ["/images/products/HomeImage.jpg"],
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "MISTIKA",
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
      },
      {
        "@type": "WebSite",
        name: "MISTIKA",
        url: siteUrl,
        inLanguage: "es-MX",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageView />
    </>
  );
}
