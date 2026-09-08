import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/app/AnalyticsTracker";
import GoogleConsent from "@/components/google/GoogleConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      "https://globaltranslationhub.co.uk"
  ),

  title: {
    default:
      "Certified Translation Services UK | GLOBAL TRANSLATION HUB",
    template:
      "%s | GLOBAL TRANSLATION HUB",
  },

  description:
    "Professional certified translation services in the UK for immigration, legal, academic and official documents. Russian, Tajik, Chinese and other language pairs. Secure online ordering and document upload.",

  applicationName:
    "GLOBAL TRANSLATION HUB",

  keywords: [
    "certified translation UK",
    "certified translation services",
    "Russian to English translation",
    "Tajik to English translation",
    "Chinese to English translation",
    "UKVI translation",
    "legal translation UK",
    "official document translation",
  ],

  authors: [
    {
      name:
        "GLOBAL TRANSLATION HUB",
    },
  ],

  creator:
    "GLOBAL TRANSLATION HUB",

  publisher:
    "KHUDOYNAZAR LTD",


  openGraph: {
    type:
      "website",

    locale:
      "en_GB",

    siteName:
      "GLOBAL TRANSLATION HUB",

    title:
      "Certified Translation Services UK | GLOBAL TRANSLATION HUB",

    description:
      "Professional certified translation services for official, legal, immigration and academic documents in the UK.",

    images: [
      {
        url:
          "/branding/gth-logo.png",

        width:
          1200,

        height:
          630,

        alt:
          "GLOBAL TRANSLATION HUB",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Certified Translation Services UK | GLOBAL TRANSLATION HUB",

    description:
      "Professional certified translation services for official, legal, immigration and academic documents in the UK.",

    images: [
      "/branding/gth-logo.png",
    ],
  },

  robots: {
    index:
      true,

    follow:
      true,

    googleBot: {
      index:
        true,

      follow:
        true,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GoogleConsent />
        <AnalyticsTracker />

        {children}
      </body>
    </html>
  );
}