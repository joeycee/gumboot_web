import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { getSiteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "Gumboot",
  description: "Book trusted local help in minutes.",
  openGraph: {
    title: "Gumboot",
    description: "Book trusted local help in minutes.",
    siteName: "Gumboot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gumboot",
    description: "Book trusted local help in minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Suspense fallback={null}>
          <ScrollToTopOnNavigate />
        </Suspense>
        <div className="gb-app-shell">
          <Navbar />
          <main className="gb-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
