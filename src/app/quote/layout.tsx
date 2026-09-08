import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";


export const metadata: Metadata = {
  title:
    "Get a Certified Translation Quote",

  description:
    "Upload your document securely and request a professional certified translation quotation from GLOBAL TRANSLATION HUB.",

  alternates: {
    canonical:
      "/quote",
  },

  openGraph: {
    url:
      "/quote",
  },
};


export default function QuoteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}