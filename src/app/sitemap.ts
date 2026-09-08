import type {
  MetadataRoute,
} from "next";


export default function sitemap():
  MetadataRoute.Sitemap {
  const baseUrl =
    "https://globaltranslationhub.co.uk";


  return [
    {
      url:
        `${baseUrl}/`,

      changeFrequency:
        "weekly",

      priority:
        1,
    },

    {
      url:
        `${baseUrl}/quote`,

      changeFrequency:
        "weekly",

      priority:
        0.9,
    },

    {
      url:
        `${baseUrl}/privacy`,

      changeFrequency:
        "monthly",

      priority:
        0.4,
    },

    {
      url:
        `${baseUrl}/terms`,

      changeFrequency:
        "monthly",

      priority:
        0.4,
    },

    {
      url:
        `${baseUrl}/refunds`,

      changeFrequency:
        "monthly",

      priority:
        0.4,
    },

    {
      url:
        `${baseUrl}/contact`,

      changeFrequency:
        "monthly",

      priority:
        0.6,
    },
  ];
}