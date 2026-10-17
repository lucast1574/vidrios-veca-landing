import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Project } from "@veca/content";
import { ProjectArticle } from "@veca/ui";
import { api } from "../../../lib/api";
import { SiteHeader, SiteFooter } from "../../../components/SiteChrome";
export const dynamic = "force-dynamic";
async function get(slug: string) {
  try {
    return await api<Project>("/public/projects/" + encodeURIComponent(slug));
  } catch (e) {
    if ((e as Error).message === "API 404") notFound();
    throw e;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const project = await get((await params).slug);
  return {
    title: { absolute: project.seo.title },
    description: project.seo.description,
    alternates: { canonical: project.seo.canonical },
    openGraph: {
      title: project.seo.title,
      description: project.seo.description,
      type: "article",
      url: project.seo.canonical,
      publishedTime: project.publishedAt || undefined,
      modifiedTime: project.updatedAt,
      images: project.seo.image
        ? [{ url: project.seo.image, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: project.seo.title,
      description: project.seo.description,
      images: project.seo.image ? [project.seo.image] : undefined,
    },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const project = await get((await params).slug);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: project.title,
    description: project.seo.description,
    image: project.images.map((i) => i.url),
    datePublished: project.publishedAt,
    dateModified: project.updatedAt,
    author: {
      "@type": "Organization",
      name: "Vidrios VECA",
      url: "https://veca.com.pe/",
    },
    publisher: {
      "@type": "Organization",
      name: "Vidrios VECA",
      logo: {
        "@type": "ImageObject",
        url: "https://veca.com.pe/assets/logo.svg",
      },
    },
    mainEntityOfPage: project.seo.canonical,
    inLanguage: "es-PE",
    articleSection: project.category,
    keywords: project.tags.join(", "),
  };
  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <nav className="article-breadcrumb">
          <a href="/proyectos/">← Todos los proyectos</a>
        </nav>
        <ProjectArticle project={project} />
        <section className="project-next section-pad">
          <p className="eyebrow">TU ESPACIO, TU PRÓXIMO PROYECTO</p>
          <h2>
            ¿Imaginamos algo
            <br />
            para ti?
          </h2>
          <a className="button button-orange" href="https://wa.me/51908917621">
            Conversemos por WhatsApp <span>↗</span>
          </a>
        </section>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
