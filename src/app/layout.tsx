import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sunsetwell.com'),
  title: {
    default: "SunsetWell | Find Senior Care Facilities Near You",
    template: "%s | SunsetWell"
  },
  description:
    "Search 75,000+ nursing homes, assisted living facilities, and home health agencies nationwide. Find Medicare & Medicaid accepted senior care with verified CMS data.",
  keywords: [
    "senior care",
    "nursing homes near me",
    "assisted living facilities",
    "home health care",
    "Medicare facilities",
    "Medicaid facilities",
    "elder care",
    "memory care",
    "skilled nursing",
    "senior housing"
  ],
  authors: [{ name: "SunsetWell" }],
  creator: "SunsetWell",
  publisher: "SunsetWell",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sunsetwell.com",
    title: "SunsetWell | Find Senior Care Facilities Near You",
    description: "Search 75,000+ verified senior care facilities. Medicare.gov data updated daily.",
    siteName: "SunsetWell",
  },
  twitter: {
    card: "summary_large_image",
    title: "SunsetWell | Find Senior Care Facilities",
    description: "Search 75,000+ verified senior care facilities near you.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens when available
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
