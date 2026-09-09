import type {
  MetadataRoute,
} from "next";


export default function robots():
  MetadataRoute.Robots {
  const baseUrl =
    "https://globaltranslationhub.co.uk";


  return {
    rules: [
      {
        userAgent:
          "*",

        allow:
          "/",

        disallow: [
          "/admin",
          "/translator",
          "/auth",
          "/api/",
          "/order",
          "/verify",
          "/payment/",
        ],
      },
    ],

    sitemap:
      `${baseUrl}/sitemap.xml`,
  };
}