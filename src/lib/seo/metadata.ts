import type { Metadata } from "next";
export const siteUrl = "https://globaltranslationhub.co.uk";
export function publicMetadata(title: string, description: string, pathname: string): Metadata {
 const fullTitle = title.includes("GLOBAL TRANSLATION HUB") ? title : title + " | GLOBAL TRANSLATION HUB";
 return {title: {absolute: fullTitle}, description, alternates: {canonical: siteUrl + pathname},
 openGraph: {type: "website", locale: "en_GB", siteName: "GLOBAL TRANSLATION HUB", title: fullTitle, description, url: siteUrl + pathname, images: [{url: siteUrl + "/branding/gth-logo.png", alt: "GLOBAL TRANSLATION HUB"}]},
 twitter: {card: "summary_large_image", title: fullTitle, description, images: [siteUrl + "/branding/gth-logo.png"]}};
}
