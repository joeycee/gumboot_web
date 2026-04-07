import type { Metadata } from "next";
import "./globals.css";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Gumboot",
  description: "Book trusted local help in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="gb-app-shell">
          <Navbar />
          <main className="gb-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
