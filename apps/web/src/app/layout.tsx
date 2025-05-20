import type { Metadata } from "next";

import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://radio.biw.app";
const SITE_TITLE = "radio.biw.app";
const SITE_DESCRIPTION = "Listen to San Francisco's radio stations";
const OG_IMAGE = `${SITE_URL}/og-image-1.jpg`;

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  openGraph: {
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    title: SITE_TITLE,
  },
  title: SITE_TITLE,
  twitter: {
    card: "summary_large_image",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    title: SITE_TITLE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={montserrat.className} lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
