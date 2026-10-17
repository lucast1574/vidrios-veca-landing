import { homeSchema } from "../lib/home-schema";
import Script from "next/script";
import { CATEGORIES } from "@veca/content";
import { legacy } from "../lib/legacy";
import { projects } from "../lib/api";
import { ProjectGrid } from "../components/ProjectGrid";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "https://veca.com.pe/" } };
export default async function Home() {
  const result = await projects({ featured: "true" }).catch(() => null);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div dangerouslySetInnerHTML={{ __html: legacy.header }} />
      <main id="contenido">
        <div dangerouslySetInnerHTML={{ __html: legacy.beforeProjects }} />
        <section className="project-showcase section-pad" id="proyectos">
          <div className="project-showcase-heading">
            <div>
              <p className="eyebrow">
                <span className="section-number">02</span> PROYECTOS VECA
              </p>
              <h2>
                Del primer detalle.
                <br />
                <span>A una nueva perspectiva.</span>
              </h2>
            </div>
            <div>
              <p>
                Descubre cómo el vidrio puede dar forma a distintas maneras de
                construir, habitar y renovar.
              </p>
              <a className="text-link" href="/proyectos/">
                Explorar proyectos <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          {!!result?.items.length && (
            <ProjectGrid items={result.items.slice(0, 6)} />
          )}
          <div className="project-category-strip">
            {CATEGORIES.map((c) => (
              <a key={c.id} href={`/proyectos/categoria/${c.id}/`}>
                <span>{c.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
        <div dangerouslySetInnerHTML={{ __html: legacy.afterProjects }} />
      </main>
      <div dangerouslySetInnerHTML={{ __html: legacy.footer }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <Script src="/legacy.js" strategy="afterInteractive" />
    </>
  );
}
