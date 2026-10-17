import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://veca.com.pe/sitemap.xml",
    host: "https://veca.com.pe",
  };
}
