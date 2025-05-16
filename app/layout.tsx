import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "radio.biw.app",
  description: "Listen to local radio stations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
