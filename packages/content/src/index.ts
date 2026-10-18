import { z } from "zod";

export const CATEGORIES = [
  {
    id: "edificios",
    name: "Edificios y fachadas",
    description: "Arquitectura y proyectos inmobiliarios",
  },
  {
    id: "viviendas",
    name: "Casas y departamentos",
    description: "Ventanas y soluciones para el hogar",
  },
  {
    id: "interiores",
    name: "Interiores y mamparas",
    description: "Ambientes conectados por el vidrio",
  },
  {
    id: "comercios",
    name: "Oficinas y comercios",
    description: "Espacios para trabajar y recibir",
  },
  {
    id: "remodelaciones",
    name: "Remodelaciones",
    description: "Una nueva perspectiva para tu espacio",
  },
] as const;
export const TAGS = [
  "Ventanas",
  "Mamparas",
  "Fachadas",
  "Puertas de vidrio",
  "Espejos",
  "Vidrio templado",
  "Vidrio laminado",
  "Aluminio",
  "Luz natural",
  "Divisiones",
  "Reemplazo de vidrio",
] as const;
export const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
export const plainText = (node: RichNode): string =>
  node.type === "text"
    ? node.text || ""
    : (node.content || [])
        .map(plainText)
        .join(
          ["doc", "bulletList", "orderedList"].includes(node.type) ? " " : "",
        );
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
const allowedNodes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "image",
]);
const allowedMarks = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
]);
export function validBody(value: unknown): value is RichNode {
  let count = 0;
  const walk = (n: any, depth: number): boolean => {
    if (
      !n ||
      typeof n !== "object" ||
      depth > 20 ||
      ++count > 3000 ||
      !allowedNodes.has(n.type)
    )
      return false;
    if (
      n.text !== undefined &&
      (typeof n.text !== "string" || n.text.length > 30000)
    )
      return false;
    if (n.type === "image" && (!n.attrs || typeof n.attrs.mediaId !== "string"))
      return false;
    if (
      n.marks &&
      (!Array.isArray(n.marks) ||
        !n.marks.every(
          (m: any) =>
            allowedMarks.has(m.type) &&
            (m.type !== "link" ||
              (typeof m.attrs?.href === "string" &&
                /^https?:\/\//i.test(m.attrs.href))),
        ))
    )
      return false;
    return (
      n.content === undefined ||
      (Array.isArray(n.content) &&
        n.content.every((child: unknown) => walk(child, depth + 1)))
    );
  };
  return walk(value, 0) && (value as RichNode).type === "doc";
}
export const bodySchema = z.custom<RichNode>(
  validBody,
  "El contenido contiene un formato no permitido o es demasiado largo.",
);
export const mediaSchema = z.object({
  id: z.string().min(1).max(100),
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(220).default(""),
  caption: z.string().trim().max(400).default(""),
  positionX: z.number().min(0).max(100).default(50),
  positionY: z.number().min(0).max(100).default(50),
});
export const projectInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "El título debe tener al menos 4 caracteres.")
      .max(140),
    excerpt: z.string().trim().max(320).default(""),
    category: z.enum(categoryIds),
    tags: z.array(z.enum(TAGS)).max(8),
    location: z.string().trim().max(100).default("Lima"),
    body: bodySchema,
    images: z.array(mediaSchema).max(24),
    coverId: z.string().max(100).nullable(),
    coverLayout: z.enum(["top", "left", "right"]).default("top"),
    featured: z.boolean().default(false),
    featuredOrder: z.number().int().min(0).max(999).default(0),
    version: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Project = ProjectInput & {
  id: string;
  slug: string;
  status: "draft" | "published";
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  seo: {
    title: string;
    description: string;
    canonical: string;
    image: string | null;
  };
  hasUnpublishedChanges?: boolean;
};
export function seoFor(project: ProjectInput, slug: string) {
  const text =
    project.excerpt ||
    plainText(project.body) ||
    `${project.title}. Proyecto de Vidrios VECA en ${project.location || "Lima"}.`;
  return {
    title: `${project.title} | Vidrios VECA`,
    description: text.replace(/\s+/g, " ").trim().slice(0, 160),
    canonical: `https://veca.com.pe/proyectos/${slug}/`,
    image: project.images.find((i) => i.id === project.coverId)?.url || null,
  };
}
export const emptyProject = (): ProjectInput => ({
  title: "",
  excerpt: "",
  category: "viviendas",
  tags: [],
  location: "Lima",
  body: { type: "doc", content: [{ type: "paragraph" }] },
  images: [],
  coverId: null,
  coverLayout: "top",
  featured: false,
  featuredOrder: 0,
});

export * from "./crm.js";
