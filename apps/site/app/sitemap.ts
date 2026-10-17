import type { MetadataRoute } from "next";
import { CATEGORIES } from "@veca/content";
import { api } from "../lib/api";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows =
    await api<{ slug: string; updatedAt: string; category: string }[]>(
      "/public/sitemap",
    );
  const categories = new Set(rows.map((p) => p.category));
  return [
    ...[
      "",
      "/ventanas-vidrio-lima",
      "/vidrios-edificios-lima",
      "/vidrios-remodelaciones-lima",
      "/proyectos",
    ].map((path) => ({
      url: "https://veca.com.pe" + path + "/",
      changeFrequency: "weekly" as const,
    })),
    ...CATEGORIES.filter((c) => categories.has(c.id)).map((c) => ({
      url: `https://veca.com.pe/proyectos/categoria/${c.id}/`,
      changeFrequency: "weekly" as const,
    })),
    ...rows.map((p) => ({
      url: `https://veca.com.pe/proyectos/${p.slug}/`,
      lastModified: p.updatedAt,
    })),
  ];
}
