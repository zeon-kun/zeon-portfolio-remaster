import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP, Instrument_Serif, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { PageLoader } from "./loader";
import { PERSONAL_INFO, SKILLS, CERTIFICATIONS } from "@/lib/content";

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

const seoTitle = `${PERSONAL_INFO.name} | ${PERSONAL_INFO.title}`;
const seoDescription = PERSONAL_INFO.summary;
const seoKeywords = [
  PERSONAL_INFO.name,
  PERSONAL_INFO.alias,
  PERSONAL_INFO.title,
  "Portfolio",
  "Software Engineer",
  "Full Stack Developer",
  ...SKILLS.flatMap((s) => s.items),
  ...CERTIFICATIONS.map((c) => c.title),
];

export const metadata: Metadata = {
  title: {
    default: seoTitle,
    template: `%s | ${PERSONAL_INFO.name}`,
  },
  description: seoDescription,
  keywords: seoKeywords,
  authors: [{ name: PERSONAL_INFO.name, url: PERSONAL_INFO.github }],
  creator: PERSONAL_INFO.name,
  applicationName: `${PERSONAL_INFO.name} - Portfolio`,
  openGraph: {
    type: "website",
    title: seoTitle,
    description: seoDescription,
    siteName: `${PERSONAL_INFO.name} - Portfolio`,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    creator: PERSONAL_INFO.alias,
  },
  robots: {
    index: true,
    follow: true,
  },
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
