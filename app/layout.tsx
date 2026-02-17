import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP, Instrument_Serif, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { PageLoader } from "./loader";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── Heading serif font ──
// Swap this import to change the heading typeface globally.
// Good alternatives: Playfair_Display, Cormorant_Garamond, DM_Serif_Display
const headingFont = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "600", // Geist handles variable weights well; 600-800 is ideal for headings.
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zeon | Portfolio",
  description: "Software engineer portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansJP.variable} ${geistMono.variable} ${headingFont.variable} antialiased`}>
        <PageLoader />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-foreground focus:text-background focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
