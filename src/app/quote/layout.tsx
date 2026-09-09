import { publicMetadata } from "@/lib/seo/metadata";
import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";


export const metadata: Metadata = publicMetadata("Get a Certified Translation Quote", "Upload your document securely and request a professional certified translation quotation from GLOBAL TRANSLATION HUB.", "/quote");


export default function QuoteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}