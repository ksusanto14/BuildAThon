import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://rite.app", lastModified: new Date(), priority: 1 },
    { url: "https://rite.app/login", lastModified: new Date(), priority: 0.8 },
  ];
}
